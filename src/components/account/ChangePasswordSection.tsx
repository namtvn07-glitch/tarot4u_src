"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, KeyRound, X } from "lucide-react";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { useEscapeAndTabTrap, useFocusTrap } from "@/lib/useModalA11y";

type Capability = "loading" | "available" | "unavailable";

// Mục "Bảo mật" của trang tài khoản: một nút, và form chỉ xuất hiện trong popup khi
// người dùng thật sự muốn đổi. Ba ô mật khẩu phơi sẵn giữa trang tài khoản vừa chiếm
// chỗ vừa gợi ý sai rằng đó là việc phải làm.
export function ChangePasswordSection({ email }: { email: string }) {
  const [capability, setCapability] = useState<Capability>("loading");
  const [isOpen, setIsOpen] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const titleId = useId();

  const closeDialog = useCallback(() => setIsOpen(false), []);
  useFocusTrap(isOpen, dialogRef);
  useEscapeAndTabTrap(isOpen, dialogRef, closeDialog);

  useEffect(() => {
    let isActive = true;
    fetch("/api/account/password")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!isActive) return;
        setCapability(data?.canChangePassword ? "available" : "unavailable");
      })
      .catch(() => {
        if (isActive) setCapability("unavailable");
      });
    return () => {
      isActive = false;
    };
  }, []);

  // Modal đóng lại rồi thì thông báo thành công phải nằm ở trang — nếu không, người
  // dùng không có gì xác nhận việc vừa xảy ra.
  useEffect(() => {
    if (isDone) doneRef.current?.focus();
  }, [isDone]);

  // Khoá cuộn trang nền trong lúc modal mở — thiếu bước này thì trang phía sau vẫn
  // cuộn được dưới lớp phủ, dễ gây cảm giác nội dung trang "trồi lên" quanh modal.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (capability === "loading") {
    return (
      <div className="h-11 w-48 max-w-full rounded-xl bg-[#251d16] animate-pulse" role="status">
        <span className="sr-only">Đang kiểm tra thiết lập bảo mật của tài khoản…</span>
      </div>
    );
  }

  // Tài khoản Google/magic link không có mật khẩu để đổi — không hiện gì thay vì một
  // nút mở ra form luôn báo lỗi.
  if (capability === "unavailable") return null;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            setIsDone(false);
            setIsOpen(true);
          }}
          className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-[#3d3123] text-[#f3ece1] text-xs font-semibold uppercase tracking-wider hover:border-[#d4af37]/60 hover:bg-[#251d16] transition-colors cursor-pointer self-start"
        >
          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
          Đổi mật khẩu
        </button>
        <p className="text-[11px] text-[#b3a48d] leading-relaxed max-w-sm">
          Cần mật khẩu hiện tại để xác nhận.
        </p>
      </div>

      {isDone && (
        <p
          ref={doneRef}
          tabIndex={-1}
          role="status"
          className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#5fbf8c]/10 border border-[#5fbf8c]/40 text-[#5fbf8c] text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5fbf8c]"
        >
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Đã đổi mật khẩu thành công. Lần đăng nhập sau hãy dùng mật khẩu mới.</span>
        </p>
      )}

      {isOpen &&
        createPortal(
          // Portal thẳng vào <body> — không còn là con cháu của bất kỳ phần tử nào
          // trong trang. `<body>` (layout.tsx) có `relative overflow-x-hidden`, và
          // nói chung BẤT KỲ tổ tiên nào của modal sau này lỡ thêm transform/filter/
          // contain đều có thể biến `position: fixed` thành "fixed theo tổ tiên đó"
          // thay vì theo viewport — modal render sâu trong AccountScreen từng dính
          // đúng kiểu rủi ro này. Portal loại bỏ hẳn khả năng đó, vĩnh viễn, không
          // phụ thuộc CSS của bất kỳ ai render ra component này trong tương lai.
          //
          // Cố ý KHÔNG `flex items-center justify-center` ở outer: kết hợp căn giữa
          // bằng flex với `overflow-y-auto` là lỗi CSS kinh điển — khi hộp thoại cao
          // hơn viewport, trình duyệt đẩy phần tràn ra đều hai phía trên/dưới, nhưng
          // vùng cuộn chỉ tính từ điểm bắt đầu flex line nên phần tràn XUỐNG DƯỚI
          // (nút Huỷ/Đổi mật khẩu) không cách nào cuộn tới được. Căn giữa ngang bằng
          // `mx-auto` (không dính bug này) + margin cố định theo chiều dọc.
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative w-full max-w-md mx-auto my-4 sm:my-10 bg-[#15100b] border border-[#d4af37]/45 rounded-3xl p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.95)]"
            >
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Đóng"
                className="absolute right-3 top-3 w-10 h-10 flex items-center justify-center text-[#b3a48d] hover:text-[#d4af37] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <h2
                id={titleId}
                className="font-display text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6a3] via-[#d4af37] to-[#8f5a1f] pr-10 mb-1"
              >
                Đổi Mật Khẩu
              </h2>
              <p className="text-[11px] text-[#b3a48d] mb-5 leading-relaxed">
                Cho tài khoản <span className="text-[#f3ece1]">{email}</span>
              </p>

              <ChangePasswordForm
                email={email}
                onCancel={closeDialog}
                onSuccess={() => {
                  setIsOpen(false);
                  setIsDone(true);
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
