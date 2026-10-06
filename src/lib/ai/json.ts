import type { z } from "zod";

// Model đôi khi vẫn bọc JSON trong ```json hoặc thêm lời dẫn trước/sau dù prompt
// dặn "chỉ trả JSON" (và dù đã bật responseMimeType). Lấy đoạn từ `{` đầu tới
// `}` cuối thay vì parse nguyên văn.
export function parseJsonObject<T>(text: string, schema: z.ZodType<T>): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("ai_json_parse_failed");

  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    throw new Error("ai_json_parse_failed");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error("ai_json_parse_failed");
  return parsed.data;
}
