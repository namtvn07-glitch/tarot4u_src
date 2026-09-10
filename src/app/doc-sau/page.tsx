"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DeepReadScreen, clearDeepReadSession } from "@/screens/DeepReadScreen";
import { UnsavedDeepSessionModal } from "@/components/reading/UnsavedDeepSessionModal";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";
import type { AppScreen } from "@/types/tarot";
import { READINGS_STORAGE_KEY } from "@/lib/storage-keys";

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
  const { user, setUser, logout, addCredits, deductCredit } = useAuthUser();

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
        onOpenTopUp={() => {
          if (!user.isLoggedIn) {
            setIsAuthOpen(true);
          } else {
            setIsTopUpOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
        onNavigate={handleHeaderNavigate}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <DeepReadScreen
          credits={user.credits}
          onDeductCredit={deductCredit}
          onBusyChange={setIsBusy}
          onSessionActiveChange={setIsDeepSessionActive}
          onSaveReading={(reading) => {
            if (typeof window !== "undefined") {
              const prev = JSON.parse(localStorage.getItem(READINGS_STORAGE_KEY) || "[]");
              localStorage.setItem(READINGS_STORAGE_KEY, JSON.stringify([reading, ...prev]));
            }
          }}
          onOpenTopUp={() => {
            if (!user.isLoggedIn) {
              setIsAuthOpen(true);
            } else {
              setIsTopUpOpen(true);
            }
          }}
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser({ ...u, isLoggedIn: true, credits: u.credits ?? 0 })}
      />
    </div>
  );
}
