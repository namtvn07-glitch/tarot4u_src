import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { triageQuestion } from "@/lib/moderation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
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

  // Đọc sâu tới hết Lớp Nền miễn phí không cần đăng nhập nữa — chỉ bước mở
  // khóa luận giải chuyên sâu (trừ credits, personal/route.ts) mới bắt buộc.
  // Ẩn danh giới hạn theo IP giống hệt Rút Nhanh (06-bao-mat-kiem-duyet-phap-ly.md
  // §2.2) vì bước này vẫn gọi AI kiểm duyệt thật trên mọi lần thử — không nới
  // lỏng hơn Rút Nhanh dù Rút Nhanh không tốn AI.
  const user = await requireUser();
  const rateLimitKey = user
    ? `reading-deep-shuffle:user:${user.id}`
    : `reading-deep-shuffle:ip:${getClientIp(request)}`;
  const [rateLimitWindow, rateLimitMax] = user
    ? [3600, process.env.NODE_ENV === "development" ? 100 : 30]
    : [86400, 3];

  let allowed: boolean;
  try {
    allowed = await checkRateLimit(rateLimitKey, rateLimitWindow, rateLimitMax);
  } catch (rateLimitError) {
    Sentry.captureException(rateLimitError, { extra: { userId: user?.id, topic } });
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
    userId: user?.id ?? null,
    topic,
    question,
    orientationMode: triage.orientation_mode,
    cards,
  });

  return NextResponse.json({ token, slots: env.DEEP_SPREAD_SLOTS });
}
