# Ventus v2 — Kế hoạch triển khai redesign

> Đưa lớp giao diện của mockup `E:\Workspace\TarotDesign\ventus_redesign` lên nền
> Next.js 16 + Supabase đang chạy thật của dự án này, giữ nguyên toàn bộ backend,
> cơ sở dữ liệu và luồng thanh toán.
>
> Khảo sát trực tiếp trên mã nguồn hai dự án, 2026-08-28. Mốc: `29260f8`.

## Quyết định đã chốt

| | |
|---|---|
| **Nơi xây** | Branch `redesign/ventus` trên chính repo này |
| **Design system** | Dark-only, bỏ light theme |
| **Tính năng mới** | Thư viện 78 lá · Thông điệp hàng ngày · Nhạc nền |
| **Không làm vòng này** | Trang cài đặt tài khoản |
| **Khối lượng** | ≈ 16 ngày công · 10 giai đoạn |

---

## 1. Ba nguyên tắc

Mọi quyết định trong 10 giai đoạn đều quy về ba nguyên tắc này. Khi có tranh chấp
giữa mockup và code đang chạy, đây là thứ tự ưu tiên.

### I. Backend là bất khả xâm phạm

Không sửa `src/lib/**`, `src/app/api/**` hay `supabase/migrations/**` để chiều giao
diện. Đây là code đã qua 8 giai đoạn, có Sentry, có RLS, có function atomic, và đang
xử lý tiền thật. Nếu mockup mâu thuẫn với hợp đồng API thì **sửa mockup**, không sửa API.

### II. Ranh giới free/paid không được làm mờ

Điểm duy nhất trừ credits trong toàn hệ thống là nút "Đọc sâu cho câu hỏi của bạn".
Xào bài, rút 3 lá, đọc Lớp Nền của cả 3 lá — tất cả miễn phí và phải nói rõ là miễn phí.
Đây là cam kết minh bạch của thương hiệu, không phải chi tiết kỹ thuật có thể đánh đổi
lấy thẩm mỹ.

### III. Mockup là ý đồ thị giác, không phải đặc tả

Mockup có 11 lá bài, dữ liệu `localStorage`, luận giải "AI" hardcode và thanh toán giả
lập. Không thứ nào trong số đó đi theo sang v2. Cái đi theo là *ngôn ngữ thị giác*:
bảng màu, nhịp điệu, chuyển động, cách bố cục.

---

## 2. Kiểm kê tài sản

Tổng backend ≈ 1.900 dòng giữ nguyên 100%; toàn bộ khối lượng công việc nằm ở lớp
giao diện.

