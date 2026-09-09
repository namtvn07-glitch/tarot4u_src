-- Số liệu tổng quan cho /admin. Chỉ service_role gọi được (trang admin dùng
-- getSupabaseAdmin() sau khi đã qua cổng requireAdmin()).
--
-- Mốc "hôm nay" tính theo Asia/Ho_Chi_Minh: server chạy UTC, lệch 7 tiếng —
-- nếu để UTC thì "DAU hôm nay" sai hẳn một phần ba ngày.
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
    (select count(*) from profiles),
    (select count(*) from profiles where created_at >= now() - interval '7 days'),
    (select count(*) from profiles where created_at >= now() - interval '30 days'),

    -- readings.user_id nullable (có luồng đọc ẩn danh) => phải loại null,
    -- không thì count(distinct) đếm cả khách vãng lai thành 1 "user".
    (select count(distinct user_id) from readings
      where user_id is not null
        and (created_at at time zone 'Asia/Ho_Chi_Minh')::date
          = (now() at time zone 'Asia/Ho_Chi_Minh')::date),
    (select count(distinct user_id) from readings
      where user_id is not null and created_at >= now() - interval '7 days'),

    -- Doanh thu tính theo paid_at = tiền THỰC NHẬN trong cửa sổ.
    (select coalesce(sum(amount_vnd), 0) from orders where status = 'paid'),
    (select coalesce(sum(amount_vnd), 0) from orders
      where status = 'paid' and paid_at >= now() - interval '7 days'),
    (select coalesce(sum(amount_vnd), 0) from orders
      where status = 'paid' and paid_at >= now() - interval '30 days'),
    (select count(distinct user_id) from orders where status = 'paid'),

    -- Nợ dịch vụ: credits user đã mua nhưng chưa tiêu.
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
