"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryScreen } from "@/screens/LibraryScreen";
import { CardDetailModal } from "@/components/CardDetailModal";
import type { AppScreen, TarotCard } from "@/types/tarot";

export const LibraryIndexClient: React.FC = () => {
  const router = useRouter();
  const [modalCard, setModalCard] = useState<TarotCard | null>(null);

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
    <>
      <LibraryScreen
        onSelectCardForModal={(card) => setModalCard(card)}
        onNavigateToCardDetail={(card) => {
          router.push(`/thu-vien/${card.id}`);
        }}
        onNavigate={handleNavigate}
      />

      <CardDetailModal
        card={modalCard}
        isOpen={!!modalCard}
        onClose={() => setModalCard(null)}
        onNavigateToFullDetail={(card) => {
          router.push(`/thu-vien/${card.id}`);
        }}
        onStartDeepReadWithCard={(card) => {
          router.push(
            `/doc-sau?inquiry=${encodeURIComponent(
              `Thông điệp chuyên sâu của lá bài ${card.nameVi || card.name}`
            )}`
          );
        }}
      />
    </>
  );
};
