import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Mọi truy vấn của trang admin đều đi qua service_role, nên database KHÔNG
// phân biệt được người thật đứng sau — danh tính chỉ tồn tại ở tầng Next.js
// rồi bị vứt đi ở ranh giới service-role. Đây là chỗ duy nhất ghi lại "ai".
// (pgaudit không thay thế được: nó cũng chỉ thấy service_role.)
export type AdminAuditAction =
  | "users.list"
  | "affiliate.create"
  | "affiliate.toggle"
  | "affiliate.delete";

// Cửa sổ gộp cho các hành động ĐỌC. Trong 15 phút, cùng một người mở lại cùng
// một danh sách chỉ tính vào một dòng (có đếm số lượt) thay vì sinh dòng mới —
// nếu không, chỉ cần bấm qua lại vài phút là nhật ký đầy dòng trùng nhau và
// che mất những lượt truy cập thật sự đáng chú ý.
const READ_COLLAPSE_MINUTES = 15;

// Hành động GHI không bao giờ gộp: mỗi lần tạo/tắt link là một sự kiện riêng.
const WRITE_ACTIONS: ReadonlySet<AdminAuditAction> = new Set([
  "affiliate.create",
  "affiliate.toggle",
  "affiliate.delete",
]);

// CHỈ gọi ở chỗ chạm dữ liệu cá nhân và ở hành động ghi của admin. Cố ý KHÔNG
// gọi ở trang tổng quan / trang affiliate: đó là số liệu gộp, ghi vào chỉ làm
// loãng nhật ký và che mất những dòng thực sự đáng chú ý.
export async function logAdminAccess(
  adminUserId: string,
  action: AdminAuditAction,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await getSupabaseAdmin().rpc("log_admin_access", {
      p_admin_user_id: adminUserId,
      p_action: action,
      p_meta: meta ?? null,
      p_collapse_minutes: WRITE_ACTIONS.has(action) ? 0 : READ_COLLAPSE_MINUTES,
    });
  } catch {
    // Fail open: không ghi được nhật ký thì vẫn cho admin xem dữ liệu, giống
    // triết lý fail-open của rate-limit. Mất một dòng log không đáng để chặn
    // người vận hành khỏi công cụ của họ.
  }
}
