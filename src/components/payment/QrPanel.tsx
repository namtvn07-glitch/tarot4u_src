"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const POLL_INTERVAL_MS = 5000;

export interface ActiveOrder {
  id: string;
  qrCode: string;
  expiresAt: string;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// 4 trạng thái hiển thị bởi chính panel này — "loading" (đang gọi
// POST /api/orders) là trách nhiệm của component cha (NapCreditsFlow), panel
// chỉ mount sau khi đã có `order` (05-thanh-toan-credits.md §6).
type PanelStatus = "waiting" | "expired" | "error";

export function QrPanel({
  order,
  packLabel,
  amountVnd,
  onExpired,
  onPaid,
}: {
  order: ActiveOrder;
  packLabel: string;
  amountVnd: number;
  onExpired: () => void;
  onPaid: () => void;
}) {
  const expiresAtMs = new Date(order.expiresAt).getTime();

  const [status, setStatus] = useState<PanelStatus>("waiting");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(() => expiresAtMs - Date.now());
  // Tổng thời lượng để tính tỉ lệ vòng đếm ngược — lấy từ chính expiresAt
  // server trả về trừ thời điểm mount, KHÔNG hardcode 15*60 (đã học ở thiết
  // kế Giai đoạn 2: nếu server đổi thời hạn, UI vẫn đúng tự động). State (lazy
  // initializer), không phải ref — đọc ref.current trong lúc render bị chặn
  // bởi react-hooks/refs (React Compiler rule).
  const [totalMs] = useState(() => Math.max(1, expiresAtMs - Date.now()));
  const [announcement, setAnnouncement] = useState("");
  const announcedOneMinuteRef = useRef(false);
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(order.qrCode, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [order.qrCode]);

  useEffect(() => {
    if (status !== "waiting") return;
    const id = setInterval(() => {
      const remaining = expiresAtMs - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 60_000 && !announcedOneMinuteRef.current) {
        announcedOneMinuteRef.current = true;
        setAnnouncement("Còn 1 phút để hoàn tất thanh toán.");
      }
      if (remaining <= 0) {
        clearInterval(id);
        setStatus("expired");
        setAnnouncement("Mã thanh toán đã hết hạn.");
        onExpired();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status, expiresAtMs, onExpired]);

  useEffect(() => {
    if (status !== "waiting") return;

    const supabase = createClient();
    let settled = false;
    const markPaid = () => {
      if (settled) return;
      settled = true;
      setAnnouncement("Thanh toán thành công.");
      onPaid();
    };

    const channel = supabase
      .channel(`order:${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          const next = payload.new as { status?: string };
          if (next.status === "paid") markPaid();
          if (next.status === "expired") setStatus("expired");
        },
      )
      .subscribe();

    // Lưới an toàn — Realtime có thể mất kết nối (05-thanh-toan-credits.md §5).
    const pollId = setInterval(async () => {
      const { data } = await supabase.from("orders").select("status").eq("id", order.id).single();
      if (data?.status === "paid") markPaid();
      if (data?.status === "expired") setStatus("expired");
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [status, order.id, onPaid]);

  useEffect(() => {
    if (status === "expired") headingRef.current?.focus();
  }, [status]);

  if (status === "error") {
    return (
      <div className="text-center">
        <p className="m-0 mb-4 font-semibold" style={{ color: "var(--color-danger)" }}>
          Không tạo được mã QR
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => setStatus("waiting")}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center">
        <p
          ref={headingRef}
          tabIndex={-1}
          className="m-0 mb-4 font-semibold focus:outline-none"
          style={{ color: "var(--color-danger)" }}
        >
          Mã đã hết hạn
        </p>
        <span className="sr-only" role="status">
          {announcement}
        </span>
      </div>
    );
  }

  const fraction = Math.max(0, Math.min(1, remainingMs / totalMs));

  return (
    <div className="text-center">
      <div
        className="mx-auto mb-4 flex items-center justify-center rounded-md bg-surface"
        style={{ width: 220, height: 220, border: "var(--elevation-border, 1px solid transparent)" }}
      >
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URL sinh client-side, next/image không tối ưu được ảnh này.
          <img
            src={qrDataUrl}
            alt={`Mã QR thanh toán gói ${packLabel}, ${amountVnd.toLocaleString("vi-VN")}đ`}
            width={220}
            height={220}
            className="rounded-md"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full animate-pulse rounded-md bg-surface-raised"
          />
        )}
      </div>

      {/* role="timer" kế thừa aria-live="polite" ngầm định — tắt để không đọc
          lại số đếm ngược mỗi giây; #announcement riêng chỉ báo tại mốc còn
          ý nghĩa (còn 1 phút, khi paid/expired). */}
      <div
        role="timer"
        aria-live="off"
        aria-label="Thời gian còn lại để thanh toán"
        className="relative mx-auto mb-4"
        style={{ width: 120, height: 120 }}
      >
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            style={{ stroke: "var(--color-border)" }}
          />
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
            style={{
              stroke: "var(--color-accent)",
              transform: "rotate(-90deg)",
              transformOrigin: "60px 60px",
            }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-body font-semibold text-text"
          aria-hidden="true"
        >
          {formatCountdown(remainingMs)}
        </span>
      </div>
      <span className="sr-only" role="status">
        {announcement}
      </span>

      <p className="m-0 mb-1 font-semibold text-text">Đang chờ thanh toán…</p>
      <p className="m-0 text-body-sm text-text-muted">
        Quét mã bằng app ngân hàng hoặc ví hỗ trợ VietQR.
      </p>
    </div>
  );
}