| Tài sản | Xử lý | Ghi chú |
|---|---|---|
| `src/app/api/**` — 8 route | **Giữ 100%** | Đọc nhanh, shuffle/reveal/personal, orders, webhook PayOS, cron, xoá reading. Hợp đồng API là thứ giao diện phải tuân theo. |
| `src/lib/**` — 21 file | **Giữ 100%** | env lazy-per-field, reading-token HMAC, moderation, rate-limit, 3 provider AI, PayOS, 3 client Supabase. |
| `supabase/migrations/**` | **Giữ 100%** | 6 bảng, RLS, 4 function atomic, trigger chặn client sửa credits. Chỉ *thêm* migration mới (xem §4). |
| `data/cards.json` + `public/cards/` | **Giữ 100%** | **78 lá + 78 ảnh Rider-Waite** đã có sẵn. Giải quyết trực tiếp lỗ hổng "11 lá nhưng quảng cáo 78 lá" của mockup. |
| `base_content` — 780 dòng trong DB | **Giữ 100%** | 78 lá × 5 chủ đề × 2 hướng. Đủ để dựng Thư viện *và* Thông điệp hàng ngày mà không sinh thêm nội dung AI nào. |
| `proxy.ts`, `instrumentation*.ts`, `next.config.ts`, `vercel.json` | **Giữ 100%** | Middleware refresh session + chặn route, Sentry, cron config. |
| `src/app/layout.tsx` | Sửa | Thêm font body Plus Jakarta Sans qua `next/font`, bỏ `data-theme` động, lắp shell mới. |
| `src/lib/supabase/middleware.ts` | Sửa 1 dòng | `PROTECTED_PREFIXES` giữ nguyên. Thư viện là route công khai, không thêm vào đây. |
| `src/styles/tokens.css` + `globals.css` | **Viết lại** | Đổi giá trị sang bảng vàng `#d4af37` / nền `#050505`, xoá khối light theme và `prefers-color-scheme`. |
| `src/components/**` — 24 component | **Viết lại** | Giữ nguyên *logic* (state machine, NDJSON reader, Realtime + poll), thay toàn bộ markup và class. |
| 12 `page.tsx` hiện có | **Viết lại** | Cấu trúc route giữ nguyên, nội dung dựng lại theo mockup. |
| `/thu-vien` + `/thu-vien/[cardId]` | **Mới** | Hai route chưa từng tồn tại. Dựng từ dữ liệu sẵn có — xem §3. |
| `ambientAudio.ts` (446 dòng, từ mockup) | Port + sửa | Chuyển sang `src/lib/ambient-audio.ts`. Bắt buộc sửa race condition ở `stop()` và thêm cleanup khi unmount. |
| Mockup: `App.tsx`, `types.ts`, `data/*.ts` | **Bỏ** | 11 lá giả, lịch sử giả, localStorage, auth giả, thanh toán giả. Backend thật đã có tất cả. |

### Bản đồ màn hình → route

Mockup là SPA 6 màn + 4 modal. v2 là 14 route thật.

| Màn mockup | Route v2 | Thay đổi so với mockup |
|---|---|---|
| HomeScreen | `/` | Thêm chọn chủ đề bắt buộc trước Đọc nhanh (X1) |
| DailyTarotMessage | `/` (server component) | Lá theo ngày lấy từ DB, không random client |
| QuickReadScreen | `/trai-bai?topic=` | RNG chuyển sang server; thêm disclaimer bắt buộc |
| DeepReadScreen | `/doc-sau` | Viết lại luồng — 5 xung đột, xem §5 |
| LibraryScreen | `/thu-vien` | **Mới.** 78 lá thật thay vì 11 |
| CardDetailScreen | `/thu-vien/[cardId]` | **Mới.** Thêm công tắc xuôi/ngược |
| AccountScreen | `/tai-khoan` | Sổ giao dịch lấy từ `credit_ledger` thật |
| ReadingDetailModal | `/tai-khoan/[id]` | Route thật, chia sẻ được link |
| AuthModal | `/dang-nhap` | Giữ route — middleware và OAuth callback phụ thuộc URL (X8) |
| CreditTopUpModal | `/nap-credits` + `/ket-qua` | Giữ route — QR thật, Realtime, đếm ngược 15 phút |
| CardDetailModal | modal trên `/thu-vien` | Giữ dạng modal, thêm focus trap + Escape |
| — | `/tai-nguyen-khung-hoang` | Mockup không có. **Bắt buộc giữ** (X3) |
| Footer links | 3 trang pháp lý | Mockup để `href="#"`. Trang thật đã tồn tại |

---

## 3. Thư viện 78 lá dựng từ dữ liệu sẵn có

Đây là phát hiện quan trọng nhất của đợt khảo sát: trang chi tiết lá bài mà mockup
thiết kế có thể dựng **hoàn toàn** từ 780 dòng `base_content` đã sinh sẵn — không cần
gọi AI, không cần viết nội dung mới, không tốn một đồng token nào.

Mỗi lá có sẵn 10 dòng trong DB (5 chủ đề × 2 hướng). Mockup chia trang chi tiết thành
4 khối nội dung. Ánh xạ 1–1:

