"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CardDetailScreen } from "@/screens/CardDetailScreen";
import type { AppScreen, TarotCard } from "@/types/tarot";

interface CardDetailPageClientProps {
  card: TarotCard;
}

export const CardDetailPageClient: React.FC<CardDetailPageClientProps> = ({ card }) => {
  const router = useRouter();

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
        router.push("/thu-vien");
        break;
    }
  };

  return (
    <CardDetailScreen
      card={card}
      onNavigate={handleNavigate}
      onStartDeepReadWithInquiry={(inquiry) => {
        router.push(`/doc-sau?inquiry=${encodeURIComponent(inquiry)}`);
      }}
    />
  );
};
