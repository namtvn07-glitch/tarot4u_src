// Registry các loại trải bài (design/PROMT XEMBAITAROT.VN — phần 1). Luồng
// shuffle → reveal → personal và giao diện đọc nhãn vị trí từ đây, không tự
// hard-code "Quá Khứ / Hiện Tại / Tương Lai" ở từng màn hình.
//
// Chủ đích CHƯA khai báo `five_card` và `yes_no`: thêm một loại là thêm một mục
// ở đây + schema (src/lib/ai/schemas) + prompt (src/lib/ai/prompts).

export const SPREAD_IDS = ["daily", "three_card"] as const;
export type SpreadId = (typeof SPREAD_IDS)[number];

export interface SpreadPosition {
  // Khớp trường `position` trong JSON đầu ra của prompt (Prompt 02).
  key: string;
  labelVi: string;
  // Vai trò của vị trí, đưa vào prompt để model đọc đúng ngữ nghĩa.
  role: string;
}

export interface SpreadConfig {
  id: SpreadId;
  nameVi: string;
  cardCount: number;
  positions: readonly SpreadPosition[];
  // Giá trị cột `readings.tier` / `readings.spread` khi lưu.
  tier: "daily" | "deep";
  dbSpread: "one_card" | "three_card";
}

export const SPREADS: Record<SpreadId, SpreadConfig> = {
  daily: {
    id: "daily",
    nameVi: "Thông điệp ngày hôm nay",
    cardCount: 1,
    positions: [{ key: "today", labelVi: "Hôm nay", role: "Năng lượng của ngày hôm nay" }],
    tier: "daily",
    dbSpread: "one_card",
  },
  three_card: {
    id: "three_card",
    nameVi: "Trải 3 lá",
    cardCount: 3,
    positions: [
      {
        key: "past",
        labelVi: "Quá Khứ",
        role: "Quá khứ / nền tảng — điều gì trong quá khứ đã tạo ra tình trạng hiện tại",
      },
      {
        key: "present",
        labelVi: "Hiện Tại",
        role: "Hiện tại — trọng tâm của reading, thực sự đang có chuyện gì",
      },
      {
        key: "future",
        labelVi: "Tương Lai",
        role: "Tương lai / xu hướng phía trước — nếu năng lượng hiện tại tiếp tục thì xu hướng nào đang hình thành",
      },
    ],
    tier: "deep",
    dbSpread: "three_card",
  },
};

export function getSpread(id: SpreadId): SpreadConfig {
  return SPREADS[id];
}

// Nhãn vị trí theo thứ tự lá. Index ngoài phạm vi (dữ liệu cũ lệch) trả chuỗi
// rỗng thay vì throw — dùng khi hiển thị dữ liệu đã lưu.
export function positionLabel(spreadId: SpreadId, index: number): string {
  return SPREADS[spreadId].positions[index]?.labelVi ?? "";
}

// Daily: hạn mức theo ngày. Hằng số chứ không phải env — đổi giá/hạn mức là
// quyết định sản phẩm, đi qua code review chứ không qua dashboard.
export const DAILY_FREE_PER_DAY = 1;
export const DAILY_PAID_COST_CREDITS = 1;
export const DAILY_MAX_DRAWS_PER_DAY = 5;
export const DAILY_TIMEZONE = "Asia/Ho_Chi_Minh";
