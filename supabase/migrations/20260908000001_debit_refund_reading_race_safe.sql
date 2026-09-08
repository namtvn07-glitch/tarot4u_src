-- debit_reading()/refund_reading() trước đây check-rồi-insert (TOCTOU): 2
-- request cùng ref_id đến đúng lúc đều có thể lọt qua bước "if exists"
-- (chưa ai insert xong) rồi cùng update profiles.credits — DB đã có sẵn
-- unique index credit_ledger_idem (reason, ref_id) nên lần insert thứ 2 sẽ
-- lỗi, nhưng lỗi đó trước đây KHÔNG được bắt — bubble lên thành exception
-- thô, và quan trọng hơn: personal/route.ts không có cách nào phân biệt
-- "vừa debit thật" với "debit hộ, đã có người debit rồi" để biết dừng lại
-- trước khi gọi AI/ghi readings — dẫn tới tốn API cost oan dù tiền vẫn an
-- toàn nhờ unique index.
--
-- Đổi RETURNS void -> RETURNS boolean: true = vừa debit/refund thật,
-- false = race thật xảy ra, đã có request khác xử lý ref_id này rồi (rollback
-- lại phần credits vừa cộng/trừ trong cùng transaction, an toàn tuyệt đối).
-- Caller (personal/route.ts) dừng ngay khi nhận false, không tiếp tục gọi AI.

-- Đổi return type (void -> boolean) — Postgres không cho CREATE OR REPLACE
-- đổi kiểu trả về của function đã tồn tại, phải drop trước.
drop function if exists public.debit_reading(uuid, uuid, integer);
drop function if exists public.refund_reading(uuid);

create function public.debit_reading(p_user_id uuid, p_reading_id uuid, p_cost integer default 1)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_balance int;
begin
  update profiles
    set credits = credits - p_cost, updated_at = now()
    where id = p_user_id and credits >= p_cost
    returning credits into v_balance;

  if not found then
    if exists (select 1 from credit_ledger where reason = 'reading' and ref_id = p_reading_id) then
      return false; -- đã có request khác debit cho reading này rồi
    end if;
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  begin
    insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
    values (p_user_id, -p_cost, v_balance, 'reading', p_reading_id);
  exception when unique_violation then
    -- Race thật: request khác đã insert xong giữa lúc mình update xong và
    -- insert. Hoàn lại đúng phần vừa trừ, coi như chưa từng debit.
    update profiles set credits = credits + p_cost, updated_at = now() where id = p_user_id;
    return false;
  end;

  return true;
end;
$$;

create function public.refund_reading(p_reading_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid;
  v_cost int;
  v_balance int;
begin
  select user_id, -delta into v_user_id, v_cost
    from credit_ledger where reason = 'reading' and ref_id = p_reading_id;

  if not found then
    return false; -- chưa từng bị trừ (vd tier='quick') — không có gì hoàn
  end if;

  if exists (select 1 from credit_ledger where reason = 'refund' and ref_id = p_reading_id) then
    return false; -- đã hoàn rồi
  end if;

  update profiles
    set credits = credits + v_cost, updated_at = now()
    where id = v_user_id
    returning credits into v_balance;

  begin
    insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
    values (v_user_id, v_cost, v_balance, 'refund', p_reading_id);
  exception when unique_violation then
    update profiles set credits = credits - v_cost, updated_at = now() where id = v_user_id;
    return false;
  end;

  return true;
end;
$$;

revoke all on function public.debit_reading(uuid, uuid, integer) from public;
revoke all on function public.refund_reading(uuid) from public;
