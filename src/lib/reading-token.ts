import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { Draw, OrientationMode } from "@/lib/reading";

// 2 giờ — khớp hạn khôi phục phiên phía client (SESSION_STORAGE_KEY,
// DeepReadScreen.tsx). Trước đây 15 phút trong khi client giữ phiên tới 2
// tiếng: token luôn chết trước khi user quay lại thử "trải lại luận giải"
// sau khi bị gián đoạn (mất mạng, đóng tab...), dù bộ 3 lá vẫn còn nguyên.
const TTL_MS = 2 * 60 * 60_000;

export interface DrawTokenPayload {
  userId: string;
  topic: string;
  question: string;
  orientationMode: OrientationMode;
  cards: Draw[];
  exp: number;
  // Sinh 1 lần khi ký token (mỗi lần /shuffle hoặc /resume ký mới là 1 ID
  // mới) — nhúng vào token đã ký thay vì để personal/route.ts tự sinh
  // random mỗi request. Nhờ vậy 2 request gửi TRÙNG 1 token (double-click,
  // script gọi song song) luôn ra cùng readingId, làm cho idempotent check
  // sẵn có trong debit_reading()/refund_reading() (theo ref_id) thật sự có
  // tác dụng — trước đây mỗi request tự sinh randomUUID() riêng nên 2 lần
  // bấm = 2 readingId khác nhau = trừ credits + gọi AI + ghi reading 2 lần.
  readingId: string;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function signDrawToken(
  payload: Omit<DrawTokenPayload, "exp" | "readingId">,
): string {
  const full: DrawTokenPayload = { ...payload, exp: Date.now() + TTL_MS, readingId: randomUUID() };
  const body = base64url(Buffer.from(JSON.stringify(full), "utf8"));
  const signature = createHmac("sha256", env.READING_TOKEN_SECRET)
    .update(body)
    .digest("hex");
  return `${body}.${signature}`;
}

export function verifyDrawToken(token: string): DrawTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expected = createHmac("sha256", env.READING_TOKEN_SECRET)
    .update(body)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: DrawTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return payload;
}
