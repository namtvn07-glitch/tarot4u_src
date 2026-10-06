// Danh sách việc sinh nội dung Daily: 78 lá × 2 chiều × VARIANTS_PER_COMBO biến
// thể. Đọc read-only data/cards.json. Chạy trực tiếp bằng Node (type stripping),
// không cần bước build — đuôi .mts để `tsc` của repo (include **/*.ts) bỏ qua.
import { readFileSync } from "node:fs";

export const VARIANTS_PER_COMBO = 3;
export const ORIENTATIONS = ["upright", "reversed"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export interface CardRow {
  id: string;
  number: number;
  arcana: "major" | "minor";
  suit: string | null;
  name_en: string;
  name_vi: string;
  upright_keywords: string[];
  reversed_keywords: string[];
}

export interface Job {
  cardId: string;
  orientation: Orientation;
  variant: number;
}

const cardsPath = new URL("../../data/cards.json", import.meta.url);
export const CARDS: CardRow[] = JSON.parse(readFileSync(cardsPath, "utf8")).cards;

export function cardById(id: string): CardRow {
  const card = CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Không có lá ${id}`);
  return card;
}

export function keywordsFor(card: CardRow, orientation: Orientation): string[] {
  return orientation === "upright" ? card.upright_keywords : card.reversed_keywords;
}

export function jobKey(job: Job): string {
  return `${job.cardId}__${job.orientation}__${job.variant}`;
}

export function buildJobs(): Job[] {
  const jobs: Job[] = [];
  for (const card of CARDS) {
    for (const orientation of ORIENTATIONS) {
      for (let variant = 1; variant <= VARIANTS_PER_COMBO; variant++) {
        jobs.push({ cardId: card.id, orientation, variant });
      }
    }
  }
  return jobs;
}

// Mỗi lá nằm trọn trong một chunk để giữ giọng nhất quán giữa 3 biến thể và 2
// chiều của cùng một lá.
export function buildChunks(cardsPerChunk: number): { chunkId: string; cardIds: string[] }[] {
  const chunks: { chunkId: string; cardIds: string[] }[] = [];
  for (let i = 0; i < CARDS.length; i += cardsPerChunk) {
    chunks.push({
      chunkId: `chunk-${String(chunks.length + 1).padStart(2, "0")}`,
      cardIds: CARDS.slice(i, i + cardsPerChunk).map((c) => c.id),
    });
  }
  return chunks;
}
