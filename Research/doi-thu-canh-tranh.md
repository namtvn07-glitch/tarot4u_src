# Nghiên cứu đối thủ cạnh tranh

> Đầu vào cho Giai đoạn 1 — mục "Nghiên cứu 3–5 đối thủ cùng ngách" trong
> [08-timeline.md §3](plan/08-timeline.md). Đã nghiên cứu **3/3–5** đối thủ
> theo yêu cầu — mục checklist đã được **tick**. Đề xuất #5 ở mục 5 dưới đây
> cũng đã được thêm vào checklist Giai đoạn 8 (Testing).
>
> Phương pháp: fetch trực tiếp trang chủ + trang con (bảng giá, đăng nhập,
> giới thiệu, điều khoản) và tra cứu công khai. Chỗ nào không xác minh được
> (site chặn crawl, nội dung render bằng JS phía client) được ghi rõ, không
> suy đoán.

## 1. boitarot.com.vn

### Tổng quan
Bói tarot online **miễn phí hoàn toàn**, định vị "la bàn tâm linh" kết hợp
huyền học phương Tây với tâm lý học hiện đại. Tone huyền bí nhưng gần gũi,
không hù dọa. Team vận hành tại Hà Nội, có thông tin liên hệ thật (địa chỉ,
điện thoại, email) — không nhắc gì đến AI.

### Luồng người dùng
Trang chủ → chọn loại đọc (hàng ngày / theo câu hỏi / gặp reader chuyên gia)
→ rút bài hoặc nhập câu hỏi tự do → nhận diễn giải. Không cần đăng nhập cho
lượt đọc cơ bản. Số bước chính xác **không xác minh được** — trang xem bài
trực tiếp trả 404 khi fetch.

### Mô hình tính phí
**Không có mô hình thu phí online.** Không bảng giá, không gói VIP, không
credits, không cổng thanh toán nào được nhắc tới. "Tư vấn cùng reader chuyên
gia" là kênh đặt lịch qua điện thoại/email — thủ công, không phải checkout
tự động.

### Tính năng
Đọc hàng ngày theo 5–6 chủ đề, ô nhập câu hỏi tự do, 3 "tarot reader chuyên
gia" có hồ sơ riêng để đặt lịch trực tiếp. Không xác minh được các kiểu trải
bài cụ thể (1 lá/3 lá/Celtic Cross), không có bằng chứng về lưu lịch sử hay
chia sẻ MXH.

### UI/UX
Màu tím/huyền bí, layout carousel theo chủ đề, CTA rõ ràng ("Bói Ngay").
Responsive, animation, và công nghệ nền **không đánh giá được** (không truy
cập được DOM/devtools qua fetch tĩnh).

> ⚠️ Có một domain dễ nhầm: `boitarot.vn` (không phải `.com.vn`) — một sản
> phẩm khác do một nhóm ở Đà Nẵng xây bằng AI (~50 triệu VNĐ, 4 người, 5
> tháng), được báo chí địa phương đưa tin. Không cùng team, không cùng
> website với đối tượng nghiên cứu ở đây.

### SEO & nội dung
`/blog` trả 404 — số trang nội dung thực tế **không xác minh được**. Nội
dung trang chủ viết theo hướng SEO bám sát tình huống cụ thể (crush, người
yêu cũ, ngoại tình, tài chính) thay vì chỉ ý nghĩa lá bài chung chung.

### Ý nghĩa đối với Ventus Tarot
- **Cơ hội lớn nhất:** đối thủ chưa monetize online — không credits, không
  thanh toán tự động. Mô hình Free/Paid rõ ràng qua PayOS của Ventus là lợi
  thế đi trước, không phải đi sau.
- Đáng học: viết nội dung SEO theo intent cụ thể ("crush", "hôn nhân") thay
  vì chỉ liệt kê ý nghĩa lá bài — áp dụng được cho 78 trang SEO ở Giai đoạn 9.
- Lớp "chuyên gia người thật" là yếu tố tin cậy mà AI thuần túy không có —
  không cần sao chép, nhưng đáng ghi nhận là một trục khác biệt hoá khả dĩ
  cho roadmap dài hạn.

---

## 2. tarotcuabin.com

