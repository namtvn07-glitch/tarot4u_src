# Cập nhật nghiên cứu đối thủ — boitarot.com.vn (mục 1)

Cập nhật `Research/doi-thu-canh-tranh.md` mục 1 để phản ánh dữ liệu đã xác
minh trực tiếp từ đọc source JS thật của boitarot.com.vn (bản mirror
HTTrack ở `src_template/`), thay cho các dòng "không xác minh được" ghi lại
từ lần nghiên cứu trước bằng fetch tĩnh. Việc đọc nguồn mới lật ra một
**correction quan trọng**: đối thủ này thật ra **có** thu phí online (SePay
QR + mã dùng một lần) — trái với kết luận cũ "không có mô hình thu phí
online" — nên phần "Ý nghĩa đối với Ventus" và bảng so sánh mục 4/5 cũng
cần sửa theo để tài liệu không tự mâu thuẫn.

## Decisions Needed From You
> [!IMPORTANT]
> - **Có cập nhật mục 4 (bảng so sánh) và mục 5 (đề xuất #1) hay chỉ mục 1?**
>   Khuyến nghị: **có, cập nhật cả hai.** Lý do: mục 4 hiện ghi "Thu phí
>   online: Không có" cho boitarot.com.vn — sai theo dữ liệu mới. Nếu chỉ
>   sửa mục 1 mà để nguyên mục 4/5, tài liệu sẽ tự mâu thuẫn ngay trong
>   cùng file.
> - **Chi tiết polling dãn nhịp khi tab ẩn (`document.hidden`)**: ghi thẳng
>   vào `05-thanh-toan-credits.md §5`, hay chỉ note lại ở mục 6 của
>   `doi-thu-canh-tranh.md` (không sửa file kiến trúc lần này)? Khuyến nghị:
>   **chỉ note lại**, giữ phạm vi đúng 1 file như yêu cầu ban đầu — sửa tài
>   liệu kiến trúc nên là quyết định riêng, có chủ đích.

## Approach
Toàn bộ thay đổi nằm trong một file, thực hiện bằng các edit theo đoạn (mỗi
đoạn là một string thay thế chính xác, không viết lại toàn file). Thứ tự:
(1) sửa 5 đoạn trong mục 1 — Luồng người dùng, Mô hình tính phí (correction
+ cảnh báo ⚠️), Tính năng, UI/UX, SEO & nội dung; (2) thêm subsection "Không
nên copy" vào cuối "Ý nghĩa đối với Ventus Tarot" của mục 1; (3) sửa 4 ô
trong bảng mục 4 và câu lý do ở dòng #1 mục 5 cho khớp correction; (4) thêm
1 bullet mới vào mục 6; (5) append 1 câu vào dòng "Nguồn" cuối file. Không
viết lại các mục 2, 3 (tarotcuabin.com, boitarot.vn) — không có nguồn mới
cho hai domain đó.

**Considered and rejected**
- Viết lại toàn bộ mục 1 từ đầu — rejected: phần "Tổng quan" (định vị, tone,
  team) vẫn đúng và không có gì để verify thêm, viết lại không cần thiết
  tăng diff và rủi ro lệch giọng văn so với phần còn giữ nguyên.
- Chỉ thêm ghi chú "correction" ở cuối mục 1 thay vì sửa trực tiếp từng
  đoạn — rejected: người đọc sau này quét nhanh từng subsection, để sai ở
  chỗ cũ và đúng ở một ghi chú rời rạc cuối bài dễ gây đọc nhầm.

## Proposed Changes

### Content
#### [MODIFY] `Research/doi-thu-canh-tranh.md`

**1. Section "### Luồng người dùng" (mục 1) — thay toàn bộ đoạn:**

Cũ:
> Trang chủ → chọn loại đọc (hàng ngày / theo câu hỏi / gặp reader chuyên
> gia) → rút bài hoặc nhập câu hỏi tự do → nhận diễn giải. Không cần đăng
> nhập cho lượt đọc cơ bản. Số bước chính xác **không xác minh được** —
> trang xem bài trực tiếp trả 404 khi fetch.

Mới:
> **Đã xác minh qua đọc source JS thật** (trước đây ghi "không xác minh
> được" vì trang xem bài trả 404 khi fetch tĩnh — trang cần JS chạy để
> mount app). Có **3 luồng tách biệt**, không phải một luồng chung:
> - **Bói 1 lá/ngày (free):** chọn 1 trong 5 chủ đề → xào bài → bốc 1 lá →
>   xem ý nghĩa ngay, không giới hạn, không cần mã.
> - **Bói 1 lá theo câu hỏi tự do ("chuyên sâu"):** gõ câu hỏi → xào → bốc
>   1 lá → hiện box "teaser" (diễn giải sơ bộ + danh sách mục bị khoá 🔒) →
>   nhập mã unlock (lấy qua quét QR SePay) → luận giải đầy đủ do AI sinh.
> - **Bói 3 lá (luồng chính, trang `/boi-tarot`):** chọn chủ đề → chọn câu
>   hỏi con (dropdown 2 cấp, taxonomy phân cấp) → xào → bốc 3 lá → nhập mã
>   unlock → AI tổng hợp lời khuyên từ cả 3 lá + chủ đề.
>
> Không luồng nào bắt đăng nhập; định danh người xem qua cookie/localStorage
> token ẩn, không phải tài khoản thật.

**2. Section "### Mô hình tính phí" (mục 1) — thay toàn bộ đoạn:**

Cũ:
> **Không có mô hình thu phí online.** Không bảng giá, không gói VIP, không
> credits, không cổng thanh toán nào được nhắc tới. "Tư vấn cùng reader
> chuyên gia" là kênh đặt lịch qua điện thoại/email — thủ công, không phải
> checkout tự động.

Mới:
> ⚠️ **Correction so với bản nghiên cứu trước** (dựa fetch tĩnh, kết luận
> "không có mô hình thu phí online" — **sai**, xem dưới).
>
> **Có thu phí online**, nhưng không qua cổng thanh toán chuẩn: 2 trong 3
> luồng đọc bài (chuyên sâu + 3 lá) khoá phần luận giải AI sau **mã dùng
> một lần**, mã chỉ nhận được sau khi quét **QR SePay động** chuyển khoản
> ngân hàng — hệ thống tự poll xác nhận thanh toán (short-poll 3.5s,
> backoff khi lỗi mạng) rồi cấp mã tự động, không cần admin duyệt tay. Có
> lớp quota theo "bundle mã" để giới hạn số lượt/mã — cơ chế chống spam AI
> call tốn phí. Không có tài khoản, không có gói/subscription, không lưu
> lịch sử — mỗi lượt mua là một giao dịch rời rạc gắn với 1 mã. "Tư vấn
> cùng reader chuyên gia" vẫn là kênh riêng qua điện thoại/email, thủ công,
> không phải checkout tự động — phần này không đổi.

**3. Section "### Tính năng" (mục 1) — thay toàn bộ đoạn:**

Cũ:
> Đọc hàng ngày theo 5–6 chủ đề, ô nhập câu hỏi tự do, 3 "tarot reader
> chuyên gia" có hồ sơ riêng để đặt lịch trực tiếp. Không xác minh được các
> kiểu trải bài cụ thể (1 lá/3 lá/Celtic Cross), không có bằng chứng về lưu
> lịch sử hay chia sẻ MXH.

Mới:
> Đọc hàng ngày theo 5 chủ đề (free), ô nhập câu hỏi tự do cho cả bói 1 lá
> "chuyên sâu" lẫn bói 3 lá chính, 3 "tarot reader chuyên gia" có hồ sơ
> riêng để đặt lịch trực tiếp. **Kiểu trải bài xác nhận:** 1 lá (free +
> chuyên sâu) và 3 lá (luồng chính) — không có Celtic Cross hay spread lớn
> hơn. Có một chi tiết đáng chú ý: với ~40 câu hỏi tình cảm cụ thể (vd
> "người yêu cũ còn giữ tình cảm không"), hệ thống **ép cả 3 lá cùng chiều
> xuôi/ngược** thay vì random độc lập từng lá — xem "Không nên copy" bên
> dưới. Không có bằng chứng lưu lịch sử hay chia sẻ MXH.

**4. Section "### UI/UX" (mục 1) — thay toàn bộ đoạn:**

Cũ:
> Màu tím/huyền bí, layout carousel theo chủ đề, CTA rõ ràng ("Bói Ngay").
> Responsive, animation, và công nghệ nền **không đánh giá được** (không
> truy cập được DOM/devtools qua fetch tĩnh).

Mới:
> Màu tím/huyền bí, layout carousel theo chủ đề, CTA rõ ràng ("Bói Ngay").
> **Công nghệ nền đã xác minh:** WordPress 7.0.4 + theme Flatsome (theme
> WooCommerce thương mại dùng làm page builder, **không** có shop/
> WooCommerce thật), jQuery. Animation trải bài (xào/bay/lật 3D) viết tay
> bằng CSS transform + absolute positioning + `requestAnimationFrame`,
> không dùng thư viện animation ngoài. Responsive cụ thể ở từng breakpoint
> không đánh giá được qua đọc source tĩnh (cần mở trình duyệt thật).

**5. Section "### SEO & nội dung" (mục 1) — thay toàn bộ đoạn:**

Cũ:
> `/blog` trả 404 — số trang nội dung thực tế **không xác minh được**. Nội
> dung trang chủ viết theo hướng SEO bám sát tình huống cụ thể (crush,
> người yêu cũ, ngoại tình, tài chính) thay vì chỉ ý nghĩa lá bài chung
> chung.

Mới:
> **Đã đếm được qua source:** đúng **78 trang**
> `la-bai-<ten-la>-trong-tarot` — mỗi lá bài 1 URL riêng (khớp toàn bộ 78
> lá, không thiếu), cộng 1 chuyên mục `/blog`. Nội dung trang chủ và các
> trang lá bài viết theo hướng SEO bám sát tình huống cụ thể (crush, người
> yêu cũ, ngoại tình, tài chính) thay vì chỉ ý nghĩa lá bài chung chung.

**6. Section "### Ý nghĩa đối với Ventus Tarot" (mục 1) — sửa bullet đầu +
thêm subsection mới ở cuối:**

Cũ (3 bullet):
> - **Cơ hội lớn nhất:** đối thủ chưa monetize online — không credits,
>   không thanh toán tự động. Mô hình Free/Paid rõ ràng qua PayOS của
>   Ventus là lợi thế đi trước, không phải đi sau.
> - Đáng học: viết nội dung SEO theo intent cụ thể ("crush", "hôn nhân")
>   thay vì chỉ liệt kê ý nghĩa lá bài — áp dụng được cho 78 trang SEO ở
>   Giai đoạn 9.
> - Lớp "chuyên gia người thật" là yếu tố tin cậy mà AI thuần túy không
>   có — không cần sao chép, nhưng đáng ghi nhận là một trục khác biệt hoá
>   khả dĩ cho roadmap dài hạn.

Mới (bullet 1 sửa, bullet 2–3 giữ nguyên, thêm subsection "Không nên copy"
ở cuối):
> - **Cơ hội lớn nhất (đã hiệu chỉnh):** đối thủ **có** monetize online
>   (SePay QR + mã dùng một lần), nhưng không có tài khoản, không lưu lịch
>   sử, không credit ledger, thao tác nhập mã tay là ma sát thật. Lợi thế
>   của Ventus không phải "đối thủ chưa thu phí" mà là **UX thanh toán mượt
>   hơn** (PayOS + Realtime, không cần copy/paste mã) và **tài khoản + lịch
>   sử thật**.
> - Đáng học: viết nội dung SEO theo intent cụ thể ("crush", "hôn nhân")
>   thay vì chỉ liệt kê ý nghĩa lá bài — áp dụng được cho 78 trang SEO ở
>   Giai đoạn 9.
> - Lớp "chuyên gia người thật" là yếu tố tin cậy mà AI thuần túy không
>   có — không cần sao chép, nhưng đáng ghi nhận là một trục khác biệt hoá
>   khả dĩ cho roadmap dài hạn.
>
> **Không nên copy:**
> - **Ép cả 3 lá cùng chiều xuôi/ngược** cho ~40 câu hỏi tình cảm nhạy cảm
>   (danh sách `STRICT_QUESTIONS` cứng trong JS) — thao túng RNG theo nội
>   dung câu hỏi để tạo cảm giác "chính xác" giả tạo. Đi ngược định vị minh
>   bạch/trung thực của Ventus; RNG rút bài của Ventus đã cố tình độc lập
>   hoàn toàn với nội dung câu hỏi ([03-kien-truc-ai.md §7](plan/03-kien-truc-ai.md)).
> - **Trải bộ bài 40–60 lá trùng lặp** (nhân bản từ 78 lá thật) để nhìn
>   "dày" khi user tự bấm chọn lá — che giấu số lượng lá thật, và cho phép
>   user tự chọn lá cụ thể (rủi ro farm/chọn lá "đẹp"). Không khớp UX đã
>   chốt của Ventus: RNG rút bài chạy server-side, user không tự chọn lá
>   ([03-kien-truc-ai.md §7](plan/03-kien-truc-ai.md)).

**7. Section "## 4. So sánh 3 đối thủ" — bảng, cột `boitarot.com.vn`, 4
hàng:**

| Hàng | Cũ | Mới |
|---|---|---|
| Thu phí online | `Không có` | `Có — SePay QR + mã dùng 1 lần (không tài khoản/subscription)` |
| Spread | `Không xác minh được` | `1 lá (free + chuyên sâu) + 3 lá (chính)` |
| Nền tảng kỹ thuật | `Không xác minh được` | `WordPress + Flatsome, jQuery` |
| SEO/nội dung | `Theo tình huống cụ thể, số trang không rõ` | `78 trang lá bài + 1 blog, theo tình huống cụ thể` |

**8. Section "## 5. Đề xuất..." — dòng #1 của bảng, cột "Vì sao":**

Cũ:
> Không đối thủ nào vừa có free rõ ràng **vừa** cá nhân hoá AI thật cùng
> lúc — tarotcuabin có cá nhân hoá nhưng free = 0 credit; hai boitarot free
> nhưng generic. Đây là điểm giao duy nhất Ventus chiếm được

Mới:
> Đã hiệu chỉnh: boitarot.com.vn **cũng** có lớp AI cá nhân hoá theo câu
> hỏi ở luồng "chuyên sâu"/3 lá (trả phí qua mã unlock) — không còn là
> "generic hoàn toàn". Điểm khác biệt thật của Ventus không phải là duy
> nhất có AI cá nhân hoá trả phí, mà là **kết hợp free rõ ràng + tài
> khoản/lịch sử thật + thanh toán tự động không ma sát (PayOS, không cần
> nhập mã tay)** — 3 yếu tố cùng lúc mà chưa đối thủ nào có đủ cả 3

**9. Section "## 6. Việc nên làm tiếp" — thêm mục mới ở cuối danh sách:**

```
5. **Cân nhắc 2 chi tiết UX từ boitarot.com.vn cho backlog** (không phải
   việc cần làm ngay):
   - Box "teaser" khoá nội dung trước paywall (diễn giải sơ bộ + danh sách
     mục bị khoá 🔒) — đáng thử cho UI `ResultPanel` ở lớp Cá nhân, thay vì
     chỉ hiện nút "Nâng cấp" trơn.
   - Dãn nhịp polling gấp đôi khi tab bị ẩn (`document.hidden`) — chi tiết
     nhỏ đáng thêm vào polling fallback của
     [05-thanh-toan-credits.md §5](plan/05-thanh-toan-credits.md), nếu được
     xác nhận riêng (không nằm trong phạm vi cập nhật lần này).
```

**10. Dòng "Nguồn" cuối file — append 1 câu vào cuối câu hiện có** (không
xoá gì, chỉ nối thêm trước dấu `*` đóng):

Cũ (kết thúc):
> ...cho câu chuyện "xây bằng AI" của `boitarot.vn`.*

Mới (kết thúc):
> ...cho câu chuyện "xây bằng AI" của `boitarot.vn`. Mục 1 (boitarot.com.vn)
> bổ sung ngày 2026-08-16 bằng đọc trực tiếp source JS thật của site (bản
> mirror HTTrack tại `src_template/tarot/boitarot.com.vn/`) — không phải
> suy đoán, đọc được toàn bộ logic client-side (6 plugin WordPress custom,
> REST endpoints, luồng thanh toán SePay).*

## Accessibility Plan
n/a — thay đổi chỉ là nội dung Markdown trong tài liệu nghiên cứu nội bộ,
không sinh ra UI.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `Research/doi-thu-canh-tranh.md` mục 1, 4, 5, 6 | `Research/doi-tuong-tone-thuong-hieu.md` (link tới §4, nhưng không trích lại claim "thu phí online" cụ thể — đã kiểm tra, không cần sửa); `Research/plan/08-timeline.md` (chỉ link mục 3, không trích nội dung) | Thấp — không file nào khác trích dẫn nguyên văn các đoạn bị sửa |

Không chạm `Research/plan/05-thanh-toan-credits.md` trong lần này (theo
quyết định mặc định ở trên — chờ xác nhận nếu muốn đổi).

## Verification Plan
### Automated
n/a — thay đổi Markdown thuần, không có gate lint/typecheck/test/build nào
áp dụng cho `Research/`.

### Manual
1. Đọc lại toàn bộ mục 1 sau khi sửa — đảm bảo giọng văn nhất quán với phần
   "Tổng quan" giữ nguyên, không lặp ý.
2. Đối chiếu mục 4 (bảng) và mục 5 (đề xuất #1) với mục 1 đã sửa — đảm bảo
   không còn câu nào trong file mâu thuẫn với correction "có thu phí
   online".
3. Kiểm tra 2 link nội bộ mới thêm (`plan/03-kien-truc-ai.md`,
   `plan/05-thanh-toan-credits.md`) trỏ đúng file đang tồn tại.

## Out of Scope
- Không sửa `Research/plan/05-thanh-toan-credits.md` (chi tiết polling chỉ
  ghi chú lại, không triển khai).
- Không nghiên cứu lại hoặc verify thêm cho tarotcuabin.com / boitarot.vn.
- Không sửa code trong `src/`.
- Không xoá hay archive `src_template/` — giữ nguyên làm nguồn tham chiếu.
