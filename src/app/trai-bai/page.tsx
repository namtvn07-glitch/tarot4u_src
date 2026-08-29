"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuickReadScreen } from "@/screens/QuickReadScreen";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";

export default function TraiBaiPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, setUser, logout, addCredits } = useAuthUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="quick-read"
        user={user}
        onOpenTopUp={() => {
          if (!user.isLoggedIn) {
            setIsAuthOpen(true);
          } else {
            setIsTopUpOpen(true);
          }
        }}
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
        onLoginSuccess={(u) => setUser({ ...u, isLoggedIn: true, credits: u.credits ?? 0 })}
      />
    </div>
  );
}
