"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { motionMs } from "@/lib/motion";

// Entrance fade+slide dùng chung cho nội dung tĩnh (Hero, card gói credits,
// card "vì sao chọn"...) — tránh mỗi nơi tự viết lại motion.div. Dưới
// reduced-motion, render thẳng nội dung không qua motion.div — không chỉ rút
// ngắn duration, vì `initial`/`animate` vẫn ngụ ý có chuyển động dù nhanh.
export function FadeIn({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionMs("--motion-slow", 400) / 1000,
        delay,
        ease: [0.2, 0, 0, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
