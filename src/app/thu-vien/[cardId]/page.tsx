"use client";

import React, { use } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CardDetailScreen } from "@/screens/CardDetailScreen";
import { TAROT_CARDS } from "@/data/tarotCards";
import { useAuthUser } from "@/lib/useAuthUser";

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = use(params);
  const card = TAROT_CARDS.find((c) => c.id === cardId) || TAROT_CARDS[0];
  const { user, logout } = useAuthUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="library"
        user={user}
        onOpenTopUp={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/nap-credits";
          }
        }}
        onOpenAuth={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/dang-nhap";
          }
        }}
        onLogout={logout}
        onNavigate={(screen) => {
          if (typeof window !== "undefined") {
            if (screen === "home") window.location.href = "/";
            if (screen === "quick-read") window.location.href = "/trai-bai";
            if (screen === "deep-read") window.location.href = "/doc-sau";
            if (screen === "library") window.location.href = "/thu-vien";
            if (screen === "account") window.location.href = "/tai-khoan";
          }
        }}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <CardDetailScreen
          card={card}
          onNavigate={(screen) => {
            if (typeof window !== "undefined") {
              if (screen === "library") window.location.href = "/thu-vien";
              if (screen === "deep-read") window.location.href = "/doc-sau";
              if (screen === "home") window.location.href = "/";
            }
          }}
          onStartDeepReadWithInquiry={(inquiry) => {
            if (typeof window !== "undefined") {
              window.location.href = `/doc-sau?inquiry=${encodeURIComponent(inquiry)}`;
            }
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
