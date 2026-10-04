import * as Sentry from "@sentry/nextjs";
import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/provider";
import { withAiRetry } from "@/lib/ai/retry";
import { buildThreeCardPrompt } from "@/lib/ai/prompts/three-card";
import { ThreeCardAiOutputSchema, type ThreeCardResult } from "@/lib/ai/schemas/three-card";
import { finalizeThreeCardResult } from "@/lib/ai/three-card-result";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { DEEP_READING_CREDIT_COST } from "@/lib/orders";
import { buildReadingContext } from "@/lib/reading-context";
import { isTopic } from "@/lib/reading";
import { verifyDrawToken } from "@/lib/reading-token";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Một lượt sinh JSON dài (kể cả "thinking" ẩn của Gemini) có thể mất 20–60s.
export const maxDuration = 120;

// Mỗi lần thử có trần riêng và cả chuỗi nằm gọn trong maxDuration — thà báo lỗi
// và hoàn credits còn hơn để Vercel giết hàm giữa lúc đã trừ tiền.
const GENERATION_RETRY = {
  attempts: 2,
  perAttemptTimeoutMs: 70_000,
  baseDelayMs: 800,
  maxTotalMs: 110_000,
};

// Nhịp "tim" gửi định kỳ để proxy/CDN không cắt kết nối im lặng khi chờ model.
const HEARTBEAT_MS = 5_000;

const RequestSchema = z.object({
  token: z.string().min(1),
  // true = chỉ LẤY LẠI kết quả của token này nếu đã có, không bao giờ trừ credits
  // hay gọi AI. Dùng khi tải lại trang giữa lúc đang chờ.
  replayOnly: z.boolean().optional(),
});

type Outcome =
  | { ok: true; result: ThreeCardResult; readingId: string }
  | { ok: false; message: string };

// Phong bì NDJSON: mỗi dòng {"type":"progress"|"result"|"error", ...}. Hiện chỉ
// phát `progress` làm nhịp tim rồi MỘT `result` — giữ nguyên giao thức để sau này
// (trải 5 lá, chờ lâu hơn) có thể stream từng khối mà không đổi client.
function ndjsonResponse(run: (send: (event: Record<string, unknown>) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      const send = (event: Record<string, unknown>) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // Client đã ngắt. Việc sinh/lưu kết quả KHÔNG phụ thuộc vào đường này.
          isClosed = true;
        }
      };
      try {
        await run(send);
      } finally {
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}

