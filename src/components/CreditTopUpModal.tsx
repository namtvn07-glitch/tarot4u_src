"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Coins, Check, QrCode, ShieldCheck, AlertCircle, Loader2, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { DEEP_READING_CREDIT_COST, PACKS, TOP_UP_PACK_IDS, type PackId } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import { useEscapeAndTabTrap, useFocusTrap } from "@/lib/useModalA11y";
import { getErrorMessage } from "@/lib/errors";

const vndFormatter = new Intl.NumberFormat("vi-VN");
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (creditsToAdd: number) => void;
  currentCredits: number;
  /**
   * `"packs"` (mặc định) — bảng 3 gói nạp credits như cũ.
   * `"single"` — bán đúng MỘT lượt Đọc sâu cho khách chưa có tài khoản, ngay
   * tại cú bấm "Mở khoá". Là một variant chứ không phải component song song
   * (design-system.md: *variants over forks*): toàn bộ đường tiền bên dưới —
   * tạo đơn, QR, đếm ngược, poll trạng thái, hết hạn — phải giữ đúng một bản.
   * Nhân đôi nó là nhân đôi bề mặt nơi bug làm mất tiền thật.
   *
   * Gói lẻ CỐ Ý không xuất hiện ở chế độ "packs": nó là sản phẩm một lần cho
   * người chưa có tài khoản, và tính trên mỗi lượt thì đắt hơn mọi gói — chỗ
   * của nó là sheet mở khoá, cạnh lời mời đăng nhập để mua rẻ hơn.
   */
  mode?: "packs" | "single";
}

interface Pack {
  id: PackId;
  name: string;
  /** null với gói lẻ — số credits do server quyết (xem src/lib/orders.ts). */
  credits: number | null;
  priceFormatted: string;
  priceNumber: number;
  isPopular?: boolean;
  description: string;
}

// Credits + giá lấy từ PACKS (src/lib/orders.ts, nguồn NEXT_PUBLIC_PACK_*_AMOUNT_VND)
// — cùng một nguồn với giá server thật sự tính khi tạo đơn, để không lệch
// giữa số hiển thị và số tiền charge thật (từng lệch khi component này tự
// hardcode giá riêng).
const PACK_COPY: Record<(typeof TOP_UP_PACK_IDS)[number], { name: string; description: string; isPopular?: boolean }> = {
  small: {
    name: "Gói Nhỏ (Trải Nghiệm)",
    description: "Phù hợp để làm quen với các trải bài 3 lá chuyên sâu.",
  },
  popular: {
    name: "Gói Phổ Biến (Khai Phá)",
    description: "Tiết kiệm chi phí — Lựa chọn lý tưởng cho các câu hỏi chi tiết.",
    isPopular: true,
  },
  large: {
    name: "Gói Lớn (Minh Triết)",
    description: "Tặng thêm nhiều Credits — Thấu suốt mọi ngã rẽ cuộc sống.",
  },
};

// Danh sách gói dựng từ TOP_UP_PACK_IDS, không liệt kê tay — thêm `single` vào
// PACKS mà quên nó ở đây sẽ khiến gói lẻ lọt vào bảng giá nạp credits, nơi nó
// không thuộc về.
const PACKAGES: Pack[] = TOP_UP_PACK_IDS.map((id) => ({
  id,
  name: PACK_COPY[id].name,
  credits: PACKS[id].credits,
  priceFormatted: `${vndFormatter.format(PACKS[id].amountVnd)} đ`,
  priceNumber: PACKS[id].amountVnd,
  isPopular: PACK_COPY[id].isPopular,
  description: PACK_COPY[id].description,
}));

const SINGLE_PACK: Pack = {
  id: "single",
  name: PACKS.single.label,
  credits: PACKS.single.credits,
  priceFormatted: `${vndFormatter.format(PACKS.single.amountVnd)} đ`,
  priceNumber: PACKS.single.amountVnd,
  description: "Mở khoá đúng luận giải chuyên sâu bạn đang xem. Không cần tài khoản.",
};

