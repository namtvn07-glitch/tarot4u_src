import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
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
  // Chặn dùng token của người khác — token tự chứa userId lúc rút bài. Token
  // ký lúc ẩn danh (userId null, xem shuffle/route.ts) được phép "nhận" bởi
  // BẤT KỲ user nào đăng nhập rồi gọi tới đây với đúng token đó — token tự
  // nó là bí mật ký HMAC, không đoán/rò rỉ chéo user được, nên không cần bắt
  // rút bài lại chỉ vì họ đăng nhập sau khi xem xong Lớp Nền.
  if (payload.userId && payload.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Nhúng sẵn trong token (ký 1 lần lúc /shuffle hoặc /resume) — KHÔNG tự
  // sinh randomUUID() ở đây nữa. 2 request cùng token (double-click, script
  // gọi song song) giờ luôn cùng readingId.
  const readingId = payload.readingId;
  const supabaseAdmin = getSupabaseAdmin();

  // Chặn double-submit trước khi trừ credits/gọi AI — debit_reading() vẫn
  // idempotent theo ref_id nên tiền không bị trừ 2 lần dù thiếu bước này,
  // nhưng thiếu nó thì request trùng vẫn lọt qua gọi AI + ghi thêm 1 dòng
  // readings trùng lặp (tốn API cost oan, không chỉ là vấn đề tiền).
  const { data: existingDebit } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("reason", "reading")
    .eq("ref_id", readingId)
    .maybeSingle();
  if (existingDebit) {
    return NextResponse.json({ error: "already_processing" }, { status: 409 });
  }

  const { data: debited, error: debitError } = await supabaseAdmin.rpc("debit_reading", {
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
  // false = race thật (request khác đã debit cho đúng readingId này trước
  // khi bước check ở trên kịp thấy) — debit_reading() tự rollback phần vừa
  // trừ, hàm này chỉ nhận đúng false, không cần tự lo an toàn tiền nữa. Dừng
  // ngay, không gọi AI/ghi readings trùng lần 2.
  if (!debited) {
    return NextResponse.json({ error: "already_processing" }, { status: 409 });
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
          const { data: refunded, error: refundError } = await supabaseAdmin.rpc("refund_reading", {
            p_reading_id: readingId,
          });
          if (refundError) Sentry.captureException(refundError, { extra: { readingId } });
          // false ở đây bất thường (vừa debit thành công ngay phía trên) —
          // đáng ghi lại dù không phải lỗi nghiêm trọng để không hoàn 2 lần.
          if (refunded === false) Sentry.captureMessage("refund_reading no-op sau debit thành công", { extra: { readingId } });
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
          // AI provider có thể trả tiếng Việt ở dạng NFD (dấu tách rời khỏi
          // ký tự gốc) — client stream tự normalize NFC trước khi hiển thị
          // nên không thấy lỗi lúc đó, nhưng nếu lưu thẳng final.text (NFD)
          // thì lần xem lại sau (đọc thẳng từ DB, không qua bước normalize
          // của luồng stream) sẽ hiện dấu câu bị tách, ngắt dòng sai chỗ.
          personal_body: final.text.normalize("NFC"),
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
        const { data: refunded, error: refundError } = await supabaseAdmin.rpc("refund_reading", {
          p_reading_id: readingId,
        });
        if (refundError) Sentry.captureException(refundError, { extra: { readingId } });
        if (refunded === false) Sentry.captureMessage("refund_reading no-op sau debit thành công", { extra: { readingId } });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
