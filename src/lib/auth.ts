import { createClient } from "@/lib/supabase/server";

export interface AuthedUser {
  id: string;
  // Phiên ẩn danh (signInAnonymously) — có id thật, ghi được orders/readings,
  // nhưng KHÔNG phải một tài khoản: không email, không mật khẩu, sống trong
  // đúng một cookie trình duyệt và không có đường phục hồi nào.
  //
  // Mọi caller phải tự quyết định cho hay chặn. Hai nhóm quyết định:
  //   - Hạn mức: ẩn danh đếm theo IP, không theo user.id. signInAnonymously()
  //     sinh uuid mới mỗi lần gọi nên "theo user" ở đây là không có hạn mức.
  //   - Hành động không thể hoàn tác (xoá tài khoản, đổi mật khẩu, đăng xuất):
  //     chặn. Với phiên ẩn danh chúng phá huỷ danh tính duy nhất đang giữ
  //     credits đã trả tiền.
  isAnonymous: boolean;
}

// Trả null thay vì throw khi chưa đăng nhập — caller (route) tự quyết định
// mã lỗi (401). Dùng chung cho mọi route của Đọc sâu (Giai đoạn 4c).
export async function requireUser(): Promise<AuthedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, isAnonymous: user.is_anonymous ?? false } : null;
}

// Dùng client RLS-aware (không phải getSupabaseAdmin) — đúng mục đích của policy
// admin_users_select_own: user chỉ đọc được đúng dòng của chính mình, nên câu
// hỏi "tôi có phải admin không" tự trả lời được mà không cần service-role.
// Không ai liệt kê được danh sách admin qua đường này.
export async function requireAdmin(): Promise<AuthedUser | null> {
  const user = await requireUser();
  if (!user) return null;
  // Phiên ẩn danh không bao giờ có hàng trong admin_users, nên select bên dưới
  // đã đủ chặn. Chặn tường minh ở đây để không tốn một round-trip DB cho mỗi
  // lượt khách ẩn danh đi lạc vào /admin, và để ý định đọc được từ code.
  if (user.isAnonymous) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? user : null;
}
