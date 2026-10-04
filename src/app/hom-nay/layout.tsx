import type { Metadata } from "next";

// page.tsx là Client Component nên không export được metadata — layout này cho
// trang một title/description riêng (trang có trong sitemap).
export const metadata: Metadata = {
  title: "Thông Điệp Vũ Trụ Hôm Nay",
  description:
    "Mỗi ngày rút một lá Tarot miễn phí: năng lượng trong ngày, tình yêu, công việc, tài chính và một lời nhắn riêng cho hôm nay.",
  alternates: { canonical: "/hom-nay" },
};

export default function HomNayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
