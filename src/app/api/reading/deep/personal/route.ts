import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAiProvider, type AiEvent } from "@/lib/ai/provider";
import { requireUser } from "@/lib/auth";
import { buildUserTurn, PERSONAL_LAYER_SYSTEM } from "@/lib/ai/deep-reading-prompt";
import { getCardById } from "@/lib/cards";
import { normalizeDbTopic } from "@/lib/reading";
import { verifyDrawToken } from "@/lib/reading-token";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";
// Stream Sonnet/Gemini có thể mất 20–45s (02-tech-stack.md §3.2) — mặc định
// Vercel Pro không có Fluid Compute là 60s, nhưng để dư cho lúc model chậm
// hoặc bị retry mạng.
export const maxDuration = 120;

// Bước 3 (duy nhất) của Đọc sâu chạm credits + gọi AI thật — trigger bởi
// nút "Đọc sâu cho câu hỏi của bạn" trên UI, sau khi client đã reveal đủ 3
// lá. Trả về NDJSON: mỗi dòng {"type":"delta"|"error"|"done", ...}.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const payload = verifyDrawToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 410 });
  }

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Chặn dùng token của người khác — token tự chứa userId lúc rút bài.
  if (payload.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const readingId = randomUUID();
  const supabaseAdmin = getSupabaseAdmin();
  const { error: debitError } = await supabaseAdmin.rpc("debit_reading", {
    p_user_id: user.id,
    p_reading_id: readingId,
    p_cost: env.DEEP_READING_COST,
  });
  if (debitError) {
    if (debitError.message?.includes("insufficient_credits")) {
      return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
    }
    Sentry.captureException(debitError, { extra: { readingId, userId: user.id } });
    return NextResponse.json({ error: "debit_failed" }, { status: 500 });
  }

  // Lấy từ khoá cho prompt (không truyền toàn văn Lớp Nền — §5.2). Nguồn
  // server, không tin nội dung client tự gửi lại.
  const dbTopic = normalizeDbTopic(payload.topic);
  const cardsForPrompt = await Promise.all(
    payload.cards.map(async (draw) => {
      const card = getCardById(draw.cardId);
      const { data } = await supabaseAdmin
        .from("base_content")
        .select("keywords")
        .eq("card_id", draw.cardId)
        .eq("orientation", draw.orientation)
        .eq("topic", dbTopic)
        .single();
      return {
        nameVi: card.name_vi,
        orientation: draw.orientation,
        keywords: (data?.keywords as string[] | undefined) ?? [],
      };
    }),
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      try {
        let finalEvent: Extract<AiEvent, { type: "final" }> | undefined;
        for await (const event of getAiProvider().streamCompletion({
          system: PERSONAL_LAYER_SYSTEM,
          userTurn: buildUserTurn(payload.topic as any, cardsForPrompt, payload.question),
          // 4000, không phải ~1500 — Gemini 3.6 mặc định bật "thinking", tiêu
          // hao chung ngân sách với phần text trả về (không tắt được, xem
          // src/lib/ai/providers/gemini.ts), nên 350-450 từ yêu cầu (~700
          // token) cần nhiều headroom hơn con số đó gợi ý. Bug thật đã gặp:
          // finishReason=MAX_TOKENS ở ~60 token output với 1500, cắt cụt
          // giữa câu hoặc thoái hoá thành rò rỉ hướng dẫn định dạng.
          maxTokens: 4000,
        })) {
          if (event.type === "delta") {
            send({ type: "delta", text: event.text });
          } else {
            finalEvent = event;
          }
        }
        if (!finalEvent) throw new Error("ai_stream_no_final_event");
        const final = finalEvent;

        if (final.stopReason === "refusal") {
          send({ type: "error", message: "Không thể tạo diễn giải cho câu hỏi này. Credits đã được hoàn." });
          const { error: refundError } = await supabaseAdmin.rpc("refund_reading", {
            p_reading_id: readingId,
          });
          if (refundError) Sentry.captureException(refundError, { extra: { readingId } });
          Sentry.captureMessage("deep reading refusal", {
            extra: { readingId, provider: env.AI_PROVIDER },
          });
          controller.close();
          return;
        }

        if (final.stopReason === "max_tokens") {
          // Bị cắt giữa chừng — bug cấu hình (max_tokens quá thấp so với
          // độ dài prompt yêu cầu), không phải lỗi user. Vẫn lưu nội dung
          // đã có, chỉ cảnh báo để điều chỉnh sau.
          Sentry.captureMessage("deep reading hit max_tokens", { extra: { readingId } });
        }

        const { error: insertError } = await supabaseAdmin.from("readings").insert({
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
          personal_body: final.text,
          ai_provider: env.AI_PROVIDER,
          model: final.model,
          input_tokens: final.usage.inputTokens,
          output_tokens: final.usage.outputTokens,
        });
        if (insertError) {
          Sentry.captureException(insertError, { extra: { readingId } });
        }

        send({ type: "done", readingId });
        controller.close();
      } catch (err) {
        Sentry.captureException(err, { extra: { readingId, userId: user.id } });
        try {
          send({ type: "error", message: "Có lỗi khi tạo diễn giải. Credits đã được hoàn." });
        } catch {
          // controller có thể đã đóng — bỏ qua, lỗi chính đã ghi Sentry ở trên
        }
        const { error: refundError } = await supabaseAdmin.rpc("refund_reading", {
          p_reading_id: readingId,
        });
        if (refundError) Sentry.captureException(refundError, { extra: { readingId } });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
