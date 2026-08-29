# 09 — Roadmap sau launch

## Nguyên tắc sắp xếp ưu tiên

Xếp theo **giá trị / công sức**, và ưu tiên thứ củng cố vòng lặp giữ chân trước thứ mở rộng bề ngang. Một sản phẩm có 1.000 user quay lại hàng tuần đáng giá hơn 10.000 user dùng một lần.

Chỉ số Bắc Đẩu giai đoạn đầu: **số lượt Đọc sâu trả phí/tháng**. Điểm hòa vốn ≈ 430 lượt/tháng (xem [07 §5](07-du-toan-chi-phi.md)).

---

## Ngắn hạn (0–3 tháng sau launch)

### Ổn định — làm trước tất cả

- [ ] Theo dõi Sentry hàng ngày trong 2 tuần đầu
- [ ] Đối soát `profiles.credits` vs `sum(credit_ledger.delta)` hàng tuần — query phải trả 0 dòng
- [ ] Đối soát chi phí AI thật (từ `readings.input_tokens/output_tokens`) vs hóa đơn Anthropic
- [ ] Đo tỷ lệ `stop_reason: refusal` và `max_tokens` — tăng bất thường nghĩa là prompt hỏng
- [ ] Kiểm tra `usage.cache_read_input_tokens` — nếu vẫn = 0 thì prompt caching chưa chạy

### "Lá bài hôm nay" — tính năng giữ chân, chi phí $0

Lý do ưu tiên cao: đây là cơ chế **quay lại hàng ngày** rẻ nhất có thể xây.

- Mỗi ngày chọn 1 lá (deterministic theo ngày, ai cũng thấy giống nhau)
- Nội dung lấy từ `base_content` với `topic = 'general'` → **không tốn API call**
- Không cần đăng nhập → cửa vào cho SEO và chia sẻ
- CTA tự nhiên: "Muốn biết lá này nói gì về tình huống của bạn?" → Đọc sâu

**Công sức: ~2 ngày. Chi phí AI: $0.**

### Tối ưu chuyển đổi

- [ ] Đo phễu: xem kết quả free → nhấn CTA → đăng nhập → chọn gói → thanh toán thành công
- [ ] A/B vị trí và câu chữ CTA
- [ ] A/B `claude-sonnet-5` vs `claude-opus-5` cho lớp Cá nhân — xem [07 §6](07-du-toan-chi-phi.md), chênh $7/tháng ở Phase 2
- [ ] Tặng 1 credit miễn phí cho lần đăng ký đầu — cho user nếm thử bản trả phí

### Chất lượng nội dung

- [ ] Nút phản hồi "Diễn giải này có đúng không?" dưới mỗi kết quả → dữ liệu để tinh chỉnh prompt
- [ ] Đọc lại 780 đoạn Lớp Nền, sửa những đoạn yếu; chạy lại batch cho phần cần sửa (rẻ)

---

## Trung hạn (3–6 tháng)

### Chia sẻ kết quả lên MXH

> ⚠️ Tính năng này **phụ thuộc vào lớp Cá nhân**. Nếu diễn giải trả phí được cache toàn bộ, hai người share ra sẽ thấy chữ y hệt nhau — chia sẻ MXH sẽ tự phơi bày điều đó ở quy mô lớn.

- Sinh ảnh card đẹp (Satori / `@vercel/og`) chứa lá bài + 1 câu trích từ diễn giải
- Watermark domain
- OG tags để preview đẹp khi paste link
- **Công sức: ~3 ngày**

### Blog / nội dung SEO chiều sâu

- Mở rộng ngoài 78 trang lá bài: "ý nghĩa lá X trong tình yêu", "cách trải bài 3 lá", "Major vs Minor Arcana"
- Sinh bằng Batch API, nhưng **biên tập tay** — Google phạt nội dung sinh hàng loạt không có giá trị bổ sung
- Mỗi bài cần thứ chỉ bạn có: ảnh riêng, ví dụ cụ thể, dữ liệu từ chính sản phẩm ("lá hay ra nhất tháng này")

### Đa dạng spread

- Celtic Cross (10 lá), Quan hệ (5 lá), Quyết định (2 lá)
- Chi phí AI tăng theo số lá ở lớp Cá nhân — Celtic Cross ước tính ~$0.04/lượt
- Định giá theo credits tương ứng (Celtic Cross = 3 credits)
- Cần sinh thêm Lớp Nền cho các **vị trí** (position) đặc thù của từng spread

### Referral

- Mời bạn → cả hai nhận credits
- Chống lạm dụng: chỉ tính khi người được mời **thanh toán** lần đầu, không phải khi đăng ký
- Ghi vào `credit_ledger` với `reason = 'bonus'`

### Chuyển rate limit sang Upstash

