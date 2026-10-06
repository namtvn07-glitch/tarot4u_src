import * as Sentry from "@sentry/nextjs";
import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { pickCard, pickVariant } from "@/lib/daily-draw";
import { vietnamToday } from "@/lib/daily-day";
import {
  invalidateApprovedIndex,
  loadApprovedContent,
  loadApprovedIndex,
  readingToDailyDraw,
  toCardInfo,
} from "@/lib/daily-server";
import type {
  DailyDraw,
  DailyDrawResponse,
  DailyErrorCode,
  DailyResult,
  DailyState,
} from "@/lib/daily-types";
import { checkRateLimit, relaxInDev, resolveRateLimitIdentity } from "@/lib/rate-limit";
import { DAILY_MAX_DRAWS_PER_DAY, DAILY_PAID_COST_CREDITS } from "@/lib/spreads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Lịch sử đủ dài để thấy nhiều chu kỳ 78 lá — chọn biến thể chưa xem cần biết
// lần cuối người này gặp đúng (lá, chiều) này.
const HISTORY_LIMIT = 400;

const DrawRequestSchema = z.object({ drawId: z.uuid() });

function fail(error: DailyErrorCode, status: number) {
  return NextResponse.json({ error }, { status });
}

async function readCredits(userId: string): Promise<number | null> {
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .maybeSingle();
  return typeof data?.credits === "number" ? data.credits : null;
}

// GET — trạng thái hôm nay để giao diện biết nên hiện lá đã rút, hay bộ bài úp
// kèm "miễn phí" / "1 credit".
export async function GET() {
  const day = vietnamToday();
  const base = {
    day,
    maxDraws: DAILY_MAX_DRAWS_PER_DAY,
    costCredits: DAILY_PAID_COST_CREDITS,
  };

  const user = await requireUser();
  if (!user) {
    const state: DailyState = {
      ...base,
      authenticated: false,
      isAnonymous: false,
      drawsToday: 0,
      freeAvailable: true,
      creditsRemaining: null,
      today: null,
    };
    return NextResponse.json(state);
  }

  const admin = getSupabaseAdmin();
  const [drawsResult, latestResult, creditsRemaining] = await Promise.all([
    admin.from("daily_draws").select("reading_id, kind").eq("user_id", user.id).eq("day", day),
    admin
      .from("readings")
      .select("id, cards_drawn, result")
      .eq("user_id", user.id)
      .eq("daily_date", day)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    readCredits(user.id),
  ]);

  if (drawsResult.error || latestResult.error) {
    Sentry.captureException(drawsResult.error ?? latestResult.error, {
      extra: { userId: user.id, day },
    });
    return fail("daily_draw_failed", 500);
  }

  const draws = (drawsResult.data ?? []) as { reading_id: string; kind: "free" | "paid" }[];
  const latest = latestResult.data;
  const kind = draws.find((d) => d.reading_id === latest?.id)?.kind ?? "free";

  const state: DailyState = {
    ...base,
    authenticated: true,
    isAnonymous: user.isAnonymous,
    drawsToday: draws.length,
    freeAvailable: !draws.some((d) => d.kind === "free"),
    creditsRemaining,
    today: latest ? readingToDailyDraw(latest, kind, day) : null,
  };
  return NextResponse.json(state);
}

// Chỉ đúng ba trường quyết định "đã gặp gì" — rút gọn bằng JSON path ngay ở DB để
// khỏi kéo về cả mảng cards_drawn cho tới 400 dòng mỗi lượt rút.
interface HistoryRow {
  card_id: string | null;
  orientation: string | null;
  variant: string | null;
}

