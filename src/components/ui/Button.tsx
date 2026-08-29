import { forwardRef, type ButtonHTMLAttributes } from "react";

// Port của `.btn`/`.btn--primary`/`.btn--ghost` (production/components.css) —
// dùng chung cho mọi nút bấm thật đầu tiên của app (TopicPicker, ReadingStage).
// Thêm khi cả 2 chỗ đó cần cùng style thay vì lặp class string.
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

// disabled:opacity-50 already dims the whole button below, so a plain
// `hover:` (no `not-disabled:` compound) is enough — the dimmed/cursor-not-allowed
// state already reads as non-interactive without relying on an extra variant.
// danger: --color-danger has no "-strong" hover token (unlike accent), so
// hover keeps the same background — active:translate-y-px below still gives
// press feedback. Contrast (on-accent text / danger bg) hand-verified in
// Giai đoạn 5 plan: 5.89:1 dark, 6.54:1 light — not in the original
// production/contrast-audit.md because no prototype ever used this pairing.
const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong",
  ghost:
    "bg-transparent text-text border-border-interactive hover:bg-surface-raised",
  danger: "bg-danger text-on-accent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", type = "button", style, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // min-h/w-[44px]: WCAG 2.5.5 touch-target floor (accessibility.md), not
      // part of the 8-step spacing ramp — one-off value, named exception per
      // design-system.md "single exception" rule.
      // transitionDuration/-TimingFunction via inline style, not Tailwind's
      // duration-*/ease-* utilities: keeps --motion-fast/--ease-standard as
      // the single source (see src/app/globals.css comment on motion tokens).
      className={[
        // Native `disabled` blocks pointer interaction entirely, so `:active`
        // never fires on a disabled button — no `not-disabled:` compound needed.
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md border border-transparent px-5 py-3 text-body font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
        VARIANT_CLASS[variant],
        className,
      ].join(" ")}
      style={{
        transitionDuration: "var(--motion-fast)",
        transitionTimingFunction: "var(--ease-standard)",
        ...style,
      }}
      {...props}
    />
  );
});
