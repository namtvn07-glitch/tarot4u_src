// Gộp + kiểm tra các file output/chunks/*.json do agent sinh, chuẩn hoá điểm,
// ghi output/daily-content.json. Không gọi mạng.
//
//   node scripts/daily-content/merge.mts                   gộp toàn bộ, ghi output/daily-content.json
//   node scripts/daily-content/merge.mts --strict          như trên, thoát lỗi nếu còn lỗi/thiếu
//   node scripts/daily-content/merge.mts --check <file>    kiểm một file chunk (agent dùng để tự kiểm)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { DAILY_SCORE_KEYS, DailyContentSchema, type DailyContent } from "../../src/lib/ai/schemas/daily.ts";
import { VARIANTS_PER_COMBO, buildJobs, cardById, jobKey, ORIENTATIONS, type Job } from "./combos.mts";
import { lintDailyContent } from "./lint.mts";

const OUTPUT_DIR = fileURLToPath(new URL("./output/", import.meta.url));
const CHUNKS_DIR = join(OUTPUT_DIR, "chunks-v2");
const OUT_PATH = join(OUTPUT_DIR, "daily-content.json");

const RowSchema = DailyContentSchema.extend({
  card_id: z.string(),
  orientation: z.enum(ORIENTATIONS),
  variant: z.number().int().min(1).max(VARIANTS_PER_COMBO),
});
type Row = z.infer<typeof RowSchema>;

interface Entry {
  where: string;
  row: Row;
}

function readEntries(file: string, errors: string[]): Entry[] {
  const entries: Entry[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${file}: không đọc được JSON — ${(error as Error).message}`);
    return entries;
  }
  if (!Array.isArray(raw)) {
    errors.push(`${file}: không phải mảng JSON`);
    return entries;
  }
  raw.forEach((item, index) => {
    const where = `${file.split(/[\\/]/).pop()}[${index}]`;
    const parsed = RowSchema.safeParse(item);
    if (!parsed.success) {
      errors.push(`${where}: sai schema — ${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}`);
      return;
    }
    entries.push({ where, row: parsed.data });
  });
  return entries;
}

function lintEntry(entry: Entry, errors: string[], warnings: string[]) {
  const { row, where } = entry;
  const label = `${where} (${row.card_id}/${row.orientation}/v${row.variant})`;
  // Giá trị mong đợi lấy từ cards.json, không từ chính output — nếu lấy từ output
  // thì kiểm tra "arcana khớp" luôn đúng.
  const result = lintDailyContent(row, {
    arcana: cardById(row.card_id).arcana === "major" ? "Major" : "Minor",
    orientation: row.orientation === "upright" ? "Upright" : "Reversed",
  });
  result.errors.forEach((e) => errors.push(`${label}: ${e}`));
  result.warnings.forEach((w) => warnings.push(`${label}: ${w}`));
}

function checkDistinctVariants(entries: Entry[], errors: string[]) {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = `${entry.row.card_id}__${entry.row.orientation}`;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  for (const [key, group] of groups) {
    for (const field of ["headline", "memorable_message"] as const) {
      const seen = new Set<string>();
      for (const { row } of group) {
        const value = row[field].trim().toLowerCase();
        if (seen.has(value)) errors.push(`${key}: trùng ${field} giữa các biến thể`);
        seen.add(value);
      }
    }
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Cùng một (lá, chiều) phải ra cùng bộ điểm dù lời văn khác nhau — người dùng
// rút Empress hai lần mà thấy 8/10 rồi 6/10 sẽ thấy điểm là ngẫu nhiên.
function normalizeScores(rows: Row[]): Row[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = `${row.card_id}__${row.orientation}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const normalized: Row[] = [];
  for (const group of groups.values()) {
    const scores = Object.fromEntries(
      DAILY_SCORE_KEYS.map((k) => [k, median(group.map((r) => r.daily_scores[k]))]),
    ) as DailyContent["daily_scores"];
    for (const row of group) normalized.push({ ...row, daily_scores: scores });
  }
  return normalized;
}

function main() {
  const args = process.argv.slice(2);
  const checkIdx = args.indexOf("--check");
  const errors: string[] = [];
  const warnings: string[] = [];

  if (checkIdx !== -1) {
    const file = args[checkIdx + 1];
    if (!file) throw new Error("--check cần đường dẫn file chunk");
    const entries = readEntries(file, errors);
    entries.forEach((e) => lintEntry(e, errors, warnings));
    checkDistinctVariants(entries, errors);
    console.log(`${entries.length} mục hợp lệ về schema. Lỗi: ${errors.length}. Cảnh báo: ${warnings.length}.`);
    errors.forEach((e) => console.log(`LỖI  ${e}`));
    warnings.forEach((w) => console.log(`CẢNH BÁO  ${w}`));
    process.exitCode = errors.length > 0 ? 1 : 0;
    return;
  }

  const strict = args.includes("--strict");
  const files = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error(`${CHUNKS_DIR} chưa có file chunk nào`);

  const expected = new Set(buildJobs().map(jobKey));
  const byKey = new Map<string, Entry>();
  for (const file of files) {
    for (const entry of readEntries(join(CHUNKS_DIR, file), errors)) {
      const key = jobKey({
        cardId: entry.row.card_id,
        orientation: entry.row.orientation,
        variant: entry.row.variant,
      } satisfies Job);
      if (!expected.has(key)) errors.push(`${entry.where}: mục lạ ${key}`);
      else if (byKey.has(key)) errors.push(`${entry.where}: trùng ${key}`);
      else byKey.set(key, entry);
    }
  }

  const entries = [...byKey.values()];
  entries.forEach((e) => lintEntry(e, errors, warnings));
  checkDistinctVariants(entries, errors);
  const missing = [...expected].filter((k) => !byKey.has(k));

  console.log(
    `Đọc ${files.length} file. Hợp lệ: ${entries.length}/${expected.size}. Thiếu: ${missing.length}. Lỗi: ${errors.length}. Cảnh báo: ${warnings.length}.`,
  );
  errors.slice(0, 80).forEach((e) => console.log(`LỖI  ${e}`));
  warnings.slice(0, 40).forEach((w) => console.log(`CẢNH BÁO  ${w}`));
  if (missing.length) console.log(`Thiếu ${missing.length}, 10 đầu: ${missing.slice(0, 10).join(", ")}`);

  if (strict && (errors.length > 0 || missing.length > 0)) {
    throw new Error("--strict: còn lỗi hoặc thiếu — không ghi daily-content.json");
  }

  const rows = normalizeScores(entries.map((e) => e.row));
  const out = rows.map((row) => {
    const { card_id, orientation, variant, ...content } = row;
    return {
      card_id,
      orientation,
      variant,
      version: 1,
      content,
      model: "claude-agent-direct",
      generated_at: new Date().toISOString(),
    };
  });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`Đã ghi ${out.length} bản vào ${OUT_PATH} (điểm đã chuẩn hoá theo trung vị).`);
}

main();
