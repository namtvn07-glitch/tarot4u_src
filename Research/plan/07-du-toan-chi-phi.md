# 07 — Dự toán chi phí

*Tỷ giá tham chiếu: 1 USD ≈ 26.000 VNĐ*

## 1. Đơn giá Claude API

| Model | Input $/MTok | Output $/MTok |
|---|---|---|
| `claude-opus-5` | $5.00 | $25.00 |
| `claude-sonnet-5` | **$3.00** | **$15.00** |
| `claude-haiku-4-5` | $1.00 | $5.00 |

> ⚠️ **Sonnet 5 đang có giá giới thiệu $2/$10, hết hạn 31/08/2026.** Lập ngân sách theo giá intro sẽ hụt ~50% từ tháng 9. Mọi con số dưới đây dùng **giá chuẩn $3/$15**; phần chênh trong tháng đầu coi như khuyến mãi.

**Chiết khấu:**

| Cơ chế | Mức | Điều kiện |
|---|---|---|
| Batch API | **−50%** | Không cần realtime, kết quả trong ≤24h |
| Cache read | **0.1×** giá input | Prefix trùng và còn trong TTL |
| Cache write | **1.25×** (TTL 5 phút) / **2×** (TTL 1 giờ) | Trả thêm ở lần đầu |

## 2. Chi phí một lần (trước launch)

Sinh nội dung Lớp Nền và SEO bằng Batch API + Opus 5.

| Việc | Số request | Input tok | Output tok | Chi phí (đã −50% batch) |
|---|---|---|---|---|
| Lớp Nền 780 tổ hợp | 780 | ~741K | ~351K | **$6.24** |
| Nội dung SEO 78 trang | 78 | ~70K | ~94K | **$1.35** |
| Dự phòng chạy lại 1 lần | | | | ~$7.60 |
| **Tổng** | | | | **~$15** |

Đây là toàn bộ chi phí AI cho phần nội dung mà mọi người dùng free sẽ đọc, **vĩnh viễn**. Đây chính là lý do §3 của [03-kien-truc-ai.md](03-kien-truc-ai.md) khuyến nghị dùng model **tốt nhất** cho lớp này: chênh lệch giữa Haiku và Opus 5 ở đây là ~$5 một lần.

Chi phí khác một lần:
- Domain `.com` năm đầu: ~$10–15
- Đăng ký hộ kinh doanh (nếu PayOS yêu cầu): tùy địa phương
- Bộ ảnh 78 lá: **$0** (Rider-Waite public domain)

## 3. Chi phí theo lượt (đơn vị kinh tế)

### 3.1 Kiểm duyệt câu hỏi — Haiku 4.5

| Thành phần | Token | Chi phí |
|---|---|---|
| Input (system 400 + câu hỏi ~80) | 480 | $0.00048 |
| Output (JSON ngắn) | 40 | $0.00020 |
| **Tổng/lượt** | | **$0.0007** |

### 3.2 Lớp Cá nhân 1 lá — Sonnet 5, `thinking: disabled`, `effort: low`

| | Chưa cache (Phase 1) | Có cache (Phase 2+) |
|---|---|---|
| Input system (1.400 tok) | $0.0042 | $0.00042 *(cache read)* |
| Input user turn (250 tok) | $0.00075 | $0.00075 |
| Output (~450 tok) | $0.00675 | $0.00675 |
| **Tổng/lượt** | **$0.012** | **$0.008** |

### 3.3 Lớp Cá nhân 3 lá — Sonnet 5

| | Chưa cache | Có cache |
|---|---|---|
| **Tổng/lượt** | **$0.019** | **$0.015** |

### 3.4 Đọc nhanh (free tier) — Lớp Nền

| | |
|---|---|
| **Tổng/lượt** | **$0.00** *(chỉ một `SELECT`)* |

Nếu user có nhập câu hỏi thì cộng thêm $0.0007 tiền kiểm duyệt.

### 3.5 Tác động của việc tắt thinking

Nếu **không** tắt thinking và để `effort` mặc định `high`:

| Cấu hình | Output tok TB | Chi phí/lượt 1 lá |
|---|---|---|
| Mặc định (adaptive thinking + effort high) | ~1.100 | $0.022 |
| `thinking: disabled` + `effort: low` | ~450 | **$0.008** |

**Chênh 2,75×.** Đây là lớp tối ưu rẻ nhất trong toàn bộ dự án — chỉ là hai dòng cấu hình.

## 4. Chi phí hàng tháng theo giai đoạn

### Phase 1 — MVP / Test (<500 user, ~1.000 lượt/tháng)

Giả định: 10% là Đọc sâu (100 lượt), prompt caching **tắt**.

