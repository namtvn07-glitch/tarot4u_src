// Gộp + validate các file output/chunks/*.json — mỗi file do agent sinh
// TRỰC TIẾP (không qua API, không cần key), ghi kết quả gộp vào
// output/base-content.json. Không gọi mạng — chỉ đọc file cục bộ, validate
// zod, và kiểm tra phủ đủ 780 combo trước khi coi là xong.
//
// Chạy: tsx src/merge.ts [--strict]
//   --strict  → thoát lỗi (exit 1) nếu có combo lạ/trùng/thiếu, không ghi file.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildCombos } from './combos.js'
import type { Orientation, Topic } from './combos.js'
import { BaseContentSchema } from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..')
const CHUNKS_DIR = join(PACKAGE_ROOT, 'output', 'chunks')
const OUT_PATH = join(PACKAGE_ROOT, 'output', 'base-content.json')

interface OutputRow {
  card_id: string
  orientation: Orientation
  topic: Topic
  summary: string
  body: string
  keywords: string[]
  model: string
  generated_at: string
  version: 1
}

function comboKey(r: { card_id: string; orientation: string; topic: string }): string {
  return `${r.card_id}__${r.orientation}__${r.topic}`
}

async function main() {
  const strict = process.argv.includes('--strict')

  let files: string[]
  try {
    files = (await readdir(CHUNKS_DIR)).filter((f) => f.endsWith('.json'))
  } catch {
    throw new Error(`Không tìm thấy ${CHUNKS_DIR} — chưa có file chunk nào được sinh.`)
  }
  if (files.length === 0) throw new Error(`${CHUNKS_DIR} rỗng — chưa có file chunk nào.`)

  const expected = new Set(
    buildCombos().map((c) => comboKey({ card_id: c.cardId, orientation: c.orientation, topic: c.topic })),
  )
  const rows = new Map<string, OutputRow>()
  const errors: string[] = []

  for (const file of files) {
    const raw: unknown = JSON.parse(await readFile(join(CHUNKS_DIR, file), 'utf-8'))
    if (!Array.isArray(raw)) {
      errors.push(`${file}: không phải mảng JSON`)
      continue
    }
    raw.forEach((entry: unknown, i: number) => {
      const where = `${file}[${i}]`
      if (!entry || typeof entry !== 'object') {
        errors.push(`${where}: không phải object`)
        return
      }
      const { card_id, orientation, topic } = entry as Record<string, unknown>
      if (typeof card_id !== 'string' || typeof orientation !== 'string' || typeof topic !== 'string') {
        errors.push(`${where}: thiếu card_id/orientation/topic`)
        return
      }
      const k = comboKey({ card_id, orientation, topic })
      if (!expected.has(k)) {
        errors.push(`${where}: combo lạ không nằm trong 780 tổ hợp — ${k}`)
        return
      }
      if (rows.has(k)) {
        errors.push(`${where}: trùng combo đã có ở file khác — ${k}`)
        return
      }
      const parsed = BaseContentSchema.safeParse(entry)
      if (!parsed.success) {
        errors.push(`${where}: zod lỗi — ${parsed.error.message}`)
        return
      }
      const maybeModel = (entry as Record<string, unknown>).model
      const maybeGeneratedAt = (entry as Record<string, unknown>).generated_at
      rows.set(k, {
        card_id,
        orientation: orientation as Orientation,
        topic: topic as Topic,
        summary: parsed.data.summary,
        body: parsed.data.body,
        keywords: parsed.data.keywords,
        model: typeof maybeModel === 'string' ? maybeModel : 'claude-agent-direct',
        generated_at: typeof maybeGeneratedAt === 'string' ? maybeGeneratedAt : new Date().toISOString(),
        version: 1,
      })
    })
  }

  const missing = [...expected].filter((k) => !rows.has(k))

  console.log(`Đọc ${files.length} file chunk. Hợp lệ: ${rows.size}/${expected.size}. Lỗi: ${errors.length}. Thiếu: ${missing.length}.`)
  if (errors.length > 0) {
    console.log('Chi tiết lỗi:')
    for (const e of errors) console.log(`  - ${e}`)
  }
  if (missing.length > 0) {
    console.log(`Thiếu ${missing.length} combo, 10 đầu tiên: ${missing.slice(0, 10).join(', ')}`)
  }

  if (strict && (errors.length > 0 || missing.length > 0)) {
    throw new Error('--strict: có lỗi hoặc thiếu combo — dừng, không ghi output/base-content.json.')
  }

  const output = [...rows.values()]
  await writeFile(OUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Đã ghi ${output.length} dòng vào ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
