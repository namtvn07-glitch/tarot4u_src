"use client";

import React, { useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements, usePasswordCheck } from "@/components/auth/PasswordRequirements";
import { upgradeAnonymousToAccount } from "@/lib/upgrade-anonymous";
import { getErrorMessage } from "@/lib/errors";

type Status = "idle" | "submitting" | "confirm-email" | "done" | "error";

interface UpgradeAnonymousAccountProps {
  /** Gọi khi phiên đã thành tài khoản thật và không cần xác nhận email. */
  onUpgraded?: () => void;
}

/**
 * Biến một phiên khách (ẩn danh) thành tài khoản thật — TẠI CHỖ.
 *
 * Dùng `updateUser({ email, password })`, KHÔNG phải `signUp()`. Đây không phải
 * chi tiết kỹ thuật vụn vặt: `signUp()` gọi từ trong một phiên ẩn danh tạo một
 * hàng `auth.users` THỨ HAI và bỏ rơi hàng cũ — cùng với credits đã trả tiền,
 * các luận giải đã mua và mọi `readings` gắn với uuid cũ. `updateUser` giữ
 * nguyên uuid, nên tất cả đi theo sang mà không phải di trú gì cả.
 */
export function UpgradeAnonymousAccount({ onUpgraded }: UpgradeAnonymousAccountProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const emailId = useId();
  const requirementsId = useId();
  const passwordCheck = usePasswordCheck(password, email);

  // Chốt ĐỒNG BỘ: `status` là state nên `disabled`/`canSubmit` chỉ có hiệu lực
  // từ lần render sau. Hai lần submit trong cùng một tick (bấm nhanh, hoặc
  // Enter trùng với cú click) sẽ gọi updateUser() hai lần; lần thứ hai báo lỗi
  // và UI lật sang trạng thái thất bại DÙ lần đầu đã nâng cấp xong — người
  // dùng tưởng hỏng rồi đi thử email khác.
  const isUpgradingRef = useRef(false);
  const isSubmitting = status === "submitting";
  const canSubmit = email.trim().length > 0 && passwordCheck.isValid && !isSubmitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    if (isUpgradingRef.current) return;
    isUpgradingRef.current = true;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const result = await upgradeAnonymousToAccount(email, password);

      if (result.status === "error") {
        setErrorMsg(result.message);
        setStatus("error");
        return;
      }
      if (result.status === "confirm-email") {
        setStatus("confirm-email");
        return;
      }

      setStatus("done");
      onUpgraded?.();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Không kết nối được máy chủ. Vui lòng thử lại."));
      setStatus("error");
    } finally {
      isUpgradingRef.current = false;
    }
  }

  if (status === "confirm-email") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-2xl border border-[#d4af37]/40 bg-[#15100b] p-6 text-center"
      >
        <MailCheck className="h-10 w-10 text-[#d4af37]" aria-hidden="true" />
        <h3 className="font-display text-xl font-bold text-[#f3ece1]">
          Kiểm tra hộp thư của bạn
        </h3>
        <p className="max-w-prose text-xs leading-relaxed text-[#b3a48d]">
          Chúng tôi đã gửi link xác nhận tới <strong className="text-[#f3ece1]">{email}</strong>.
          Bấm vào link đó để hoàn tất việc tạo tài khoản. Credits và các luận giải
          bạn đã mua vẫn còn nguyên trong phiên này — đừng xoá dữ liệu trình duyệt
          trước khi xác nhận xong.
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-2xl border border-[#5fbf8c]/50 bg-[#15100b] p-6 text-center"
      >
        <CheckCircle2 className="h-10 w-10 text-[#5fbf8c]" aria-hidden="true" />
        <h3 className="font-display text-xl font-bold text-[#f3ece1]">Đã lưu tài khoản</h3>
        <p className="max-w-prose text-xs leading-relaxed text-[#b3a48d]">
          Từ giờ bạn đăng nhập lại bằng <strong className="text-[#f3ece1]">{email}</strong> trên
          bất kỳ thiết bị nào. Toàn bộ Credits và luận giải đã mua vẫn giữ nguyên.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-[#3d3123] bg-[#15100b] p-5 sm:p-6"
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-[#d4af37]/30 bg-[#8f5a1f]/10 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-[#b3a48d]">
          Phiên khách của bạn chỉ sống trong trình duyệt này. Đặt email và mật khẩu
          để giữ lại Credits cùng các luận giải đã mua — và đăng nhập được từ máy khác.
        </p>
      </div>

      {status === "error" && errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#f0605f]/40 bg-[#f0605f]/15 p-3 text-xs text-[#f0605f]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label htmlFor={emailId} className="mb-1 block text-[11px] font-semibold text-[#b3a48d]">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isSubmitting}
          placeholder="ban@email.com"
          className="w-full rounded-xl border border-[#3d3123] bg-[#1c1611] px-3.5 py-2.5 text-sm text-[#f3ece1] placeholder:text-[#7a6e5d] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 disabled:opacity-50"
        />
      </div>

      <div>
        <PasswordField
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          describedBy={requirementsId}
          disabled={isSubmitting}
        />
        <PasswordRequirements id={requirementsId} password={password} check={passwordCheck} />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(143,90,31,0.4)] transition-all duration-300 hover:from-[#d4af37] hover:to-[#8f5a1f] hover:text-[#050505] active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Đang lưu tài khoản…</span>
          </>
        ) : (
          <span>Lưu tài khoản của tôi</span>
        )}
      </button>
    </form>
  );
}
