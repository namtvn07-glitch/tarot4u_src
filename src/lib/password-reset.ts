import { createClient } from "@/lib/supabase/client";

// Link recovery của Supabase đi qua đúng route callback đã dùng cho magic link và
// Google (`/auth/callback` đổi code lấy session), chỉ khác `next` — nhờ vậy không
// phải khai thêm Redirect URL nào trên Dashboard.
export const RESET_REDIRECT_PATH = "/dat-lai-mat-khau";

/**
 * Gửi email đặt lại mật khẩu. Người gọi KHÔNG được đổi thông điệp theo kết quả:
 * `resetPasswordForEmail` cố tình không phân biệt email có tồn tại hay không, và
 * giao diện cũng phải giữ đúng như vậy — nếu không, form này thành công cụ dò xem
 * ai đã có tài khoản. `ok: false` chỉ dùng cho lỗi hạ tầng (mất mạng, rate limit).
 */
export async function sendPasswordResetEmail(email: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
    RESET_REDIRECT_PATH,
  )}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { ok: !error };
}
