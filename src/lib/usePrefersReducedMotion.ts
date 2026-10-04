"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Người dùng tắt chuyển động thì hiện luôn, không chờ nhịp animation — đường
// không-animation là yêu cầu bắt buộc của dự án (.claude/rules/accessibility.md).
// Server render trả false; client đọc giá trị thật ngay sau hydrate.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
