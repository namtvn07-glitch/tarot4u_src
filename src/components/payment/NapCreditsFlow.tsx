"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PackagePicker } from "@/components/payment/PackagePicker";
import { QrPanel, type ActiveOrder } from "@/components/payment/QrPanel";
import { PACKS, type PackId } from "@/lib/orders";

// State machine: idle (chọn gói) → creating (đang gọi POST /api/orders) →
// active (QrPanel) → paid | error. "expired" không phải state riêng — QrPanel
// tự xử lý nội bộ, gọi lại onExpired() để orchestrator quay về idle (không tự
// tạo lại đơn PayOS ngoài ý muốn, user bấm "Tạo mã mới" chủ động).
type Stage =
  | { name: "idle" }
  | { name: "creating"; packId: PackId }
  | { name: "active"; packId: PackId; order: ActiveOrder }
  | { name: "paid"; newBalance: number | null }
  | { name: "error"; message: string };

export function NapCreditsFlow() {
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [agreed, setAgreed] = useState(false);
  const checkboxId = useId();
  const successHeadingRef = useRef<HTMLParagraphElement>(null);

  async function handleSelect(packId: PackId) {
    setStage({ name: "creating", packId });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (res.status === 401) {
        setStage({ name: "error", message: "Phiên đăng nhập đã hết. Vui lòng tải lại trang." });
        return;
      }
      if (!res.ok) {
        setStage({ name: "error", message: "Không tạo được đơn hàng. Vui lòng thử lại." });
        return;
      }
      const data = (await res.json()) as {
        orderId: string;
        qrCode: string;
        checkoutUrl: string;
        expiresAt: string;
      };
      setStage({
        name: "active",
        packId,
        order: { id: data.orderId, qrCode: data.qrCode, expiresAt: data.expiresAt },
      });
    } catch {
      setStage({ name: "error", message: "Không kết nối được máy chủ. Vui lòng thử lại." });
    }
  }

  function handlePaid() {
    setStage({ name: "paid", newBalance: null });
    requestAnimationFrame(() => successHeadingRef.current?.focus());
  }

  return (
    <div>
      {stage.name !== "paid" && (
        <Card className="mb-6 flex items-start gap-3 text-body-sm text-text">
          <input
            id={checkboxId}
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <label htmlFor={checkboxId}>
            Tôi hiểu credits là trả trước, không hoàn lại nếu không hài lòng với
            nội dung (trừ khi AI lỗi không sinh được nội dung — tự động hoàn),
            và có thể mất nếu tài khoản bị xóa. Xem{" "}
            <Link href="/dieu-khoan" className="underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="/chinh-sach-hoan-tien" className="underline">
              Chính sách hoàn tiền
            </Link>
            .
          </label>
        </Card>
      )}

      {stage.name === "idle" && (
        <PackagePicker disabled={!agreed} pendingPackId={null} onSelect={handleSelect} />
      )}

      {stage.name === "creating" && (
        <PackagePicker disabled={!agreed} pendingPackId={stage.packId} onSelect={handleSelect} />
      )}

      {stage.name === "active" && (
        <section aria-labelledby="qr-heading" className="mx-auto max-w-md">
          <h2 id="qr-heading" className="sr-only">
            Thanh toán qua QR
          </h2>
          <QrPanel
            order={stage.order}
            packLabel={PACKS[stage.packId].label}
            amountVnd={PACKS[stage.packId].amountVnd}
            onExpired={() => setStage({ name: "idle" })}
            onPaid={handlePaid}
          />
        </section>
      )}

      {stage.name === "paid" && (
        <Card as="article" variant="highlighted" className="mx-auto max-w-md text-center">
          <p aria-hidden="true" className="m-0 mb-2 text-heading-1">
            ✓
          </p>
          <p
            ref={successHeadingRef}
            tabIndex={-1}
            className="m-0 mb-4 font-semibold focus:outline-none"
            style={{ color: "var(--color-success)" }}
          >
            Thanh toán thành công
          </p>
          {/* Điều hướng, không phải hành động — <a> thật, không phải <button>
              lồng trong <Link> (2 phần tử tương tác lồng nhau là HTML không
              hợp lệ). Style tay theo VARIANT_CLASS.primary của Button. */}
          <Link
            href="/trai-bai"
            style={{
              transitionDuration: "var(--motion-fast)",
              transitionTimingFunction: "var(--ease-standard)",
            }}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md border border-transparent bg-accent px-5 py-3 text-body font-semibold text-on-accent transition-colors hover:bg-accent-strong active:translate-y-px"
          >
            Trải bài ngay
          </Link>
        </Card>
      )}

      {stage.name === "error" && (
        <div
          role="alert"
          className="mx-auto max-w-md rounded-md p-4 text-center text-body-sm"
          style={{ border: "1px solid var(--color-danger)", background: "var(--color-surface-raised)" }}
        >
          <p className="m-0 mb-3 text-text">{stage.message}</p>
          <Button onClick={() => setStage({ name: "idle" })}>Thử lại</Button>
        </div>
      )}
    </div>
  );
}
