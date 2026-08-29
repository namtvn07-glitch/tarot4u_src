import cardsData from "../../data/cards.json";

export type Arcana = "major" | "minor";

export interface Card {
  id: string;
  number: number;
  arcana: Arcana;
  suit: string | null;
  name_en: string;
  name_vi: string;
  image_filename: string;
  upright_keywords: string[];
  reversed_keywords: string[];
}

export const CARDS: Card[] = cardsData.cards as Card[];

export const CARD_IDS: string[] = CARDS.map((c) => c.id);

const CARDS_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCardById(id: string): Card {
  const card = CARDS_BY_ID.get(id);
  if (!card) {
    throw new Error(`Unknown card id: ${id}`);
  }
  return card;
}

export function getAllCards(): Card[] {
  return CARDS;
}

export function getMajorArcana(): Card[] {
  return CARDS.filter((c) => c.arcana === "major");
}

export function getMinorArcana(suit?: string): Card[] {
  if (!suit) return CARDS.filter((c) => c.arcana === "minor");
  return CARDS.filter((c) => c.arcana === "minor" && c.suit === suit);
}