```ts
// src/app/thu-vien/[cardId]/page.tsx — Server Component
const card = getCardById(cardId)          // cards.json: tên, ảnh, từ khoá
const { data: rows } = await supabase
  .from("base_content")
  .select("topic, orientation, body, summary")
  .eq("card_id", cardId)                  // → 10 dòng

// Khối mockup              ←  topic trong base_content
// "Tổng quan Tâm lý học"    ←  mind
// "Tình yêu & Mối quan hệ"  ←  love
// "Sự nghiệp & Tài chính"   ←  career + money  (tách 2 khối, dữ liệu có sẵn)
// "Lời khuyên từ Ventus"    ←  general
```

**Điểm cộng mockup chưa nghĩ tới:** vì mỗi chủ đề có cả bản xuôi lẫn ngược, trang chi
tiết có thể gắn một công tắc *Xuôi / Ngược* đổi toàn bộ 5 khối cùng lúc. Mockup chỉ
hiện từ khoá ngược rồi thôi. Dữ liệu đã trả tiền để sinh ra rồi — dùng hết.

Trang lưới `/thu-vien` chỉ cần `cards.json` (78 mục, không đụng DB) cộng một truy vấn
lấy `summary` của `topic='general'` để làm dòng preview. Lọc theo bộ (Ẩn Chính / Cốc /
Kiếm / Gậy / Tiền) và tìm kiếm chạy phía client — **và lần này bộ lọc "Gậy" sẽ ra kết
quả**, khác với mockup nơi nó luôn rỗng.

`base_content` có RLS policy đọc công khai, nên cả hai trang đều xem được khi chưa đăng
nhập. Không cần thêm route API.

---

## 4. Nợ kỹ thuật phải trả trước

Hai vấn đề phát hiện khi khảo sát. Cả hai đều nhỏ, nhưng phải xong trước khi bắt đầu
giai đoạn 1 — nếu không sẽ khó tách bạch "lỗi cũ" và "lỗi do redesign".

### NỢ 1 — Hàm `credit_order` trong DB đã trôi khỏi migration

- **File migration nói:** `credit_order(p_order_id uuid) returns void`
- **Code webhook gọi:** `credit_order(p_order_code, p_amount) returns text` — và xử lý
  4 giá trị trả về: `amount_mismatch`, `not_found`, `already_paid`, `not_pending`
  (`src/app/api/webhooks/payos/route.ts:33`).

**Xử lý:** Phiên bản mới đã được áp thẳng lên Supabase project thật nhưng chưa bao giờ
được ghi thành file. Chạy `supabase db pull`, lấy định nghĩa thật, tạo migration
`2026xxxx_credit_order_amount_check.sql`. Không làm bước này thì bất kỳ ai dựng lại DB
từ migration đều có một webhook thanh toán hỏng — đây là rủi ro tiền thật.

### NỢ 2 — `CRON_SECRET` đang bị comment out

- **Hiện trạng:** `.env.local` có dòng `# CRON_SECRET=` — biến không tồn tại lúc runtime.
- **Hậu quả:** schema khai báo `z.string().min(16)`, đọc `env.CRON_SECRET` sẽ throw.
  Cron dọn đơn hết hạn (10 phút/lần theo `vercel.json`) không chạy được → đơn `pending`
  treo vĩnh viễn.

**Xử lý:** Sinh secret ≥16 ký tự, điền vào `.env.local` và Vercel env. Xác minh bằng một
lần gọi tay có header `Authorization: Bearer …` — phải trả `{ ok: true, count: n }`.

---

## 5. Tám xung đột giữa mockup và backend

Mockup được thiết kế từ bản tóm tắt tính năng (`web-tarot-feature-flow-summary.md`),
không phải từ code — nên có những chỗ giao diện giả định một hành vi mà API không hỗ
trợ. Mỗi mục phải được giải quyết *trước* khi dựng màn tương ứng, không phải khi gặp lỗi.

### X1 — Đọc nhanh không có bước chọn chủ đề

- **Mockup:** vào thẳng `QuickReadScreen`, chạm bộ bài, rút luôn.
- **Backend:** `POST /api/reading` bắt buộc `topic` thuộc 5 giá trị. Không có mặc định.

