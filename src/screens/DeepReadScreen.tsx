"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle, ArrowRight, RefreshCw, Bookmark, Share2, AlertTriangle, Coins, Brain, Layers, AlertCircle, PhoneCall } from "lucide-react";
import { TAROT_CARDS, CARD_BACK_IMAGE } from "@/data/tarotCards";
import type { AppScreen, ReadingHistoryItem } from "@/types/tarot";

interface DeepReadScreenProps {
  initialInquiry?: string;
  onNavigate: (screen: AppScreen) => void;
  credits: number;
  onDeductCredit: (amount: number) => boolean;
  onSaveReading: (reading: ReadingHistoryItem) => void;
  onOpenTopUp: () => void;
}

type DeepReadPhase = "inquiry" | "shuffling" | "revealed" | "analysis";

const SUGGESTIONS = [
  "Làm thế nào để tôi mở rộng trái tim và thấu hiểu mối liên kết hiện tại?",
  "Những trở ngại nào đang ngăn cản sự thăng tiến trong sự nghiệp của tôi?",
  "Dòng chảy tài chính và những cơ hội thịnh vượng nào sắp tới?",
  "Tôi cần lắng nghe thông điệp nội tâm nào để tìm thấy sự bình yên?",
  "Bức tranh tổng quan và lời khuyên soi sáng cho giai đoạn này là gì?",
];