### Tổng quan
Thương hiệu cá nhân — "Tarot của Bin", số ít, thân mật, như một reader thật
tên Bin. Tagline: *"Hiểu mình rõ hơn qua từng lá bài"*. Terms of Service nói
rõ: *"Tarot được dùng như công cụ phản chiếu tâm lý và hành động, không phải
lời khẳng định chắc chắn về tương lai"* — chủ động né mác "bói toán". Tone ấm
áp, hướng nội tâm.

### Luồng người dùng
Menu: Bàn bài / Lá hôm nay / Bản đồ sao / Lịch sử / Tài khoản. Flow suy ra
được: viết câu hỏi tự do → xáo bài → chọn 3 lá → nhận diễn giải. Đăng ký
**không cần xác minh email**, dùng ngay sau khi tạo tài khoản. Chỉ hỗ trợ
email/mật khẩu — **không có** Google/Facebook login.

### Mô hình tính phí — quan trọng nhất
Thuần **credit-based**, không subscription. *"1 credit = 1 lượt xem Tarot
hoàn chỉnh"*, giá lẻ **5.000đ/credit**. Gói lớn quảng cáo "tiết kiệm tới 20%"
và "tặng thêm credit" nhưng bảng giá chi tiết từng mức **không xác minh
được** (trang `/pricing` render động qua JS, không đọc được qua fetch tĩnh).
Tài khoản mới có **0 credit** — không tặng credit khi đăng ký. Cổng thanh
toán: **payOS** — trùng công nghệ Ventus dự định dùng. Có hoàn credit tự
động khi hệ thống/AI lỗi sau khi đã trừ.

### Tính năng
Cá nhân hoá **thật**: theo Privacy Policy, hệ thống dùng tên, ngày sinh,
giới tính, vai trò để tạo diễn giải AI — không phải nội dung generic. Có
spread 3 lá + "Lá hôm nay" (1 lá/ngày). Không thấy bằng chứng về Celtic
Cross hay spread lớn hơn. Có "Bản đồ sao" (có thể là chiêm tinh/thần số học
bổ sung — nội dung cụ thể không xác minh được). Lưu lịch sử đầy đủ, đồng bộ
đa thiết bị. Không có chia sẻ MXH.

### UI/UX
Site Next.js/Turbopack, host Vercel, **CSR hoàn toàn** — HTML tĩnh chỉ trả
về khung trang với trạng thái loading ("Đang mở bàn của bạn…"). Màu sắc,
animation cụ thể **không xác minh được** qua fetch tĩnh. Nhiều nơi hiện
trạng thái "Đang tải…" trước khi hydrate — dấu hiệu perceived performance có
thể chậm.

### SEO & nội dung
Sitemap chỉ có **7 URL**: trang chủ, `/daily-card`, `/pricing`, `/feedback`,
`/login`, `/privacy`, `/terms`. Không có blog, không có trang ý nghĩa từng
lá bài riêng lẻ. Vì nội dung chính render CSR (không SSR nội dung thật),
Google có thể khó index nội dung thực chất — dấu chân SEO rất mỏng.

### Ý nghĩa đối với Ventus Tarot
- **Xác nhận hữu ích:** payOS đã được một đối thủ trực tiếp dùng và vận
  hành ổn — giảm rủi ro khi Ventus chọn cùng cổng thanh toán.
- **Cơ hội lớn nhất:** đối thủ không có free tier rõ ràng (0 credit khi đăng
  ký) — free "Đọc nhanh" $0 ngay từ lượt đầu của Ventus là lợi thế phễu
  chuyển đổi thực sự.
- **Cơ hội SEO:** dấu chân nội dung quá mỏng (7 trang, không blog, CSR khó
  index) — 78 trang SSG lá bài của Ventus (Giai đoạn 9) là lợi thế organic
  traffic rõ rệt nếu thực thi đúng.
- Đáng học: mô hình credit đơn giản 1:1, minh bạch giá; cá nhân hoá bằng dữ
  liệu người dùng thật (tên, ngày sinh) đưa vào prompt; hoàn credit tự động
  khi lỗi — cả ba điều này khớp với nguyên tắc đã chốt ở
  [05-thanh-toan-credits.md](plan/05-thanh-toan-credits.md) và
  [01-san-pham-pham-vi.md](plan/01-san-pham-pham-vi.md).
