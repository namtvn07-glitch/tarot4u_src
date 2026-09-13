"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { purgeForeignUserStorage } from "@/lib/user-scoped-storage";

/**
 * Dọn dữ liệu còn sót của tài khoản trước ra khỏi trình duyệt, mỗi khi danh
 * tính thay đổi.
 *
 * Đặt ở root layout chứ không nằm trong `useAuthUser`: đăng xuất trong ứng
 * dụng này xảy ra ở nhiều chỗ không đi qua hook đó (SignOutButton,
 * DeleteAccountButton, trang /tai-khoan tự gọi `signOut`, và cả phiên hết hạn
 * do refresh token chết). Bám vào `onAuthStateChange` là điểm duy nhất mọi
 * đường đăng xuất/đăng nhập đều đi qua.
 *
 * Không render gì.
 */
export function UserScopedStorageGuard() {
  useEffect(() => {
    const supabase = createClient();

    // CHỈ bám onAuthStateChange, cố ý KHÔNG gọi getUser(). Sự kiện
    // INITIAL_SESSION được phát ngay lúc đăng ký với phiên đọc từ cookie
    // (_emitInitialSession → _useSession, không chạm mạng), đủ để trả lời câu
    // hỏi duy nhất mà việc dọn dữ liệu cần: "trình duyệt này đang là ai".
    // getUser() thì luôn bắn GET /auth/v1/user khi còn phiên — thêm một
    // round-trip cho MỌI lượt tải trang của người đã đăng nhập, mà phần lớn
    // còn trùng với cú getUser() sẵn có trong useAuthUser.
    //
    // Đánh đổi: cookie còn nhưng phiên đã bị thu hồi phía server thì ở đây
    // vẫn thấy là người cũ. Không phải lỗ hổng của tính năng này — dữ liệu
    // hiện ra vẫn là của chính chủ cookie đó, không sang tay tài khoản khác;
    // và khi refresh token chết thật thì SIGNED_OUT vẫn về qua đúng kênh này.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      purgeForeignUserStorage(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
