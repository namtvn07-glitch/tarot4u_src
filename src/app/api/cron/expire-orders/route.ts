import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Gọi bởi vercel.json cron (mỗi 10 phút) — dọn đơn pending quá hạn 15 phút để
// UI/webhook trễ sau đó nhận đúng trạng thái 'expired' thay vì 'pending' treo
// mãi (05-thanh-toan-credits.md §7).
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
