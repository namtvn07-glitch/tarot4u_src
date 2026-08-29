"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DeepReadScreen } from "@/screens/DeepReadScreen";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";

export default function DocSauPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, setUser, logout, addCredits, deductCredit } = useAuthUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="deep-read"
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
            if (screen === "quick-read") window.location.href = "/trai-bai";
            if (screen === "library") window.location.href = "/thu-vien";
            if (screen === "account") window.location.href = "/tai-khoan";
          }
        }}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <DeepReadScreen
          credits={user.credits}
          onDeductCredit={deductCredit}
          onSaveReading={(reading) => {
            if (typeof window !== "undefined") {
              const prev = JSON.parse(localStorage.getItem("ventus_readings") || "[]");
              localStorage.setItem("ventus_readings", JSON.stringify([reading, ...prev]));
            }
          }}
          onOpenTopUp={() => {
            if (!user.isLoggedIn) {
              setIsAuthOpen(true);
            } else {
              setIsTopUpOpen(true);
            }
          }}
          onNavigate={(screen) => {
            if (typeof window !== "undefined") {
              if (screen === "home") window.location.href = "/";
              if (screen === "quick-read") window.location.href = "/trai-bai";
              if (screen === "library") window.location.href = "/thu-vien";
              if (screen === "account") window.location.href = "/tai-khoan";
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
