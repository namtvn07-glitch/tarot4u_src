-- Lỗ hổng vừa gây ra ở migration trước (debit_refund_reading_race_safe):
-- DROP + CREATE function reset về default privilege của Supabase, tự động
-- cấp EXECUTE cho anon + authenticated (KHÁC với PUBLIC — bài học đã ghi ở
-- docs/learned/supabase.md, "revoke from public không cover anon/authenticated
-- và ngược lại"). Hậu quả: bất kỳ user đăng nhập (thậm chí anon) nào cũng
-- gọi thẳng được /rest/v1/rpc/debit_reading với p_user_id/p_reading_id tuỳ
-- ý — debit/refund credits cho TÀI KHOẢN NGƯỜI KHÁC, bỏ qua toàn bộ auth
-- check của personal/route.ts. Chỉ service_role (dùng trong route server)
-- mới cần gọi được.
revoke all on function public.debit_reading(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_reading(uuid) from public, anon, authenticated;
