"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { CardDetailModal } from "@/components/CardDetailModal";
import { ReadingDetailModal } from "@/components/ReadingDetailModal";

import { HomeScreen } from "@/screens/HomeScreen";
import { QuickReadScreen } from "@/screens/QuickReadScreen";
import { DeepReadScreen } from "@/screens/DeepReadScreen";
import { LibraryScreen } from "@/screens/LibraryScreen";
import { CardDetailScreen } from "@/screens/CardDetailScreen";
import { AccountScreen } from "@/screens/AccountScreen";

import { TAROT_CARDS } from "@/data/tarotCards";
import type { AppScreen, TarotCard, UserProfile, ReadingHistoryItem } from "@/types/tarot";
import { useAuthUser } from "@/lib/useAuthUser";
import { createClient } from "@/lib/supabase/client";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("home");
  const { user, setUser, logout, addCredits, deductCredit } = useAuthUser();
  const [readings, setReadings] = useState<ReadingHistoryItem[]>([]);

  // Navigation states
  const [selectedCardDetail, setSelectedCardDetail] = useState<any>(
    TAROT_CARDS.find((c) => c.id === "the-magician") || TAROT_CARDS[1] || TAROT_CARDS[0]
  );
  const [deepReadInquiry, setDeepReadInquiry] = useState<string>("");

  // Modals
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [modalCard, setModalCard] = useState<any | null>(null);
  const [selectedReadingModal, setSelectedReadingModal] = useState<ReadingHistoryItem | null>(null);

  // Load readings for logged in user
  useEffect(() => {
    if (user.id) {
      const fetchReadings = async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("readings")
            .select("id, created_at, topic, question, cards_drawn, personal_body")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (data && data.length > 0) {
            const formatted = data.map((r: any) => ({
              id: r.id,
              date: new Date(r.created_at).toLocaleDateString("vi-VN"),
              topic: r.topic,
              topicVi: r.topic === "love" ? "Tình Yêu" : r.topic === "career" ? "Sự Nghiệp" : r.topic === "finance" ? "Tài Chính" : "Tổng Quan",
              question: r.question,
              cards: (r.cards_drawn || []).map((c: any, i: number) => ({
                name: c.card_id,
                nameVi: c.card_id,
                image: `/cards/${c.card_id}.jpg`,
                orientation: c.orientation || "upright",
                position: i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai",
              })),
              personalBody: r.personal_body,
            }));
            setReadings(formatted);
          }
        } catch {
          // ignore
        }
      };

      fetchReadings();
    } else {
      setReadings([]);
    }
  }, [user.id]);

  const handleNavigate = (screen: AppScreen) => {
    setCurrentScreen(screen);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveReading = (newReading: ReadingHistoryItem) => {
    setReadings((prev) => [newReading, ...prev]);
  };

  const handleSelectTopicFromHome = (topicId: string) => {
    const topicPrompts: Record<string, string> = {
      love: "Làm thế nào để tôi mở rộng trái tim và thấu hiểu mối liên kết hiện tại?",
      career: "Những trở ngại nào đang ngăn cản sự thăng tiến trong sự nghiệp của tôi?",
      finance: "Dòng chảy tài chính và những cơ hội thịnh vượng nào sắp tới?",
      spiritual: "Tôi cần lắng nghe thông điệp nội tâm nào để tìm thấy sự bình yên?",
      general: "Bức tranh tổng quan và lời khuyên soi sáng cho giai đoạn này là gì?",
    };
    setDeepReadInquiry(topicPrompts[topicId] || "");
    handleNavigate("deep-read");
  };

  const handleNavigateToCardDetail = (card: any) => {
    setSelectedCardDetail(card);
    handleNavigate("card-detail");
  };

  const handleStartDeepReadWithInquiry = (inquiry: string) => {
    setDeepReadInquiry(inquiry);
    handleNavigate("deep-read");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
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
      />

      {/* Main Content View */}
      <main className="flex-grow flex flex-col relative z-10">
        {currentScreen === "home" && (
          <HomeScreen
            onNavigate={handleNavigate}
            onSelectTopic={handleSelectTopicFromHome}
            onViewCardDetail={handleNavigateToCardDetail}
            onStartDeepReadWithInquiry={handleStartDeepReadWithInquiry}
          />
        )}

        {currentScreen === "quick-read" && (
          <QuickReadScreen
            onNavigate={handleNavigate}
            onStartDeepRead={() => handleNavigate("deep-read")}
          />
        )}

        {currentScreen === "deep-read" && (
          <DeepReadScreen
            key={deepReadInquiry}
            initialInquiry={deepReadInquiry}
            onNavigate={handleNavigate}
            credits={user.credits}
            onDeductCredit={deductCredit}
            onSaveReading={handleSaveReading}
            onOpenTopUp={() => {
              if (!user.isLoggedIn) {
                setIsAuthOpen(true);
              } else {
                setIsTopUpOpen(true);
              }
            }}
          />
        )}

        {currentScreen === "library" && (
          <LibraryScreen
            onSelectCardForModal={(card) => setModalCard(card)}
            onNavigateToCardDetail={handleNavigateToCardDetail}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === "card-detail" && (
          <CardDetailScreen
            card={selectedCardDetail}
            onNavigate={handleNavigate}
            onStartDeepReadWithInquiry={handleStartDeepReadWithInquiry}
          />
        )}

        {currentScreen === "account" && (
          <AccountScreen
            user={user}
            readings={readings}
            onOpenTopUp={() => {
              if (!user.isLoggedIn) {
                setIsAuthOpen(true);
              } else {
                setIsTopUpOpen(true);
              }
            }}
            onNavigate={handleNavigate}
            onViewReadingDetail={(reading) => setSelectedReadingModal(reading)}
          />
        )}
      </main>

      {/* Universal Footer */}
      <Footer />

      {/* Modals */}
      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={addCredits}
        currentCredits={user.credits}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(userData) => {
          setUser({
            ...userData,
            isLoggedIn: true,
            credits: userData.credits ?? 0,
          });
        }}
      />

      <CardDetailModal
        card={modalCard}
        isOpen={!!modalCard}
        onClose={() => setModalCard(null)}
        onNavigateToFullDetail={handleNavigateToCardDetail}
        onStartDeepReadWithCard={(card) => {
          handleStartDeepReadWithInquiry(
            `Thông điệp chuyên sâu từ lá bài ${card.nameVi || card.name} đối với hoàn cảnh hiện tại của tôi là gì?`
          );
        }}
      />

      <ReadingDetailModal
        reading={selectedReadingModal}
        isOpen={!!selectedReadingModal}
        onClose={() => setSelectedReadingModal(null)}
      />
    </div>
  );
}
