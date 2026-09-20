import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/tarot";

// MỘT chỗ duy nhất dịch "hàng auth.users + hàng profiles" thành UserProfile.
//
// Trước đây logic này tồn tại hai bản độc lập — useAuthUser.ts và
// app/tai-khoan/page.tsx — và đã trôi khỏi nhau. Khi thêm phiên ẩn danh, sửa
// một bản mà bỏ bản kia nghĩa là riêng trang /tai-khoan vẫn gọi khách ẩn danh
// là "Thành Viên" với đủ nút phá huỷ tài khoản. Gộp lại để trạng thái đó không
// tái diễn.

export const GUEST_PROFILE: UserProfile = {
  name: "Khách",
  email: "",
  credits: 0,
  isLoggedIn: false,
  isAnonymous: false,
};

/** Các cột `profiles` mà cả hai nơi đọc danh tính đều select. */
export interface ProfileRow {
  credits?: number | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

/**
 * Tên hiển thị. Với phiên ẩn danh KHÔNG có gì để rơi vào: `display_name` NULL
 * (handle_new_user chạy `split_part(NULL,'@',1)`), `email` NULL, metadata rỗng
 * — nên chuỗi fallback cũ luôn chạm literal cuối và gọi họ là "Thành Viên".
 * "Khách" mới là sự thật, và nó cũng là thứ làm CTA nâng cấp đọc lên hợp lý.
 */
function resolveName(authUser: User, profile: ProfileRow | null): string {
  if (authUser.is_anonymous) return "Khách";
  return (
    profile?.display_name ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "Thành Viên"
  );
}

/** Hình dạng mà `AuthModal.onLoginSuccess` trả về. */
export interface AuthModalUser {
  id?: string;
  name: string;
  email: string;
  credits?: number;
  avatarUrl?: string;
}

/**
 * AuthModal chỉ sinh ra tài khoản THẬT — email+mật khẩu, magic link, Google —
 * nên `isAnonymous` ở đây luôn false. Gom vào một hàm thay vì rải
 * `isAnonymous: false` ra 5 trang: nếu sau này có đường đăng nhập nào nhả ra
 * phiên ẩn danh, chỉ một chỗ này phải đổi.
 */
export function fromAuthModalLogin(u: AuthModalUser): UserProfile {
  return {
    ...u,
    credits: u.credits ?? 0,
    isLoggedIn: true,
    isAnonymous: false,
  };
}

export function toUserProfile(authUser: User, profile: ProfileRow | null): UserProfile {
  return {
    id: authUser.id,
    name: resolveName(authUser, profile),
    email: authUser.email || "",
    credits: typeof profile?.credits === "number" ? profile.credits : 0,
    avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    // Ẩn danh vẫn là "đã đăng nhập" theo nghĩa có phiên và mua/đọc được đồ của
    // chính mình. Thứ phân biệt hai loại là isAnonymous bên dưới, không phải cờ
    // này — đừng để isLoggedIn false cho ẩn danh, mọi guard credits sẽ hiểu sai.
    isLoggedIn: true,
    isAnonymous: authUser.is_anonymous ?? false,
  };
}
