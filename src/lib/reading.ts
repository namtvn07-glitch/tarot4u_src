import { randomInt } from "node:crypto";
import { z } from "zod";
import { CARD_IDS } from "@/lib/cards";

export const TOPICS = ["love", "career", "finance", "spiritual", "general"] as const;
export type Topic = (typeof TOPICS)[number];

export const DB_TOPICS = ["love", "career", "money", "mind", "general"] as const;
export type DbTopic = (typeof DB_TOPICS)[number];

export const TOPIC_LABEL: Record<string, string> = {
  love: "Tình yêu",
  career: "Sự nghiệp",
  finance: "Tài chính",
  money: "Tài chính",
  spiritual: "Tâm linh",
  mind: "Tâm linh",
  general: "Tổng quan",
};

export function normalizeDbTopic(topic: string): DbTopic {
  if (topic === "finance") return "money";
  if (topic === "spiritual") return "mind";
  if (topic === "love" || topic === "career" || topic === "money" || topic === "mind" || topic === "general") {
    return topic;
  }
  return "general";
}

export const TopicSchema = z.enum(["love", "career", "finance", "spiritual", "general", "money", "mind"]);

export type Orientation = "upright" | "reversed";

export interface Draw {
  cardId: string;
  orientation: Orientation;
}

export function drawCard(): Draw {
  const cardId = CARD_IDS[randomInt(CARD_IDS.length)];
  const orientation: Orientation = randomInt(2) === 0 ? "upright" : "reversed";
  return { cardId, orientation };
}

export type OrientationMode = "independent" | "unified";
export const DEEP_SPREAD_SIZE = 3;

export const ReadingRequestSchema = z.object({
  topic: TopicSchema.default("general"),
  count: z.number().int().min(1).max(3).default(1),
  question: z.string().trim().max(500).optional(),
});

export const DeepReadingRequestSchema = z.object({
  topic: TopicSchema.default("general"),
  question: z.string().trim().min(1).max(500),
});

export function drawCards(count: number, mode: OrientationMode = "independent"): Draw[] {
  const deck = [...CARD_IDS];
  const drawn: Draw[] = [];
  const unifiedOrientation: Orientation = randomInt(2) === 0 ? "upright" : "reversed";

  for (let i = 0; i < count; i++) {
    const idx = randomInt(deck.length);
    const [cardId] = deck.splice(idx, 1);
    const orientation: Orientation =
      mode === "unified" ? unifiedOrientation : randomInt(2) === 0 ? "upright" : "reversed";
    drawn.push({ cardId, orientation });
  }
  return drawn;
}
