import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.from("readings").delete().eq("id", id).select();
  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  // RLS (readings_delete_own) silently no-ops a delete on a row that either
  // doesn't exist or isn't this user's — data.length === 0 covers both
  // without telling the caller which one, so ownership can't be probed.
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
