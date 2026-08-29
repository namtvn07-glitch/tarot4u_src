"use client";

import React from "react";
import { X, BookOpen, Sparkles, Brain, Tag } from "lucide-react";

interface CardDetailModalProps {
  card: any | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFullDetail: (card: any) => void;
  onStartDeepReadWithCard?: (card: any) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
  onNavigateToFullDetail,
  onStartDeepReadWithCard,
}) => {
  if (!isOpen || !card) return null;

  const cardImage = card.imageUrl || card.image || `/cards/${card.image_filename || "the-fool.jpg"}`;
  const keywords = card.uprightKeywords || card.upright_keywords || card.keywords || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl bg-[#15100b] rounded-2xl shadow-[0_0_60px_rgba(212,175,55,0.25)] border border-[#d4af37]/40 flex flex-col md:flex-row overflow-hidden z-10 max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#15100b]/80 text-[#b3a48d] hover:text-[#d4af37] hover:bg-[#251d16] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Image Area */}
        <div className="w-full md:w-5/12 bg-[#0e0a08] p-6 md:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#3d3123]/60 relative">
          <div className="relative w-full max-w-[220px] aspect-[2/3] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.9)] border border-[#d4af37]/45 overflow-hidden group">
            <img
              src={cardImage}
              alt={card.name || card.name_en}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
          </div>
        </div>

        {/* Card Details Area */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest bg-[#251d16] text-[#b3a48d] border border-[#3d3123]">
                {card.arcanaLabelVi || (card.arcana === "major" ? "Bộ Ẩn Chính" : "Bộ Ẩn Phụ")}
              </span>
              {card.element && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest border border-[#d4af37]/35 text-[#d4af37]">
                  Nguyên tố: {card.element}
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl text-white font-bold tracking-tight">
              {card.name || card.name_en}
            </h2>
            <h3 className="font-display text-lg text-[#d4af37] mb-4">
              {card.nameVi || card.name_vi}
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-1.5 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  Ý nghĩa tổng quan
                </h4>
                <p className="text-xs sm:text-sm text-[#f3ece1]/90 leading-relaxed">
                  {card.psychologySummary || card.summary || card.uprightMeaning || "Biểu tượng của những bước chuyển tiếp và khai mở nhận thức nội tâm."}
                </p>
              </div>

              {keywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Từ khóa chính
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-[#251d16] border border-[#3d3123] text-xs text-[#b3a48d]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#3d3123]/60 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onClose();
                onNavigateToFullDetail(card);
              }}
              className="flex-1 bg-[#1c1611] border border-[#d4af37]/45 hover:bg-[#d4af37]/15 text-[#d4af37] text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Xem Toàn Bộ Luận Giải
            </button>

            {onStartDeepReadWithCard && (
              <button
                onClick={() => {
                  onClose();
                  onStartDeepReadWithCard(card);
                }}
                className="flex-1 bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(143,90,31,0.3)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Trải Bài Sâu Với Lá Này
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
