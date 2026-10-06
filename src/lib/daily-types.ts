import type { DailyContent } from "@/lib/ai/schemas/daily";

// Hình dạng dữ liệu Daily giữa API và giao diện. Chỉ có kiểu — client lẫn
// server cùng import được.

export interface DailyCardInfo {
  id: string;
  nameVi: string;
  nameEn: string;
  image: string;
  orientation: "upright" | "reversed";
  arcana: "major" | "minor";
  suit: string | null;
  number: number;
}

// Bản lưu trong `readings.result` của một lượt Daily. `variant` để lần sau chọn
// biến thể người này chưa xem.
export interface DailyResult {
  version: 1;
  spread: "daily";
  variant: number;
  content: DailyContent;
}

export interface DailyDraw {
  readingId: string;
  // free = lượt miễn phí đầu tiên trong ngày; paid = đã trừ credits.
  kind: "free" | "paid";
  day: string;
  card: DailyCardInfo;
  content: DailyContent;
}

export interface DailyState {
  // false = chưa có phiên nào (khách chưa mở phiên ẩn danh) — vẫn rút được free,
  // client tự mở phiên ẩn danh ngay trước lần rút đầu.
  authenticated: boolean;
  isAnonymous: boolean;
  day: string;
  maxDraws: number;
  costCredits: number;
  drawsToday: number;
  freeAvailable: boolean;
  creditsRemaining: number | null;
  // Lượt rút gần nhất trong ngày; null nếu chưa rút (hoặc đã xoá khỏi lịch sử).
  today: DailyDraw | null;
}

export type DailyDrawResponse = DailyDraw & { creditsRemaining: number | null };

export const DAILY_ERROR_CODES = [
  "invalid_request",
  "unauthorized",
  "rate_limited",
  "daily_limit_reached",
  "insufficient_credits",
  "already_processing",
  "daily_content_unavailable",
  "daily_draw_failed",
] as const;
export type DailyErrorCode = (typeof DAILY_ERROR_CODES)[number];
