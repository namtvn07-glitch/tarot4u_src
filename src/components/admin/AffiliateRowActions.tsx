"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildAffiliateUrl, readStoredDomain } from "@/lib/affiliate-domain";
import * as S from "./styles";

type Busy = null | "toggle" | "delete";

export function AffiliateRowActions({
  code,
  isActive,
  siteUrl,
  hasSignups,
  destinationPath,
}: {
  code: string;
  isActive: boolean;
  siteUrl: string;
  hasSignups: boolean;
  destinationPath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [domain, setDomain] = useState(siteUrl);

  // Đọc sau khi mount: cùng tên miền mà form đang dùng, để nút chép ở đây không
  // ra địa chỉ khác với link vừa tạo ở trên.
  // localStorage chỉ có ở trình duyệt, nên phép đọc này BẮT BUỘC nằm sau khi
  // mount — đọc lúc render thì HTML server và lần render đầu ở client lệch
  // nhau (hydration mismatch). Ngoại lệ đúng của quy tắc.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDomain(readStoredDomain(siteUrl));
  }, [siteUrl]);

  const url = buildAffiliateUrl(domain, destinationPath, code);

  async function send(method: "PATCH" | "DELETE", body: unknown, kind: Busy) {
    setBusy(kind);
    setMessage(null);
    const response = await fetch("/api/admin/affiliate-links", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error ?? "Không thực hiện được.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard (thường vì không chạy https) — hiện link ra
      // để người dùng bôi đen chép tay, thay vì báo lỗi cụt lủn.
      setMessage(url);
    }
  }

  const buttonStyle = {
    ...S.textSmall,
    color: "var(--color-text)",
    borderColor: "var(--color-border-interactive)",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Chép link của mã ${code}`}
          className="inline-flex min-h-[44px] items-center rounded-md border px-3"
          style={buttonStyle}
        >
          {copied ? "Đã chép ✓" : "Chép link"}
        </button>

        <button
          type="button"
          onClick={() => send("PATCH", { code, is_active: !isActive }, "toggle")}
          disabled={busy !== null}
          aria-label={`${isActive ? "Tắt" : "Bật"} link ${code}`}
          className="inline-flex min-h-[44px] items-center rounded-md border px-3 disabled:opacity-50"
          style={buttonStyle}
        >
          {busy === "toggle" ? "…" : isActive ? "Tắt" : "Bật"}
        </button>

        {/* Link đã có người đăng ký thì KHÔNG cho xoá: xoá là mất luôn nguồn của
            những người đó (ràng buộc on delete set null), tức là phá số liệu
            lịch sử. Muốn ngừng dùng thì tắt. */}
        {hasSignups ? (
          <span style={{ ...S.textDim, alignSelf: "center" }}>
            Đã có người đăng ký — chỉ tắt được, không xoá
          </span>
        ) : confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={async () => {
                const ok = await send("DELETE", { code }, "delete");
                if (!ok) setConfirmingDelete(false);
              }}
              disabled={busy !== null}
              className="inline-flex min-h-[44px] items-center rounded-md border px-3 font-semibold disabled:opacity-50"
              style={{
                ...S.textSmall,
                background: "var(--color-danger)",
                color: "var(--color-on-accent)",
                borderColor: "transparent",
              }}
            >
              {busy === "delete" ? "Đang xoá…" : `Xoá hẳn ${code}?`}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="inline-flex min-h-[44px] items-center rounded-md border px-3"
              style={buttonStyle}
            >
              Huỷ
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            aria-label={`Xoá link ${code}`}
            className="inline-flex min-h-[44px] items-center rounded-md border px-3"
            style={{ ...S.textSmall, ...S.dangerText, borderColor: "var(--color-border)" }}
          >
            Xoá
          </button>
        )}
      </div>

      {message && (
        <p role="alert" className="m-0 break-all" style={{ ...S.textSmall, ...S.warningText }}>
          {message}
        </p>
      )}
    </div>
  );
}
