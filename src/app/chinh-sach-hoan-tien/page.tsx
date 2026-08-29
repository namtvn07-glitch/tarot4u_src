import React from "react";
import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { SUPPORT_EMAIL } from "@/lib/legal-contact";

export const metadata: Metadata = {
  title: "Chính Sách Hoàn Tiền",
  description:
    "Quy định hoàn trả Credits và xử lý giao dịch tại Ventus Tarot.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Chính Sách Hoàn Tiền" updatedAt="29/08/2026">
      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">1. Hoàn tiền khi lỗi hệ thống</h2>
        <p>
          Nếu quá trình tạo luận giải gặp sự cố gián đoạn mạng hoặc lỗi kỹ thuật từ máy chủ, Credits sẽ tự động được hoàn trả về tài khoản của bạn ngay lập tức.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">2. Giao dịch mua gói Credits</h2>
        <p>
          Do bản chất của sản phẩm số và dịch vụ trực tuyến tức thì, các gói Credits đã thanh toán thành công và đã được sử dụng một phần sẽ không thể hoàn trả tiền mặt. Trường hợp thanh toán nhầm hoặc trừ tiền nhiều lần qua VietQR, vui lòng gửi biên lai giao dịch đến <span className="text-[#d4af37]">{SUPPORT_EMAIL}</span> trong vòng 48 giờ để được đối soát và xử lý hoàn tiền.
        </p>
      </section>
    </LegalPageLayout>
  );
}
