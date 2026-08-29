import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { ReadingDisclaimer } from "@/components/reading/ReadingDisclaimer";
import { TOPIC_LABEL, type Topic } from "@/lib/reading";

export interface ReadingResult {
  topic: Topic;
  card: {
    id: string;
    nameEn: string;
    nameVi: string;
    image: string;
    orientation: "upright" | "reversed";
  };
  base: {
    body: string;
    summary: string;
    keywords: string[];
  };
}

// Thuần hiển thị — dữ liệu đã fetch xong ở ReadingStage, không tự gọi API.
export function ResultPanel({ result }: { result: ReadingResult }) {
  const { card, base, topic } = result;
  const orientationLabel = card.orientation === "upright" ? "Xuôi" : "Ngược";

  return (
    <section aria-labelledby="result-heading" className="py-6">
      {/* Kết quả là khoảnh khắc chính của luồng trải bài — Card highlighted
          (glow mặc định), khác các card danh sách khác trong app (xem
          implementation-plan.md Layer 4). */}
      <Card as="article" variant="highlighted">
        {/* 96×166px: kích thước thumbnail cố định, không phải bước trong ramp
            spacing — dùng `fill` thay vì width/height prop vì Tailwind's
            preflight (img{height:auto}) luôn thắng next/image's `height`
            attribute, gây lệch vài px giữa giá trị khai báo và giá trị render
            thật (next/image dev warning bắt đúng lệch này); `fill` để CSS
            quyết định cả 2 chiều nên không còn gì để lệch. */}
        <div className="mb-5 flex items-center gap-4">
          <div className="relative shrink-0" style={{ width: 96, height: 166 }}>
            <Image
              src={card.image}
              alt={`Lá ${card.nameVi} (${card.nameEn}), rút ${
                card.orientation === "upright" ? "xuôi" : "ngược"
              } cho chủ đề ${TOPIC_LABEL[topic]}`}
              fill
              sizes="96px"
              className="rounded-md object-cover shadow-sm"
            />
          </div>
          <div>
            <h2
              id="result-heading"
              tabIndex={-1}
              className="mb-1 font-heading text-heading-1 text-text focus:outline-none"
            >
              Lá {card.nameVi} — {TOPIC_LABEL[topic]}
            </h2>
            <span
              className="inline-flex min-h-[28px] items-center rounded-full border px-3 text-body-sm font-semibold text-text"
              style={{ borderColor: "var(--color-border-interactive)" }}
            >
              {orientationLabel}
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-heading text-heading-3 text-text">
            Đọc nhanh
          </h3>
          <p className="max-w-prose text-body text-text">{base.body}</p>
          <span className="sr-only" role="status">
            Đã có kết quả cho lá {card.nameVi}.
          </span>
        </div>
      </Card>

      <ReadingDisclaimer />
    </section>
  );
}
