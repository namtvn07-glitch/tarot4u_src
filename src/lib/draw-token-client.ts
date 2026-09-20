// Đọc phần payload của drawToken ở phía trình duyệt.
//
// drawToken chỉ được KÝ (HMAC), không mã hoá — phần payload đọc được trực
// tiếp, không cần secret. Server vẫn là nơi verify chữ ký thật
// (src/lib/reading-token.ts); mọi thứ ở đây chỉ dùng để quyết định hiển thị:
// phiên này của ai, và token còn hạn hay không.

export interface DecodedDrawToken {
  // null = token ký lúc chưa đăng nhập. personal/route.ts cố ý cho phép bất
  // kỳ tài khoản nào "nhận" token ẩn danh, nên phiên ẩn danh được khôi phục
  // cho bất kỳ ai — còn token đã gắn userId thì chỉ chính chủ.
  userId: string | null;
  exp: number;
}

export function decodeDrawToken(token: unknown): DecodedDrawToken | null {
  if (typeof token !== "string") return null;
  try {
    const [body] = token.split(".");
    if (!body) return null;
    const base64 = body.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== "object") return null;
    const { userId, exp } = payload as { userId?: unknown; exp?: unknown };
    if (typeof exp !== "number") return null;
    if (userId !== null && typeof userId !== "string") return null;
    return { userId, exp };
  } catch {
    // Token méo/không phải base64 — coi như không đọc được. Nơi gọi tự quyết
    // định hướng an toàn (hết hạn / không phải của mình).
    return null;
  }
}

/**
 * Biết TRƯỚC khi người dùng bấm "trải lại" là token còn hiệu lực hay đã chắc
 * chắn hết hạn, thay vì để họ bấm rồi mới nhận lỗi.
 */
export function isDrawTokenExpired(token: string): boolean {
  const payload = decodeDrawToken(token);
  if (!payload) return true;
  return Date.now() > payload.exp;
}