| Khoản | Chi phí |
|---|---|
| Kiểm duyệt (~500 lượt có câu hỏi) | $0.35 |
| Đọc sâu 100 × $0.012 | $1.20 |
| **Claude API** | **~$2** |
| Vercel Hobby *(chỉ hợp lệ khi CHƯA bật thanh toán)* | $0 |
| Supabase Free | $0 |
| Domain (phân bổ) | ~$1 |
| **Tổng** | **~$3/tháng** ≈ **80.000đ** |

> Ngay khi bật nút thanh toán, phải lên Vercel Pro → $23/tháng ≈ 600.000đ.

### Phase 2 — Ra mắt chính thức (~5.000 lượt/tháng)

Giả định: 20% Đọc sâu (1.000 lượt: 700 một lá, 300 ba lá), prompt caching **bật**.

| Khoản | Chi phí |
|---|---|
| Kiểm duyệt (~3.000 lượt) | $2.10 |
| Đọc sâu 1 lá: 700 × $0.008 | $5.60 |
| Đọc sâu 3 lá: 300 × $0.015 | $4.50 |
| **Claude API** | **~$12** |
| Vercel Pro | $20–40 |
| Supabase Pro | $25–35 |
| Upstash Redis (rate limit) | $0 (free tier) |
| Sentry | $0 (free tier) |
| Domain/SSL | ~$1 |
| **Tổng** | **$58–88/tháng** ≈ **1,5–2,3 triệu đồng** |

> Chú ý tỷ trọng: AI là **$12** trong tổng **$58–88**. Hạ tầng cố định lớn hơn AI gấp 4–6 lần. Nếu cần cắt chi phí ở giai đoạn này, cắt ở hạ tầng, không phải ở model.

### Phase 3 — Tăng trưởng (~40.000 lượt/tháng)

Giả định: 25% Đọc sâu (10.000 lượt: 7.000 một lá, 3.000 ba lá).

| Khoản | Chi phí |
|---|---|
| Kiểm duyệt (~25.000 lượt) | $17.50 |
| Đọc sâu 1 lá: 7.000 × $0.008 | $56 |
| Đọc sâu 3 lá: 3.000 × $0.015 | $45 |
| **Claude API** | **~$120** |
| Vercel Pro + overage | $60–200 |
| Supabase Pro (compute/egress) | $30–100 |
| Upstash | $0–10 |
| Sentry | $0–26 |
| **Tổng** | **$210–456/tháng** ≈ **5,5–12 triệu đồng** |

## 5. Biên lợi nhuận — con số quan trọng nhất

Giả sử gói phổ biến: **129.000đ cho 30 credits** (1 credit = 1 lượt Đọc sâu).

| | Giá trị |
|---|---|
| Doanh thu/lượt Đọc sâu | 4.300đ ≈ **$0.165** |
| Chi phí AI/lượt | **$0.008** |
| **AI chiếm** | **~5% doanh thu** |

**Hệ quả chiến lược:** AI **không phải** là khoản chi phối. Ở Phase 2, hạ tầng cố định ($45–75) lớn hơn AI ($12) gấp 4–6 lần.

> Đừng hy sinh chất lượng nội dung để tiết kiệm $5/tháng tiền AI. Nếu nâng lên Opus 5 cho lớp Cá nhân làm tăng tỷ lệ chuyển đổi thêm 1 điểm phần trăm, nó đã trả lại nhiều hơn toàn bộ khoản chênh lệch.

### Điểm hòa vốn

Chi phí cố định Phase 2 ≈ $70/tháng ≈ 1,8 triệu đồng.

→ Cần khoảng **430 lượt Đọc sâu trả phí/tháng** (~14 lượt/ngày) để hòa vốn.
→ Với tỷ lệ chuyển đổi 3%, tương đương **~14.000 lượt truy cập/tháng**.

Con số này nên là **mục tiêu Bắc Đẩu** của giai đoạn hậu launch, không phải doanh thu.

## 6. Phân tích độ nhạy

### Nếu dùng Opus 5 thay Sonnet 5 cho lớp Cá nhân

| | Sonnet 5 | Opus 5 |
|---|---|---|
| Chi phí/lượt 1 lá (có cache) | $0.008 | $0.013 |
| Phase 2 (1.000 lượt) | $12 | $19 |
| Phase 3 (10.000 lượt) | $120 | $195 |
| % doanh thu | 5% | 8% |

**Đáng thử A/B.** Tăng $7/tháng ở Phase 2 là không đáng kể so với khả năng cải thiện chất lượng nội dung trả phí.

### Nếu quên tắt thinking

| | Có tắt | Quên tắt |
|---|---|---|
| Phase 2 | $12 | $30 |
| Phase 3 | $120 | $310 |

### Nếu bỏ lớp Cá nhân, cache toàn bộ diễn giải

| | Có lớp Cá nhân | Cache toàn bộ |
|---|---|---|
| Phase 3 AI | $120 | ~$18 |
| Cá nhân hóa theo câu hỏi user | ✅ | ❌ |

