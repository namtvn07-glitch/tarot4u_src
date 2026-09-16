"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GUEST_PROFILE, toUserProfile } from "@/lib/user-profile";
import type { UserProfile } from "@/types/tarot";

export function useAuthUser() {
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // MỘT nguồn duy nhất cho danh tính: onAuthStateChange.
    //
    // Trước đây ở đây còn một hàm loadSession() chạy song song, gọi
    // `getUser()` rồi đọc bảng `profiles` — trong khi onAuthStateChange phát
    // INITIAL_SESSION ngay lúc đăng ký và đọc `profiles` lần thứ hai cho đúng
    // một user đó. Mỗi lượt tải trang của người đã đăng nhập vì vậy tốn 3
    // request (1 GET /auth/v1/user + 2 lần select profiles) để lấy về đúng
    // một thứ, và hai đường ghi state đua nhau setUser.
    //
    // INITIAL_SESSION đọc phiên từ cookie, không chạm mạng, và luôn được phát
    // (GoTrueClient._initialize có try/catch/finally nên initializePromise
    // không bao giờ reject — kể cả lỗi cũng phát INITIAL_SESSION với null).
    // Đổi lại: phiên bị thu hồi phía server mà cookie còn sót sẽ hiện là vẫn
    // đăng nhập cho tới sự kiện tiếp theo. Không phải lỗ hổng — đây chỉ là
    // phần hiển thị; mọi hành động thật đều qua API route và `requireUser()`
    // xác thực lại phía server, còn select `profiles` với JWT hỏng thì RLS
    // chặn, credits về 0 chứ không lộ gì.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const authUser = session?.user;
        if (!authUser) {
          setUser(GUEST_PROFILE);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, display_name, avatar_url")
          .eq("id", authUser.id)
          .single();

        setUser(toUserProfile(authUser, profile));
      } finally {
        // Mọi nhánh — kể cả lỗi đọc `profiles` — đều phải chốt "đã biết đang
        // là ai". DeepReadScreen chờ đúng cờ này mới dám đọc/ghi
        // sessionStorage, treo ở đây là treo luôn việc khôi phục phiên trải
        // bài sâu.
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Mạng lỗi/phiên đã chết sẵn — vẫn hạ UI về trạng thái khách ngay bên
      // dưới, không để người dùng kẹt ở màn hình "vẫn đang đăng nhập".
    }
    setUser(GUEST_PROFILE);
  };

  const addCredits = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      credits: prev.credits + amount,
    }));
  };

  const deductCredit = (amount: number): boolean => {
    if (user.credits >= amount) {
      setUser((prev) => ({
        ...prev,
        credits: prev.credits - amount,
      }));
      return true;
    }
    return false;
  };

  return {
    user,
    loading,
    setUser,
    logout,
    addCredits,
    deductCredit,
  };
}
