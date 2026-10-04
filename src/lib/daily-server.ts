import { DailyContentSchema, type DailyContent } from "@/lib/ai/schemas/daily";
import { getCardById } from "@/lib/cards";
import type { DailyCardInfo, DailyDraw, DailyResult } from "@/lib/daily-types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// CHỈ import từ route handler — dùng service role.

export function toCardInfo(cardId: string, orientation: "upright" | "reversed"): DailyCardInfo {
  const card = getCardById(cardId);
  return {
    id: card.id,
    nameVi: card.name_vi,
    nameEn: card.name_en,
    image: `/cards/${card.image_filename}`,
    orientation,
    arcana: card.arcana,
    suit: card.suit,
    number: card.number,
  };
}

export interface ApprovedIndexEntry {
  card_id: string;
  orientation: "upright" | "reversed";
  variant: number;
}

// Chỉ mục các bản đã duyệt (tối đa 78 × 2 × số biến thể dòng nhỏ) — dùng để
// chỉ rút lá thật sự có nội dung, nên môi trường mới import một phần vẫn chạy.
//
// Cache trong bộ nhớ của instance: tập này chỉ đổi khi có người nạp/duyệt nội dung,
// nhưng nếu không cache thì MỖI lượt rút của MỌI người đều đọc lại ~468 dòng. Hệ quả
// chấp nhận được: duyệt thêm nội dung có thể mất tới `INDEX_TTL_MS` mới có hiệu lực (ở
// môi trường dev ngắn hơn nhiều để thử nội dung vừa duyệt mà không phải chờ).
const INDEX_TTL_MS = process.env.NODE_ENV === "production" ? 5 * 60_000 : 5_000;
let approvedIndexCache: { at: number; value: ApprovedIndexEntry[] } | undefined;

export async function loadApprovedIndex(): Promise<ApprovedIndexEntry[]> {
  if (approvedIndexCache && Date.now() - approvedIndexCache.at < INDEX_TTL_MS) {
    return approvedIndexCache.value;
  }
  const { data, error } = await getSupabaseAdmin()
    .from("daily_content")
    .select("card_id, orientation, variant")
    .eq("status", "approved");
  if (error) throw error;
  const value = (data ?? []) as ApprovedIndexEntry[];
  approvedIndexCache = { at: Date.now(), value };
  return value;
}

// Gọi khi chỉ mục cache chỉ tới một bản không còn dùng được (vừa bị gỡ/retire) — lần
// rút kế tiếp sẽ đọc lại từ DB thay vì chờ hết hạn.
export function invalidateApprovedIndex(): void {
  approvedIndexCache = undefined;
}

// Phiên bản mới nhất của một biến thể; null nếu không có hoặc dữ liệu hỏng.
export async function loadApprovedContent(
  cardId: string,
  orientation: "upright" | "reversed",
  variant: number,
): Promise<{ content: DailyContent; model: string } | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("daily_content")
    .select("content, model, version")
    .eq("card_id", cardId)
    .eq("orientation", orientation)
    .eq("variant", variant)
    .eq("status", "approved")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const parsed = DailyContentSchema.safeParse(data.content);
  // Nội dung hỏng trong DB là lỗi dữ liệu phía mình, không để lọt ra giao diện.
  if (!parsed.success) return null;
  return { content: parsed.data, model: data.model as string };
}

interface ReadingRowForDraw {
  id: string;
  cards_drawn: { card_id?: string; orientation?: string }[] | null;
  result: DailyResult | null;
}

// Dựng DailyDraw từ một dòng `readings`. null nếu dòng thiếu dữ liệu (ví dụ bản
// ghi cũ không có `result`) — caller coi như "chưa có lá hôm nay".
export function readingToDailyDraw(
  row: ReadingRowForDraw,
  kind: "free" | "paid",
  day: string,
): DailyDraw | null {
  const drawn = row.cards_drawn?.[0];
  if (!drawn?.card_id || !row.result?.content) return null;
  const orientation = drawn.orientation === "reversed" ? "reversed" : "upright";
  const content = DailyContentSchema.safeParse(row.result.content);
  if (!content.success) return null;
  return {
    readingId: row.id,
    kind,
    day,
    card: toCardInfo(drawn.card_id, orientation),
    content: content.data,
  };
}
