"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Ornament {
  /** % từ trái/trên, không phải px — co giãn tự nhiên theo parent */
  x: number;
  y: number;
  size: number;
  kind: "star" | "dot";
  /** giây, lệch pha nhấp nháy giữa các điểm */
  delay: number;
}

// Toạ độ cố định (không Math.random()) — tránh lệch giữa server/client render
// (hydration mismatch) và tránh layout "nhảy" giữa các lần re-render.
const SPARSE: Ornament[] = [
  { x: 6, y: 18, size: 14, kind: "star", delay: 0 },
  { x: 92, y: 12, size: 10, kind: "dot", delay: 0.6 },
  { x: 14, y: 78, size: 10, kind: "dot", delay: 1.1 },
  { x: 88, y: 70, size: 16, kind: "star", delay: 0.3 },
  { x: 50, y: 92, size: 8, kind: "dot", delay: 1.6 },
];

const NORMAL: Ornament[] = [
  ...SPARSE,
  { x: 24, y: 40, size: 8, kind: "dot", delay: 0.9 },
  { x: 70, y: 30, size: 12, kind: "star", delay: 1.3 },
  { x: 38, y: 8, size: 8, kind: "dot", delay: 0.2 },
  { x: 60, y: 85, size: 10, kind: "dot", delay: 1.8 },
  { x: 8, y: 50, size: 12, kind: "star", delay: 2.1 },
];

function StarShape({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--color-accent)">
      <path d="M12 0c0 6.5 2 10.5 8 12-6 1.5-8 5.5-8 12 0-6.5-2-10.5-8-12 6-1.5 8-5.5 8-12Z" />
    </svg>
  );
}

function DotShape({ size }: { size: number }) {
  return (
    <span
      className="block rounded-full"
      style={{ width: size, height: size, background: "var(--color-accent)" }}
    />
  );
}

// Họa tiết trang trí thuần (sao 4 cánh + chấm), lấy cảm hứng từ ornament của
// Calestial. `aria-hidden` + `pointer-events-none` — không mang thông tin,
// không chặn tương tác với nội dung bên dưới. Parent cần `position: relative`
// để `absolute inset-0` neo đúng chỗ.
//
// Nhấp nháy vô hạn PHẢI tắt hẳn dưới reduced-motion — không chỉ rút ngắn
// duration như các token --motion-*, vì một animation lặp vô hạn dù nhanh
// đến đâu vẫn là chuyển động liên tục mà một số người dùng cần tắt hoàn toàn.
export function StarField({ density = "normal" }: { density?: "sparse" | "normal" }) {
  const reducedMotion = useReducedMotion();
  const items = density === "sparse" ? SPARSE : NORMAL;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          initial={{ opacity: 0.6 }}
          animate={reducedMotion ? undefined : { opacity: [0.35, 0.9, 0.35] }}
          transition={
            reducedMotion
              ? undefined
              : {
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: item.delay,
                }
          }
        >
          {item.kind === "star" ? <StarShape size={item.size} /> : <DotShape size={item.size} />}
        </motion.div>
      ))}
    </div>
  );
}
