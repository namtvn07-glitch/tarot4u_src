-- Giai đoạn 3 — 4 Postgres function cho luồng credits, mỗi function atomic
-- trong 1 transaction ngầm của PL/pgSQL, tất cả ghi credit_ledger cùng lúc
-- với thay đổi profiles.credits. Nguồn: implementation-plan.md.

-- Cộng credits khi đơn PayOS được xác nhận thanh toán.
-- Idempotent 2 lớp: (1) UPDATE ... where status='pending' chỉ khớp lần gọi đầu,
-- Postgres khoá row nên 2 lệnh gọi đồng thời cho cùng order sẽ tuần tự hoá;
-- (2) unique index credit_ledger_idem (reason, ref_id) là lưới an toàn thứ hai.
create function credit_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_credits int;
  v_balance int;
begin
  update orders
    set status = 'paid', paid_at = now()
    where id = p_order_id and status = 'pending'
    returning user_id, credits_purchased into v_user_id, v_credits;

  if not found then
    return; -- đơn không tồn tại hoặc đã xử lý — no-op an toàn
  end if;

  update profiles
    set credits = credits + v_credits, updated_at = now()
    where id = v_user_id
    returning credits into v_balance;

  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
  values (v_user_id, v_credits, v_balance, 'purchase', p_order_id);
end;
$$;

-- Trừ credits khi bắt đầu một lượt Đọc sâu. p_reading_id do server sinh
-- TRƯỚC khi gọi Claude, dùng lại cho refund_reading nếu lỗi.
create function debit_reading(p_user_id uuid, p_reading_id uuid, p_cost int default 1)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_balance int;
begin
  if exists (select 1 from credit_ledger where reason = 'reading' and ref_id = p_reading_id) then
    return; -- đã trừ cho reading này rồi — idempotent
  end if;

  update profiles
    set credits = credits - p_cost, updated_at = now()
    where id = p_user_id and credits >= p_cost
    returning credits into v_balance;

  if not found then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
  values (p_user_id, -p_cost, v_balance, 'reading', p_reading_id);
end;
$$;

-- Hoàn credits khi Claude lỗi/refusal sau khi đã debit_reading.
create function refund_reading(p_reading_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_cost int;
  v_balance int;
begin
  select user_id, -delta into v_user_id, v_cost
    from credit_ledger where reason = 'reading' and ref_id = p_reading_id;

  if not found then
    return; -- chưa từng bị trừ (vd tier='quick') — không có gì hoàn
  end if;

  if exists (select 1 from credit_ledger where reason = 'refund' and ref_id = p_reading_id) then
    return; -- đã hoàn rồi — idempotent
  end if;

  update profiles
    set credits = credits + v_cost, updated_at = now()
    where id = v_user_id
    returning credits into v_balance;

  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
  values (v_user_id, v_cost, v_balance, 'refund', p_reading_id);
end;
$$;

-- Fixed-window rate limit trên bảng Postgres (Phase 1 — xem 06-bao-mat...md §2.4).
-- p_key vd 'ip:1.2.3.4' hoặc 'user:<uuid>'. Trả true = cho phép.
create function check_rate_limit(p_key text, p_window_seconds int, p_max_count int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_window_start timestamptz;
  v_count int;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into rate_limits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_max_count;
end;
$$;

revoke execute on function credit_order(uuid) from public;
revoke execute on function debit_reading(uuid, uuid, int) from public;
revoke execute on function refund_reading(uuid) from public;
revoke execute on function check_rate_limit(text, int, int) from public;

grant execute on function credit_order(uuid) to service_role;
grant execute on function debit_reading(uuid, uuid, int) to service_role;
grant execute on function refund_reading(uuid) to service_role;
grant execute on function check_rate_limit(text, int, int) to service_role;

-- Giới hạn đã biết: debit_reading giả định p_reading_id do server sinh một
-- lần cho mỗi lượt (không phải client tự chọn) — nếu 2 request thật sự đồng
-- thời dùng cùng reading_id trước khi dòng ledger đầu tiên commit, có race lý
-- thuyết. Chấp nhận được vì reading_id sinh mới mỗi request ở GĐ4, không
-- phải giá trị client kiểm soát. Ghi vào docs/learned/ nếu sau này phát hiện
-- race thật.
