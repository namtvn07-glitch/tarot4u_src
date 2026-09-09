import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Gọi bởi vercel.json cron (mỗi ngày) — cắt đuôi hai bảng chỉ tăng chứ không
// bao giờ tự co lại. Cùng mẫu với cleanup-rate-limits.
const AUDIT_LOG_KEEP_DAYS = 365;
const AFFILIATE_CLICK_KEEP_DAYS = 180;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Nhật ký quản trị: giữ 1 năm. Sau khi đã gộp lượt xem lặp lại, mỗi ngày chỉ
  // sinh vài dòng nên một năm vẫn rất nhỏ — giữ dài để còn rà lại được khi cần.
  const auditCutoff = new Date(
    Date.now() - AUDIT_LOG_KEEP_DAYS * 24 * 60 * 60_000,
  ).toISOString();
  const { error: auditError } = await supabase
    .from("admin_audit_log")
    .delete()
    .lt("last_at", auditCutoff);

  // Lượt bấm link: chỉ xoá lượt KHÔNG dẫn tới đăng ký nào. Lượt đã chuyển đổi
  // được giữ vĩnh viễn — xoá nó là mất luôn dấu vết "người này đến từ cú bấm
  // nào" (profiles.referred_click_id sẽ bị set null) và làm hỏng chỉ số thời
  // gian từ bấm đến đăng ký của các chiến dịch cũ.
  const clickCutoff = new Date(
    Date.now() - AFFILIATE_CLICK_KEEP_DAYS * 24 * 60 * 60_000,
  ).toISOString();
  const { error: clickError } = await supabase.rpc("cleanup_unconverted_clicks", {
    p_before: clickCutoff,
  });

  if (auditError || clickError) {
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
