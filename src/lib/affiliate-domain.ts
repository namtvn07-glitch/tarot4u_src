"use client";

// Tên miền dùng để ghép link affiliate. Dùng chung giữa form tạo link và nút
// chép link ở từng dòng trong bảng — nếu mỗi nơi tự đọc một nguồn thì admin sẽ
// sửa tên miền ở form mà nút chép vẫn ra địa chỉ cũ.
export const AFFILIATE_DOMAIN_STORAGE_KEY = "admin-affiliate-domain";

// Địa chỉ chỉ dùng để thử, không bao giờ được đem đi chạy quảng cáo thật.
export function isTestDomain(url: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local(?::|\/|$)|vercel\.app/i.test(url);
}

export function normalizeDomain(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed === "") return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Tên miền admin đã tự đặt, hoặc giá trị cấu hình của hệ thống nếu chưa đặt. */
export function readStoredDomain(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(AFFILIATE_DOMAIN_STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function buildAffiliateUrl(
  domain: string,
  path: string,
  code: string,
): string {
  const base = normalizeDomain(domain);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}?ref=${code}`;
}
