# 01 — Sản phẩm & Phạm vi

## 1. Sản phẩm là gì

Web app tarot: người dùng chọn chủ đề → xáo và rút bài → nhận diễn giải. Có tài khoản, gói credits trả phí, thanh toán QR nội địa.

## 2. Ràng buộc trung tâm: cá nhân hóa vs. chi phí

Sản phẩm hứa "diễn giải **cá nhân hóa**" và cho user nhập câu hỏi riêng. Nhưng cách rẻ nhất để phục vụ nội dung tarot là sinh sẵn theo `(lá, hướng, chủ đề)` rồi cache — mà cách đó **không có chiều nào chứa câu hỏi của user**.

Nếu cache toàn bộ diễn giải:

- Hai người hỏi hai chuyện khác nhau, rút cùng lá → nhận **văn bản y hệt**
- Cùng một người rút lại lá đó tháng sau → cũng y hệt
- Tính năng chia sẻ MXH (roadmap trung hạn) sẽ **phơi bày** điều này: hai người share ra thấy trùng chữ

Nếu không cache gì cả, mỗi lượt free đều tốn tiền API và không kiểm soát được chi phí khi có traffic bot.

### Cách giải quyết: tách hai tầng sản phẩm

| Tầng | Tên hiển thị | Nội dung | Nguồn | Chi phí AI |
|---|---|---|---|---|
| **Free** | "Đọc nhanh" | Ý nghĩa lá bài theo chủ đề — nội dung nền, giống nhau cho mọi người | Sinh sẵn bằng Batch API, đọc từ cache | **$0** |
| **Paid** | "Đọc sâu" | Nối câu hỏi **cụ thể** của bạn với lá bài vừa rút | Gọi Claude realtime, streaming | ~$0.009–0.02/lượt |

Điểm mấu chốt: **free generic là chấp nhận được và dễ hiểu** (user không trả tiền thì nhận nội dung chung — không ai phàn nàn). Nhưng **paid bắt buộc phải cá nhân thật**. Đây vừa là giải pháp chi phí, vừa là phễu chuyển đổi tự nhiên: user đọc bản free thấy đúng chung chung → muốn biết "còn với trường hợp của tôi thì sao?" → trả credits.

Chi tiết kỹ thuật ở [03-kien-truc-ai.md](03-kien-truc-ai.md).

## 3. Phạm vi v1 (MVP)

### Có

**Trải bài**
- Chọn chủ đề: Tình yêu · Công việc · Tài chính · Tinh thần · Tổng quát (5 chủ đề cố định)
- Xáo bài + rút bài với animation
- Trải 1 lá (free và paid) — trải 3 lá (paid)
- Trải 3 lá (Đọc sâu) dùng **giao diện "tự tay chọn"**: hiện một dải lá úp
  (nhiều vị trí hơn 3, xem `03-kien-truc-ai.md §7.2`) để user tự bấm chọn
  theo cảm giác, thay vì chỉ có 1 nút "xáo bài" duy nhất như luồng free 1
  lá. Lấy cảm hứng từ boitarot.com.vn nhưng điều chỉnh cơ chế RNG để không
  lộ danh tính lá qua client trước khi chọn — chi tiết ở `03-kien-truc-ai.md §7.2`.
- Diễn giải: lớp Nền hiển thị ngay, lớp Cá nhân stream vào sau (nếu paid)
- Lưu lịch sử trải bài

**Tài khoản**
- Đăng nhập Magic link + Google OAuth + Email/mật khẩu (bổ sung 2026-08-18 —
  đường dự phòng không phụ thuộc gửi email thật; "email" ở đây chỉ là định
  danh tài khoản do user tự đặt, không cần là email thật nhận được mail. Cần
  tắt "Confirm email" trong Supabase Dashboard để hoạt động không cần xác
  minh — xem `.claude/brain/phase-5-tai-khoan/`)
- Trang cá nhân: số credits, lịch sử trải bài, lịch sử giao dịch

**Thanh toán**
- 3 gói credits
- QR PayOS, cập nhật trạng thái realtime
- Sổ cái credits đầy đủ

**Nội dung & SEO**
- 78 trang tĩnh (SSG) ý nghĩa từng lá
- Meta tags, OG image, sitemap, robots.txt

**Vận hành**
- Rate limit theo IP/session
- Kiểm duyệt câu hỏi người dùng
- Trang điều khoản, chính sách quyền riêng tư, chính sách hoàn tiền
- Error tracking

### Không có ở v1 (đẩy sang roadmap)

- Chia sẻ kết quả lên MXH (ảnh card tự sinh)
- "Lá bài hôm nay"
- Celtic Cross và các spread phức tạp
- Referral
- Blog dài (chỉ có 78 trang lá bài)
- App mobile
- Đa ngôn ngữ
- Subscription định kỳ

## 4. Bốn trạng thái cho mọi màn hình bất đồng bộ

