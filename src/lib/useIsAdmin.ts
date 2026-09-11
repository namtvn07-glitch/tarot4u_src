"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// CHỈ để quyết định có hiện lối vào khu quản trị hay không — KHÔNG phải hàng
// rào bảo mật. Người dùng có thể sửa giá trị này trong trình duyệt, nhưng làm
// vậy cũng chỉ hiện ra một cái nút dẫn tới /admin và nhận về 404: cổng thật
// nằm ở src/app/admin/layout.tsx chạy phía server.
//
// Truy vấn này an toàn nhờ policy admin_users_select_own: mỗi người chỉ đọc
// được đúng dòng của chính mình, không ai liệt kê được danh sách admin.
export function useIsAdmin(userId?: string): boolean {
  // Lưu chính user id đã được xác nhận là admin, không phải một boolean trần.
  // Nhờ vậy khi userId đổi (đăng xuất, đổi tài khoản) kết quả tự sai NGAY
  // trong cùng lần render đó — bản cũ phải chạy thêm một effect `setIsAdmin
  // (false)` để dọn, nên có một nhịp render mà tài khoản mới vẫn thừa hưởng
  // quyền admin của tài khoản cũ.
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    void (async () => {
      const { data } = await createClient()
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled && data) setAdminUserId(userId);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return userId !== undefined && adminUserId === userId;
}
