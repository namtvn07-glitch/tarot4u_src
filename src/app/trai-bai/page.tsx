"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuickReadScreen } from "@/screens/QuickReadScreen";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/useAuthUser";
import { fromAuthModalLogin } from "@/lib/user-profile";

export default function TraiBaiPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, setUser, logout, addCredits } = useAuthUser();
  const router = useRouter();

  // Ngoài luồng Đọc sâu, gói lẻ không có ngữ cảnh nào để bán ("mở khoá luận
  // giải bạn đang xem" là câu vô nghĩa ở đây), mà server thì chỉ bán gói `single`
  // cho phiên ẩn danh. Nên phiên khách muốn nạp credits được đưa đi tạo tài
  // khoản thật — đúng thứ họ cần để mua được gói, và cũng là thứ giữ lại
  // credits họ đã có.
  const handleOpenTopUp = () => {
    if (user.isAnonymous) {
      router.push("/luu-tai-khoan");
    } else if (user.isLoggedIn) {
      setIsTopUpOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="quick-read"
        user={user}
        onOpenTopUp={handleOpenTopUp}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
        onNavigate={(screen) => {
          if (typeof window !== "undefined") {
            if (screen === "home") window.location.href = "/";
            if (screen === "deep-read") window.location.href = "/doc-sau";
            if (screen === "library") window.location.href = "/thu-vien";
            if (screen === "account") window.location.href = "/tai-khoan";
          }
        }}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <QuickReadScreen
          onNavigate={(screen) => {
            if (typeof window !== "undefined") {
              if (screen === "home") window.location.href = "/";
              if (screen === "deep-read") window.location.href = "/doc-sau";
              if (screen === "library") window.location.href = "/thu-vien";
              if (screen === "account") window.location.href = "/tai-khoan";
            }
          }}
          onStartDeepRead={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/doc-sau";
            }
          }}
        />
      </main>

      <Footer />

      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={addCredits}
        currentCredits={user.credits}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser(fromAuthModalLogin(u))}
      />
    </div>
  );
}