**Xử lý:** giữ lưới 5 chủ đề ở trang chủ làm cửa vào duy nhất; thêm chip "Chủ đề: …" có
thể bấm đổi ngay trên `/trai-bai`. **Không** âm thầm mặc định `general` — nội dung diễn
giải khác nhau theo chủ đề, người dùng phải biết mình đang đọc qua lăng kính nào
(nguyên tắc II).

### X2 — Đọc sâu: mockup lật cả 3 lá cùng lúc

- **Mockup:** chọn 3 lá → chuyển sang màn "trải bàn" hiện cả 3 → mới bấm mở khoá AI.
- **Backend:** `/deep/reveal` nhận `revealIndex` từng lá một, trả về lá đó *kèm Lớp Nền
  miễn phí*. Đó là toàn bộ giá trị của phần free.

**Xử lý:** giữ quạt 24 lá và hiệu ứng bay/lật của mockup, nhưng mỗi lần bấm một lá thì
lá đó bay lên ô của nó, lật, và mở ra khối diễn giải Lớp Nền ngay bên dưới. Đủ 3 lá thì
CTA trả phí xuất hiện. Cách này giữ đúng nhịp của backend *và* mạnh hơn về mặt sản phẩm:
người dùng nhận giá trị thật ba lần trước khi được hỏi có muốn trả tiền không.

### X3 — Mockup không có bước kiểm duyệt câu hỏi

- **Mockup:** nhập câu hỏi → xào bài ngay. Chỉ có một link hotline nhỏ ở góc.
- **Backend:** `/deep/shuffle` gọi AI phân loại *trước khi rút bài*. Trả
  `{ blocked: true, category }` cho 5 nhóm: crisis, medical, legal, harmful, nonsense.
  Không rút bài, không cấp token, không trừ credits.

**Xử lý:** bắt buộc dựng lại `CrisisResourceNotice` theo ngôn ngữ thị giác mới, giữ
nguyên 3 hotline thật (Ngày Mai 0963 061 414 · Tổng đài 111 · Cấp cứu 115) và **không
CTA thương mại nào** trên màn đó. Đây là cam kết đạo đức đã ghi trong tài liệu sản phẩm,
không phải tính năng tuỳ chọn.

### X4 — Giá Đọc sâu: mockup ghi 1, thực tế là 2

- **Mockup:** "1 Lượt" hardcode trong JSX, xuất hiện ở 2 chỗ.
- **Backend:** `DEEP_READING_COST=2` trong env, truyền vào `debit_reading`.

**Xử lý:** server truyền `cost` xuống component, không hardcode ở bất kỳ đâu. Cùng cách
với `DEEP_SPREAD_SLOTS` — vốn đang là 24, trùng đúng số lá trong quạt bài của mockup.

### X5 — Đọc sâu thiếu chọn chủ đề

- **Mockup:** chỉ có ô nhập câu hỏi 300 ký tự + 3 chip gợi ý.
- **Backend:** `DeepReadingRequestSchema` yêu cầu cả `topic` lẫn `question`. Chủ đề
  quyết định dòng `base_content` nào được lấy cho từng lá.

**Xử lý:** thêm một hàng 5 chip chủ đề ngay trên textarea, dùng lại đúng kiểu chip mà
mockup đã thiết kế cho "Gợi ý câu hỏi" — không phát minh thành phần mới. Khi vào từ lưới
chủ đề ở trang chủ thì chip tương ứng đã được chọn sẵn.

### X6 — Không có trạng thái hết credits và quá giới hạn

- **Mockup:** kiểm tra `credits < 1` phía client rồi mở modal nạp tiền. Không có nhánh
  nào cho lỗi từ server.
- **Backend:** trả `402 insufficient_credits` và `429 rate_limited` (Đọc sâu 10 lượt/giờ,
  Đọc nhanh 3/ngày nếu ẩn danh, 20/giờ nếu đã đăng nhập).

