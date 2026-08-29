// Đọc token thời lượng thật từ tokens.css thay vì hard-code lại số ms — cùng
// nguồn với CSS, đúng nguyên tắc "một nơi định nghĩa" của design-system.md.
// Tách ra từ ReadingStage.tsx (nơi định nghĩa gốc) để các component mới
// (trang chủ, PackagePicker...) dùng chung thay vì copy lại hàm.
//
// BUG THẬT phát hiện 2026-08-27 (design-review, verify bằng Playwright):
// Chromium chuẩn hoá computed value của custom property kiểu <time> về giây
// khi đọc qua getComputedStyle — token viết `1100ms` trong tokens.css nhưng
// `getPropertyValue` trả về `"1.1s"`, không phải `"1100ms"`. `parseFloat`
// đơn thuần lấy `1.1` (bỏ qua đơn vị) → mọi animation dùng hàm này chạy
// nhanh hơn dự định ~1000 lần (gần như tức thời) — ngược hẳn ý định "mượt".
// Đã tồn tại từ bản gốc (khi hàm còn nằm trong ReadingStage.tsx), không
// phải lỗi mới, nhưng phải sửa vì `FadeIn.tsx` (Layer 2 calestial-redesign)
// và `ReadingStage.tsx` (quick-read-card-spread) đều phụ thuộc trực tiếp
// vào hàm này để tạo cảm giác animation mượt.
export function motionMs(varName: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const match = raw.match(/^(-?[\d.]+)(ms|s)?$/);
  if (!match) return fallback;
  const n = parseFloat(match[1]);
  if (!Number.isFinite(n)) return fallback;
  return match[2] === "s" ? n * 1000 : n;
}