export const DeepReadScreen: React.FC<DeepReadScreenProps> = ({
  initialInquiry = "",
  onNavigate,
  credits,
  onDeductCredit,
  onSaveReading,
  onOpenTopUp,
}) => {
  const [phase, setPhase] = useState<DeepReadPhase>("inquiry");
  const [inquiry, setInquiry] = useState(initialInquiry);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [streamedText, setStreamedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [drawToken, setDrawToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isBlockedCrisis, setIsBlockedCrisis] = useState(false);

  useEffect(() => {
    if (initialInquiry) {
      setInquiry(initialInquiry);
    }
  }, [initialInquiry]);

  const handleStartShuffling = async () => {
    if (!inquiry.trim()) {
      setErrorMessage("Vui lòng nhập câu hỏi hoặc trăn trở bạn muốn soi sáng.");
      return;
    }

    setErrorMessage("");
    setIsBlockedCrisis(false);

    try {
      const res = await fetch("/api/reading/deep/shuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: inquiry, topic: "general" }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMessage("Vui lòng đăng nhập tài khoản trước khi thực hiện trải bài sâu.");
          onOpenTopUp(); // open auth trigger
          return;
        } else if (res.status === 429) {
          setErrorMessage("Bạn đã thực hiện quá nhiều lượt xáo bài trong 1 giờ. Vui lòng chờ ít phút.");
          return;
        } else {
          setErrorMessage(data.error || "Không thể khởi tạo phiên trải bài.");
          return;
        }
      }

      if (data?.blocked) {
        if (data.category === "crisis") {
          setIsBlockedCrisis(true);
          setErrorMessage("Chúng tôi nhận thấy bạn có thể đang trải qua khủng hoảng tâm lý nghiêm trọng. Trải bài Tarot không phù hợp trong tình huống này.");
          return;
        } else {
          setErrorMessage(`Câu hỏi thuộc lĩnh vực ${data.category} không được hỗ trợ.`);
          return;
        }
      }

      if (data?.token) {
        setDrawToken(data.token);
      }

      setPhase("shuffling");
      setSelectedCards([]);
    } catch (err: any) {
      setErrorMessage(err?.message || "Lỗi kết nối máy chủ khi xáo bài.");
    }
  };

  const [isRevealing, setIsRevealing] = useState(false);

  const handlePickCard = async (slotIndex: number) => {
    if (selectedCards.length >= 3 || isRevealing) return;
    if (!drawToken) {
      setErrorMessage("Phiên trải bài chưa được tạo. Vui lòng xáo bài lại.");
      return;
    }

    setIsRevealing(true);
    const nextIndex = selectedCards.length;

    try {
      const res = await fetch("/api/reading/deep/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: drawToken,
          revealIndex: nextIndex,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || "Không thể lật lá bài. Vui lòng thử lại.");
        return;
      }

      const data = await res.json();
      const cardObj = {
        id: data.cardId,
        name: data.cardId,
        nameVi: data.nameVi,
        imageUrl: data.image,
        image: data.image,
        orientation: data.orientation,
        psychologySummary: data.base?.summary || data.base?.body,
        body: data.base?.body,
        keywords: data.base?.keywords || [],
      };

      const updated = [...selectedCards, cardObj];
      setSelectedCards(updated);

      if (updated.length === 3) {
        setTimeout(() => {
          setPhase("revealed");
        }, 700);
      }
    } catch {
      setErrorMessage("Lỗi kết nối khi lật bài.");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleUnlockDeepAnalysis = async () => {
    if (credits < 2) {
      setErrorMessage("Bạn cần ít nhất 2 Credits để mở khóa luận giải chuyên sâu.");
      onOpenTopUp();
      return;
    }

    if (!drawToken) {
      setErrorMessage("Phiên trải bài không hợp lệ. Vui lòng bắt đầu lại.");
      return;
    }

    setPhase("analysis");
    setStreamedText("");
    setIsTyping(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/reading/deep/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: drawToken,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setIsTyping(false);
        if (res.status === 402 || errorData.error === "insufficient_credits") {
          setErrorMessage("Số dư Credits không đủ để thực hiện luận giải.");
          onOpenTopUp();
        } else {
          setErrorMessage(errorData.error || "Không thể kết nối máy chủ để tạo luận giải chuyên sâu.");
        }
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.type === "delta" && data.text) {
                fullText += data.text;
                setStreamedText(fullText);
              } else if (data.type === "final" && data.text) {
                fullText = data.text;
                setStreamedText(fullText);
              } else if (data.type === "error") {
                setErrorMessage(data.message || "Lỗi trong quá trình tạo văn bản.");
              }
            } catch {
              // ignore parse
            }
          }
        }
        setIsTyping(false);
        onDeductCredit(2);
      }
    } catch (err: any) {
      setIsTyping(false);
      setErrorMessage(err?.message || "Lỗi kết nối luồng phân tích.");
    }
  };

  const handleSave = () => {
    const newReading: ReadingHistoryItem = {
      id: "reading-" + Date.now(),
      date: new Date().toLocaleDateString("vi-VN"),
      topic: "general",
      topicVi: "Tổng quan",
      question: inquiry,
      cards: selectedCards.map((c, i) => ({
        name: c.name,
        nameVi: c.nameVi || c.name,
        image: c.imageUrl || c.image || `/cards/${c.image_filename || "the-fool.jpg"}`,
        orientation: "upright",
        position: i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai",
      })),
      personalBody: streamedText,
    };
    onSaveReading(newReading);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `[Ventus Tarot] Kết quả trải bài cho câu hỏi: "${inquiry}"\n\n${streamedText}`
      );
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 flex flex-col items-center justify-start relative z-10">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-6 mb-8 border-b border-[#3d3123]/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37]">
              Trải 3 Lá Chuyên Sâu
            </span>
            <span className="text-xs text-[#7a6e5d]">Quá Khứ • Hiện Tại • Tương Lai</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl text-[#f3ece1] font-bold">
            Trải Bài Sâu
          </h1>
        </div>

        <button
          onClick={() => onNavigate("home")}
          className="text-xs text-[#b3a48d] hover:text-[#d4af37] transition-colors cursor-pointer"
        >
          ← Quay lại Trang Chủ
        </button>
      </div>

      {/* Error / Crisis Notice */}
      {errorMessage && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-[#f0605f]/15 border border-[#f0605f]/40 text-[#f0605f] text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Thông báo:</span>
          </div>
          <p className="leading-relaxed">{errorMessage}</p>
          {isBlockedCrisis && (
            <div className="pt-2 border-t border-[#f0605f]/30 flex items-center justify-between">
              <span className="text-[11px]">Tổng đài hỗ trợ tâm lý khẩn cấp:</span>
              <a href="tel:111" className="font-bold underline flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5" /> Gọi 111 (Miễn phí)
              </a>
            </div>
          )}
        </div>
      )}

      {/* PHASE 1: Inquiry Input */}
      {phase === "inquiry" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center animate-in fade-in duration-300">
          <div className="w-full bg-[#15100b] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] mb-8">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] block mb-2">
              Nhập Câu Hỏi Hoặc Trăn Trở Của Bạn
            </label>
            <textarea
              rows={4}
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
              placeholder="Ví dụ: Tôi đang đứng trước hai ngã rẽ công việc, tôi nên chuẩn bị tâm thế ra sao để đón nhận bước chuyển này?..."
              className="w-full bg-[#050505] border border-[#3d3123] rounded-2xl p-4 text-sm text-[#f3ece1] placeholder:text-[#7a6e5d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all resize-none mb-4"
            />

            <div className="mb-6">
              <span className="text-[11px] font-semibold text-[#7a6e5d] uppercase tracking-wider block mb-2">
                Gợi Ý Câu Hỏi Mẫu
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInquiry(s)}
                    className="text-left text-xs bg-[#1c1611] hover:bg-[#251d16] border border-[#3d3123] hover:border-[#d4af37]/60 text-[#b3a48d] hover:text-[#f3ece1] p-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartShuffling}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(143,90,31,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tiến Hành Xáo Bài & Trải 3 Lá</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Interactive Shuffling & 3-Slot Picking */}
      {phase === "shuffling" && (
        <div className="w-full flex flex-col items-center py-6 animate-in fade-in duration-300">
          <div className="text-center mb-6">
            <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-widest block mb-1">
              Đã chọn ({selectedCards.length}/3 lá)
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-bold">
              Chạm vào 3 lá bài bạn cảm nhận rõ ràng nhất
            </h2>
            <p className="text-xs text-[#b3a48d] mt-1 italic">
              "{inquiry}"
            </p>
          </div>

          {/* 3 Selected Slots */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 w-full max-w-lg">
            {[0, 1, 2].map((slotIdx) => {
              const card = selectedCards[slotIdx];
              const slotLabel = slotIdx === 0 ? "1. Quá Khứ" : slotIdx === 1 ? "2. Hiện Tại" : "3. Tương Lai";
              return (
                <div
                  key={slotIdx}
                  className={`aspect-[2/3] rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all duration-500 relative overflow-hidden ${
                    card
                      ? "border-[#d4af37] bg-[#1c1611] shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                      : "border-dashed border-[#3d3123] bg-[#050505]/60"
                  }`}
                >
                  {card ? (
                    <>
                      <img
                        src={card.imageUrl || card.image || `/cards/${card.image_filename || "the-fool.jpg"}`}
                        alt={card.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-2">
                        <span className="text-[10px] text-[#d4af37] font-semibold">
                          {card.nameVi}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#7a6e5d] font-mono font-medium">
                      {slotLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Card Deck Row */}
          {selectedCards.length < 3 && (
            <div className="relative w-full max-w-3xl h-56 flex items-center justify-center overflow-visible my-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => handlePickCard(i)}
                  className="absolute w-24 sm:w-28 aspect-[2/3] rounded-xl border border-[#3d3123] hover:border-[#d4af37] bg-[#15100b] shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-6 hover:scale-105 hover:z-40 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                  style={{
                    left: `calc(50% - 50px + ${(i - 5.5) * 45}px)`,
                    backgroundImage: `url(${CARD_BACK_IMAGE})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="card-shimmer" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: Base Layer Revealed (3 Cards) */}
      {phase === "revealed" && (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block mb-1">
              Thông Điệp 3 Lá Bài
            </span>
            <h2 className="font-display text-2xl sm:text-4xl text-white font-bold">
              3 Trụ Cột Năng Lượng Đã Hiện Diện
            </h2>
            <p className="text-xs sm:text-sm text-[#b3a48d] mt-1 italic">
              "{inquiry}"
            </p>
          </div>

          {/* 3 Cards Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {selectedCards.map((card, i) => {
              const position = i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai";
              const cardImg = card.imageUrl || card.image || `/cards/${card.image_filename || "the-fool.jpg"}`;
              return (
                <div
                  key={i}
                  className="bg-[#15100b] border border-[#3d3123] rounded-2xl p-5 flex flex-col items-center text-center shadow-2xl relative group hover:border-[#d4af37]/60 transition-all"
                >
                  <span className="px-3 py-0.5 rounded-full bg-[#251d16] border border-[#3d3123] text-[10px] uppercase font-mono tracking-wider text-[#d4af37] mb-3">
                    {position}
                  </span>

                  <div className="w-36 aspect-[2/3] rounded-xl border border-[#d4af37]/45 shadow-[0_0_25px_rgba(212,175,55,0.25)] overflow-hidden mb-3">
                    <img src={cardImg} alt={card.name} className="w-full h-full object-cover" />
                  </div>

                  <h3 className="font-display text-lg text-white font-bold mb-0.5">
                    {card.nameVi || card.name_vi}
                  </h3>
                  <span className="text-xs text-[#7a6e5d] mb-3 font-serif italic">
                    {card.name || card.name_en}
                  </span>

                  <p className="text-xs text-[#b3a48d] leading-relaxed line-clamp-4">
                    {card.psychologySummary || card.summary || card.uprightMeaning}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Unlock Button */}
          <div className="max-w-md mx-auto flex flex-col items-center">
            <button
              onClick={handleUnlockDeepAnalysis}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] font-bold text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(143,90,31,0.6)] border border-[#d4af37]/60 flex items-center justify-center gap-3 cursor-pointer active:scale-98"
            >
              <span>MỞ KHÓA LUẬN GIẢI CHUYÊN SÂU</span>
              <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-lg text-xs font-bold text-[#d4af37]">
                <Coins className="w-3.5 h-3.5" />
                <span>2 Credits</span>
              </div>
            </button>

            <p className="mt-3 text-xs text-[#7a6e5d] flex items-center gap-1">
              <span>Số dư hiện tại: <strong className="text-[#d4af37]">{credits} Credits</strong></span>
            </p>
          </div>
        </div>
      )}

      {/* PHASE 4: Stream Analysis */}
      {phase === "analysis" && (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in duration-500">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] block mb-1">
              Phản Chiếu Tâm Thức Realtime
            </span>
            <h2 className="font-display text-2xl sm:text-4xl text-white font-bold">
              Luận Giải Chi Tiết
            </h2>
          </div>

          {/* Mini Cards Bar */}
          <div className="flex justify-center gap-4 sm:gap-6 mb-8">
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 sm:w-24 aspect-[2/3] rounded-lg border border-[#d4af37]/45 shadow-[0_0_15px_rgba(212,175,55,0.25)] overflow-hidden mb-1">
                  <img
                    src={card.imageUrl || card.image || `/cards/${card.image_filename || "the-fool.jpg"}`}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] uppercase font-mono text-[#7a6e5d]">
                  {i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai"}
                </span>
                <span className="text-[11px] font-semibold text-[#f3ece1] truncate max-w-[80px]">
                  {card.nameVi || card.name}
                </span>
              </div>
            ))}
          </div>

          {/* Synthesized Output Box */}
          <div className="w-full bg-[#15100b] rounded-3xl p-6 sm:p-10 border border-[#d4af37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative mb-8">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#3d3123]">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-display text-xl sm:text-2xl text-[#d4af37] font-bold">
                Tổng Hợp & Lời Khuyên Định Hướng
              </h3>
            </div>

            <div className="text-[#f3ece1] text-sm sm:text-base leading-relaxed whitespace-pre-line font-serif">
              {streamedText}
              {isTyping && <span className="ai-cursor" />}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center mb-8">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#8f5a1f] hover:bg-[#a06827] text-white text-xs font-semibold uppercase tracking-wider py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              <span>{savedSuccess ? "Đã Lưu Lịch Sử ✓" : "Lưu Phiên Trải Bài"}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 bg-[#1c1611] border border-[#3d3123] hover:border-[#d4af37] text-[#f3ece1] text-xs font-semibold uppercase tracking-wider py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedSuccess ? "Đã Sao Chép Link ✓" : "Chia Sẻ Kết Quả"}</span>
            </button>
          </div>

          <button
            onClick={() => {
              setPhase("inquiry");
              setInquiry("");
            }}
            className="text-xs text-[#d4af37] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thực hiện một phiên trải bài mới</span>
          </button>
        </div>
      )}
    </div>
  );
};
