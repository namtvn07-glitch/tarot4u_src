// Chia 780 combo thành các chunk theo lá bài (mỗi lá luôn nằm trọn trong 1
// chunk) để giao cho từng lần gọi agent — giữ tông giọng nhất quán trong
// phạm vi một lá, và giới hạn kích thước output mỗi lần gọi.
import type { Combo } from './combos.js'
import { buildCombos } from './combos.js'

export interface Chunk {
  chunkId: string
  combos: Combo[]
}

/** cardsPerChunk lá/chunk → 78/cardsPerChunk chunk, mỗi chunk cardsPerChunk*10 combo. */
export function buildChunks(cardsPerChunk: number): Chunk[] {
  const combos = buildCombos()
  const cardIds = [...new Set(combos.map((c) => c.cardId))]
  const chunks: Chunk[] = []
  for (let i = 0; i < cardIds.length; i += cardsPerChunk) {
    const idsInChunk = new Set(cardIds.slice(i, i + cardsPerChunk))
    chunks.push({
      chunkId: `chunk-${String(chunks.length + 1).padStart(2, '0')}`,
      combos: combos.filter((c) => idsInChunk.has(c.cardId)),
    })
  }
  return chunks
}
