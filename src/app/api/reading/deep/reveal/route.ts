import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getCardById } from "@/lib/cards";
import { normalizeDbTopic } from "@/lib/reading";
import { verifyDrawToken } from "@/lib/reading-token";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Bước 2 của Đọc sâu — tiết lộ 1 lá theo THỨ TỰ user bấm (không theo vị trí
// UI), kèm luôn diễn giải Lớp Nền của đúng lá đó. Đây vẫn là Đọc nhanh —
// KHÔNG ghi DB, KHÔNG đụng credits (xem 03-kien-truc-ai.md §7.2 bước 4-5).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  const revealIndex = body?.revealIndex;

  if (!token || typeof revealIndex !== "number" || revealIndex < 0 || revealIndex > 2) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const payload = verifyDrawToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 410 });
  }

  const draw = payload.cards[revealIndex];
  if (!draw) {
    return NextResponse.json({ error: "invalid_reveal_index" }, { status: 400 });
  }

  const card = getCardById(draw.cardId);
  const dbTopic = normalizeDbTopic(payload.topic);

  const supabase = await createClient();
  const { data: base, error } = await supabase
    .from("base_content")
    .select("body, summary, keywords")
    .eq("card_id", draw.cardId)
    .eq("orientation", draw.orientation)
    .eq("topic", dbTopic)
    .single();

  if (error || !base) {
    Sentry.captureException(error ?? new Error("base_content row missing"), {
      extra: { cardId: draw.cardId, orientation: draw.orientation, topic: payload.topic },
    });
    return NextResponse.json({ error: "base_content_unavailable" }, { status: 500 });
  }

  return NextResponse.json({
    cardId: card.id,
    nameVi: card.name_vi,
    image: `/cards/${card.image_filename}`,
    orientation: draw.orientation,
    base,
  });
}
