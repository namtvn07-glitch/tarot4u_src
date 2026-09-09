-- Trước migration này, admin_audit_log.admin_user_id là NOT NULL + khoá ngoại
-- mặc định (NO ACTION), nên KHÔNG xoá được một tài khoản admin nào còn dòng
-- trong nhật ký. Hai đường ra đều tệ: hoặc không gỡ được admin cũ, hoặc phải
-- xoá lịch sử của họ trước — mà xoá lịch sử thì nhật ký còn ý nghĩa gì nữa.
--
-- Sửa đúng cách: lưu kèm ẢNH CHỤP email ngay lúc ghi, và cho khoá ngoại tự
-- chuyển về rỗng khi tài khoản bị xoá. Nhật ký sống sót và vẫn đọc được "ai
-- làm gì" kể cả khi tài khoản đó không còn tồn tại.
--
-- Ảnh chụp cũng đúng hơn về mặt nghiệp vụ: nó ghi email TẠI THỜI ĐIỂM hành
-- động. Người ta đổi email sau này thì nhật ký cũ vẫn phản ánh đúng lúc đó.
--
-- Đã kiểm chứng: tạo admin tạm → ghi 2 dòng nhật ký → xoá tài khoản đó ⇒ xoá
-- thành công (trước đây bị chặn), 2 dòng nhật ký còn nguyên, admin_email vẫn
-- đọc được, admin_user_id chuyển thành null.
alter table admin_audit_log add column admin_email text;

alter table admin_audit_log alter column admin_user_id drop not null;

alter table admin_audit_log drop constraint admin_audit_log_admin_user_id_fkey;
alter table admin_audit_log add constraint admin_audit_log_admin_user_id_fkey
  foreign key (admin_user_id) references auth.users(id) on delete set null;

comment on column admin_audit_log.admin_email is
  'Ảnh chụp email lúc ghi. Không bao giờ bị xoá theo tài khoản — đây là thứ giữ cho nhật ký còn đọc được sau khi admin bị gỡ.';
comment on column admin_audit_log.admin_user_id is
  'Về null khi tài khoản bị xoá. Dùng admin_email để biết đó là ai.';

-- Ghi thêm ảnh chụp email. Hàm là SECURITY DEFINER nên đọc được auth.users.
create or replace function public.log_admin_access(
  p_admin_user_id    uuid,
  p_action           text,
  p_meta             jsonb default null,
  p_collapse_minutes int  default 0
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id    bigint;
  v_email text;
begin
  if p_collapse_minutes > 0 then
    select id into v_id
    from admin_audit_log
    where admin_user_id = p_admin_user_id
      and action = p_action
      and coalesce(meta->>'q', '') = coalesce(p_meta->>'q', '')
      and last_at >= now() - make_interval(mins => p_collapse_minutes)
    order by last_at desc
    limit 1;

    if v_id is not null then
      update admin_audit_log
      set view_count = view_count + 1,
          last_at    = now(),
          meta       = coalesce(p_meta, meta)
      where id = v_id;
      return;
    end if;
  end if;

  select email into v_email from auth.users where id = p_admin_user_id;

  insert into admin_audit_log (admin_user_id, admin_email, action, meta)
  values (p_admin_user_id, v_email, p_action, p_meta);
end;
$function$;

revoke execute on function public.log_admin_access(uuid, text, jsonb, int)
  from public, anon, authenticated;
grant execute on function public.log_admin_access(uuid, text, jsonb, int) to service_role;

-- Ưu tiên ảnh chụp; chỉ tra auth.users cho các dòng cũ chưa có ảnh chụp.
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
  view_count    int,
  created_at    timestamptz,
  last_at       timestamptz
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    a.id,
    a.admin_user_id,
    coalesce(a.admin_email, u.email::text),
    a.action,
    a.meta,
    a.view_count,
    a.created_at,
    a.last_at
  from admin_audit_log a
  left join auth.users u on u.id = a.admin_user_id
  order by a.last_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

revoke execute on function public.admin_audit_log_page(int, int) from public, anon, authenticated;
grant execute on function public.admin_audit_log_page(int, int) to service_role;
