"use client";

import React from "react";
import { Sparkles, ArrowRight, Zap, BookOpen, Compass, Heart, Briefcase, Coins, Flower2, Layers } from "lucide-react";
import { TOPICS, TAROT_CARDS, CARD_BACK_IMAGE } from "@/data/tarotCards";
import type { AppScreen, TarotCard } from "@/types/tarot";
import { DailyTarotMessage } from "@/components/DailyTarotMessage";

interface HomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onSelectTopic: (topicId: string) => void;
  onViewCardDetail?: (card: TarotCard) => void;
  onStartDeepReadWithInquiry?: (inquiry: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectTopic,
  onViewCardDetail,
  onStartDeepReadWithInquiry,
}) => {
  const getTopicIcon = (id: string) => {
    switch (id) {
      case "love": return <Heart className="w-5 h-5 text-[#d4af37]" />;
      case "career": return <Briefcase className="w-5 h-5 text-[#d4af37]" />;
      case "finance": return <Coins className="w-5 h-5 text-[#d4af37]" />;
      case "spiritual": return <Flower2 className="w-5 h-5 text-[#d4af37]" />;
      default: return <Compass className="w-5 h-5 text-[#d4af37]" />;
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start pt-8 pb-16 relative z-10">
      {/* 3D Levitating Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 sm:px-8 max-w-5xl mx-auto my-4 sm:my-8 relative">
        {/* Floating 3 Cards Showcase */}
        <div className="relative w-full max-w-[420px] h-60 sm:h-72 mb-6 flex items-center justify-center">
          {/* Card Left */}
          <div className="absolute left-4 sm:left-6 w-28 sm:w-36 aspect-[2/3] rounded-2xl border-2 border-[#d4af37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] overflow-hidden -rotate-12 hover:rotate-0 transition-transform duration-500 animate-levitate-1 z-10">
            <img
              src={CARD_BACK_IMAGE}
              alt="Mặt sau lá bài Tarot Ventus"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Card Center (Main Hero) */}
          <div className="absolute w-32 sm:w-44 aspect-[2/3] rounded-2xl border-2 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.45)] overflow-hidden z-20 animate-levitate-2 group cursor-pointer">
            <img
              src={CARD_BACK_IMAGE}
              alt="Mặt sau lá bài Tarot Ventus"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
            <div className="card-shimmer" />
          </div>

          {/* Card Right */}
          <div className="absolute right-4 sm:right-6 w-28 sm:w-36 aspect-[2/3] rounded-2xl border-2 border-[#d4af37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] overflow-hidden rotate-12 hover:rotate-0 transition-transform duration-500 animate-levitate-3 z-10">
            <img
              src={CARD_BACK_IMAGE}
              alt="Mặt sau lá bài Tarot Ventus"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6a3] via-[#d4af37] to-[#8f5a1f] mb-3 font-bold tracking-tight drop-shadow-[0_0_25px_rgba(212,175,55,0.35)]">
          VENTUS TAROT
        </h1>

        <p className="font-display text-lg sm:text-2xl text-[#b3a48d] max-w-2xl mb-8 font-light leading-relaxed">
          Gương soi nội tâm & Khai mở trực giác thông qua kiến trúc luận giải Tarot 2 lớp
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => onNavigate("deep-read")}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-sm font-semibold tracking-wider uppercase transition-all duration-300 shadow-[0_0_25px_rgba(143,90,31,0.5)] hover:shadow-[0_0_35px_rgba(212,175,55,0.7)] flex items-center gap-2 border border-[#d4af37]/50 active:scale-95 cursor-pointer"
          >
            <span>Trải Bài Sâu 3 Lá</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate("quick-read")}
            className="px-6 py-3.5 rounded-full bg-[#15100b] hover:bg-white/10 text-[#b3a48d] hover:text-[#d4af37] border border-[#3d3123] hover:border-[#d4af37] text-sm font-semibold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#d4af37]" />
            <span>Rút Nhanh 1 Lá (Miễn Phí)</span>
          </button>
        </div>
      </section>

      {/* Daily Tarot Message Feature */}
      <DailyTarotMessage
        onViewCardDetail={onViewCardDetail}
        onStartDeepReadWithInquiry={onStartDeepReadWithInquiry}
      />

      {/* Topic Selection */}
      <section className="w-full max-w-6xl px-4 sm:px-8 py-10">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest text-[#d4af37] uppercase mb-1 block">
            Khám Phá Trực Giác
          </span>
          <h2 className="font-display text-2xl sm:text-4xl text-white font-bold">
            Chọn Lĩnh Vực Cần Soi Sáng
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TOPICS.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="bg-[#15100b]/80 p-6 rounded-2xl flex flex-col items-center text-center cursor-pointer hover:bg-[#1c1611] hover:-translate-y-1.5 transition-all duration-300 group border border-[#3d3123] hover:border-[#d4af37]/70 shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#050505] flex items-center justify-center mb-4 border border-[#3d3123] group-hover:border-[#d4af37] group-hover:bg-[#8f5a1f]/20 transition-all shadow-inner">
                {getTopicIcon(topic.id)}
              </div>
              <h3 className="font-display text-lg text-white font-semibold mb-1 group-hover:text-[#d4af37] transition-colors">
                {topic.nameVi}
              </h3>
              <p className="text-xs text-[#7a6e5d] leading-relaxed">
                {topic.descVi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Explanations */}
      <section className="w-full max-w-5xl px-4 sm:px-8 py-6">
        <div className="rounded-3xl p-6 sm:p-10 border border-[#d4af37]/35 relative overflow-hidden bg-[#15100b]/70 shadow-[0_12px_35px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <h2 className="font-display text-2xl sm:text-3xl text-[#d4af37] font-bold mb-6">
            Kiến Trúc Luận Giải 2 Lớp Độc Đáo
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 bg-[#1c1611]/80 p-5 rounded-2xl border border-[#3d3123]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Lớp Cá Nhân (Trải 3 Lá Chuyên Sâu)
              </h4>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
                Phân tích realtime sự liên kết giữa 3 lá bài theo cấu trúc Quá khứ - Hiện tại - Tương lai. Mang đến lời luận giải sâu sắc, cá nhân hóa cho từng câu hỏi cụ thể của bạn.
              </p>
            </div>

            <div className="space-y-2 bg-[#1c1611]/80 p-5 rounded-2xl border border-[#3d3123]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#d4af37]" />
                Lớp Nền (Rút Nhanh 1 Lá Tức Thì)
              </h4>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
                Nhận thông điệp tức thời từ kho tri thức 780 tổ hợp giải nghĩa chuẩn mực. Hoàn toàn miễn phí, trực quan và định tâm trước khi bắt đầu công việc.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#3d3123] flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs text-[#7a6e5d]">
              Khám phá toàn bộ 78 lá bài với từ khóa và biểu tượng học chi tiết.
            </div>
            <button
              onClick={() => onNavigate("library")}
              className="text-xs font-semibold text-[#d4af37] hover:text-white flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Xem Thư Viện 78 Lá Bài</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
