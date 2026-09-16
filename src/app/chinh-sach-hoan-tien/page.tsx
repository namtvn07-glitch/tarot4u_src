import React from "react";
import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { SUPPORT_EMAIL } from "@/lib/legal-contact";

export const metadata: Metadata = {
  title: "Chính Sách Hoàn Tiền",
  description:
    "Quy định hoàn trả Credits và xử lý giao dịch tại Xem Bài Tarot.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Chính Sách Hoàn Tiền" updatedAt="13/09/2026">
      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">1. Hoàn tiền khi lỗi hệ thống</h2>
        <p>
          Nếu quá trình tạo luận giải gặp sự cố gián đoạn mạng hoặc lỗi kỹ thuật từ máy chủ, Credits sẽ tự động được hoàn trả ngay lập tức về chính phiên bạn đang dùng — kể cả khi bạn mua lẻ mà chưa tạo tài khoản.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">2. Giao dịch mua gói Credits</h2>
        <p>
          Do bản chất của sản phẩm số và dịch vụ trực tuyến tức thì, các gói Credits đã thanh toán thành công và đã được sử dụng một phần sẽ không thể hoàn trả tiền mặt. Trường hợp thanh toán nhầm hoặc trừ tiền nhiều lần qua VietQR, vui lòng gửi biên lai giao dịch đến <span className="text-[#d4af37]">{SUPPORT_EMAIL}</span> trong vòng 48 giờ để được đối soát và xử lý hoàn tiền.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl text-[#d4af37] font-semibold">3. Mua lẻ một lượt Đọc sâu (không cần tài khoản)</h2>
        <p>
          Bạn có thể trả tiền cho đúng một lượt luận giải chuyên sâu mà không cần đăng ký. Đây là sản phẩm số giao ngay: ngay khi thanh toán được xác nhận, lượt luận giải đó được mở khoá và xem như đã sử dụng, nên không hoàn trả tiền mặt sau khi nội dung đã hiển thị.
        </p>
        <p>
          Lượt mua này gắn với một <strong className="text-[#f3ece1]">phiên khách</strong> chỉ tồn tại trong trình duyệt bạn đang dùng. Nếu bạn xoá dữ liệu trình duyệt, dùng chế độ ẩn danh, hoặc đổi sang thiết bị khác trước khi tạo tài khoản, phiên đó — cùng Credits chưa dùng trong nó — sẽ không thể khôi phục bằng thao tác tự động. Vì vậy chúng tôi mời bạn đặt email và mật khẩu ngay sau khi đọc xong; việc này giữ nguyên toàn bộ Credits và luận giải đã mua.
        </p>
        <p>
          Trường hợp đã chuyển khoản nhưng không nhận được luận giải, hoặc mất phiên khách khi chưa sử dụng hết: gửi <strong className="text-[#f3ece1]">mã đơn hàng</strong> in trên nội dung chuyển khoản kèm biên lai tới <span className="text-[#d4af37]">{SUPPORT_EMAIL}</span> trong vòng 48 giờ. Chúng tôi đối soát thủ công theo mã đơn hàng và khôi phục quyền lợi hoặc hoàn tiền tương ứng.
        </p>
      </section>
    </LegalPageLayout>
  );
}
