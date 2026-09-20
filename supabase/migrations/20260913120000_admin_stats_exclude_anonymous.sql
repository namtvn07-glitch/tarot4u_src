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
