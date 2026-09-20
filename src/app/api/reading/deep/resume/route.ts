import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { triageQuestion } from "@/lib/moderation";
import {
  checkRateLimit,
  refundRateLimit,
  relaxInDev,
  resolveRateLimitIdentity,
} from "@/lib/rate-limit";
import { ResumeReadingRequestSchema } from "@/lib/reading";
import { signDrawToken } from "@/lib/reading-token";

export const runtime = "nodejs";

// Cùng lý do với /shuffle: kiểm duyệt AI có ngân sách thử lại, 10s mặc định
// của Vercel không đủ.
export const maxDuration = 30;

// Xin cấp lại drawToken cho ĐÚNG bộ 3 lá + câu hỏi đã có (không rút bài
// mới) — dùng khi phiên trước bị gián đoạn/token cũ đã hết hạn (TTL 2 giờ,
// reading-token.ts), nhưng user vẫn muốn trải lại luận giải cho bộ bài đó.
// Không phải bước "rút bài kín" như /shuffle — client đã hợp lệ biết nội
// dung 3 lá này từ trước qua /reveal, không có gì phải giấu nữa ở đây.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResumeReadingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { topic, question, cards } = parsed.data;

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Cùng bucket với /shuffle — đây cũng là 1 lượt kiểm duyệt AI + ký token
  // mới, không phải lối để lách rate limit của bước rút bài. Và giống
  // /shuffle, hạn mức phải chặn TRƯỚC khi gọi AI chứ không chạy song song,
  // nếu không request bị từ chối vẫn tốn tiền call thật.
  //
  // Trước đây route này chỉ có biến thể theo user vì khách không tới được đây
  // (401 ở trên). Phiên ẩn danh thì tới được — và nếu đếm theo id của nó thì
  // đây thành cửa sau đi vòng qua hạn mức IP của /shuffle, cùng một call
  // triageQuestion có tiền. Dùng chung bucket + chung quy tắc scope với
  // /shuffle để không có đường nào rẻ hơn đường nào.
  const identity = resolveRateLimitIdentity(user, request);
  const rateLimitKey = `reading-deep-shuffle:${identity.scope}:${identity.token}`;
  const [rateLimitWindow, rateLimitCount] =
    identity.scope === "user" ? [3600, relaxInDev(30)] : [86400, relaxInDev(10)];
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(rateLimitKey, rateLimitWindow, rateLimitCount);
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "rate_limit_check_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const triage = await triageQuestion(question).catch((err) => {
    Sentry.captureException(err, { extra: { userId: user.id, topic } });
    return null;
  });
  if (!triage) {
    // Lỗi hệ thống — không tính vào hạn mức của người dùng (xem /shuffle).
    await refundRateLimit(rateLimitKey, rateLimitWindow);
    return NextResponse.json({ error: "moderation_failed" }, { status: 500 });
  }

  if (triage.category !== "ok") {
    return NextResponse.json({ blocked: true, category: triage.category });
  }

  const token = signDrawToken({
    userId: user.id,
    topic,
    question,
    orientationMode: triage.orientation_mode,
    cards,
  });

  return NextResponse.json({ token });
}
