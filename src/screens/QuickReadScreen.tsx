"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, Zap, ArrowRight, BookOpen, Layers } from "lucide-react";
import { TAROT_CARDS, CARD_BACK_IMAGE } from "@/data/tarotCards";
import type { AppScreen, TarotCard } from "@/types/tarot";

interface QuickReadScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onStartDeepRead: () => void;
}

type QuickReadPhase = "intro" | "picking" | "result";

export const QuickReadScreen: React.FC<QuickReadScreenProps> = ({
  onNavigate,
  onStartDeepRead,
}) => {
  const [phase, setPhase] = useState<QuickReadPhase>("intro");
  const [selectedCard, setSelectedCard] = useState<any>(TAROT_CARDS[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  const startPicking = () => {
    setPhase("picking");
    setIsFlipped(false);
    setShowEffects(false);
  };

  const handlePickCard = (index: number) => {
    const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    setSelectedCard(randomCard);
    setPhase("result");

    // Sequence animations
    setTimeout(() => {
      setIsFlipped(true);
      setShowEffects(true);
    }, 450);
  };

  const resetDeck = () => {
    setIsFlipped(false);
    setShowEffects(false);
    setPhase("picking");
  };

  const cardImage = selectedCard.imageUrl || selectedCard.image || `/cards/${selectedCard.image_filename || "the-fool.jpg"}`;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-10 flex flex-col items-center justify-start relative z-10">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-6 mb-8 border-b border-[#3d3123]/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37]">
              Trực Giác Nhanh
            </span>
            <span className="text-xs text-[#7a6e5d]">Miễn Phí • Lớp Nền</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl text-[#f3ece1] font-bold">
            Rút Bài Nhanh (1 Lá)
          </h1>
        </div>

        <button
          onClick={() => onNavigate("home")}
          className="text-xs text-[#b3a48d] hover:text-[#d4af37] transition-colors cursor-pointer"
        >
          ← Quay lại Trang Chủ
        </button>
      </div>

      {/* Phase 1: Intro */}
      {phase === "intro" && (
        <div className="max-w-xl mx-auto text-center py-12 flex flex-col items-center animate-in fade-in duration-300">
          <div className="w-44 aspect-[2/3] rounded-2xl border-2 border-[#d4af37]/60 shadow-[0_0_35px_rgba(212,175,55,0.35)] overflow-hidden bg-[#050505] mb-8 relative animate-levitate-1">
            <img
              src={CARD_BACK_IMAGE}
              alt="Tarot Card Back"
              className="w-full h-full object-cover"
            />
            <div className="card-shimmer" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-white font-bold mb-3">
            Định Tâm & Nhận Thông Điệp
          </h2>
          <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-8 max-w-md">
            Hãy hít thở sâu, thả lỏng tâm trí và nghĩ về vấn đề bạn đang băn khoăn trước khi chạm vào bộ bài.
          </p>

          <button
            onClick={startPicking}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(143,90,31,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Xáo Bài & Rút Lá</span>
          </button>
        </div>
      )}

      {/* Phase 2: Card Spread Picker (Fan) */}
      {phase === "picking" && (
        <section className="w-full flex flex-col items-center py-6 animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest block mb-1">
              Trực Giác Dẫn Lối
            </span>
            <h3 className="font-display text-xl sm:text-2xl text-white">
              Chọn 1 lá bài thu hút năng lượng của bạn nhất
            </h3>
          </div>

          {/* Interactive 3D Card Fan */}
          <div className="relative w-full max-w-3xl h-64 sm:h-80 flex items-center justify-center overflow-visible my-4">
            {Array.from({ length: 15 }).map((_, i) => {
              const total = 15;
              const angle = (i - (total - 1) / 2) * 4.5;
              const normalizedX = (i - (total - 1) / 2) / ((total - 1) / 2);
              const yOffset = Math.abs(normalizedX * normalizedX) * 35;

              return (
                <div
                  key={i}
                  onClick={() => handlePickCard(i)}
                  className="absolute w-24 sm:w-32 aspect-[2/3] rounded-xl border border-[#3d3123] hover:border-[#d4af37] bg-[#15100b] shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-8 hover:scale-110 hover:z-50 hover:shadow-[0_0_35px_rgba(212,175,55,0.7)] group"
                  style={{
                    transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
                    transformOrigin: "bottom center",
                    zIndex: i,
                    backgroundImage: `url(${CARD_BACK_IMAGE})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="card-shimmer" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Phase 3: Result Revealed */}
      {phase === "result" && (
        <section className="w-full max-w-5xl mx-auto animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Card Display with Flip */}
            <div className="md:col-span-5 flex flex-col justify-center items-center relative">
              <div className="w-60 sm:w-72 aspect-[2/3] perspective-1000 relative animate-card-fly-center">
                {showEffects && <div className="burst-active" />}

                {/* Flipping 3D Card */}
                <div
                  className="w-full h-full relative preserve-3d transition-transform duration-700 ease-out"
                  style={{
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Card Back */}
                  <div
                    className="absolute inset-0 rounded-2xl border-2 border-[#3d3123] shadow-2xl overflow-hidden bg-[#15100b] backface-hidden"
                    style={{
                      backgroundImage: `url(${CARD_BACK_IMAGE})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  {/* Card Front */}
                  <div
                    className={`absolute inset-0 rounded-2xl border-2 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.45)] overflow-hidden bg-[#15100b] rotate-y-180 backface-hidden ${
                      showEffects ? "sheen-active" : ""
                    }`}
                  >
                    <img
                      src={cardImage}
                      alt={selectedCard.name || selectedCard.name_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-[#d4af37] font-medium tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Lá bài đã giáng lâm</span>
              </div>
            </div>

            {/* Right: Interpretation Panel */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="bg-[#15100b] p-6 sm:p-8 rounded-2xl border-l-4 border-l-[#d4af37] border-y border-r border-[#3d3123] shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                    Thông Điệp Chỉ Dẫn • {selectedCard.arcanaLabelVi || (selectedCard.arcana === "major" ? "Bộ Ẩn Chính" : "Bộ Ẩn Phụ")}
                  </span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl text-white font-bold mb-0.5">
                  {selectedCard.name || selectedCard.name_en}
                </h2>
                <h3 className="font-display text-xl text-[#d4af37] mb-4">
                  {selectedCard.nameVi || selectedCard.name_vi}
                </h3>

                <div className="space-y-3 text-[#b3a48d] text-xs sm:text-sm leading-relaxed">
                  <p>{selectedCard.psychologySummary || selectedCard.summary || selectedCard.uprightMeaning}</p>
                  {(selectedCard.quote || selectedCard.ventusAdvice) && (
                    <p className="pt-3 border-t border-[#3d3123]/70 text-[#f3ece1] italic font-display text-sm sm:text-base">
                      {selectedCard.quote || selectedCard.ventusAdvice}
                    </p>
                  )}
                </div>
              </div>

              {/* Deep Read CTA Banner */}
              <div className="p-5 rounded-2xl border border-[#3d3123] bg-[#1c1611] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#d4af37] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-display text-base text-white font-semibold">
                      Cần Lời Giải Đáp Chi Tiết Hơn?
                    </h4>
                    <p className="text-xs text-[#7a6e5d] mt-0.5">
                      Khám phá liên kết 3 lá bài Quá khứ - Hiện tại - Tương lai chuyên sâu.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onStartDeepRead}
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(143,90,31,0.4)] whitespace-nowrap cursor-pointer"
                >
                  Trải Bài Sâu 3 Lá
                </button>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={resetDeck}
                  className="text-xs font-semibold text-[#b3a48d] hover:text-[#d4af37] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rút Lại Lá Khác</span>
                </button>

                <button
                  onClick={() => onNavigate("library")}
                  className="text-xs font-semibold text-[#7a6e5d] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Tra Cứu Trong Thư Viện</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
