import { z } from "zod";
import { env } from "@/lib/env";

// Credits + giá đọc từ env (NEXT_PUBLIC_PACK_*_AMOUNT_VND — client hiển thị
// giá này, server dùng chính giá trị này để tính amount thật, cùng một
// nguồn). Client không bao giờ tự gửi amount/credits lên khi tạo đơn
// (05-thanh-toan-credits.md §2: "lỗ hổng cơ bản nhất") — server luôn tra lại
// PACKS[packId] theo packId, không tin số tiền từ request. Đổi giá test/thật
// chỉ cần đổi env var trên Vercel rồi Redeploy, không cần sửa code.
//
// File này được import THẲNG vào bundle browser (CreditTopUpModal), nên chỉ
// đọc được biến NEXT_PUBLIC_*. Biến server-only đọc ở đây sẽ luôn rơi về
// default phía client và lệch khỏi server trong im lặng — xem
// docs/learned/nextjs-env-bundling.md.
export const PACKS = {
  small: { label: "Gói Nhỏ", credits: 10, amountVnd: env.NEXT_PUBLIC_PACK_SMALL_AMOUNT_VND },
  popular: { label: "Gói Phổ biến", credits: 30, amountVnd: env.NEXT_PUBLIC_PACK_POPULAR_AMOUNT_VND },
  large: { label: "Gói Lớn", credits: 100, amountVnd: env.NEXT_PUBLIC_PACK_LARGE_AMOUNT_VND },
  // Gói lẻ — bán cho khách chưa có tài khoản, đúng MỘT lượt Đọc sâu.
  //
  // `credits: null` là cố ý, không phải thiếu sót. Số credits của gói này phải
  // bằng CHI PHÍ THẬT của một lượt Đọc sâu (`DEEP_READING_COST`), mà đó là
  // biến server-only — viết nó vào đây thì client luôn thấy default 2 trong
  // khi server có thể đang tính giá khác, và khách trả tiền "một lượt" xong
  // không đủ credits để mở khoá đúng lượt đó. Server tự resolve, xem
  // `resolvePackCredits()` trong src/app/api/orders/route.ts.
  //
  // UI cũng không hiển thị con số credits cho gói này mà hiển thị "1 lượt Đọc
  // sâu" — đó vừa là mô tả đúng sản phẩm, vừa làm không còn con số nào để lệch.
  single: { label: "Một lượt Đọc sâu", credits: null, amountVnd: env.NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND },
} as const;

/**
 * Số credits một lượt Đọc sâu tiêu tốn.
 *
 * Đọc từ `NEXT_PUBLIC_DEEP_READING_COST` nên CÙNG MỘT giá trị với thứ server
 * thật sự trừ đi — đổi env rồi redeploy là mọi con số hiển thị (giá mỗi lượt,
 * bảng so sánh tiết kiệm, câu "tiêu hao N Credits") tự đúng theo.
 *
 * Trước đây đây là hằng số `2` viết cứng, vì biến gốc là server-only: đổi giá
 * trên server thì UI vẫn hiện số cũ và bảng so sánh giá sai trong im lặng.
 */
export const DEEP_READING_CREDIT_COST = env.NEXT_PUBLIC_DEEP_READING_COST;

export type PackId = keyof typeof PACKS;

export const PACK_IDS = Object.keys(PACKS) as PackId[];

/**
 * Các gói nạp credits thông thường — KHÔNG gồm `single`.
 *
 * Gói lẻ là sản phẩm khác loại: mua một lần, không cần tài khoản, và tính trên
 * mỗi lượt thì ĐẮT NHẤT (15.000đ/lượt, so với 9.800đ ở Gói Nhỏ và 7.180đ ở Gói
 * Lớn — DEEP_READING_COST = 2 credits/lượt). Nó tồn tại để gỡ rào "phải đăng
 * ký mới xem được", không phải để cạnh tranh với gói. Vì vậy nó chỉ xuất hiện
 * đúng một chỗ — sheet mở khoá của khách sau khi đã lật đủ 3 lá — và ở đó luôn
 * đứng cạnh lời mời đăng nhập mua gói rẻ hơn.
 */
export const TOP_UP_PACK_IDS = ["small", "popular", "large"] as const;

export const CreateOrderRequestSchema = z.object({
  packId: z.enum(["small", "popular", "large", "single"]),
});
