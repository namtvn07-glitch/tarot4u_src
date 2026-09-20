import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { SUPPORT_EMAIL } from "@/lib/legal-contact";
import { DEEP_READING_CREDIT_COST } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng",
  description:
    "Điều khoản và điều kiện sử dụng dịch vụ chiêm nghiệm trực tuyến Xem Bài Tarot.",
};

export default function DieuKhoanPage() {
  return (
    <LegalPageLayout title="Điều Khoản Sử Dụng" updatedAt="13/09/2026">
      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">1. Bản chất dịch vụ</h2>
        <p>
          Xem Bài Tarot là công cụ hỗ trợ chiêm nghiệm tâm lý cá nhân và khám phá trực giác. Nội dung diễn giải không phải là tư vấn y tế, tâm lý, pháp lý hoặc tài chính chuyên nghiệp và không thay thế cho lời khuyên của chuyên gia.
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
          <li>Trải Bài Sâu 3 lá tiêu hao {DEEP_READING_CREDIT_COST} Credits cho mỗi phiên trải bài.</li>
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
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">4. Mua lẻ không cần tài khoản</h2>
        <p>
          Bạn có thể thanh toán cho một lượt Trải Bài Sâu mà không đăng ký tài khoản. Khi đó chúng tôi tạo cho bạn một <strong className="text-[#f3ece1]">phiên khách</strong> ẩn danh để ghi nhận đơn hàng và lưu luận giải của bạn.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#b3a48d]">
          <li>
            Phiên khách chỉ tồn tại trong trình duyệt bạn đang dùng. Xoá dữ liệu trình duyệt, dùng chế độ ẩn danh, hoặc chuyển sang thiết bị khác sẽ làm mất quyền truy cập vào phiên đó.
          </li>
          <li>
            Phiên khách không có email hay mật khẩu nên không thể đăng nhập lại, không đổi được mật khẩu và không dùng được chức năng xoá tài khoản. Bạn có thể chuyển nó thành tài khoản thật bất cứ lúc nào bằng cách đặt email và mật khẩu — toàn bộ Credits và luận giải đã mua được giữ nguyên.
          </li>
          <li>
            Phiên khách quá 30 ngày không hoạt động và chưa từng phát sinh đơn hàng nào có thể bị xoá tự động. Phiên đã từng thanh toán không bị xoá theo cơ chế này.
          </li>
          <li>
            Ở chế độ mua lẻ, mỗi lần thanh toán tương ứng đúng một lượt Trải Bài Sâu. Các gói Credits nhiều lượt yêu cầu tài khoản thật.
          </li>
        </ul>
        <p className="mt-2">
          Quy định hoàn tiền cho trường hợp này nêu tại{" "}
          <Link href="/chinh-sach-hoan-tien" className="text-[#d4af37] underline">
            Chính sách hoàn tiền
          </Link>{" "}
          mục 3.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">5. Liên hệ</h2>
        <p>
          Mọi thắc mắc về điều khoản dịch vụ, vui lòng liên hệ: <span className="text-[#d4af37]">{SUPPORT_EMAIL}</span>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
