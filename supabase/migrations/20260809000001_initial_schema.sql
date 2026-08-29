-- Giai đoạn 3 — Initial schema: 6 bảng + trigger tạo profile tự động.
-- Nguồn: Research/plan/04-database-schema.md §2.
-- Không seed base_content ở đây — 780 dòng là Giai đoạn 4 (Batch API).

-- ============================================================
-- 2.1 profiles
-- ============================================================
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  credits      int not null default 0 check (credits >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tạo profile tự động khi có user mới (Google OAuth hoặc magic link).
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 2.2 base_content — Lớp Nền sinh sẵn
-- ============================================================
create table base_content (
  id          uuid primary key default gen_random_uuid(),
  card_id     text not null,                 -- khớp id trong data/cards.json
  orientation text not null check (orientation in ('upright', 'reversed')),
  topic       text not null check (topic in
                ('love','career','money','mind','general')),
  body        text not null,                 -- nội dung diễn giải nền
  summary     text not null,                 -- 1 câu tóm tắt, dùng cho card preview
  keywords    text[] not null default '{}',  -- truyền vào Lớp Cá nhân
  model       text not null,                 -- model đã sinh, để truy vết
  generated_at timestamptz not null default now(),
  version     int not null default 1         -- tăng khi sinh lại nội dung
);

-- BẮT BUỘC: không có index này thì lookup là full-scan và bản trùng sẽ tích tụ
create unique index base_content_lookup
  on base_content (card_id, orientation, topic);

-- ============================================================
-- 2.3 readings — lịch sử trải bài
-- ============================================================
create table readings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade,  -- null = khách vãng lai
  topic         text not null,
  spread        text not null check (spread in ('one_card', 'three_card')),
  tier          text not null check (tier in ('quick', 'deep')),
  cards_drawn   jsonb not null,   -- [{card_id, orientation, position}]
  question      text,             -- câu hỏi user, null nếu không nhập
  personal_body text,             -- Lớp Cá nhân; null với tier='quick'
  model         text,             -- model đã dùng cho Lớp Cá nhân
  input_tokens  int,              -- để đối soát chi phí thật
  output_tokens int,
  created_at    timestamptz not null default now()
);

-- Trang lịch sử: lấy trải bài của tôi, mới nhất trước
create index readings_user_recent on readings (user_id, created_at desc);

-- Phân tích: lá nào hay ra, chủ đề nào phổ biến
create index readings_topic_created on readings (topic, created_at desc);

-- ============================================================
-- 2.4 orders — đơn thanh toán
-- ============================================================
create table orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete restrict,
  amount_vnd        int not null check (amount_vnd > 0),
  credits_purchased int not null check (credits_purchased > 0),
  status            text not null default 'pending'
                    check (status in ('pending','paid','failed','expired','cancelled')),
  payos_order_code  bigint not null,      -- PayOS yêu cầu số nguyên
  paid_at           timestamptz,
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now()
);

-- Chống trùng: mỗi mã đơn PayOS chỉ tồn tại một lần
create unique index orders_payos_code on orders (payos_order_code);

create index orders_user_recent on orders (user_id, created_at desc);

-- Cron dọn đơn hết hạn
create index orders_pending_expiry on orders (expires_at) where status = 'pending';

-- ============================================================
-- 2.5 credit_ledger — sổ cái. Mọi thay đổi credits đều phải đi qua đây.
-- ============================================================
create table credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete restrict,
  delta      int  not null check (delta <> 0),   -- dương = cộng, âm = trừ
  balance_after int not null,                    -- số dư sau giao dịch, để đối soát
  reason     text not null check (reason in
               ('purchase','reading','refund','bonus','admin_adjust')),
  ref_id     uuid,                               -- order_id hoặc reading_id
  note       text,
  created_at timestamptz not null default now()
);

-- Chống cộng/trừ 2 lần cho cùng một sự kiện — cơ chế chống trùng chính.
create unique index credit_ledger_idem
  on credit_ledger (reason, ref_id)
  where ref_id is not null;

create index credit_ledger_user_recent on credit_ledger (user_id, created_at desc);

-- ============================================================
-- 2.6 rate_limits — Phase 1, bảng Postgres thuần, không cần dependency mới
-- ============================================================
create table rate_limits (
  key        text not null,          -- 'ip:1.2.3.4' hoặc 'user:<uuid>'
  window_start timestamptz not null,
  count      int not null default 1,
  primary key (key, window_start)
);

create index rate_limits_cleanup on rate_limits (window_start);
