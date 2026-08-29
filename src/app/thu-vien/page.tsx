import React from "react";
import type { Metadata } from "next";
import { LibraryChrome } from "@/components/library/LibraryChrome";
import { LibraryIndexClient } from "@/components/library/LibraryIndexClient";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Thư Viện 78 Lá Bài Tarot — Ý Nghĩa & Biểu Tượng Chi Tiết",
  description:
    "Tra cứu ý nghĩa toàn diện 78 lá bài Tarot chuẩn Rider-Waite: Bộ Ẩn Chính, Bộ Cốc, Bộ Kiếm, Bộ Gậy và Bộ Tiền trong tình yêu, sự nghiệp, tài chính.",
  openGraph: {
    title: "Thư Viện 78 Lá Bài Tarot — Ý Nghĩa & Biểu Tượng Chi Tiết",
    description:
      "Tra cứu ý nghĩa toàn diện 78 lá bài Tarot chuẩn Rider-Waite: Bộ Ẩn Chính, Bộ Cốc, Bộ Kiếm, Bộ Gậy và Bộ Tiền.",
    images: ["/cards/the-fool.jpg"],
  },
};

export default function ThuVienPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Thư Viện 78 Lá Bài", url: "/thu-vien" },
  ]);

  return (
    <LibraryChrome currentScreen="library">
      <LibraryIndexClient />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </LibraryChrome>
  );
}
