import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { triageQuestion } from "@/lib/moderation";
import { checkRateLimit } from "@/lib/rate-limit";
import { ResumeReadingRequestSchema } from "@/lib/reading";
import { signDrawToken } from "@/lib/reading-token";

export const runtime = "nodejs";

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

  const triagePromise = triageQuestion(question).catch((err) => {
    Sentry.captureException(err, { extra: { topic } });
    return null;
  });

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Cùng bucket với /shuffle — đây cũng là 1 lượt kiểm duyệt AI + ký token
  // mới, không phải lối để lách rate limit của bước rút bài.
  const rateLimitCount = process.env.NODE_ENV === "development" ? 100 : 30;
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(`reading-deep-shuffle:user:${user.id}`, 3600, rateLimitCount);
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "rate_limit_check_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const triage = await triagePromise;
  if (!triage) {
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
