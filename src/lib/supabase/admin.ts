import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// CHỈ import trong API route/route handler chạy server.
// Bỏ qua RLS hoàn toàn — không bao giờ import từ client component.

let cached: SupabaseClient | undefined;

// Lazy — KHÔNG tạo client ở module scope. `next build` đánh giá tĩnh toàn
// bộ module graph lúc thu thập page data; một `export const supabaseAdmin =
// createClient(env.X, ...)` ở top-level đọc `env` ngay lúc import, mà
// `env.ts` parse CẢ schema cùng lúc (không phải riêng từng field) — nên chỉ
// cần 1 field bất kỳ trong schema chưa có giá trị (dù route đang build không
// hề cần field đó) là build vỡ. Đây đúng bug đã vá ở Giai đoạn 3 cho
// Supabase, tái phát khi Giai đoạn 4c thêm ANTHROPIC_API_KEY/
// READING_TOKEN_SECRET vào chung schema — sửa root cause bằng lazy getter,
// không nới lỏng schema.
export function getSupabaseAdmin(): SupabaseClient {
  return (cached ??= createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }));
}
