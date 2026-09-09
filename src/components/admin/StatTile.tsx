import type { ReactNode } from "react";
import * as S from "./styles";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "warning" | "danger";
}

const TONE_STYLE = {
  default: {},
  accent: S.accentText,
  warning: S.warningText,
  danger: S.dangerText,
} as const;

export function StatTile({ label, value, hint, tone = "default" }: StatTileProps) {
  return (
    <div className="rounded-lg p-5" style={S.surface}>
      <p className="m-0" style={S.textMuted}>
        {label}
      </p>
      <p
        className="mt-2 mb-0 font-semibold"
        style={{
          ...S.heading2,
          ...TONE_STYLE[tone],
          // Số dài (doanh thu VND) không được tràn ra khỏi ô ở 375px.
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 mb-0" style={S.textDim}>
          {hint}
        </p>
      )}
    </div>
  );
}
