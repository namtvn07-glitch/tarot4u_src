// Nội dung nguyên văn từ Research/plan/06-bao-mat-kiem-duyet-phap-ly.md §4.2
// — bắt buộc hiện dưới MỌI kết quả trải bài, không giấu trong Điều khoản.
// Trích từ ResultPanel.tsx (Đọc nhanh) ra component riêng để Đọc sâu
// (DeepResultStream.tsx) dùng chung, tránh 2 bản chép tay lệch nhau theo
// thời gian.
export function ReadingDisclaimer() {
  return (
    <div
      role="note"
      className="mt-5 flex items-start gap-3 rounded-md bg-surface-raised p-4 text-body-sm text-text-muted"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <span aria-hidden="true">✦</span>
      <p className="m-0 max-w-prose">
        Đây là công cụ phản chiếu, không thay thế tư vấn y tế, pháp lý hoặc
        tâm lý chuyên môn.
      </p>
    </div>
  );
}
