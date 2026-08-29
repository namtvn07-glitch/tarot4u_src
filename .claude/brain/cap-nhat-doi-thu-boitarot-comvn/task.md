# Task: Cập nhật nghiên cứu đối thủ — boitarot.com.vn (mục 1)

> Created: 2026-08-16 · Slug: `cap-nhat-doi-thu-boitarot-comvn`

## Goal
`Research/doi-thu-canh-tranh.md` mục 1 (boitarot.com.vn) phản ánh đúng dữ
liệu đã xác minh trực tiếp từ source JS thật (qua bản mirror ở
`src_template/`), thay vì các dòng "không xác minh được" còn sót từ lần
nghiên cứu bằng fetch tĩnh — và cảnh báo rõ 2 pattern quan sát được nhưng
không nên áp dụng cho Ventus.

## Scope
**In**:
- Mục "## 1. boitarot.com.vn": Luồng người dùng, Mô hình tính phí (có
  **correction** quan trọng — xem Open Questions), Tính năng, UI/UX (phần
  công nghệ nền), SEO & nội dung (số trang thật).
- Thêm subsection "Không nên copy" trong "Ý nghĩa đối với Ventus Tarot" của
  mục 1 — 2 pattern cụ thể kèm lý do.
- Mục "## 4. So sánh 3 đối thủ" — cập nhật các ô thuộc cột boitarot.com.vn
  bị ảnh hưởng bởi correction ở Mô hình tính phí.
- Mục "## 5. Đề xuất" — sửa câu lý do ở đề xuất #1 cho khớp fact mới.
- Mục "## 6. Việc nên làm tiếp" — thêm 2 ghi chú tham chiếu (teaser box,
  polling backoff khi tab ẩn) làm việc cần làm tiếp, không triển khai ngay.
- Dòng "Nguồn" cuối file — ghi rõ đã bổ sung nguồn đọc JS source thật.

**Out**:
- Không sửa `05-thanh-toan-credits.md` hay bất kỳ file `Research/plan/*`
  nào khác (mặc định — xem Open Questions nếu muốn đổi).
- Không nghiên cứu lại mục 2 (tarotcuabin.com) hay mục 3 (boitarot.vn) —
  hai domain đó không có nguồn mới.
- Không sửa code, không đụng `src/`.

## Assumptions
- Bản mirror ở `src_template/tarot/boitarot.com.vn` phản ánh đúng hành vi
  production hiện tại của site (không có A/B test hay phiên bản khác đang
  chạy song song) — hợp lý vì timestamp upload gần nhất là 2025/11.
- "SePay QR + mã dùng một lần (code-quota-rotator)" được tính là **có** thu
  phí online theo nghĩa rộng (tự động, không cần admin thao tác thủ công),
  dù không phải cổng thanh toán chuẩn như PayOS — bảng so sánh phải ghi rõ
  sự khác biệt này, không đánh đồng hai mô hình.

## Checklist
- [ ] Plan approved
- [ ] Mục 1 — Luồng người dùng sửa
- [ ] Mục 1 — Mô hình tính phí sửa (correction)
- [ ] Mục 1 — Tính năng sửa
- [ ] Mục 1 — UI/UX (công nghệ nền) sửa
- [ ] Mục 1 — SEO & nội dung sửa
- [ ] Mục 1 — subsection "Không nên copy" thêm mới
- [ ] Mục 4 — bảng so sánh cập nhật cột boitarot.com.vn
- [ ] Mục 5 — đề xuất #1 sửa câu lý do
- [ ] Mục 6 — 2 ghi chú tham chiếu thêm mới
- [ ] Nguồn cuối file cập nhật
- [ ] Đọc lại toàn file kiểm tra không mâu thuẫn nội bộ

## Progress Log
- 2026-08-16 plan viết, chưa execute

## Open Questions
- Có cập nhật mục 4 + mục 5 hay chỉ mục 1 như yêu cầu gốc? → Khuyến nghị
  **có**, vì correction ở Mô hình tính phí làm mục 4/5 mâu thuẫn với mục 1
  nếu để nguyên. Cần bạn xác nhận.
- Chi tiết polling dãn nhịp khi tab ẩn: ghi thẳng vào
  `05-thanh-toan-credits.md §5`, hay chỉ note lại ở mục 6? → Khuyến nghị
  **chỉ note lại** lần này, giữ phạm vi 1 file. Cần bạn xác nhận nếu muốn
  sửa luôn cả kiến trúc.
