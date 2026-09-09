"use client";

import { useMemo } from "react";
import { Check, Circle } from "lucide-react";
import { PASSWORD_RULE_LABELS, evaluatePassword, type PasswordRuleId } from "@/lib/password";

const RULE_ORDER: PasswordRuleId[] = ["length", "maxLength", "context", "sequence"];

export interface PasswordCheck {
  failures: PasswordRuleId[];
  isValid: boolean;
  isStrong: boolean;
  canSubmit: boolean;
}

/** Trạng thái "mật khẩu này đã dùng được chưa" cho form cha — thuần, không mạng. */
export function usePasswordCheck(password: string, email?: string | null): PasswordCheck {
  const evaluation = useMemo(
    () => evaluatePassword(password, { email }),
    [password, email],
  );

  return {
    failures: evaluation.failures,
    isValid: evaluation.isValid,
    isStrong: evaluation.isStrong,
    canSubmit: evaluation.isValid,
  };
}

interface PasswordRequirementsProps {
  id: string;
  password: string;
  check: PasswordCheck;
}

// Checklist yêu cầu mật khẩu — thiết kế theo mẫu đã thành chuẩn (Stripe/GitHub):
// yêu cầu CHƯA đạt ở màu trung tính, KHÔNG phải đỏ. Đỏ ngay từ ký tự gõ đầu tiên dí
// người dùng bằng màu báo lỗi trong lúc họ còn đang gõ dở — 4 dòng cùng đỏ một lúc
// chỉ gây choáng, không giúp họ biết phải sửa gì trước. "Đạt hay chưa" đã có ĐỦ 2 tín
// hiệu không phải màu: hình khối icon khác nhau (chấm tròn rỗng ↔ dấu tick trong khối
// đặc) và dòng sr-only cho screen reader.
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
    </div>
  );
}
