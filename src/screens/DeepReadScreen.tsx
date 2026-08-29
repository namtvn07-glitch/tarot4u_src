"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  Share2,
  AlertTriangle,
  Coins,
  AlertCircle,
  PhoneCall,
  Heart,
  Briefcase,
  Flower2,
  Compass,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Zap,
  X,
} from "lucide-react";
import { CARD_BACK_IMAGE } from "@/data/tarotCards";
import type { AppScreen, ReadingHistoryItem, Topic } from "@/types/tarot";

interface DeepReadScreenProps {
  initialInquiry?: string;
  initialTopic?: Topic;
  onNavigate: (screen: AppScreen) => void;
  credits: number;
  onDeductCredit: (amount: number) => boolean;
  onSaveReading: (reading: ReadingHistoryItem) => void;
  onOpenTopUp: () => void;
  onBusyChange?: (busy: boolean) => void;
}

type DeepReadPhase = "inquiry" | "shuffling" | "revealed" | "analysis";

export type BlockedCategory = "crisis" | "medical" | "legal" | "harmful" | "nonsense";

interface TopicOption {
  id: Topic;
  nameVi: string;
  descVi: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestions: string[];
}

const TOPIC_OPTIONS: TopicOption[] = [
  {
    id: "general",
    nameVi: "Tổng Quan",
    descVi: "Bức tranh toàn cảnh về năng lượng và bài học hiện tại",
    icon: Compass,
    suggestions: [
      "Bức tranh tổng quan và lời khuyên soi sáng cho giai đoạn này là gì?",
      "Bài học quan trọng nhất tôi cần chiêm nghiệm trong thời điểm hiện tại?",
      "Năng lượng nào đang đồng hành và nâng đỡ hành trình của tôi lúc này?",
    ],
  },
  {
    id: "love",
    nameVi: "Tình Yêu",
    descVi: "Thấu hiểu liên kết, rung động cảm xúc và chữa lành trái tim",
    icon: Heart,
    suggestions: [
      "Làm thế nào để tôi mở rộng trái tim và thấu hiểu mối liên kết hiện tại?",
      "Tôi và đối phương đang gặp rào cản gì, tôi nên ứng xử ra sao?",
      "Tôi cần chuẩn bị tâm thế nào để đón nhận một mối quan hệ lành mạnh?",
    ],
  },
  {
    id: "career",
    nameVi: "Sự Nghiệp",
    descVi: "Soi sáng hướng đi, cơ hội thăng tiến và thử thách công việc",
    icon: Briefcase,
    suggestions: [
      "Những trở ngại nào đang ngăn cản sự thăng tiến trong sự nghiệp của tôi?",
      "Tôi đang đứng trước hai ngã rẽ công việc, tôi nên chuẩn bị tâm thế ra sao?",
      "Tôi cần phát triển kỹ năng hay góc nhìn nào trong môi trường làm việc lúc này?",
    ],
  },
  {
    id: "finance",
    nameVi: "Tài Chính",
    descVi: "Dòng chảy thịnh vượng, đầu tư và cách quản lý tài nguyên",
    icon: Coins,
    suggestions: [
      "Dòng chảy tài chính và những cơ hội thịnh vượng nào sắp tới?",
      "Làm thế nào để tôi quản lý tài nguyên và giải tỏa áp lực tài chính?",
      "Tôi cần lưu ý điều gì trước các quyết định chi tiêu hay hợp tác sắp tới?",
    ],
  },
  {
    id: "spiritual",
    nameVi: "Tâm Linh",
    descVi: "Khai mở trực giác, chữa lành nội tâm và nhận thức bản thể",
    icon: Flower2,
    suggestions: [
      "Tôi cần lắng nghe thông điệp nội tâm nào để tìm thấy sự bình yên?",
      "Nỗi sợ hay niềm tin giới hạn nào đang cản trở sự phát triển nhận thức của tôi?",
      "Làm sao để tôi kết nối sâu sắc hơn với trực giác và bản thể chân thật?",
    ],
  },
];

const QUESTION_MAX = 300;
const FAN_CARDS_COUNT = 19;
const SESSION_STORAGE_KEY = "ventus_deep_session";

interface CardDrawResult {
  cardId: string;
  name: string;
  nameVi: string;
  nameEn?: string;
  image: string;
  imageUrl?: string;
  orientation: "upright" | "reversed";
  keywords: string[];
  summary?: string;
  body?: string;
  psychologySummary?: string;
}

