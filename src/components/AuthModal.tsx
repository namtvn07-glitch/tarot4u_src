"use client";

import React, { useState } from "react";
import { Sparkles, Mail, Lock, Eye, EyeOff, X, CheckCircle, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { id?: string; name: string; email: string; credits?: number; avatarUrl?: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const fetchUserProfile = async (supabase: any, user: any) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        name: profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Thành Viên",
        email: user.email || "",
        credits: typeof profile?.credits === "number" ? profile.credits : 0,
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url,
      };
    } catch {
      return {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Thành Viên",
        email: user.email || "",
        credits: 0,
        avatarUrl: user.user_metadata?.avatar_url,
      };
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message || "Không thể kết nối Google OAuth. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi kết nối máy chủ xác thực.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setMagicLinkSent(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message || "Không thể gửi liên kết đăng nhập. Vui lòng kiểm tra lại email.");
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi kết nối máy chủ xác thực.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setRegisterSuccess(false);

    try {
      const supabase = createClient();
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErrorMsg("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        if (data?.user) {
          const userObj = await fetchUserProfile(supabase, data.user);
          onLoginSuccess(userObj);
          onClose();
        }
      } else {
        // Mode: Register
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: email.split("@")[0],
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            setErrorMsg("Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập.");
          } else if (error.message.includes("Password should be at least")) {
            setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự.");
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        if (data?.session && data?.user) {
          const userObj = await fetchUserProfile(supabase, data.user);
          onLoginSuccess(userObj);
          onClose();
        } else {
          setRegisterSuccess(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi xử lý tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#15100b] border border-[#d4af37]/45 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.95)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#b3a48d] hover:text-[#d4af37] p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#8f5a1f] to-[#3d3123] p-[1px] shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#050505] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#d4af37]" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6a3] via-[#d4af37] to-[#8f5a1f]">
            {mode === "login" ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản Mới"}
          </h2>
          <p className="text-xs text-[#b3a48d] mt-1">
            Xác thực qua Supabase để bảo mật số dư Credits và Lịch Sử Trải Bài.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#f0605f]/15 border border-[#f0605f]/40 text-[#f0605f] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {magicLinkSent && (
          <div className="mb-4 p-3 rounded-xl bg-[#5fbf8c]/15 border border-[#5fbf8c]/40 text-[#5fbf8c] text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Liên kết đăng nhập đã được gửi tới <strong>{magicEmail}</strong>. Vui lòng kiểm tra hòm thư của bạn!</span>
          </div>
        )}

        {registerSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-[#5fbf8c]/15 border border-[#5fbf8c]/40 text-[#5fbf8c] text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-3 bg-[#251d16] hover:bg-[#2f241c] border border-[#3d3123] hover:border-[#d4af37]/60 rounded-xl text-xs font-semibold text-[#f3ece1] transition-all cursor-pointer shadow-md active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Tiếp tục với tài khoản Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-[#3d3123] flex-1" />
          <span className="text-[10px] font-semibold text-[#7a6e5d] uppercase tracking-widest">
            HOẶC EMAIL & MẬT KHẨU
          </span>
          <div className="h-px bg-[#3d3123] flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#b3a48d] block mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7a6e5d] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@gmail.com"
                className="w-full bg-[#0e0a08] border border-[#3d3123] rounded-xl pl-9 pr-3 py-2 text-xs text-[#f3ece1] placeholder:text-[#7a6e5d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-[#b3a48d]">
                Mật khẩu
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!email) {
                      setErrorMsg("Vui lòng nhập email của bạn trước khi yêu cầu đặt lại mật khẩu.");
                    } else {
                      const supabase = createClient();
                      supabase.auth.resetPasswordForEmail(email);
                      alert(`Liên kết đặt lại mật khẩu đã được gửi tới ${email}.`);
                    }
                  }}
                  className="text-[10px] text-[#d4af37] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#7a6e5d] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0e0a08] border border-[#3d3123] rounded-xl pl-9 pr-9 py-2 text-xs text-[#f3ece1] placeholder:text-[#7a6e5d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6e5d] hover:text-[#f3ece1] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(143,90,31,0.35)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Đăng Nhập" : "Đăng Ký Tài Khoản"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center text-xs text-[#b3a48d] mt-4 pt-4 border-t border-[#3d3123]/50">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                className="text-[#d4af37] font-semibold hover:underline cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className="text-[#d4af37] font-semibold hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
