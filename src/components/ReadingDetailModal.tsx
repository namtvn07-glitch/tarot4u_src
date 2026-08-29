"use client";

import React from "react";
import { X, Calendar, Sparkles, HelpCircle, Layers } from "lucide-react";
import type { ReadingHistoryItem } from "@/types/tarot";

interface ReadingDetailModalProps {
  reading: ReadingHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReadingDetailModal: React.FC<ReadingDetailModalProps> = ({
  reading,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !reading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#15100b] border border-[#d4af37]/45 rounded-2xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.95)] overflow-y-auto z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#251d16] text-[#b3a48d] hover:text-[#d4af37] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37]">
            {reading.topicVi}
          </span>
          <span className="text-xs text-[#7a6e5d] flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {reading.date}
          </span>
        </div>

        {reading.question && (
          <div className="mb-6 p-4 rounded-xl bg-[#1c1611] border border-[#3d3123]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Câu hỏi của bạn:</span>
            </div>
            <p className="text-sm text-[#f3ece1] italic">"{reading.question}"</p>
          </div>
        )}

        {/* 3 Cards Row */}
        <div className="mb-8">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#7a6e5d] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span>3 Lá bài xuất hiện trong trải bài</span>
          </h4>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {reading.cards.map((c, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-[#1c1611] border border-[#3d3123] rounded-xl p-3 text-center"
              >
                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-[#d4af37]/30 mb-2 relative shadow-md">
                  <img
                    src={c.image}
                    alt={c.name}
                    className={`w-full h-full object-cover transition-transform ${
                      c.orientation === "reversed" ? "rotate-180" : ""
                    }`}
                  />
                  {c.orientation === "reversed" && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-[#f0605f] font-semibold border border-[#f0605f]/40">
                      Ngược
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#7a6e5d] uppercase font-mono tracking-wider mb-0.5">
                  {c.position}
                </span>
                <span className="text-xs font-semibold text-[#f3ece1] line-clamp-1">
                  {c.nameVi}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Body AI Stream Output */}
        {reading.personalBody && (
          <div className="pt-6 border-t border-[#3d3123]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#d4af37] mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Luận giải chuyên sâu:</span>
            </div>
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#f3ece1]/90 leading-relaxed whitespace-pre-line bg-[#1c1611] p-5 rounded-xl border border-[#3d3123]/70 font-serif">
              {reading.personalBody}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
