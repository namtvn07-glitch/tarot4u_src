import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, getTriageAnthropicClient } from "@/lib/anthropic";
import { env } from "@/lib/env";
import type { AiEvent, AiProvider, AiStopReason } from "@/lib/ai/provider";

function mapStopReason(stopReason: string | null): AiStopReason {
  if (stopReason === "refusal") return "refusal";
  if (stopReason === "max_tokens") return "max_tokens";
  return "complete";
}

export const anthropicProvider: AiProvider = {
  async *streamCompletion({ system, userTurn, maxTokens }) {
    const aiStream = getAnthropicClient().messages.stream({
      model: env.ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      // Sonnet 5 mặc định BẬT adaptive thinking khi không truyền `thinking`
      // — phải tắt tường minh (xác minh qua skill claude-api).
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: userTurn }],
    });

    for await (const event of aiStream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "delta", text: event.delta.text };
      }
    }

    const final = await aiStream.finalMessage();
    const text = final.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("");

    const event: AiEvent = {
      type: "final",
      text,
      stopReason: mapStopReason(final.stop_reason),
      model: final.model,
      usage: { inputTokens: final.usage.input_tokens, outputTokens: final.usage.output_tokens },
    };
    yield event;
  },

  async classify({ system, userTurn, schema, maxTokens }) {
    const response = await getTriageAnthropicClient().messages.parse({
      // Model triage riêng (TRIAGE_ANTHROPIC_MODEL, mặc định Haiku 4.5) —
      // độc lập với env.ANTHROPIC_MODEL, model đó là cho Lớp Cá nhân.
      model: env.TRIAGE_ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      // KHÔNG truyền `effort` — Haiku 4.5 không hỗ trợ, trả lỗi 400 nếu có.
      system,
      messages: [{ role: "user", content: userTurn }],
      output_config: { format: zodOutputFormat(schema) },
    });
    // SDK không tự throw khi parse thất bại — parsed_output có thể null.
    if (!response.parsed_output) {
      throw new Error("ai_classify_parse_failed");
    }
    return response.parsed_output;
  },
};
