-- Giai đoạn Affiliate Tracking — schema nền.
--
-- ⚠️ LỊCH SỬ: bản đầu của migration này có policy cho anon INSERT vào
-- affiliate_clicks. Đó là một lỗ hổng (anon key nằm công khai trong bundle
-- browser => ai cũng bơm được click rác / ghi vô hạn vào Postgres). File này
-- giữ nguyên hiện trạng đã áp lên remote để lịch sử migration khớp thực tế;
-- việc vá nằm ở migration kế tiếp (affiliate_security_hardening).
create table affiliate_links (
  code       text primary key check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  label      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(user_id)
);
alter table affiliate_links enable row level security;
-- Cố ý không có policy nào — RLS bật + không policy = default deny cho
-- anon/authenticated (đúng pattern rate_limits đang dùng). Chỉ service_role
-- (bypass RLS) đọc/ghi, qua trang /admin/affiliate.

create table affiliate_clicks (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,        -- không FK: vẫn muốn log click cho mã sai/hết hạn
  ip_hash    text,                 -- băm, không bao giờ lưu IP thô
  created_at timestamptz not null default now()
);
create index affiliate_clicks_code_created on affiliate_clicks (code, created_at desc);
alter table affiliate_clicks enable row level security;
create policy affiliate_clicks_insert_anon on affiliate_clicks
  for insert
  to anon, authenticated
  with check (true);

alter table profiles
  add column referred_by_code text references affiliate_links(code) on delete set null;
