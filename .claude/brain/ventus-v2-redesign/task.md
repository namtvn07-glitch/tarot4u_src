# Task: Ventus v2 — Redesign lớp giao diện

> Created: 2026-08-29 · Slug: `ventus-v2-redesign`
> Kèm `implementation-plan.md` cùng thư mục (khảo sát 2026-08-28, mốc `29260f8`).
> Chạy sau Giai đoạn 8 (Testing). Branch `redesign/ventus` đã tồn tại và đang
> checkout. Ước lượng ≈ 16 ngày công · 10 giai đoạn, mỗi giai đoạn một cổng.

## Goal

Toàn bộ sản phẩm đang chạy thật (14 route, 8 API route, 6 bảng Supabase, luồng
PayOS tiền thật) khoác ngôn ngữ thị giác của mockup `ventus_redesign` — dark-only,
bảng vàng `#d4af37` trên nền `#050505` — **không sửa một dòng nào** trong
`src/lib/**`, `src/app/api/**`, `supabase/migrations/**` để chiều giao diện; cộng
ba bề mặt mới: Thư viện 78 lá, Thông điệp hàng ngày, Nhạc nền.

## Scope

**In**:
- `src/styles/tokens.css` + `src/app/globals.css` — viết lại giá trị, xoá light theme
- 27 component trong `src/components/**` — giữ nguyên *logic*, thay toàn bộ markup/class
- 12 `page.tsx` hiện có — cấu trúc route giữ nguyên, nội dung dựng lại
- `/thu-vien` + `/thu-vien/[cardId]` — **2 route mới**, dựng từ `cards.json` + `base_content`
- `DailyTarotMessage` — Server Component mới trên `/`
- `src/lib/ambient-audio.ts` — port từ mockup (446 dòng) + sửa race condition ở `stop()`
- `src/app/layout.tsx` — thêm font body Plus Jakarta Sans, bỏ `data-theme` động, shell mới
- Hook `useDialog` dùng chung (Escape · focus trap · khoá cuộn · `role="dialog"`)
- 1 dependency mới: `lucide-react` (icon SVG, tree-shake được); body font qua `next/font`
- **NỢ 1**: migration ghi lại định nghĩa thật của `credit_order(bigint, int)`
- **NỢ 2**: `CRON_SECRET` — sinh secret, điền `.env.local` + Vercel env

**Out**:
- Trang cài đặt tài khoản (đã chốt không làm vòng này — bỏ tab "Cài đặt" của mockup)
- Light theme (đã chốt dark-only, quyết định một chiều)
- Viết lại 780 dòng `base_content` cho hợp giọng điệu mới — hạng mục riêng, có sẵn
  `scripts/base-content/` chạy qua Batch API
- Sửa `/api/reading` để ghi Đọc nhanh vào `readings` — **đã chốt không làm** (xem D1)
- Intercepting route `@modal` cho `/dang-nhap` + `/nap-credits` — việc sau khi ra mắt
- Mọi thứ trong mockup: `App.tsx`, `types.ts`, `data/*.ts` (11 lá giả, localStorage,
  auth giả, thanh toán giả) — bỏ hẳn, không port

## Quyết định đã chốt

**D1 — Đọc nhanh không vào lịch sử.** (user, 2026-08-29) Bỏ bộ lọc "Rút Nhanh" của
mockup. `/tai-khoan` chỉ liệt kê Đọc sâu, đúng như `/api/reading` đang hành xử.
Không sửa API → giữ nguyên tắc I nguyên vẹn. Cột `readings.tier='quick'` vẫn tồn
tại trong schema, để ngỏ cho sau này.

**D2 — Bỏ nút "Lưu Phiên Trải Bài".** (user, 2026-08-29) Thay bằng liên kết "Xem
trong lịch sử" → `/tai-khoan/[readingId]`, dùng `readingId` mà API đã trả sẵn trong
sự kiện `done`. Nút "Lưu" sẽ nói dối: backend đã `insert` ngay khi stream kết thúc.

## Assumptions

- **Branch `redesign/ventus` đã có và đang checkout** — xác minh 2026-08-29. GĐ 0
  chỉ còn phải commit `next-env.d.ts` đang lệch (do `next dev` sinh lại) cho cây sạch.
