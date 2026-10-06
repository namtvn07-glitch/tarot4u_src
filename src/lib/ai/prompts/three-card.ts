import { TOPIC_LABEL } from "@/lib/reading";
import { SUITS, SUIT_LABEL_VI, isSuit, type ReadingContext } from "@/lib/reading-context";
import { SAFETY_PREAMBLE } from "@/lib/ai/prompts/safety";
import { THREE_CARD_PROMPT_BODY } from "@/lib/ai/prompts/text-three-card";

export interface BuiltPrompt {
  system: string;
  userTurn: string;
  maxTokens: number;
}

// Ngân sách cho cả phần "thinking" ẩn của Gemini (không tắt được, xem
// providers/gemini.ts) lẫn khoảng 3.500–5.000 token JSON đầu ra (bài 1100–1400 từ tiếng Việt). Bug thật đã
// gặp ở prompt cũ: MAX_TOKENS cắt cụt giữa chừng khi ngân sách chỉ ~1500.
const THREE_CARD_MAX_TOKENS = 16000;

function describeSuit(suit: string | null): string {
  return isSuit(suit) ? `${suit} (${SUIT_LABEL_VI[suit]})` : "không có (Major Arcana)";
}

export function buildThreeCardPrompt(context: ReadingContext): BuiltPrompt {
  const cardBlocks = context.cards.map((c) =>
    [
      `card_${c.index + 1} — ${c.position.role}`,
      `  card_name: ${c.card.name_vi} (${c.card.name_en})`,
      `  card_number: ${c.card.number}`,
      `  arcana_type: ${c.card.arcana === "major" ? "Major" : "Minor"}`,
      `  suit: ${describeSuit(c.card.suit)}`,
      `  orientation: ${c.orientation === "upright" ? "Upright" : "Reversed"}`,
      `  keywords: ${c.keywords.join(", ")}`,
    ].join("\n"),
  );

  // JSON.stringify chủ ý: câu hỏi người dùng đi vào prompt như một chuỗi đã
  // thoát ký tự, không phải văn bản tự do có thể giả làm một dòng chỉ dẫn.
  const userTurn = [
    `user_question: ${JSON.stringify(context.question ?? "")}`,
    `topic: ${TOPIC_LABEL[context.topic] ?? context.topic}`,
    `major_count: ${context.majorCount}`,
    `minor_count: ${context.minorCount}`,
    `dominant_suit: ${context.dominantSuit === "none" ? "none" : describeSuit(context.dominantSuit)}`,
    `suit_counts: ${SUITS.map((s) => `${s} (${SUIT_LABEL_VI[s]}) ${context.suitCounts[s]}`).join(", ")}`,
    `repeated_number: ${context.repeatedNumber === null ? "none" : context.repeatedNumber}`,
    `court_cards: ${context.courtCount}`,
    `reversed_count: ${context.reversedCount}`,
    ...cardBlocks,
    "Trả về JSON đúng schema, theo đúng các chỉ dẫn trên.",
  ].join("\n\n");

  return {
    system: `${SAFETY_PREAMBLE}\n\n${THREE_CARD_PROMPT_BODY}`,
    userTurn,
    maxTokens: THREE_CARD_MAX_TOKENS,
  };
}
