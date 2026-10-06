import { findCardById } from "@/lib/cards";
import { positionLabel, type SpreadId } from "@/lib/spreads";
import type { DrawnCardRow, ReadingHistoryItem, ReadingRow } from "@/types/tarot";

// MỘT chỗ duy nhất biến dòng bảng `readings` thành mục lịch sử. Trước đây ba nơi
// (trang chủ, /tai-khoan, /tai-khoan/[id]) tự map riêng và mỗi nơi hard-code nhãn
// "Quá Khứ / Hiện Tại / Tương Lai" — thêm một loại trải bài là phải sửa cả ba.

const TOPIC_LABEL_VI: Record<string, string> = {
  love: "Tình Yêu",
  career: "Sự Nghiệp",
  finance: "Tài Chính",
  spiritual: "Tâm Linh",
  general: "Tổng Quan",
};

export const DAILY_HISTORY_LABEL = "Thông điệp hôm nay";

// Truy vấn DANH SÁCH lịch sử chỉ lấy những gì dòng danh sách thật sự hiển thị. Cột
// `result` (2–7 KB mỗi dòng) KHÔNG nằm trong đó — mở chi tiết mới tải (xem
// ReadingDetailModal). Ba trường rút gọn lấy bằng JSON path ngay ở DB.
// `personal_body` vẫn có mặt cho bản ghi CŨ (chưa có `result`); bản ghi mới để trống.
export const HISTORY_LIST_SELECT =
  "id, created_at, topic, tier, question, cards_drawn, personal_body, " +
  "deep_summary:result->>summary, daily_summary:result->content->>summary, daily_headline:result->content->>headline";

// Trang chi tiết chỉ lấy MỘT dòng nên lấy đủ.
export const HISTORY_DETAIL_SELECT =
  "id, created_at, topic, tier, question, cards_drawn, personal_body, result";

// Trần số dòng của danh sách. Dòng đã nhẹ (~0,5 KB) nên 200 dòng ≈ 100 KB; trước đây
// là KHÔNG giới hạn và mỗi dòng mang cả bản luận giải.
export const HISTORY_LIST_LIMIT = 200;

function historyType(tier: string | null | undefined): ReadingHistoryItem["type"] {
  if (tier === "daily") return "daily";
  if (tier === "quick") return "quick";
  return "deep";
}

// Dòng ngắn dùng làm đoạn xem trước trong danh sách. Kết quả có cấu trúc dùng
// câu kết luận của nó; `personal_body` dạng chữ chỉ là dự phòng cho bản ghi cũ.
function previewOf(row: ReadingRow): string | undefined {
  const result = row.result;
  if (result?.spread === "three_card") return result.summary;
  if (result?.spread === "daily") return result.content.summary;
  return row.deep_summary ?? row.daily_summary ?? row.personal_body ?? undefined;
}

function titleOf(row: ReadingRow): string | undefined {
  const result = row.result;
  if (result?.spread === "daily") return result.content.headline;
  return row.daily_headline ?? undefined;
}

export function rowToHistoryItem(row: ReadingRow): ReadingHistoryItem {
  const type = historyType(row.tier);
  const spreadId: SpreadId = type === "daily" ? "daily" : "three_card";
  const result = row.result ?? undefined;

  return {
    id: row.id,
    date: new Date(row.created_at).toLocaleDateString("vi-VN"),
    topic: row.topic ?? undefined,
    topicVi: type === "daily" ? DAILY_HISTORY_LABEL : (row.topic && TOPIC_LABEL_VI[row.topic]) || "Tổng Quan",
    type,
    question: row.question ?? undefined,
    title: titleOf(row),
    summary: previewOf(row),
    cards: (row.cards_drawn || []).map((drawn: DrawnCardRow, index: number) => {
      const card = findCardById(drawn.card_id);
      return {
        name: card?.name_en ?? drawn.card_id,
        nameVi: card?.name_vi ?? drawn.card_id,
        image: `/cards/${card?.image_filename ?? `${drawn.card_id}.jpg`}`,
        orientation: drawn.orientation || "upright",
        position: positionLabel(spreadId, index),
      };
    }),
    personalBody: row.personal_body ?? undefined,
    result,
    // `result` vắng mặt (undefined) = dòng đến từ truy vấn danh sách; null = đã tải và
    // đúng là bản ghi cũ không có kết quả có cấu trúc.
    detailLoaded: row.result !== undefined,
  };
}

// supabase-js suy luận kiểu dòng từ chuỗi `select` LITERAL; HISTORY_LIST_SELECT là chuỗi
// nối nên không suy luận được (data thành GenericStringError[]) — ép kiểu ở đúng một chỗ.
export function rowsToHistoryItems(data: unknown[]): ReadingHistoryItem[] {
  return (data as ReadingRow[]).map(rowToHistoryItem);
}
