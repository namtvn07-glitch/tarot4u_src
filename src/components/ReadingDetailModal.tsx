"use client";

import React, { useEffect, useState } from "react";
import { X, Calendar, HelpCircle, Layers } from "lucide-react";
import { ReadingResultSection } from "@/components/reading/ReadingResultSection";
import { createClient } from "@/lib/supabase/client";
import type { ReadingHistoryItem } from "@/types/tarot";

// Phần nặng của một lượt đọc (kết quả có cấu trúc / bản chữ) không nằm trong danh sách
// lịch sử — chỉ tải khi người dùng mở đúng lượt đó.
interface FetchedDetail {
  id: string;
  result?: ReadingHistoryItem["result"];
  personalBody?: string;
}

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
  const [fetched, setFetched] = useState<FetchedDetail | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const readingId = reading?.id ?? null;
  const needsDetail = isOpen && reading?.detailLoaded === false;
  // `fetched` gắn với id nên đổi sang lượt khác không cần reset state.
  const hasDetail = fetched !== null && fetched.id === readingId;

  useEffect(() => {
    if (!needsDetail || !readingId || hasDetail) return;
    let cancelled = false;
    createClient()
      .from("readings")
      .select("personal_body, result")
      .eq("id", readingId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFailedId(readingId);
          return;
        }
        setFetched({
          id: readingId,
          result: (data.result as ReadingHistoryItem["result"]) ?? undefined,
          personalBody: (data.personal_body as string | null) ?? undefined,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [needsDetail, readingId, hasDetail]);

  if (!isOpen || !reading) return null;

  const isLoadingDetail = needsDetail && !hasDetail && failedId !== reading.id;
  const hasDetailError = needsDetail && !hasDetail && failedId === reading.id;
  const fullReading: ReadingHistoryItem = hasDetail
    ? { ...reading, result: fetched.result, personalBody: fetched.personalBody ?? reading.personalBody }
    : reading;

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
            <p className="text-sm text-[#f3ece1] italic">&quot;{reading.question}&quot;</p>
          </div>
        )}

        {/* 3 Cards Row */}
        <div className="mb-8">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#7a6e5d] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span>{reading.cards.length === 1 ? "Lá bài của ngày" : `${reading.cards.length} Lá bài xuất hiện trong trải bài`}</span>
          </h4>

          <div
            className={`grid gap-3 sm:gap-4 ${reading.cards.length === 1 ? "grid-cols-1 mx-auto max-w-[9rem]" : "grid-cols-3"}`}
          >
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

        {isLoadingDetail && (
          <div role="status" className="pt-6 border-t border-[#3d3123] text-center text-xs text-[#7a6e5d]">
            Đang tải luận giải…
          </div>
        )}
        {hasDetailError && (
          <div role="alert" className="pt-6 border-t border-[#3d3123] text-center text-xs text-[#f0605f]">
            Không tải được luận giải. Hãy đóng và mở lại.
          </div>
        )}
        {!isLoadingDetail && !hasDetailError && <ReadingResultSection reading={fullReading} />}
      </div>
    </div>
  );
};
