import Link from "next/link";
import * as S from "@/components/admin/styles";
import { logAdminAccess } from "@/lib/admin-audit";
import {
  formatDateTime,
  formatNumber,
  formatVnd,
  listUsers,
} from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

// CỐ Ý không cache trang này (khác trang tổng quan có revalidate = 60): mỗi lần
// mở là một lượt đọc dữ liệu cá nhân và phải sinh đúng một dòng nhật ký. Trang
// được cache lại sẽ khiến lượt xem thứ hai trở đi biến mất khỏi nhật ký.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const search = params.q?.trim() ?? "";
  const offset = (page - 1) * PAGE_SIZE;

  // Layout đã chặn người không phải admin; ở đây chỉ cần lấy id để ghi nhật ký.
  const admin = await requireAdmin();
  const rows = await listUsers(PAGE_SIZE, offset, search || null);

  if (admin) {
    await logAdminAccess(admin.id, "users.list", {
      page,
      q: search || undefined,
      returned: rows.length,
    });
  }

  const hasNextPage = rows.length === PAGE_SIZE;
  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (targetPage > 1) query.set("page", String(targetPage));
    const qs = query.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <>
      <h1 className="mt-0 mb-2" style={S.heading1}>
        Người dùng
      </h1>
      <p className="mt-0 mb-5" style={S.textMuted}>
        Mọi lượt mở trang này được ghi vào nhật ký quản trị.
      </p>

      {/* form GET thuần: tìm kiếm và phân trang chạy được cả khi không có JS */}
      <form method="get" action="/admin/users" className="mb-5 flex flex-wrap gap-2">
        <label htmlFor="admin-user-search" className="sr-only">
          Tìm theo email hoặc tên hiển thị
        </label>
        <input
          id="admin-user-search"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Tìm theo email hoặc tên hiển thị"
          className="min-h-[44px] flex-1 rounded-md border px-4 py-2"
          style={{ ...S.input, minWidth: "220px" }}
        />
        <button
          type="submit"
          className="min-h-[44px] rounded-md border px-5 py-2 font-semibold"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-on-accent)",
            borderColor: "transparent",
          }}
        >
          Tìm
        </button>
        {search && (
          <Link
            href="/admin/users"
            className="inline-flex min-h-[44px] items-center rounded-md border px-5 py-2 no-underline"
            style={{
              ...S.textSmall,
              color: "var(--color-text)",
              borderColor: "var(--color-border-interactive)",
            }}
          >
            Xoá bộ lọc
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p style={S.textBody}>
          {search
            ? `Không có người dùng nào khớp “${search}”.`
            : "Chưa có người dùng nào."}
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-lg"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <table className="w-full border-collapse" style={{ minWidth: "820px" }}>
            <caption className="sr-only">
              Danh sách người dùng, trang {page}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Email
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Tên hiển thị
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Credits
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Đã chi
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Lượt đọc
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Nguồn
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Đăng ký
                </th>
                <th scope="col" className="p-3" style={S.tableHeaderCell}>
                  Đăng nhập gần nhất
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="p-3" style={S.tableCell}>
                    {row.email ?? "—"}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {row.display_name ?? "—"}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {formatNumber(row.credits)}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {formatVnd(row.total_spent_vnd)}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {formatNumber(row.readings_count)}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {row.referred_by_code ?? "—"}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {formatDateTime(row.created_at)}
                  </td>
                  <td className="p-3" style={S.tableCell}>
                    {formatDateTime(row.last_sign_in_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav aria-label="Phân trang" className="mt-4 flex items-center gap-3">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex min-h-[44px] items-center rounded-md border px-4 no-underline"
            style={{
              ...S.textSmall,
              color: "var(--color-text)",
              borderColor: "var(--color-border-interactive)",
            }}
          >
            ← Trang trước
          </Link>
        ) : null}
        <span style={S.textMuted}>Trang {page}</span>
        {hasNextPage ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex min-h-[44px] items-center rounded-md border px-4 no-underline"
            style={{
              ...S.textSmall,
              color: "var(--color-text)",
              borderColor: "var(--color-border-interactive)",
            }}
          >
            Trang sau →
          </Link>
        ) : null}
      </nav>
    </>
  );
}
