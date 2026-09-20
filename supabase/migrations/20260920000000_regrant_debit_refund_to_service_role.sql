-- Cấp lại EXECUTE trên debit_reading/refund_reading cho service_role.
--
-- `20260908000001_debit_refund_reading_race_safe.sql` dòng 18-19 dùng
-- `drop function if exists` rồi tạo lại hai hàm này. DROP FUNCTION xoá sạch
-- mọi grant của hàm đó — kể cả `grant execute ... to service_role` đã cấp từ
-- `20260809000003_credit_functions.sql:116`. Migration ấy chỉ `revoke all ...
-- from public` sau khi tạo lại, không cấp lại gì cho service_role.
--
-- Vì sao production vẫn chạy được tới giờ: project Supabase hosted đặt
-- `alter default privileges in schema public grant all on functions to
-- postgres, anon, authenticated, service_role`, nên hàm vừa tạo tự có quyền.
-- Chính đặc điểm đó là lý do `20260908000002` phải tồn tại để REVOKE khỏi
-- anon/authenticated — một lỗ bảo mật do default privileges mở ra.
--
-- Nói cách khác: đường trừ credits của production đang sống nhờ một mặc định
-- ngầm của nền tảng, không phải nhờ điều gì viết trong repo này. Chỗ nào không
-- có mặc định đó thì gãy — và `supabase start` ở máy dev CHÍNH LÀ chỗ đó
-- (`\ddp` cho thấy default privileges cho function chỉ có `postgres=X/postgres`).
-- Triệu chứng: mọi lượt Đọc sâu trả `debit_failed`, UI hiện "Không thể trừ
-- Credits lúc này".
--
-- Migration này làm quyền đó thành tường minh. Idempotent: trên production nó
-- cấp lại đúng thứ đã có, không đổi hành vi. Trên môi trường mới thì nó là thứ
-- duy nhất làm cho đường tiền chạy được.
--
-- KHÔNG cấp cho anon/authenticated — hai role đó phải luôn bị chặn, xem
-- 20260908000002: có quyền là tự gọi /rest/v1/rpc/debit_reading với
-- p_user_id tuỳ ý.

grant execute on function public.debit_reading(uuid, uuid, integer) to service_role;
grant execute on function public.refund_reading(uuid) to service_role;

-- Chốt lại lần nữa cho chắc — `revoke` là idempotent và đây là đường tiền.
revoke all on function public.debit_reading(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_reading(uuid) from public, anon, authenticated;