// Bước 3 (duy nhất) của Đọc sâu chạm credits + gọi AI thật — bấm "Mở khoá luận
// giải" sau khi đã lật đủ 3 lá. Server chờ đủ JSON, kiểm tra theo schema, lưu,
// rồi mới trả về MỘT lần (xem phong bì NDJSON ở trên).
export async function POST(request: Request) {
  const parsedBody = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { token, replayOnly } = parsedBody.data;

  const payload = verifyDrawToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 410 });
  }

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Chặn dùng token của người khác — token tự chứa userId lúc rút bài. Token
  // ký lúc ẩn danh (userId null, xem shuffle/route.ts) được phép "nhận" bởi
  // BẤT KỲ user nào đăng nhập rồi gọi tới đây với đúng token đó — token tự
  // nó là bí mật ký HMAC, không đoán/rò rỉ chéo user được, nên không cần bắt
  // rút bài lại chỉ vì họ đăng nhập sau khi xem xong Lớp Nền.
  if (payload.userId && payload.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Nhúng sẵn trong token (ký 1 lần lúc /shuffle hoặc /resume) — KHÔNG tự
  // sinh randomUUID() ở đây. 2 request cùng token (double-click, tải lại trang)
  // luôn cùng readingId.
  const readingId = payload.readingId;
  const admin = getSupabaseAdmin();

  // Đã có kết quả cho token này (bấm đúp, hoặc tải lại trang sau khi server đã
  // sinh xong) → trả lại đúng bản đó, không trừ thêm, không gọi AI lần hai.
  const { data: existingReading } = await admin
    .from("readings")
    .select("result")
    .eq("id", readingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingReading?.result) {
    const stored = existingReading.result as ThreeCardResult;
    return ndjsonResponse(async (send) => {
      send({ type: "result", result: stored, readingId });
    });
  }

  const { data: existingDebit } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("reason", "reading")
    .eq("ref_id", readingId)
    .maybeSingle();

  if (replayOnly) {
    if (!existingDebit) return NextResponse.json({ error: "not_started" }, { status: 404 });
    const { data: refund } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("reason", "refund")
      .eq("ref_id", readingId)
      .maybeSingle();
    // Đã hoàn tiền = lượt này thất bại hẳn, không còn gì để chờ.
    if (refund) return NextResponse.json({ error: "refunded" }, { status: 410 });
    return NextResponse.json({ error: "already_processing" }, { status: 409 });
  }

  // Chặn double-submit trước khi trừ credits/gọi AI — debit_reading() vẫn
  // idempotent theo ref_id nên tiền không bị trừ 2 lần dù thiếu bước này,
  // nhưng thiếu nó thì request trùng vẫn lọt qua gọi AI (tốn API cost oan).
  if (existingDebit) {
    return NextResponse.json({ error: "already_processing" }, { status: 409 });
  }

  const { data: debited, error: debitError } = await admin.rpc("debit_reading", {
    p_user_id: user.id,
    p_reading_id: readingId,
    p_cost: DEEP_READING_CREDIT_COST,
  });
  if (debitError) {
    if (debitError.message?.includes("insufficient_credits")) {
      return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
    }
    Sentry.captureException(debitError, { extra: { readingId, userId: user.id } });
    return NextResponse.json({ error: "debit_failed" }, { status: 500 });
  }
  // false = race thật (request khác đã debit cho đúng readingId này trước khi
  // bước check ở trên kịp thấy) — debit_reading() tự rollback phần vừa trừ.
  // Dừng ngay, không gọi AI/ghi readings trùng lần 2.
  if (!debited) {
    return NextResponse.json({ error: "already_processing" }, { status: 409 });
  }

  const refund = async () => {
    const { data: refunded, error } = await admin.rpc("refund_reading", { p_reading_id: readingId });
    if (error) Sentry.captureException(error, { extra: { readingId } });
    // false ở đây bất thường (vừa debit thành công) — ghi lại để không hoàn 2 lần.
    if (refunded === false) {
      Sentry.captureMessage("refund_reading no-op sau debit thành công", { extra: { readingId } });
    }
  };

  // Toàn bộ việc sinh + kiểm tra + lưu nằm trong MỘT promise không bao giờ ném
  // lỗi. Nó được giữ sống bằng after() độc lập với kết nối của client: người
  // dùng đóng tab giữa lúc chờ vẫn nhận được kết quả trong Lịch sử, thay vì
  // mất credits vô ích.
  const generation: Promise<Outcome> = (async (): Promise<Outcome> => {
    try {
      const context = buildReadingContext({
        spreadId: "three_card",
        topic: isTopic(payload.topic) ? payload.topic : "general",
        question: payload.question,
        draws: payload.cards,
      });
      const prompt = buildThreeCardPrompt(context);
      const provider = getAiProvider();

      const generated = await withAiRetry(
        async () => {
          const attempt = await provider.generateJson({
            system: prompt.system,
            userTurn: prompt.userTurn,
            schemaName: "three_card_reading",
            schema: ThreeCardAiOutputSchema,
            maxTokens: prompt.maxTokens,
          });
          // Kiểm số lá TRONG lần thử, để lỗi này được sinh lại thay vì lọt ra ngoài.
          return { ...attempt, result: finalizeThreeCardResult(attempt.data, context) };
        },
        {
          ...GENERATION_RETRY,
          onRetry: (error, attemptNumber, delayMs) => {
            Sentry.addBreadcrumb({
              category: "ai.deep-reading",
              level: "warning",
              message: `sinh luận giải thử lại lần ${attemptNumber} sau ${delayMs}ms`,
              data: { error: error instanceof Error ? error.message : String(error) },
            });
          },
        },
      );

      if (generated.stopReason === "max_tokens") {
        // JSON vẫn hợp lệ nên không hỏng, nhưng sát trần — cần nâng maxTokens.
        Sentry.captureMessage("deep reading hit max_tokens", { extra: { readingId } });
      }

      const { error: insertError } = await admin.from("readings").insert({
        id: readingId,
        user_id: user.id,
        topic: payload.topic,
        spread: "three_card",
        tier: "deep",
        cards_drawn: payload.cards.map((c, i) => ({
          card_id: c.cardId,
          orientation: c.orientation,
          position: i,
        })),
        question: payload.question,
        // Không ghi `personal_body` (bản sao chữ của `result`): mọi nơi hiển thị
        // giờ đã đọc `result`; ghi cả hai là lưu mỗi lượt hai lần cùng một nội dung.
        result: generated.result,
        ai_provider: env.AI_PROVIDER,
        model: generated.model,
        input_tokens: generated.usage.inputTokens,
        output_tokens: generated.usage.outputTokens,
      });
      // Người dùng đã trả tiền và đã có kết quả trong tay — không biến lỗi lưu
      // thành lỗi của họ, chỉ ghi lại để xử lý.
      if (insertError) Sentry.captureException(insertError, { extra: { readingId } });

      return { ok: true, result: generated.result, readingId };
    } catch (error) {
      const isRefusal = error instanceof Error && error.message === "ai_refusal";
      Sentry.captureException(error, { extra: { readingId, userId: user.id, provider: env.AI_PROVIDER } });
      await refund();
      return {
        ok: false,
        message: isRefusal
          ? "Không thể tạo diễn giải cho câu hỏi này. Credits đã được hoàn."
          : "Có lỗi khi tạo diễn giải. Credits đã được hoàn.",
      };
    }
  })();

  after(async () => {
    await generation;
  });

  return ndjsonResponse(async (send) => {
    let stage = 0;
    send({ type: "progress", stage });
    const heartbeat = setInterval(() => send({ type: "progress", stage: ++stage }), HEARTBEAT_MS);
    try {
      const outcome = await generation;
      if (outcome.ok) {
        send({ type: "result", result: outcome.result, readingId: outcome.readingId });
      } else {
        send({ type: "error", message: outcome.message });
      }
    } finally {
      clearInterval(heartbeat);
    }
  });
}
