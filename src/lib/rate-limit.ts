import * as Sentry from "@sentry/nextjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Nới hạn mức khi chạy `next dev`.
 *
 * Hạn mức theo IP được chỉnh cho production, nơi một IP là một nhóm người lạ
 * sau NAT. Ở máy dev thì MỌI request đều đến từ `::1` — một bucket duy nhất cho
 * toàn bộ việc thử nghiệm — nên "10 lượt/ngày/IP" nghĩa là lập trình viên bị
 * khoá sau 10 lần bấm và phải chờ tới hôm sau.
 *
 * Nhánh theo user đã có ngoại lệ này từ trước; nhánh theo IP thì chưa, và điều
 * đó chỉ lộ ra khi phiên ẩn danh bắt đầu được đếm theo IP.
 *
 * `NODE_ENV` chỉ là `"development"` dưới `next dev` — bản build production luôn
 * là `"production"`, nên đây không phải một lối nới lỏng có thể rò ra ngoài.
 */
export function relaxInDev(productionMax: number, devMax = 100): number {
  return process.env.NODE_ENV === "development" ? devMax : productionMax;
}

/** Ai đang bị đếm: một tài khoản thật, hay một địa chỉ IP. */
export type RateLimitScope = "user" | "ip";

export interface RateLimitIdentity {
  scope: RateLimitScope;
  /** Phần định danh của key — id tài khoản, hoặc IP. */
  token: string;
}

/**
 * Quyết định đếm hạn mức theo AI — và đây là chỗ DUY NHẤT được quyết định đó.
 *
 * Mọi route trước đây tự viết `user ? ":user:" : ":ip:"`. Công thức đó dựa trên
 * một giả định đã chết: "chưa đăng nhập = chưa có user.id". Từ khi bật
 * anonymous auth, `signInAnonymously()` sinh một uuid MỚI mỗi lần gọi và đi
 * thẳng vào Supabase GoTrue — app không chặn được lời gọi đó. Nên nếu ẩn danh
 * được đếm theo user.id thì hạn mức trở thành vô hạn: đúc danh tính mới là
 * reset bộ đếm, và nhánh `:ip:` thành code chết.
 *
 * Với các route gọi AI có tiền (shuffle/resume gọi triageQuestion thật), đó
 * không phải phiền toái mà là một máy bơm chi phí không giới hạn.
 *
 * Quy tắc: **chỉ tài khoản thật mới được đếm theo user.** Ẩn danh bị đếm theo
 * IP đúng như khách vãng lai — vì xét về khả năng đúc lại danh tính, họ CHÍNH
 * LÀ khách vãng lai.
 *
 * Caller vẫn phải tự gắn tiền tố tên route vào key (learned 2026-08-27): RPC
 * `check_rate_limit` chỉ đếm theo chuỗi key, hai route dùng key trần giống nhau
 * sẽ âm thầm chia chung một bộ đếm.
 */
export function resolveRateLimitIdentity(
  user: { id: string; isAnonymous: boolean } | null,
  request: Request,
): RateLimitIdentity {
  if (user && !user.isAnonymous) return { scope: "user", token: user.id };
  return { scope: "ip", token: getClientIp(request) };
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
