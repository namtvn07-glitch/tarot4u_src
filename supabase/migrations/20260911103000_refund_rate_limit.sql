-- Hoàn 1 nhịp đếm cho request đã bị check_rate_limit tính nhưng sau đó hỏng
-- vì lỗi phía hệ thống (AI kiểm duyệt lỗi/timeout), không phải lỗi người
-- dùng. Dùng ĐÚNG công thức cửa sổ của check_rate_limit để trừ đúng dòng vừa
-- cộng; nếu cửa sổ đã lăn sang nhịp mới giữa lúc gọi AI thì trừ vào dòng mới
-- (gần như rỗng) và greatest() chặn không cho âm.
create or replace function public.refund_rate_limit(
  p_key text,
  p_window_seconds integer
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_window_start timestamptz;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  update rate_limits
     set count = greatest(count - 1, 0)
   where key = p_key
     and window_start = v_window_start;
end;
$$;

-- Cùng mức khoá với check_rate_limit: chỉ service_role (route handler) gọi
-- được. Để PUBLIC gọi được thì bất kỳ ai cũng tự xoá được hạn mức của mình.
revoke execute on function public.refund_rate_limit(text, integer) from public;
revoke execute on function public.refund_rate_limit(text, integer) from anon;
revoke execute on function public.refund_rate_limit(text, integer) from authenticated;
grant execute on function public.refund_rate_limit(text, integer) to service_role;
