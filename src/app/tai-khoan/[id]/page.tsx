"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Calendar, Sparkles, Layers, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ReadingHistoryItem } from "@/types/tarot";

export default function ReadingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reading, setReading] = useState<ReadingHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReading = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("readings")
          .select("id, created_at, topic, question, cards_drawn, personal_body")
          .eq("id", id)
          .single();

        if (data) {
          setReading({
            id: data.id,
            date: new Date(data.created_at).toLocaleDateString("vi-VN"),
            topic: data.topic,
            topicVi: data.topic === "love" ? "Tình Yêu" : data.topic === "career" ? "Sự Nghiệp" : data.topic === "finance" ? "Tài Chính" : "Tổng Quan",
            question: data.question,
            cards: (data.cards_drawn || []).map((c: any, i: number) => ({
              name: c.card_id,
              nameVi: c.card_id,
              image: `/cards/${c.card_id}.jpg`,
              orientation: c.orientation || "upright",
              position: i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai",
            })),
            personalBody: data.personal_body,
          });
        } else {
          // Check local storage fallback
          const local = localStorage.getItem("ventus_readings");
          if (local) {
            const list: ReadingHistoryItem[] = JSON.parse(local);
            const found = list.find((item) => item.id === id);
            if (found) setReading(found);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchReading();
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="account"
        user={{
          name: "Thành Viên",
          email: "",
          credits: 0,
          isLoggedIn: true,
        }}
        onOpenTopUp={() => {}}
        onOpenAuth={() => {}}
        onLogout={() => {}}
      />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-8 py-10 w-full relative z-10">
        <Link
          href="/tai-khoan"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#b3a48d] hover:text-[#d4af37] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Lịch Sử Trải Bài</span>
        </Link>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 text-[#d4af37]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs">Đang tải chi tiết trải bài từ cơ sở dữ liệu...</span>
          </div>
        ) : reading ? (
          <div className="bg-[#15100b] border border-[#d4af37]/45 rounded-3xl p-6 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37]">
                {reading.topicVi || "Tổng Quan"}
              </span>
              <span className="text-xs text-[#7a6e5d] flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {reading.date}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
              {reading.question ? `"${reading.question}"` : reading.title || "Phiên trải bài cá nhân"}
            </h1>

            {/* 3 Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 my-8">
              {reading.cards.map((c, i) => (
                <div
                  key={i}
                  className="bg-[#1c1611] border border-[#3d3123] rounded-2xl p-4 flex flex-col items-center text-center"
                >
                  <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border border-[#d4af37]/30 mb-3 shadow-md">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-[#7a6e5d] uppercase font-mono tracking-wider mb-0.5">
                    {c.position}
                  </span>
                  <span className="text-xs font-semibold text-[#f3ece1] line-clamp-1">
                    {c.nameVi || c.name}
                  </span>
                </div>
              ))}
            </div>

            {/* AI text */}
            {reading.personalBody && (
              <div className="pt-6 border-t border-[#3d3123]">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#d4af37] mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Luận giải chuyên sâu:</span>
                </div>
                <div className="text-xs sm:text-sm text-[#f3ece1]/90 leading-relaxed whitespace-pre-line bg-[#1c1611] p-6 rounded-2xl border border-[#3d3123]/70 font-serif">
                  {reading.personalBody}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-[#7a6e5d] bg-[#15100b] rounded-3xl border border-[#3d3123] p-8">
            <p className="text-sm">Không tìm thấy bản ghi trải bài tương ứng.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
