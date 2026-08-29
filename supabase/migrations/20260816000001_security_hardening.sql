-- Fix phát hiện qua Supabase advisors ngay sau khi áp 3 migration GĐ3 lên
-- project thật lần đầu (2026-08-16) — không phát hiện được bằng review tĩnh.
--
-- `revoke execute ... from public` trong 20260809000003_credit_functions.sql
-- KHÔNG tự động revoke khỏi role `anon`/`authenticated` — Supabase cấp
-- default privileges riêng cho 2 role này trên schema `public`, độc lập với
-- pseudo-role PUBLIC. Hậu quả thật: credit_order/debit_reading/
-- refund_reading/check_rate_limit (đều SECURITY DEFINER, chỉ định cho
-- service_role) vẫn gọi được qua PostgREST RPC bởi user chưa xác thực —
-- bất kỳ ai cũng gọi `/rest/v1/rpc/credit_order` để tự cộng credits.
revoke execute on function credit_order(uuid) from anon, authenticated;
revoke execute on function debit_reading(uuid, uuid, int) from anon, authenticated;
revoke execute on function refund_reading(uuid) from anon, authenticated;
revoke execute on function check_rate_limit(text, int, int) from anon, authenticated;

-- function_search_path_mutable: guard_credits_column (trigger function,
-- 20260809000002_rls_policies.sql) thiếu `set search_path`, khác với 4 hàm
-- credit ở trên đã có sẵn. Không phải SECURITY DEFINER nên rủi ro thấp hơn,
-- nhưng vẫn là lint WARN hợp lệ và fix rẻ.
alter function guard_credits_column() set search_path = public;
