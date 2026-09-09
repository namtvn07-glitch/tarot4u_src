"use client";

import React, { useRef } from "react";
import { Sparkles } from "lucide-react";
import { useEscapeAndTabTrap, useFocusTrap } from "@/lib/useModalA11y";

interface UnsavedDeepSessionModalProps {
  isOpen: boolean;
  onStay: () => void;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
}

export const UnsavedDeepSessionModal: React.FC<UnsavedDeepSessionModalProps> = ({
  isOpen,
  onStay,
  onSaveAndLeave,
  onDiscardAndLeave,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(isOpen, containerRef);
  useEscapeAndTabTrap(isOpen, containerRef, onStay);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-deep-session-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        ref={containerRef}
        className="bg-[#15100b] border-2 border-[#d4af37]/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col items-center text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/40 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-[#d4af37]" />
        </div>
        <h3
          id="unsaved-deep-session-title"
          className="font-display text-xl sm:text-2xl text-white font-bold mb-2"
        >
          Lưu Tạm Phiên Trải Bài?
        </h3>
        <p className="text-xs sm:text-sm text-[#b3a48d] leading-relaxed mb-6 font-body">
          Bạn đang rời khỏi phiên trải bài sâu dở dang. Chọn "Lưu tạm" để giữ nguyên 3 lá và câu
          hỏi cho lần sau, hoặc "Không lưu" để bắt đầu lại từ đầu khi quay lại Trải Bài Sâu.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={onStay}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:from-[#d4af37] hover:to-[#8f5a1f] hover:text-[#050505] transition-all"
          >
            Ở Lại Tiếp Tục
          </button>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onSaveAndLeave}
              className="flex-1 py-3 rounded-xl bg-[#1c1611] border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#8f5a1f]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
            >
              Lưu Tạm & Rời Đi
            </button>
            <button
              type="button"
              onClick={onDiscardAndLeave}
              className="flex-1 py-3 rounded-xl bg-[#1c1611] border border-[#3d3123] text-[#b3a48d] hover:text-[#f0605f] hover:border-[#f0605f]/40 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
            >
              Không Lưu, Rời Đi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
