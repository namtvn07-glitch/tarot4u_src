-- Chuỗi số liệu theo ngày cho biểu đồ xu hướng.
-- generate_series để ngày KHÔNG có hoạt động vẫn ra 0 thay vì biến mất — thiếu
-- ngày là biểu đồ tự bóp méo trục thời gian.
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
    (select count(*) from profiles p
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


-- Danh sách user. Đọc auth.users qua SQL join được vì SECURITY DEFINER chạy
-- với quyền OWNER (postgres) chứ không phải quyền người gọi — đã xác nhận
-- bằng function throwaway (select count(*) from auth.users) trước khi viết.
-- Chỉ chọn các cột ổn định lâu dài của auth.users, và cô lập toàn bộ việc chạm
-- schema auth vào đúng 1 hàm này để nếu Supabase đổi cấu trúc thì chỉ sửa 1 chỗ.
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
  from profiles p
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


-- Phễu chuyển đổi theo từng mã affiliate.
create or replace function public.admin_affiliate_stats()
returns table (
  code                text,
  label               text,
  is_active           boolean,
  created_at          timestamptz,
  clicks              bigint,
  bot_clicks          bigint,
  unique_visitors     bigint,
  signups             bigint,
  activated_soft      bigint,
  activated_hard      bigint,
  paying              bigint,
  revenue_vnd         bigint,
  avg_hours_to_signup numeric
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    l.code,
    l.label,
    l.is_active,
    l.created_at,

    (select count(*) from affiliate_clicks c where c.code = l.code and not c.is_bot),
    (select count(*) from affiliate_clicks c where c.code = l.code and c.is_bot),
    (select count(distinct c.ip_hash) from affiliate_clicks c
      where c.code = l.code and not c.is_bot and c.ip_hash is not null),

    (select count(*) from profiles p where p.referred_by_code = l.code),

    -- MỀM: có ít nhất 1 lượt đọc CÒN TỒN TẠI. readings có policy
    -- readings_delete_own => user dọn lịch sử là số này tụt xuống.
    (select count(*) from profiles p
      where p.referred_by_code = l.code
        and exists (select 1 from readings r where r.user_id = p.id)),

    -- CỨNG: đã thực sự tiêu credit cho một lượt đọc sâu và KHÔNG bị hoàn.
    -- credit_ledger user không ghi/xoá được => bằng chứng không lay chuyển.
    (select count(*) from profiles p
      where p.referred_by_code = l.code
        and exists (
          select 1 from credit_ledger cl
          where cl.user_id = p.id and cl.reason = 'reading'
            and not exists (
              select 1 from credit_ledger rf
              where rf.reason = 'refund' and rf.ref_id = cl.ref_id
            )
        )),

    (select count(*) from profiles p
      where p.referred_by_code = l.code
        and exists (select 1 from orders o where o.user_id = p.id and o.status = 'paid')),

    (select coalesce(sum(o.amount_vnd), 0) from orders o
      join profiles p on p.id = o.user_id
      where p.referred_by_code = l.code and o.status = 'paid'),

    -- Độ trễ click -> đăng ký: traffic chốt nhanh = ý định cao.
    (select round(avg(extract(epoch from (p.created_at - c.created_at)) / 3600)::numeric, 1)
      from profiles p
      join affiliate_clicks c on c.id = p.referred_click_id
      where p.referred_by_code = l.code)

  from affiliate_links l
  order by l.created_at desc;
$function$;

revoke execute on function public.admin_affiliate_stats() from public, anon, authenticated;
grant execute on function public.admin_affiliate_stats() to service_role;
