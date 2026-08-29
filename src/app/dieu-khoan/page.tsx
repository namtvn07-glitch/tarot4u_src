import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { SUPPORT_EMAIL } from "@/lib/legal-contact";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng",
  description:
    "Điều khoản và điều kiện sử dụng dịch vụ chiêm nghiệm trực tuyến Ventus Tarot.",
};

export default function DieuKhoanPage() {
  return (
    <LegalPageLayout title="Điều Khoản Sử Dụng" updatedAt="29/08/2026">
      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">1. Bản chất dịch vụ</h2>
        <p>
          Ventus Tarot là công cụ hỗ trợ chiêm nghiệm tâm lý cá nhân và khám phá trực giác. Nội dung diễn giải không phải là tư vấn y tế, tâm lý, pháp lý hoặc tài chính chuyên nghiệp và không thay thế cho lời khuyên của chuyên gia.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">2. Độ tuổi sử dụng</h2>
        <p>
          Dịch vụ dành cho người dùng từ 16 tuổi trở lên có đầy đủ năng lực hành vi dân sự.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">3. Cơ chế Credits</h2>
        <ul className="list-disc pl-5 space-y-1 text-[#b3a48d]">
          <li>Rút Nhanh 1 lá luôn miễn phí.</li>
          <li>Trải Bài Sâu 3 lá tiêu hao 2 Credits cho mỗi phiên trải bài.</li>
          <li>Credits đã mua qua cổng PayOS không bị giới hạn thời gian sử dụng.</li>
        </ul>
        <p className="mt-2">
          Xem chi tiết tại{" "}
          <Link href="/chinh-sach-hoan-tien" className="text-[#d4af37] underline">
            Chính sách hoàn tiền
          </Link>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">4. Liên hệ</h2>
        <p>
          Mọi thắc mắc về điều khoản dịch vụ, vui lòng liên hệ: <span className="text-[#d4af37]">{SUPPORT_EMAIL}</span>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
