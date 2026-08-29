"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CardSpread, cardSizeForWidth, spacePx, type RevealedCard } from "@/components/reading/CardSpread";
import type { Topic } from "@/lib/reading";
import { motionMs } from "@/lib/motion";
import { ResultPanel, type ReadingResult } from "@/components/reading/ResultPanel";

// idle → shuffling (nhịp thuần client, không chờ mạng) → picking (trải
// QUICK_SPREAD_SLOTS lá, CardSpread tự lo bốc/bay/lật + báo lỗi tại chỗ nếu
// /api/reading fail — không còn "error" ở cấp state máy riêng, xem
// .claude/brain/quick-read-card-spread/) → success (ResultPanel fade vào,
// khu trải bài ẩn đi — KHÁC Đọc sâu, nơi CardSpreadPicker/ContextPanel không
// biến mất sau khi bốc đủ; ở đây `ResultPanel` đã tự có ảnh lá bài riêng, giữ
// spread hiện cùng lúc tạo ra 2 ảnh trùng lặp — xác nhận bằng ảnh chụp thật
// lúc verify, xem task.md § Deviations).
type Stage = "idle" | "shuffling" | "picking" | "success";

// Đọc sâu dùng 24 (`env.DEEP_SPREAD_SLOTS`) — Đọc nhanh miễn phí, không cần
// cảm giác "kho bài" hoành tráng như bản trả phí; 12 vẫn đủ cảm giác "tự
// chọn" mà nhẹ hơn ở 375px (ít hàng hơn, đỡ cuộn).
const QUICK_SPREAD_SLOTS = 12;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ReadingStage({ topic }: { topic: Topic }) {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ReadingResult | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const shufflingRef = useRef<HTMLParagraphElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useLayoutEffect(() => {
    if (stage !== "picking") return;
    const w = wrapRef.current?.clientWidth;
    if (w) setContainerWidth(w);
  }, [stage]);

  useEffect(() => {
    if (stage === "success") {
      const heading = document.getElementById("result-heading");
      heading?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      heading?.focus({ preventScroll: true });
    }
    // Bấm "Xáo bài" tháo hẳn nút đó khỏi DOM (unmount, không chỉ disable) —
    // nếu không dời focus đi đâu, nó rơi thẳng về <body>, buộc người dùng
    // bàn phím/trình đọc màn hình phải Tab lại từ đầu trang (design-review
    // 2026-08-27, phát hiện 🔴). Dời sang đúng text "Đang xáo bài…", cùng
    // pattern với `result-heading` bên dưới.
    if (stage === "shuffling") {
      shufflingRef.current?.focus({ preventScroll: true });
    }
  }, [stage, reducedMotion]);

  async function handleStart() {
    setStage("shuffling");
    // Nhịp xáo thuần client — nghi thức thương hiệu, KHÔNG chờ mạng (khác
    // bản cũ). RNG thật xảy ra lúc bốc lá (handlePick), không phải lúc này.
    const shuffleMs = reducedMotion ? 0 : motionMs("--motion-shuffle", 1100);
    await sleep(shuffleMs);
    setStage("picking");
  }

  async function handlePick(): Promise<RevealedCard> {
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) throw new Error("reading_failed");
    const data = (await res.json()) as ReadingResult;
    setResult(data);
    return {
      cardId: data.card.id,
      nameVi: data.card.nameVi,
      image: data.card.image,
      orientation: data.card.orientation,
      base: data.base,
    };
  }

  // 1 ô "bàn" duy nhất, căn giữa khung — khác Đọc sâu (3 ô, phải né panel
  // ngữ cảnh cố định bên phải), Đọc nhanh không có panel nào để né.
  const tableSlots = useMemo(() => {
    const tableCard = cardSizeForWidth(containerWidth, "table");
    const left = Math.max(spacePx("--space-3", 12), (containerWidth - tableCard.w) / 2);
    return [{ left, top: 0, rotate: 0 }];
  }, [containerWidth]);

  return (
    <div>
      {stage === "idle" && (
        <div className="flex flex-col items-center gap-5 py-6">
          <Button onClick={handleStart}>🎴 Xáo bài</Button>
        </div>
      )}

      {stage === "shuffling" && (
        <p
          ref={shufflingRef}
          tabIndex={-1}
          role="status"
          className="py-10 text-center text-body text-text-muted focus:outline-none"
        >
          {reducedMotion ? "Đang chuẩn bị…" : "Đang xáo bài…"}
        </p>
      )}

      {stage === "picking" && (
        <div ref={wrapRef} className="py-6">
          <CardSpread
            slots={QUICK_SPREAD_SLOTS}
            ariaLabel="Chọn 1 lá bài bất kỳ"
            containerWidth={containerWidth}
            tableSlots={tableSlots}
            onPick={handlePick}
            onAllPicked={() => setStage("success")}
          />
        </div>
      )}

      <AnimatePresence>
        {stage === "success" && result && (
          <motion.div
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionMs("--motion-base", 220) / 1000 }}
          >
            <ResultPanel result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
