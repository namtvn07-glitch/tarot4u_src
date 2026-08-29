import Link from "next/link";
import { DeleteReadingButton } from "@/components/account/DeleteReadingButton";
import { getCardById } from "@/lib/cards";
import { TOPIC_LABEL, type Topic } from "@/lib/reading";

interface ReadingRow {
  id: string;
  topic: Topic;
  tier: "quick" | "deep";
  cards_drawn: { card_id: string; orientation: "upright" | "reversed" }[];
  created_at: string;
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ReadingHistoryList({
  readings,
  page,
  totalPages,
  otherParams,
}: {
  readings: ReadingRow[];
  page: number;
  totalPages: number;
  otherParams: Record<string, string>;
}) {
  if (readings.length === 0) {
    return (
      <div className="rounded-md p-6 text-center text-body text-text-muted">
        <p className="mb-4">Bạn chưa trải bài lần nào.</p>
        <Link href="/" className="text-body-sm font-semibold text-accent underline">
          Trải bài đầu tiên
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="flex flex-col">
        {readings.map((reading) => {
          const cardNames = reading.cards_drawn
            .map((c) => getCardById(c.card_id).name_vi)
            .join(", ");
          const label = `lượt trải bài ${cardNames}, ${dateFormatter.format(new Date(reading.created_at))}`;
          return (
            <li
              key={reading.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-b-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Link href={`/tai-khoan/${reading.id}`} className="rounded-sm hover:underline" aria-label={`Xem ${label}`}>
                <strong className="text-text">{cardNames}</strong>
                <span className="text-text-muted">
                  {" "}
                  · {TOPIC_LABEL[reading.topic]} ·{" "}
                  {reading.tier === "deep" ? "Đọc sâu" : "Đọc nhanh"}
                </span>
                <div className="text-body-sm text-text-muted">
                  {dateFormatter.format(new Date(reading.created_at))}
                </div>
              </Link>
              <DeleteReadingButton readingId={reading.id} label={label} />
            </li>
          );
        })}
      </ul>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        paramName="readingsPage"
        otherParams={otherParams}
      />
    </div>
  );
}

// otherParams: giá trị các query param KHÁC (vd. ledgerPage khi đang phân
// trang readingsPage) — giữ nguyên khi đổi trang, tránh 2 danh sách tự reset
// lẫn nhau vì href chỉ có 1 param.
export function PaginationControls({
  page,
  totalPages,
  paramName,
  otherParams,
}: {
  page: number;
  totalPages: number;
  paramName: string;
  otherParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(otherParams);
    params.set(paramName, String(targetPage));
    return `?${params.toString()}`;
  }

  return (
    <nav aria-label="Phân trang" className="mt-4 flex items-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="text-body-sm font-semibold text-accent underline">
          Trước
        </Link>
      ) : (
        <span className="text-body-sm text-text-muted">Trước</span>
      )}
      <span className="text-body-sm text-text-muted">
        Trang {page}/{totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-body-sm font-semibold text-accent underline">
          Sau
        </Link>
      ) : (
        <span className="text-body-sm text-text-muted">Sau</span>
      )}
    </nav>
  );
}