- **NỢ 1 là thật, đã xác minh.** `supabase/migrations/` chỉ có
  `credit_order(p_order_id uuid) returns void` (`20260809000003:9`) và 1 dòng revoke
  (`20260816000001:11`). Bản `(bigint, int) returns text` mà webhook đang gọi
  (`src/app/api/webhooks/payos/route.ts:33`) **chưa từng có file migration** — user
  chạy tay qua Dashboard ở Giai đoạn 6 vì `apply_migration` bị classifier chặn.
  Dựng lại DB từ migration hôm nay = webhook thanh toán hỏng.
- **`apply_migration` cho DDL đụng `credit_order` sẽ lại bị chặn.** Đây là gate hệ
  thống, không phải lỗi SQL (learning 2026-08-18). Kế hoạch: sinh file migration +
  đưa SQL cho user tự chạy Dashboard, rồi **xác minh bằng
  `information_schema.routine_privileges`** — không tin chữ "Success" (learning
  2026-08-19: chỉ câu lệnh cuối được chứng minh).
- **78 lá + 78 ảnh có thật.** `data/cards.json` = 78 mục, `public/cards/` = 78 file.
  Bộ lọc "Gậy" sẽ ra 14 lá, khác mockup nơi nó luôn rỗng.
- **`base_content` = 780 dòng (78 × 5 chủ đề × 2 hướng), RLS đọc công khai** — đủ
  dựng cả Thư viện lẫn Thông điệp hàng ngày mà **không gọi AI, không tốn token nào**.
  Cần verify số dòng thật bằng `count(*)` trước khi bắt đầu GĐ 4.
- **Không có script `typecheck` và không có `test`.** `package.json` chỉ có
  `dev`/`build`/`start`/`lint`. Gate ladder rút còn: `lint` → `tsc --noEmit` (chạy
  tay) → `build` → visual → a11y. Hai gate còn lại ghi `n/a`, không phải ❌.
- **Ảnh mặt sau lá bài vẫn là ảnh mượn từ đối thủ** (`public/_placeholder-doi-thu/`,
  gitignored). Nó xuất hiện trong mọi animation xào/rút — đúng khoảnh khắc thương
  hiệu nhất. Đặt hàng asset thật ở GĐ 0, chạy song song, **không chặn** code; nhưng
  **chặn phát hành công khai**.
- **Repo này có nhiều task chạy song song chưa commit** (learning 2026-08-16). 3 task
  còn checklist mở: `4c-picker-redesign`, `calestial-redesign`,
  `cap-nhat-doi-thu-boitarot-comvn`. Đọc kỹ `git status` đầu mỗi phiên trước khi sửa
  file dùng chung (`tokens.css`, `Header.tsx`, `ReadingStage.tsx`).
- Font body Plus Jakarta Sans qua `next/font/google` **bắt buộc `subset: ["vietnamese"]`**
  — thiếu là dấu tiếng Việt rơi về fallback, lộ ngay ở heading.

## Checklist

> Mỗi giai đoạn là một cổng. Không qua cổng thì không sang giai đoạn sau.

### GĐ 0 — Trả nợ & dựng nhánh · 0,5 ngày · không đụng UI
- [x] Branch `redesign/ventus` (đã có sẵn, xác minh 2026-08-29)
- [ ] Commit `next-env.d.ts` đang lệch cho cây sạch
- [ ] **NỢ 1** — `supabase db pull`, lấy định nghĩa thật `credit_order(bigint, int)`,
      tạo `2026xxxx_credit_order_amount_check.sql`
- [ ] NỢ 1 verify — `select * from information_schema.routine_privileges where
      routine_name='credit_order'` → chỉ `postgres`/`service_role`, không có `PUBLIC`
- [ ] **NỢ 2** — sinh `CRON_SECRET` ≥16 ký tự, điền `.env.local` + Vercel env
- [ ] NỢ 2 verify — gọi tay `/api/cron/expire-orders` kèm `Authorization: Bearer …`
      → phải trả `{ ok: true, count: n }`
- [ ] Mốc so sánh: chạy `pnpm build` + `pnpm lint`, **ghi lại output** vào Progress Log
- [ ] Đặt hàng asset thật: mặt sau lá bài + logo Ventus (X7) — song song, không chặn
- [ ] **CỔNG 0**: build xanh · cron trả `{ ok: true }` · 1 đơn PayOS thử cộng credits đúng

