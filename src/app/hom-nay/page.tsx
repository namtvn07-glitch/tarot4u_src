"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { DailyScreen } from "@/screens/DailyScreen";
import { useAuthUser } from "@/lib/useAuthUser";
import { fromAuthModalLogin } from "@/lib/user-profile";
import type { AppScreen } from "@/types/tarot";

const SCREEN_PATHS: Partial<Record<AppScreen, string>> = {
  home: "/",
  "deep-read": "/doc-sau",
  library: "/thu-vien",
  account: "/tai-khoan",
};

export default function HomNayPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, loading: isAuthLoading, setUser, logout, addCredits } = useAuthUser();
  const router = useRouter();

  const navigateToScreen = (screen: AppScreen) => {
    const path = SCREEN_PATHS[screen];
    if (path) router.push(path);
  };

  // Phiên khách không mua được credits lẻ cho việc rút thêm (gói `single` chỉ
  // mở khoá Đọc sâu, xem src/lib/orders.ts) nên được đưa đi tạo tài khoản thật —
  // đúng thứ họ cần để nạp credits, và cũng giữ lại credits họ đã có.
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
    <div className="flex min-h-screen flex-col">
      <Header
        currentScreen="daily"
        user={user}
        onOpenTopUp={handleOpenTopUp}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
        onNavigate={(screen) => {
          if (screen === "daily") return;
          navigateToScreen(screen);
        }}
      />

      <main className="relative z-10 flex flex-grow flex-col">
        <DailyScreen
          isAuthReady={!isAuthLoading}
          userId={user.id ?? null}
          isAnonymous={user.isAnonymous}
          credits={user.credits}
          onNavigate={navigateToScreen}
          onOpenTopUp={handleOpenTopUp}
          onCreditsSync={(credits) => setUser((prev) => ({ ...prev, credits }))}
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
