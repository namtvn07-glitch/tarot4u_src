import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCardById } from "@/lib/cards";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ReadingRequestSchema, drawCard, normalizeDbTopic } from "@/lib/reading";
import { createClient } from "@/lib/supabase/server";

// node:crypto (randomInt in drawCard) needs the Node runtime, not edge.
export const runtime = "nodejs";

// Đọc nhanh (free) only — không nhận `tier`/`question`. Đọc sâu (paid, AI cá
// nhân hóa) là route/logic riêng của Giai đoạn 4c, xem implementation-plan.md
// "Decisions Needed From You".
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ReadingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { topic } = parsed.data;
  const dbTopic = normalizeDbTopic(topic);

  // Đọc nhanh không yêu cầu đăng nhập (08-timeline.md Giai đoạn 8 "Trải bài
  // có/không đăng nhập") — giới hạn theo user nếu có, theo IP nếu chưa đăng
  // nhập (06-bao-mat-kiem-duyet-phap-ly.md §2.2).
  const user = await requireUser();
  const rateLimitKey = user
    ? `reading-quick:user:${user.id}`
    : `reading-quick:ip:${getClientIp(request)}`;
  const [rateLimitWindow, rateLimitMax] = user ? [3600, 20] : [86400, 3];

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

  const { cardId, orientation } = drawCard();
  const card = getCardById(cardId);

  const supabase = await createClient();
  const { data: base, error } = await supabase
    .from("base_content")
    .select("body, summary, keywords")
    .eq("card_id", cardId)
    .eq("orientation", orientation)
    .eq("topic", dbTopic)
    .single();

  if (error || !base) {
    // Không nên xảy ra — 780/780 tổ hợp đã xác nhận có trong base_content
    // (Giai đoạn 4a), nhưng đây là I/O ra ngoài nên vẫn phải xử lý thay vì
    // để `base.body` crash phía dưới.
    Sentry.captureException(
      error ?? new Error("base_content row missing"),
      { extra: { cardId, orientation, topic } },
    );
    return NextResponse.json({ error: "base_content_unavailable" }, { status: 500 });
  }

  return NextResponse.json({
    topic,
    card: {
      id: card.id,
      nameEn: card.name_en,
      nameVi: card.name_vi,
      image: `/cards/${card.image_filename}`,
      orientation,
    },
    base,
  });
}
