-- Daily Reading (Trải bài 1 lá — "Thông điệp vũ trụ ngày hôm nay").
-- Kế hoạch: .claude/brain/trai-bai-4-loai-giai-doan-1/implementation-plan.md
--
-- Gồm: tier 'daily' + cột kết quả có cấu trúc cho readings; kho nội dung Daily
-- sinh sẵn (daily_content); sổ lượt rút theo ngày (daily_draws) với hai RPC
-- atomic claim/release; cập nhật RPC thống kê admin để đếm tier 'daily'.
--
-- Mọi hàm tiền ở đây: revoke khỏi public/anon/authenticated và grant service_role
-- TƯỜNG MINH ngay trong migration (bài học 2026-08-19, 2026-09-20 — đừng dựa vào
-- default privileges của Supabase hosted). KHÔNG `drop function` hàm tiền.

-- ============================================================
-- 1. readings: tier 'daily', daily_date, result
-- ============================================================
-- Tên constraint do Postgres tự đặt cho check inline nên không đoán — tìm theo
-- định nghĩa. Chỉ nhắm các check có nhắc tới cột `tier`.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.readings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tier%'
  loop
    execute format('alter table public.readings drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.readings
  add constraint readings_tier_check check (tier in ('quick', 'deep', 'daily'));

-- Ngày (giờ Việt Nam) của lượt Daily — null với mọi tier khác.
alter table public.readings add column if not exists daily_date date;

-- Kết quả có cấu trúc (JSON của prompt). `personal_body` vẫn được ghi một bản
-- chữ rút gọn làm dự phòng cho nơi hiển thị chưa đọc `result`.
alter table public.readings add column if not exists result jsonb;

create index if not exists readings_user_daily
  on public.readings (user_id, daily_date)
  where daily_date is not null;

-- ============================================================
-- 2. daily_content — nội dung Daily sinh sẵn
-- ============================================================
create table if not exists public.daily_content (
  id           uuid primary key default gen_random_uuid(),
  card_id      text not null,
  orientation  text not null check (orientation in ('upright', 'reversed')),
  variant      smallint not null check (variant between 1 and 9),
  version      int not null default 1,
  -- draft: mới import, chưa duyệt. approved: API được phép chọn. retired: bỏ.
  status       text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  content      jsonb not null,
  model        text not null,
  generated_at timestamptz not null default now()
);

create unique index if not exists daily_content_lookup
  on public.daily_content (card_id, orientation, variant, version);

-- Cố ý KHÔNG có policy nào: client không đọc/ghi trực tiếp (RLS bật = deny-all),
-- chỉ service role (route Daily) truy cập — người dùng chỉ nhận đúng một bản đã chọn.
alter table public.daily_content enable row level security;

-- ============================================================
-- 3. daily_draws — sổ lượt rút Daily
-- ============================================================
-- Mỗi lượt rút là một dòng, ghi NGUYÊN TỬ lúc claim (trước khi sinh nội dung):
--   - đếm lượt/ngày để chặn trần,
--   - khoá "1 lượt free/ngày" bằng unique index một phần,
--   - chống bấm đúp bằng unique (user_id, draw_id).
create table if not exists public.daily_draws (
  reading_id uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  -- Khoá idempotency do client sinh cho mỗi ý định "rút một lá".
  draw_id    uuid not null,
  day        date not null,
  kind       text not null check (kind in ('free', 'paid')),
  created_at timestamptz not null default now(),
  unique (user_id, draw_id)
);

create unique index if not exists daily_draws_one_free_per_day
  on public.daily_draws (user_id, day)
  where kind = 'free';

create index if not exists daily_draws_user_day
  on public.daily_draws (user_id, day);

alter table public.daily_draws enable row level security;

create policy daily_draws_select_own on public.daily_draws
  for select using (auth.uid() = user_id);

-- ============================================================
-- 4. claim_daily_draw / release_daily_draw
-- ============================================================
-- Trả jsonb { kind: 'free' | 'paid' | 'replay', reading_id, day }.
--   free   — lượt miễn phí đầu tiên trong ngày
--   paid   — đã trừ p_cost credits (qua debit_reading, idempotent theo reading_id)
--   replay — draw_id này đã được claim trước đó (bấm đúp / gửi lại): trả đúng
--            reading_id cũ, KHÔNG trừ thêm, KHÔNG tính thêm lượt
-- Raise: 'daily_limit_reached' khi chạm trần p_max_draws; 'insufficient_credits'
-- (từ debit_reading) khi hết credits — cả hai rollback toàn bộ.
create or replace function public.claim_daily_draw(
  p_user_id   uuid,
  p_draw_id   uuid,
  p_max_draws integer,
  p_cost      integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_day        date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_existing   record;
  v_count      integer;
  v_reading_id uuid := gen_random_uuid();
begin
  -- Tuần tự hoá mọi claim của cùng một user: đếm trần + chọn free/paid phải
  -- nhất quán khi có hai request đồng thời.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select reading_id, kind, day into v_existing
    from daily_draws
    where user_id = p_user_id and draw_id = p_draw_id;
  if found then
    return jsonb_build_object('kind', 'replay', 'reading_id', v_existing.reading_id, 'day', v_existing.day);
  end if;

  select count(*) into v_count from daily_draws where user_id = p_user_id and day = v_day;
  if v_count >= p_max_draws then
    raise exception 'daily_limit_reached' using errcode = 'P0001';
  end if;

  if not exists (select 1 from daily_draws where user_id = p_user_id and day = v_day and kind = 'free') then
    insert into daily_draws (reading_id, user_id, draw_id, day, kind)
      values (v_reading_id, p_user_id, p_draw_id, v_day, 'free');
    return jsonb_build_object('kind', 'free', 'reading_id', v_reading_id, 'day', v_day);
  end if;

  -- debit_reading ném 'insufficient_credits' khi thiếu; trả false nếu reading_id
  -- này đã có dòng trừ tiền (không thể xảy ra với uuid vừa sinh, giữ cho chắc).
  if not public.debit_reading(p_user_id, v_reading_id, p_cost) then
    raise exception 'daily_debit_conflict' using errcode = 'P0001';
  end if;
  insert into daily_draws (reading_id, user_id, draw_id, day, kind)
    values (v_reading_id, p_user_id, p_draw_id, v_day, 'paid');
  return jsonb_build_object('kind', 'paid', 'reading_id', v_reading_id, 'day', v_day);
end;
$$;

-- Nhả lượt khi việc sinh/ghi kết quả lỗi: xoá dòng sổ (lượt free dùng lại được)
-- và hoàn credits nếu là lượt trả phí. Idempotent.
create or replace function public.release_daily_draw(p_reading_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_kind text;
begin
  delete from daily_draws where reading_id = p_reading_id returning kind into v_kind;
  if not found then
    return false;
  end if;
  if v_kind = 'paid' then
    perform public.refund_reading(p_reading_id);
  end if;
  return true;
end;
$$;

revoke all on function public.claim_daily_draw(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.release_daily_draw(uuid) from public, anon, authenticated;
grant execute on function public.claim_daily_draw(uuid, uuid, integer, integer) to service_role;
grant execute on function public.release_daily_draw(uuid) to service_role;

-- ============================================================
-- 5. admin_overview_stats — đếm cả tier 'daily' vào cột "nhanh"
-- ============================================================
-- Cột readings_quick_30d giữ tên cũ để không đổi hợp đồng với /admin; nay nó là
-- "lượt miễn phí/nhanh" = tier 'quick' (dữ liệu cũ) + 'daily'.

create or replace function public.admin_overview_stats()
returns table (
  total_users           bigint,
  new_users_7d          bigint,
  new_users_30d         bigint,
  dau                   bigint,
  wau                   bigint,
  total_revenue_vnd     bigint,
  revenue_7d_vnd        bigint,
  revenue_30d_vnd       bigint,
  paying_users          bigint,
  outstanding_credits   bigint,
  orders_created_30d    bigint,
  orders_paid_30d       bigint,
  orders_expired_30d    bigint,
  readings_total        bigint,
  readings_quick_30d    bigint,
  readings_deep_30d     bigint,
  ai_tokens_by_model    jsonb
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    (select count(*) from admin_countable_profiles),
    (select count(*) from admin_countable_profiles
      where created_at >= now() - interval '7 days'),
    (select count(*) from admin_countable_profiles
      where created_at >= now() - interval '30 days'),

    -- readings.user_id nullable (có luồng đọc ẩn danh) => phải loại null,
    -- không thì count(distinct) đếm cả khách vãng lai thành 1 "user".
    -- Và từ khi có anonymous auth, "không null" thôi chưa đủ: phiên khách CÓ
    -- user_id. Join sang admin_countable_profiles để chỉ đếm người thật.
    (select count(distinct r.user_id) from readings r
      join admin_countable_profiles p on p.id = r.user_id
      where (r.created_at at time zone 'Asia/Ho_Chi_Minh')::date
          = (now() at time zone 'Asia/Ho_Chi_Minh')::date),
    (select count(distinct r.user_id) from readings r
      join admin_countable_profiles p on p.id = r.user_id
      where r.created_at >= now() - interval '7 days'),

    -- Doanh thu tính theo paid_at = tiền THỰC NHẬN trong cửa sổ.
    -- KHÔNG lọc ẩn danh ở đây: tiền khách trả là tiền thật, bỏ nó ra khỏi
    -- doanh thu là báo cáo sai về phía dưới.
    (select coalesce(sum(amount_vnd), 0) from orders where status = 'paid'),
    (select coalesce(sum(amount_vnd), 0) from orders
      where status = 'paid' and paid_at >= now() - interval '7 days'),
    (select coalesce(sum(amount_vnd), 0) from orders
      where status = 'paid' and paid_at >= now() - interval '30 days'),
    -- Ai đã trả tiền thì luôn nằm trong admin_countable_profiles theo định
    -- nghĩa của view, nên con số này khớp với doanh thu ở trên.
    (select count(distinct user_id) from orders where status = 'paid'),

    -- Nợ dịch vụ: credits user đã mua nhưng chưa tiêu. Tính cả khách đã trả
    -- tiền — đó là nghĩa vụ có thật, không phụ thuộc họ có tài khoản hay chưa.
    (select coalesce(sum(credits), 0) from profiles),

    -- Phễu thanh toán theo CÙNG MỘT NHÓM đơn (đơn tạo trong 30 ngày), nên 3 số
    -- này so sánh được với nhau — khác với doanh thu ở trên tính theo paid_at.
    (select count(*) from orders where created_at >= now() - interval '30 days'),
    (select count(*) from orders
      where created_at >= now() - interval '30 days' and status = 'paid'),
    (select count(*) from orders
      where created_at >= now() - interval '30 days' and status = 'expired'),

    (select count(*) from readings),
    (select count(*) from readings
      where tier in ('quick', 'daily') and created_at >= now() - interval '30 days'),
    (select count(*) from readings
      where tier = 'deep' and created_at >= now() - interval '30 days'),

    -- Gộp theo MODEL (không phải provider) vì bảng giá token tính theo model.
    (select coalesce(
        jsonb_object_agg(m, jsonb_build_object('input', inp, 'output', outp)),
        '{}'::jsonb)
      from (
        select coalesce(model, 'unknown') as m,
               coalesce(sum(input_tokens), 0)  as inp,
               coalesce(sum(output_tokens), 0) as outp
        from readings
        where created_at >= now() - interval '30 days'
          and (input_tokens is not null or output_tokens is not null)
        group by coalesce(model, 'unknown')
      ) t);
$function$;

revoke execute on function public.admin_overview_stats() from public, anon, authenticated;
grant execute on function public.admin_overview_stats() to service_role;
