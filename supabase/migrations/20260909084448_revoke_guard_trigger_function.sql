-- Hàm trigger không có lý do gì để anon/authenticated gọi rời (gọi rời sẽ lỗi
-- 'trigger functions can only be called as triggers'), nhưng khoá lại cho đúng
-- chuẩn repo đã đặt ở 20260829000001 và để advisor sạch.
revoke execute on function public.guard_profiles_protected_columns() from public, anon, authenticated;
grant execute on function public.guard_profiles_protected_columns() to service_role, postgres;
