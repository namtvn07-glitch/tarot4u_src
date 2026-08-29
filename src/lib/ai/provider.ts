import type { z } from "zod";
import { env } from "@/lib/env";
import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import { openaiProvider } from "@/lib/ai/providers/openai";
import { geminiProvider } from "@/lib/ai/providers/gemini";

export type AiStopReason = "complete" | "refusal" | "max_tokens";

export type AiEvent =
  | { type: "delta"; text: string }
  | {
      type: "final";
      text: string;
      stopReason: AiStopReason;
      model: string;
      usage: { inputTokens: number; outputTokens: number };
    };

export interface AiClassifyArgs<T> {
  system: string;
  userTurn: string;
  // Tên model-visible cho schema (OpenAI `zodResponseFormat` yêu cầu) — không
  // dùng cho Anthropic/Gemini nhưng vẫn truyền để interface đồng nhất.
  schemaName: string;
  schema: z.ZodType<T>;
  maxTokens: number;
}

export interface AiProvider {
  streamCompletion(args: {
    system: string;
    userTurn: string;
    maxTokens: number;
  }): AsyncGenerator<AiEvent>;
  // Sinh 1 lần, không stream, trả về object đã validate theo `schema` — dùng
  // cho bước kiểm duyệt/triage câu hỏi (src/lib/moderation.ts), không phải
  // cho Lớp Cá nhân (đó là streamCompletion).
  classify<T>(args: AiClassifyArgs<T>): Promise<T>;
}

const providers: Record<typeof env.AI_PROVIDER, AiProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

// Mỗi provider tự lazy-init client bên trong module riêng (xem
// src/lib/anthropic.ts) — factory này chỉ chọn implementation theo
// AI_PROVIDER, không tự tạo client nào, nên không rủi ro chạm API key lúc
// module graph được đánh giá tĩnh ở build time.
export function getAiProvider(): AiProvider {
  return providers[env.AI_PROVIDER];
}

// Bước kiểm duyệt/triage (src/lib/moderation.ts) chọn provider RIÊNG, qua
// TRIAGE_AI_PROVIDER — cố ý tách khỏi getAiProvider()/AI_PROVIDER phía trên.
// Đổi AI_PROVIDER để so sánh chất lượng model cho Lớp Cá nhân không được
// kéo theo đổi luôn hãng/key dùng cho kiểm duyệt an toàn.
export function getTriageAiProvider(): AiProvider {
  return providers[env.TRIAGE_AI_PROVIDER];
}
