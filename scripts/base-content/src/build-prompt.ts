import type { Combo } from './combos.js'
import { TOPIC_LABEL } from './combos.js'

/** User turn cho một combo — system prompt (prompt.ts) mang toàn bộ tone/ranh giới. */
export function buildUserPrompt(c: Combo): string {
  return [
    `Lá bài: ${c.nameVi} (${c.orientation === 'upright' ? 'xuôi' : 'ngược'})`,
    `Từ khoá gốc: ${c.keywords.join(', ')}`,
    `Chủ đề: ${TOPIC_LABEL[c.topic]}`,
  ].join('\n')
}
