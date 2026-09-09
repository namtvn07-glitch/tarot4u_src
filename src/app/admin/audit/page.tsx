import Link from "next/link";
import * as S from "@/components/admin/styles";
import { formatDateTime, listAuditLog } from "@/lib/admin-queries";

// Nhật ký phải luôn tươi — cache ở đây là che mất chính thứ trang này tồn tại
// để hiển thị.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  "users.list": "Xem danh sách người dùng",
  "users.view": "Xem chi tiết một người dùng",
  "affiliate.create": "Tạo link affiliate",
  "affiliate.toggle": "Bật/tắt link affiliate",
  "affiliate.delete": "Xoá link affiliate",
};

// Nhật ký là để người vận hành đọc, không phải để dev soi JSON.
function describeMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return "—";

  const parts: string[] = [];
  if (typeof meta.code === "string") parts.push(`Mã ${meta.code}`);
  if (typeof meta.is_active === "boolean") {
    parts.push(meta.is_active ? "chuyển sang bật" : "chuyển sang tắt");
  }
  if (typeof meta.q === "string" && meta.q !== "") parts.push(`tìm “${meta.q}”`);
  if (typeof meta.page === "number" && meta.page > 1) parts.push(`trang ${meta.page}`);
  if (typeof meta.returned === "number") parts.push(`${meta.returned} kết quả`);

  return parts.length > 0 ? parts.join(" · ") : "—";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await listAuditLog(PAGE_SIZE, offset);
  const hasNextPage = rows.length === PAGE_SIZE;

  return (
    <>
      <h1 className="mt-0 mb-2" style={S.heading1}>
        Nhật ký quản trị
      </h1>
      <p className="mt-0 mb-5" style={S.textMuted}>
        Ghi lại ai đã xem thông tin người dùng và ai đã thay đổi gì. Việc xem
        trang Tổng quan và Affiliate không ghi vào đây, vì đó chỉ là số liệu
        tổng hợp.
      </p>

      {rows.length === 0 ? (
        <p style={S.textBody}>Chưa có hoạt động nào được ghi.</p>
      ) : (
        <div
          className="overflow-x-auto rounded-lg"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <table className="w-full border-collapse" style={{ minWidth: "720px" }}>
            <caption className="sr-only">Nhật ký hoạt động quản trị, trang {page}</caption>
            <thead>
              <tr>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Thời điểm
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Số lượt
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Quản trị viên
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Hành động
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="p-3" style={S.tableCell}>
                    {formatDateTime(row.last_at)}
                    {row.view_count > 1 && (
                      <span className="block" style={S.textDim}>
                        từ {formatDateTime(row.created_at)}
                      </span>
                    )}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {row.view_count > 1 ? `${row.view_count} lượt` : "1"}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {row.admin_email ?? "(không rõ)"}
                    {row.admin_user_id === null && (
                      // Ảnh chụp email vẫn còn nhưng tài khoản đã bị gỡ — nói rõ
                      // để không ai đi tìm một tài khoản không còn tồn tại.
                      <span className="block" style={S.textDim}>
                        tài khoản đã bị gỡ
                      </span>
                    )}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {ACTION_LABEL[row.action] ?? row.action}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {describeMeta(row.meta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav aria-label="Phân trang" className="mt-4 flex items-center gap-3">
        {page > 1 && (
          <Link
            href={page - 1 === 1 ? "/admin/audit" : `/admin/audit?page=${page - 1}`}
            className="inline-flex min-h-[44px] items-center rounded-md border px-4 no-underline"
            style={{
              ...S.textSmall,
              color: "var(--color-text)",
              borderColor: "var(--color-border-interactive)",
            }}
          >
            ← Trang trước
          </Link>
        )}
        <span style={S.textMuted}>Trang {page}</span>
        {hasNextPage && (
          <Link
            href={`/admin/audit?page=${page + 1}`}
            className="inline-flex min-h-[44px] items-center rounded-md border px-4 no-underline"
            style={{
              ...S.textSmall,
              color: "var(--color-text)",
              borderColor: "var(--color-border-interactive)",
            }}
          >
            Trang sau →
          </Link>
        )}
      </nav>
    </>
  );
}