- Ventus nên làm khác: thêm Google OAuth (đối thủ chỉ có email/mật khẩu),
  và ưu tiên SSR/tải nhanh thay vì CSR toàn bộ để tránh cảm giác chậm.

---

## 3. boitarot.vn

> Domain `.vn` — **khác** `boitarot.com.vn` ở mục 1. Đây là sản phẩm được báo
> chí địa phương (Thái Nguyên, Đồng Khởi, Thái Bình) PR là "xây bằng AI" bởi
> một nhóm 4 người ở Đà Nẵng, ~50 triệu VNĐ, 5 tháng.

### Tổng quan
Định vị "bói bài Tarot online miễn phí và chính xác nhất", trọng tâm chữa
lành/tự khám phá bản thân hơn là "xem bói" mê tín. Có nhánh thương hiệu phụ
**"Tiệm Tarot chữa lành"** kết nối 9 Tarot Reader người thật qua fanpage.
Tone trấn an, huyền bí nhưng thực tế. **Không tìm thấy nhắc đến AI/công nghệ
trên chính website** — câu chuyện "xây bằng AI" chủ yếu là narrative PR báo
chí, không phải tính năng lộ diện trên sản phẩm.

### Luồng người dùng
Chọn chủ đề → chọn câu hỏi gợi ý sẵn theo chủ đề (chưa rõ có nhập tự do hoàn
toàn hay chỉ chọn từ danh sách — không xác minh được) → chọn/xào bài → nhận
diễn giải. **Không yêu cầu đăng ký/đăng nhập** cho luồng đọc bài chính.

### Mô hình tính phí
**Không có trang giá, gói dịch vụ, credits, hay cổng thanh toán nào trên
site** — đọc bài online miễn phí 100%, không giới hạn lượt được công bố. Lớp
"đọc trực tiếp với Reader" (9 người) chỉ có tiểu sử + email liên hệ, không có
nút đặt lịch hay giá công khai — có vẻ thỏa thuận riêng ngoài website (giá cụ
thể không xác minh được).

### Tính năng
Spread chính là 3 lá. Diễn giải có vẻ dựa trên nội dung nền theo (lá bài +
chủ đề) — gần giống mô hình "Đọc nhanh" của Ventus, chưa thấy dấu hiệu AI đọc
câu hỏi tự do thật sự cá nhân. Không xác minh được lưu lịch sử hay chia sẻ
MXH.

### UI/UX
Dark theme, huyền bí (biểu tượng mặt trăng, đồ họa lá bài). Site chạy trên
**WordPress** (sitemap theo chuẩn Yoast: `post-sitemap`, `page-sitemap`,
`category-sitemap`, `author-sitemap`). Animation, responsive thực tế không
xác minh được qua fetch tĩnh.

### SEO & nội dung — điểm mạnh nhất của đối thủ này
**200+ trang nội dung**, phần lớn là "Ý nghĩa lá bài X" bao phủ gần hết 78 lá
— chiến lược SEO lập trình hóa (programmatic SEO) khai thác long-tail
keyword, có blog `/bai-viet/` riêng.

### Ý nghĩa đối với Ventus Tarot
- **Cảnh báo:** đây là đối thủ SEO mạnh nhất trong 3 đối thủ đã nghiên cứu —
  78 trang SSG lá bài của Ventus ở Giai đoạn 9 chỉ đạt ~1/3 độ phủ so với
  200+ trang của boitarot.vn. Cần nội dung có góc nhìn/dữ liệu riêng (không
  chỉ liệt kê ý nghĩa) để cạnh tranh, đúng như cảnh báo đã có ở
  [09-roadmap.md](plan/09-roadmap.md): "Google phạt nội dung sinh hàng loạt
  không có giá trị bổ sung".
- **Cơ hội:** cả câu hỏi tự do lẫn cá nhân hoá AI thật đều chưa xuất hiện ở
  đối thủ này (chỉ chọn từ danh sách gợi ý sẵn) — lớp "Đọc sâu" đọc đúng câu
  hỏi cụ thể của Ventus là khác biệt thật, không phải marketing.
