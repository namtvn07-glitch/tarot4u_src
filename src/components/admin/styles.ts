import type { CSSProperties } from "react";

// Vì sao inline style thay vì class Tailwind:
// tokens.css khai báo token trong `:root`, nhưng Tailwind v4 chỉ sinh utility
// từ khối `@theme` — repo không có khối đó, nên `bg-surface-raised`,
// `text-text-muted`, `text-body-sm`... KHÔNG sinh ra CSS nào (đã kiểm chứng
// bằng chính file CSS dev server phục vụ: 0 lần xuất hiện, trong khi `.flex`,
// `.rounded-lg`, `.p-5` đều có).
//
// Đây vẫn là "dùng token, không dùng magic number" — chỉ là đường dẫn tới
// token phải qua var() trực tiếp thay vì qua class utility.
// Khi nào repo thêm `@theme` thì thay các object này bằng class là xong.

export const surface: CSSProperties = {
  background: "var(--color-surface-raised)",
  border: "1px solid var(--color-border)",
};

export const surfaceSunken: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
};

export const textBody: CSSProperties = {
  color: "var(--color-text)",
  fontSize: "var(--text-body-size)",
  lineHeight: "var(--text-body-line)",
};

export const textSmall: CSSProperties = {
  fontSize: "var(--text-body-sm-size)",
  lineHeight: "var(--text-body-sm-line)",
};

export const textMuted: CSSProperties = {
  color: "var(--color-text-muted)",
  fontSize: "var(--text-body-sm-size)",
  lineHeight: "var(--text-body-sm-line)",
};

export const textDim: CSSProperties = {
  color: "var(--color-text-dim)",
  fontSize: "var(--text-body-sm-size)",
};

export const heading1: CSSProperties = {
  color: "var(--color-text)",
  fontSize: "var(--text-heading-1-size)",
  lineHeight: "var(--text-heading-1-line)",
};

export const heading2: CSSProperties = {
  color: "var(--color-text)",
  fontSize: "var(--text-heading-2-size)",
  lineHeight: "var(--text-heading-2-line)",
};

export const heading3: CSSProperties = {
  color: "var(--color-text)",
  fontSize: "var(--text-heading-3-size)",
  lineHeight: "var(--text-heading-3-line)",
};

export const accentText: CSSProperties = { color: "var(--color-accent)" };
export const dangerText: CSSProperties = { color: "var(--color-danger)" };
export const successText: CSSProperties = { color: "var(--color-success)" };
export const warningText: CSSProperties = { color: "var(--color-warning)" };

export const input: CSSProperties = {
  background: "var(--color-surface)",
  borderColor: "var(--color-border-interactive)",
  color: "var(--color-text)",
  fontSize: "var(--text-body-size)",
};

export const tableHeaderCell: CSSProperties = {
  color: "var(--color-text-muted)",
  fontSize: "var(--text-body-sm-size)",
  borderBottom: "1px solid var(--color-border)",
  textAlign: "left",
};

export const tableCell: CSSProperties = {
  color: "var(--color-text)",
  fontSize: "var(--text-body-sm-size)",
  borderBottom: "1px solid var(--color-border)",
};
