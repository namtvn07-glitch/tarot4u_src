import { z } from "zod";
import { env } from "@/lib/env";

// Credits + giá đọc từ env (NEXT_PUBLIC_PACK_*_AMOUNT_VND — client hiển thị
// giá này, server dùng chính giá trị này để tính amount thật, cùng một
// nguồn). Client không bao giờ tự gửi amount/credits lên khi tạo đơn
// (05-thanh-toan-credits.md §2: "lỗ hổng cơ bản nhất") — server luôn tra lại
// PACKS[packId] theo packId, không tin số tiền từ request. Đổi giá test/thật
// chỉ cần đổi env var trên Vercel rồi Redeploy, không cần sửa code.
export const PACKS = {
  small: { label: "Gói Nhỏ", credits: 10, amountVnd: env.NEXT_PUBLIC_PACK_SMALL_AMOUNT_VND },
  popular: { label: "Gói Phổ biến", credits: 30, amountVnd: env.NEXT_PUBLIC_PACK_POPULAR_AMOUNT_VND },
  large: { label: "Gói Lớn", credits: 100, amountVnd: env.NEXT_PUBLIC_PACK_LARGE_AMOUNT_VND },
} as const;

export type PackId = keyof typeof PACKS;

export const PACK_IDS = Object.keys(PACKS) as PackId[];

export const CreateOrderRequestSchema = z.object({
  packId: z.enum(["small", "popular", "large"]),
});
