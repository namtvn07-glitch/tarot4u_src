"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Eye, Lightbulb, Compass } from "lucide-react";
import { TAROT_CARDS } from "@/data/tarotCards";

interface DailyTarotMessageProps {
  onViewCardDetail?: (card: any) => void;
  onStartDeepReadWithInquiry?: (inquiry: string) => void;
}

export const DailyTarotMessage: React.FC<DailyTarotMessageProps> = ({
  onViewCardDetail,
  onStartDeepReadWithInquiry,
}) => {
  const [dailyCard, setDailyCard] = useState<any>(() => {
    // Generate deterministic card for the day or random
    const daySeed = new Date().getDate();
    return TAROT_CARDS[daySeed % TAROT_CARDS.length] || TAROT_CARDS[0];
  });
  const [todayFormatted, setTodayFormatted] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const today = new Date();
    try {
      setTodayFormatted(
        new Intl.DateTimeFormat("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(today)
      );
    } catch {
      setTodayFormatted(`Ngày ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`);
    }
  }, []);

  const handleDrawNewDaily = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      let newIndex = Math.floor(Math.random() * TAROT_CARDS.length);
      while (TAROT_CARDS[newIndex]?.id === dailyCard.id && TAROT_CARDS.length > 1) {
        newIndex = Math.floor(Math.random() * TAROT_CARDS.length);
      }
      setDailyCard(TAROT_CARDS[newIndex]);
      setIsRefreshing(false);
    }, 350);
  };

  const cardImage = dailyCard.imageUrl || dailyCard.image || `/cards/${dailyCard.image_filename || "the-fool.jpg"}`;
  const keywords = dailyCard.uprightKeywords || dailyCard.keywords || [];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-8 my-6">
      <div className="relative rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 bg-gradient-to-br from-[#15100b]/95 via-[#0e0a08]/98 to-[#1c1611]/95 shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Mystic Aura Lights */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#d4af37]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#8f5a1f]/15 rounded-full blur-[70px] pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#3d3123]/70 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                  Thông Điệp Của Ngày
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d4af37]/60" />
                <span className="text-xs text-[#b3a48d] font-light">
                  {todayFormatted || "Hôm Nay"}
                </span>
              </div>
              <p className="text-xs text-[#b3a48d]/80 hidden sm:block">
                Năng lượng vũ trụ & lời chỉ dẫn định tâm cho ngày mới của bạn
              </p>
            </div>
          </div>

          {/* Action: Draw another */}
          <button
            onClick={handleDrawNewDaily}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-full bg-[#251d16] hover:bg-[#2f241c] border border-[#3d3123] hover:border-[#d4af37] text-xs text-[#b3a48d] hover:text-[#d4af37] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Đổi lá bài ngẫu nhiên khác"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#d4af37]" : ""}`} />
            <span>Rút Lại</span>
          </button>
        </div>

        {/* Card & Wisdom Body */}
        <div
          className={`grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10 transition-opacity duration-300 ${
            isRefreshing ? "opacity-30 scale-[0.99]" : "opacity-100 scale-100"
          }`}
        >
          {/* Left Column: Floating Card Visual */}
          <div className="md:col-span-4 flex flex-col items-center justify-center">
            <div className="w-40 sm:w-48 aspect-[2/3] rounded-2xl border-2 border-[#d4af37]/60 shadow-[0_0_30px_rgba(212,175,55,0.35)] overflow-hidden bg-[#050505] relative group animate-levitate-1">
              <img
                src={cardImage}
                alt={dailyCard.name || dailyCard.name_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-mono text-[#d4af37] tracking-wider uppercase bg-[#15100b]/85 py-0.5 rounded backdrop-blur-sm border border-[#d4af37]/30">
                {dailyCard.arcanaLabelVi || (dailyCard.arcana === "major" ? "Ẩn Chính" : "Ẩn Phụ")}
              </div>
            </div>
          </div>

          {/* Right Column: Interpretation & Advice */}
          <div className="md:col-span-8 space-y-3.5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider">
                  {dailyCard.arcanaLabelVi || (dailyCard.arcana === "major" ? "Bộ Ẩn Chính" : "Bộ Ẩn Phụ")}
                </span>
                <span className="text-xs text-[#7a6e5d] font-mono">#{dailyCard.number}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
                {dailyCard.nameVi || dailyCard.name_vi}{" "}
                <span className="text-base text-[#b3a48d] font-normal italic">
                  ({dailyCard.name || dailyCard.name_en})
                </span>
              </h3>
            </div>

            {/* Quote of the Day */}
            {dailyCard.quote && (
              <div className="p-3 rounded-xl bg-[#1c1611]/80 border-l-2 border-l-[#d4af37] border-y border-r border-[#3d3123]/50 text-xs sm:text-sm text-[#b3a48d] italic font-display">
                {dailyCard.quote}
              </div>
            )}

            {/* Ventus Advice */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Lời Khuyên Từ Ventus
              </span>
              <p className="text-xs sm:text-sm text-[#f3ece1]/90 leading-relaxed font-light">
                {dailyCard.ventusAdvice || dailyCard.psychologySummary || dailyCard.summary}
              </p>
            </div>

            {/* Keyword Chips */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.slice(0, 4).map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-[#251d16] text-[10px] text-[#b3a48d] border border-[#3d3123]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onViewCardDetail && (
                <button
                  onClick={() => onViewCardDetail(dailyCard)}
                  className="px-4 py-2 rounded-full bg-[#8f5a1f]/30 hover:bg-[#8f5a1f]/50 border border-[#d4af37]/60 text-xs font-semibold text-[#d4af37] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Đọc Chi Tiết Lá Bài</span>
                </button>
              )}

              {onStartDeepReadWithInquiry && (
                <button
                  onClick={() =>
                    onStartDeepReadWithInquiry(
                      `Tôi muốn thấu hiểu sâu hơn về thông điệp của lá bài ${dailyCard.nameVi || dailyCard.name_vi} (${dailyCard.name || dailyCard.name_en}) trong ngày hôm nay.`
                    )
                  }
                  className="px-4 py-2 rounded-full bg-[#1c1611] hover:bg-white/10 border border-[#3d3123] hover:border-[#d4af37] text-xs font-semibold text-[#b3a48d] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Trải Bài Sâu Với Lá Này</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
