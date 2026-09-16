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
