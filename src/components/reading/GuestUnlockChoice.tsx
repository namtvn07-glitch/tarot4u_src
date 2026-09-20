"use client";

import React, { useRef } from "react";
import { X, Sparkles, UserPlus, Check, TrendingDown } from "lucide-react";
import { DEEP_READING_CREDIT_COST, PACKS, TOP_UP_PACK_IDS } from "@/lib/orders";
import { useEscapeAndTabTrap, useFocusTrap } from "@/lib/useModalA11y";

const vndFormatter = new Intl.NumberFormat("vi-VN");

function formatVnd(amount: number): string {
  return `${vndFormatter.format(Math.round(amount))}đ`;
}

// Giá mỗi LƯỢT của từng gói, tính từ PACKS chứ không viết tay — đổi giá trên
// Vercel là mọi con số ở đây tự đúng theo, không ai phải nhớ sửa marketing copy.
const PACK_UNIT_PRICES = TOP_UP_PACK_IDS.map((id) => {
  const pack = PACKS[id];
  // Làm TRÒN XUỐNG: số credits mỗi gói là hằng số trong code, còn chi phí một
  // lượt đến từ env — hai số đó không buộc phải chia hết cho nhau. Gói 10
  // credits với giá 4 credits/lượt mua được 2 lượt và thừa 2 credits, không
  // phải "2.5 lượt". Quảng cáo phần lẻ đó là hứa một thứ không mua được, và
  // giá mỗi lượt cũng phải tính trên số lượt dùng được thật.
  const readings = Math.floor(pack.credits / DEEP_READING_CREDIT_COST);
  return {
    id,
    label: pack.label,
    readings,
    pricePerReading: readings > 0 ? pack.amountVnd / readings : Number.POSITIVE_INFINITY,
  };
}).filter((p) => p.readings > 0);

const SINGLE_PRICE = PACKS.single.amountVnd;

// CHỈ quảng cáo những gói thật sự rẻ hơn mua lẻ.
//
// Giá gói, giá lẻ và chi phí mỗi lượt là ba biến env độc lập — không có gì bảo
// đảm gói luôn rẻ hơn. Với một tổ hợp cấu hình nhất định (vd. chi phí mỗi lượt
// tăng khiến gói nhỏ chỉ còn mua được 2 lượt) gói nhỏ có thể ĐẮT HƠN mua lẻ.
// Liệt kê nó dưới nhãn "Tiết kiệm" khi đó là một lời quảng cáo sai, dù mọi con
// số đều đang tính đúng.
const CHEAPER_PACKS = PACK_UNIT_PRICES.filter((p) => p.pricePerReading < SINGLE_PRICE);
const HAS_SAVINGS = CHEAPER_PACKS.length > 0;

const CHEAPEST = HAS_SAVINGS
  ? CHEAPER_PACKS.reduce((a, b) => (a.pricePerReading <= b.pricePerReading ? a : b))
  : null;
const ENTRY_PACK = HAS_SAVINGS
  ? CHEAPER_PACKS.reduce((a, b) => (a.pricePerReading >= b.pricePerReading ? a : b))
  : null;

const MAX_SAVING_PERCENT = CHEAPEST
  ? Math.round((1 - CHEAPEST.pricePerReading / SINGLE_PRICE) * 100)
  : 0;

interface GuestUnlockChoiceProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mua lẻ ngay, không cần tài khoản. */
  onChooseDirect: () => void;
  /** Đăng nhập / tạo tài khoản rồi mua gói. */
  onChooseLogin: () => void;
}

/**
 * Ngã ba của khách sau khi đã lật đủ 3 lá.
 *
 * Vì sao tách khỏi `CreditTopUpModal`: đây thuần tuý là một lựa chọn, không
 * chạm gì tới tiền. Nhét nó vào trong modal thanh toán là trộn một màn hình
 * marketing vào đúng component mà mọi bug đều là bug mất tiền thật.
 *
 * Vì sao chỉ xuất hiện ở đây, không phải trên Header: trước khi thấy 3 lá của
 * mình, khách không có gì để mở khoá — một lời mời trả tiền lúc đó là quảng cáo
 * chen ngang, và đó chính là cái rào mà cả tính năng này sinh ra để dỡ bỏ.
 *
 * Thứ tự và trọng số: mua lẻ đứng trước vì nó là thứ khách đang muốn ngay lúc
 * này, nhưng gói được gắn nhãn tiết kiệm với CON SỐ THẬT — giấu đi việc mua gói
 * rẻ hơn đáng kể là bán cho người ta lựa chọn đắt hơn mà không nói.
 */
