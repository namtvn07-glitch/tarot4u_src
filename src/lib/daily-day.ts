import { DAILY_TIMEZONE } from "@/lib/spreads";

// "Hôm nay" theo giờ Việt Nam. en-CA cho định dạng YYYY-MM-DD. Dùng được cả ở
// server lẫn client (khách chưa có phiên không cần hỏi server ngày nào).
//
// RPC claim_daily_draw tự tính cùng ngày này ở phía DB và đó mới là nguồn quyết
// định thật; hàm này chỉ để HIỂN THỊ và để đọc trạng thái, nơi lệch vài mili-giây
// quanh nửa đêm là vô hại.
export function vietnamToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
