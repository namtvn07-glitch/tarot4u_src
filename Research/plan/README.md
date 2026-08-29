# Web Tarot AI — Tài liệu dự án

Web app tarot: người dùng chọn chủ đề, xáo và rút bài, nhận diễn giải. Có tài khoản, gói credits trả phí, thanh toán QR nội địa.

## Mục lục

| File | Nội dung | Đọc khi |
|---|---|---|
| [01-san-pham-pham-vi.md](01-san-pham-pham-vi.md) | Sản phẩm là gì, phạm vi v1, luồng người dùng | Trước mọi thứ khác |
| [02-tech-stack.md](02-tech-stack.md) | Stack, lý do chọn, cấu hình hạ tầng | Giai đoạn setup |
| [03-kien-truc-ai.md](03-kien-truc-ai.md) | **Kiến trúc AI 2 lớp + 6 lớp tối ưu chi phí** | Trước khi viết API route đầu tiên |
| [04-database-schema.md](04-database-schema.md) | Schema, RLS, index, migration | Giai đoạn setup nền tảng |
| [05-thanh-toan-credits.md](05-thanh-toan-credits.md) | Luồng PayOS, sổ cái credits, chống trùng webhook | Trước khi code thanh toán |
| [06-bao-mat-kiem-duyet-phap-ly.md](06-bao-mat-kiem-duyet-phap-ly.md) | Rate limit, kiểm duyệt nội dung, pháp lý | Song song với phát triển |
| [07-du-toan-chi-phi.md](07-du-toan-chi-phi.md) | Đơn giá, mô hình chi phí/lượt, 3 phase | Khi lập ngân sách |
| [08-timeline.md](08-timeline.md) | Timeline 6–8 tuần, task chi tiết, phương án cắt phạm vi | Khi lên lịch |
| [09-roadmap.md](09-roadmap.md) | Sau launch: ngắn / trung / dài hạn | Sau khi ra mắt |

## Sáu quyết định kiến trúc cốt lõi

Những lựa chọn dưới đây chi phối phần lớn nội dung còn lại. Nếu thay đổi bất kỳ điểm nào, phải đọc lại file tương ứng.

**1. Nội dung tách làm 2 lớp.** Lớp Nền (780 tổ hợp lá × hướng × chủ đề) sinh sẵn một lần bằng Batch API, phục vụ từ Postgres, chi phí runtime $0. Lớp Cá nhân gọi Claude realtime, chỉ đọc câu hỏi cụ thể của user, chỉ có ở bản trả phí. → [03](03-kien-truc-ai.md)

**2. Free generic, Paid cá nhân.** Bản miễn phí trả về nội dung nền giống nhau cho mọi người — điều này minh bạch và dễ chấp nhận. Bản trả phí bắt buộc phải cá nhân hóa thật, nếu không sản phẩm sẽ đổ khi user so sánh kết quả với nhau. → [01](01-san-pham-pham-vi.md)

**3. Nội dung sinh sẵn dùng model tốt nhất.** Chi phí viết một lần được phân bổ trên hàng chục nghìn lượt đọc, nên gần như bằng 0. Phân tầng model theo giá chỉ áp dụng cho tác vụ realtime. → [03 §3](03-kien-truc-ai.md)

**4. Mọi thay đổi credits đi qua sổ cái.** `profiles.credits` không bao giờ được cộng/trừ trực tiếp — luôn qua Postgres function ghi đồng thời vào `credit_ledger` trong một transaction. Webhook thanh toán phải idempotent. → [05](05-thanh-toan-credits.md)

**5. Câu hỏi tự do đi kèm nghĩa vụ kiểm duyệt.** Cho user nhập câu hỏi cá nhân trong bối cảnh bói toán nghĩa là sẽ nhận câu hỏi về tự tử, bệnh tật, pháp lý. Lớp phân loại chạy trước khi rút bài là bắt buộc, không phải tùy chọn. → [06 §3](06-bao-mat-kiem-duyet-phap-ly.md)

**6. Mọi thứ liên quan đến tiền và random chạy server-side.** RNG rút bài, trừ credits, giá gói, gọi Claude, gọi PayOS. Client không bao giờ được tin. → [06 §1.2](06-bao-mat-kiem-duyet-phap-ly.md)

## Nguyên tắc vận hành

1. **AI chỉ chiếm ~5% doanh thu** (xem [07 §5](07-du-toan-chi-phi.md)). Hạ tầng cố định mới là khoản chi phối ở giai đoạn đầu. Đừng hy sinh chất lượng sản phẩm để tiết kiệm vài đô tiền token.
2. **Đo, đừng đoán.** Dùng `count_tokens` trước khi ước tính chi phí; kiểm tra `usage.cache_read_input_tokens` để xác nhận cache thật sự hoạt động; đối soát `readings.input_tokens` với hóa đơn Anthropic hàng tháng.
3. **Thứ gì không kiểm chứng được thì không coi là xong.** Xem `.claude/rules/verification.md`.
