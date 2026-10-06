"use client";

import React, { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import type { ThreeCardResult } from "@/lib/ai/schemas/three-card";
import { suitLabel } from "@/lib/ai/three-card-result";
import { THREE_CARD_DISCLAIMER } from "@/lib/disclaimers";
import { positionLabel } from "@/lib/spreads";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

// Nhịp hiện từng khối khi vừa có kết quả: lấy lại cảm giác "đọc dần" của bản
// stream cũ, nhưng nội dung đã được kiểm tra đủ trước khi chạm màn hình.
const REVEAL_INTERVAL_MS = 900;

interface ThreeCardResultViewProps {
  result: ThreeCardResult;
  // true khi vừa sinh xong (hiện dần); false khi mở lại từ Lịch sử (hiện hết ngay).
  animate: boolean;
}

const sectionTitle = "mb-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]";

export const ThreeCardResultView: React.FC<ThreeCardResultViewProps> = ({ result, animate }) => {
  const reduceMotion = usePrefersReducedMotion();
  const instant = !animate || reduceMotion;

  const dominant = suitLabel(result.dominant_suit);

  const sections: { id: string; node: React.ReactNode }[] = [
    {
      id: "verdict",
      node: (
        <section aria-labelledby="tc-verdict" className="rounded-2xl border border-[#d4af37]/40 bg-[#1c1611] p-5 sm:p-6">
          <h3 id="tc-verdict" className={sectionTitle}>
            Kết luận
          </h3>
          <p className="font-display text-xl font-bold leading-snug text-[#f5e6a3] sm:text-2xl">
            {result.verdict}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#b3a48d] sm:text-base">{result.summary}</p>
        </section>
      ),
    },
    {
      id: "story",
      node: (
        <section aria-labelledby="tc-story">
          <h3 id="tc-story" className={sectionTitle}>
            Bức tranh lớn
          </h3>
          <ul className="mb-3 flex flex-wrap gap-2 text-[11px]" aria-label="Trọng lượng của trải bài">
            <li className="rounded-md border border-[#3d3123] bg-[#251d16] px-2.5 py-0.5 text-[#d4af37]">
              {result.major_count} Ẩn Chính
            </li>
            <li className="rounded-md border border-[#3d3123] bg-[#251d16] px-2.5 py-0.5 text-[#b3a48d]">
              {result.minor_count} Ẩn Phụ
            </li>
            {dominant && (
              <li className="rounded-md border border-[#3d3123] bg-[#251d16] px-2.5 py-0.5 text-[#b3a48d]">
                Bộ {dominant} chủ đạo
              </li>
            )}
          </ul>
          <p className="text-sm leading-relaxed sm:text-base">{result.overall_story}</p>
          {result.pattern_note && (
            <p className="mt-3 rounded-lg border border-[#3d3123] bg-[#201912] px-3 py-2 text-sm leading-relaxed text-[#b3a48d]">
              {result.pattern_note}
            </p>
          )}
          {result.energy_weight && (
            <p className="mt-2 text-xs italic leading-relaxed text-[#7a6e5d]">{result.energy_weight}</p>
          )}
        </section>
      ),
    },
    {
      id: "cards",
      node: (
        <section aria-labelledby="tc-cards">
          <h3 id="tc-cards" className={sectionTitle}>
            Ba lá đang nói gì?
          </h3>
          <ol className="flex flex-col gap-3">
            {result.cards.map((card, index) => (
              <li key={card.position} className="rounded-2xl border border-[#3d3123] bg-[#15100b] p-4">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#d4af37]">
                  {index + 1}. {positionLabel("three_card", index)}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold text-white">{card.card}</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#f5e6a3]">{card.summary}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#b3a48d]">{card.interpretation}</p>
              </li>
            ))}
          </ol>
        </section>
      ),
    },
    {
      id: "hidden",
      node: (
        <section aria-labelledby="tc-hidden">
          <h3 id="tc-hidden" className={sectionTitle}>
            Điều bạn có thể chưa nhìn thấy
          </h3>
          <p className="text-sm leading-relaxed sm:text-base">{result.hidden_insight}</p>
        </section>
      ),
    },
    {
      id: "forecast",
      node: (
        <section aria-labelledby="tc-forecast">
          <h3 id="tc-forecast" className={sectionTitle}>
            Xu hướng phía trước
          </h3>
          <ul className="flex flex-col gap-2.5">
            {result.forecast.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm leading-relaxed sm:text-base">
                <span aria-hidden="true" className="mt-1 shrink-0 text-xs font-bold text-[#d4af37]">
                  ✦
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ),
    },
    {
      id: "advice",
      node: (
        <section aria-labelledby="tc-advice" className="flex flex-col gap-4">
          <div>
            <h3 id="tc-advice" className={sectionTitle}>
              Lời nhắn
            </h3>
            <p className="text-sm leading-relaxed sm:text-base">{result.advice}</p>
          </div>
          <figure className="rounded-2xl border-l-4 border-l-[#d4af37] border-y border-r border-[#3d3123] bg-[#1c1611] p-5">
            <Quote aria-hidden="true" className="mb-2 h-5 w-5 text-[#d4af37]" />
            <blockquote className="font-display text-lg italic leading-snug text-[#f5e6a3] sm:text-xl">
              {result.memorable_message}
            </blockquote>
          </figure>
          {result.keywords.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Từ khoá">
              {result.keywords.map((keyword) => (
                <li
                  key={keyword}
                  className="rounded-md border border-[#3d3123] bg-[#251d16] px-2.5 py-0.5 text-[11px] text-[#b3a48d]"
                >
                  #{keyword}
                </li>
              ))}
            </ul>
          )}
          <p className="text-center text-xs italic text-[#7a6e5d]">{THREE_CARD_DISCLAIMER}</p>
        </section>
      ),
    },
  ];

  const [revealed, setRevealed] = useState(1);
  const visibleCount = instant ? sections.length : revealed;

  useEffect(() => {
    if (instant || revealed >= sections.length) return;
    const timer = setTimeout(() => setRevealed((n) => n + 1), REVEAL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [instant, revealed, sections.length]);

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 font-body text-[#f3ece1]">
      {sections.slice(0, visibleCount).map((section) => (
        <div
          key={section.id}
          className={instant ? undefined : "animate-in fade-in slide-in-from-bottom-2 duration-500"}
        >
          {section.node}
        </div>
      ))}

      {!instant && visibleCount < sections.length && (
        <button
          type="button"
          onClick={() => setRevealed(sections.length)}
          className="cursor-pointer self-center text-xs font-semibold text-[#b3a48d] underline transition-colors hover:text-[#d4af37]"
        >
          Hiện tất cả
        </button>
      )}
    </article>
  );
};
