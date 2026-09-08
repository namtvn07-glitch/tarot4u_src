"use client";

import { useId, useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements, usePasswordCheck } from "@/components/auth/PasswordRequirements";

type Status = "idle" | "submitting" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_current_password: "Mật khẩu hiện tại không đúng.",
  same_password: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  breached_password:
    "Mật khẩu này đã xuất hiện trong dữ liệu bị rò rỉ công khai. Hãy chọn mật khẩu khác.",
  weak_password: "Mật khẩu mới chưa đủ mạnh theo yêu cầu của hệ thống.",
  no_password_set:
    "Tài khoản này đăng nhập bằng Google hoặc link email nên chưa có mật khẩu để đổi.",
  rate_limited: "Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

function messageFor(error: string | undefined, messages?: string[]): string {
  if (error === "invalid_password" && messages?.length) return messages.join(" ");
  return (error && ERROR_MESSAGES[error]) || "Không đổi được mật khẩu. Vui lòng thử lại.";
}

interface ChangePasswordFormProps {
  /** Email của tài khoản — dùng cho luật "mật khẩu không được chứa email của bạn". */
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChangePasswordForm({ email, onSuccess, onCancel }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const requirementsId = useId();

  const check = usePasswordCheck(newPassword, email);
  const isMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const isSubmitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!check.canSubmit || isMismatch || confirmPassword.length === 0) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(messageFor(data?.error, data?.messages));
        setStatus("error");
        return;
      }

      onSuccess();
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <PasswordField
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      <div>
        <PasswordField
          label="Mật khẩu mới"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          describedBy={requirementsId}
          disabled={isSubmitting}
        />
        <PasswordRequirements id={requirementsId} password={newPassword} check={check} />
      </div>

      <PasswordField
        label="Nhập lại mật khẩu mới"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={isSubmitting}
      />

      {isMismatch && (
        <p role="alert" className="text-[11px] text-[#f0605f]">
          Hai lần nhập mật khẩu mới chưa khớp nhau.
        </p>
      )}

      {status === "error" && errorMessage && (
        <p role="alert" className="text-[11px] text-[#f0605f]">
          {errorMessage}
        </p>
      )}

      <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-[44px] px-4 rounded-xl border border-[#3d3123] text-[#b3a48d] text-xs font-semibold hover:text-white hover:border-[#d4af37]/60 transition-colors cursor-pointer disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !check.canSubmit ||
            isMismatch ||
            confirmPassword.length === 0 ||
            currentPassword.length === 0
          }
          className="min-h-[44px] px-5 flex items-center justify-center gap-2 bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              Đang đổi mật khẩu…
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
              Đổi mật khẩu
            </>
          )}
        </button>
      </div>
    </form>
  );
}
