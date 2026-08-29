import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Xoá tài khoản — 06-bao-mat-kiem-duyet-phap-ly.md §4.4: "xóa profiles +
// readings, giữ orders + credit_ledger (nghĩa vụ tài chính) nhưng gỡ liên
// kết PII".
//
// Không thể DELETE hàng auth.users: orders/credit_ledger có
// `user_id ... on delete restrict` (04-database-schema.md §2.4/§2.5) — cố ý,
// để không ai xoá được lịch sử tài chính cần đối soát. Với bất kỳ user nào
// từng nạp/tiêu credit, xoá auth.users sẽ luôn bị Postgres chặn bằng lỗi FK.
// Vì vậy "xoá tài khoản" ở đây nghĩa là: xoá readings + profiles (đúng như
// spec), rồi vô hiệu hoá + gỡ PII khỏi auth.users (đổi email thành giá trị
// không định danh được, xoá metadata, ban vĩnh viễn) thay vì xoá hẳn hàng đó
// — orders/credit_ledger vẫn tham chiếu đúng user_id, chỉ không còn PII nào
// lấy ra được từ phía auth.users/profiles nữa.
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { error: readingsError } = await admin.from("readings").delete().eq("user_id", user.id);
  if (readingsError) {
    return NextResponse.json({ error: "delete_readings_failed" }, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileError) {
    return NextResponse.json({ error: "delete_profile_failed" }, { status: 500 });
  }

  // Ban dài (~100 năm) thay vì xoá auth.users — chặn mọi đường đăng nhập lại
  // (password/magic-link/OAuth), kể cả OAuth cùng provider_id có thể tự tạo
  // lại profile qua trigger handle_new_user nếu không ban. Email đổi thành
  // giá trị domain .invalid (RFC 2606) để không còn PII lấy được, vẫn giữ
  // auth.users.id nguyên vẹn cho FK orders/credit_ledger.
  const { error: banError } = await admin.auth.admin.updateUserById(user.id, {
    email: `deleted-${user.id}@ventus-tarot.invalid`,
    phone: "",
    user_metadata: {},
    ban_duration: "876000h",
  });
  if (banError) {
    return NextResponse.json({ error: "deactivate_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
