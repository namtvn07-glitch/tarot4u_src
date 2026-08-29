"use client";

import React from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Sparkles, Briefcase, Heart, Lightbulb, BookOpen } from "lucide-react";
import type { AppScreen, TarotCard } from "@/types/tarot";

interface CardDetailScreenProps {
  card: any;
  onNavigate: (screen: AppScreen) => void;
  onStartDeepReadWithInquiry: (inquiry: string) => void;
}

export const CardDetailScreen: React.FC<CardDetailScreenProps> = ({
  card,
  onNavigate,
  onStartDeepReadWithInquiry,
}) => {
  if (!card) return null;

  const cardImage = card.imageUrl || card.image || `/cards/${card.image_filename || "the-fool.jpg"}`;
  const uprightKeywords = card.uprightKeywords || card.upright_keywords || card.keywords || [];
  const reversedKeywords = card.reversedKeywords || card.reversed_keywords || [];

  return (
    <div className="w-full max-w-5xl mx-auto pt-8 pb-16 px-4 sm:px-8 flex flex-col gap-10 relative z-10 animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => onNavigate("library")}
        className="self-start flex items-center gap-2 text-xs font-semibold text-[#b3a48d] hover:text-[#d4af37] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Thư Viện 78 Lá</span>
      </button>

      {/* Hero Showcase */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Card Graphic */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-60 sm:w-72 aspect-[2/3] rounded-2xl bg-[#15100b] border-2 border-[#d4af37]/60 shadow-[0_0_50px_rgba(212,175,55,0.3)] overflow-hidden group">
            <img
              src={cardImage}
              alt={card.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            <div className="card-shimmer" />
          </div>
        </div>

        {/* Card Header Info */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-widest text-[#d4af37]">
            <span>{card.arcanaLabelVi || (card.arcana === "major" ? "Bộ Ẩn Chính" : "Bộ Ẩn Phụ")}</span>
            {card.element && (
              <>
                <span className="w-3 h-px bg-[#3d3123]" />
                <span>Nguyên tố: {card.element}</span>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-white font-bold mb-1">
            {card.nameVi || card.name_vi}
          </h1>
          <h2 className="font-display text-xl text-[#d4af37] mb-4 italic">
            {card.name || card.name_en}
          </h2>

          {card.quote && (
            <p className="font-display text-base sm:text-lg text-[#f5e6a3] italic mb-4 border-l-2 border-l-[#d4af37] pl-3 py-1">
              "{card.quote}"
            </p>
          )}

          <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-6">
            {card.psychologySummary || card.summary || card.uprightMeaning}
          </p>

          {/* Keywords Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Upright Keywords */}
            <div className="bg-[#15100b] p-3.5 rounded-xl border border-[#3d3123]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Nghĩa Xuôi</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {uprightKeywords.map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#251d16] border border-[#3d3123] text-[11px] text-[#f3ece1]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Reversed Keywords */}
            <div className="bg-[#15100b] p-3.5 rounded-xl border border-[#3d3123]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#f0605f] mb-2 flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Nghĩa Ngược</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {(reversedKeywords.length > 0 ? reversedKeywords : ["Tắc nghẽn", "Chần chừ", "Mất cân bằng"]).map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#251d16] border border-[#3d3123] text-[11px] text-[#b3a48d]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Interpretation Bento Section */}
      <section className="space-y-4">
        <h3 className="font-display text-2xl sm:text-3xl text-[#d4af37] font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#d4af37]" />
          <span>Giải Mã Chi Tiết Các Khía Cạnh</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Career */}
          <div className="bg-[#15100b] p-5 rounded-2xl border border-[#3d3123]">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-white">
              <Briefcase className="w-4 h-4 text-[#d4af37]" />
              <span>Sự Nghiệp & Tài Chính</span>
            </div>
            <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
              {card.careerFinance || "Lá bài khuyến khích bạn xây dựng nền tảng vững chắc, chủ động nắm bắt cơ hội chuyển giao trong công việc và đầu tư có chiến lược."}
            </p>
          </div>

          {/* Love */}
          <div className="bg-[#15100b] p-5 rounded-2xl border border-[#3d3123]">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-white">
              <Heart className="w-4 h-4 text-[#f0605f]" />
              <span>Tình Cảm & Mối Quan Hệ</span>
            </div>
            <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
              {card.loveRelationship || "Trong tình cảm, sự thấu cảm và chân thành là chìa khóa tháo gỡ mọi khúc mắc. Hãy mở rộng trái tim để đón nhận năng lượng tích cực."}
            </p>
          </div>

          {/* Advice */}
          <div className="md:col-span-2 bg-[#1c1611] p-6 rounded-2xl border border-[#d4af37]/45">
            <div className="flex items-center gap-2 mb-2 text-base font-semibold text-[#d4af37]">
              <Lightbulb className="w-5 h-5" />
              <span>Lời Khuyên Từ Ventus Tarot</span>
            </div>
            <p className="text-xs sm:text-sm text-[#f3ece1] leading-relaxed mb-4">
              {card.ventusAdvice || card.psychologySummary || "Hãy giữ vững niềm tin, lắng nghe trực giác và đưa ra quyết định với sự bình tâm."}
            </p>

            <button
              onClick={() =>
                onStartDeepReadWithInquiry(
                  `Thông điệp chuyên sâu của lá bài ${card.nameVi || card.name} đối với câu hỏi của tôi là gì?`
                )
              }
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(143,90,31,0.4)] cursor-pointer"
            >
              Trải Bài Sâu Với Lá Này
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
