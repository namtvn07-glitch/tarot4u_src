-- Xoá lượt bấm cũ mà KHÔNG dẫn tới đăng ký nào.
--
-- Vì sao phải là một hàm chứ không phải câu delete thẳng từ app: điều kiện
-- "không có profile nào trỏ tới" là một truy vấn con, mà PostgREST không diễn
-- đạt được kiểu đó trong .delete().
--
-- Vì sao chỉ xoá lượt chưa chuyển đổi: profiles.referred_click_id trỏ tới bảng
-- này với on delete set null. Xoá một lượt đã dẫn tới đăng ký là âm thầm cắt
-- mất dấu vết "người này đến từ cú bấm nào", kéo theo hỏng chỉ số thời gian từ
-- bấm đến đăng ký của những chiến dịch cũ. Lượt đã chuyển đổi giữ vĩnh viễn —
-- chúng vốn là thiểu số.
create or replace function public.cleanup_unconverted_clicks(p_before timestamptz)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_deleted integer;
begin
  delete from affiliate_clicks c
  where c.created_at < p_before
    and not exists (
      select 1 from profiles p where p.referred_click_id = c.id
    );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

revoke execute on function public.cleanup_unconverted_clicks(timestamptz)
  from public, anon, authenticated;
grant execute on function public.cleanup_unconverted_clicks(timestamptz) to service_role;
