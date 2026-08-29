import { PaginationControls } from "@/components/account/ReadingHistoryList";

interface LedgerRow {
  id: string;
  delta: number;
  balance_after: number;
  reason: "purchase" | "reading" | "refund" | "bonus" | "admin_adjust";
  created_at: string;
}

const REASON_LABEL: Record<LedgerRow["reason"], string> = {
  purchase: "Nạp credits",
  reading: "Trừ — Đọc sâu",
  refund: "Hoàn credits",
  bonus: "Tặng",
  admin_adjust: "Điều chỉnh",
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function LedgerTable({
  rows,
  page,
  totalPages,
  otherParams,
}: {
  rows: LedgerRow[];
  page: number;
  totalPages: number;
  otherParams: Record<string, string>;
}) {
  if (rows.length === 0) {
    return <p className="text-body text-text-muted">Chưa có giao dịch nào.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-body-sm">
          <caption className="sr-only">Lịch sử thay đổi credits</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b px-2 py-3 text-left font-semibold text-text-muted" style={{ borderColor: "var(--color-border)" }}>
                Ngày
              </th>
              <th scope="col" className="border-b px-2 py-3 text-left font-semibold text-text-muted" style={{ borderColor: "var(--color-border)" }}>
                Loại
              </th>
              <th scope="col" className="border-b px-2 py-3 text-left font-semibold text-text-muted" style={{ borderColor: "var(--color-border)" }}>
                Thay đổi
              </th>
              <th scope="col" className="border-b px-2 py-3 text-left font-semibold text-text-muted" style={{ borderColor: "var(--color-border)" }}>
                Số dư sau
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="border-b px-2 py-3 text-text" style={{ borderColor: "var(--color-border)" }}>
                  {dateFormatter.format(new Date(row.created_at))}
                </td>
                <td className="border-b px-2 py-3 text-text" style={{ borderColor: "var(--color-border)" }}>
                  {REASON_LABEL[row.reason]}
                </td>
                <td className="border-b px-2 py-3 text-text" style={{ borderColor: "var(--color-border)" }}>
                  {row.delta > 0 ? `+${row.delta}` : row.delta}
                </td>
                <td className="border-b px-2 py-3 text-text" style={{ borderColor: "var(--color-border)" }}>
                  {row.balance_after}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        paramName="ledgerPage"
        otherParams={otherParams}
      />
    </div>
  );
}
