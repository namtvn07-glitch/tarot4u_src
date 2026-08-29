"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LibraryScreen } from "@/screens/LibraryScreen";
import { CardDetailModal } from "@/components/CardDetailModal";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";

export default function ThuVienPage() {
  const [modalCard, setModalCard] = useState<any | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, setUser, logout, addCredits } = useAuthUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="library"
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
            if (screen === "deep-read") window.location.href = "/doc-sau";
            if (screen === "account") window.location.href = "/tai-khoan";
          }
        }}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <LibraryScreen
          onSelectCardForModal={(card) => setModalCard(card)}
          onNavigateToCardDetail={(card) => {
            if (typeof window !== "undefined") {
              window.location.href = `/thu-vien/${card.id}`;
            }
          }}
          onNavigate={(screen) => {
            if (typeof window !== "undefined") {
              if (screen === "home") window.location.href = "/";
              if (screen === "quick-read") window.location.href = "/trai-bai";
              if (screen === "deep-read") window.location.href = "/doc-sau";
              if (screen === "account") window.location.href = "/tai-khoan";
            }
          }}
        />
      </main>

      <Footer />

      <CardDetailModal
        card={modalCard}
        isOpen={!!modalCard}
        onClose={() => setModalCard(null)}
        onNavigateToFullDetail={(card) => {
          if (typeof window !== "undefined") {
            window.location.href = `/thu-vien/${card.id}`;
          }
        }}
        onStartDeepReadWithCard={(card) => {
          if (typeof window !== "undefined") {
            window.location.href = `/doc-sau?inquiry=${encodeURIComponent(
              `Thông điệp chuyên sâu của lá bài ${card.nameVi || card.name}`
            )}`;
          }
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
