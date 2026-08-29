-- Giai đoạn 3 — RLS + policies + guard chống client tự sửa profiles.credits.
-- Nguồn: Research/plan/04-database-schema.md §3. Bật RLS là gate, không phải
-- tùy chọn — mọi bảng có dữ liệu người dùng phải bật.

alter table profiles      enable row level security;
alter table readings      enable row level security;
alter table orders        enable row level security;
alter table credit_ledger enable row level security;
alter table base_content  enable row level security;
alter table rate_limits   enable row level security;

-- profiles: user đọc/sửa hồ sơ của chính mình.
-- KHÔNG cho update cột credits (xem trigger chặn ở dưới).
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- readings: chỉ đọc trải bài của mình
create policy readings_select_own on readings
  for select using (auth.uid() = user_id);

-- orders: chỉ đọc đơn của mình. KHÔNG có policy insert/update
-- → client không tự tạo/sửa đơn được, mọi thứ đi qua service role
create policy orders_select_own on orders
  for select using (auth.uid() = user_id);

-- credit_ledger: chỉ đọc. Ghi luôn qua service role.
create policy ledger_select_own on credit_ledger
  for select using (auth.uid() = user_id);

-- base_content: ai cũng đọc được (nội dung công khai), không ai ghi qua client
create policy base_content_read_all on base_content
  for select using (true);

-- rate_limits: cố ý không có policy nào → client không truy cập được dù đã
-- bật RLS ở trên (mặc định deny-all khi RLS bật và không có policy khớp).

-- ============================================================
-- Chặn client tự sửa credits
-- ============================================================
-- RLS policy profiles_update_own cho phép update, mà credits nằm trong cùng
-- bảng — không có trigger này, user tự set credits = 99999 được. Đây là lỗ
-- hổng dễ bỏ sót nhất trong Supabase.
create function guard_credits_column() returns trigger
language plpgsql as $$
begin
  -- service role bỏ qua kiểm tra này
  if current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' then
    return new;
  end if;
  if new.credits is distinct from old.credits then
    raise exception 'credits chỉ được thay đổi server-side';
  end if;
  return new;
end $$;

create trigger profiles_guard_credits
  before update on profiles
  for each row execute function guard_credits_column();
