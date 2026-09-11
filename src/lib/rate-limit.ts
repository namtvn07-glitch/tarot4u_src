import * as Sentry from "@sentry/nextjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  maxCount: number,
): Promise<boolean> {
  try {
    const { data: allowed, error } = await getSupabaseAdmin().rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max_count: maxCount,
    });
    if (error) return true; // Fail open in dev
    return Boolean(allowed);
  } catch {
    return true; // Fail open
  }
}

// Trả lại nhịp đếm cho một request đã bị checkRateLimit tính nhưng sau đó
// hỏng vì lỗi PHÍA MÌNH (AI kiểm duyệt chết/timeout), không phải lỗi người
// dùng. Không có bước này thì lỗi hệ thống lại ăn vào hạn mức của họ: khách
// ẩn danh chỉ có 10 lượt/ngày sẽ bị khoá sạch sau vài lần AI lỗi mà chưa xem
// được quẻ nào — đúng vòng lặp "AI đang bận" rồi "bạn đã thử quá nhiều lần".
export async function refundRateLimit(key: string, windowSeconds: number): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().rpc("refund_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
    });
    if (error) Sentry.captureException(error, { extra: { key, windowSeconds } });
  } catch (refundError) {
    // Hoàn hụt chỉ làm hạn mức chặt hơn thiết kế đúng một nhịp; ném tiếp ở
    // đây sẽ che mất lỗi gốc mà caller đang trên đường trả về cho client.
    Sentry.captureException(refundError, { extra: { key, windowSeconds } });
  }
}
