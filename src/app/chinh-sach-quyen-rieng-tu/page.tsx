import React from "react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Chính Sách Quyền Riêng Tư" updatedAt="29/08/2026">
      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">1. Thu thập thông tin</h2>
        <p>
          Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để vận hành dịch vụ: địa chỉ email, tên hiển thị và lịch sử trải bài của bạn nhằm phục vụ việc lưu trữ cá nhân.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">2. Bảo mật dữ liệu</h2>
        <p>
          Mọi câu hỏi và kết quả trải bài đều được truyền qua kết nối mã hóa SSL/TLS an toàn. Chúng tôi không chia sẻ hoặc bán dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">3. Quyền của người dùng</h2>
        <p>
          Bạn có toàn quyền yêu cầu xuất hoặc xóa toàn bộ lịch sử trải bài và tài khoản của mình bất kỳ lúc nào bằng cách gửi yêu cầu đến đội ngũ hỗ trợ.
        </p>
      </section>
    </LegalPageLayout>
  );
}
