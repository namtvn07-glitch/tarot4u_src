"use client";

import React, { useId, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  /** id của khối mô tả yêu cầu mật khẩu, để screen reader đọc kèm ô nhập. */
  describedBy?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Nội dung phụ nằm cạnh label (vd. link "Quên mật khẩu?"). */
  labelAside?: React.ReactNode;
}

// Ô nhập mật khẩu dùng chung cho cả 3 lối vào (đăng ký, đổi, đặt lại) — gom vào một
// chỗ để nút hiện/ẩn, autocomplete và phần a11y không bị làm lại ba kiểu khác nhau.
// Cố ý KHÔNG chặn dán: chặn dán là bắt người dùng bỏ trình quản lý mật khẩu.
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  describedBy,
  disabled = false,
  required = true,
  placeholder = "••••••••",
  labelAside,
}: PasswordFieldProps) {
  const inputId = useId();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-1 gap-2">
        <label htmlFor={inputId} className="text-[11px] font-semibold text-[#b3a48d]">
          {label}
        </label>
        {labelAside}
      </div>

      <div className="relative">
        <Lock className="w-4 h-4 text-[#7a6e5d] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          placeholder={placeholder}
          className="w-full min-h-[44px] bg-[#0e0a08] border border-[#3d3123] rounded-xl pl-9 pr-11 py-2 text-xs text-[#f3ece1] placeholder:text-[#7a6e5d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setIsVisible((previous) => !previous)}
          aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={isVisible}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#7a6e5d] hover:text-[#f3ece1] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37] rounded-lg cursor-pointer"
        >
          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