export const CreditTopUpModal: React.FC<CreditTopUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentCredits,
  mode = "packs",
}) => {
  const isSingleMode = mode === "single";
  const [selectedPack, setSelectedPack] = useState<Pack>(
    isSingleMode ? SINGLE_PACK : PACKAGES[1],
  );
  // Số credits THẬT server đã cộng, đọc từ phản hồi đơn hàng. Với gói lẻ,
  // `selectedPack.credits` là null có chủ đích (server mới biết con số đúng),
  // nên màn hình thành công phải lấy từ đây chứ không từ hằng số phía client.
  const [paidCredits, setPaidCredits] = useState<number | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [totalMs, setTotalMs] = useState(1);
  const [qrExpired, setQrExpired] = useState(false);

  // Chốt ĐỒNG BỘ chống double-submit. `isProcessing` là state nên chỉ có hiệu
  // lực sau lần render kế tiếp — hai cú bấm trong cùng một tick vẫn lọt qua
  // `disabled={isProcessing}`. Ở chế độ gói lẻ hậu quả là mất tiền thật: mỗi
  // lần lọt gọi thêm một signInAnonymously(), tạo ra danh tính THỨ HAI, và đơn
  // hàng tạo dưới danh tính đầu trở thành mồ côi — khách quét QR trả tiền xong
  // thì credits vào một tài khoản mà phiên hiện tại không còn là nó nữa.
  const isStartingPaymentRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainModalRef = useRef<HTMLDivElement>(null);
  const qrModalRef = useRef<HTMLDivElement>(null);
  const expiredHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (qrExpired) expiredHeadingRef.current?.focus();
  }, [qrExpired]);

  // Khi QR modal đang mở, nó là lớp trên cùng — bẫy focus/Esc ở đó; nếu
  // không thì bẫy ở modal chính. Chỉ một trong hai active tại một thời điểm.
  useFocusTrap(isOpen && !showQrModal, mainModalRef);
  useEscapeAndTabTrap(isOpen && !showQrModal, mainModalRef, onClose);
  useFocusTrap(isOpen && showQrModal, qrModalRef);
  useEscapeAndTabTrap(isOpen && showQrModal, qrModalRef, () => setShowQrModal(false));

  // Đếm ngược tới expiresAt — tick riêng mỗi giây, độc lập với polling server
  // bên dưới, để UI báo hết hạn ngay theo đồng hồ máy, không phải đợi tới
  // lần poll kế tiếp.
  useEffect(() => {
    if (!showQrModal || !expiresAtMs || paymentDone || qrExpired) return;
    const tick = () => {
      const remaining = expiresAtMs - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) setQrExpired(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [showQrModal, expiresAtMs, paymentDone, qrExpired]);

  // Poll order status when QR modal is open
  useEffect(() => {
    if (!showQrModal || !currentOrderId || paymentDone || qrExpired) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders?orderId=${currentOrderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            const credited =
              typeof data.credits === "number" ? data.credits : (selectedPack.credits ?? 0);
            setPaidCredits(credited);
            setPaymentDone(true);
            onSuccess(credited);
            // Giữ id để cleanup huỷ được. Không giữ thì timer nay song song với
            // vòng đời component: người dùng tự đóng modal trong 2,5s đó xong
            // mở thứ khác, timer vẫn nổ và gọi onClose() của parent — đóng
            // nhầm thứ đang mở.
            closeTimerRef.current = setTimeout(() => {
              setShowQrModal(false);
              onClose();
            }, 2500);
          } else if (data.status === "expired") {
            setQrExpired(true);
          }
        }
      } catch {
        // ignore polling errors
      }
    };

    const interval = setInterval(checkStatus, 3000);

    // Mobile: trình duyệt tạm dừng timer + có thể mất kết nối khi tab bị ẩn
    // (user rời sang app ngân hàng để quét/xác nhận) — kiểm tra ngay khi
    // quay lại tab thay vì đợi tick tiếp theo.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkStatus();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [showQrModal, currentOrderId, paymentDone, qrExpired, selectedPack.credits, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleStartPayment = async () => {
    if (!agreedTerms) {
      setErrorMsg("Vui lòng đồng ý với Điều khoản và Chính sách hoàn tiền trước khi thanh toán.");
      return;
    }
    if (isStartingPaymentRef.current) return;
    isStartingPaymentRef.current = true;

    setIsProcessing(true);
    setErrorMsg("");
    setPaymentDone(false);
    setQrExpired(false);

    try {
      // Khách mua lẻ: đúc danh tính ẩn danh NGAY TRƯỚC khi tạo đơn, không sớm
      // hơn. Đây là lần đầu tiên có một hàng auth.users cho họ — gắn nó vào
      // đúng khoảnh khắc họ quyết định trả tiền nghĩa là ta không tạo rác danh
      // tính cho mỗi người chỉ ghé xem giá.
      //
      // KHÔNG truyền metadata affiliate ở đây. Trigger handle_new_user() sẽ
      // chạy cho hàng này; nếu nó nhận ref_click thì cùng một người bị tính
      // công affiliate hai lần (một lần ẩn danh, một lần nữa lúc nâng cấp) và
      // tỉ lệ chuyển đổi vượt 100%. Attribution gắn đúng một lần lúc nâng cấp,
      // qua /api/account/claim-affiliate.
      if (isSingleMode) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          const { error: anonError } = await supabase.auth.signInAnonymously();
          if (anonError) {
            setErrorMsg(
              "Không khởi tạo được phiên thanh toán. Vui lòng tải lại trang và thử lại.",
            );
            return;
          }
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // Ở chế độ gói lẻ nhánh này gần như không xảy ra nữa — phiên ẩn danh
          // vừa được tạo ngay phía trên. Nó còn lại cho đúng trường hợp việc
          // tạo phiên đó thất bại im lặng, nên câu chữ không được bảo khách
          // "hãy đăng nhập" khi cả luồng này sinh ra để họ không phải đăng nhập.
          setErrorMsg(
            isSingleMode
              ? "Phiên thanh toán đã hết hiệu lực. Vui lòng tải lại trang và thử lại."
              : "Vui lòng đăng nhập tài khoản trước khi tạo đơn nạp Credits.",
          );
        } else if (res.status === 403 && data.error === "account_required_for_pack") {
          setErrorMsg("Gói này cần một tài khoản thật. Hãy lưu tài khoản trước khi mua.");
        } else if (res.status === 429) {
          setErrorMsg("Bạn đã tạo quá nhiều đơn trong 1 giờ. Vui lòng chờ ít phút.");
        } else {
          setErrorMsg(data.error || "Không thể tạo đơn thanh toán PayOS. Vui lòng kiểm tra lại cấu hình cổng thanh toán.");
        }
        return;
      }

      if (data?.qrCode) {
        setQrCodeUrl(data.qrCode);
        setCheckoutUrl(data.checkoutUrl || "");
        setCurrentOrderId(data.orderId);
        setOrderCode(data.orderCode);
        const expiresMs = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now();
        setExpiresAtMs(expiresMs);
        setTotalMs(Math.max(1, expiresMs - Date.now()));
        setShowQrModal(true);
      } else if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setErrorMsg("Phản hồi từ PayOS không hợp lệ.");
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Lỗi kết nối máy chủ PayOS."));
    } finally {
      isStartingPaymentRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={mainModalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-topup-title"
        className="relative w-full max-w-3xl bg-[#15100b] border border-[#d4af37]/45 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] my-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-5 right-5 p-2 rounded-full bg-[#251d16] text-[#b3a48d] hover:text-[#d4af37] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-wider mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>{isSingleMode ? "Mở Khoá Luận Giải" : "Nạp Credits Chuyên Sâu"}</span>
          </div>
          <h2
            id="credit-topup-title"
            className="font-display text-3xl sm:text-4xl font-bold text-[#f3ece1] tracking-tight"
          >
            {isSingleMode ? "Mở khoá luận giải này" : "Chọn Gói Credits Của Bạn"}
          </h2>
          {/* Copy của gói lẻ hướng về ĐÚNG lượt đọc đang mở dở, không phải về
              số dư credits — khách chưa có tài khoản không có khái niệm "số dư",
              và nói với họ về nó là bắt họ học một mô hình họ không cần. */}
          <p className="text-xs sm:text-sm text-[#b3a48d] mt-1">
            {isSingleMode ? (
              "Trả đúng một lần cho luận giải chuyên sâu bạn vừa rút. Không cần đăng ký tài khoản."
            ) : (
              <>
                Số dư hiện tại: <strong className="text-[#d4af37]">{currentCredits} Credits</strong> (Mỗi lần trải bài sâu tiêu hao {DEEP_READING_CREDIT_COST} Credits).
              </>
            )}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#f0605f]/15 border border-[#f0605f]/40 text-[#f0605f] text-xs flex items-start gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSingleMode ? (
          /* Gói lẻ: không có gì để chọn, nên không dựng bộ chọn. Một thẻ tóm
             tắt đúng thứ đang mua — và CỐ Ý không in số credits: khách mua
             "một lượt Đọc sâu", credits là đơn vị nội bộ của hệ thống, nói ra
             chỉ bắt họ quy đổi trong đầu. */
          <div className="max-w-md mx-auto mb-8 rounded-2xl border border-[#d4af37] bg-[#251d16] p-5 text-center shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#050505] text-[#d4af37]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-display mb-1 text-lg font-bold text-[#f3ece1]">
              {SINGLE_PACK.name}
            </h3>
            <div className="font-display mb-1 text-3xl font-bold text-[#d4af37]">
              {SINGLE_PACK.priceFormatted}
            </div>
            <p className="mt-3 w-full border-t border-[#3d3123]/60 pt-3 text-[11px] leading-relaxed text-[#b3a48d]">
              {SINGLE_PACK.description}
            </p>
          </div>
        ) : (
          /* Bộ chọn gói là radio THẬT, không phải div có onClick: div không tới
             được bằng Tab, không báo trạng thái đã chọn cho trình đọc màn hình,
             và không có điều hướng bằng phím mũi tên. Input ẩn về mặt thị giác
             nhưng vẫn nằm trong cây a11y và vẫn nhận focus — vòng focus hiện
             trên chính thẻ nhờ peer-focus-visible. */
          <fieldset className="mb-8 border-0 p-0">
            <legend className="sr-only">Chọn gói Credits</legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPack.id === pkg.id;
                return (
                  <label
                    key={pkg.id}
                    className="relative flex cursor-pointer flex-col items-center text-center"
                  >
                    <input
                      type="radio"
                      name="credit-pack"
                      value={pkg.id}
                      checked={isSelected}
                      onChange={() => setSelectedPack(pkg)}
                      className="peer sr-only"
                    />
                    <div
                      className={`relative flex w-full flex-1 flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[#d4af37] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#15100b] ${
                        isSelected
                          ? "scale-[1.02] border-[#d4af37] bg-[#251d16] shadow-[0_0_25px_rgba(212,175,55,0.3)]"
                          : "border-[#3d3123] bg-[#1c1611]/70 hover:border-[#d4af37]/50 hover:bg-[#251d16]/70"
                      }`}
                    >
                      {pkg.isPopular && (
                        <div className="absolute -top-3 rounded-full bg-[#d4af37] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#050505] shadow-md">
                          Phổ Biến Nhất
                        </div>
                      )}

                      <div className="mb-3 mt-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#050505] text-[#d4af37]">
                        <Coins className="h-5 w-5" aria-hidden="true" />
                      </div>

                      <h3 className="font-display mb-1 text-lg font-bold text-[#f3ece1]">
                        {pkg.name}
                      </h3>
                      <div className="font-display mb-1 text-2xl font-bold text-[#d4af37]">
                        +{pkg.credits} Credits
                      </div>
                      <div className="mb-3 text-xs font-semibold text-[#b3a48d]">
                        {pkg.priceFormatted}
                      </div>

                      <p className="mt-auto w-full border-t border-[#3d3123]/60 pt-3 text-[11px] leading-relaxed text-[#7a6e5d]">
                        {pkg.description}
                      </p>

                      {/* Dấu tích là tín hiệu THỨ HAI cạnh viền vàng — trạng
                          thái "đang chọn" không được chỉ dựa vào màu. */}
                      {isSelected && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-xs text-[#050505]">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Action Panel */}
        <div className="max-w-md mx-auto bg-[#1c1611] border border-[#3d3123] p-5 rounded-2xl flex flex-col items-center">
          <label className="flex items-start gap-2.5 mb-4 cursor-pointer select-none w-full">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 accent-[#d4af37] cursor-pointer"
            />
            <span className="text-[11px] text-[#b3a48d] leading-relaxed">
              Tôi đồng ý với{" "}
              <a href="/dieu-khoan" target="_blank" className="text-[#d4af37] underline">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="/chinh-sach-hoan-tien" target="_blank" className="text-[#d4af37] underline">
                Chính sách hoàn tiền
              </a>.
            </span>
          </label>

          <button
            onClick={handleStartPayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] font-semibold py-3 px-6 rounded-xl uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(143,90,31,0.4)] cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang khởi tạo đơn hàng PayOS...
              </span>
            ) : (
              <>
                <QrCode className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isSingleMode ? "Mở khoá ngay" : "Thanh toán VietQR PayOS"} (
                  {selectedPack.priceFormatted})
                </span>
              </>
            )}
          </button>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#7a6e5d]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Xác thực tự động qua VietQR / Napas247 / PayOS</span>
          </div>
        </div>
      </div>

      {/* PayOS Real QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div
            ref={qrModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            className="relative w-full max-w-sm bg-[#15100b] border border-[#d4af37]/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.3)] text-center animate-in zoom-in-95"
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#3d3123] mb-4">
              <div
                id="qr-modal-title"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4af37]"
              >
                <QrCode className="w-4 h-4" />
                <span>Mã QR Thanh Toán PayOS</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                aria-label="Đóng"
                className="text-[#7a6e5d] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentDone ? (
              <div
                role="status"
                aria-live="polite"
                className="py-8 flex flex-col items-center gap-3 animate-in zoom-in"
              >
                <div className="w-16 h-16 rounded-full bg-[#5fbf8c]/20 border-2 border-[#5fbf8c] text-[#5fbf8c] flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl text-white font-bold">
                  Thanh Toán Thành Công!
                </h3>
                <p className="text-xs text-[#5fbf8c]">
                  {isSingleMode
                    ? "Luận giải chuyên sâu của bạn đang được mở khoá…"
                    : `Đã cộng +${paidCredits ?? selectedPack.credits ?? 0} Credits vào tài khoản của bạn.`}
                </p>
              </div>
            ) : qrExpired ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-[#f0605f]/15 border-2 border-[#f0605f] text-[#f0605f] flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3
                  ref={expiredHeadingRef}
                  tabIndex={-1}
                  className="font-display text-xl text-white font-bold focus:outline-none"
                >
                  Mã QR đã hết hạn
                </h3>
                <p className="text-xs text-[#b3a48d]">
                  Đơn hàng #{orderCode} đã quá thời gian thanh toán. Tạo mã mới để tiếp tục.
                </p>
                <button
                  onClick={handleStartPayment}
                  disabled={isProcessing}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? "Đang tạo mã mới…" : "Tạo mã mới"}
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="py-2 text-xs text-[#7a6e5d] hover:text-white cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl text-white font-bold mb-0.5">
                  {selectedPack.name}
                </h3>
                <p className="text-[#d4af37] font-semibold text-base mb-2">
                  Số tiền: {selectedPack.priceFormatted}
                </p>

                {/* Đếm ngược hết hạn — vòng tròn tiến trình theo expiresAt server
                    trả về, không hardcode thời lượng (server đổi hạn mức, UI vẫn
                    đúng tự động). */}
                <div
                  role="timer"
                  aria-live="off"
                  aria-label="Thời gian còn lại để thanh toán"
                  className="relative mx-auto mb-3"
                  style={{ width: 60, height: 60 }}
                >
                  <svg viewBox="0 0 60 60" width="60" height="60">
                    <circle cx="30" cy="30" r={RING_RADIUS} fill="none" strokeWidth="4" stroke="#3d3123" />
                    <circle
                      cx="30"
                      cy="30"
                      r={RING_RADIUS}
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="#d4af37"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={
                        RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, remainingMs / totalMs)))
                      }
                      style={{ transform: "rotate(-90deg)", transformOrigin: "30px 30px" }}
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#f3ece1]"
                    aria-hidden="true"
                  >
                    {formatCountdown(remainingMs)}
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="w-60 h-60 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-2 border-[#d4af37]/40 mb-3">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="VietQR PayOS"
                      className="w-full h-full object-contain block"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-black text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-[#8f5a1f]" />
                      <span>Đang tạo mã QR...</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#b3a48d] mb-4 leading-relaxed bg-[#1c1611] p-3 rounded-xl border border-[#3d3123]">
                  <p>Mở ứng dụng Ngân hàng quét mã VietQR tự động điền số tiền và nội dung.</p>
                  {orderCode && (
                    <p className="mt-1 text-[#7a6e5d] font-mono text-[10px]">
                      Mã đơn hàng: #{orderCode}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {checkoutUrl && (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Mở Trang Thanh Toán PayOS</span>
                    </a>
                  )}
                  <button
                    onClick={() => setShowQrModal(false)}
                    className="py-2 text-xs text-[#7a6e5d] hover:text-white cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
