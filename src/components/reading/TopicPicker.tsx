"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TOPICS, TOPIC_LABEL, type Topic } from "@/lib/reading";

export function TopicPicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<Topic | null>(null);

  return (
    <div>
      <div
        role="group"
        aria-label="Chọn chủ đề trải bài"
        className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      >
        {TOPICS.map((topic) => {
          const isSelected = selected === topic;
          return (
            <button
              key={topic}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(topic)}
              style={{
                transitionDuration: "var(--motion-fast)",
                transitionTimingFunction: "var(--ease-standard)",
              }}
              className={[
                "flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-body-sm font-semibold transition-colors",
                // shadow-glow trên trạng thái đã chọn là cue THÊM, không THAY —
                // đổi màu nền vẫn là tín hiệu chính (accessibility.md "color
                // không phải tín hiệu duy nhất").
                isSelected
                  ? "border-accent bg-accent text-on-accent shadow-glow"
                  : "border-border-interactive bg-surface text-text hover:bg-surface-raised",
              ].join(" ")}
            >
              {TOPIC_LABEL[topic]}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          disabled={!selected}
          onClick={() => selected && router.push(`/trai-bai?topic=${selected}`)}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
