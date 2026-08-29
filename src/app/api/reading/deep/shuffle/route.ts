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

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 10 lượt/giờ — chống spam AI call tốn phí, đủ rộng cho user thật. Key có
  // tiền tố route (không chỉ `user:<id>`) để không đụng bucket với các route
  // rate-limit khác (`reading-quick:user:<id>`, `orders-create:user:<id>`).
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(`reading-deep-shuffle:user:${user.id}`, 3600, 10);
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user.id } });
    return NextResponse.json({ error: "rate_limit_check_failed" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let triage;
  try {
    triage = await triageQuestion(question);
  } catch (error) {
    Sentry.captureException(error, { extra: { userId: user.id, topic } });
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