Tiết kiệm $100/tháng ở Phase 3 — đổi lấy việc bản trả phí trả về nội dung giống hệt nhau cho mọi người. Ở mức doanh thu Phase 3 (~$1.650/tháng từ 10.000 lượt trả phí), $100 là **6% doanh thu**. Không đáng đánh đổi.

## 7. Theo dõi chi phí thực tế

### 7.1 Đo trong DB

Bảng `readings` lưu `input_tokens` và `output_tokens` (xem [04](04-database-schema.md)). Query đối soát hàng tháng:

```sql
select
  date_trunc('month', created_at) as thang,
  model,
  count(*)                        as so_luot,
  sum(input_tokens)               as input_tok,
  sum(output_tokens)              as output_tok,
  round((sum(input_tokens)  * 3.0 / 1e6)::numeric, 2) as usd_input,
  round((sum(output_tokens) * 15.0 / 1e6)::numeric, 2) as usd_output
from readings
where model = 'claude-sonnet-5'
group by 1, 2
order by 1 desc;
```

So con số này với hóa đơn Anthropic. Lệch nhiều = có luồng gọi API mà bạn không biết.

### 7.2 Cảnh báo

- [ ] Anthropic Console: đặt **spend limit** + email alert ở 50% và 80% ngân sách
- [ ] Vercel: bật spend management, đặt trần
- [ ] Supabase: bật cảnh báo egress
- [ ] Sentry: alert khi tỷ lệ `refusal` hoặc `max_tokens` tăng bất thường (dấu hiệu prompt bị hỏng)

### 7.3 Đo token trước khi ước tính lại

Đừng dùng `tiktoken` — đó là tokenizer của OpenAI, đếm sai cho Claude (thiếu 15–20%, sai nhiều hơn với tiếng Việt).

```ts
const { input_tokens } = await client.messages.countTokens({
  model: 'claude-sonnet-5',
  system: PERSONA_AND_FORMAT,
  messages: [{ role: 'user', content: sampleUserTurn }],
})
```

Chạy trên ~20 mẫu thật ngay sau khi chốt prompt, rồi cập nhật lại bảng §3.

**Cập nhật 2026-08-27 — đã thử, kết quả một phần:**

- **`messages.countTokens()` (Sonnet 5, theo đúng kế hoạch trên) — chưa chạy được**: `ANTHROPIC_API_KEY` trong `.env.local` vẫn trả `401 "API key is invalid"` (cùng lỗi đã ghi ở `08-timeline.md §4c`, chưa được sửa). Route debug tạm gọi thử với system prompt + user turn thật của Lớp Cá nhân (3 lá) đã xác nhận lỗi này rồi bị xoá ngay sau đó — không đo được token input cho Sonnet 5 như kế hoạch gốc.
- **Dữ liệu thật đo được — nhưng qua Gemini 3.6 Flash, không phải Sonnet 5** (vì đa nhà cung cấp AI mới thêm, và `AI_PROVIDER` hiện đang trỏ Gemini do key Anthropic sai): 1 lượt Đọc sâu 3 lá thật, câu hỏi tiếng Việt tự do → `input_tokens: 621`, `output_tokens: 542` (đọc trực tiếp từ `readings`, không phải `countTokens()` preflight mà là usage thật của 1 lần generate hoàn chỉnh). So với giả định gốc ở §3.2 (input system 1.400 + user 250 = 1.650, output ~450 cho **1 lá**): input thật cho **3 lá** (621) thấp hơn hẳn giả định 1 lá — vì `buildUserTurn`/`PERSONAL_LAYER_SYSTEM` hiện tại ngắn hơn con số 1.400 token giả định ban đầu; output thật (542) cho 3 lá cao hơn giả định 450 cho 1 lá — hợp lý vì tổng hợp 3 lá cần nhiều chữ hơn.
- **Chưa đủ để cập nhật lại bảng §3 một cách đáng tin cậy**: chỉ có **1 mẫu sạch** (không phải ~20 mẫu như kế hoạch), và mẫu đó đo qua Gemini chứ không phải Sonnet 5 — hai model có giá và hành vi sinh token khác hẳn nhau, không thể quy đổi trực tiếp. Gemini 3.6 Flash cũng **chưa có bảng giá $/MTok xác nhận** trong tài liệu này (khác Sonnet 5 ở §1) — không tự thêm số phỏng đoán vào đây.
- **Còn lại thật sự cần làm**: (1) sửa `ANTHROPIC_API_KEY`, chạy `countTokens()` trên ~20 mẫu thật cho Sonnet 5 đúng kế hoạch gốc; (2) nếu Gemini/OpenAI trở thành provider chính thức cho production, thêm bảng giá $/MTok tương ứng vào §1 rồi mới tính lại §3 cho các provider đó.

---

**Tiếp theo:** [08-timeline.md](08-timeline.md)
