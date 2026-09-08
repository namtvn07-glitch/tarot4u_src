"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2, MailCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements, usePasswordCheck } from "@/components/auth/PasswordRequirements";
import { createClient } from "@/lib/supabase/client";
import { sendPasswordResetEmail } from "@/lib/password-reset";

type SessionState = "checking" | "ready" | "expired";
type Status = "idle" | "submitting" | "success" | "error";

const GUEST_USER = { name: "Khách", email: "", credits: 0, isLoggedIn: false } as const;

// Đích đến của link "Quên mật khẩu?" trong email. Người dùng tới đây đã có session
// recovery do /auth/callback đổi code — trang chỉ cần một session hợp lệ là làm việc
// được. Không có session (link hết hạn/đã dùng) là một trạng thái BÌNH THƯỜNG phải
// thiết kế, không phải lỗi: đó là lý do trang này không nằm trong PROTECTED_PREFIXES
// của middleware, nếu không người dùng sẽ bị đá sang /dang-nhap mà không hiểu vì sao.
export default function DatLaiMatKhauPage() {
  const router = useRouter();
  const requirementsId = useId();
  const resendEmailId = useId();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<Status>("idle");
  const successRef = useRef<HTMLDivElement>(null);

  const check = usePasswordCheck(password, email);
  const isMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isActive) return;
        if (data.user) {
          setEmail(data.user.email ?? "");
          setSessionState("ready");
        } else {
          setSessionState("expired");
        }
      })
      .catch(() => {
        if (isActive) setSessionState("expired");
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "success") return;
    successRef.current?.focus();
    const timer = setTimeout(() => router.push("/tai-khoan"), 2500);
    return () => clearTimeout(timer);
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!check.canSubmit || isMismatch || confirmPassword.length === 0) return;

    setStatus("submitting");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(
        error.code === "same_password"
          ? "Mật khẩu mới phải khác mật khẩu cũ."
          : "Không đặt lại được mật khẩu. Link có thể đã hết hạn — hãy yêu cầu link mới.",
      );
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendState("submitting");
    const { ok } = await sendPasswordResetEmail(resendEmail);
    setResendState(ok ? "success" : "error");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        user={GUEST_USER}
        onOpenTopUp={() => router.push("/nap-credits")}
        onOpenAuth={() => router.push("/dang-nhap")}
        onLogout={() => router.push("/")}
        onNavigate={(screen) => {
          if (screen === "home") router.push("/");
          if (screen === "quick-read") router.push("/trai-bai");
          if (screen === "deep-read") router.push("/doc-sau");
          if (screen === "library") router.push("/thu-vien");
        }}
      />

      <main className="flex-grow flex items-start justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md bg-[#15100b] border border-[#d4af37]/45 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.95)] mt-8">
          <h1 className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6a3] via-[#d4af37] to-[#8f5a1f] text-center">
            Đặt Lại Mật Khẩu
          </h1>

          {sessionState === "checking" && (
            <p role="status" className="mt-6 flex items-center justify-center gap-2 text-xs text-[#b3a48d]">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Đang kiểm tra link đặt lại mật khẩu…
            </p>
          )}

          {sessionState === "expired" && (
            <div className="mt-6">
              <p className="flex items-start gap-2 p-3 rounded-xl bg-[#f0605f]/15 border border-[#f0605f]/40 text-[#f0605f] text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Link đặt lại mật khẩu đã hết hạn hoặc đã được dùng rồi. Nhập email để
                  nhận link mới.
                </span>
              </p>

              {resendState === "success" ? (
                <p
                  role="status"
                  className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#5fbf8c]/15 border border-[#5fbf8c]/40 text-[#5fbf8c] text-xs leading-relaxed"
                >
                  <MailCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Nếu email này có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.
                    Kiểm tra hộp thư (kể cả mục spam).
                  </span>
                </p>
              ) : (
                <form onSubmit={handleResend} className="mt-4 flex flex-col gap-2">
                  <label htmlFor={resendEmailId} className="text-[11px] font-semibold text-[#b3a48d]">
                    Địa chỉ email
                  </label>
                  <input
                    id={resendEmailId}
                    type="email"
                    required
                    autoComplete="email"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                    placeholder="tenban@gmail.com"
                    className="w-full min-h-[44px] bg-[#0e0a08] border border-[#3d3123] rounded-xl px-3 py-2 text-xs text-[#f3ece1] placeholder:text-[#7a6e5d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  />
                  {resendState === "error" && (
                    <p role="alert" className="text-[11px] text-[#f0605f]">
                      Không gửi được email lúc này. Vui lòng thử lại sau ít phút.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={resendState === "submitting"}
                    className="mt-1 min-h-[44px] w-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resendState === "submitting" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Đang gửi…
                      </>
                    ) : (
                      "Gửi link mới"
                    )}
                  </button>
                </form>
              )}

              <p className="mt-4 text-center text-xs text-[#b3a48d]">
                <Link href="/dang-nhap" className="text-[#d4af37] font-semibold hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            </div>
          )}

          {sessionState === "ready" && status === "success" && (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="mt-6 p-4 rounded-xl bg-[#5fbf8c]/15 border border-[#5fbf8c]/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5fbf8c]"
            >
              <p className="flex items-start gap-2 text-xs text-[#5fbf8c] leading-relaxed">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Đã đặt lại mật khẩu thành công. Đang chuyển tới trang tài khoản…
                </span>
              </p>
              <p className="mt-3 text-xs">
                <Link href="/tai-khoan" className="text-[#d4af37] font-semibold hover:underline">
                  Tới trang tài khoản ngay
                </Link>
              </p>
            </div>
          )}

          {sessionState === "ready" && status !== "success" && (
            <>
              <p className="mt-2 mb-5 text-center text-xs text-[#b3a48d] leading-relaxed">
                Đặt mật khẩu mới cho{" "}
                <strong className="text-[#f3ece1]">{email || "tài khoản của bạn"}</strong>.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <PasswordField
                    label="Mật khẩu mới"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    describedBy={requirementsId}
                    disabled={status === "submitting"}
                  />
                  <PasswordRequirements id={requirementsId} password={password} check={check} />
                </div>

                <PasswordField
                  label="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  disabled={status === "submitting"}
                />

                {isMismatch && (
                  <p role="alert" className="text-[11px] text-[#f0605f]">
                    Hai lần nhập mật khẩu chưa khớp nhau.
                  </p>
                )}

                {status === "error" && errorMessage && (
                  <p role="alert" className="text-[11px] text-[#f0605f]">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    status === "submitting" ||
                    !check.canSubmit ||
                    isMismatch ||
                    confirmPassword.length === 0
                  }
                  className="mt-1 min-h-[44px] w-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      Đang lưu mật khẩu mới…
                    </>
                  ) : (
                    "Đặt lại mật khẩu"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