// POST — rút một lá. `drawId` là khoá idempotency do client sinh cho mỗi ý định
// "rút một lá": bấm đúp hay gửi lại cùng drawId chỉ ra MỘT lượt và một lần trừ tiền.
export async function POST(request: Request) {
  const parsed = DrawRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("invalid_request", 400);
  const { drawId } = parsed.data;

  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  // Daily gần như không tốn chi phí (nội dung sinh sẵn) nên hạn mức này chỉ là
  // lưới chống phá hoại ghi DB, không phải chống đốt tiền AI — vì vậy cao: một
  // IP di động VN có thể là cả nhóm người lạ (xem comment ở shuffle/route.ts).
  // Trần thật 5 lượt/ngày/người do RPC thực thi.
  const identity = resolveRateLimitIdentity(user, request);
  const [window, max] =
    identity.scope === "user" ? [3600, relaxInDev(60)] : [86400, relaxInDev(300)];
  let allowed: boolean;
  try {
    allowed = await checkRateLimit(`reading-daily:${identity.scope}:${identity.token}`, window, max);
  } catch (error) {
    Sentry.captureException(error, { extra: { userId: user.id } });
    return fail("daily_draw_failed", 500);
  }
  if (!allowed) return fail("rate_limited", 429);

  const admin = getSupabaseAdmin();
  const { data: claim, error: claimError } = await admin.rpc("claim_daily_draw", {
    p_user_id: user.id,
    p_draw_id: drawId,
    p_max_draws: DAILY_MAX_DRAWS_PER_DAY,
    p_cost: DAILY_PAID_COST_CREDITS,
  });
  if (claimError) {
    const message = claimError.message ?? "";
    if (message.includes("daily_limit_reached")) return fail("daily_limit_reached", 429);
    if (message.includes("insufficient_credits")) return fail("insufficient_credits", 402);
    Sentry.captureException(claimError, { extra: { userId: user.id, drawId } });
    return fail("daily_draw_failed", 500);
  }

  const { kind, reading_id: readingId, day } = claim as {
    kind: "free" | "paid" | "replay";
    reading_id: string;
    day: string;
  };

  // Gửi lại cùng drawId: trả đúng kết quả đã có. Chưa có dòng readings nghĩa là
  // request đầu vẫn đang chạy — báo "đang xử lý" thay vì sinh lần hai.
  if (kind === "replay") {
    const { data: existing } = await admin
      .from("readings")
      .select("id, cards_drawn, result")
      .eq("id", readingId)
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: ledger } = await admin
      .from("daily_draws")
      .select("kind")
      .eq("reading_id", readingId)
      .maybeSingle();
    const draw = existing
      ? readingToDailyDraw(existing, (ledger?.kind as "free" | "paid") ?? "free", day)
      : null;
    if (!draw) return fail("already_processing", 409);
    return NextResponse.json({
      ...draw,
      creditsRemaining: await readCredits(user.id),
    } satisfies DailyDrawResponse);
  }

  // Từ đây lượt đã được tính (và đã trừ tiền nếu là paid). Mọi lỗi phải nhả lượt.
  const release = async () => {
    const { error } = await admin.rpc("release_daily_draw", { p_reading_id: readingId });
    if (error) Sentry.captureException(error, { extra: { readingId, kind } });
  };

  try {
    const index = await loadApprovedIndex();
    const availableIds = [...new Set(index.map((e) => e.card_id))];
    if (availableIds.length === 0) throw new Error("daily_content_unavailable");

    // `daily_date is not null` + order theo daily_date khớp index một phần
    // readings_user_daily (user_id, daily_date) — lọc theo `tier` thì Postgres phải
    // quét cả những lượt Đọc sâu của người này.
    const { data: historyData, error: historyError } = await admin
      .from("readings")
      .select("card_id:cards_drawn->0->>card_id, orientation:cards_drawn->0->>orientation, variant:result->>variant")
      .eq("user_id", user.id)
      .not("daily_date", "is", null)
      .order("daily_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    if (historyError) throw historyError;

    const history = ((historyData ?? []) as unknown as HistoryRow[]).map((row) => ({
      cardId: row.card_id ?? "",
      orientation: row.orientation === "reversed" ? "reversed" : "upright",
      variant: Number(row.variant),
    }));

    const cardId = pickCard(
      availableIds,
      history.map((h) => h.cardId),
      randomInt,
    );

    const orientations = [
      ...new Set(index.filter((e) => e.card_id === cardId).map((e) => e.orientation)),
    ];
    const orientation = orientations[randomInt(orientations.length)];

    const variant = pickVariant(
      [...new Set(index.filter((e) => e.card_id === cardId && e.orientation === orientation).map((e) => e.variant))],
      history
        .filter((h) => h.cardId === cardId && h.orientation === orientation)
        .map((h) => h.variant),
      randomInt,
    );

    const loaded = await loadApprovedContent(cardId, orientation, variant);
    if (!loaded) {
      invalidateApprovedIndex();
      throw new Error("daily_content_unavailable");
    }

    const result: DailyResult = { version: 1, spread: "daily", variant, content: loaded.content };
    const { error: insertError } = await admin.from("readings").insert({
      id: readingId,
      user_id: user.id,
      topic: "general",
      spread: "one_card",
      tier: "daily",
      cards_drawn: [{ card_id: cardId, orientation, position: 0 }],
      question: null,
      // Không ghi `personal_body`: nó chỉ là bản sao chữ của `result` (~0,7 KB/lượt) mà
      // mọi nơi hiển thị giờ đã đọc `result`. Cột này chỉ còn ý nghĩa với bản ghi cũ.
      model: loaded.model,
      result,
      daily_date: day,
    });
    if (insertError) throw insertError;

    const draw: DailyDraw = {
      readingId,
      kind,
      day,
      card: toCardInfo(cardId, orientation),
      content: loaded.content,
    };
    return NextResponse.json({
      ...draw,
      creditsRemaining: await readCredits(user.id),
    } satisfies DailyDrawResponse);
  } catch (error) {
    await release();
    const unavailable =
      error instanceof Error &&
      (error.message === "daily_content_unavailable" ||
        error.message === "daily_no_cards_available" ||
        error.message === "daily_no_variants_available");
    Sentry.captureException(error, { extra: { userId: user.id, readingId, kind } });
    return unavailable ? fail("daily_content_unavailable", 503) : fail("daily_draw_failed", 500);
  }
}
