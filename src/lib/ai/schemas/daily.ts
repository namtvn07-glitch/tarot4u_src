import { z } from "zod";

// Hình dạng JSON của Prompt 01 (Daily). Schema đưa cho provider chỉ chứa các
// ràng buộc mọi provider đều hiểu (kiểu, mảng) — OpenAI/Anthropic structured
// output không chấp nhận min/max trên số. Khoảng giá trị (điểm 1–10), độ dài,
// từ cấm được kiểm ở `lintDailyContent` (scripts/daily-content), không ở đây.
export const DailyScoresSchema = z.object({
  overall: z.number().int(),
  love: z.number().int(),
  career: z.number().int(),
  finance: z.number().int(),
  energy: z.number().int(),
});

export const DailyContentSchema = z.object({
  summary: z.string(),
  card: z.object({
    name: z.string(),
    arcana: z.string(),
    orientation: z.string(),
  }),
  daily_scores: DailyScoresSchema,
  headline: z.string(),
  forecast: z.array(z.string()),
  love: z.string(),
  career: z.string(),
  finance: z.string(),
  insight: z.string(),
  memorable_message: z.string(),
  advice: z.string(),
  keywords: z.array(z.string()),
});

export type DailyScores = z.infer<typeof DailyScoresSchema>;
export type DailyContent = z.infer<typeof DailyContentSchema>;

export const DAILY_SCORE_KEYS = ["overall", "love", "career", "finance", "energy"] as const;