export const GuestUnlockChoice: React.FC<GuestUnlockChoiceProps> = ({
  isOpen,
  onClose,
  onChooseDirect,
  onChooseLogin,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, dialogRef);
  useEscapeAndTabTrap(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-xl sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-unlock-title"
        className="relative my-8 w-full max-w-lg rounded-3xl border border-[#d4af37]/45 bg-[#15100b] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 cursor-pointer rounded-full bg-[#251d16] p-2 text-[#b3a48d] transition-colors hover:text-[#d4af37]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#8f5a1f]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>3 lá của bạn đã sẵn sàng</span>
          </div>
          <h2
            id="guest-unlock-title"
            className="font-display text-2xl font-bold tracking-tight text-[#f3ece1] sm:text-3xl"
          >
            Mở khoá luận giải chuyên sâu
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#b3a48d] sm:text-sm">
            Chọn cách bạn muốn tiếp tục. Bộ 3 lá vừa rút vẫn được giữ nguyên trong
            cả hai trường hợp.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Lựa chọn 1 — xem ngay, không cần tài khoản */}
          <button
            type="button"
            onClick={onChooseDirect}
            className="group cursor-pointer rounded-2xl border border-[#3d3123] bg-[#1c1611] p-5 text-left transition-all hover:border-[#d4af37]/60 hover:bg-[#251d16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15100b]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display mb-1 text-base font-bold text-[#f3ece1]">
                  Xem trực tiếp
                </h3>
                <p className="text-[11px] leading-relaxed text-[#b3a48d]">
                  Thanh toán một lần cho đúng luận giải này. Không cần đăng ký,
                  không để lại email.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-xl font-bold text-[#d4af37]">
                  {formatVnd(SINGLE_PRICE)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#b3a48d]">
                  1 lượt
                </div>
              </div>
            </div>
          </button>

          {/* Lựa chọn 2 — đăng nhập, mua gói rẻ hơn */}
          <button
            type="button"
            onClick={onChooseLogin}
            className="group relative cursor-pointer rounded-2xl border border-[#d4af37]/60 bg-[#251d16] p-5 text-left transition-all hover:border-[#d4af37] hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15100b]"
          >
            {/* Nhãn tiết kiệm dùng icon + chữ, không chỉ dựa vào màu. */}
            {HAS_SAVINGS && (
              <div className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-[#d4af37] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#050505] shadow-md">
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
                <span>Tiết kiệm tới {MAX_SAVING_PERCENT}%</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <h3 className="font-display mb-1 flex items-center gap-1.5 text-base font-bold text-[#f3ece1]">
                  <UserPlus className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
                  Đăng nhập và mua gói
                </h3>
                <p className="text-[11px] leading-relaxed text-[#b3a48d]">
                  {HAS_SAVINGS
                    ? "Rẻ hơn hẳn nếu bạn xem từ hai lượt trở lên, và luận giải được lưu lại để đọc trên mọi thiết bị."
                    : "Luận giải được lưu lại để đọc trên mọi thiết bị, và Credits dùng dần cho những lần sau."}
                </p>
              </div>
              {CHEAPEST && (
                <div className="shrink-0 text-right">
                  <div className="font-display text-xl font-bold text-[#d4af37]">
                    {formatVnd(CHEAPEST.pricePerReading)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#b3a48d]">
                    mỗi lượt
                  </div>
                </div>
              )}
            </div>

            {/* Con số cụ thể, không phải lời hứa chung chung. Chỉ liệt kê khi
                thật sự có gói rẻ hơn mua lẻ — nếu không, phần còn lại vẫn là
                lý do hợp lệ để tạo tài khoản, chỉ là không kèm lời hứa giá. */}
            <ul className="mt-3 space-y-1 border-t border-[#3d3123]/70 pt-3">
              {ENTRY_PACK && (
                <li className="flex items-start gap-1.5 text-[11px] text-[#b3a48d]">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#d4af37]" aria-hidden="true" />
                  <span>
                    {ENTRY_PACK.label} — {formatVnd(PACKS[ENTRY_PACK.id].amountVnd)} cho{" "}
                    {ENTRY_PACK.readings} lượt, tức {formatVnd(ENTRY_PACK.pricePerReading)}/lượt
                  </span>
                </li>
              )}
              {CHEAPEST && CHEAPEST.id !== ENTRY_PACK?.id && (
                <li className="flex items-start gap-1.5 text-[11px] text-[#b3a48d]">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#d4af37]" aria-hidden="true" />
                  <span>
                    {CHEAPEST.label} — chỉ {formatVnd(CHEAPEST.pricePerReading)}/lượt, rẻ hơn{" "}
                    {MAX_SAVING_PERCENT}% so với mua lẻ
                  </span>
                </li>
              )}
              <li className="flex items-start gap-1.5 text-[11px] text-[#b3a48d]">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#d4af37]" aria-hidden="true" />
                <span>Luận giải được lưu lại, đọc được trên mọi thiết bị</span>
              </li>
              <li className="flex items-start gap-1.5 text-[11px] text-[#b3a48d]">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#d4af37]" aria-hidden="true" />
                <span>Credits không hết hạn, dùng dần cho những lần sau</span>
              </li>
            </ul>
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#b3a48d]">
          Đã có tài khoản?{" "}
          <button
            type="button"
            onClick={onChooseLogin}
            className="cursor-pointer font-semibold text-[#d4af37] underline"
          >
            Đăng nhập
          </button>{" "}
          để dùng số Credits sẵn có.
        </p>
      </div>
    </div>
  );
};
