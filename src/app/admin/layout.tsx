import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import * as S from "@/components/admin/styles";
import { requireAdmin, requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Cổng fail-CLOSED. Middleware chỉ đá người chưa đăng nhập (nó fail-open khi
  // lỗi mạng, đúng cho câu hỏi "có session không" nhưng sai cho "có quyền
  // admin không"), nên quyết định thật nằm ở đây.
  const admin = await requireAdmin();

  if (!admin) {
    // Chỉ gọi thêm requireUser ở nhánh hỏng (hiếm), để nhánh thành công không
    // phải hỏi Supabase hai lần.
    const user = await requireUser();
    if (!user) redirect("/dang-nhap?next=/admin");
    // Đã đăng nhập nhưng không phải admin: trả 404 chứ không phải 403 — không
    // xác nhận cho người tò mò rằng có tồn tại khu vực quản trị.
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 font-semibold" style={S.accentText}>
            Quản trị
          </p>
          {/* Layout này cố ý không dùng Header/Footer công khai, nên không có
              đường quay lại app nếu không tự thêm. */}
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-md px-3 no-underline"
            style={{ ...S.textSmall, color: "var(--color-text-muted)" }}
          >
            ← Về trang chính
          </Link>
        </div>
        <AdminNav />
      </header>
      <main>{children}</main>
    </div>
  );
}
