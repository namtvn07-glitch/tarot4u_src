-- Giai đoạn "mat-khau-nang-cap" — form đổi mật khẩu chỉ được hiện với tài khoản
-- THẬT SỰ có mật khẩu.
--
-- Vì sao cần hàm này thay vì đọc `user.identities` phía client: user đăng nhập
-- bằng magic link cũng có identity provider 'email' y hệt user đăng ký bằng
-- email+mật khẩu, nhưng KHÔNG có mật khẩu nào cả. Dựa vào identities thì form
-- sẽ hiện ra rồi luôn báo "mật khẩu hiện tại không đúng" — không cách nào đúng.
-- auth.users không đọc được qua PostgREST nên phải bọc security definer; hàm
-- chỉ trả boolean cho CHÍNH user đang gọi (auth.uid()), không lộ gì thêm.
create function current_user_has_password() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select encrypted_password is not null and encrypted_password <> ''
       from auth.users where id = auth.uid()),
    false);
$$;

-- Cùng khuôn với 20260816000001_security_hardening.sql: SECURITY DEFINER mà
-- không revoke thì PUBLIC/anon gọi được qua /rest/v1/rpc/. Ở đây anon gọi chỉ
-- nhận false (auth.uid() null), nhưng vẫn không có lý do gì để mở.
revoke execute on function current_user_has_password() from public, anon;
grant execute on function current_user_has_password() to authenticated, service_role;
