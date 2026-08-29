# Đối tượng & Tone thương hiệu

> Đầu vào cho Giai đoạn 1 — mục "Xác định đối tượng, tone thương hiệu" trong
> [08-timeline.md §3](plan/08-timeline.md), ghi rõ là **đầu vào cho Giai đoạn
> 2 (Thiết kế)**.
>
> Tổng hợp từ [01-san-pham-pham-vi.md](plan/01-san-pham-pham-vi.md) (phạm vi
> sản phẩm) và [doi-thu-canh-tranh.md](doi-thu-canh-tranh.md) (3 đối thủ đã
> nghiên cứu). **Đã được duyệt** — xem mục 5 — dùng làm căn cứ chính thức
> cho Giai đoạn 2.

## 1. Đối tượng mục tiêu

### 1.1 Nhân khẩu học suy ra được từ phạm vi sản phẩm

- 18–35 tuổi, sống ở thành thị Việt Nam — nhóm quen thanh toán QR, dùng mobile
  là chính, có thể trả credits lẻ (không cần thẻ tín dụng quốc tế)
- Có tiếp xúc với tarot qua mạng xã hội (TikTok, Instagram) trước khi đến sản
  phẩm — không phải nhóm tìm "thầy bói truyền thống"
- Sẵn sàng nhập câu hỏi riêng tư (tình yêu, công việc, tài chính) — nghĩa là
  đủ tin tưởng để chia sẻ thông tin cá nhân, nhạy với cách sản phẩm xử lý dữ
  liệu đó

### 1.2 Ba nhóm người dùng chính (persona rút gọn)

| Persona | Động lực | Hành vi dự kiến | Đối chiếu đối thủ |
|---|---|---|---|
| **Người tự khám phá** | Dùng tarot như công cụ phản chiếu tâm lý, không tin "định mệnh" theo nghĩa đen | Thử bản free trước, đọc nhiều, chưa chắc trả tiền ngay | Gần với định vị của tarotcuabin.com ("công cụ phản chiếu tâm lý") |
| **Người cần câu trả lời cụ thể** | Có câu hỏi thật (nên nói gì với người yêu cũ, có nên nghỉ việc) | Vào thẳng, nhập câu hỏi, sẵn sàng trả credits cho "Đọc sâu" ngay lượt đầu | Không đối thủ nào phục vụ tốt — cả 3 đều generic hoặc chỉ cho chọn câu hỏi dựng sẵn |
| **Người dùng thói quen nhẹ** | Xem như một nghi thức nhỏ hàng ngày, không kỳ vọng gì lớn | Quay lại đều, nhạy cảm với tốc độ tải và độ mượt animation | Chưa ai làm tốt ("Lá bài hôm nay" mới nằm ở roadmap Ventus, chưa build) |

> Persona thứ hai là **lý do chính đáng nhất để trả credits** — sản phẩm nên
> ưu tiên thiết kế phễu chuyển đổi (CTA "Đọc sâu") hướng vào nhóm này trước,
> không dàn trải đều cho cả ba.

## 2. Tone thương hiệu

### 2.1 Bốn thuộc tính cốt lõi

| Thuộc tính | Nghĩa là | Không có nghĩa là |
|---|---|---|
| **Huyền bí nhưng hiện đại** | Thị giác giữ chất tarot cổ điển (lá bài, biểu tượng), nhưng câu chữ và UI sạch, không rườm rà | Không phải giao diện dark-fantasy nặng nề, không hiệu ứng khói/nến sến |
| **Ấm áp, không phán xét** | Nói với user như một người bạn hiểu chuyện, không "phán truyền" | Không dùng giọng ra lệnh/khẳng định tuyệt đối ("bạn chắc chắn sẽ...") |
| **Minh bạch** | Nói rõ ranh giới free (nội dung chung) vs paid (cá nhân hoá), không giả vờ free cũng là AI cá nhân | Không che giấu bản chất sinh sẵn của lớp Nền |
| **Tôn trọng, không hù dọa** | Kể cả lá xấu (Tháp, Tử Thần) cũng diễn giải theo hướng xây dựng | Không dùng ngôn ngữ đe doạ/tiêu cực để tạo lo lắng rồi bán "đọc sâu" để giải toả — đây là lằn ranh đạo đức, không chỉ tone |

### 2.2 Từ vựng nên dùng / nên tránh

