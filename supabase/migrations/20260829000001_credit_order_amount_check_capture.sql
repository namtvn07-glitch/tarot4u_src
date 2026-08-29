-- Ghi lại chính xác định nghĩa credit_order() đang chạy thật trên production
-- (xác nhận qua pg_get_functiondef trực tiếp trên DB thật, 2026-08-29): logic
-- atomic đúng chuẩn — UPDATE ... RETURNING credits INTO v_balance trong cùng
-- 1 câu, không tách rời thành 2 bước (SELECT riêng sau UPDATE), nên không có
-- kiểu bug "ledger có dòng nhưng profiles.credits không đổi".
--
-- Migration này KHÔNG đổi hành vi production — chỉ đóng khoảng trống version
-- control: chữ ký (p_order_code bigint, p_amount int) mà webhook thật
-- (src/app/api/webhooks/payos/route.ts) gọi đã tồn tại trên remote từ trước
-- (không rõ qua migration nào, không nằm trong lịch sử migration đã đặt tên
-- ở remote) nhưng repo local trước đó chỉ có bản cũ
-- (p_order_id uuid, 20260809000003_credit_functions.sql) — một DB build mới
-- từ migration local sẽ có function sai chữ ký, webhook sẽ 404 khi gọi RPC.
create or replace function public.credit_order(p_order_code bigint, p_amount integer)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order orders%rowtype;
  v_balance int;
begin
  select * into v_order from orders where payos_order_code = p_order_code for update;
  if not found then return 'not_found'; end if;
  if v_order.status = 'paid' then return 'already_paid'; end if;
  if v_order.status <> 'pending' then return 'not_pending'; end if;
  if v_order.amount_vnd <> p_amount then return 'amount_mismatch'; end if;

  update orders set status = 'paid', paid_at = now() where id = v_order.id;
  update profiles set credits = credits + v_order.credits_purchased, updated_at = now()
    where id = v_order.user_id returning credits into v_balance;
  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
    values (v_order.user_id, v_order.credits_purchased, v_balance, 'purchase', v_order.id);
  return 'credited';
end;
$function$;

revoke execute on function public.credit_order(bigint, int) from public, anon, authenticated;
grant execute on function public.credit_order(bigint, int) to service_role;

-- Cùng lớp lỗ hổng credit_functions/security_hardening đã vá cho 4 hàm
-- credit khác: revoke ... from public không tự cascade sang anon/
-- authenticated trên Supabase. handle_new_user() vẫn còn PUBLIC:EXECUTE
-- (phát hiện qua get_advisors, WARN "anon/authenticated_security_definer_
-- function_executable") dù remote đã có 1 migration tên
-- "revoke_handle_new_user_rpc" trước đó -- rủi ro thực tế thấp (hàm trigger,
-- gọi rời sẽ lỗi "trigger functions can only be called as triggers") nhưng
-- vẫn khoá lại cho đúng chuẩn, đã xác nhận advisor sạch sau khi áp dụng.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role, postgres;
