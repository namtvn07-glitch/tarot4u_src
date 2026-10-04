import { z } from "zod";

// Hình dạng JSON của Prompt 02 (Trải 3 lá) — đúng các trường trong mục "OUTPUT
// JSON" của design/PROMT XEMBAITAROT.VN (phần 2).md, trừ `disclaimer` (hằng số
// do UI gắn, không để model viết lại).
export const ThreeCardAiOutputSchema = z.object({
  summary: z.string(),
  verdict: z.string(),
  // z.number() chứ không .int(): .int() sinh minimum/maximum cực lớn trong JSON
  // Schema mà một số provider từ chối, và hai giá trị này bị server ghi đè bằng
  // số tự đếm (finalizeThreeCardResult) nên model có sai kiểu số nguyên cũng vô hại.
  major_count: z.number(),
  minor_count: z.number(),
  energy_weight: z.string(),
  dominant_suit: z.string(),
  overall_story: z.string(),
  cards: z.array(
    z.object({
      position: z.string(),
      card: z.string(),
      summary: z.string(),
      interpretation: z.string(),
    }),
  ),
  hidden_insight: z.string(),
  forecast: z.array(z.string()),
  advice: z.string(),
  memorable_message: z.string(),
  keywords: z.array(z.string()),
});

export type ThreeCardAiOutput = z.infer<typeof ThreeCardAiOutputSchema>;

// Bản lưu trong `readings.result`. `version` để về sau đổi cấu trúc mà vẫn đọc
// được bản ghi cũ; `spread` để renderer biết dùng bố cục nào.
export interface ThreeCardResult extends ThreeCardAiOutput {
  version: 1;
  spread: "three_card";
}
