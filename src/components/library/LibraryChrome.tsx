"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { useAuthUser } from "@/lib/useAuthUser";
import type { AppScreen } from "@/types/tarot";

interface LibraryChromeProps {
  currentScreen?: AppScreen;
  children: React.ReactNode;
}

export const LibraryChrome: React.FC<LibraryChromeProps> = ({
  currentScreen = "library",
  children,
}) => {
  const router = useRouter();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, setUser, logout, addCredits } = useAuthUser();

  const handleNavigate = (screen: AppScreen) => {
    switch (screen) {
      case "home":
        router.push("/");
        break;
      case "quick-read":
        router.push("/trai-bai");
        break;
      case "deep-read":
        router.push("/doc-sau");
        break;
      case "library":
        router.push("/thu-vien");
        break;
      case "account":
        router.push("/tai-khoan");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen={currentScreen}
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
        onNavigate={handleNavigate}
      />

      <main className="flex-grow flex flex-col relative z-10">
        {children}
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
};