- Đáng học: zero-friction UX (không đăng nhập cho lượt đọc cơ bản) — khớp
  với luồng free của Ventus ở [01-san-pham-pham-vi.md §5.1](plan/01-san-pham-pham-vi.md).

---

## 4. So sánh 3 đối thủ

| | boitarot.com.vn | tarotcuabin.com | boitarot.vn | **Ventus Tarot (dự kiến)** |
|---|---|---|---|---|
| Thu phí online | Không có | Credit-based, 5.000đ/credit | Không có | Credit-based, 3 gói |
| Free tier | Toàn bộ miễn phí, không giới hạn rõ | Không — 0 credit khi đăng ký | Toàn bộ miễn phí, không giới hạn công bố | "Đọc nhanh" $0, không giới hạn nội dung nền |
| Câu hỏi tự do | Có | Có (viết tự do trước khi xáo bài) | Chưa rõ — có vẻ chỉ chọn từ gợi ý sẵn | Có, tối đa 300 ký tự, có kiểm duyệt |
| Cá nhân hoá AI thật | Không xác minh được | Có — dùng tên/ngày sinh/vai trò | Không — gần như generic theo (lá + chủ đề) | Có — câu hỏi cụ thể → Sonnet 5 realtime |
| Cổng thanh toán | Không có | payOS | Không có | PayOS (dự kiến) |
| Đăng nhập | Không bắt buộc | Chỉ email/mật khẩu | Không bắt buộc | Magic link + Google OAuth |
| Spread | Không xác minh được | 3 lá + Lá hôm nay | 3 lá | 1 lá (free+paid) + 3 lá (paid) |
| Nền tảng kỹ thuật | Không xác minh được | Next.js/Vercel, CSR toàn bộ | WordPress | Next.js SSG cho trang lá bài |
| SEO/nội dung | Theo tình huống cụ thể, số trang không rõ | Rất mỏng — 7 URL, không blog | **200+ trang, blog riêng — mạnh nhất** | 78 trang SSG lá bài (Giai đoạn 9) |
| Yếu tố tin cậy khác biệt | Reader chuyên gia người thật | Branding cá nhân gần gũi | "Tiệm Tarot chữa lành" + 9 reader người thật | Minh bạch free/paid + kiểm duyệt nội dung |

## 5. Đề xuất tối ưu tính năng cho Ventus (dựa trên khoảng trống của cả 3 đối thủ)

Xếp theo mức ưu tiên — dựa trên khoảng trống chung mà **không đối thủ nào** lấp được, đối chiếu với phạm vi v1 đã chốt ở [01-san-pham-pham-vi.md](plan/01-san-pham-pham-vi.md).

