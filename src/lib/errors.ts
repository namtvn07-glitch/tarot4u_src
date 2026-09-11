// Cùng một khối `catch` lặp ở 4 file UI: lấy `message` nếu có, không thì
// dùng câu tiếng Việt riêng của từng màn. Gom lại đây để bỏ được
// `catch (err: any)` mà không đổi hành vi.

// Giữ nguyên ngữ nghĩa của `err?.message || fallback` cũ: nhận cả giá trị
// không phải Error miễn là có `message` là chuỗi khác rỗng (một số SDK ném
// object trần), và rơi về fallback trong mọi trường hợp còn lại.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

// Không dùng `instanceof DOMException` — fetch abort ném DOMException ở
// browser nhưng Error thường ở môi trường khác, chỉ `name` là ổn định.
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: unknown }).name === "AbortError"
  );
}
