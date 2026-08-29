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