export const DeepReadScreen: React.FC<DeepReadScreenProps> = ({
  initialInquiry = "",
  initialTopic = "general",
  onNavigate,
  credits,
  onDeductCredit,
  onSaveReading,
  onOpenTopUp,
  onBusyChange,
}) => {
  const [phase, setPhase] = useState<DeepReadPhase>("inquiry");
  const [selectedTopic, setSelectedTopic] = useState<Topic>(initialTopic);
  const [inquiry, setInquiry] = useState(initialInquiry);
  const [pickedSlotIndices, setPickedSlotIndices] = useState<number[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardDrawResult[]>([]);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [drawToken, setDrawToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [blockedData, setBlockedData] = useState<{ category: BlockedCategory } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [refundNotice, setRefundNotice] = useState<string | null>(null);
  const [showEffects, setShowEffects] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const questionInputId = useId();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Notify parent component about busy state
  useEffect(() => {
    onBusyChange?.(isShuffling);
  }, [isShuffling, onBusyChange]);

  // Restore Session Storage if user previously navigated away
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          // Check if session is recent (< 2 hours)
          if (data && Date.now() - (data.timestamp || 0) < 7200000) {
            if (data.phase && data.phase !== "inquiry" && data.drawToken) {
              setPhase(data.phase);
              if (data.selectedTopic) setSelectedTopic(data.selectedTopic);
              if (data.inquiry) setInquiry(data.inquiry);
              if (data.drawToken) setDrawToken(data.drawToken);
              if (data.pickedSlotIndices) setPickedSlotIndices(data.pickedSlotIndices);
              if (data.selectedCards) setSelectedCards(data.selectedCards);
              if (data.streamedText) setStreamedText(data.streamedText);
            }
          }
        }
      }
    } catch {
      // Ignore session read error
    }
  }, []);

  // Sync state to Session Storage automatically
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (phase !== "inquiry" && drawToken) {
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              phase,
              selectedTopic,
              inquiry,
              drawToken,
              pickedSlotIndices,
              selectedCards,
              streamedText,
              timestamp: Date.now(),
            })
          );
        } else if (phase === "inquiry") {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore session write error
    }
  }, [phase, selectedTopic, inquiry, drawToken, pickedSlotIndices, selectedCards, streamedText]);

  // Handle Tab Switch (Page Visibility API & Dynamic Tab Title)
  useEffect(() => {
    const originalTitle = typeof document !== "undefined" ? document.title : "";

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (originalTitle) document.title = originalTitle;
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (originalTitle) document.title = originalTitle;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (initialInquiry) {
      setInquiry(initialInquiry);
    }
  }, [initialInquiry]);

  useEffect(() => {
    if (initialTopic) {
      setSelectedTopic(initialTopic);
    }
  }, [initialTopic]);

  const activeTopicConfig =
    TOPIC_OPTIONS.find((t) => t.id === selectedTopic) || TOPIC_OPTIONS[0];

  const handleStartShuffling = async () => {
    const trimmed = inquiry.trim();
    if (!trimmed) {
      setErrorMessage("Vui lòng nhập câu hỏi hoặc trăn trở bạn muốn soi sáng.");
      return;
    }

    setIsShuffling(true);
    setErrorMessage("");
    setBlockedData(null);
    setRefundNotice(null);
    setShowEffects(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/reading/deep/shuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, topic: selectedTopic }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMessage("Vui lòng đăng nhập tài khoản trước khi thực hiện trải bài sâu.");
          onOpenTopUp();
          return;
        } else if (res.status === 429) {
          setErrorMessage("Bạn đã thực hiện quá nhiều lượt xáo bài trong 1 giờ. Vui lòng chờ ít phút.");
          return;
        } else if (data?.error === "moderation_failed") {
          setErrorMessage("Hệ thống kiểm duyệt AI đang bận hoặc gặp gián đoạn kết nối. Vui lòng thử lại sau vài giây.");
          return;
        } else {
          setErrorMessage(data?.error || "Không thể khởi tạo phiên trải bài. Vui lòng thử lại.");
          return;
        }
      }

      if (data?.blocked) {
        setBlockedData({ category: data.category as BlockedCategory });
        return;
      }

      if (data?.token) {
        setDrawToken(data.token);
      }

      setPhase("shuffling");
      setSelectedCards([]);
      setPickedSlotIndices([]);
      setPendingSlotIndex(null);

      // Notify user via Tab title if they are currently on another browser tab
      if (typeof document !== "undefined" && document.hidden) {
        document.title = "✦ Bài đã xáo xong — Ventus Tarot";
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorMessage(err?.message || "Lỗi kết nối máy chủ khi xáo bài. Vui lòng thử lại.");
      }
    } finally {
      setIsShuffling(false);
    }
  };

  const handlePickCard = async (slotIndex: number) => {
    if (selectedCards.length >= 3 || isRevealing || pickedSlotIndices.includes(slotIndex)) {
      return;
    }
    if (!drawToken) {
      setErrorMessage("Phiên trải bài chưa được tạo. Vui lòng xáo bài lại.");
      return;
    }

    setIsRevealing(true);
    const nextIndex = selectedCards.length;
    setPendingSlotIndex(nextIndex);
    setPickedSlotIndices((prev) => [...prev, slotIndex]);

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
        setPickedSlotIndices((prev) => prev.filter((idx) => idx !== slotIndex));
        setPendingSlotIndex(null);
        return;
      }

      const data = await res.json();
      const cardObj: CardDrawResult = {
        cardId: data.cardId,
        name: data.cardId,
        nameVi: data.nameVi,
        image: data.image,
        imageUrl: data.image,
        orientation: data.orientation || "upright",
        keywords: data.base?.keywords || [],
        summary: data.base?.summary || "",
        body: data.base?.body || "",
        psychologySummary: data.base?.summary || data.base?.body || "",
      };

      const updated = [...selectedCards, cardObj];
      setSelectedCards(updated);
      setPendingSlotIndex(null);

      if (updated.length === 3) {
        setTimeout(() => {
          setShowEffects(true);
        }, 550);
        setTimeout(() => {
          setPhase("revealed");
        }, 1150);
      }
    } catch {
      setErrorMessage("Lỗi kết nối khi lật bài. Vui lòng thử lại.");
      setPickedSlotIndices((prev) => prev.filter((idx) => idx !== slotIndex));
      setPendingSlotIndex(null);
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
    setRefundNotice(null);

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
          setErrorMessage(
            errorData.error || "Không thể kết nối máy chủ để tạo luận giải chuyên sâu."
          );
        }
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let hasErrorOccurred = false;

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
                // Normalize Unicode to NFC immediately to prevent broken Vietnamese diacritics
                setStreamedText(fullText.normalize("NFC"));
              } else if (data.type === "done") {
                setStreamedText((prev) => prev.normalize("NFC"));
                if (typeof document !== "undefined" && document.hidden) {
                  document.title = "✦ Luận giải đã sẵn sàng — Ventus Tarot";
                }
              } else if (data.type === "error") {
                hasErrorOccurred = true;
                setErrorMessage(data.message || "Lỗi trong quá trình tạo văn bản.");
                setRefundNotice("2 Credits đã được hoàn trả lại tài khoản của bạn.");
              }
            } catch {
              // Ignore line parse error
            }
          }
        }
        setIsTyping(false);

        // Update client balance if deduction succeeded
        if (!hasErrorOccurred) {
          onDeductCredit(2);
        }
      }
    } catch (err: any) {
      setIsTyping(false);
      setErrorMessage(err?.message || "Lỗi kết nối luồng phân tích chuyên sâu.");
      setRefundNotice("Nếu credits đã bị trừ, hệ thống sẽ tự động hoàn lại.");
    }
  };

  const handleSave = () => {
    const topicVi = activeTopicConfig.nameVi;
    const newReading: ReadingHistoryItem = {
      id: "reading-" + Date.now(),
      date: new Date().toLocaleDateString("vi-VN"),
      topic: selectedTopic,
      topicVi,
      type: "deep",
      question: inquiry,
      cards: selectedCards.map((c, i) => ({
        name: c.name,
        nameVi: c.nameVi || c.name,
        image: c.image || c.imageUrl || "/cards/the-fool.jpg",
        orientation: c.orientation,
        position: i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai",
        meaningText: c.body || c.summary,
      })),
      personalBody: streamedText.normalize("NFC"),
    };
    onSaveReading(newReading);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `[Ventus Tarot] Trải bài sâu cho chủ đề: ${activeTopicConfig.nameVi}\nCâu hỏi: "${inquiry}"\n\n${streamedText.normalize("NFC")}`
      );
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  const handleHeaderBack = () => {
    if (phase !== "inquiry" && selectedCards.length > 0) {
      setShowExitConfirm(true);
    } else {
      onNavigate("home");
    }
  };

  // Render markdown helper with Unicode NFC normalization & high-readability body font
  const renderFormattedAnalysis = (rawText: string) => {
    if (!rawText) return null;
    const text = rawText.normalize("NFC");

    const blocks = text.split("\n\n");
    return (
      <div className="space-y-4">
        {blocks.map((block, bIdx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // Heading 3: ###
          if (trimmed.startsWith("### ")) {
            return (
              <h4
                key={bIdx}
                className="font-display text-lg sm:text-xl text-[#f5e6a3] font-bold mt-6 mb-2 border-b border-[#3d3123]/60 pb-1.5"
              >
                {trimmed.replace(/^###\s+/, "")}
              </h4>
            );
          }

          // Heading 2: ##
          if (trimmed.startsWith("## ")) {
            return (
              <h3
                key={bIdx}
                className="font-display text-xl sm:text-2xl text-[#d4af37] font-bold mt-6 mb-3"
              >
                {trimmed.replace(/^##\s+/, "")}
              </h3>
            );
          }

          // Bullet lists
          if (trimmed.includes("\n- ") || trimmed.startsWith("- ")) {
            const items = trimmed.split("\n- ").map((item) => item.replace(/^- /, ""));
            return (
              <ul key={bIdx} className="space-y-2.5 my-3 list-none pl-1">
                {items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed text-[#f3ece1] font-body">
                    <span className="text-[#d4af37] font-bold text-xs mt-1 shrink-0">✦</span>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f5e6a3] font-semibold">$1</strong>'),
                      }}
                    />
                  </li>
                ))}
              </ul>
            );
          }

          // Standard paragraph with bold highlighting in Plus Jakarta Sans
          const htmlContent = trimmed.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="text-[#f5e6a3] font-semibold">$1</strong>'
          );

          return (
            <p
              key={bIdx}
              className="text-sm sm:text-base leading-relaxed text-[#f3ece1] font-body"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          );
        })}
      </div>
    );
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
          onClick={handleHeaderBack}
          className="text-xs text-[#b3a48d] hover:text-[#d4af37] transition-colors cursor-pointer"
        >
          ← Quay lại Trang Chủ
        </button>
      </div>

      {/* Navigation Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#15100b] border-2 border-[#d4af37]/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#d4af37]" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-bold mb-2">
              Lưu Tạm Phiên Trải Bài?
            </h3>
            <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-6 font-body">
              Phiên trải bài của bạn đã được hệ thống tự động lưu vào bộ nhớ tạm. Bạn có thể quay lại bất cứ lúc nào mà không lo mất tiến trình.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:from-[#d4af37] hover:to-[#8f5a1f] hover:text-[#050505] transition-all"
              >
                Ở Lại Tiếp Tục
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onNavigate("home");
                }}
                className="flex-1 py-3 rounded-xl bg-[#1c1611] border border-[#3d3123] text-[#b3a48d] hover:text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety / Moderation Notice Component */}
      {blockedData && (
        <div className="w-full max-w-2xl mb-8 p-6 rounded-3xl bg-[#1c1611] border-2 border-[#f0605f]/50 shadow-[0_10px_35px_rgba(240,96,95,0.15)] animate-in fade-in duration-300">
          {blockedData.category === "crisis" ? (
            <div>
              <div className="flex items-center gap-2.5 text-[#f0605f] font-bold text-base sm:text-lg mb-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Có vẻ bạn đang trải qua điều gì đó rất khó khăn</span>
              </div>
              <p className="text-xs sm:text-sm text-[#f3ece1] leading-relaxed mb-4">
                Tarot không phải là thứ phù hợp lúc này — nhưng có những người thật sẵn sàng lắng nghe và đồng hành cùng bạn, ngay bây giờ:
              </p>
              <div className="space-y-2.5 bg-[#050505]/70 p-4 rounded-2xl border border-[#f0605f]/30 mb-5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-[#b3a48d]">Đường dây nóng Ngày Mai (13:00 - 20:30, T4 → CN):</span>
                  <a
                    href="tel:0963061414"
                    className="font-bold text-[#f0605f] hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> 0963 061 414
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm border-t border-[#3d3123]/50 pt-2">
                  <span className="text-[#b3a48d]">Tổng đài Quốc gia Bảo vệ Trẻ em (24/7):</span>
                  <a
                    href="tel:111"
                    className="font-bold text-[#f0605f] hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Gọi 111 (Miễn phí)
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm border-t border-[#3d3123]/50 pt-2">
                  <span className="text-[#b3a48d]">Cấp cứu Y tế Khẩn cấp:</span>
                  <a
                    href="tel:115"
                    className="font-bold text-[#f0605f] hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Gọi 115
                  </a>
                </div>
              </div>
              <p className="text-xs text-[#7a6e5d] italic">
                Nếu bạn muốn, hãy quay lại khi bạn thấy ổn hơn. Chúng tôi vẫn luôn ở đây.
              </p>
            </div>
          ) : blockedData.category === "medical" ? (
            <div>
              <div className="flex items-center gap-2 text-[#d4af37] font-bold text-base mb-2">
                <Info className="w-5 h-5 shrink-0" />
                <span>Câu hỏi này cần một chuyên gia y tế</span>
              </div>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-4">
                Tarot không thể chẩn đoán hay trả lời câu hỏi về sức khỏe và bệnh tật. Hãy tham khảo bác sĩ hoặc chuyên gia y tế để được chăm sóc tốt nhất. Bạn có thể đặt lại câu hỏi hướng về cảm xúc hoặc cách tự chăm sóc tâm lý bản thân.
              </p>
            </div>
          ) : blockedData.category === "legal" ? (
            <div>
              <div className="flex items-center gap-2 text-[#d4af37] font-bold text-base mb-2">
                <Info className="w-5 h-5 shrink-0" />
                <span>Câu hỏi này cần một chuyên gia pháp lý</span>
              </div>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-4">
                Tarot không có giá trị pháp lý và không thể tiên đoán kết quả kiện tụng. Hãy tham khảo luật sư để có lời khuyên chính xác.
              </p>
            </div>
          ) : blockedData.category === "harmful" ? (
            <div>
              <div className="flex items-center gap-2 text-[#f0605f] font-bold text-base mb-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Không thể tiếp tục với câu hỏi này</span>
              </div>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-4">
                Chúng tôi không hỗ trợ các câu hỏi liên quan đến hành vi xâm phạm hoặc làm tổn hại người khác. Vui lòng đặt một câu hỏi chiêm nghiệm cá nhân.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-[#d4af37] font-bold text-base mb-2">
                <Info className="w-5 h-5 shrink-0" />
                <span>Cần một câu hỏi rõ ràng và cụ thể hơn</span>
              </div>
              <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-4">
                Hãy đặt một câu hỏi cụ thể về trăn trở của bạn để trải bài Tarot có thể phản chiếu thông điệp hữu ích nhất.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setBlockedData(null);
              setErrorMessage("");
            }}
            className="w-full py-2.5 rounded-xl bg-[#251d16] hover:bg-[#3d3123] border border-[#3d3123] text-xs font-semibold text-[#f3ece1] transition-colors cursor-pointer font-body"
          >
            Đặt lại câu hỏi khác
          </button>
        </div>
      )}

      {/* General Error Message */}
      {errorMessage && !blockedData && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-[#f0605f]/15 border border-[#f0605f]/40 text-[#f0605f] text-xs flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Thông báo:</span>
          </div>
          <p className="leading-relaxed font-body">{errorMessage}</p>
          {refundNotice && (
            <p className="text-[#d4af37] font-medium border-t border-[#f0605f]/30 pt-1.5 mt-1 font-body">
              ✓ {refundNotice}
            </p>
          )}
        </div>
      )}

      {/* PHASE 1: Topic Selection & Inquiry Input */}
      {phase === "inquiry" && (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center animate-in fade-in duration-300">
          <div className="w-full bg-[#15100b] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] mb-8">
            
            {/* Step 1: Topic Picker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bước 1: Chọn Chủ Đề Chiêm Nghiệm</span>
                </label>
                <span className="text-[11px] text-[#7a6e5d]">5 lĩnh vực năng lượng</span>
              </div>

              <div
                role="group"
                aria-label="Chọn chủ đề trải bài"
                className="grid grid-cols-2 sm:grid-cols-5 gap-2.5"
              >
                {TOPIC_OPTIONS.map((opt) => {
                  const isSelected = selectedTopic === opt.id;
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isShuffling}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedTopic(opt.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                        isShuffling
                          ? "opacity-60 cursor-not-allowed border-[#3d3123] bg-[#0c0907] text-[#7a6e5d]"
                          : isSelected
                          ? "border-[#d4af37] bg-gradient-to-b from-[#8f5a1f]/30 to-[#1c1611] text-[#f5e6a3] shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.02] cursor-pointer"
                          : "border-[#3d3123] bg-[#0c0907] text-[#b3a48d] hover:border-[#d4af37]/50 hover:bg-[#1a140e] hover:text-[#f3ece1] cursor-pointer"
                      }`}
                    >
                      <IconComp
                        className={`w-5 h-5 mb-1.5 ${
                          isSelected ? "text-[#d4af37]" : "text-[#7a6e5d]"
                        }`}
                      />
                      <span className="text-xs font-bold">{opt.nameVi}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[11px] text-[#7a6e5d] italic">
                {activeTopicConfig.descVi}
              </p>
            </div>

            {/* Step 2: Inquiry Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={questionInputId}
                  className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bước 2: Nhập Câu Hỏi / Trăn Trở Của Bạn</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    inquiry.trim().length > QUESTION_MAX ? "text-[#f0605f]" : "text-[#7a6e5d]"
                  }`}
                >
                  {inquiry.trim().length}/{QUESTION_MAX}
                </span>
              </div>

              <textarea
                id={questionInputId}
                rows={3}
                value={inquiry}
                disabled={isShuffling}
                maxLength={QUESTION_MAX}
                onChange={(e) => setInquiry(e.target.value.slice(0, QUESTION_MAX))}
                placeholder={`Ví dụ: ${activeTopicConfig.suggestions[0]}`}
                className={`w-full bg-[#050505] border rounded-2xl p-4 text-sm text-[#f3ece1] placeholder:text-[#7a6e5d] transition-all resize-none font-body ${
                  isShuffling
                    ? "border-[#d4af37]/40 opacity-70 cursor-not-allowed bg-[#0d0a07]"
                    : "border-[#3d3123] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                }`}
              />
            </div>

            {/* Suggestions for Selected Topic */}
            <div className="mb-8">
              <span className="text-[11px] font-semibold text-[#7a6e5d] uppercase tracking-wider block mb-2">
                Gợi Ý Câu Hỏi Cho Chủ Đề {activeTopicConfig.nameVi}
              </span>
              <div className="flex flex-col gap-2">
                {activeTopicConfig.suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isShuffling}
                    onClick={() => setInquiry(s)}
                    className={`text-left text-xs p-3 rounded-xl transition-all flex items-center justify-between group ${
                      isShuffling
                        ? "bg-[#140f0c] border border-[#2d241a] text-[#52483d] opacity-50 cursor-not-allowed"
                        : "bg-[#1c1611] hover:bg-[#251d16] border border-[#3d3123] hover:border-[#d4af37]/60 text-[#b3a48d] hover:text-[#f3ece1] cursor-pointer"
                    }`}
                  >
                    <span>"{s}"</span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ml-2 transition-opacity ${
                      isShuffling ? "opacity-0" : "opacity-0 group-hover:opacity-100 text-[#d4af37]"
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleStartShuffling}
              disabled={!inquiry.trim() || isShuffling}
              className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 ${
                isShuffling
                  ? "bg-[#251d16] border border-[#d4af37]/60 text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.25)] cursor-wait"
                  : !inquiry.trim()
                  ? "bg-gradient-to-r from-[#3d3123] to-[#251d16] text-[#7a6e5d] opacity-50 cursor-not-allowed border border-[#3d3123]"
                  : "bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] shadow-[0_0_25px_rgba(143,90,31,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)]"
              }`}
            >
              {isShuffling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37]" />
                  <span>Đang Định Tâm & Xáo Bài...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Tiến Hành Xáo Bài & Trải 3 Lá</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Interactive 3D Card Fan & 3-Slot Flipping Deck */}
      {phase === "shuffling" && (
        <div className="w-full flex flex-col items-center py-2 animate-in fade-in duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold mb-2">
              <span>Chủ đề: {activeTopicConfig.nameVi}</span>
              <span>•</span>
              <span>Đã chọn ({selectedCards.length}/3 lá)</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-bold">
              Chạm vào 3 lá bài bạn cảm nhận rõ ràng nhất
            </h2>
            <p className="text-xs sm:text-sm text-[#b3a48d] mt-1.5 italic max-w-xl mx-auto font-body">
              "{inquiry}"
            </p>
          </div>

          {/* 3 Selected Target Slots with Instant Tactile Feedback & 3D Flip Card */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 w-full max-w-xl">
            {[0, 1, 2].map((slotIdx) => {
              const card = selectedCards[slotIdx];
              const isPending = pendingSlotIndex === slotIdx;
              const slotLabel = slotIdx === 0 ? "1. Quá Khứ" : slotIdx === 1 ? "2. Hiện Tại" : "3. Tương Lai";
              const isReversed = card?.orientation === "reversed";
              
              return (
                <div
                  key={slotIdx}
                  className="aspect-[2/3] perspective-1000 relative rounded-2xl"
                >
                  {/* Flipping 3D Container */}
                  <div
                    className={`w-full h-full relative preserve-3d transition-transform duration-700 ease-out ${
                      card ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* Card Back Face (Placeholder or Pending state) */}
                    <div
                      className={`absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center backface-hidden shadow-xl transition-all duration-300 ${
                        isPending
                          ? "border-[#d4af37] bg-[#1c1611] shadow-[0_0_30px_rgba(212,175,55,0.6)] animate-pulse"
                          : "border-dashed border-[#3d3123] bg-[#050505]/70"
                      }`}
                      style={{
                        backgroundImage: `linear-gradient(rgba(5,5,5,0.85), rgba(5,5,5,0.85)), url(${CARD_BACK_IMAGE})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {isPending ? (
                        <div className="flex flex-col items-center gap-1.5 text-[#d4af37]">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">Đang giáng lâm...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-[11px] text-[#7a6e5d] font-mono font-medium">{slotLabel}</span>
                          <span className="text-[10px] text-[#52483d] mt-1">Chờ bốc lá</span>
                        </>
                      )}
                    </div>

                    {/* Card Front Face (Revealed Card Artwork with Sheen) */}
                    {card && (
                      <div
                        className="absolute inset-0 rounded-2xl border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.45)] overflow-hidden bg-[#15100b] rotate-y-180 backface-hidden"
                      >
                        <img
                          src={card.image || card.imageUrl || "/cards/the-fool.jpg"}
                          alt={card.nameVi}
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            isReversed ? "rotate-180" : ""
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col items-center justify-end p-2 pointer-events-none">
                          <span className="text-[9px] uppercase tracking-wider text-[#d4af37] font-semibold">
                            {slotLabel}
                          </span>
                          <span className="text-[11px] text-[#f3ece1] font-bold leading-tight truncate max-w-full">
                            {card.nameVi}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full mt-0.5 font-mono ${
                              isReversed
                                ? "bg-[#f0605f]/20 text-[#f0605f] border border-[#f0605f]/40"
                                : "bg-[#8f5a1f]/20 text-[#d4af37] border border-[#d4af37]/40"
                            }`}
                          >
                            {isReversed ? "Ngược" : "Xuôi"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive 3D Card Fan (Radial Arc Spread with High-precision Touch & Hover Dynamics) */}
          {selectedCards.length < 3 && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-4xl h-72 sm:h-96 flex items-center justify-center overflow-visible my-2">
                {Array.from({ length: FAN_CARDS_COUNT }).map((_, i) => {
                  const isPicked = pickedSlotIndices.includes(i);
                  const total = FAN_CARDS_COUNT;
                  const angle = (i - (total - 1) / 2) * 4.2;
                  const normalizedX = (i - (total - 1) / 2) / ((total - 1) / 2);
                  const yOffset = Math.abs(normalizedX * normalizedX) * 36;

                  return (
                    <div
                      key={i}
                      onClick={() => handlePickCard(i)}
                      className={`absolute w-22 sm:w-32 aspect-[2/3] rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isPicked
                          ? "opacity-20 border-[#3d3123] -translate-y-16 scale-90 pointer-events-none shadow-none"
                          : isRevealing
                          ? "border-[#3d3123] bg-[#15100b] shadow-xl opacity-80 pointer-events-none"
                          : "border-[#3d3123] hover:border-[#d4af37] bg-[#15100b] shadow-2xl hover:-translate-y-10 hover:scale-110 hover:z-50 hover:shadow-[0_0_40px_rgba(212,175,55,0.8)] active:scale-95 group"
                      }`}
                      style={{
                        transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
                        transformOrigin: "50% 115%",
                        zIndex: isPicked ? 0 : i + 1,
                        backgroundImage: `url(${CARD_BACK_IMAGE})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="card-shimmer" />
                      {isPicked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#7a6e5d] text-center mt-2 flex items-center gap-1.5 font-body">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Chạm vào lá bài bạn cảm nhận rõ ràng nhất để bốc lá tiếp theo</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: Base Layer Revealed (3 Cards with Full Base Interpretation) */}
      {phase === "revealed" && (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold mb-2">
              <span>Chủ đề: {activeTopicConfig.nameVi}</span>
              <span>•</span>
              <span>Lớp Nền Miễn Phí</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-white font-bold">
              3 Trụ Cột Năng Lượng Đã Hiện Diện
            </h2>
            <p className="text-xs sm:text-sm text-[#b3a48d] mt-1.5 italic max-w-2xl mx-auto font-body">
              "{inquiry}"
            </p>
          </div>

          {/* 3 Cards Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {selectedCards.map((card, i) => {
              const position = i === 0 ? "1. Quá Khứ" : i === 1 ? "2. Hiện Tại" : "3. Tương Lai";
              const isReversed = card.orientation === "reversed";
              const cardImg = card.image || card.imageUrl || "/cards/the-fool.jpg";

              return (
                <div
                  key={i}
                  className="bg-[#15100b] border border-[#3d3123] rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl relative group hover:border-[#d4af37]/60 transition-all"
                >
                  <div className="w-full flex items-center justify-between mb-3 px-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#251d16] border border-[#3d3123] text-[10px] uppercase font-mono tracking-wider text-[#d4af37]">
                      {position}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isReversed
                          ? "bg-[#f0605f]/20 text-[#f0605f] border border-[#f0605f]/40"
                          : "bg-[#8f5a1f]/20 text-[#d4af37] border border-[#d4af37]/40"
                      }`}
                    >
                      {isReversed ? "Chiều Ngược" : "Chiều Xuôi"}
                    </span>
                  </div>

                  <div className="w-36 aspect-[2/3] rounded-2xl border border-[#d4af37]/45 shadow-[0_0_25px_rgba(212,175,55,0.25)] overflow-hidden mb-3.5 relative">
                    <img
                      src={cardImg}
                      alt={card.nameVi}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isReversed ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  <h3 className="font-display text-lg text-white font-bold mb-0.5">
                    {card.nameVi}
                  </h3>
                  <span className="text-xs text-[#7a6e5d] mb-3 font-serif italic">
                    {card.name || card.nameEn}
                  </span>

                  {/* Keywords Tag List */}
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                      {card.keywords.map((kw, kwIdx) => (
                        <span
                          key={kwIdx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#1c1611] text-[#b3a48d] border border-[#3d3123] font-body"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Base interpretation */}
                  <div className="text-xs text-[#b3a48d] leading-relaxed text-left bg-[#0c0907] p-3.5 rounded-xl border border-[#3d3123]/60 w-full mt-auto font-body">
                    <p className="line-clamp-6">{card.body || card.psychologySummary || card.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unlock Button */}
          <div className="max-w-md mx-auto flex flex-col items-center">
            <button
              onClick={handleUnlockDeepAnalysis}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] font-bold text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(143,90,31,0.6)] hover:shadow-[0_0_40px_rgba(212,175,55,0.7)] border border-[#d4af37]/60 flex items-center justify-center gap-3 cursor-pointer active:scale-98"
            >
              <span>MỞ KHÓA LUẬN GIẢI CHUYÊN SÂU</span>
              <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg text-xs font-bold text-[#d4af37] border border-[#d4af37]/30">
                <Coins className="w-3.5 h-3.5" />
                <span>2 Credits</span>
              </div>
            </button>

            <p className="mt-3 text-xs text-[#7a6e5d] flex items-center gap-1 font-body">
              <span>Số dư tài khoản: <strong className="text-[#d4af37]">{credits} Credits</strong></span>
            </p>
          </div>
        </div>
      )}

      {/* PHASE 4: Stream Analysis */}
      {phase === "analysis" && (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in duration-500">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold mb-2">
              <span>Chủ đề: {activeTopicConfig.nameVi}</span>
              <span>•</span>
              <span>Lớp Cá Nhân Hóa AI</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-white font-bold">
              Luận Giải Chuyên Sâu
            </h2>
            <p className="text-xs sm:text-sm text-[#b3a48d] mt-1.5 italic max-w-xl mx-auto font-body">
              "{inquiry}"
            </p>
          </div>

          {/* Mini Cards Bar */}
          <div className="flex justify-center gap-3 sm:gap-6 mb-8 w-full max-w-2xl">
            {selectedCards.map((card, i) => {
              const isReversed = card.orientation === "reversed";
              return (
                <div key={i} className="flex flex-col items-center flex-1 max-w-[120px]">
                  <div className="w-full aspect-[2/3] rounded-xl border border-[#d4af37]/45 shadow-[0_0_15px_rgba(212,175,55,0.25)] overflow-hidden mb-1.5 relative">
                    <img
                      src={card.image || card.imageUrl || "/cards/the-fool.jpg"}
                      alt={card.nameVi}
                      className={`w-full h-full object-cover ${isReversed ? "rotate-180" : ""}`}
                    />
                  </div>
                  <span className="text-[9px] uppercase font-mono text-[#7a6e5d]">
                    {i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai"}
                  </span>
                  <span className="text-[11px] font-semibold text-[#f3ece1] truncate max-w-[100px] text-center font-body">
                    {card.nameVi}
                  </span>
                  <span className="text-[9px] text-[#b3a48d] font-mono">
                    ({isReversed ? "Ngược" : "Xuôi"})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Synthesized Output Box with Clean Vietnamese Typography */}
          <div className="w-full bg-[#15100b] rounded-3xl p-6 sm:p-10 border border-[#d4af37]/40 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative mb-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#3d3123]">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-display text-xl sm:text-2xl text-[#d4af37] font-bold">
                Thông Điệp Soi Sáng & Lời Khuyên Định Hướng
              </h3>
            </div>

            {streamedText ? (
              <div className="font-body">
                {renderFormattedAnalysis(streamedText)}
                {isTyping && <span className="ai-cursor" />}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-[#7a6e5d] space-y-3 font-body">
                <RefreshCw className="w-6 h-6 animate-spin text-[#d4af37]" />
                <p className="text-xs sm:text-sm">Đang kết nối trường năng lượng và phân tích chiêm nghiệm...</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center mb-8">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#8f5a1f] hover:bg-[#a06827] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 font-body"
            >
              <Bookmark className="w-4 h-4" />
              <span>{savedSuccess ? "Đã Lưu Lịch Sử ✓" : "Lưu Phiên Trải Bài"}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 bg-[#1c1611] border border-[#3d3123] hover:border-[#d4af37] text-[#f3ece1] text-xs font-semibold uppercase tracking-wider py-3.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 font-body"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedSuccess ? "Đã Sao Chép Link ✓" : "Chia Sẻ Kết Quả"}</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
              }
              setPhase("inquiry");
              setInquiry("");
              setSelectedCards([]);
              setStreamedText("");
              setDrawToken(null);
            }}
            className="text-xs text-[#d4af37] hover:underline flex items-center gap-1.5 cursor-pointer pb-8 font-body"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thực hiện một phiên trải bài mới</span>
          </button>
        </div>
      )}
    </div>
  );
};
