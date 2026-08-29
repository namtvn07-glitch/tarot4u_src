"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";
type Status = "idle" | "submitting" | "error";

// Bổ sung 2026-08-18 theo yêu cầu: đường dự phòng không phụ thuộc gửi email
// thật (magic link/Google đều cần Supabase gửi mail, dễ dính rate limit mặc
// định của mailer test). "Email" ở đây chỉ là định danh tài khoản do user tự
// đặt — không nhận thư gì cả, chỉ hoạt động đúng khi tắt "Confirm email" ở
// Supabase Dashboard (nếu bật, signUp vẫn cố gửi mail xác nhận và vẫn dính
// rate limit y hệt).
export function PasswordAuthForm({ next }: { next: string }) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(
        mode === "signup"
          ? "Không tạo được tài khoản — email này có thể đã tồn tại."
          : "Sai email hoặc mật khẩu.",
      );
      setStatus("error");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Chọn đăng nhập hoặc đăng ký" className="flex gap-2">
        <Button
          type="button"
          variant={mode === "signin" ? "primary" : "ghost"}
          aria-pressed={mode === "signin"}
          onClick={() => switchMode("signin")}
        >
          Đăng nhập
        </Button>
        <Button
          type="button"
          variant={mode === "signup" ? "primary" : "ghost"}
          aria-pressed={mode === "signup"}
          onClick={() => switchMode("signup")}
        >
          Đăng ký
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={emailId} className="text-body-sm font-semibold text-text">
          Email (chỉ dùng để định danh tài khoản, không cần là email thật)
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete={mode === "signup" ? "email" : "username"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ten-ban-chon@vidu.com"
          className="min-h-[44px] rounded-md border px-4 py-3 text-body text-text"
          style={{ borderColor: "var(--color-border-interactive)", background: "var(--color-surface)" }}
        />

        <label htmlFor={passwordId} className="text-body-sm font-semibold text-text">
          Mật khẩu
        </label>
        <input
          id={passwordId}
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-[44px] rounded-md border px-4 py-3 text-body text-text"
          style={{ borderColor: "var(--color-border-interactive)", background: "var(--color-surface)" }}
        />

        {status === "error" && errorMessage && (
          <p role="alert" className="text-body-sm text-danger">
            {errorMessage}
          </p>
        )}

        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting"
            ? mode === "signup"
              ? "Đang tạo tài khoản…"
              : "Đang đăng nhập…"
            : mode === "signup"
              ? "Tạo tài khoản"
              : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