**Xử lý:** hai trạng thái riêng. `402` dẫn thẳng sang `/nap-credits` kèm thông điệp nói
rõ 3 lá đã rút vẫn còn nguyên. `429` nói rõ giới hạn là bao nhiêu và khi nào được thử
lại — không gộp vào "Không kết nối được máy chủ" như bản cũ đang làm.

### X7 — Toàn bộ ảnh trong mockup là URL tạm

- **Mockup:** mọi ảnh trỏ tới `lh3.googleusercontent.com/aida-public/…`. Logo và mặt
  sau lá bài dùng *chung một URL*.
- **Backend:** 78 ảnh lá bài đã nằm sẵn ở `public/cards/*.jpg`, phục vụ qua `next/image`.

**Xử lý:** ảnh lá bài thay hết bằng đường dẫn cục bộ. Mặt sau lá bài và logo: **cả hai
dự án đều đang dùng placeholder** — bản cũ ghi rõ ảnh mặt sau là mượn tạm từ đối thủ.
Cần asset thương hiệu thật trước khi phát hành; đây là việc thiết kế, không phải việc
code, nên đưa vào giai đoạn 0 để không chặn tiến độ.

### X8 — Mockup biến trang thành modal

- **Mockup:** Đăng nhập và Nạp credits đều là modal phủ lên màn hiện tại.
- **Backend:** middleware redirect tới `/dang-nhap?next=…`; OAuth callback redirect theo
  URL; `/nap-credits` nằm trong `PROTECTED_PREFIXES`; PayOS `returnUrl`/`cancelUrl` trỏ
  vào route thật.

**Xử lý:** giữ route làm nguồn sự thật — bốn cơ chế trên đều phụ thuộc URL. Bố cục và
thẩm mỹ của modal trong mockup vẫn dùng được nguyên vẹn cho *trang*: hộp hẹp, căn giữa,
nền tối. Nếu sau này muốn cảm giác modal, dùng `@modal` intercepting route của App
Router — nhưng đó là việc sau khi ra mắt.

---

## 6. Hai điểm cần quyết trước khi bắt đầu

**Nút "Lưu Phiên Trải Bài".** Mockup có nút này, nhưng backend đã tự động `insert` vào
bảng `readings` ngay khi stream kết thúc. Giữ nút sẽ khiến người dùng tưởng chưa lưu.
Đề xuất: thay bằng liên kết "Xem trong lịch sử" trỏ tới `/tai-khoan/[readingId]` — API
đã trả sẵn `readingId` trong sự kiện `done`.

**Đọc nhanh có vào lịch sử không?** Hiện `/api/reading` không ghi DB, nên `/tai-khoan`
chỉ có Đọc sâu — dù bảng `readings` có sẵn cột `tier='quick'`. Mockup hiện cả hai loại
và có bộ lọc "Rút Nhanh". Chọn một: bỏ bộ lọc đó, hoặc thêm `insert` cho người đã đăng
nhập. Đây là việc sửa API nên cần đồng ý trước (nguyên tắc I).

---

## 7. Mười giai đoạn

Thứ tự có ràng buộc thật: token trước component, shell trước trang, và Thư viện đứng
trước Đọc sâu để hệ token được kiểm chứng trên một bề mặt *mới* thay vì trên luồng đang
chạy ra tiền. Mỗi giai đoạn có một cổng nghiệm thu — không qua cổng thì không sang giai
đoạn sau.

### GĐ 0 — Trả nợ & dựng nhánh · 0,5 ngày · không đụng UI

- Tạo branch `redesign/ventus`; commit `next-env.d.ts` đang lệch cho cây sạch.
- Giải quyết NỢ 1 và NỢ 2 (§4), mỗi cái một commit riêng.
- Chạy `pnpm build` + `pnpm lint`, ghi lại kết quả làm mốc so sánh.
- Đặt hàng asset thật: mặt sau lá bài + logo Ventus (X7) — chạy song song, không chặn.

**Cổng:** build xanh, cron trả `{ ok: true }`, một đơn PayOS thử nghiệm cộng credits đúng.

