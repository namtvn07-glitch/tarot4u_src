"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuthUser } from "@/lib/useAuthUser";

export default function NapCreditsPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, setUser, logout, addCredits } = useAuthUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        user={user}
        onOpenTopUp={() => {
          if (!user.isLoggedIn) {
            setIsAuthOpen(true);
          } else {
            setIsOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
      />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <CreditTopUpModal
          isOpen={isOpen}
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
            setUser({ ...u, isLoggedIn: true, credits: u.credits ?? 0 });
            setIsOpen(true);
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
