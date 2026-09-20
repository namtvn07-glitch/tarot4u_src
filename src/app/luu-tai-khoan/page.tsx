"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeAnonymousAccount } from "@/components/account/UpgradeAnonymousAccount";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useAuthUser } from "@/lib/useAuthUser";
import type { AppScreen } from "@/types/tarot";

const SCREEN_PATHS: Partial<Record<AppScreen, string>> = {
  home: "/",
  "quick-read": "/trai-bai",
  "deep-read": "/doc-sau",
  library: "/thu-vien",
  account: "/tai-khoan",
};

// Đích của CTA "Lưu Tài Khoản" trên Header. Là một TRANG chứ không phải modal
// vì Header xuất hiện ở mọi trang — làm modal thì phải luồn prop callback qua
// từng trang một, và mỗi trang quên là một lối cụt cho khách đã trả tiền.
//
// Cố ý KHÔNG nằm trong PROTECTED_PREFIXES: phiên ẩn danh bắt buộc phải vào được.
export default function LuuTaiKhoanPage() {
  const { user, loading, logout } = useAuthUser();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const router = useRouter();

  const navigateToScreen = useCallback(
    (screen: AppScreen) => {
      const path = SCREEN_PATHS[screen];
      if (path) router.push(path);
    },
    [router],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={user}
        onOpenTopUp={() => navigateToScreen("deep-read")}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
        onNavigate={navigateToScreen}
      />

      <main className="relative z-10 mx-auto w-full max-w-xl flex-grow px-4 py-10 sm:px-8">
        <h1 className="font-display mb-2 text-2xl font-bold tracking-tight text-[#f3ece1] sm:text-3xl">
          Lưu tài khoản
        </h1>

        {/* Bốn trạng thái, không chỉ trạng thái thành công: đang xác định danh
            tính, phiên khách (việc chính), đã có tài khoản, và chưa có phiên nào. */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 py-16 text-sm text-[#b3a48d]"
          >
            <Loader2 className="h-5 w-5 animate-spin text-[#d4af37]" aria-hidden="true" />
            <span>Đang kiểm tra phiên của bạn…</span>
          </div>
        ) : user.isAnonymous ? (
          <>
            <p className="mb-6 max-w-prose text-sm leading-relaxed text-[#b3a48d]">
              Bạn đang dùng phiên khách với{" "}
              <strong className="text-[#d4af37]">{user.credits} Credits</strong>. Đặt email
              và mật khẩu để giữ lại tất cả.
            </p>
            <UpgradeAnonymousAccount />

            <div className="mt-8 border-t border-[#3d3123] pt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#b3a48d]">
                Không muốn giữ phiên này?
              </h2>
              <p className="mb-3 max-w-prose text-[11px] leading-relaxed text-[#b3a48d]">
                Thoát khỏi phiên khách sẽ xoá nó vĩnh viễn. Chỉ làm việc này nếu
                bạn chắc chắn không cần Credits hay luận giải nào trong đó.
              </p>
              <SignOutButton />
            </div>
          </>
        ) : user.isLoggedIn ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#5fbf8c]/40 bg-[#15100b] p-6">
            <UserCheck className="h-8 w-8 text-[#5fbf8c]" aria-hidden="true" />
            <div>
              <h2 className="font-display mb-1 text-lg font-bold text-[#f3ece1]">
                Bạn đã có tài khoản
              </h2>
              <p className="max-w-prose text-xs leading-relaxed text-[#b3a48d]">
                Đang đăng nhập bằng{" "}
                <strong className="text-[#f3ece1]">{user.email || user.name}</strong>. Không
                cần lưu lại gì thêm.
              </p>
            </div>
            <Link
              href="/tai-khoan"
              className="rounded-xl border border-[#d4af37]/45 bg-[#1c1611] px-4 py-2 text-xs font-semibold text-[#d4af37] no-underline transition-colors hover:border-[#d4af37]"
            >
              Tới trang tài khoản
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#3d3123] bg-[#15100b] p-6">
            <h2 className="font-display text-lg font-bold text-[#f3ece1]">
              Chưa có phiên nào để lưu
            </h2>
            <p className="max-w-prose text-xs leading-relaxed text-[#b3a48d]">
              Trang này dành cho khách đã mua một lượt Đọc sâu mà chưa tạo tài
              khoản. Nếu bạn đã có tài khoản, hãy đăng nhập.
            </p>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="cursor-pointer rounded-xl border border-[#d4af37]/45 bg-[#1c1611] px-4 py-2 text-xs font-semibold text-[#d4af37] transition-colors hover:border-[#d4af37]"
            >
              Đăng nhập
            </button>
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        // Đăng nhập xong là rời trang này ngay — không còn gì để "lưu" nữa,
        // nên không cần đồng bộ state cục bộ trước khi điều hướng.
        onLoginSuccess={() => {
          setIsAuthOpen(false);
          navigateToScreen("account");
        }}
      />
    </div>
  );
}
