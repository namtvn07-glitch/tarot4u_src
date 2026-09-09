// Hằng số dùng chung giữa middleware (ghi cookie) và form đăng ký (đọc cookie).

export const AFFILIATE_COOKIE = "aff_ref";

// Cookie chứa CLICK-ID (uuid), không phải mã affiliate trần. Client sửa cookie
// cũng không tự gán được mã cho mình: uuid phải tồn tại thật trong
// affiliate_clicks thì trigger handle_new_user() mới tra ra được mã.
export const AFFILIATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const AFFILIATE_CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

// Crawler xem trước link (người ta share link lên FB/Zalo/TikTok là các bot này
// tự gọi vào). Chúng không bao giờ đăng ký, nên nếu tính vào "clicks" thì link
// share mạng xã hội luôn trông như traffic rác. Vẫn ghi lại nhưng đánh dấu
// is_bot để thấy được tỉ lệ, chỉ loại khỏi con số headline.
export const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|facebookexternalhit|twitterbot|telegrambot|whatsapp|zalo|slackbot|discordbot|preview|headless/i;

// Đọc ở Client Component lúc gọi signUp(). Cookie cố ý KHÔNG httpOnly vì đăng
// ký chạy hoàn toàn phía client (supabase.auth.signUp), không qua route server
// nào — chỉ JS trình duyệt mới đưa được giá trị này vào user metadata.
export function getAffiliateClickId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${AFFILIATE_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Gộp ref_click vào metadata của signUp(). Trả về object rỗng khi không có
// cookie để không ghi khoá thừa vào raw_user_meta_data.
export function withAffiliateMetadata<T extends Record<string, unknown>>(
  data: T,
): T & { ref_click?: string } {
  const clickId = getAffiliateClickId();
  return clickId ? { ...data, ref_click: clickId } : data;
}
