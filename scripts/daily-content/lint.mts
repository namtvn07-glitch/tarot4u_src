// Kiểm tra tự động cho MỌI bản Daily trước khi vào DB. Lỗi (error) chặn import;
// cảnh báo (warning) để người duyệt cân nhắc.
import { DAILY_SCORE_KEYS, type DailyContent } from "../../src/lib/ai/schemas/daily.ts";

export interface LintResult {
  errors: string[];
  warnings: string[];
}

// Từ cấm tuyệt đối (ranh giới an toàn). "chắc chắn" hợp lệ khi phủ định
// ("không chắc chắn", "chưa chắc chắn") nên dùng lookbehind.
const BANNED: { pattern: RegExp; label: string }[] = [
  { pattern: /(?<!không |chưa )chắc chắn/i, label: "chắc chắn" },
  { pattern: /định mệnh/i, label: "định mệnh" },
  { pattern: /số phận/i, label: "số phận" },
  { pattern: /tiên tri/i, label: "tiên tri" },
];

// Sáo ngữ self-help mà Prompt 01 dặn tránh — chỉ cảnh báo vì prompt cho phép
// khi "thực sự xuất phát từ lá bài và được cụ thể hoá".
const CLICHES = ["yêu thương bản thân", "tin vào vũ trụ", "chữa lành"];

// Khuyến nghị tài chính cụ thể bị cấm — cảnh báo để người duyệt đọc lại câu đó.
const FINANCE_RISK = /(đầu tư|cổ phiếu|bitcoin|crypto|chứng khoán|vay nợ|mua vàng|đáo hạn)/i;

const TEXT_FIELDS = ["love", "career", "finance", "insight", "advice"] as const;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text: string): number {
  return text.split(/[.!?…]+(?:\s|$)/).filter((s) => s.trim().length > 0).length;
}

export function allText(content: DailyContent): string {
  return [
    content.summary,
    content.headline,
    ...content.forecast,
    content.love,
    content.career,
    content.finance,
    content.insight,
    content.memorable_message,
    content.advice,
  ].join(" ");
}

export function lintDailyContent(
  content: DailyContent,
  expected: { arcana: "Major" | "Minor"; orientation: "Upright" | "Reversed" },
): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of DAILY_SCORE_KEYS) {
    const score = content.daily_scores[key];
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      errors.push(`điểm ${key}=${score} ngoài khoảng 1–10`);
    }
  }

  if (content.card.arcana !== expected.arcana) {
    errors.push(`card.arcana="${content.card.arcana}" lệch với ${expected.arcana}`);
  }
  if (content.card.orientation !== expected.orientation) {
    errors.push(`card.orientation="${content.card.orientation}" lệch với ${expected.orientation}`);
  }

  if (content.forecast.length < 2 || content.forecast.length > 3) {
    errors.push(`forecast có ${content.forecast.length} mục (cần 2–3)`);
  }
  if (content.keywords.length < 3) errors.push(`keywords chỉ có ${content.keywords.length} (cần ≥ 3)`);

  const summaryWords = wordCount(content.summary);
  if (summaryWords > 30) errors.push(`summary ${summaryWords} từ (tối đa 25)`);
  else if (summaryWords > 25) warnings.push(`summary ${summaryWords} từ (khuyến nghị ≤ 25)`);
  if (wordCount(content.memorable_message) < 3) errors.push("memorable_message quá ngắn hoặc rỗng");
  if (!content.headline.trim()) errors.push("headline rỗng");

  const words = wordCount(allText(content));
  if (words < 200 || words > 420) errors.push(`tổng ${words} từ (cần ~250–350, ngưỡng cứng 200–420)`);
  else if (words < 250 || words > 350) warnings.push(`tổng ${words} từ (khuyến nghị 250–350)`);

  for (const field of TEXT_FIELDS) {
    const count = sentenceCount(content[field]);
    if (count > 3) errors.push(`${field} có ${count} câu (tối đa 3 câu mỗi đoạn)`);
    if (!content[field].trim()) errors.push(`${field} rỗng`);
  }

  const text = allText(content);
  for (const { pattern, label } of BANNED) {
    if (pattern.test(text)) errors.push(`chứa từ cấm "${label}"`);
  }
  if (/[*#_`]|\[|\]/.test(text)) errors.push("chứa ký tự markdown (đầu ra phải là chữ thuần)");
  for (const phrase of CLICHES) {
    if (text.toLowerCase().includes(phrase)) warnings.push(`sáo ngữ "${phrase}"`);
  }
  if (FINANCE_RISK.test(content.finance)) warnings.push("finance nhắc tới đầu tư/giao dịch — đọc lại");

  return { errors, warnings };
}
