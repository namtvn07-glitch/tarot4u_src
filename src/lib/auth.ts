import { createClient } from "@/lib/supabase/server";

// Trả null thay vì throw khi chưa đăng nhập — caller (route) tự quyết định
// mã lỗi (401). Dùng chung cho mọi route của Đọc sâu (Giai đoạn 4c).
export async function requireUser(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}

// Dùng client RLS-aware (không phải getSupabaseAdmin) — đúng mục đích của policy
// admin_users_select_own: user chỉ đọc được đúng dòng của chính mình, nên câu
// hỏi "tôi có phải admin không" tự trả lời được mà không cần service-role.
// Không ai liệt kê được danh sách admin qua đường này.
export async function requireAdmin(): Promise<{ id: string } | null> {
  const user = await requireUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? user : null;
}