Theo `.claude/rules/code-style.md` — mỗi surface load dữ liệu phải thiết kế đủ 4 trạng thái:

| Màn hình | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Diễn giải AI | Skeleton lá bài + shimmer text | — | "Không tạo được diễn giải. Credits chưa bị trừ." + nút thử lại | Text stream vào |
| Lịch sử trải bài | Skeleton list 3 dòng | "Bạn chưa trải bài lần nào" + CTA | Nút tải lại | Danh sách |
| Lịch sử giao dịch | Skeleton | "Chưa có giao dịch" | Nút tải lại | Bảng |
| Màn QR thanh toán | Spinner tạo QR | — | "Không tạo được mã QR" + thử lại | QR + đếm ngược + trạng thái realtime |

> ⚠️ Màn QR có **trạng thái thứ 5**: hết hạn (timeout). Phải xử lý riêng — xem [05-thanh-toan-credits.md](05-thanh-toan-credits.md).

## 5. Luồng người dùng chính

### 5.1 Trải bài (chưa đăng nhập)

```
Trang chủ → Chọn chủ đề → Xáo/rút 1 lá
  → Hiển thị lớp Nền (từ cache, $0)
  → CTA: "Đọc sâu cho câu hỏi của bạn" → yêu cầu đăng nhập
```

Giới hạn: 3 lượt/ngày theo IP (chống lạm dụng, xem [06](06-bao-mat-kiem-duyet-phap-ly.md)).

### 5.2 Trải bài sâu (đã đăng nhập, có credits)

```
Chọn chủ đề → Nhập câu hỏi (tùy chọn, max 300 ký tự)
  → Kiểm duyệt câu hỏi (Haiku 4.5, ~200ms) — cùng lượt gọi này phân loại
    luôn câu hỏi có thuộc nhóm "ép hướng" không (xem 03-kien-truc-ai.md
    §7.1), không thêm lượt gọi AI riêng
  → Server rút 3 lá + hướng (RNG server-side, áp quy tắc ép hướng nếu
    phân loại ở trên yêu cầu) — kết quả giữ kín, gói vào token ký, CHƯA
    gửi nội dung thật về client
  → Hiện dải lá úp (nhiều vị trí hơn 3) cho user tự bấm chọn 3 vị trí bất
    kỳ theo cảm giác
  → Mỗi lần bấm 1 vị trí, server trả đúng 1 trong 3 lá đã rút sẵn theo
    THỨ TỰ user đã chọn, KÈM diễn giải Lớp Nền của đúng lá đó (đọc từ
    `base_content`, $0 API) — vị trí bấm không quyết định lá nào lộ ra
    (xem 03-kien-truc-ai.md §7.2). Đây vẫn là **Đọc nhanh — không trừ
    credits**, chỉ cần đăng nhập để vào được luồng Đọc sâu
  → Sau khi lộ đủ 3 lá + đọc xong Lớp Nền từng lá, hiện nút riêng
    **"Đọc sâu cho câu hỏi của bạn"**
  → User bấm nút → Trừ credits (atomic) → Stream Lớp Cá nhân (Claude
    Sonnet 5, dùng đúng câu hỏi + 3 lá đã rút)
  → Lưu vào readings
```

> Trừ credits **trước** khi gọi AI, hoàn lại nếu API lỗi. Không bao giờ gọi AI trước rồi trừ sau — user có thể đóng tab giữa chừng. Lớp Nền của cả 3 lá hiển thị **trước** bước trừ credits — đây là phần "xem thử miễn phí" thuyết phục user bấm "Đọc sâu", đúng nguyên tắc phễu chuyển đổi ở §2 phía trên.

### 5.3 Nạp credits

```
Chọn gói → Server tạo order (pending) + gọi PayOS
  → Hiển thị QR + subscribe Realtime
  → User quét, PayOS gọi webhook
  → Server verify signature → cộng credits (idempotent)
  → Realtime đẩy trạng thái về client → chuyển màn
```

## 6. Định nghĩa "xong"

Theo `.claude/rules/verification.md`, một thay đổi chỉ được coi là xong khi qua đủ gate. Riêng với dự án này, bổ sung 3 gate đặc thù:

| Gate | Yêu cầu |
|---|---|
| **Responsive** | Kiểm tra ở 375 / 768 / 1280 / 1920px. Animation lật bài phải mượt ở 375px trên thiết bị thật, không chỉ DevTools |
| **Cả 2 theme** | Mood "huyền bí" thường thiên tối — nếu có light mode, mọi surface/border/text phải theme-aware |
| **Reduced motion** | Animation xáo/lật bài **bắt buộc** có đường không-animation cho `prefers-reduced-motion: reduce`. Đây là tính năng cốt lõi, không phải hiệu ứng trang trí |

---

**Tiếp theo:** [02-tech-stack.md](02-tech-stack.md)
