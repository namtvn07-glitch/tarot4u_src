import React from "react";
import { Quote } from "lucide-react";
import type { DailyContent } from "@/lib/ai/schemas/daily";
import { DAILY_DISCLAIMER } from "@/lib/disclaimers";

const SCORE_ROWS = [
  { key: "overall", label: "Tổng quan" },
  { key: "love", label: "Tình yêu" },
  { key: "career", label: "Công việc / Học tập" },
  { key: "finance", label: "Tài chính" },
  { key: "energy", label: "Năng lượng" },
] as const;

const DOMAIN_SECTIONS = [
  { key: "love", label: "Tình yêu" },
  { key: "career", label: "Công việc / Học tập" },
  { key: "finance", label: "Tài chính" },
] as const;

interface DailyResultViewProps {
  content: DailyContent;
}

// Một cột, kết luận trước (đọc trên điện thoại là chính — xem Prompt 01: "nhiều
// insight nhưng ít scroll"). Điểm luôn đi kèm con số "x/10" bằng chữ: thanh màu
// chỉ là phần trang trí, không mang thông tin một mình.
export const DailyResultView: React.FC<DailyResultViewProps> = ({ content }) => {
  return (
    <article className="w-full max-w-2xl mx-auto flex flex-col gap-6 font-body text-[#f3ece1]">
      <header className="text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#f5e6a3] leading-snug">
          {content.headline}
        </h2>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#b3a48d]">{content.summary}</p>
      </header>

      <section
        aria-labelledby="daily-scores-heading"
        className="rounded-2xl border border-[#3d3123] bg-[#15100b] p-5"
      >
        <h3
          id="daily-scores-heading"
          className="mb-4 text-xs font-bold uppercase tracking-widest text-[#d4af37]"
        >
          Năng lượng trong ngày
        </h3>
        <ul className="flex flex-col gap-3">
          {SCORE_ROWS.map(({ key, label }) => {
            const score = content.daily_scores[key];
            const percent = Math.min(100, Math.max(0, score * 10));
            return (
              <li key={key} className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0 text-[#b3a48d]">{label}</span>
                <span
                  aria-hidden="true"
                  className="h-2 flex-1 overflow-hidden rounded-full bg-[#251d16]"
                >
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#8f5a1f] to-[#d4af37]"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right font-mono text-[#f5e6a3]">{score}/10</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="daily-forecast-heading">
        <h3
          id="daily-forecast-heading"
          className="mb-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]"
        >
          Xu hướng dễ xuất hiện hôm nay
        </h3>
        <ul className="flex flex-col gap-2.5">
          {content.forecast.map((item, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
              <span aria-hidden="true" className="mt-1 shrink-0 text-xs font-bold text-[#d4af37]">
                ✦
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {DOMAIN_SECTIONS.map(({ key, label }) => (
          <section
            key={key}
            aria-labelledby={`daily-${key}-heading`}
            className="rounded-2xl border border-[#3d3123] bg-[#15100b] p-4"
          >
            <h3
              id={`daily-${key}-heading`}
              className="mb-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]"
            >
              {label}
            </h3>
            <p className="text-sm leading-relaxed text-[#f3ece1]">{content[key]}</p>
          </section>
        ))}
      </div>

      <section aria-labelledby="daily-insight-heading">
        <h3
          id="daily-insight-heading"
          className="mb-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]"
        >
          Điều bạn có thể chưa để ý
        </h3>
        <p className="text-sm sm:text-base leading-relaxed">{content.insight}</p>
      </section>

      <figure className="rounded-2xl border-l-4 border-l-[#d4af37] border-y border-r border-[#3d3123] bg-[#1c1611] p-5">
        <Quote aria-hidden="true" className="mb-2 h-5 w-5 text-[#d4af37]" />
        <blockquote className="font-display text-lg sm:text-xl italic leading-snug text-[#f5e6a3]">
          {content.memorable_message}
        </blockquote>
      </figure>

      <section aria-labelledby="daily-advice-heading">
        <h3
          id="daily-advice-heading"
          className="mb-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]"
        >
          Lời nhắn cho hôm nay
        </h3>
        <p className="text-sm sm:text-base leading-relaxed">{content.advice}</p>
      </section>

      {content.keywords.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Từ khoá">
          {content.keywords.map((keyword) => (
            <li
              key={keyword}
              className="rounded-md border border-[#3d3123] bg-[#251d16] px-2.5 py-0.5 text-[11px] text-[#b3a48d]"
            >
              #{keyword}
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs italic text-[#7a6e5d]">{DAILY_DISCLAIMER}</p>
    </article>
  );
};
