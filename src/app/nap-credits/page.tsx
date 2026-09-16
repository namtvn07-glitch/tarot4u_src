"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";
import { fromAuthModalLogin } from "@/lib/user-profile";

export default function NapCreditsPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, loading, setUser, logout, addCredits } = useAuthUser();
  const router = useRouter();

  // Phiên khách ĐƯỢC PHÉP vào prefix /nap-credits — trang kết quả thanh toán
  // nằm dưới đó và khách vừa chuyển khoản bắt buộc phải xem được. Nhưng trang
  // chọn gói này thì không dành cho họ: server chỉ bán gói `single` cho phiên
  // ẩn danh, nên để modal tự bung ra sẽ dẫn thẳng tới một cú 403 không giải
  // thích được gì. Đưa họ đi tạo tài khoản thật thay vì để họ đâm vào tường.
  const isGuestSession = user.isAnonymous;

  const handleOpenTopUp = () => {
    if (isGuestSession) {
      router.push("/luu-tai-khoan");
    } else if (user.isLoggedIn) {
      setIsOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        user={user}
        onOpenTopUp={handleOpenTopUp}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
      />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        {!loading && isGuestSession && (
          <div className="w-full max-w-md rounded-2xl border border-[#3d3123] bg-[#15100b] p-6 text-center">
            <h1 className="font-display mb-2 text-xl font-bold text-[#f3ece1]">
              Cần một tài khoản để nạp Credits
            </h1>
            <p className="mb-4 text-xs leading-relaxed text-[#b3a48d]">
              Bạn đang dùng phiên khách. Hãy đặt email và mật khẩu để giữ lại
              Credits đã có và mua được các gói nhiều lượt.
            </p>
            <Link
              href="/luu-tai-khoan"
              className="inline-block rounded-xl border border-[#d4af37]/45 bg-[#1c1611] px-4 py-2 text-xs font-semibold text-[#d4af37] no-underline transition-colors hover:border-[#d4af37]"
            >
              Lưu tài khoản
            </Link>
          </div>
        )}

        {/* Chờ biết chắc đang là ai rồi mới bung modal: "chưa biết" khác
            "không phải khách", và bung nhầm cho phiên khách là dẫn họ tới 403. */}
        <CreditTopUpModal
          isOpen={isOpen && !loading && !isGuestSession}
          onClose={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
          onSuccess={(added) => {
            addCredits(added);
            if (typeof window !== "undefined") {
              window.location.href = "/nap-credits/ket-qua?status=PAID";
            }
          }}
          currentCredits={user.credits}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(u) => {
            setUser(fromAuthModalLogin(u));
            setIsOpen(true);
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
