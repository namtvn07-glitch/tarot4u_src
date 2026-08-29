"use client";

import { useEffect, useRef } from "react";

export type BlockedCategory = "crisis" | "medical" | "legal" | "harmful" | "nonsense";

// Nội dung nguyên văn từ Research/plan/06-bao-mat-kiem-duyet-phap-ly.md
// §3.2/§3.3, copy hotline đã cập nhật (thêm giờ hoạt động Ngày Mai + gợi ý
// 115) theo bản nháp đã chốt ở Research/xac-minh-payos-va-hotline.md §2 —
// tránh user gọi ngoài giờ Ngày Mai (Thứ 4–CN, 13:00–20:30) lúc khủng
// hoảng mà hụt hẫng. KHÔNG có CTA thương mại, không link nạp credits, đúng
// yêu cầu §3.3.
//
// Component thuần, không phụ thuộc state của luồng 4c — thiết kế để Giai
// đoạn 7 tái dùng ở route riêng khi làm trang tài nguyên khủng hoảng độc lập.
export function CrisisResourceNotice({ category }: { category: BlockedCategory }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Đây là kết quả của một hành động submit (bấm "Xào bài"), không phải
  // toast tự động xuất hiện — chuyển focus tới heading, không cần aria-live.
  useEffect(() => {
    headingRef.current?.focus();
  }, [category]);

  if (category === "crisis") {
    return (
      <section
        className="rounded-md p-5"
        style={{ border: "1px solid var(--color-danger)", background: "var(--color-surface-raised)" }}
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mb-3 font-heading text-heading-3 text-text focus:outline-none"
        >
          Có vẻ bạn đang trải qua điều gì đó rất khó khăn
        </h2>
        <p className="mb-3 max-w-prose text-body text-text">
          Tarot không phải là thứ bạn cần lúc này — nhưng có những người thật
          sẵn sàng lắng nghe bạn, ngay bây giờ:
        </p>
        <ul className="mb-3 list-none space-y-1 text-body text-text">
          <li>Đường dây nóng Ngày Mai — 0963 061 414 (13:00–20:30, Thứ 4 → Chủ nhật)</li>
          <li>Tổng đài Quốc gia Bảo vệ Trẻ em — 111 (24/7)</li>
          <li>Cấp cứu y tế — 115 (nếu tình huống nguy cấp, ngoài giờ Ngày Mai)</li>
        </ul>
        <p className="m-0 max-w-prose text-body text-text">
          Nếu bạn muốn, hãy quay lại khi bạn thấy ổn hơn. Chúng tôi vẫn ở đây.
        </p>
      </section>
    );
  }

  const COPY: Record<Exclude<BlockedCategory, "crisis">, { heading: string; body: string }> = {
    medical: {
      heading: "Câu hỏi này cần một chuyên gia y tế",
      body: "Tarot không thể trả lời câu hỏi về sức khỏe. Hãy tham khảo bác sĩ hoặc chuyên gia y tế — họ mới là người có thể giúp bạn đúng cách. Nếu bạn muốn, hãy thử đặt lại câu hỏi hướng về cảm xúc hoặc tâm trạng của chính mình thay vì tình trạng bệnh cụ thể.",
    },
    legal: {
      heading: "Câu hỏi này cần một chuyên gia pháp lý",
      body: "Tarot không thể trả lời câu hỏi về pháp lý. Hãy tham khảo luật sư hoặc chuyên gia pháp lý — họ mới là người có thể giúp bạn đúng cách. Nếu bạn muốn, hãy thử đặt lại câu hỏi hướng về cảm xúc hoặc tâm trạng của chính mình thay vì kết quả pháp lý cụ thể.",
    },
    harmful: {
      heading: "Không thể tiếp tục với câu hỏi này",
      body: "Chúng tôi không thể hỗ trợ câu hỏi này. Hãy thử đặt một câu hỏi khác.",
    },
    nonsense: {
      heading: "Cần một câu hỏi cụ thể hơn",
      body: "Hãy đặt một câu hỏi cụ thể hơn để chúng tôi có thể giúp bạn.",
    },
  };

  const { heading, body } = COPY[category];

  return (
    <section
      className="rounded-md p-5"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-2 font-heading text-heading-3 text-text focus:outline-none"
      >
        {heading}
      </h2>
      <p className="m-0 max-w-prose text-body text-text">{body}</p>
    </section>
  );
}
