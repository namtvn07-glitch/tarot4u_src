"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  AFFILIATE_DOMAIN_STORAGE_KEY,
  buildAffiliateUrl,
  isTestDomain,
  readStoredDomain,
} from "@/lib/affiliate-domain";
import * as S from "./styles";

type Status = "idle" | "submitting" | "error" | "done";

// Chỉ liệt kê trang CÔNG KHAI. Cố ý không có /nap-credits và /tai-khoan: hai
// route đó nằm trong PROTECTED_PREFIXES nên khách chưa đăng nhập bấm vào sẽ bị
// đá thẳng sang trang đăng nhập — hỏng trải nghiệm của một link quảng cáo
// (attribution thì vẫn giữ được, nhưng người ta rơi mất trước khi kịp xem gì).
const LANDING_PAGES = [
  { path: "/", label: "Trang chủ" },
  { path: "/doc-sau", label: "Đọc sâu" },
  { path: "/trai-bai", label: "Trải bài" },
  { path: "/thu-vien", label: "Thư viện 78 lá" },
] as const;

const CUSTOM_PATH = "__custom__";

export function CreateAffiliateLinkForm({ siteUrl }: { siteUrl: string }) {
  const router = useRouter();
  const codeId = useId();
  const labelId = useId();
  const pathId = useId();
  const domainId = useId();

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [path, setPath] = useState<string>("/");
  const [isCustomPath, setIsCustomPath] = useState(false);
  // Tên miền dùng để ghép link. Mặc định lấy từ cấu hình hệ thống, nhưng cho
  // sửa được: khi đang chạy trên máy thử nghiệm, người dùng vẫn phải tạo được
  // link thật để đưa cho bên chạy quảng cáo.
  const [domain, setDomain] = useState(siteUrl);

  // Nhớ tên miền đã gõ cho lần sau, để không phải sửa lại mỗi lần tạo link.
  // Chỉ là tiện ích của riêng trình duyệt này, mất cũng không sao.
  useEffect(() => {
    try {
      setDomain(readStoredDomain(siteUrl));
    } catch {
      // Trình duyệt chặn lưu trữ — bỏ qua, dùng giá trị mặc định.
    }
  }, [siteUrl]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Đường dẫn đích CỐ Ý không lưu vào database: middleware bắt `?ref=` trên mọi
  // route, nên nó chỉ ảnh hưởng chuỗi URL đem đi dán quảng cáo. Thêm một cột
  // vào bảng cho một tiện ích hiển thị là không đáng.
  function buildUrl(forCode: string) {
    return buildAffiliateUrl(domain, path, forCode);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    setCopied(false);

    const response = await fetch("/api/admin/affiliate-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, label: label || undefined }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setErrorMessage(body?.error ?? "Không tạo được link. Thử lại sau.");
      setStatus("error");
      return;
    }

    setCreatedUrl(buildUrl(code));
    setStatus("done");
    setCode("");
    setLabel("");
    router.refresh();
  }

  async function handleCopy() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
    } catch {
      // Trình duyệt chặn clipboard (thường vì không phải https): người dùng vẫn
      // bôi đen chép tay được từ ô bên cạnh, nên không cần báo lỗi ồn ào.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg p-5" style={S.surface}>
      <h2 className="mt-0 mb-4" style={S.heading3}>
        Tạo link affiliate
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={domainId} className="font-semibold" style={S.textSmall}>
            Tên miền
          </label>
          <input
            id={domainId}
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value);
              try {
                window.localStorage.setItem(AFFILIATE_DOMAIN_STORAGE_KEY, event.target.value);
              } catch {
                // Không lưu được thì thôi, chỉ là tiện ích ghi nhớ.
              }
            }}
            placeholder="https://tenmiencuaban.com"
            className="min-h-[44px] rounded-md border px-4 py-2"
            style={S.input}
            aria-describedby={`${domainId}-hint`}
          />
          {isTestDomain(domain) ? (
            <span
              id={`${domainId}-hint`}
              role="alert"
              className="font-semibold"
              style={{ ...S.textSmall, ...S.warningText }}
            >
              ⚠ Đây là địa chỉ thử nghiệm. Link tạo ra sẽ không ai vào được —
              sửa thành tên miền thật trước khi đưa cho bên chạy quảng cáo.
            </span>
          ) : (
            <span id={`${domainId}-hint`} style={S.textDim}>
              Địa chỉ trang web của bạn. Nhớ cho lần sau.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={codeId} className="font-semibold" style={S.textSmall}>
            Mã link
          </label>
          <input
            id={codeId}
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            pattern="[A-Za-z0-9_\-]{3,32}"
            placeholder="tiktok-thang-9"
            className="min-h-[44px] rounded-md border px-4 py-2"
            style={S.input}
            aria-describedby={`${codeId}-hint`}
          />
          <span id={`${codeId}-hint`} style={S.textDim}>
            Tên riêng để nhận ra chiến dịch này. Không dấu, không khoảng trắng.
            Đặt xong không sửa được.
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={labelId} className="font-semibold" style={S.textSmall}>
            Ghi chú (tuỳ chọn)
          </label>
          <input
            id={labelId}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Chiến dịch TikTok tháng 9"
            className="min-h-[44px] rounded-md border px-4 py-2"
            style={S.input}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={pathId} className="font-semibold" style={S.textSmall}>
            Trang đích
          </label>
          <select
            id={pathId}
            value={isCustomPath ? CUSTOM_PATH : path}
            onChange={(event) => {
              const value = event.target.value;
              if (value === CUSTOM_PATH) {
                setIsCustomPath(true);
                setPath("/");
              } else {
                setIsCustomPath(false);
                setPath(value);
              }
            }}
            className="min-h-[44px] rounded-md border px-4 py-2"
            style={S.input}
            aria-describedby={`${pathId}-hint`}
          >
            {LANDING_PAGES.map((page) => (
              <option key={page.path} value={page.path}>
                {page.label}
              </option>
            ))}
            <option value={CUSTOM_PATH}>Trang khác…</option>
          </select>

          {isCustomPath && (
            <>
              <label htmlFor={`${pathId}-custom`} className="sr-only">
                Đường dẫn tự nhập
              </label>
              <input
                id={`${pathId}-custom`}
                value={path}
                onChange={(event) => setPath(event.target.value)}
                placeholder="/ten-duong-dan"
                className="mt-1 min-h-[44px] rounded-md border px-4 py-2"
                style={S.input}
              />
            </>
          )}

          <span id={`${pathId}-hint`} style={S.textDim}>
            Người bấm link sẽ vào thẳng trang này. Chọn trang khớp với nội dung
            quảng cáo thì tỉ lệ ở lại cao hơn là thả vào trang chủ.
          </span>
        </div>

        {/* Xem trước ngay lúc gõ: người dùng thấy được ô "Trang đích" ảnh hưởng
            gì tới link, không phải đoán rồi tạo xong mới biết. */}
        {code.trim() !== "" && (
          <p className="m-0 break-all" style={S.textDim}>
            Link sẽ là: <span style={S.accentText}>{buildUrl(code.trim())}</span>
          </p>
        )}

        {status === "error" && errorMessage && (
          <p role="alert" className="m-0" style={{ ...S.textSmall, ...S.dangerText }}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border px-5 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-on-accent)",
            borderColor: "transparent",
          }}
        >
          {status === "submitting" ? "Đang tạo…" : "Tạo link"}
        </button>
      </form>

      {status === "done" && createdUrl && (
        // aria-live: người dùng screen reader phải biết link đã tạo xong mà
        // không cần tự đi dò lại trang.
        <div aria-live="polite" className="mt-4">
          <p className="mt-0 mb-2" style={{ ...S.textSmall, ...S.successText }}>
            ✓ Đã tạo link
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="created-affiliate-url" className="sr-only">
              Link affiliate vừa tạo
            </label>
            <input
              id="created-affiliate-url"
              readOnly
              value={createdUrl}
              className="min-h-[44px] flex-1 rounded-md border px-4 py-2"
              style={{ ...S.input, minWidth: "240px" }}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[44px] items-center rounded-md border px-4 py-2"
              style={{
                ...S.textSmall,
                color: "var(--color-text)",
                borderColor: "var(--color-border-interactive)",
              }}
            >
              {copied ? "Đã chép ✓" : "Chép link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