Khi lưu lượng đủ lớn, rate limit bằng Postgres thành nút cổ chai. Xem [06 §2.4](06-bao-mat-kiem-duyet-phap-ly.md).

---

## Dài hạn (6–12 tháng)

### Cá nhân hóa sâu — AI tham chiếu lịch sử

Cho lớp Cá nhân đọc 3–5 lượt trải bài gần nhất của user để tạo mạch liên tục:

> *"Ba tuần trước bạn rút Bát Kiếm cho chủ đề công việc. Lần này là Sáu Gậy — có gì đó đã dịch chuyển."*

**Đây là hào lũy cạnh tranh mạnh nhất trong roadmap.** Đối thủ không có lịch sử của user thì không sao chép được, và nó tăng chi phí chuyển đổi sang sản phẩm khác.

Lưu ý kỹ thuật:
- Chỉ truyền **tóm tắt** lượt cũ (lá + chủ đề + 1 câu), không truyền toàn văn — giữ input nhỏ
- Cần đồng ý rõ ràng của user (dữ liệu rất riêng tư)
- Chi phí tăng ~$0.003/lượt

### Subscription thay vì credits lẻ

- Gói tháng: không giới hạn Đọc nhanh + N lượt Đọc sâu
- Doanh thu định kỳ dễ dự báo hơn
- Cần PayOS hỗ trợ thanh toán định kỳ — **xác minh trước khi lên kế hoạch**
- Ledger đã sẵn sàng: cấp credits hàng tháng với `reason = 'bonus'`

### App mobile

Chỉ làm **nếu** traffic web đủ lớn để justify. Tiêu chí gợi ý: >30% traffic từ mobile **và** >5.000 user hoạt động hàng tháng. Trước đó, PWA (thêm vào màn hình chính, thông báo đẩy cho "Lá bài hôm nay") đạt được 80% giá trị với 10% công sức.

### Đa ngôn ngữ

- Tiếng Anh mở rộng thị trường lớn nhất
- Chi phí: sinh lại 780 tổ hợp Lớp Nền cho mỗi ngôn ngữ (~$6/ngôn ngữ — rẻ)
- Chi phí thật nằm ở i18n giao diện và SEO đa ngôn ngữ, không phải AI
- Cân nhắc kỹ: cạnh tranh tarot tiếng Anh rất khốc liệt; lợi thế của bạn là thị trường Việt

---

## Những thứ nên cân nhắc KHÔNG làm

| Ý tưởng | Vì sao nên bỏ qua |
|---|---|
| Chat qua lại với "AI thầy bói" | Chi phí token tăng tuyến tính theo lượt chat, khó định giá, và mở rộng bề mặt rủi ro kiểm duyệt lên rất nhiều |
| Cho user upload ảnh bộ bài riêng | Chi phí vision token cao, moderation ảnh phức tạp, giá trị thấp |
| Chiêm tinh / tử vi / thần số học | Mỗi cái là một sản phẩm riêng với hệ tri thức riêng. Làm tốt một thứ trước |
| Marketplace cho người xem bài thật | Chuyển bạn thành sàn giao dịch — mô hình kinh doanh, rủi ro pháp lý và vận hành hoàn toàn khác |

---

## Bảng tổng hợp ưu tiên

| Tính năng | Công sức | Tác động | Chi phí AI thêm | Ưu tiên |
|---|---|---|---|---|
| Lá bài hôm nay | 2 ngày | Cao (giữ chân) | $0 | 🔥 Làm ngay |
| Tặng 1 credit đăng ký | 0,5 ngày | Cao (chuyển đổi) | ~$0.01/user | 🔥 Làm ngay |
| Nút phản hồi chất lượng | 1 ngày | Trung bình (dữ liệu) | $0 | 🔥 Làm ngay |
| A/B model lớp Cá nhân | 2 ngày | Trung bình–Cao | +$7/tháng | Cao |
| Chia sẻ MXH | 3 ngày | Cao (viral) | $0 | Cao |
| Blog SEO | Liên tục | Cao (traffic) | ~$0.02/bài | Cao |
| Spread đa dạng | 5 ngày | Trung bình | +$0.04/lượt | Trung bình |
| Referral | 3 ngày | Trung bình | $0 | Trung bình |
| Cá nhân hóa theo lịch sử | 4 ngày | **Rất cao (hào lũy)** | +$0.003/lượt | Trung bình–Cao |
| Subscription | 5 ngày | Cao (doanh thu ổn định) | $0 | Trung bình |
| PWA | 3 ngày | Trung bình | $0 | Thấp |
| App mobile | 6+ tuần | ? | $0 | Chỉ khi có số liệu chứng minh |
| Đa ngôn ngữ | 3 tuần | ? | $6/ngôn ngữ | Thấp |