### GĐ 1 — Hệ token dark-only · 1 ngày · nền móng
- [ ] `tokens.css`: nền `#050505` · bề mặt `#18120e` · vàng `#d4af37` · đồng `#8f5a1f`
      · chữ `#ece0d8`
- [ ] **Xoá** khối `@media (prefers-color-scheme: dark)` (`tokens.css:120`) và
      `:root[data-theme="dark"]` (`:141`) — gộp về `:root` duy nhất
- [ ] Giữ nguyên *kiến trúc*: ramp spacing 8 bước, thang chữ theo vai trò, lớp z có
      tên, token motion. Giữ `--spacing-0: 0px` tường minh (learning 2026-08-16)
- [ ] Token mới: `--glass-bg`, `--glass-blur`, `--glow-gold`, `--grain`
- [ ] Font: giữ Cormorant (heading) + thêm Plus Jakarta Sans (body), `subset: vietnamese`
- [ ] Icon: cài `lucide-react`. **Không** dùng Material Symbols kiểu ligature như
      mockup — screen reader đọc ra chữ `psychology`, và nháy chữ thô trước khi font tải
- [ ] Viết lại `design/system/contrast-audit.md` cho bảng mới. Kiểm riêng chữ phụ
      `#9e8e80` trên `#050505` — nghi ngờ không đạt 4.5:1
- [ ] **CỔNG 1**: trang cũ bất kỳ vẫn render đúng với token mới · không còn class
      Tailwind sinh từ chuỗi ghép động

### GĐ 2 — Vỏ ứng dụng · 1,5 ngày
- [ ] `Header`: 4 mục điều hướng + huy hiệu credits (đọc `profiles`, Server Component)
      + avatar + ngăn kéo mobile
- [ ] `Footer`: 4 link pháp lý **thật** (mockup để `href="#"`) + hotline 1900 6233
- [ ] Nền: nhiễu hạt + quầng sáng vàng, `position: fixed`, `pointer-events: none`
- [ ] Port `ambientAudio.ts` → `src/lib/ambient-audio.ts`. **Bắt buộc sửa**: đưa
      `setTimeout` trong `stop()` vào mảng `timerIds`; dừng nhạc khi unmount
- [ ] `AmbientSoundPlayer` component
- [ ] Hook `useDialog` dùng chung: Escape · focus trap · khoá cuộn body ·
      `role="dialog"` + `aria-modal`. Mockup **không có gì** trong số này
- [ ] **Đo hiệu năng kính mờ ngay ở đây, không đợi GĐ 9** (xem Rủi ro R1)
- [ ] **CỔNG 2**: bật/tắt nhạc 5 lần liên tiếp trong 1 giây vẫn phát đúng · Tab qua
      toàn bộ header thấy rõ vòng focus

### GĐ 3 — Trang chủ & Thông điệp hàng ngày · 1,5 ngày
- [ ] Hero + lưới 5 chủ đề (**giải X1**: cửa vào duy nhất của Đọc nhanh) + khối
      giới thiệu 2 cột
- [ ] `DailyTarotMessage` Server Component: lá theo `hash(ngày + userId)` tính ở
      **server** — hai người khác nhau ra lá khác nhau, mỗi người ổn định suốt ngày
- [ ] Nội dung lấy từ `base_content` chủ đề `general`. Không gọi AI
- [ ] Bỏ nút "Rút Lại" random của mockup — phá vỡ ý nghĩa "thông điệp của ngày".
      Thay bằng liên kết sang Thư viện
- [ ] **CỔNG 3**: tải lại trang 10 lần ra **cùng một lá** · đổi ngày hệ thống ra lá khác

### GĐ 4 — Thư viện 78 lá · 2 ngày · route mới, rủi ro thấp
- [ ] Verify trước: `select count(*) from base_content` = 780
- [ ] `/thu-vien`: lưới 78 lá (chỉ `cards.json`, không đụng DB) + 1 truy vấn lấy
      `summary` của `topic='general'` làm dòng preview
