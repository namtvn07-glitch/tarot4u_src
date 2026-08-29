"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Coins, Check, QrCode, ShieldCheck, AlertCircle, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    return () => {
      previouslyFocused.current?.focus();
    };
  }, [active, containerRef]);
}

function useEscapeAndTabTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onEscape: () => void
) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef, onEscape]);
}

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (creditsToAdd: number) => void;
  currentCredits: number;
}

interface Pack {
  id: "small" | "popular" | "large";
  name: string;
  credits: number;
  priceFormatted: string;
  priceNumber: number;
  isPopular?: boolean;
  description: string;
}

const PACKAGES: Pack[] = [
  {
    id: "small",
    name: "Gói Nhỏ (Trải Nghiệm)",
    credits: 10,
    priceFormatted: "49.000 đ",
    priceNumber: 49000,
    description: "Phù hợp để làm quen với các trải bài 3 lá chuyên sâu.",
  },
  {
    id: "popular",
    name: "Gói Phổ Biến (Khai Phá)",
    credits: 30,
    priceFormatted: "129.000 đ",
    priceNumber: 129000,
    isPopular: true,
    description: "Tiết kiệm chi phí — Lựa chọn lý tưởng cho các câu hỏi chi tiết.",
  },
  {
    id: "large",
    name: "Gói Lớn (Minh Triết)",
    credits: 100,
    priceFormatted: "359.000 đ",
    priceNumber: 359000,
    description: "Tặng thêm nhiều Credits — Thấu suốt mọi ngã rẽ cuộc sống.",
  },
];

export const CreditTopUpModal: React.FC<CreditTopUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentCredits,
}) => {
  const [selectedPack, setSelectedPack] = useState<Pack>(PACKAGES[1]);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const mainModalRef = useRef<HTMLDivElement>(null);
  const qrModalRef = useRef<HTMLDivElement>(null);

  // Khi QR modal đang mở, nó là lớp trên cùng — bẫy focus/Esc ở đó; nếu
  // không thì bẫy ở modal chính. Chỉ một trong hai active tại một thời điểm.
  useFocusTrap(isOpen && !showQrModal, mainModalRef);
  useEscapeAndTabTrap(isOpen && !showQrModal, mainModalRef, onClose);
  useFocusTrap(isOpen && showQrModal, qrModalRef);
  useEscapeAndTabTrap(isOpen && showQrModal, qrModalRef, () => setShowQrModal(false));

  // Poll order status when QR modal is open
  useEffect(() => {
    if (!showQrModal || !currentOrderId || paymentDone) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders?orderId=${currentOrderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            setPaymentDone(true);
            clearInterval(interval);
            onSuccess(data.credits || selectedPack.credits);
            setTimeout(() => {
              setShowQrModal(false);
              onClose();
            }, 2500);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showQrModal, currentOrderId, paymentDone, selectedPack.credits, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleStartPayment = async () => {
    if (!agreedTerms) {
      setErrorMsg("Vui lòng đồng ý với Điều khoản và Chính sách hoàn tiền trước khi thanh toán.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");
    setPaymentDone(false);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setErrorMsg("Vui lòng đăng nhập tài khoản trước khi tạo đơn nạp Credits.");
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
        setShowQrModal(true);
      } else if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setErrorMsg("Phản hồi từ PayOS không hợp lệ.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi kết nối máy chủ PayOS.");
    } finally {
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
            <span>Nạp Credits Chuyên Sâu</span>
          </div>
          <h2
            id="credit-topup-title"
            className="font-display text-3xl sm:text-4xl font-bold text-[#f3ece1] tracking-tight"
          >
            Chọn Gói Credits Của Bạn
          </h2>
          <p className="text-xs sm:text-sm text-[#b3a48d] mt-1">
            Số dư hiện tại: <strong className="text-[#d4af37]">{currentCredits} Credits</strong> (Mỗi lần trải bài sâu tiêu hao 2 Credits).
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#f0605f]/15 border border-[#f0605f]/40 text-[#f0605f] text-xs flex items-start gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPack.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPack(pkg)}
                className={`relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col items-center text-center ${
                  isSelected
                    ? "bg-[#251d16] border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.3)] scale-[1.02]"
                    : "bg-[#1c1611]/70 border-[#3d3123] hover:border-[#d4af37]/50 hover:bg-[#251d16]/70"
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-[#d4af37] text-[#050505] text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                    Phổ Biến Nhất
                  </div>
                )}

                <div className="w-10 h-10 rounded-xl bg-[#050505] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mt-2 mb-3">
                  <Coins className="w-5 h-5" />
                </div>

                <h3 className="font-display text-lg font-bold text-[#f3ece1] mb-1">
                  {pkg.name}
                </h3>
                <div className="font-display text-2xl font-bold text-[#d4af37] mb-1">
                  +{pkg.credits} Credits
                </div>
                <div className="text-xs font-semibold text-[#b3a48d] mb-3">
                  {pkg.priceFormatted}
                </div>

                <p className="text-[11px] text-[#7a6e5d] mt-auto pt-3 border-t border-[#3d3123]/60 w-full leading-relaxed">
                  {pkg.description}
                </p>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#d4af37] text-[#050505] flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
                <QrCode className="w-4 h-4" />
                <span>Thanh toán VietQR PayOS ({selectedPack.priceFormatted})</span>
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
                  Đã cộng +{selectedPack.credits} Credits vào tài khoản của bạn.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl text-white font-bold mb-0.5">
                  {selectedPack.name}
                </h3>
                <p className="text-[#d4af37] font-semibold text-base mb-3">
                  Số tiền: {selectedPack.priceFormatted}
                </p>

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
