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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data } = await createClient()
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) setIsAdmin(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return isAdmin;
}
