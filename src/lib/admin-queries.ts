import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TokenUsage } from "@/lib/ai-cost";

// Mọi RPC ở đây đã revoke execute khỏi anon/authenticated, chỉ service_role gọi
// được. Cổng kiểm tra quyền admin nằm ở src/app/admin/layout.tsx — file này
// giả định người gọi đã qua cổng đó.

export interface OverviewStats {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  dau: number;
  wau: number;
  total_revenue_vnd: number;
  revenue_7d_vnd: number;
  revenue_30d_vnd: number;
  paying_users: number;
  outstanding_credits: number;
  orders_created_30d: number;
  orders_paid_30d: number;
  orders_expired_30d: number;
  readings_total: number;
  readings_quick_30d: number;
  readings_deep_30d: number;
  ai_tokens_by_model: Record<string, TokenUsage>;
}

export interface DailyPoint {
  day: string;
  signups: number;
  revenue_vnd: number;
  readings: number;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  credits: number;
  created_at: string;
  last_sign_in_at: string | null;
  referred_by_code: string | null;
  orders_count: number;
  readings_count: number;
  total_spent_vnd: number;
}

export interface AffiliateStatRow {
  code: string;
  label: string | null;
  destination_path: string;
  is_active: boolean;
  created_at: string;
  clicks: number;
  bot_clicks: number;
  unique_visitors: number;
  signups: number;
  activated_soft: number;
  activated_hard: number;
  paying: number;
  revenue_vnd: number;
  avg_hours_to_signup: number | null;
}

export interface AuditRow {
  id: number;
  /** null khi tài khoản admin đã bị gỡ — dùng admin_email để biết đó là ai. */
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  meta: Record<string, unknown> | null;
  /** Số lượt xem đã gộp vào dòng này (hành động ghi luôn = 1). */
  view_count: number;
  /** Lượt đầu tiên. */
  created_at: string;
  /** Lượt gần nhất được gộp. */
  last_at: string;
}

// ---- Cache tầng dữ liệu -------------------------------------------------
//
// Cache phải nằm ở ĐÂY chứ không phải `export const revalidate` trên trang:
// mọi trang admin đọc cookie để kiểm tra quyền, mà đọc cookie thì Next buộc
// render động — `revalidate` trên trang là vô hiệu (kết quả build hiện cả 4
// route đều là `ƒ Dynamic`). Tách ra thế này thì phần kiểm tra quyền vẫn chạy
// mỗi request, chỉ phần số liệu gộp mới được dùng lại.
//
// Không dùng `use cache` (cách chuẩn Next 16) vì directive đó đòi bật
// `cacheComponents: true` — cờ toàn dự án, đổi ngữ nghĩa cache của cả 30+
// route hiện có. Không đáng để đổi cả app cho một trang quản trị.
// `unstable_cache` đã bị đánh dấu deprecated ở Next 16; khi nào dự án migrate
// sang Cache Components thì thay 3 hàm dưới bằng `use cache` + `cacheTag`.
//
// Chỉ cache SỐ LIỆU GỘP. Cố ý KHÔNG cache `listUsers` (dữ liệu cá nhân, có
// tham số tìm kiếm, và mỗi lượt xem phải sinh một dòng nhật ký) lẫn
// `listAuditLog` (nhật ký mà cũ thì vô nghĩa).

export const ADMIN_STATS_TAG = "admin-stats";

// 60s: số liệu tổng quan không do admin thao tác mà sinh ra (nó đến từ hoạt
// động thật của người dùng), nên trễ một phút là hoàn toàn chấp nhận được cho
// một dashboard — khác hẳn bảng affiliate bên dưới.
const CACHE_SECONDS = 60;

export const getOverviewStats = unstable_cache(
  async (): Promise<OverviewStats | null> => {
    const { data, error } = await getSupabaseAdmin().rpc("admin_overview_stats");
    if (error || !data?.length) return null;
    return data[0] as OverviewStats;
  },
  ["admin-overview-stats"],
  { revalidate: CACHE_SECONDS, tags: [ADMIN_STATS_TAG] },
);

export const getDailySeries = unstable_cache(
  async (days = 30): Promise<DailyPoint[]> => {
    const { data, error } = await getSupabaseAdmin().rpc("admin_daily_series", {
      p_days: days,
    });
    if (error || !data) return [];
    return data as DailyPoint[];
  },
  ["admin-daily-series"],
  { revalidate: CACHE_SECONDS, tags: [ADMIN_STATS_TAG] },
);

export async function listUsers(
  limit: number,
  offset: number,
  search: string | null,
): Promise<AdminUserRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc("admin_list_users", {
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  });
  if (error || !data) return [];
  return data as AdminUserRow[];
}

// CỐ Ý KHÔNG CACHE — đã thử và bỏ, ghi lại để người sau không thử lại:
//
// Đây là bảng duy nhất mà chính admin thay đổi được (tạo/tắt link). Khi cache
// nó và gọi `revalidateTag` từ route API, kết quả đo thực tế là: tạo link
// xong, lần mở trang NGAY SAU ĐÓ vẫn trả bản cũ (không thấy link vừa tạo),
// lần mở kế tiếp mới đúng. Đó là ngữ nghĩa stale-while-revalidate — tài liệu
// Next ghi rõ "revalidation được kích hoạt bởi request, không phải bởi lời
// gọi revalidateTag". Với người dùng thì nó trông y như thao tác thất bại.
//
// API đúng cho tình huống "đọc lại thứ mình vừa ghi" là `updateTag`, nhưng nó
// CHỈ gọi được từ Server Action, không dùng được trong Route Handler.
//
// Truy vấn này rẻ và trang chỉ có vài admin thỉnh thoảng mở, nên đánh đổi
// đúng là bỏ cache để lấy tính đúng đắn. Nếu sau này bảng phình to và nó chậm
// thật, hướng sửa là chuyển mutation sang Server Action rồi dùng `updateTag`,
// KHÔNG phải bọc lại `unstable_cache`.
export async function getAffiliateStats(): Promise<AffiliateStatRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc("admin_affiliate_stats");
  if (error || !data) return [];
  return data as AffiliateStatRow[];
}

// Qua RPC chứ không query thẳng bảng: cần join auth.users lấy email, mà
// PostgREST chỉ expose schema public.
export async function listAuditLog(
  limit: number,
  offset: number,
): Promise<AuditRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc("admin_audit_log_page", {
    p_limit: limit,
    p_offset: offset,
  });
  if (error || !data) return [];
  return data as AuditRow[];
}

const vnd = new Intl.NumberFormat("vi-VN");

export function formatVnd(amount: number): string {
  return `${vnd.format(amount)}đ`;
}

export function formatNumber(value: number): string {
  return vnd.format(value);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
