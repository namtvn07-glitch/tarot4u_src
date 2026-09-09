import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAccess } from "@/lib/admin-audit";
import { AFFILIATE_CODE_PATTERN } from "@/lib/affiliate";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Người không phải admin nhận 404 chứ không phải 403 — giống trang /admin, để
// không xác nhận rằng endpoint này tồn tại.
const NOT_FOUND = NextResponse.json({ error: "not_found" }, { status: 404 });

const CreateSchema = z.object({
  code: z.string().regex(AFFILIATE_CODE_PATTERN, {
    message: "Mã chỉ gồm chữ, số, gạch ngang hoặc gạch dưới, dài 3–32 ký tự.",
  }),
  label: z.string().trim().max(120).optional(),
});

const ToggleSchema = z.object({
  code: z.string().regex(AFFILIATE_CODE_PATTERN),
  is_active: z.boolean(),
});

const DeleteSchema = z.object({
  code: z.string().regex(AFFILIATE_CODE_PATTERN),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NOT_FOUND;

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  const { code, label } = parsed.data;
  const { error } = await getSupabaseAdmin()
    .from("affiliate_links")
    .insert({ code, label: label || null, created_by: admin.id });

  if (error) {
    // 23505 = unique_violation: mã đã tồn tại. Báo đúng nguyên nhân thay vì
    // "lỗi hệ thống" — người dùng sửa được ngay.
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      {
        error: isDuplicate
          ? `Mã “${code}” đã tồn tại.`
          : "Không tạo được link. Thử lại sau.",
      },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  await logAdminAccess(admin.id, "affiliate.create", { code });
  return NextResponse.json({ ok: true, code });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NOT_FOUND;

  const parsed = ToggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const { code, is_active } = parsed.data;
  const { error } = await getSupabaseAdmin()
    .from("affiliate_links")
    .update({ is_active })
    .eq("code", code);

  if (error) {
    return NextResponse.json(
      { error: "Không đổi được trạng thái link." },
      { status: 500 },
    );
  }

  await logAdminAccess(admin.id, "affiliate.toggle", { code, is_active });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NOT_FOUND;

  const parsed = DeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const { code } = parsed.data;
  const supabase = getSupabaseAdmin();

  // Chặn xoá link đã có người đăng ký. profiles.referred_by_code trỏ tới bảng
  // này với `on delete set null`, nên xoá sẽ ÂM THẦM gỡ nguồn của những người
  // đó — mất số liệu lịch sử mà không có cách nào dựng lại. Muốn ngừng dùng
  // thì tắt link, không xoá.
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_code", code);

  if (countError) {
    return NextResponse.json({ error: "Không kiểm tra được link." }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Link này đã có ${count} người đăng ký nên không xoá được — xoá là mất luôn nguồn của họ. Hãy tắt link thay vì xoá.`,
      },
      { status: 409 },
    );
  }

  // An toàn để dọn: không profile nào trỏ tới mã này, nên cũng không profile
  // nào trỏ tới lượt bấm của nó (hai cột luôn được ghi cùng lúc).
  await supabase.from("affiliate_clicks").delete().eq("code", code);

  const { error } = await supabase.from("affiliate_links").delete().eq("code", code);
  if (error) {
    return NextResponse.json({ error: "Không xoá được link." }, { status: 500 });
  }

  await logAdminAccess(admin.id, "affiliate.delete", { code });
  return NextResponse.json({ ok: true });
}