- [ ] Tìm kiếm theo tên + từ khoá, lọc 6 bộ — chạy phía client
- [ ] `/thu-vien/[cardId]`: 5 khối theo ánh xạ §3 — mind · love · career · money · general
- [ ] Công tắc **Xuôi / Ngược** đổi cả 5 khối cùng lúc (mockup chỉ hiện từ khoá ngược
      rồi thôi — dữ liệu đã trả tiền để sinh ra, dùng hết)
- [ ] Modal xem nhanh trên lưới, dùng `useDialog` từ GĐ 2
- [ ] `generateStaticParams` cho cả 78 lá + `generateMetadata` cho SEO
- [ ] **Không** thêm `/thu-vien` vào `PROTECTED_PREFIXES` — route công khai
- [ ] **CỔNG 4**: 78 lá đều có ảnh và đủ 5 khối ở **cả hai hướng** · bộ lọc "Gậy" ra 14 lá

### GĐ 5 — Đọc nhanh · 1,5 ngày
- [ ] `ReadingStage` 4 pha: idle → xào → quạt 12 lá → kết quả lật 3D
- [ ] Giữ nguyên hợp đồng `POST /api/reading` và `motionMs()` đọc token thời lượng
- [ ] Chip "Chủ đề: …" bấm đổi được ngay trên `/trai-bai` (**X1**). **Không** âm thầm
      mặc định `general`
- [ ] **Sửa xung đột animation của mockup**: `animate-card-fly-*` có `forwards` nên đè
      mất `hover:-translate-y-*` → tách hai lớp lồng nhau, hoặc gỡ class sau khi chạy xong
- [ ] Dọn timer: `setInterval` xào bài của mockup **không có cleanup**
- [ ] Thêm disclaimer pháp lý dưới kết quả (mockup thiếu ở màn này)
- [ ] CTA nối tiếp sang Đọc sâu — bản cũ là ngõ cụt
- [ ] **CỔNG 5**: rời trang giữa lúc xào **không còn cảnh báo cập nhật state** · ba
      lượt liên tiếp ra ba lá khác nhau

### GĐ 6 — Đọc sâu · 3 ngày · trọng tâm, rủi ro cao nhất
- [ ] Máy trạng thái `question → shuffling → picking → blocked | error` — giữ nguyên
      cấu trúc `DeepReadingStage`, chỉ thay lớp trình bày
- [ ] **X2** — lật tuần tự: bấm 1 lá → lá đó bay lên ô của nó, lật, mở khối Lớp Nền
      **miễn phí** ngay bên dưới. Đủ 3 lá thì CTA trả phí mới xuất hiện
- [ ] **X3** — dựng lại `CrisisResourceNotice` theo ngôn ngữ thị giác mới. Giữ nguyên
      3 hotline thật (Ngày Mai 0963 061 414 · Tổng đài 111 · Cấp cứu 115) và
      **không CTA thương mại nào** trên màn đó
- [ ] **X4** — giá Đọc sâu do server truyền xuống (`DEEP_READING_COST=2`), **không
      hardcode** ở bất kỳ đâu. Cùng cách với `DEEP_SPREAD_SLOTS` (=24)
- [ ] **X5** — hàng 5 chip chủ đề ngay trên textarea, dùng lại đúng kiểu chip mockup
      đã thiết kế cho "Gợi ý câu hỏi". Vào từ lưới chủ đề → chip tương ứng chọn sẵn
- [ ] **X6a** — `402 insufficient_credits`: dẫn sang `/nap-credits`, nói rõ **3 lá đã
      rút vẫn còn nguyên**
- [ ] **X6b** — `429 rate_limited`: nói rõ giới hạn bao nhiêu và khi nào thử lại.
      Không gộp vào "Không kết nối được máy chủ" như bản cũ
- [ ] Quạt 24 lá: mỗi lá là `<button>` thật, **không** `<div onClick>` — điều khiển
      được bằng bàn phím
- [ ] **Giữ NGUYÊN VẸN `DeepResultStream`**: bộ đọc NDJSON · gộp cập nhật bằng
      `requestAnimationFrame` · `AbortController`. Không có `AbortController` thì
      StrictMode gọi API 2 lần và **trừ credits 2 lần** — bản cũ đã dính đúng bug này.
      Chỉ thay vỏ hiển thị và con trỏ nhấp nháy
