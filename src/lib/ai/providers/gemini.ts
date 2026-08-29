import { GoogleGenAI, FinishReason } from "@google/genai";
import { z } from "zod";
import { env } from "@/lib/env";
import type { AiEvent, AiProvider, AiStopReason } from "@/lib/ai/provider";

let cached: GoogleGenAI | undefined;

// Lazy trên chủ đích, cùng lý do với getAnthropicClient() ở src/lib/anthropic.ts
// — không đọc env.GEMINI_API_KEY ở module scope để next build không throw
// cho route chưa từng được gọi.
function getGeminiClient(): GoogleGenAI {
  return (cached ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }));
}

let cachedTriage: GoogleGenAI | undefined;

// Client riêng cho bước kiểm duyệt/triage — dùng TRIAGE_GEMINI_API_KEY nếu
// có set, không thì dùng lại GEMINI_API_KEY. Tách client (không chỉ tách
// model) để 2 vai trò dùng được 2 tài khoản/key Gemini khác nhau.
function getTriageGeminiClient(): GoogleGenAI {
  return (cachedTriage ??= new GoogleGenAI({
    apiKey: env.TRIAGE_GEMINI_API_KEY ?? env.GEMINI_API_KEY,
  }));
}

function mapFinishReason(finishReason: FinishReason | undefined): AiStopReason {
  if (
    finishReason === FinishReason.SAFETY ||
    finishReason === FinishReason.PROHIBITED_CONTENT ||
    finishReason === FinishReason.BLOCKLIST
  ) {
    return "refusal";
  }
  if (finishReason === FinishReason.MAX_TOKENS) return "max_tokens";
  return "complete";
}

export const geminiProvider: AiProvider = {
  async *streamCompletion({ system, userTurn, maxTokens }) {
    const aiStream = await getGeminiClient().models.generateContentStream({
      model: env.GEMINI_MODEL,
      contents: userTurn,
      config: { systemInstruction: system, maxOutputTokens: maxTokens },
    });

    let text = "";
    // Gemini không trả một "final response" riêng sau khi stream kết thúc —
    // finishReason/usageMetadata nằm trên (thường là) chunk cuối cùng của
    // chính stream này, nên phải giữ lại giá trị mới nhất thấy được qua mỗi
    // chunk thay vì đọc một lần sau vòng lặp.
    let finishReason: FinishReason | undefined;
    let promptTokenCount = 0;
    let candidatesTokenCount = 0;

    for await (const chunk of aiStream) {
      const delta = chunk.text;
      if (delta) {
        text += delta;
        yield { type: "delta", text: delta };
      }
      const candidateFinish = chunk.candidates?.[0]?.finishReason;
      if (candidateFinish) finishReason = candidateFinish;
      if (chunk.usageMetadata) {
        promptTokenCount = chunk.usageMetadata.promptTokenCount ?? promptTokenCount;
        candidatesTokenCount = chunk.usageMetadata.candidatesTokenCount ?? candidatesTokenCount;
      }
    }

    const event: AiEvent = {
      type: "final",
      text,
      stopReason: mapFinishReason(finishReason),
      model: env.GEMINI_MODEL,
      usage: { inputTokens: promptTokenCount, outputTokens: candidatesTokenCount },
    };
    yield event;
  },

  async classify({ system, userTurn, schema, maxTokens }) {
    // TRIAGE_GEMINI_MODEL nếu có set — không thì dùng lại GEMINI_MODEL
    // (model chính). Chưa đặt default riêng vì chưa xác minh tier
    // "flash" nào chắc chắn khả dụng cho mọi key.
    const response = await getTriageGeminiClient().models.generateContent({
      model: env.TRIAGE_GEMINI_MODEL ?? env.GEMINI_MODEL,
      contents: userTurn,
      config: {
        systemInstruction: system,
        // maxTokens truyền vào đây lớn hơn 200 mặc định của triage (xem
        // src/lib/moderation.ts) — model này không cho tắt thinking qua
        // thinkingConfig (400 INVALID_ARGUMENT khi thử), nên cần đủ ngân
        // sách token cho cả phần suy luận ẩn lẫn JSON trả về.
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        // Gemini không có helper zod chính thức — tự sinh JSON Schema từ
        // cùng schema zod dùng cho mọi provider khác (zod v4 built-in,
        // không cần thêm dependency `zod-to-json-schema`).
        responseJsonSchema: z.toJSONSchema(schema),
      },
    });
    const text = response.text;
    if (!text) {
      throw new Error("ai_classify_parse_failed");
    }
    // responseMimeType/responseJsonSchema không luôn được tuân thủ nghiêm —
    // Gemini đôi khi vẫn thêm lời dẫn trước/sau JSON ("Here is the..."). Lấy
    // đoạn từ dấu `{` đầu tới `}` cuối thay vì parse nguyên văn text.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("ai_classify_parse_failed");
    }
    return schema.parse(JSON.parse(jsonMatch[0]));
  },
};
