import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Gọi bởi vercel.json cron (mỗi ngày, 01:00 UTC) — dọn rate_limits đã ra
// ngoài mọi cửa sổ còn hiệu lực (06-bao-mat-kiem-duyet-phap-ly.md §2.3),
// tránh bảng phình vô hạn vì mỗi window mới là một dòng riêng.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 48 giờ, không phải 2. Mốc 2 giờ của thiết kế gốc đúng khi mọi cửa sổ đều
  // ≤ 1 giờ, nhưng hạn mức khách ẩn danh (thêm 2026-09-09) dùng cửa sổ 24
  // giờ với window_start neo ở 00:00 UTC — cutoff 2 giờ xoá mất dòng đó ngay
  // giữa cửa sổ, làm bộ đếm ngày tự reset và hạn mức ẩn danh gần như không
  // còn tác dụng. Phải lớn hơn cửa sổ dài nhất đang dùng, cộng biên an toàn.
  const cutoff = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
  const { error } = await getSupabaseAdmin().from("rate_limits").delete().lt("window_start", cutoff);

  if (error) {
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
