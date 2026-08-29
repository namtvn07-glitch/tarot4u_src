import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "@/lib/env";
import type { AiEvent, AiProvider, AiStopReason } from "@/lib/ai/provider";

let cached: OpenAI | undefined;

// Lazy trên chủ đích, cùng lý do với getAnthropicClient() ở src/lib/anthropic.ts
// — không đọc env.OPENAI_API_KEY ở module scope để next build không throw
// cho route chưa từng được gọi.
function getOpenaiClient(): OpenAI {
  return (cached ??= new OpenAI({ apiKey: env.OPENAI_API_KEY }));
}

let cachedTriage: OpenAI | undefined;

// Client riêng cho bước kiểm duyệt/triage — dùng TRIAGE_OPENAI_API_KEY nếu
// có set, không thì dùng lại OPENAI_API_KEY. Tách client (không chỉ tách
// model) để 2 vai trò dùng được 2 tài khoản/key OpenAI khác nhau.
function getTriageOpenaiClient(): OpenAI {
  return (cachedTriage ??= new OpenAI({
    apiKey: env.TRIAGE_OPENAI_API_KEY ?? env.OPENAI_API_KEY,
  }));
}

function mapFinishReason(finishReason: string | null): AiStopReason {
  if (finishReason === "content_filter") return "refusal";
  if (finishReason === "length") return "max_tokens";
  return "complete";
}

export const openaiProvider: AiProvider = {
  async *streamCompletion({ system, userTurn, maxTokens }) {
    const aiStream = getOpenaiClient().chat.completions.stream({
      model: env.OPENAI_MODEL,
      max_completion_tokens: maxTokens,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userTurn },
      ],
    });

    for await (const chunk of aiStream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield { type: "delta", text: delta };
    }

    const final = await aiStream.finalChatCompletion();
    const choice = final.choices[0];

    const event: AiEvent = {
      type: "final",
      text: choice?.message.content ?? "",
      stopReason: mapFinishReason(choice?.finish_reason ?? null),
      model: final.model,
      usage: {
        inputTokens: final.usage?.prompt_tokens ?? 0,
        outputTokens: final.usage?.completion_tokens ?? 0,
      },
    };
    yield event;
  },

  async classify({ system, userTurn, schemaName, schema, maxTokens }) {
    // TRIAGE_OPENAI_MODEL nếu có set — không thì dùng lại OPENAI_MODEL
    // (model chính). Chưa đặt default riêng vì chưa xác minh tier
    // "mini/nano" nào chắc chắn khả dụng cho mọi key.
    const completion = await getTriageOpenaiClient().chat.completions.parse({
      model: env.TRIAGE_OPENAI_MODEL ?? env.OPENAI_MODEL,
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userTurn },
      ],
      response_format: zodResponseFormat(schema, schemaName),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
      throw new Error("ai_classify_parse_failed");
    }
    return parsed;
  },
};
