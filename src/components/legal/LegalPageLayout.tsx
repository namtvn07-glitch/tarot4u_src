import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  updatedAt = "29/08/2026",
  children,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-12 flex flex-col gap-6 relative z-10">
      <Link
        href="/"
        className="self-start flex items-center gap-2 text-xs font-semibold text-[#b3a48d] hover:text-[#d4af37] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Trang Chủ</span>
      </Link>

      <div className="bg-[#15100b] border border-[#3d3123] rounded-3xl p-6 sm:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
        <div className="border-b border-[#3d3123] pb-6 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            <span>Pháp Lý & Chính Sách</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white font-bold mb-1">
            {title}
          </h1>
          <p className="text-xs text-[#7a6e5d] font-mono">
            Cập nhật lần cuối: {updatedAt}
          </p>
        </div>

        <div className="space-y-6 text-[#f3ece1]/90 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};
