"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Circle, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  PASSWORD_RECOMMENDED_LENGTH,
  PASSWORD_RULE_LABELS,
  evaluatePassword,
  isPasswordBreached,
  type PasswordRuleId,
} from "@/lib/password";

const RULE_ORDER: PasswordRuleId[] = ["length", "maxLength", "common", "context", "sequence"];

export interface PasswordCheck {
  failures: PasswordRuleId[];
  isValid: boolean;
  isStrong: boolean;
  /** true = đã lộ, false = chưa thấy trong dữ liệu rò rỉ, null = chưa/không kiểm được. */
  breached: boolean | null;
  isCheckingBreach: boolean;
  canSubmit: boolean;
}

/**
 * Trạng thái "mật khẩu này đã dùng được chưa" cho form cha. Phần luật là thuần và
 * chạy ngay khi gõ; phần HIBP là mạng nên debounce 500ms và huỷ request cũ.
 *
 * `canSubmit` cố ý CHO QUA khi HIBP trả null (mạng lỗi) — chặn người dùng vì API bên
 * thứ ba sập là tự bắn vào chân; quyết định này đã chốt trong plan.
 */
export function usePasswordCheck(password: string, email?: string | null): PasswordCheck {
  const evaluation = useMemo(
    () => evaluatePassword(password, { email }),
    [password, email],
  );
  const [breached, setBreached] = useState<boolean | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  useEffect(() => {
    // Chưa qua nổi các luật cơ bản thì chưa đáng gọi mạng.
    if (password.length === 0 || !evaluation.isValid) {
      setBreached(null);
      setIsCheckingBreach(false);
      return;
    }

    const controller = new AbortController();
    setIsCheckingBreach(true);
    const timer = setTimeout(() => {
      isPasswordBreached(password, { signal: controller.signal }).then((result) => {
        if (controller.signal.aborted) return;
        setBreached(result);
        setIsCheckingBreach(false);
      });
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [password, evaluation.isValid]);

  return {
    failures: evaluation.failures,
    isValid: evaluation.isValid,
    isStrong: evaluation.isStrong,
    breached,
    isCheckingBreach,
    canSubmit: evaluation.isValid && breached !== true && !isCheckingBreach,
  };
}

interface PasswordRequirementsProps {
  id: string;
  password: string;
  check: PasswordCheck;
}

// Checklist yêu cầu mật khẩu — thiết kế theo mẫu đã thành chuẩn (Stripe/GitHub):
// yêu cầu CHƯA đạt ở màu trung tính, KHÔNG phải đỏ. Đỏ ngay từ ký tự gõ đầu tiên
// (bản trước) dí người dùng bằng màu báo lỗi trong lúc họ còn đang gõ dở — 5 dòng
// cùng đỏ một lúc chỉ gây choáng, không giúp họ biết phải sửa gì trước. Đỏ để dành
// cho lỗi thật (mật khẩu đã lộ, ở dưới). "Đạt hay chưa" đã có ĐỦ 2 tín hiệu không
// phải màu: hình khối icon khác nhau (chấm tròn rỗng ↔ dấu tick trong khối đặc) và
// dòng sr-only cho screen reader — nên bỏ hẳn chữ "— đạt/chưa đạt" hiển thị, đỡ rối.
export function PasswordRequirements({ id, password, check }: PasswordRequirementsProps) {
  const hasInput = password.length > 0;

  return (
    <div
      id={id}
      aria-live="polite"
      className="mt-2 rounded-xl border border-[#3d3123] bg-[#0e0a08]/50 p-3 flex flex-col gap-1.5"
    >
      {RULE_ORDER.map((rule) => {
        const isMet = hasInput && !check.failures.includes(rule);
        return (
          <div key={rule} className="flex items-center gap-2 text-[11px] leading-relaxed">
            {isMet ? (
              <span className="flex items-center justify-center w-3.5 h-3.5 shrink-0 rounded-full bg-[#5fbf8c]/20">
                <Check className="w-2.5 h-2.5 text-[#5fbf8c]" aria-hidden="true" />
              </span>
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0 text-[#7a6e5d]" aria-hidden="true" />
            )}
            <span className={isMet ? "text-[#5fbf8c]" : "text-[#b3a48d]"}>
              {PASSWORD_RULE_LABELS[rule]}
            </span>
            <span className="sr-only">{isMet ? " — đạt" : " — chưa đạt"}</span>
          </div>
        );
      })}

      {(check.isCheckingBreach || check.breached !== null) && (
        <div className="mt-1 pt-1.5 border-t border-[#3d3123]">
          {check.isCheckingBreach && (
            <p className="flex items-center gap-2 text-[11px] leading-relaxed text-[#b3a48d]">
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" aria-hidden="true" />
              <span>Đang kiểm tra mật khẩu trong dữ liệu rò rỉ…</span>
            </p>
          )}

          {check.breached === true && (
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#f0605f]">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Mật khẩu này đã xuất hiện trong dữ liệu bị rò rỉ công khai — hãy chọn
                mật khẩu khác.
              </span>
            </p>
          )}

          {check.breached === false && !check.isCheckingBreach && (
            <p className="flex items-center gap-2 text-[11px] leading-relaxed text-[#5fbf8c]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                Chưa thấy trong dữ liệu rò rỉ
                {check.isStrong
                  ? " — mật khẩu mạnh."
                  : ` — dài từ ${PASSWORD_RECOMMENDED_LENGTH} ký tự sẽ an toàn hơn nữa.`}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
