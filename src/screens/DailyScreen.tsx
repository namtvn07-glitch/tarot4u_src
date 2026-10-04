"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Coins, Compass, RefreshCw, Share2, Sparkles } from "lucide-react";
import { DailyResultView } from "@/components/daily/DailyResultView";
import { CARD_BACK_IMAGE } from "@/data/tarotCards";
import type { DailyDraw, DailyDrawResponse, DailyErrorCode, DailyState } from "@/lib/daily-types";
import { vietnamToday } from "@/lib/daily-day";
import { DAILY_MAX_DRAWS_PER_DAY, DAILY_PAID_COST_CREDITS } from "@/lib/spreads";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { AppScreen } from "@/types/tarot";

interface DailyScreenProps {
  // false khi còn đang hỏi Supabase xem đang là ai — chưa gọi API trước đó, để
  // không hiện "chưa rút" cho người thật ra đã rút rồi.
  isAuthReady: boolean;
  userId: string | null;
  isAnonymous: boolean;
  credits: number;
  onNavigate: (screen: AppScreen) => void;
  // Mở luồng nạp credits cho tài khoản thật hết credits.
  onOpenTopUp: () => void;
  // Số dư tuyệt đối do server trả về sau mỗi lượt — không tự cộng trừ ở client.
  onCreditsSync: (credits: number) => void;
}

type Phase = "loading" | "intro" | "picking" | "drawing" | "result";

const FAN_CARDS = 15;

const ERROR_MESSAGES: Partial<Record<DailyErrorCode, string>> = {
  unauthorized: "Không mở được phiên làm việc. Hãy tải lại trang rồi thử lại.",
  rate_limited: "Bạn thao tác hơi nhanh. Chờ một chút rồi thử lại nhé.",
  already_processing: "Lượt rút này đang được xử lý — chờ vài giây rồi thử lại.",
  daily_content_unavailable: "Thông điệp hôm nay đang được chuẩn bị. Bạn quay lại sau ít phút nhé.",
};

