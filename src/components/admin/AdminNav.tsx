"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as S from "./styles";

const LINKS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/users", label: "Người dùng" },
  { href: "/admin/affiliate", label: "Affiliate" },
  { href: "/admin/audit", label: "Nhật ký" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Khu vực quản trị" className="overflow-x-auto">
      <ul className="flex list-none gap-1 p-0">
        {LINKS.map((link) => {
          // /admin khớp chính xác, các mục khác khớp theo tiền tố để trang con
          // vẫn sáng đúng mục cha.
          const isCurrent =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                // aria-current là tín hiệu thứ hai ngoài màu sắc — người mù màu
                // và người dùng screen reader đều nhận ra mục đang mở.
                aria-current={isCurrent ? "page" : undefined}
                className="inline-flex min-h-[44px] items-center rounded-md px-4 py-2 no-underline"
                style={{
                  ...S.textSmall,
                  color: isCurrent
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                  background: isCurrent
                    ? "var(--color-surface-raised)"
                    : "transparent",
                  fontWeight: isCurrent ? 600 : 400,
                  borderBottom: isCurrent
                    ? "2px solid var(--color-accent)"
                    : "2px solid transparent",
                }}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
