// Đọc read-only từ data/cards.json ở root repo — KHÔNG sửa file này.
// `id` ở đây là field đúng để dùng làm `card_id` (ví dụ "the-fool"), không
// phải id minh hoạ khác có thể xuất hiện trong tài liệu 04-database-schema.md.
import cardsData from '../../../data/cards.json' with { type: 'json' }

export const TOPICS = ['love', 'career', 'money', 'mind', 'general'] as const
export type Topic = (typeof TOPICS)[number]

export const TOPIC_LABEL: Record<Topic, string> = {
  love: 'Tình yêu',
  career: 'Công việc',
  money: 'Tài chính',
  mind: 'Tinh thần',
  general: 'Tổng quát',
}

export const ORIENTATIONS = ['upright', 'reversed'] as const
export type Orientation = (typeof ORIENTATIONS)[number]

export interface Combo {
  cardId: string
  nameVi: string
  orientation: Orientation
  topic: Topic
  keywords: string[]
}

/** 78 lá × 2 hướng × 5 chủ đề = 780 tổ hợp, thứ tự cố định theo cards.json. */
export function buildCombos(): Combo[] {
  const combos: Combo[] = []
  for (const card of cardsData.cards) {
    for (const orientation of ORIENTATIONS) {
      const keywords =
        orientation === 'upright' ? card.upright_keywords : card.reversed_keywords
      for (const topic of TOPICS) {
        combos.push({ cardId: card.id, nameVi: card.name_vi, orientation, topic, keywords })
      }
    }
  }
  return combos
}

/**
 * Lấy N combo rải đều qua các lá (dùng bước nhảy thay vì N phần tử đầu tiên)
 * để dry-run phủ nhiều lá khác nhau thay vì chỉ lặp lại vài lá đầu deck.
 */
export function sampleCombos(all: Combo[], n: number): Combo[] {
  if (n >= all.length) return all
  const step = all.length / n
  const sampled: Combo[] = []
  for (let i = 0; i < n; i++) {
    const combo = all[Math.floor(i * step)]
    if (combo) sampled.push(combo)
  }
  return sampled
}
