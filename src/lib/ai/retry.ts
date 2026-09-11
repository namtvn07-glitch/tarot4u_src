// Mọi provider AI đều trả lỗi tạm thời khá thường xuyên: 429 khi chạm hạn mức
// theo phút, 503 khi phía provider quá tải. Trước đây một cú như vậy nổi
// thẳng lên UI thành "Hệ thống kiểm duyệt AI đang bận" và người dùng phải tự
// bấm lại — trong khi phần lớn tự khỏi sau vài trăm mili-giây.

// Lỗi đáng thử lại. 4xx còn lại (400/401/403/404) là sai cấu hình — thử lại
// chỉ làm chậm và giấu mất bug thật, nên để nó nổ.
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const TRANSIENT_MESSAGE =
  /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|network error/i;

export class AiTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`ai_call_timeout_after_${timeoutMs}ms`);
    this.name = "AiTimeoutError";
  }
}

// SDK của Gemini (ApiError), Anthropic và OpenAI đều phơi HTTP status ở
// `.status` — đọc kiểu duck-typing để helper này không phải import SDK nào.
function getStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

export function isTransientAiError(error: unknown): boolean {
  if (error instanceof AiTimeoutError) return true;

  const status = getStatus(error);
  if (status !== undefined) return TRANSIENT_STATUS.has(status);

  const message = error instanceof Error ? error.message : String(error);
  // Model trả JSON sai schema là chuyện ngẫu nhiên theo từng lần sinh, không
  // phải lỗi cấu hình — sinh lại thường ra kết quả hợp lệ.
  if (message === "ai_classify_parse_failed") return true;
  return TRANSIENT_MESSAGE.test(message);
}

// Gemini đính kèm gợi ý chờ trong body lỗi 429: "retryDelay": "27s".
function getServerRetryDelayMs(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const match = error.message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return match ? Math.round(Number(match[1]) * 1000) : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  // Chỉ bỏ chờ ở phía mình, KHÔNG huỷ request đang bay tới provider — các SDK
  // ở đây không nhận abort signal đồng nhất. Chấp nhận được vì mục tiêu là
  // không để người dùng treo vô hạn trên màn xáo bài.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiTimeoutError(timeoutMs)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export interface AiRetryOptions {
  attempts: number;
  perAttemptTimeoutMs: number;
  baseDelayMs: number;
  // Trần cho TOÀN BỘ chuỗi thử lại. Người dùng đang chờ ở đầu kia và route có
  // maxDuration hữu hạn — thà báo lỗi sớm còn hơn để Vercel giết function.
  maxTotalMs: number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function withAiRetry<T>(
  run: () => Promise<T>,
  options: AiRetryOptions,
): Promise<T> {
  const startedAt = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await withTimeout(run(), options.perAttemptTimeoutMs);
    } catch (error) {
      lastError = error;
      if (!isTransientAiError(error)) throw error;
      if (attempt === options.attempts) break;

      // Jitter để nhiều request cùng dính 429 không thử lại đúng một thời
      // điểm rồi lại cùng dính 429 lần nữa.
      const backoff = options.baseDelayMs * 2 ** (attempt - 1);
      const delayMs = Math.round(
        Math.max(backoff + Math.random() * options.baseDelayMs, getServerRetryDelayMs(error) ?? 0),
      );

      const elapsed = Date.now() - startedAt;
      if (elapsed + delayMs + options.perAttemptTimeoutMs > options.maxTotalMs) break;

      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}
