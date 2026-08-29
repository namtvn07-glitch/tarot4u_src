import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let cached: Anthropic | undefined;

// Lazy trên chủ đích — KHÔNG tạo client (không đọc env.ANTHROPIC_API_KEY) ở
// module scope. `next build` đánh giá tĩnh toàn bộ module graph lúc thu
// thập page data, kể cả route chưa có request nào — một `export const
// anthropic = new Anthropic(...)` ở top-level sẽ throw ngay tại build time
// nếu thiếu key, dù route đó không hề được gọi. Đây đúng lý do env.ts dùng
// Proxy lazy-parse (xem comment ở đó, gốc từ bug Giai đoạn 3 với Supabase).
export function getAnthropicClient(): Anthropic {
  return (cached ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }));
}

let cachedTriage: Anthropic | undefined;

// Client riêng cho bước kiểm duyệt/triage (src/lib/moderation.ts) — dùng
// TRIAGE_ANTHROPIC_API_KEY nếu có set, không thì dùng lại ANTHROPIC_API_KEY.
// Tách client (không chỉ tách model) để 2 vai trò có thể dùng 2 tài khoản/
// key Anthropic khác nhau, ví dụ để tách rate-limit/billing.
export function getTriageAnthropicClient(): Anthropic {
  return (cachedTriage ??= new Anthropic({
    apiKey: env.TRIAGE_ANTHROPIC_API_KEY ?? env.ANTHROPIC_API_KEY,
  }));
}
