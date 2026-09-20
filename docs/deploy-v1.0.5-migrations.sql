-- =====================================================================
--  DEPLOY v1.0.5 — chay MOT LAN tren Supabase SQL Editor (production)
--
--  Gom 4 migration theo dung thu tu. Chay TRUOC khi tag/deploy code:
--  ca 4 deu an toan voi code v1.0.4 dang chay (xem chu thich tung phan).
--
--  QUAN TRONG: dung lay chu "Success" lam bang chung. Mot khoi SQL bao
--  Success chi chung minh CAU LENH CUOI da chay (learned 2026-08-19).
--  File nay ket thuc bang mot truy van tu kiem — doc BANG KET QUA do.
-- =====================================================================

begin;


-- =====================================================================
--  20260913120000_admin_stats_exclude_anonymous.sql
-- =====================================================================
-- Số liệu admin phải loại phiên khách khỏi các chỉ số ĐẾM NGƯỜI.
--
-- Từ khi bật anonymous auth, mỗi lần khách bấm "Mở khoá" là một hàng
-- `auth.users` thật, kéo theo một hàng `profiles` thật qua trigger
-- handle_new_user. Không lọc thì:
--   * `total_users` / `new_users_*` / `signups` tăng theo số lượt ghé, không
--     phải số người đăng ký — đường biểu đồ đổi hình ngay ngày lên tính năng
--     và không còn so sánh được trước/sau.
--   * `dau`/`wau` hỏng nặng nhất. Guard `user_id is not null` trong
--     admin_overview_stats tồn tại ĐÚNG để loại khách vãng lai, và anonymous
--     auth vô hiệu hoá nó: mỗi lượt đọc ẩn danh thành một "active user", mà vì
--     mỗi phiên là một uuid mới, một người quay lại N lần đếm thành N user.
--   * `admin_list_users` chiếm chỗ bằng các hàng `email` NULL + `display_name`
--     NULL — `ilike` không bao giờ khớp nên không tìm được, nhưng vẫn chiếm
--     từng trang phân trang và đẩy user thật khỏi trang 1.
--
-- Nhưng KHÔNG loại sạch mọi phiên ẩn danh: một khách ĐÃ TRẢ TIỀN là khách hàng
-- thật, không phải nhiễu. Loại họ khỏi `paying_users` sẽ làm doanh thu (vốn có
-- tính tiền của họ) không còn chia được cho số khách hàng, và tệ hơn: loại họ
-- khỏi `admin_list_users` nghĩa là khi họ gửi email khiếu nại về một khoản
-- thanh toán, admin tra cứu sẽ KHÔNG tìm thấy người đó.
--
-- Nên quy tắc chỉ có một: **tính vào số liệu nếu không phải ẩn danh, HOẶC đã có
-- ít nhất một đơn hàng trả tiền thành công.** Gói trong một view thay vì lặp
-- điều kiện ở 5 chỗ — lặp là cách chắc chắn nhất để chúng trôi khỏi nhau.
--
-- `admin_affiliate_stats` CỐ Ý không đụng tới: nó lọc theo
-- `p.referred_by_code = l.code`, mà phiên ẩn danh không bao giờ có mã đó
-- (signInAnonymously không truyền `ref_click`, và /api/account/claim-affiliate
-- từ chối phiên ẩn danh). Nó vốn đã sạch.

-- Chạy với quyền owner (postgres) như các RPC admin khác để đọc được auth.users.
-- Liệt kê cột tường minh, không dùng p.* — `create or replace view` không đổi
-- được danh sách cột, nên `p.*` biến việc thêm một cột vào profiles thành một
-- lần drop/recreate bắt buộc.
create or replace view public.admin_countable_profiles as
select
  p.id,
  p.display_name,
  p.credits,
  p.created_at,
  p.referred_by_code
from profiles p
join auth.users u on u.id = p.id
where u.is_anonymous = false
   or exists (
     select 1 from orders o where o.user_id = p.id and o.status = 'paid'
   );

-- View chạm schema auth nên phải khoá đúng như các RPC admin: chỉ service_role.
revoke all on public.admin_countable_profiles from public, anon, authenticated;
grant select on public.admin_countable_profiles to service_role;


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
      where tier = 'quick' and created_at >= now() - interval '30 days'),
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