### GĐ 1 — Hệ token dark-only · 1 ngày · nền móng cho mọi thứ sau

- `tokens.css`: thay giá trị màu sang bảng mockup (nền `#050505`, bề mặt `#18120e`, vàng
  `#d4af37`, đồng `#8f5a1f`, chữ `#ece0d8`). **Xoá** khối `prefers-color-scheme` và
  `[data-theme="light"]`.
- Giữ nguyên kiến trúc: thang spacing 8 bước, thang chữ theo vai trò, lớp z có tên, token
  motion. Component vẫn viết `bg-surface` / `text-accent`, không hardcode hex.
- Thêm token mới cho ngôn ngữ mockup: `--glass-bg`, `--glass-blur`, `--glow-gold`, `--grain`.
- Viết lại `contrast-audit.md` cho bảng màu mới — vàng `#d4af37` trên nền `#050505` đạt AA,
  nhưng chữ phụ `#9e8e80` cần kiểm lại.
- Font: giữ Cormorant cho heading, thêm Plus Jakarta Sans cho body qua `next/font/google`
  (bắt buộc subset `vietnamese`).
- Icon: **không** dùng Material Symbols theo kiểu ligature như mockup — trình đọc màn hình
  sẽ đọc ra chữ `psychology`, và có nháy chữ thô trước khi font tải. Dùng `lucide-react`
  (SVG, tree-shake được).

**Cổng:** trang cũ bất kỳ vẫn render đúng với token mới, không còn class Tailwind nào
sinh ra từ chuỗi ghép động.

### GĐ 2 — Vỏ ứng dụng · 1,5 ngày

- `Header`: điều hướng 4 mục + huy hiệu credits (đọc từ `profiles`, Server Component) +
  avatar + ngăn kéo mobile.
- `Footer`: 4 link pháp lý thật + hotline 1900 6233.
- Nền: lớp nhiễu hạt + quầng sáng vàng, `position: fixed`, `pointer-events: none`.
- `AmbientSoundPlayer` + port `ambient-audio.ts`. **Bắt buộc sửa:** đưa `setTimeout` trong
  `stop()` vào mảng `timerIds`, thêm dừng nhạc khi unmount.
- Một hook `useDialog` dùng chung: Escape, focus trap, khoá cuộn body, `role="dialog"` +
  `aria-modal`. Mockup không có gì trong số này.

**Cổng:** bật/tắt nhạc 5 lần liên tiếp trong 1 giây vẫn phát đúng. Tab qua toàn bộ header
thấy rõ vòng focus.

### GĐ 3 — Trang chủ & Thông điệp hàng ngày · 1,5 ngày

- Hero, lưới 5 chủ đề (giải X1), khối giới thiệu 2 cột.
- `DailyTarotMessage` dạng Server Component: chọn lá theo `hash(ngày + userId)` tính ở
  server để hai người khác nhau ra lá khác nhau nhưng mỗi người ổn định suốt ngày. Nội
  dung lấy từ `base_content` chủ đề `general`.
- Bỏ nút "Rút Lại" random của mockup — nó phá vỡ ý nghĩa "thông điệp của ngày". Thay bằng
  liên kết sang Thư viện.

**Cổng:** tải lại trang 10 lần ra cùng một lá; đổi ngày hệ thống ra lá khác.

### GĐ 4 — Thư viện 78 lá · 2 ngày · route mới, rủi ro thấp

- `/thu-vien`: lưới 78 lá, tìm kiếm theo tên và từ khoá, lọc theo 6 bộ.
- `/thu-vien/[cardId]`: theo ánh xạ ở §3, cộng công tắc Xuôi/Ngược.
- Modal xem nhanh trên lưới, dùng hook `useDialog` từ GĐ 2.
- `generateStaticParams` cho cả 78 lá; thêm `generateMetadata` cho SEO — đây là bề mặt duy
  nhất trong sản phẩm thực sự đáng index.

