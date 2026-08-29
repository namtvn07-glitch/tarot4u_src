"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ReadingDisclaimer } from "@/components/reading/ReadingDisclaimer";

type StreamState = "loading" | "streaming" | "done" | "error";

interface StreamEvent {
  type: "delta" | "error" | "done";
  text?: string;
  message?: string;
  readingId?: string;
}

// Chỉ mount SAU khi user đã bấm "Đọc sâu" (CardSpreadPicker). Không xử lý
// dòng "base" — Lớp Nền đã hiện xong ở CardSpreadPicker trước đó, component
// này chỉ nhận stream từ /api/reading/deep/personal (paid).
export function DeepResultStream({ token }: { token: string }) {
  const [state, setState] = useState<StreamState>("loading");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bufferRef = useRef("");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // Throttle cập nhật DOM/aria-live bằng requestAnimationFrame — không
    // bắn re-render mỗi ký tự (bài học "live-region spam" từ Giai đoạn 2,
    // xem 08-timeline.md).
    function scheduleFlush() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!cancelled) setText(bufferRef.current);
      });
    }

    async function run() {
      try {
        const res = await fetch("/api/reading/deep/personal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          // Bắt buộc — không chỉ `cancelled` (biến đó chỉ chặn setState phía
          // client). React StrictMode (dev) mount-cleanup-mount effect này 2
          // lần; không abort() thật thì lần mount "ma" đầu tiên vẫn chạy hết
          // fetch tới server — trừ credits + gọi AI + insert reading THẬT 2
          // lần cho 1 lần Đọc sâu. Bug thật đã gặp: 2 dòng `readings` trùng
          // câu hỏi/lá cách nhau vài giây trong DB.
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error("stream_failed");
        if (!cancelled) setState("streaming");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let carry = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          carry += decoder.decode(value, { stream: true });
          const lines = carry.split("\n");
          carry = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as StreamEvent;

            if (event.type === "delta" && event.text) {
              bufferRef.current += event.text;
              scheduleFlush();
            } else if (event.type === "error") {
              if (!cancelled) {
                setErrorMessage(event.message ?? "Có lỗi khi tạo diễn giải.");
                setState("error");
              }
              return;
            } else if (event.type === "done") {
              if (!cancelled) {
                setText(bufferRef.current);
                setState("done");
              }
            }
          }
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("Không kết nối được máy chủ. Vui lòng thử lại.");
          setState("error");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [token]);

  return (
    <section aria-labelledby="deep-result-heading" className="mt-6">
      <h2 id="deep-result-heading" className="mb-3 font-heading text-heading-2 text-text">
        Đọc sâu cho câu hỏi của bạn
      </h2>

      {state === "loading" && <p className="text-body text-text-muted">Đang chuẩn bị...</p>}

      {(state === "streaming" || state === "done") && (
        <>
          {/* Card mặc định (không glow) — nội dung dài, glow nền sẽ gây mỏi
              mắt khi đọc lâu (xem implementation-plan.md Layer 4). */}
          <Card as="article" aria-live="polite" className="max-w-prose whitespace-pre-line text-body text-text">
            {text}
            {state === "streaming" && <span aria-hidden="true">▍</span>}
          </Card>
          <ReadingDisclaimer />
        </>
      )}

      {state === "error" && (
        <div
          role="alert"
          className="rounded-md p-4 text-body-sm"
          style={{ border: "1px solid var(--color-danger)", background: "var(--color-surface-raised)" }}
        >
          <p className="m-0 mb-1 text-text">{errorMessage}</p>
          <p className="m-0 text-text-muted">
            3 lá và diễn giải Lớp Nền bạn đã xem vẫn còn nguyên — không mất gì
            ngoài credits đã hoàn.
          </p>
        </div>
      )}
    </section>
  );
}