create or replace function public.admin_daily_series(p_days int default 30)
returns table (day date, signups bigint, revenue_vnd bigint, readings bigint)
language sql
security definer
set search_path to 'public'
as $function$
  with bounds as (
    select least(greatest(coalesce(p_days, 30), 1), 365) as n
  ), days as (
    select generate_series(
      (now() at time zone 'Asia/Ho_Chi_Minh')::date - ((select n from bounds) - 1),
      (now() at time zone 'Asia/Ho_Chi_Minh')::date,
      interval '1 day'
    )::date as day
  )
  select
    d.day,
    -- Đường "đăng ký" phải là người đăng ký, không phải lượt ghé đã mở phiên
    -- khách — nếu không thì biểu đồ gãy khúc đúng ngày lên tính năng và không
    -- còn so sánh được với giai đoạn trước.
    (select count(*) from admin_countable_profiles p
      where (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day),
    (select coalesce(sum(o.amount_vnd), 0) from orders o
      where o.status = 'paid'
        and (o.paid_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day),
    (select count(*) from readings r
      where (r.created_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day)
  from days d
  order by d.day;
$function$;

revoke execute on function public.admin_daily_series(int) from public, anon, authenticated;
grant execute on function public.admin_daily_series(int) to service_role;


create or replace function public.admin_list_users(
  p_limit  int  default 50,
  p_offset int  default 0,
  p_search text default null
)
returns table (
  id                uuid,
  email             text,
  display_name      text,
  credits           int,
  created_at        timestamptz,
  last_sign_in_at   timestamptz,
  referred_by_code  text,
  orders_count      bigint,
  readings_count    bigint,
  total_spent_vnd   bigint
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    p.id,
    u.email::text,
    p.display_name,
    p.credits,
    p.created_at,
    u.last_sign_in_at,
    p.referred_by_code,
    (select count(*) from orders o where o.user_id = p.id),
    (select count(*) from readings r where r.user_id = p.id),
    (select coalesce(sum(o.amount_vnd), 0) from orders o
      where o.user_id = p.id and o.status = 'paid')
  -- admin_countable_profiles thay cho profiles: các phiên khách chưa trả tiền
  -- có email NULL và display_name NULL nên `ilike` không bao giờ khớp — không
  -- tìm được nhưng vẫn chiếm chỗ trong phân trang. Khách ĐÃ trả tiền thì vẫn
  -- nằm trong view và vẫn tra cứu được, đó là điều bắt buộc khi họ khiếu nại.
  from admin_countable_profiles p
  join auth.users u on u.id = p.id
  where p_search is null
     or p_search = ''
     or u.email ilike '%' || p_search || '%'
     or p.display_name ilike '%' || p_search || '%'
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

revoke execute on function public.admin_list_users(int, int, text) from public, anon, authenticated;
grant execute on function public.admin_list_users(int, int, text) to service_role;

-- =====================================================================
--  20260913120100_list_abandoned_anonymous_users.sql
-- =====================================================================
-- Liệt kê phiên khách bỏ hoang cho cron dọn dẹp
-- (src/app/api/cron/cleanup-anonymous/route.ts).
--
-- Cần một RPC vì PostgREST không truy vấn thẳng schema `auth` được, còn
-- `is_anonymous` thì chỉ tồn tại ở `auth.users` chứ không có trong `profiles`.
-- SECURITY DEFINER chạy với quyền owner (postgres) nên đọc được auth.users,
-- giống hệt cách admin_list_users đang làm.
--
-- Hàm này CHỈ ĐỌC. Việc xoá cố ý để cho Admin API
-- (`auth.admin.deleteUser`) làm từng hàng một, không gộp thành một câu
-- `delete from auth.users` trong SQL: GoTrue còn giữ dữ liệu phiên liên quan
-- (sessions, refresh_tokens, identities) mà xoá thẳng ở tầng bảng có thể bỏ
-- sót, và một hàm xoá hàng loạt tồn tại sẵn trong DB là một thứ nguy hiểm
-- không cần thiết phải có.
create or replace function public.list_abandoned_anonymous_users(
  p_cutoff timestamptz,
  p_limit  int default 200
)
returns table (id uuid)
language sql
security definer
set search_path to 'public'
as $function$
  select u.id
  from auth.users u
  where u.is_anonymous = true
    and u.created_at < p_cutoff
    -- Đã từng tạo đơn hàng thì KHÔNG phải rác, kể cả đơn chưa thanh toán:
    -- đó là người đã đi vào đường tiền, và nếu có tranh chấp thì đây là hàng
    -- duy nhất lần ngược ra được họ. `on delete restrict` trên orders cũng sẽ
    -- tự chặn ở tầng Postgres — điều kiện này chỉ để cron không đâm vào hàng
    -- rào đó hàng trăm lần mỗi đêm rồi sinh ra hàng trăm lỗi FK trong log.
    and not exists (
      select 1 from orders o where o.user_id = u.id
    )
    and not exists (
      select 1 from credit_ledger cl where cl.user_id = u.id
    )
  order by u.created_at
  limit least(greatest(coalesce(p_limit, 200), 1), 1000);
$function$;

revoke execute on function public.list_abandoned_anonymous_users(timestamptz, int)
  from public, anon, authenticated;
grant execute on function public.list_abandoned_anonymous_users(timestamptz, int)
  to service_role;

-- =====================================================================
--  20260920000000_regrant_debit_refund_to_service_role.sql
-- =====================================================================
-- Cấp lại EXECUTE trên debit_reading/refund_reading cho service_role.
--
-- `20260908000001_debit_refund_reading_race_safe.sql` dòng 18-19 dùng
-- `drop function if exists` rồi tạo lại hai hàm này. DROP FUNCTION xoá sạch
-- mọi grant của hàm đó — kể cả `grant execute ... to service_role` đã cấp từ
-- `20260809000003_credit_functions.sql:116`. Migration ấy chỉ `revoke all ...
-- from public` sau khi tạo lại, không cấp lại gì cho service_role.
--
-- Vì sao production vẫn chạy được tới giờ: project Supabase hosted đặt
-- `alter default privileges in schema public grant all on functions to
-- postgres, anon, authenticated, service_role`, nên hàm vừa tạo tự có quyền.
-- Chính đặc điểm đó là lý do `20260908000002` phải tồn tại để REVOKE khỏi
-- anon/authenticated — một lỗ bảo mật do default privileges mở ra.
--
-- Nói cách khác: đường trừ credits của production đang sống nhờ một mặc định
-- ngầm của nền tảng, không phải nhờ điều gì viết trong repo này. Chỗ nào không
-- có mặc định đó thì gãy — và `supabase start` ở máy dev CHÍNH LÀ chỗ đó
-- (`\ddp` cho thấy default privileges cho function chỉ có `postgres=X/postgres`).
-- Triệu chứng: mọi lượt Đọc sâu trả `debit_failed`, UI hiện "Không thể trừ
-- Credits lúc này".
--
-- Migration này làm quyền đó thành tường minh. Idempotent: trên production nó
-- cấp lại đúng thứ đã có, không đổi hành vi. Trên môi trường mới thì nó là thứ
-- duy nhất làm cho đường tiền chạy được.
--
-- KHÔNG cấp cho anon/authenticated — hai role đó phải luôn bị chặn, xem
-- 20260908000002: có quyền là tự gọi /rest/v1/rpc/debit_reading với
-- p_user_id tuỳ ý.

grant execute on function public.debit_reading(uuid, uuid, integer) to service_role;
grant execute on function public.refund_reading(uuid) to service_role;

-- Chốt lại lần nữa cho chắc — `revoke` là idempotent và đây là đường tiền.
revoke all on function public.debit_reading(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_reading(uuid) from public, anon, authenticated;

-- =====================================================================
--  20260920000100_credit_order_khong_mat_tien_vi_so_sach.sql
-- =====================================================================
-- credit_order: không để trạng thái nội bộ làm khách mất tiền.
--
-- VẤN ĐỀ
-- Bản cũ chỉ cộng credits khi đơn đang `pending`. Mọi trạng thái khác trả
-- 'not_pending' và webhook coi đó là "no-op an toàn". Nhưng tới được nhánh đó
-- nghĩa là PayOS đã xác nhận `code = "00"` — giao dịch THÀNH CÔNG. Khách đã
-- chuyển tiền và không nhận được gì, im lặng.
--
-- Đường đi có thật: khách trả tiền lúc 23:50 UTC (đơn hết hạn 23:58), webhook
-- gặp lúc site đang deploy nên nhận 500, PayOS retry theo backoff, cron
-- expire-orders chạy 00:00 đánh đơn thành 'expired', webhook về lúc 00:05 thì
-- đơn không còn 'pending'.
--
-- NGUYÊN TẮC
-- Xác nhận của PayOS là sự thật về tiền; `status` là sổ sách của mình. Chỉ có
-- hai lý do chính đáng để từ chối một webhook đã verify chữ ký:
--   * đã cộng rồi  -> 'already_paid' (bảo đảm idempotent, PayOS gọi lại nhiều lần)
--   * số tiền lệch -> 'amount_mismatch' (chống sửa số tiền)
-- 'expired' / 'failed' / 'cancelled' là trạng thái nội bộ, không phải lý do
-- giữ tiền của khách.
--
-- VÌ SAO AN TOÀN
--   * Không mở đường replay: webhook phải qua PayOS webhooks.verify(), không
--     giả chữ ký được, và 'already_paid' chặn cộng đôi.
--   * Không mở đường đổi giá: amount_vnd nằm trên chính dòng đơn, so khớp
--     trước khi cộng.
--   * `for update` giữ nguyên nên hai webhook song song vẫn tuần tự hoá.
--
-- TRẢ VỀ
-- Thêm 'credited_late' để phân biệt với 'credited': tiền vẫn vào đúng, nhưng
-- đơn đã lệch khỏi luồng bình thường và đáng được nhìn thấy trên Sentry. Nếu
-- con số này tăng, nguyên nhân gốc (webhook trễ, PayOS lỗi tạo link) mới là
-- thứ cần sửa — migration này chỉ chặn hậu quả rơi lên đầu khách.

create or replace function public.credit_order(p_order_code bigint, p_amount integer)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order   orders%rowtype;
  v_balance int;
  v_late    boolean;
begin
  select * into v_order from orders where payos_order_code = p_order_code for update;
  if not found then return 'not_found'; end if;

  -- Idempotent: PayOS gọi lại cùng một giao dịch cho tới khi nhận 200.
  if v_order.status = 'paid' then return 'already_paid'; end if;

  -- Chống sửa số tiền — kiểm TRƯỚC khi đụng tới bất cứ thứ gì.
  if v_order.amount_vnd <> p_amount then return 'amount_mismatch'; end if;

  v_late := v_order.status <> 'pending';

  update orders set status = 'paid', paid_at = now() where id = v_order.id;
  update profiles set credits = credits + v_order.credits_purchased, updated_at = now()
    where id = v_order.user_id returning credits into v_balance;
  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
    values (v_order.user_id, v_order.credits_purchased, v_balance, 'purchase', v_order.id);

  if v_late then return 'credited_late'; end if;
  return 'credited';
end;
$function$;

-- `create or replace` giữ nguyên grant, nhưng nêu lại tường minh: đây là hàm
-- cộng tiền, và repo này đã có một lần mất grant vì `drop function` (xem
-- 20260920000000_regrant_debit_refund_to_service_role.sql).
revoke all on function public.credit_order(bigint, integer) from public, anon, authenticated;
grant execute on function public.credit_order(bigint, integer) to service_role;

commit;

-- =====================================================================
--  TU KIEM — moi dong phai la PASS. Co bat ky FAIL nao thi ROLLBACK
--  chua xay ra (commit o tren da chay), bao lai ngay truoc khi deploy.
-- =====================================================================
with chk as (
  select 'credit_order tra duoc credited_late' as muc,
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'credit_order'
            and pg_get_functiondef(p.oid) like '%credited_late%') = 1 as dat
  union all
  select 'debit_reading co execute cho service_role',
         exists (select 1 from information_schema.routine_privileges
                 where specific_schema='public' and routine_name='debit_reading'
                   and grantee='service_role')
  union all
  select 'refund_reading co execute cho service_role',
         exists (select 1 from information_schema.routine_privileges
                 where specific_schema='public' and routine_name='refund_reading'
                   and grantee='service_role')
  union all
  select 'credit_order co execute cho service_role',
         exists (select 1 from information_schema.routine_privileges
                 where specific_schema='public' and routine_name='credit_order'
                   and grantee='service_role')
  union all
  select 'KHONG role cong khai nao goi duoc ham tien',
         not exists (select 1 from information_schema.routine_privileges
                     where specific_schema='public'
                       and routine_name in ('credit_order','debit_reading','refund_reading')
                       and grantee in ('PUBLIC','anon','authenticated'))
  union all
  select 'view admin_countable_profiles ton tai',
         exists (select 1 from information_schema.views
                 where table_schema='public' and table_name='admin_countable_profiles')
  union all
  select 'view admin chi service_role doc duoc',
         not exists (select 1 from information_schema.role_table_grants
                     where table_name='admin_countable_profiles'
                       and grantee in ('PUBLIC','anon','authenticated'))
  union all
  select 'list_abandoned_anonymous_users ton tai',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname='public' and p.proname='list_abandoned_anonymous_users')
  union all
  select 'admin_overview_stats dung view moi',
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname='public' and p.proname='admin_overview_stats'
            and pg_get_functiondef(p.oid) like '%admin_countable_profiles%') = 1
)
select case when dat then 'PASS' else '*** FAIL ***' end as ket_qua, muc from chk order by dat, muc;
