import { z } from "zod";

// Giá + credits server-side only — client không bao giờ gửi amount/credits
// lên (05-thanh-toan-credits.md §2: "lỗ hổng cơ bản nhất"). Giá tạm, xác nhận
// qua AskUserQuestion trước khi có giao dịch thật đầu tiên — đổi chỉ cần sửa
// object này.
export const PACKS = {
  small: { label: "Gói Nhỏ", credits: 10, amountVnd: 49_000 },
  popular: { label: "Gói Phổ biến", credits: 30, amountVnd: 129_000 },
  large: { label: "Gói Lớn", credits: 100, amountVnd: 359_000 },
} as const;

export type PackId = keyof typeof PACKS;

export const PACK_IDS = Object.keys(PACKS) as PackId[];

export const CreateOrderRequestSchema = z.object({
  packId: z.enum(["small", "popular", "large"]),
});
