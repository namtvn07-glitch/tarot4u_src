"use client";

import React, { useState, useMemo } from "react";
import { Search, X, BookOpen, Sparkles, Filter } from "lucide-react";
import { TAROT_CARDS } from "@/data/tarotCards";
import type { AppScreen, TarotCard } from "@/types/tarot";

interface LibraryScreenProps {
  onSelectCardForModal: (card: TarotCard) => void;
  onNavigateToCardDetail: (card: TarotCard) => void;
  onNavigate: (screen: AppScreen) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onSelectCardForModal,
  onNavigateToCardDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filterTabs = [
    { id: "all", label: "Tất cả (78)" },
    { id: "major", label: "Ẩn Chính (22)" },
    { id: "cups", label: "Bộ Cốc" },
    { id: "swords", label: "Bộ Kiếm" },
    { id: "wands", label: "Bộ Gậy" },
    { id: "pentacles", label: "Bộ Tiền" },
  ];

  const filteredCards = useMemo(() => {
    return TAROT_CARDS.filter((card) => {
      // Category filter
      if (selectedFilter !== "all" && card.arcanaType !== selectedFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = card.name.toLowerCase().includes(query);
        const matchNameVi = (card.nameVi || "").toLowerCase().includes(query);
        const matchKeywords = (card.uprightKeywords || []).some((k: string) =>
          k.toLowerCase().includes(query)
        );
        return matchName || matchNameVi || matchKeywords;
      }
      return true;
    });
  }, [selectedFilter, searchTerm]);

  return (
    <div className="w-full max-w-7xl mx-auto pt-8 pb-16 px-4 sm:px-8 flex flex-col gap-8 relative z-10">
      {/* Header Section */}
      <section className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Kho Tàng Biểu Tượng Học</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl text-[#f3ece1] font-bold tracking-tight mb-2">
          Thư Viện 78 Lá Bài Tarot
        </h1>
        <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
          Tra cứu chi tiết hình ảnh, từ khóa, biểu tượng và luận giải tâm lý học xuôi/ngược cho toàn bộ 78 lá bài Rider-Waite chuẩn mực.
        </p>
      </section>

      {/* Sticky Search Bar & Category Filter Chips */}
      <section className="flex flex-col gap-4 sticky top-[68px] z-30 bg-[#050505]/90 backdrop-blur-xl py-3 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-[#3d3123]/50">
        {/* Search Input */}
        <div className="relative w-full max-w-md mx-auto">
          <Search className="w-4 h-4 text-[#7a6e5d] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên lá bài (The Fool, Kẻ Khờ, Kiếm...)..."
            className="w-full bg-[#15100b] border border-[#3d3123] focus:border-[#d4af37] rounded-full py-2.5 pl-11 pr-10 text-xs sm:text-sm text-[#f3ece1] placeholder:text-[#7a6e5d] focus:outline-none focus:ring-1 focus:ring-[#d4af37] shadow-inner transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7a6e5d] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 justify-start sm:justify-center w-full">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#8f5a1f] text-white border border-[#d4af37] shadow-[0_0_15px_rgba(143,90,31,0.4)]"
                    : "bg-[#15100b] border border-[#3d3123] text-[#b3a48d] hover:border-[#d4af37]/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Library Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
        {filteredCards.map((card) => {
          const cardImage = card.imageUrl || card.image || `/cards/${card.image_filename || "the-fool.jpg"}`;
          return (
            <div
              key={card.id}
              onClick={() => onSelectCardForModal(card)}
              className="flex flex-col items-center gap-2 group text-left w-full cursor-pointer focus:outline-none"
            >
              {/* Card Image Container */}
              <div className="w-full aspect-[2/3] bg-[#15100b] rounded-2xl p-2 border border-[#3d3123] group-hover:border-[#d4af37] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.2)] relative overflow-hidden">
                <img
                  src={cardImage}
                  alt={card.name}
                  className="w-full h-full object-cover rounded-xl border border-[#3d3123]/50 group-hover:border-[#d4af37]/50 transition-colors"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* Card Labels */}
              <div className="flex flex-col items-center w-full text-center px-1">
                <span className="text-[9px] font-bold text-[#d4af37] uppercase tracking-widest mb-0.5">
                  {card.arcanaLabelVi || (card.arcana === "major" ? "Ẩn Chính" : "Ẩn Phụ")}
                </span>
                <h3 className="font-display text-sm font-semibold text-white group-hover:text-[#d4af37] transition-colors leading-tight truncate w-full">
                  {card.name}
                </h3>
                <span className="text-xs text-[#7a6e5d] mt-0.5">{card.nameVi}</span>
              </div>
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#7a6e5d]">
            <p className="text-sm">Không tìm thấy lá bài nào khớp với từ khóa "{searchTerm}".</p>
          </div>
        )}
      </section>
    </div>
  );
};