- [ ] **D2** — bỏ nút "Lưu", thêm liên kết → `/tai-khoan/[readingId]` từ sự kiện `done`
- [ ] Sửa nút chia sẻ: mockup báo "Đã sao chép link" nhưng thực ra copy **toàn văn**,
      và không bắt lỗi khi `navigator.clipboard` không khả dụng
- [ ] **CỔNG 6** — 4 kịch bản đầu-cuối: đủ credits · hết credits · câu hỏi bị chặn ·
      **AI lỗi giữa stream (phải tự hoàn credits — kiểm bằng `credit_ledger`, không
      phải bằng con số trên giao diện)**

### GĐ 7 — Tài khoản & lịch sử · 1,5 ngày
- [ ] Thẻ hồ sơ + số dư
- [ ] Tab giao dịch đọc `credit_ledger` **thật**: Nạp / Trừ / Hoàn / Tặng / Điều chỉnh
      + `balance_after` sau mỗi dòng
- [ ] Danh sách lịch sử phân trang 10/trang; nút xoá hai bước — giữ logic
      `DeleteReadingButton`
- [ ] **D1** — bỏ bộ lọc "Rút Nhanh" của mockup. Chỉ liệt kê Đọc sâu
- [ ] `/tai-khoan/[id]` theo bố cục `ReadingDetailModal` của mockup
- [ ] Thêm lối vào `/nap-credits` từ thẻ số dư — bản cũ **không có entry point nào**
- [ ] Bỏ tab "Cài đặt" của mockup (ngoài scope vòng này)
- [ ] Đăng xuất điều hướng về trang chủ, không để người dùng ở lại màn tài khoản
- [ ] **CỔNG 7**: số dư trên header · trên thẻ hồ sơ · dòng cuối sổ cái — **khớp
      nhau tuyệt đối**

### GĐ 8 — Nạp credits & Đăng nhập · 1,5 ngày
- [ ] `/nap-credits`: bố cục 3 gói của mockup, khớp đúng `PACKS` (10/49k · 30/129k ·
      100/359k)
- [ ] Sửa lỗi `mt-${…}` ghép chuỗi động của mockup — Tailwind không sinh class đó
- [ ] Sửa lỗi chọn gói của mockup: gói "Phổ biến" thắng nhánh ternary nên chọn gói
      khác vẫn thấy gói phổ biến sáng viền
- [ ] Giữ nguyên `QrPanel`: QR sinh bằng lib `qrcode` từ chuỗi PayOS trả về · đếm
      ngược từ `expiresAt` của **server** · Realtime + poll 5s làm lưới an toàn.
      **Bỏ hẳn** cách mockup gọi API QR bên ngoài kèm `Date.now()` ngay trong JSX
- [ ] `/dang-nhap`: Google + magic link + email/mật khẩu — đúng 3 phương thức backend
      hỗ trợ. **Bỏ** chế độ "Đăng ký" giả của mockup (chỉ đổi chữ trên nút)
- [ ] **X8** — giữ route làm nguồn sự thật cho cả 2 màn (middleware redirect · OAuth
      callback · `PROTECTED_PREFIXES` · PayOS `returnUrl`/`cancelUrl` đều phụ thuộc URL).
      Dùng thẩm mỹ modal của mockup cho *trang*: hộp hẹp, căn giữa, nền tối
- [ ] **CỔNG 8**: 1 giao dịch PayOS **thật** đầu-cuối — QR → chuyển khoản → webhook →
      credits cộng đúng → sổ cái có dòng `purchase`. Đơn để hết hạn **không cộng gì**

### GĐ 9 — Tiếp cận, chuyển động, nghiệm thu · 2 ngày
- [ ] Quét toàn bộ `<div onClick>` → `<button>`. Mockup có **6 bề mặt**: quạt 24 lá ·
      quạt 12 lá · lưới thư viện · thẻ chủ đề · gói credits · thẻ lịch sử
- [ ] `prefers-reduced-motion`: token motion về 1ms; animation vô hạn (lơ lửng, lấp
      lánh, shimmer) **dừng hẳn**. Mockup không có gì cho việc này
- [ ] Bỏ hết `alert()` — mockup dùng 4 chỗ. Thay bằng lỗi tại chỗ có `role="alert"`
- [ ] Kiểm tra tương phản lại toàn bộ theo audit ở GĐ 1
- [ ] Chạy `/design-review` + agent `a11y-auditor`
- [ ] Lighthouse trên `/`, `/thu-vien`, `/doc-sau` — kính mờ + quầng sáng dễ tụt điểm
- [ ] **CỔNG 9**: đi hết 5 luồng chính **chỉ bằng bàn phím** · không còn `alert()` ·
      build và lint xanh

