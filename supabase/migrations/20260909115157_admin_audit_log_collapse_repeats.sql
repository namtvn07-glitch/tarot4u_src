-- Nhật ký đang tự làm hỏng chính mình: mỗi lần trang /admin/users render là một
-- dòng, nên chỉ cần bấm qua lại vài phút đã sinh ra hàng chục dòng y hệt
-- ("users.list · trang 1 · 8 kết quả"). Tín hiệu thật — ai đó đọc dữ liệu cá
-- nhân lúc nào — bị chôn dưới nhiễu, mà nhiễu thì cũng tốn chỗ.
--
-- Cách xử lý: GỘP các lượt xem lặp lại của cùng một người, cùng một hành động,
-- cùng một từ khoá tìm kiếm, trong một cửa sổ thời gian — thành MỘT dòng có
-- đếm số lượt. Vẫn giữ nguyên khả năng phát hiện bất thường (một người mở dữ
-- liệu 200 lượt lúc 3h sáng vẫn hiện rõ là 200 lượt), chỉ bỏ phần lặp vô nghĩa.
--
-- Hành động GHI (tạo/tắt link) KHÔNG bao giờ gộp: mỗi lần là một sự kiện riêng
-- cần truy được.
alter table admin_audit_log add column view_count int not null default 1;
alter table admin_audit_log add column last_at timestamptz not null default now();

comment on column admin_audit_log.view_count is
  'Số lượt đã gộp vào dòng này. Hành động ghi luôn = 1.';
comment on column admin_audit_log.last_at is
  'Lượt gần nhất được gộp. created_at là lượt đầu tiên.';

create index admin_audit_log_collapse
  on admin_audit_log (admin_user_id, action, last_at desc);

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
  v_id bigint;
begin
  if p_collapse_minutes > 0 then
    -- Gộp theo cùng người + cùng hành động + cùng từ khoá tìm kiếm.
    -- Cố ý KHÔNG gộp theo số trang: lật trang là cùng một lượt truy cập dữ
    -- liệu. Nhưng tìm một người CỤ THỂ thì tách dòng riêng — đó mới đúng là
    -- thứ cần nhìn thấy khi rà lại sau này.
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

  insert into admin_audit_log (admin_user_id, action, meta)
  values (p_admin_user_id, p_action, p_meta);
end;
$function$;

revoke execute on function public.log_admin_access(uuid, text, jsonb, int)
  from public, anon, authenticated;
grant execute on function public.log_admin_access(uuid, text, jsonb, int) to service_role;
