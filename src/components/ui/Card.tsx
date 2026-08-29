import type { ElementType, HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "article";
  variant?: "default" | "highlighted";
  children?: ReactNode;
}

// Hợp nhất markup card đang lặp lại thủ công ở PackagePicker/ResultPanel
// (bg-surface-raised + rounded-lg + border/shadow theo elevation). Layout
// ngoài (margin, grid gap) vẫn do parent quyết định — component chỉ set
// spacing/border/shadow nội bộ, đúng design-system.md "Layout belongs to
// the parent".
//
// `--border-width-thick` đã có sẵn trong tokens.css từ Giai đoạn 2 nhưng
// chưa từng dùng trong src/ — đây là consumer thật đầu tiên, không phải
// token mới.
export function Card({
  as = "div",
  variant = "default",
  className = "",
  style,
  children,
  ...props
}: CardProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      className={[
        "rounded-lg bg-surface-raised p-5",
        variant === "highlighted" ? "shadow-glow" : "shadow-md",
        className,
      ].join(" ")}
      style={{
        border:
          variant === "highlighted"
            ? "var(--border-width-thick) solid var(--color-accent)"
            : "var(--elevation-border, 1px solid transparent)",
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
