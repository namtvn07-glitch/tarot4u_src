"use client";

import { useState } from "react";
import { CardSpreadPicker } from "@/components/reading/CardSpreadPicker";
import { DeepQuestionForm } from "@/components/reading/DeepQuestionForm";
import { DeepResultStream } from "@/components/reading/DeepResultStream";
import { CrisisResourceNotice, type BlockedCategory } from "@/components/safety/CrisisResourceNotice";
import type { Topic } from "@/lib/reading";

// State machine: question → shuffling → picking (free, reveal từng lá +
// Lớp Nền; mang thêm cờ deepReadingStarted) → blocked | error. Ranh giới
// free/paid nằm ở chỗ bấm nút "Đọc sâu" — điểm duy nhất trong toàn bộ luồng
// chạm credits (xem 01-san-pham-pham-vi.md §5.2). Gộp "personal" vào
// "picking" (2026-08-19, xem 4c-picker-redesign) — khu chọn lá phải ở lại
// trên màn khi Đọc sâu chạy, không unmount như trước.
type Stage =
  | { name: "question" }
  | { name: "shuffling" }
  | { name: "picking"; token: string; slots: number; deepReadingStarted: boolean; topic: Topic; question: string }
  | { name: "blocked"; category: BlockedCategory }
  | { name: "error"; message: string };

export function DeepReadingStage() {
  const [stage, setStage] = useState<Stage>({ name: "question" });

  async function handleShuffle(topic: Topic, question: string) {
    setStage({ name: "shuffling" });
    try {
      const res = await fetch("/api/reading/deep/shuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, question }),
      });
      if (res.status === 401) {
        setStage({ name: "error", message: "Phiên đăng nhập đã hết. Vui lòng tải lại trang." });
        return;
      }
      if (res.status === 429) {
        setStage({
          name: "error",
          message: "Bạn đã trải bài quá nhiều lần trong 1 giờ qua. Vui lòng thử lại sau.",
        });
        return;
      }
      if (!res.ok) {
        setStage({ name: "error", message: "Không tạo được lượt trải bài. Vui lòng thử lại." });
        return;
      }
      const data = (await res.json()) as
        | { blocked: true; category: BlockedCategory }
        | { token: string; slots: number };

      if ("blocked" in data && data.blocked) {
        setStage({ name: "blocked", category: data.category });
        return;
      }
      if ("token" in data) {
        setStage({ name: "picking", token: data.token, slots: data.slots, deepReadingStarted: false, topic, question });
      }
    } catch {
      setStage({ name: "error", message: "Không kết nối được máy chủ. Vui lòng thử lại." });
    }
  }

  return (
    <div>
      {stage.name === "question" && <DeepQuestionForm onSubmit={handleShuffle} />}

      {stage.name === "shuffling" && <p className="text-body text-text-muted">Đang xào bài...</p>}

      {stage.name === "picking" && (
        <>
          <CardSpreadPicker
            token={stage.token}
            slots={stage.slots}
            deepReadingStarted={stage.deepReadingStarted}
            topic={stage.topic}
            question={stage.question}
            onDeepReading={() => setStage({ ...stage, deepReadingStarted: true })}
          />
          {stage.deepReadingStarted && <DeepResultStream token={stage.token} />}
        </>
      )}

      {stage.name === "blocked" && <CrisisResourceNotice category={stage.category} />}

      {stage.name === "error" && (
        <div
          role="alert"
          className="rounded-md p-4 text-body-sm"
          style={{ border: "1px solid var(--color-danger)", background: "var(--color-surface-raised)" }}
        >
          <p className="m-0 text-text">{stage.message}</p>
        </div>
      )}
    </div>
  );
}