**Cổng:** 78 lá đều có ảnh và đủ 5 khối nội dung ở cả hai hướng. Bộ lọc "Gậy" ra 14 lá.

### GĐ 5 — Đọc nhanh · 1,5 ngày

- Dựng lại `ReadingStage` theo 4 pha của mockup: idle → xào → quạt 12 lá → kết quả lật 3D.
- Giữ nguyên hợp đồng gọi `POST /api/reading` và `motionMs()` đọc token thời lượng.
- Sửa xung đột animation của mockup: `animate-card-fly-*` có `forwards` nên đè mất
  `hover:-translate-y-*`. Tách thành hai lớp lồng nhau, hoặc gỡ class animation sau khi
  chạy xong.
- Thêm disclaimer pháp lý dưới kết quả (mockup thiếu ở màn này) và CTA nối tiếp sang Đọc
  sâu — bản cũ là ngõ cụt.
- Dọn timer: `setInterval` xào bài của mockup không có cleanup.

**Cổng:** rời trang giữa lúc xào không còn cảnh báo cập nhật state. Ba lượt liên tiếp ra
ba lá khác nhau.

### GĐ 6 — Đọc sâu · 3 ngày · trọng tâm, rủi ro cao nhất

- Máy trạng thái: `question → shuffling → picking → blocked | error`. Giữ nguyên cấu trúc
  của `DeepReadingStage`, chỉ thay lớp trình bày.
- Giải X2 (lật tuần tự), X3 (màn chặn), X4 (giá từ server), X5 (chip chủ đề), X6 (402 và 429).
- Quạt 24 lá theo hình học của mockup; mỗi lá là `<button>` thật, không phải `<div onClick>`
  — quạt bài phải điều khiển được bằng bàn phím.
- Stream: giữ **nguyên vẹn** `DeepResultStream` — bộ đọc NDJSON, gộp cập nhật bằng
  `requestAnimationFrame`, và `AbortController` (không có nó, StrictMode gọi API hai lần và
  trừ credits hai lần — bản cũ đã dính đúng bug này). Chỉ thay vỏ hiển thị và con trỏ nhấp nháy.
- Bỏ nút "Lưu", thêm liên kết sang `/tai-khoan/[id]`. Sửa nút chia sẻ: mockup báo "Đã sao
  chép link" nhưng thực ra copy toàn văn, và không bắt lỗi khi `navigator.clipboard` không
  khả dụng.

**Cổng:** bốn kịch bản chạy đúng đầu-cuối: đủ credits · hết credits · câu hỏi bị chặn ·
AI lỗi giữa stream (phải tự hoàn credits, kiểm tra bằng `credit_ledger`).

### GĐ 7 — Tài khoản & lịch sử · 1,5 ngày

- Thẻ hồ sơ + số dư, ba tab như mockup, nhưng tab giao dịch đọc `credit_ledger` thật
  (Nạp / Trừ / Hoàn / Tặng / Điều chỉnh + số dư sau mỗi dòng).
- Danh sách lịch sử phân trang 10/trang, nút xoá hai bước — logic giữ từ `DeleteReadingButton`.
- `/tai-khoan/[id]` theo bố cục `ReadingDetailModal` của mockup.
- Thêm lối vào `/nap-credits` từ thẻ số dư — bản cũ không có entry point nào.
- Bỏ tab "Cài đặt" của mockup (đã chốt không làm ở vòng này). Đăng xuất phải điều hướng về
  trang chủ, không để người dùng ở lại màn tài khoản.

**Cổng:** số dư trên header, trên thẻ hồ sơ và dòng cuối sổ cái khớp nhau tuyệt đối.

### GĐ 8 — Nạp credits & Đăng nhập · 1,5 ngày

- `/nap-credits`: bố cục 3 gói của mockup (khớp đúng `PACKS`: 10/49k · 30/129k · 100/359k).
  Sửa lỗi `mt-${…}` ghép chuỗi động — Tailwind không sinh class đó.
