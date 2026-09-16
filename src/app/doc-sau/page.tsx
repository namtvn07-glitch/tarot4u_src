"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DeepReadScreen, clearDeepReadSession } from "@/screens/DeepReadScreen";
import { UnsavedDeepSessionModal } from "@/components/reading/UnsavedDeepSessionModal";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { GuestUnlockChoice } from "@/components/reading/GuestUnlockChoice";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";
import { fromAuthModalLogin } from "@/lib/user-profile";
import type { AppScreen } from "@/types/tarot";
import { saveLocalReading } from "@/lib/user-scoped-storage";

function navigateToScreen(screen: AppScreen) {
  if (typeof window === "undefined") return;
  if (screen === "home") window.location.href = "/";
  if (screen === "quick-read") window.location.href = "/trai-bai";
  if (screen === "library") window.location.href = "/thu-vien";
  if (screen === "account") window.location.href = "/tai-khoan";
}

export default function DocSauPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isDeepSessionActive, setIsDeepSessionActive] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<AppScreen | null>(null);
  const [isGuestPurchaseOpen, setIsGuestPurchaseOpen] = useState(false);
  const [isUnlockChoiceOpen, setIsUnlockChoiceOpen] = useState(false);
  const { user, loading: isAuthLoading, setUser, logout, addCredits, deductCredit } = useAuthUser();

  const hasAccount = user.isLoggedIn && !user.isAnonymous;

  // Ba nhánh, không phải hai. Trước đây "chưa đăng nhập" mở AuthModal — đó
  // CHÍNH LÀ tường đăng ký mà tính năng này dỡ bỏ.
  //
  // Khách chưa có tài khoản không bị đẩy thẳng vào trang thanh toán: họ thấy
  // ngã ba "xem trực tiếp / đăng nhập mua gói" trước, vì mua lẻ đắt hơn hẳn
  // tính trên mỗi lượt và giấu điều đó là bán cho họ lựa chọn đắt hơn mà không
  // nói. Chỉ tài khoản thật mới thấy thẳng bảng gói credits.
  //
  // Hàm này chỉ được gọi từ DeepReadScreen, sau khi đã lật đủ 3 lá — Header
  // không còn nút credits cho người chưa đăng nhập.
  const handleOpenPurchase = () => {
    if (hasAccount) {
      setIsTopUpOpen(true);
    } else {
      setIsUnlockChoiceOpen(true);
    }
  };

  const handleHeaderNavigate = (screen: AppScreen) => {
    if (isDeepSessionActive && screen !== "deep-read") {
      setPendingNavTarget(screen);
      return;
    }
    navigateToScreen(screen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="deep-read"
        user={user}
        isBusy={isBusy}
        onOpenTopUp={handleOpenPurchase}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
        onNavigate={handleHeaderNavigate}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <DeepReadScreen
          userId={user.id ?? null}
          isAuthReady={!isAuthLoading}
          isAnonymous={user.isAnonymous}
          credits={user.credits}
          onDeductCredit={deductCredit}
          onBusyChange={setIsBusy}
          onSessionActiveChange={setIsDeepSessionActive}
          onSaveReading={(reading) => saveLocalReading(reading, user.id ?? null)}
          onOpenTopUp={handleOpenPurchase}
          onNavigate={navigateToScreen}
        />
      </main>

      <Footer />

      <UnsavedDeepSessionModal
        isOpen={pendingNavTarget !== null}
        onStay={() => setPendingNavTarget(null)}
        onSaveAndLeave={() => {
          if (pendingNavTarget) navigateToScreen(pendingNavTarget);
          setPendingNavTarget(null);
        }}
        onDiscardAndLeave={() => {
          clearDeepReadSession();
          if (pendingNavTarget) navigateToScreen(pendingNavTarget);
          setPendingNavTarget(null);
        }}
      />

      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={addCredits}
        currentCredits={user.credits}
      />

      <GuestUnlockChoice
        isOpen={isUnlockChoiceOpen}
        onClose={() => setIsUnlockChoiceOpen(false)}
        onChooseDirect={() => {
          setIsUnlockChoiceOpen(false);
          setIsGuestPurchaseOpen(true);
        }}
        onChooseLogin={() => {
          setIsUnlockChoiceOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Cùng component, khác variant — đường tiền bên dưới chỉ có một bản. */}
      <CreditTopUpModal
        mode="single"
        isOpen={isGuestPurchaseOpen}
        onClose={() => setIsGuestPurchaseOpen(false)}
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
