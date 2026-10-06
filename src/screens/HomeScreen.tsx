"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Zap, Compass, Heart, Briefcase, Coins, Flower2 } from "lucide-react";
import { TOPICS, CARD_BACK_IMAGE } from "@/data/tarotCards";
import type { AppScreen } from "@/types/tarot";
import type { DailyDraw, DailyState } from "@/lib/daily-types";

interface HomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onSelectTopic: (topicId: string) => void;
  // Danh tính hiện tại: đổi (đăng nhập/đăng xuất) thì tải lại "lá hôm nay".
  userId?: string | null;
  isAuthReady?: boolean;
}

// Lá Daily gần nhất của hôm nay, để panel trang chủ hiện đúng lá đó thay vì lời mời
// rút. Lỗi mạng/chưa rút → null → panel giữ nguyên dạng "chưa rút".
function useTodayDraw(userId: string | null | undefined, isAuthReady: boolean): DailyDraw | null {
  const [today, setToday] = useState<{ owner: string | null; draw: DailyDraw } | null>(null);
  const owner = userId ?? null;

  useEffect(() => {
    if (!isAuthReady || !owner) return;
    let cancelled = false;
    fetch("/api/reading/daily", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<DailyState>) : null))
      .then((state) => {
        if (!cancelled && state?.today) setToday({ owner, draw: state.today });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [owner, isAuthReady]);

  // Gắn nhãn chủ sở hữu thay vì xoá bằng effect: đăng xuất là lá cũ biến mất ngay
  // trong lượt render đó, không để lọt một nhịp hiện lá của tài khoản trước.
  return today && today.owner === owner ? today.draw : null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectTopic,
  userId,
  isAuthReady = true,
}) => {
  const todayDraw = useTodayDraw(userId, isAuthReady);
  const todayReversed = todayDraw?.card.orientation === "reversed";

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
              alt="Mặt sau lá bài Tarot"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Card Center (Main Hero) */}
          <div className="absolute w-32 sm:w-44 aspect-[2/3] rounded-2xl border-2 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.45)] overflow-hidden z-20 animate-levitate-2 group cursor-pointer">
            <img
              src={CARD_BACK_IMAGE}
              alt="Mặt sau lá bài Tarot"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
            <div className="card-shimmer" />
          </div>

          {/* Card Right */}
          <div className="absolute right-4 sm:right-6 w-28 sm:w-36 aspect-[2/3] rounded-2xl border-2 border-[#d4af37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] overflow-hidden rotate-12 hover:rotate-0 transition-transform duration-500 animate-levitate-3 z-10">
            <img
              src={CARD_BACK_IMAGE}
              alt="Mặt sau lá bài Tarot"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6a3] via-[#d4af37] to-[#8f5a1f] mb-3 font-bold tracking-tight drop-shadow-[0_0_25px_rgba(212,175,55,0.35)]">
          XEM BÀI TAROT
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
            onClick={() => onNavigate("daily")}
            className="px-6 py-3.5 rounded-full bg-[#15100b] hover:bg-white/10 text-[#b3a48d] hover:text-[#d4af37] border border-[#3d3123] hover:border-[#d4af37] text-sm font-semibold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#d4af37]" />
            <span>Thông Điệp Hôm Nay (Miễn Phí)</span>
          </button>
        </div>
      </section>

      {/* Daily Tarot: cửa vào nhẹ nhất của cả hệ thống — không câu hỏi, không chọn chủ đề */}
      <section
        aria-labelledby="home-daily-heading"
        className="w-full max-w-5xl mx-auto px-4 sm:px-8 my-6"
      >
        <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-gradient-to-br from-[#15100b]/95 via-[#0e0a08]/98 to-[#1c1611]/95 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#d4af37]/10 rounded-full blur-[80px] pointer-events-none" />
          {todayDraw ? (
            <div className="relative z-10 w-24 sm:w-28 aspect-[2/3] shrink-0 rounded-xl border-2 border-[#d4af37] overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.45)] bg-[#15100b]">
              <img
                src={todayDraw.card.image}
                alt={`${todayDraw.card.nameVi} (${todayDraw.card.nameEn}), ${todayReversed ? "ngược" : "xuôi"}`}
                className={`w-full h-full object-cover ${todayReversed ? "rotate-180" : ""}`}
              />
            </div>
          ) : (
            <div className="relative z-10 w-24 sm:w-28 aspect-[2/3] shrink-0 rounded-xl border-2 border-[#d4af37]/60 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.35)] animate-levitate-1 motion-reduce:animate-none">
              <img src={CARD_BACK_IMAGE} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-10 text-center sm:text-left flex-1">
            {todayDraw ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                  Lá của bạn hôm nay
                </span>
                <h2 id="home-daily-heading" className="font-display text-2xl sm:text-3xl text-white font-bold mt-1">
                  {todayDraw.card.nameVi}
                </h2>
                <p className="text-xs italic text-[#7a6e5d] mb-2">
                  {todayDraw.card.nameEn} · {todayReversed ? "Chiều ngược" : "Chiều xuôi"}
                </p>
                <p className="font-display text-base sm:text-lg text-[#f5e6a3] leading-snug mb-1">
                  {todayDraw.content.headline}
                </p>
                <p className="text-sm text-[#b3a48d] leading-relaxed max-w-xl">{todayDraw.content.summary}</p>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                  Mỗi ngày một lá
                </span>
                <h2 id="home-daily-heading" className="font-display text-2xl sm:text-3xl text-white font-bold mt-1 mb-2">
                  Hôm nay Tarot muốn nói gì với bạn?
                </h2>
                <p className="text-sm text-[#b3a48d] leading-relaxed max-w-xl">
                  Không cần câu hỏi. Rút một lá để nhận năng lượng trong ngày, tình yêu, công việc, tài chính và một lời nhắn riêng cho hôm nay. Lượt đầu mỗi ngày miễn phí.
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => onNavigate("daily")}
            className="relative z-10 shrink-0 px-6 py-3 rounded-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 motion-reduce:transition-none"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{todayDraw ? "Xem chi tiết" : "Rút lá hôm nay"}</span>
          </button>
        </div>
      </section>

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
            Hai Cách Đọc Bài
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 bg-[#1c1611]/80 p-5 rounded-2xl border border-[#3d3123]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#d4af37]" />
                Thông Điệp Hôm Nay (1 Lá)
              </h4>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
                Mỗi ngày một lá miễn phí: năng lượng trong ngày, tình yêu, công việc, tài chính và một lời nhắn cho hôm nay. Muốn rút thêm trong ngày chỉ tốn 1 credit.
              </p>
            </div>

            <div className="space-y-2 bg-[#1c1611]/80 p-5 rounded-2xl border border-[#3d3123]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Trải Bài Sâu (3 Lá Chuyên Sâu)
              </h4>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed">
                Phân tích sự liên kết giữa 3 lá bài theo cấu trúc Quá khứ - Hiện tại - Tương lai. Mang đến lời luận giải sâu sắc, cá nhân hóa cho từng câu hỏi cụ thể của bạn.
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