| Nên dùng | Cân nhắc tránh | Vì sao |
|---|---|---|
| "phản chiếu", "khám phá bản thân", "góc nhìn" | "tiên tri", "định mệnh", "chắc chắn sẽ" | Né kỳ thị "mê tín dị đoan", giữ đúng disclaimer pháp lý đã có ở [06](plan/06-bao-mat-kiem-duyet-phap-ly.md); tarotcuabin.com đã đi trước hướng này và có vẻ hiệu quả với đối tượng trẻ |
| "câu hỏi của bạn", "trường hợp của bạn" | "vận mệnh", "số phận" | Nhấn đúng giá trị cốt lõi: cá nhân hoá thật ở bản trả phí |
| "Đọc nhanh" / "Đọc sâu" | "miễn phí" / "trả phí" (khi nói với user) | Tên gọi sản phẩm đã chốt ở `01-san-pham-pham-vi.md`, tránh làm loãng bằng cách gọi khác trong copy UI |

### 2.3 Ví dụ áp dụng — diễn giải lá Tháp (The Tower), một lá thường bị viết theo hướng doạ dẫm

- ❌ *"Tai hoạ đang đến gần, mọi thứ bạn xây dựng sắp sụp đổ."*
- ✅ *"Một điều gì đó không còn vững như bạn nghĩ. Lá Tháp không báo điềm xấu
  — nó chỉ ra thời điểm để buông thứ đã rạn nứt, trước khi nó tự sụp theo
  cách khó kiểm soát hơn."*

## 3. Định vị so với 3 đối thủ đã nghiên cứu

Tóm tắt từ [doi-thu-canh-tranh.md §4](doi-thu-canh-tranh.md) — chi tiết đầy
đủ ở đó, không lặp lại toàn bộ bảng so sánh ở đây.

- **boitarot.com.vn / boitarot.vn**: thiên về "xem bói" truyền thống, có lớp
  reader người thật tạo tin cậy nhưng tone dễ ngả sang huyền bí hoá quá đà.
  Ventus khác ở chỗ minh bạch AI + free/paid rõ ràng, không giả vờ là "thầy
  bói online".
- **tarotcuabin.com**: gần nhất về tone (phản chiếu tâm lý, ấm áp, cá nhân
  hoá thật) nhưng thương hiệu cá nhân hoá quá mức (gắn với một người tên
  "Bin") giới hạn khả năng mở rộng/tin cậy ở quy mô lớn hơn. Ventus nên giữ
  tone ấm áp tương tự nhưng thương hiệu trung lập hơn, không gắn với một cá
  nhân cụ thể.

## 4. Gợi ý cho Giai đoạn 2 (không phải quyết định cuối)

Đây là định hướng mood, **không thay thế** bước "Định nghĩa design token" ở
Giai đoạn 2 — chỉ là input để Giai đoạn 2 không bắt đầu từ số 0:

- Mood keyword: *tĩnh lặng, sâu, ấm* — tránh *u ám, đáng sợ, lòe loẹt*
- Bảng màu gợi ý hướng đi (không phải token cuối): nền tối làm chủ đạo (khớp
  với cảnh báo contrast ở `01-san-pham-pham-vi.md §6`), phối theo mệnh
  **Thổ + Kim** thay vì tím lạnh thuần tuý — để khác biệt thị giác với
  boitarot.com.vn (tím) và tránh trộn lẫn, đồng thời hợp phong thuỷ:
  - **Màu nhấn chính (Thổ)**: vàng đất / nâu đất / be ấm (bản mệnh Thổ)
  - **Màu nhấn phụ / highlight (Kim)**: ánh bạc, xám kim loại, trắng ngà —
    dùng cho chi tiết nhỏ (viền, icon, hiệu ứng lấp lánh khi lật bài); Thổ
    sinh Kim nên hai tông này đi cùng nhau tự nhiên, không cần cân bằng gượng ép
  - **Tránh làm màu chủ đạo**: xanh lá/xanh dương đậm (Mộc khắc Thổ), đỏ/cam
    rực (Hỏa khắc Kim) — có thể dùng rất hạn chế làm điểm nhấn cảnh báo/lỗi
    (semantic `danger`), không dùng cho thương hiệu
- Ảnh lá bài (Rider-Waite) giữ nguyên nét cổ điển — **không** vẽ lại theo
  phong cách hiện đại hoá, vì tính xác thực của bộ bài là một phần uy tín
  sản phẩm

## 5. Đã chốt

> Toàn bộ tài liệu đã được duyệt, kèm 1 điều chỉnh về màu.

1. ✅ Ba persona ở mục 1.2 — giữ nguyên thứ tự ưu tiên.
2. ✅ Tone "phản chiếu tâm lý" (né chữ "bói toán") — giữ nguyên định vị.
3. ✅ Bảng màu — đổi từ vàng đồng/hổ phách sang phối **Thổ (vàng đất/nâu
   đất) + Kim (ánh bạc/trắng ngà)**, xem mục 4.

*Nguồn: `Research/plan/01-san-pham-pham-vi.md` · `Research/doi-thu-canh-tranh.md`*
