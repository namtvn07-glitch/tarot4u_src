import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { triageQuestion } from "@/lib/moderation";
import { checkRateLimit } from "@/lib/rate-limit";
import { DeepReadingRequestSchema, drawCards } from "@/lib/reading";
import { signDrawToken } from "@/lib/reading-token";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// Bước 1 của Đọc sâu — rút bài KÍN, không lộ nội dung cho client (xem
// 03-kien-truc-ai.md §7.2). Không đụng credits ở bước này.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = DeepReadingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { topic, question } = parsed.data;

  // Bắt đầu gọi kiểm duyệt AI song song với xác thực & rate-limit để giảm tối đa độ trễ
  const triagePromise = triageQuestion(question).catch((err) => {
    Sentry.captureException(err, { extra: { topic } });
    return null;
  });

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 30 lượt/giờ theo đúng spec Research/plan/06-bao-mat-kiem-duyet-phap-ly.md §2.2 (100 trong dev để test thoải mái)
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

  // Chặn trước khi rút bài — không tạo token, không trừ credits. Client
  // render thông báo tương ứng category (xem CrisisResourceNotice).
  if (triage.category !== "ok") {
    return NextResponse.json({ blocked: true, category: triage.category });
  }

  const cards = drawCards(3, triage.orientation_mode);
  const token = signDrawToken({
    userId: user.id,
    topic,
    question,
    orientationMode: triage.orientation_mode,
    cards,
  });

  return NextResponse.json({ token, slots: env.DEEP_SPREAD_SLOTS });
}
