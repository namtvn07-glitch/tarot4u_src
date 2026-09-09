-- Đọc nhật ký kèm email quản trị viên.
-- Không truy vấn thẳng auth.users từ client được (PostgREST chỉ expose schema
-- public), nên join ở đây — cùng lý do và cùng pattern với admin_list_users.
create or replace function public.admin_audit_log_page(
  p_limit  int default 50,
  p_offset int default 0
)
returns table (
  id            bigint,
  admin_user_id uuid,
  admin_email   text,
  action        text,
  meta          jsonb,
  created_at    timestamptz
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    a.id,
    a.admin_user_id,
    u.email::text,
    a.action,
    a.meta,
    a.created_at
  from admin_audit_log a
  left join auth.users u on u.id = a.admin_user_id
  order by a.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

revoke execute on function public.admin_audit_log_page(int, int) from public, anon, authenticated;
grant execute on function public.admin_audit_log_page(int, int) to service_role;
