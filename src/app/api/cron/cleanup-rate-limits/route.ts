import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Gọi bởi vercel.json cron (mỗi giờ) — dọn rate_limits cũ hơn 2 giờ
// (06-bao-mat-kiem-duyet-phap-ly.md §2.3), tránh bảng phình vô hạn vì mỗi
// window mới là một dòng riêng.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
  const { error } = await getSupabaseAdmin().from("rate_limits").delete().lt("window_start", cutoff);

  if (error) {
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
