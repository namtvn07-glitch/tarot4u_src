"use client";

import { useId, useState } from "react";
import { PasswordAuthForm } from "@/components/auth/PasswordAuthForm";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm({ next }: { next: string }) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function redirectUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) {
      setErrorMessage("Không gửi được link đăng nhập. Vui lòng thử lại.");
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  async function handleGoogle() {
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl() },
    });
    // Thành công thì SDK tự window.location sang Google — không có gì để
    // xử lý tiếp ở đây, chỉ còn nhánh lỗi (vd. provider chưa cấu hình).
    if (error) {
      setErrorMessage("Không mở được đăng nhập Google. Vui lòng thử lại.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="max-w-prose rounded-md p-4 text-body text-text"
        style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        Đã gửi link đăng nhập tới <strong>{email}</strong>. Kiểm tra hộp thư
        (kể cả mục spam) rồi bấm vào link để tiếp tục.
      </div>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-5">
      <Button variant="ghost" onClick={handleGoogle} disabled={status === "sending"}>
        Đăng nhập bằng Google
      </Button>

      <div className="flex items-center gap-3 text-body-sm text-text-muted" aria-hidden="true">
        <span className="h-[1px] flex-1" style={{ background: "var(--color-border)" }} />
        hoặc
        <span className="h-[1px] flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-2">
        <label htmlFor={emailId} className="text-body-sm font-semibold text-text">
          Email nhận link đăng nhập
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ban@vidu.com"
          className="min-h-[44px] rounded-md border px-4 py-3 text-body text-text"
          style={{ borderColor: "var(--color-border-interactive)", background: "var(--color-surface)" }}
        />
        {status === "error" && errorMessage && (
          <p role="alert" className="text-body-sm text-danger">
            {errorMessage}
          </p>
        )}
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Đang gửi…" : "Gửi link đăng nhập"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-body-sm text-text-muted" aria-hidden="true">
        <span className="h-[1px] flex-1" style={{ background: "var(--color-border)" }} />
        hoặc
        <span className="h-[1px] flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <PasswordAuthForm next={next} />
    </div>
  );
}
