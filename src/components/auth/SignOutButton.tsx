"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// Đăng xuất khỏi một phiên ẩn danh KHÔNG phải là đăng xuất — đó là xoá tài
// khoản. Phiên ẩn danh chỉ tồn tại trong cookie của trình duyệt này: không
// email, không mật khẩu, không đường đăng nhập lại. Bấm "Thoát" là mất vĩnh
// viễn credits đã trả tiền và mọi luận giải đã mua, không có cách nào phục hồi.
//
// Nên với ẩn danh, nút này phải hỏi lại và nói rõ hậu quả. Với tài khoản thật,
// đăng xuất vô hại như cũ — không bắt họ xác nhận một việc có thể hoàn tác.

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmHeadingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setIsAnonymous(data.user?.is_anonymous ?? false);
      })
      .catch(() => {
        // Không biết chắc là ẩn danh hay không thì coi như tài khoản thật:
        // hỏi lại một người đã có tài khoản chỉ gây khó chịu, còn đoán sai
        // theo hướng ngược lại thì không cứu được ai.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cảnh báo xuất hiện không kèm chuyển trang — screen reader phải được đọc nó,
  // không chỉ người nhìn thấy nó.
  useEffect(() => {
    if (isConfirming) confirmHeadingRef.current?.focus();
  }, [isConfirming]);

  async function signOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function handleClick() {
    if (isAnonymous && !isConfirming) {
      setIsConfirming(true);
      return;
    }
    void signOut();
  }

  if (isConfirming) {
    return (
      <div
        role="alertdialog"
        aria-labelledby="signout-warning"
        className="flex flex-col gap-3 rounded-xl border border-[#f0605f]/40 bg-[#f0605f]/10 p-4"
      >
        <p
          id="signout-warning"
          ref={confirmHeadingRef}
          tabIndex={-1}
          className="flex items-start gap-2 text-xs leading-relaxed text-[#f3ece1] focus:outline-none"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f0605f]" aria-hidden="true" />
          <span>
            Bạn đang dùng phiên khách, chưa có tài khoản. Thoát ra là{" "}
            <strong>mất vĩnh viễn</strong> số Credits đã mua và các luận giải đã
            thanh toán — không có cách nào lấy lại. Hãy tạo tài khoản trước nếu
            bạn muốn giữ chúng.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setIsConfirming(false)}>
            Quay lại
          </Button>
          <Button variant="ghost" onClick={handleClick} disabled={isSigningOut}>
            {isSigningOut ? "Đang thoát…" : "Vẫn thoát và xoá phiên"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="ghost" onClick={handleClick} disabled={isSigningOut}>
      {isSigningOut ? "Đang đăng xuất…" : "Đăng xuất"}
    </Button>
  );
}