### Gate cuối (theo `verification.md`)
- [ ] lint
- [ ] typecheck — `tsc --noEmit` chạy tay (không có script)
- [ ] test — `n/a` (không có script, không có test)
- [ ] build
- [ ] Responsive 375 / 768 / 1280 / 1920 trên mọi bề mặt mới
- [ ] Chỉ 1 theme (dark) — light đã xoá có chủ đích, **không** ghi là gap
- [ ] Accessibility pass
- [ ] **Thay ảnh mặt sau lá bài mượn từ đối thủ + xoá `public/_placeholder-doi-thu/`**
      — chặn phát hành công khai
- [ ] Learnings extracted → `walkthrough.md` + `.claude/rules/project.md`

## Rủi ro

**R1 — Kính mờ chồng lớp làm tụt hiệu năng.** Mockup dùng `backdrop-filter: blur()` ở
gần như mọi bề mặt, cộng nhiễu hạt + quầng sáng cố định. Trên máy yếu đây là nguyên
nhân giật phổ biến nhất. **Đo ở GĐ 2, không đợi GĐ 9** — nếu phải bỏ bớt thì đó là
quyết định về ngôn ngữ thị giác, cần biết *trước khi* dựng 8 màn.

**R2 — GĐ 6 là nơi tiền chảy qua.** Chạm vào trừ credits, gọi AI, hoàn tiền. Mọi thay
đổi kiểm bằng `credit_ledger.balance_after`, **không phải** bằng con số trên giao diện.

**R3 — Bỏ light theme là quyết định một chiều.** Xoá sạch `prefers-color-scheme` ngay
ở GĐ 1 thay vì để lại "phòng khi cần" — token nửa vời sinh ra màu chỉ đúng ở một chế
độ, loại lỗi rất khó thấy khi review.

**R4 — Ảnh mặt sau lá bài vẫn là ảnh mượn từ đối thủ.** Xuất hiện trong mọi animation
xào và rút — đúng khoảnh khắc thương hiệu nhất. Không phát hành công khai với ảnh này.

**R5 — Ước lượng 16 ngày không bao gồm nội dung mới.** Viết lại 780 dòng
`base_content` cho hợp giọng điệu mới là hạng mục riêng.

## Progress Log
> `/execute` append một dòng mỗi checkpoint. Đây là thứ khiến một lượt chạy bị ngắt
> có thể tiếp tục được — không bỏ qua.

- 2026-08-29: Viết `task.md`. Xác minh trạng thái repo so với plan: branch
  `redesign/ventus` đã có · `next-env.d.ts` là file duy nhất đang lệch · **NỢ 1 xác
  nhận là thật** (migrations chỉ có `credit_order(uuid)`, bản `(bigint,int)` webhook
  đang gọi chưa từng thành file) · 78 lá `cards.json` + 78 ảnh `public/cards/` khớp
  plan · khối light theme còn sống ở `tokens.css:120` và `:141` · `package.json`
  **không có** script `typecheck`/`test` (plan không nhắc — gate ladder phải điều
  chỉnh). Chốt D1 + D2 với user.

## Open Questions
- ~~Đọc nhanh có vào lịch sử không?~~ — chốt 2026-08-29, xem **D1**.
- ~~Nút "Lưu Phiên Trải Bài"~~ — chốt 2026-08-29, xem **D2**.
- **Asset thương hiệu thật (mặt sau lá bài + logo Ventus)** — cần user đặt hàng
  thiết kế. Không chặn code, **chặn phát hành**. Đặt ở GĐ 0 để chạy song song.
- **`CRON_SECRET`** (NỢ 2) — cần user điền vào Vercel env; `.env.local` Claude không
  đọc/ghi được (`guard-paths.sh` chặn có chủ đích).
- **Migration NỢ 1** — nhiều khả năng `apply_migration` lại bị classifier chặn (DDL
  đụng hàm xử lý tiền thật). Chuẩn bị sẵn phương án user tự chạy Dashboard + Claude
  xác minh lại bằng `information_schema`.