- Giữ nguyên `QrPanel`: sinh QR bằng thư viện `qrcode` từ chuỗi PayOS trả về, vòng đếm ngược
  lấy từ `expiresAt` của server, Realtime + poll 5 giây làm lưới an toàn. Mockup gọi API QR
  bên ngoài kèm `Date.now()` ngay trong JSX — bỏ hẳn.
- Sửa lỗi chọn gói: mockup cho gói "Phổ biến" thắng nhánh ternary nên chọn gói khác vẫn thấy
  gói phổ biến sáng viền.
- `/dang-nhap`: Google + magic link + email/mật khẩu, đúng ba phương thức backend hỗ trợ.
  Bỏ chế độ "Đăng ký" giả của mockup — nó chỉ đổi chữ trên nút.

**Cổng:** một giao dịch PayOS thật đầu-cuối: QR → chuyển khoản → webhook → credits cộng
đúng → sổ cái có dòng `purchase`. Đơn để hết hạn không cộng gì.

### GĐ 9 — Tiếp cận, chuyển động, nghiệm thu · 2 ngày

- Quét toàn bộ `<div onClick>` → `<button>`. Mockup có sáu bề mặt như vậy: quạt 24 lá,
  quạt 12 lá, lưới thư viện, thẻ chủ đề, gói credits, thẻ lịch sử.
- `prefers-reduced-motion`: token motion về 1ms; các animation vô hạn (lơ lửng, lấp lánh,
  shimmer) phải dừng hẳn. Mockup không có gì cho việc này.
- Bỏ hết `alert()` — mockup dùng 4 chỗ. Thay bằng lỗi tại chỗ có `role="alert"`.
- Kiểm tra tương phản lại toàn bộ theo audit ở GĐ 1.
- Chạy `/design-review` và agent `a11y-auditor` có sẵn trong repo.
- Đo Lighthouse trên `/`, `/thu-vien`, `/doc-sau` — hiệu ứng kính mờ và quầng sáng dễ làm
  tụt điểm trên máy yếu.

**Cổng:** đi hết 5 luồng chính chỉ bằng bàn phím. Không còn `alert()`. Build và lint xanh.

---

## 8. Rủi ro

**Kính mờ chồng lớp làm tụt hiệu năng.** Mockup dùng `backdrop-filter: blur()` ở gần như
mọi bề mặt, cộng thêm lớp nhiễu hạt và quầng sáng cố định. Trên máy yếu đây là nguyên nhân
giật phổ biến nhất. Đo sớm ở GĐ 2, đừng đợi tới GĐ 9 — nếu phải bỏ bớt thì đó là quyết
định về ngôn ngữ thị giác, cần biết trước khi dựng 8 màn.

**Đọc sâu là nơi tiền chảy qua.** GĐ 6 chạm vào luồng trừ credits, gọi AI và hoàn tiền. Mọi
thay đổi ở đó phải kiểm bằng `credit_ledger`, không phải bằng con số trên giao diện. Cột
`balance_after` tồn tại chính để đối soát — dùng nó.

**Bỏ light theme là quyết định một chiều.** Đã chốt dark-only. Cần xoá sạch khối
`prefers-color-scheme` ngay ở GĐ 1 thay vì để lại "phòng khi cần" — token nửa vời sẽ sinh
ra màu chỉ đúng ở một chế độ, và đó là loại lỗi rất khó thấy khi review.

**Mặt sau lá bài vẫn là ảnh mượn.** Ghi rõ trong tài liệu dự án cũ: ảnh này mượn từ đối
thủ. Nó xuất hiện trong mọi animation xào và rút — tức là ở đúng khoảnh khắc thương hiệu
nhất của sản phẩm. Không nên phát hành công khai với ảnh này.

**Ước lượng 16 ngày không bao gồm nội dung mới.** Nếu sau này muốn viết lại toàn bộ 780
dòng `base_content` cho hợp giọng điệu mới, đó là một hạng mục riêng — có sẵn
`scripts/base-content/` để chạy lại qua Batch API.
