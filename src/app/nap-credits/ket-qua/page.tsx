"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";

type Status = "checking" | "paid" | "pending" | "not_found" | "error";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~1 phút — webhook PayOS thường về nhanh hơn nhiều

// PayOS redirect trình duyệt về đây SAU KHI user rời trang checkout của họ —
// kể cả khi user bấm huỷ, đóng tab, hoặc chưa hề chuyển khoản (PayOS không
// đảm bảo returnUrl chỉ được gọi khi thanh toán thật thành công). KHÔNG BAO
// GIỜ được coi việc "trình duyệt tới được URL này" là bằng chứng đã thanh
// toán — nguồn sự thật duy nhất là trạng thái `orders.status` trong DB, do
// webhook PayOS (đã verify chữ ký, xem src/app/api/webhooks/payos/route.ts)
// ghi. Trang cũ hiển thị "Thành công" vô điều kiện — bug thật đã gây hiểu
// lầm cho user (2026-08-29).
function KetQuaContent() {
  const { user, logout } = useAuthUser();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    let pollCount = 0;

    async function check() {
      try {
        const res = await fetch(`/api/orders?orderId=${orderId}`);
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("not_found");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const data = await res.json();
        if (data.status === "paid") {
          setStatus("paid");
          return;
        }
        if (data.status === "expired" || data.status === "cancelled" || data.status === "failed") {
          setStatus("error");
          return;
        }
        // pending — webhook có thể chưa kịp về, poll thêm vài lần
        pollCount += 1;
        if (pollCount >= MAX_POLLS) {
          setStatus("pending");
          return;
        }
        setStatus("checking");
        setTimeout(check, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} onOpenTopUp={() => {}} onOpenAuth={() => {}} onLogout={logout} />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-md bg-[#15100b] border border-[#d4af37]/50 rounded-3xl p-8 shadow-[0_15px_50px_rgba(0,0,0,0.9)] text-center animate-in zoom-in-95"
        >
          {status === "checking" && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border-2 border-[#d4af37]/60 text-[#d4af37] flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">Đang xác nhận thanh toán…</h1>
              <p className="text-xs text-[#b3a48d] mb-6 leading-relaxed">
                Chúng tôi đang chờ xác nhận từ PayOS. Đừng đóng trang này.
              </p>
            </>
          )}

          {status === "paid" && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#5fbf8c]/20 border-2 border-[#5fbf8c] text-[#5fbf8c] flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">Nạp Tiền Thành Công!</h1>
              <p className="text-xs text-[#b3a48d] mb-6 leading-relaxed">
                Giao dịch VietQR PayOS đã được xử lý và ghi nhận vào tài khoản của bạn.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/doc-sau"
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Trải Bài Sâu 3 Lá Ngay</span>
                </Link>
                <Link
                  href="/tai-khoan"
                  className="py-2.5 px-6 rounded-xl bg-[#1c1611] border border-[#3d3123] hover:border-[#d4af37] text-xs text-[#b3a48d] hover:text-white transition-all"
                >
                  Về Trang Lịch Sử & Tài Khoản
                </Link>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border-2 border-[#d4af37]/60 text-[#d4af37] flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">Chưa nhận được xác nhận</h1>
              <p className="text-xs text-[#b3a48d] mb-6 leading-relaxed">
                Nếu bạn đã chuyển khoản, credits sẽ được cộng ngay khi PayOS xác nhận
                (có thể mất thêm vài phút) — kiểm tra lại ở trang tài khoản. Nếu bạn
                chưa chuyển khoản, đơn này sẽ tự hết hạn.
              </p>
              <Link
                href="/tai-khoan"
                className="py-2.5 px-6 rounded-xl bg-[#1c1611] border border-[#3d3123] hover:border-[#d4af37] text-xs text-[#b3a48d] hover:text-white transition-all inline-block"
              >
                Về Trang Lịch Sử & Tài Khoản
              </Link>
            </>
          )}

          {(status === "not_found" || status === "error") && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#f0605f]/15 border-2 border-[#f0605f]/60 text-[#f0605f] flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">Không xác nhận được đơn hàng</h1>
              <p className="text-xs text-[#b3a48d] mb-6 leading-relaxed">
                Đơn hàng không tồn tại, đã huỷ/hết hạn, hoặc có lỗi khi kiểm tra. Vào
                trang tài khoản để xem số dư và lịch sử giao dịch thật.
              </p>
              <Link
                href="/tai-khoan"
                className="py-2.5 px-6 rounded-xl bg-[#1c1611] border border-[#3d3123] hover:border-[#d4af37] text-xs text-[#b3a48d] hover:text-white transition-all inline-block"
              >
                Về Trang Lịch Sử & Tài Khoản
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function NapCreditsKetQuaPage() {
  return (
    <Suspense fallback={null}>
      <KetQuaContent />
    </Suspense>
  );
}
