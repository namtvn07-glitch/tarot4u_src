import { getCardById, type Card } from "@/lib/cards";
import { getSpread, type SpreadId, type SpreadPosition } from "@/lib/spreads";
import type { Draw, Orientation } from "@/lib/reading";

// Chỉ `import type` từ reading.ts: file đó kéo theo node:crypto, còn module này
// được cả client (renderer nhãn bộ bài) lẫn server dùng.

export const SUITS = ["wands", "cups", "swords", "pentacles"] as const;
export type Suit = (typeof SUITS)[number];
export type DominantSuit = Suit | "none";

export const SUIT_LABEL_VI: Record<Suit, string> = {
  wands: "Gậy",
  cups: "Cốc",
  swords: "Kiếm",
  pentacles: "Tiền",
};

export function isSuit(value: string | null | undefined): value is Suit {
  return (SUITS as readonly (string | null | undefined)[]).includes(value);
}

export interface ReadingContextCard {
  index: number;
  position: SpreadPosition;
  card: Card;
  orientation: Orientation;
  keywords: string[];
}

export interface ReadingContext {
  spreadId: SpreadId;
  topic: string;
  question: string | null;
  cards: ReadingContextCard[];
  // Tính ở server, không để model đếm — model đếm Major/Minor sai khá thường
  // xuyên, mà prompt bắt buộc nêu con số này trong kết quả.
  majorCount: number;
  minorCount: number;
  dominantSuit: DominantSuit;
  suitCounts: Record<Suit, number>;
  // Con số Ace–10 xuất hiện ở từ 2 lá Minor trở lên (Court Card và Major không tính).
  repeatedNumber: number | null;
  courtCount: number;
  reversedCount: number;
}

// "Dominant" = một suit chiếm ưu thế rõ rệt trong số lá Minor: từ 2 lá trở lên
// VÀ không hoà với suit khác (hoà = không có pattern đáng nói, prompt dặn không
// nhắc tới khi không có pattern).
function pickDominantSuit(cards: Card[]): DominantSuit {
  const counts = new Map<Suit, number>();
  for (const card of cards) {
    if (card.arcana === "minor" && isSuit(card.suit)) {
      counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [top, runnerUp] = ranked;
  if (!top || top[1] < 2) return "none";
  if (runnerUp && runnerUp[1] === top[1]) return "none";
  return top[0];
}

function countSuits(cards: Card[]): Record<Suit, number> {
  const counts: Record<Suit, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  for (const card of cards) {
    if (card.arcana === "minor" && isSuit(card.suit)) counts[card.suit] += 1;
  }
  return counts;
}

// Chỉ Ace–10: số 11–14 của dữ liệu là Page/Knight/Queen/King, đã có `courtCount`.
function pickRepeatedNumber(cards: Card[]): number | null {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (card.arcana === "minor" && card.number >= 1 && card.number <= 10) {
      counts.set(card.number, (counts.get(card.number) ?? 0) + 1);
    }
  }
  const repeated = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  return repeated.length > 0 ? repeated[0][0] : null;
}

export function buildReadingContext(args: {
  spreadId: SpreadId;
  topic: string;
  question: string | null;
  draws: Draw[];
}): ReadingContext {
  const spread = getSpread(args.spreadId);
  if (args.draws.length !== spread.cardCount) {
    throw new Error(
      `reading_context_card_count_mismatch: ${args.spreadId} cần ${spread.cardCount} lá, nhận ${args.draws.length}`,
    );
  }

  const cards: ReadingContextCard[] = args.draws.map((draw, index) => {
    const card = getCardById(draw.cardId);
    return {
      index,
      position: spread.positions[index],
      card,
      orientation: draw.orientation,
      keywords: draw.orientation === "upright" ? card.upright_keywords : card.reversed_keywords,
    };
  });

  const rawCards = cards.map((c) => c.card);
  const majorCount = rawCards.filter((c) => c.arcana === "major").length;

  return {
    spreadId: args.spreadId,
    topic: args.topic,
    question: args.question,
    cards,
    majorCount,
    minorCount: rawCards.length - majorCount,
    dominantSuit: pickDominantSuit(rawCards),
    suitCounts: countSuits(rawCards),
    repeatedNumber: pickRepeatedNumber(rawCards),
    courtCount: rawCards.filter((c) => c.arcana === "minor" && c.number >= 11).length,
    reversedCount: cards.filter((c) => c.orientation === "reversed").length,
  };
}