// Khách chưa có phiên: trạng thái luôn là "chưa rút, còn lượt miễn phí" — không cần
// hỏi server (mỗi lượt hỏi là một request vô ích cho phần lớn lượng truy cập).
function guestState(): DailyState {
  return {
    authenticated: false,
    isAnonymous: false,
    day: vietnamToday(),
    maxDraws: DAILY_MAX_DRAWS_PER_DAY,
    costCredits: DAILY_PAID_COST_CREDITS,
    drawsToday: 0,
    freeAvailable: true,
    creditsRemaining: null,
    today: null,
  };
}

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export const DailyScreen: React.FC<DailyScreenProps> = ({
  isAuthReady,
  userId,
  isAnonymous,
  credits,
  onNavigate,
  onOpenTopUp,
  onCreditsSync,
}) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [state, setState] = useState<DailyState | null>(null);
  const [draw, setDraw] = useState<DailyDraw | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  // Khoá idempotency của MỘT ý định rút bài: giữ nguyên khi thử lại sau lỗi mạng
  // (server trả đúng kết quả cũ, không trừ tiền hai lần), đổi mới khi bắt đầu
  // một lượt rút khác.
  const drawIdRef = useRef<string | null>(null);
  // Chốt đồng bộ chống bấm đúp — state chỉ có hiệu lực từ lần render sau, mà ở
  // lượt trả phí hai cú bấm trong cùng một tick là hai lần trừ tiền (mẫu giống
  // isUnlockingRef ở DeepReadScreen).
  const isDrawingRef = useRef(false);
  // Số thứ tự của lần tải trạng thái mới nhất. Mở phiên ẩn danh ngay trước lần
  // rút đầu làm đổi `userId` và kéo theo một lần tải lại; phản hồi của nó có thể về
  // SAU khi lượt rút đã xong và sẽ ghi đè kết quả bằng màn hình "chưa rút". Mỗi
  // lượt rút (và mỗi lần tải mới) tăng số này để vô hiệu các phản hồi cũ.
  const stateSeqRef = useRef(0);
  // `onCreditsSync` của trang cha là hàm tạo mới mỗi lần render. Đưa nó thẳng vào
  // deps của loadState → effect tải trạng thái chạy lại sau MỖI lần render, mà
  // chính việc đồng bộ credits lại làm trang cha render → vòng lặp tải vô hạn.
  // Giữ qua ref để loadState ổn định.
  const onCreditsSyncRef = useRef(onCreditsSync);
  useEffect(() => {
    onCreditsSyncRef.current = onCreditsSync;
  }, [onCreditsSync]);

  const loadState = useCallback(async () => {
    const seq = ++stateSeqRef.current;
    try {
      const response = await fetch("/api/reading/daily", { cache: "no-store" });
      if (!response.ok) throw new Error("daily_state_failed");
      const next = (await response.json()) as DailyState;
      if (seq !== stateSeqRef.current || isDrawingRef.current) return;
      setState(next);
      if (next.creditsRemaining !== null) onCreditsSyncRef.current(next.creditsRemaining);
      if (next.today) {
        setDraw(next.today);
        setIsFlipped(true);
        setPhase("result");
      } else {
        setDraw(null);
        setPhase("intro");
      }
      setErrorMessage("");
    } catch (error) {
      if (seq !== stateSeqRef.current || isDrawingRef.current) return;
      setErrorMessage(getErrorMessage(error, "Không tải được thông điệp hôm nay. Vui lòng thử lại."));
      setPhase("intro");
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!userId) {
      // Vô hiệu mọi lần tải đang bay (vừa đăng xuất, v.v.) rồi dùng trạng thái khách.
      stateSeqRef.current++;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(guestState());
      setDraw(null);
      setPhase("intro");
      return;
    }
    // Tải dữ liệu từ server khi biết danh tính (và tải lại khi đổi người): gọi
    // fetch trong effect là chỗ đúng, không phải dẫn xuất state từ props.
    void loadState();
  }, [isAuthReady, userId, loadState]);

  const isNextDrawFree = state?.freeAvailable ?? true;
  const drawsToday = state?.drawsToday ?? 0;
  const maxDraws = state?.maxDraws ?? 5;
  const cost = state?.costCredits ?? 1;
  const hasReachedLimit = drawsToday >= maxDraws;

  // Chặn TRƯỚC khi cho chọn lá: để người dùng chọn xong rồi mới báo "cần credits"
  // là làm họ mất một nhịp tương tác vô ích.
  const beginDraw = () => {
    setErrorMessage("");
    if (!isNextDrawFree) {
      if (isAnonymous) {
        // Phiên khách không mua được credits lẻ cho việc này (gói `single` chỉ mở
        // Đọc sâu) — cần tài khoản thật.
        setErrorMessage(
          "Bạn đã dùng lượt miễn phí hôm nay. Tạo tài khoản để rút thêm bằng credits.",
        );
        return;
      }
      if (credits < cost) {
        setErrorMessage(`Bạn cần ${cost} credit để rút thêm một lá.`);
        onOpenTopUp();
        return;
      }
    }
    drawIdRef.current = crypto.randomUUID();
    setPickedIndex(null);
    setPhase("picking");
  };

  const handlePick = async (index: number) => {
    if (isDrawingRef.current || !drawIdRef.current) return;
    isDrawingRef.current = true;
    stateSeqRef.current++;
    setPickedIndex(index);
    setPhase("drawing");
    setErrorMessage("");

    try {
      // Khách chưa có phiên: mở phiên ẩn danh ngay ở cú chạm đầu — họ không phải
      // đăng ký để xem thông điệp miễn phí hôm nay.
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          setErrorMessage("Không khởi tạo được phiên. Vui lòng tải lại trang và thử lại.");
          setPhase("picking");
          return;
        }
      }

      const response = await fetch("/api/reading/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: drawIdRef.current }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const code = body?.error as DailyErrorCode | undefined;
        if (code === "insufficient_credits") {
          setErrorMessage(`Bạn cần ${cost} credit để rút thêm một lá.`);
          setPhase(draw ? "result" : "intro");
          if (isAnonymous) return;
          onOpenTopUp();
          return;
        }
        if (code === "daily_limit_reached") {
          setErrorMessage(`Bạn đã rút đủ ${maxDraws} lá hôm nay. Mai quay lại nhé.`);
          setPhase(draw ? "result" : "intro");
          void loadState();
          return;
        }
        setErrorMessage(
          (code && ERROR_MESSAGES[code]) || "Không rút được lá lúc này. Vui lòng thử lại.",
        );
        // Lỗi tạm thời: về lại bộ bài, giữ nguyên drawId để thử lại an toàn.
        setPhase("picking");
        return;
      }

      const result = body as DailyDrawResponse;
      const { creditsRemaining, ...nextDraw } = result;
      setDraw(nextDraw);
      setState((prev) =>
        prev
          ? {
              ...prev,
              authenticated: true,
              drawsToday: prev.drawsToday + 1,
              freeAvailable: nextDraw.kind === "free" ? false : prev.freeAvailable,
              creditsRemaining,
              today: nextDraw,
            }
          : prev,
      );
      if (creditsRemaining !== null) onCreditsSyncRef.current(creditsRemaining);
      drawIdRef.current = null;
      setIsFlipped(reduceMotion);
      setPhase("result");
      if (!reduceMotion) setTimeout(() => setIsFlipped(true), 450);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Lỗi kết nối. Vui lòng thử lại."));
      setPhase("picking");
    } finally {
      isDrawingRef.current = false;
      // Cả lần tải trạng thái BẮT ĐẦU trong lúc đang rút (do đổi userId) cũng phải bị
      // vô hiệu, nếu không phản hồi cũ của nó ghi đè kết quả vừa có.
      stateSeqRef.current++;
    }
  };

  const handleShare = async () => {
    if (!draw || typeof navigator === "undefined" || !navigator.clipboard) return;
    const { card, content } = draw;
    const text = [
      `[Xem Bài Tarot] Thông điệp hôm nay — ${card.nameVi}${card.orientation === "reversed" ? " (ngược)" : ""}`,
      content.headline,
      `"${content.memorable_message}"`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMessage("Không sao chép được. Bạn hãy thử lại hoặc chụp màn hình nhé.");
    }
  };

  const isReversed = draw?.card.orientation === "reversed";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-10 sm:px-8">
      <header className="mb-8 w-full border-b border-[#3d3123]/70 pb-6 text-center">
        <span className="mb-2 inline-block rounded-full border border-[#d4af37]/40 bg-[#8f5a1f]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
          Daily Tarot
        </span>
        <h1 className="font-display text-2xl font-bold text-[#f3ece1] sm:text-4xl">
          Thông Điệp Vũ Trụ Hôm Nay
        </h1>
        <p className="mt-2 text-xs text-[#b3a48d] sm:text-sm">
          {state ? formatDay(state.day) : "Hôm nay Tarot muốn nói gì với bạn?"}
        </p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex w-full max-w-2xl items-start gap-2 rounded-2xl border border-[#f0605f]/40 bg-[#f0605f]/15 p-4 text-xs text-[#f0605f]"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-2">
            <p className="leading-relaxed">{errorMessage}</p>
            {isAnonymous && !isNextDrawFree && (
              <a
                href="/luu-tai-khoan"
                className="self-start rounded-lg bg-[#8f5a1f] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white no-underline hover:bg-[#d4af37] hover:text-[#050505]"
              >
                Tạo tài khoản
              </a>
            )}
          </div>
        </div>
      )}

      {phase === "loading" && (
        <div role="status" className="flex flex-col items-center gap-3 py-16 text-[#7a6e5d]">
          <RefreshCw aria-hidden="true" className="h-6 w-6 animate-spin text-[#d4af37] motion-reduce:animate-none" />
          <p className="text-sm">Đang mở bộ bài…</p>
        </div>
      )}

      {phase === "intro" && (
        <div className="flex max-w-xl flex-col items-center py-8 text-center">
          <div className="relative mb-8 aspect-[2/3] w-44 overflow-hidden rounded-2xl border-2 border-[#d4af37]/60 bg-[#050505] shadow-[0_0_35px_rgba(212,175,55,0.35)]">
            <img src={CARD_BACK_IMAGE} alt="" className="h-full w-full object-cover" />
            <div className="card-shimmer" />
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold text-white sm:text-3xl">
            Hôm nay Tarot muốn nói gì với bạn?
          </h2>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-[#b3a48d]">
            Không cần câu hỏi nào cả. Hít một hơi, rồi chọn lá bài bạn thấy gần mình nhất.
          </p>
          <button
            type="button"
            onClick={beginDraw}
            disabled={hasReachedLimit}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(143,90,31,0.4)] transition-all hover:from-[#d4af37] hover:to-[#8f5a1f] hover:text-[#050505] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            <span>{isNextDrawFree ? "Rút lá hôm nay — miễn phí" : `Rút thêm một lá — ${cost} credit`}</span>
          </button>
        </div>
      )}

      {(phase === "picking" || phase === "drawing") && (
        <section aria-labelledby="daily-picking-heading" className="flex w-full flex-col items-center py-4">
          <div className="mb-6 text-center">
            <h2 id="daily-picking-heading" className="font-display text-xl text-white sm:text-2xl">
              Chọn một lá bài
            </h2>
            <p className="mt-1.5 text-xs text-[#b3a48d]" aria-live="polite">
              {phase === "drawing"
                ? "Đang giáng lâm…"
                : isNextDrawFree
                  ? "Lượt này miễn phí."
                  : `Lượt này sẽ trừ ${cost} credit.`}
            </p>
          </div>

          <div
            role="group"
            aria-label="Bộ bài úp, chọn một lá"
            className="relative my-4 flex h-64 w-full max-w-3xl items-center justify-center overflow-visible sm:h-80"
          >
            {Array.from({ length: FAN_CARDS }).map((_, i) => {
              const angle = (i - (FAN_CARDS - 1) / 2) * 4.5;
              const normalizedX = (i - (FAN_CARDS - 1) / 2) / ((FAN_CARDS - 1) / 2);
              const yOffset = Math.abs(normalizedX * normalizedX) * 35;
              const isPicked = pickedIndex === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Lá bài số ${i + 1}`}
                  disabled={phase === "drawing"}
                  onClick={() => handlePick(i)}
                  className={`group absolute aspect-[2/3] w-24 cursor-pointer rounded-xl border bg-[#15100b] shadow-2xl transition-all duration-300 focus-visible:z-50 focus-visible:-translate-y-8 focus-visible:border-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] disabled:cursor-wait motion-reduce:transition-none sm:w-32 ${
                    isPicked
                      ? "z-50 -translate-y-10 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.7)]"
                      : "border-[#3d3123] hover:z-50 hover:-translate-y-8 hover:scale-110 hover:border-[#d4af37] hover:shadow-[0_0_35px_rgba(212,175,55,0.7)]"
                  }`}
                  style={{
                    transform: isPicked ? undefined : `rotate(${angle}deg) translateY(${yOffset}px)`,
                    transformOrigin: "bottom center",
                    zIndex: isPicked ? 50 : i,
                    backgroundImage: `url(${CARD_BACK_IMAGE})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="card-shimmer" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {phase === "result" && draw && (
        <section aria-label="Thông điệp hôm nay của bạn" className="flex w-full flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="perspective-1000 relative aspect-[2/3] w-52 sm:w-60">
              <div
                className="preserve-3d relative h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", transformStyle: "preserve-3d" }}
              >
                <div
                  className="backface-hidden absolute inset-0 overflow-hidden rounded-2xl border-2 border-[#3d3123] bg-[#15100b] shadow-2xl"
                  style={{ backgroundImage: `url(${CARD_BACK_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
                <div className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-2xl border-2 border-[#d4af37] bg-[#15100b] shadow-[0_0_40px_rgba(212,175,55,0.45)]">
                  <img
                    src={draw.card.image}
                    alt={`${draw.card.nameVi} (${draw.card.nameEn}), ${isReversed ? "ngược" : "xuôi"}`}
                    className={`h-full w-full object-cover ${isReversed ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="font-display text-xl font-bold text-white">{draw.card.nameVi}</p>
              <p className="text-xs italic text-[#7a6e5d]">
                {draw.card.nameEn} · {isReversed ? "Chiều ngược" : "Chiều xuôi"}
              </p>
            </div>
          </div>

          {isFlipped && <DailyResultView content={draw.content} />}

          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#3d3123] bg-[#1c1611] px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#f3ece1] transition-all hover:border-[#d4af37] active:scale-95 motion-reduce:transition-none"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
              <span aria-live="polite">{copied ? "Đã sao chép ✓" : "Chia sẻ"}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("deep-read")}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#8f5a1f] px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#a06827] active:scale-95 motion-reduce:transition-none"
            >
              <Compass aria-hidden="true" className="h-4 w-4" />
              <span>Hỏi sâu một vấn đề</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 pb-8 text-center">
            {hasReachedLimit ? (
              <p className="text-xs text-[#7a6e5d]">
                Bạn đã rút đủ {maxDraws} lá hôm nay. Mai quay lại nhé.
              </p>
            ) : (
              <button
                type="button"
                onClick={beginDraw}
                className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#b3a48d] transition-colors hover:text-[#d4af37] motion-reduce:transition-none"
              >
                <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Rút thêm một lá</span>
                {!isNextDrawFree && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#d4af37]/30 bg-black/40 px-2 py-0.5 text-[#d4af37]">
                    <Coins aria-hidden="true" className="h-3 w-3" />
                    {cost} credit
                  </span>
                )}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