| # | Đề xuất | Vì sao — khoảng trống quan sát được | Đã có trong scope v1? |
|---|---|---|---|
| 1 | **Giữ nguyên mô hình Free generic / Paid cá nhân hoá thật, làm nổi bật ranh giới đó trên UI** | Không đối thủ nào vừa có free rõ ràng **vừa** cá nhân hoá AI thật cùng lúc — tarotcuabin có cá nhân hoá nhưng free = 0 credit; hai boitarot free nhưng generic. Đây là điểm giao duy nhất Ventus chiếm được | ✅ Đã có |
| 2 | **Ô nhập câu hỏi tự do, không giới hạn ở danh sách gợi ý** | boitarot.vn chỉ cho chọn câu hỏi dựng sẵn theo chủ đề — trải nghiệm cá nhân hoá "giả". Ventus cho nhập tự do thật (kèm kiểm duyệt) là khác biệt rõ với đối thủ SEO mạnh nhất | ✅ Đã có, cần đảm bảo UI không mặc định ép chọn gợi ý mà che khuất ô tự do |
| 3 | **Đầu tư nội dung SEO có góc nhìn riêng, không chỉ 78 trang ý nghĩa lá bài** | boitarot.vn có 200+ trang, gấp ~3 lần kế hoạch 78 trang của Ventus. Chạy đúng plan v1 sẽ vẫn thua về khối lượng — cần bù bằng chất lượng (ví dụ cụ thể, dữ liệu từ chính sản phẩm) như đã cảnh báo ở `09-roadmap.md` | ⚠️ Có 78 trang, nhưng khối lượng thấp hơn đối thủ — cân nhắc mở rộng nội dung SEO sớm hơn roadmap dự kiến (hiện xếp "sau v1") |
| 4 | **Google OAuth bên cạnh magic link** | tarotcuabin.com chỉ có email/mật khẩu — ma sát đăng nhập cao. Ventus đã có kế hoạch Google OAuth, giữ nguyên vì đây là lợi thế chuyển đổi rõ so với đối thủ trực tiếp cùng mô hình credit | ✅ Đã có |
| 5 | **Tối ưu tốc độ tải/SSR cho trang trải bài, tránh CSR toàn màn hình như tarotcuabin.com** | tarotcuabin.com hiện trạng thái "Đang tải…" ở nhiều nơi trước khi hydrate — cảm giác chậm. Ventus dùng Next.js App Router, cần đảm bảo trang trải bài không rơi vào pattern CSR-toàn-bộ tương tự | ✅ Đã thêm vào checklist Giai đoạn 8 (Testing) — `08-timeline.md` |
| 6 | **Cân nhắc dài hạn: lớp "reader người thật" như một tier cao cấp** | Cả 2 domain boitarot đều có lớp con người thật (reader chuyên gia, "Tiệm Tarot chữa lành") — tạo tin cậy mà AI thuần túy không có. Không thuộc phạm vi v1, nhưng đáng ghi vào roadmap dài hạn như một hướng khác biệt hoá, không phải sao chép mà là bổ sung sau khi lớp Cá nhân AI đã chứng minh giữ chân được user | ❌ Ngoài scope v1 — đề xuất thêm vào `09-roadmap.md` mục dài hạn nếu được duyệt |
| 7 | **Hoàn credit tự động khi lỗi hệ thống/AI** | tarotcuabin.com đã làm và quảng cáo công khai như một điểm tin cậy | ✅ Đã có — khớp nguyên tắc "trừ trước, hoàn nếu lỗi" ở `05-thanh-toan-credits.md` |

> Đề xuất #3 và #5 là hai điểm **chưa** có dòng checklist riêng trong
> `Research/plan/` — cần bạn xác nhận trước khi mình bổ sung vào
> `08-timeline.md` hay `09-roadmap.md`, vì đó là thay đổi phạm vi, không phải
> việc tự quyết được.

## 6. Việc nên làm tiếp

1. ~~Đã đạt 3/3–5 đối thủ — tick mục "Nghiên cứu 3–5 đối thủ"~~ ✅ **Xong** —
   đã tick ở `08-timeline.md §3`.
2. **Xác nhận payOS khả dụng cho cá nhân/hộ kinh doanh nhỏ** — tarotcuabin.com
   đã vận hành payOS thành công, có thể liên hệ hỏi kinh nghiệm đăng ký nếu
   phù hợp, nhưng vẫn phải tự xác minh yêu cầu HKD của Ventus (mục 🔴 chặn
   Giai đoạn 6 trong `08-timeline.md`).
3. **Không nhầm boitarot.com.vn với boitarot.vn** khi trích dẫn trong tài
   liệu nội bộ — hai domain, hai đội, hai sản phẩm khác nhau.
4. ~~Quyết định về đề xuất #3 và #5~~ — **#5 đã chốt**, thêm vào checklist
   Giai đoạn 8. **#3 (mở rộng nội dung SEO sớm hơn dự kiến) vẫn để ngỏ** — chưa
   được yêu cầu bổ sung, cần xác nhận riêng nếu muốn đưa vào
   `08-timeline.md`/`09-roadmap.md`.

*Nguồn: fetch trực tiếp `boitarot.com.vn`, `tarotcuabin.com`, `boitarot.vn`
(trang chủ, `/gioi-thieu`, `/lien-he`, `/pricing`, `/login`, `/daily-card`,
`/privacy`, `/terms`, `/feedback`, `/sitemap.xml`, `/boi-tarot-online/`,
`/tarot-reader/`); tra cứu công khai qua báo chí (Thái Nguyên, Đồng Khởi,
Thái Bình) cho câu chuyện "xây bằng AI" của `boitarot.vn`.*
