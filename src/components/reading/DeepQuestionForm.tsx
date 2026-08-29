"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TOPICS, TOPIC_LABEL, type Topic } from "@/lib/reading";

const QUESTION_MAX = 300;

export function DeepQuestionForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (topic: Topic, question: string) => void;
  disabled?: boolean;
}) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [question, setQuestion] = useState("");
  const questionId = useId();

  const trimmed = question.trim();
  const canSubmit = !!topic && trimmed.length > 0 && !disabled;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (topic && trimmed) onSubmit(topic, trimmed);
      }}
    >
      {/* Tái dùng đúng pattern nút chủ đề của TopicPicker.tsx — không tạo
          biến thể mới (design-system.md "Variants over forks"). */}
      <div role="group" aria-label="Chọn chủ đề" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TOPICS.map((t) => {
          const isSelected = topic === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setTopic(t)}
              style={{
                transitionDuration: "var(--motion-fast)",
                transitionTimingFunction: "var(--ease-standard)",
              }}
              className={[
                "flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-body-sm font-semibold transition-colors",
                isSelected
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border-interactive bg-surface text-text hover:bg-surface-raised",
              ].join(" ")}
            >
              {TOPIC_LABEL[t]}
            </button>
          );
        })}
      </div>

      <label htmlFor={questionId} className="mb-2 block text-body-sm font-semibold text-text">
        Câu hỏi của bạn
      </label>
      <textarea
        id={questionId}
        value={question}
        onChange={(e) => setQuestion(e.target.value.slice(0, QUESTION_MAX))}
        maxLength={QUESTION_MAX}
        rows={3}
        placeholder="Ví dụ: Tôi nên tập trung vào điều gì trong công việc lúc này?"
        className="w-full rounded-md p-3 text-body text-text"
        style={{
          border: "1px solid var(--color-border-interactive)",
          background: "var(--color-surface)",
        }}
      />
      <div className="mt-1 text-right text-body-sm text-text-muted">
        {trimmed.length}/{QUESTION_MAX}
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          Xào bài
        </Button>
      </div>
    </form>
  );
}
