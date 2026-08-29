"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "confirming" | "deleting" | "error";

// 06-bao-mat-kiem-duyet-phap-ly.md §4.4 — xoá profiles + readings, gỡ PII
// khỏi auth.users (xem src/app/api/account/route.ts), giữ orders/
// credit_ledger vì lý do nghĩa vụ tài chính (đã ghi rõ ở bước xác nhận dưới
// đây, đúng yêu cầu "phải ghi rõ" của spec).
export function DeleteAccountButton() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleConfirm() {
    setStatus("deleting");
    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (status === "confirming" || status === "deleting" || status === "error") {
    return (
      <div className="p-5 rounded-2xl bg-[#f0605f]/10 border border-[#f0605f]/40">
        <p className="text-xs sm:text-sm text-[#f0605f] mb-4 leading-relaxed">
          Hành động này sẽ xoá vĩnh viễn hồ sơ và toàn bộ lịch sử trải bài của
          bạn, đồng thời vô hiệu hoá tài khoản này. Credits còn lại sẽ mất và
          không được hoàn. Lịch sử giao dịch nạp credits vẫn được lưu (nghĩa
          vụ tài chính) nhưng không còn gắn với thông tin cá nhân của bạn.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            disabled={status === "deleting"}
            className="px-4 py-2 rounded-xl bg-[#f0605f] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#d94c4b] transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {status === "deleting" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang xoá…
              </>
            ) : (
              "Xác nhận xoá tài khoản"
            )}
          </button>
          <button
            onClick={() => setStatus("idle")}
            disabled={status === "deleting"}
            className="px-4 py-2 rounded-xl text-[#b3a48d] text-xs font-semibold hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            Huỷ
          </button>
        </div>
        {status === "error" && (
          <p role="alert" className="mt-3 text-xs text-[#f0605f]">
            Không xoá được tài khoản. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setStatus("confirming")}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#f0605f]/40 text-[#f0605f] text-xs font-semibold uppercase tracking-wider hover:bg-[#f0605f]/10 transition-colors cursor-pointer"
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      Xoá tài khoản
    </button>
  );
}
