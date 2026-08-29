# Giai đoạn 7 — Kiểm duyệt, bảo mật & pháp lý

Đóng 8 mục checklist Giai đoạn 7 (`Research/plan/08-timeline.md`): rate
limit trên 2 endpoint còn thiếu, 4 trang pháp lý bắt buộc, disclaimer đủ
cả 2 luồng trải bài, và rà soát logging. Audit trước khi viết plan (agent
Explore) xác nhận mục "tích hợp kiểm duyệt" đã xong từ Giai đoạn 4c —
giảm phạm vi thật xuống còn 7 việc.

## Decisions Needed From You
> [!IMPORTANT]
> Không còn — 3 quyết định (độ tuổi tối thiểu = 16, email liên hệ =
> placeholder `ho-tro@ventus-tarot.vn` cần thay trước Deploy, copy khủng
> hoảng = bản có giờ hoạt động + gợi ý 115) đã chốt với user qua
> `AskUserQuestion` trước khi viết plan này.

## Approach
Rate limit dùng lại nguyên `check_rate_limit` RPC đã có (Giai đoạn 3),
qua 1 helper `src/lib/rate-limit.ts` dùng chung cho 3 route thay vì lặp
lại logic RPC + lấy IP ở từng nơi — tránh drift khi có route thứ 4 sau
này. 4 trang pháp lý là Server Component tĩnh, dùng chung 1
`LegalPageLayout` (chỉ bọc title + ngày cập nhật, không phải hệ thống
typography mới — nội dung mỗi trang viết JSX thường bằng token sẵn có).
Disclaimer tách thành 1 component (`ReadingDisclaimer`) dùng ở cả 2 luồng
để nội dung pháp lý không có 2 bản chép tay dễ lệch nhau theo thời gian.
Sentry chỉ thêm `beforeSend` phòng vệ — audit xác nhận chưa có rò rỉ thật
sự (không `sendDefaultPii`, không route nào truyền `question` vào
`extra`), nên đây là việc nhỏ, không phải sửa lỗi.

**Considered và loại bỏ**
- Thêm `RATE_LIMIT_*` vào `env.ts` để cấu hình được qua biến môi trường —
  loại bỏ vì `shuffle/route.ts` (đã ship) dùng literal tại call site; đổi
  pattern giữa các route rate-limit sẽ gây khó hiểu hơn là lợi ích cấu
  hình chưa ai cần.
- Dùng `@tailwindcss/typography` (`prose` class) cho nội dung pháp lý dài —
  loại bỏ vì thêm dependency mới cho 4 trang tĩnh không đáng, và
  `design-system.md` yêu cầu nêu lý do cho dependency mới. Viết JSX
  section (`h2`/`p`/`ul` + token có sẵn) đủ dùng.

## Proposed Changes

### Primitives / Helpers

#### [NEW] `src/lib/rate-limit.ts`
- `getClientIp(request: Request): string` — đọc `x-forwarded-for` (lấy
  phần tử đầu) fallback `x-real-ip` fallback `"unknown"`, đúng pattern
  06§2.5.
- `checkRateLimit(key: string, windowSeconds: number, maxCount: number):
  Promise<boolean>` — gọi `getSupabaseAdmin().rpc("check_rate_limit", ...)`,
  throw nếu RPC lỗi (caller tự bắt + Sentry, giữ đúng pattern lỗi hiện có
  ở `shuffle/route.ts` thay vì nuốt lỗi im lặng).
- **Consumers**: `reading/route.ts`, `orders/route.ts`,
  `reading/deep/shuffle/route.ts` (refactor, không đổi hành vi).

#### [NEW] `src/lib/legal-contact.ts`
- `export const SUPPORT_EMAIL = "ho-tro@ventus-tarot.vn";` — 1 nguồn duy
  nhất, comment `// TODO(deploy): thay email thật trước Giai đoạn 10 —
  xem 08-timeline.md`.
- **Consumers**: `Footer.tsx`, 3 trang pháp lý.

### Components

#### [NEW] `src/components/reading/ReadingDisclaimer.tsx`
- Trích nguyên `role="note"` block hiện có trong `ResultPanel.tsx:78-88`
  (không đổi copy, không đổi style) thành component riêng, không props.
- **Consumers**: `ResultPanel.tsx` (thay block cũ bằng
  `<ReadingDisclaimer />`), `DeepResultStream.tsx` (thêm mới).

#### [MODIFY] `src/components/reading/DeepResultStream.tsx`
- Render `<ReadingDisclaimer />` ngay sau block kết quả
  (`streaming`/`done`/`error`), trước `</section>` đóng — hiện luôn khi
  component đã mount (component này chỉ mount sau khi user bấm "Đọc sâu",
  nên không cần ẩn ở trạng thái nào).

#### [MODIFY] `src/components/safety/CrisisResourceNotice.tsx`
- Đổi 3 dòng `<li>` trong nhánh `category === "crisis"` (dòng 39–41)
  thành bản có giờ hoạt động:
  ```
  Đường dây nóng Ngày Mai — 0963 061 414 (13:00–20:30, Thứ 4 → Chủ nhật)
  Tổng đài Quốc gia Bảo vệ Trẻ em — 111 (24/7)
  Cấp cứu y tế — 115 (nếu tình huống nguy cấp, ngoài giờ Ngày Mai)
  ```
- Cập nhật comment đầu file (dòng 5-8) — copy giờ tham chiếu thêm
  `Research/xac-minh-payos-va-hotline.md §2`, không chỉ `06 §3.2/§3.3`.
- **Consumers**: `DeepReadingStage.tsx` (giữ nguyên, không đổi hành vi
  ngoài copy), trang `/tai-nguyen-khung-hoang` mới (consumer thứ 2).

#### [NEW] `src/components/legal/LegalPageLayout.tsx`
- Props: `{ title: string; updatedAt: string; children: ReactNode }`.
- Bọc `<main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">` +
  `<h1>` (token `text-heading-1`) + dòng "Cập nhật lần cuối: {updatedAt}"
  (`text-body-sm text-text-muted`) + `children`.
- `max-w-3xl` cho main, nội dung con tự giới hạn `max-w-prose` (~65-75 ký
  tự/dòng theo `design-system.md` Responsive).
- **Consumers**: 3 trang pháp lý (không dùng cho crisis page — trang đó
  cố tình đơn giản hơn, không quảng cáo/không cấu trúc nhiều section).

#### [NEW] `src/components/layout/Footer.tsx`
- Server Component tĩnh. `<footer>` + `<nav aria-label="Pháp lý">` 4 link
  (`Link` từ `next/link`, không phải `<a>`) tới 4 trang mới + dòng liên hệ
  dùng `SUPPORT_EMAIL`.
- Token: `border-t`, `border-color: var(--color-border)`,
  `text-body-sm text-text-muted`, khoảng cách dùng `gap-x-6 gap-y-2`
  (bước có sẵn trong ramp spacing).
- **Consumers**: `src/app/layout.tsx` (site-wide, mọi trang).

### Pages / Routes

#### [MODIFY] `src/app/layout.tsx`
- Import + render `<Footer />` sau `{children}`, trong `<body>`.

#### [NEW] `src/app/tai-nguyen-khung-hoang/page.tsx`
- Server Component tĩnh, KHÔNG bọc `LegalPageLayout` (yêu cầu 06§3.3:
  "không được có quảng cáo, CTA mua credits, hay bất cứ thứ gì thương
  mại" — layout tối giản riêng, không tái dùng nav breadcrumb nào có thể
  trỏ ngược về nạp credits).
- Render `<h1>Tài nguyên hỗ trợ</h1>` + `<CrisisResourceNotice
  category="crisis" />` trực tiếp (component đã tự chứa toàn bộ copy cần
  thiết — đúng như comment gốc trong file đã ghi "thiết kế để Giai đoạn 7
  tái dùng ở route riêng").

#### [NEW] `src/app/dieu-khoan/page.tsx`
- `LegalPageLayout title="Điều khoản sử dụng" updatedAt="27/08/2026"`.
- Nội dung tối thiểu theo 06§4.1 + 05§8, các section:
  1. Bản chất dịch vụ — "Tarot là công cụ giải trí và tự chiêm nghiệm,
     không phải tư vấn y tế, pháp lý hoặc tài chính chuyên nghiệp."
  2. Độ tuổi — "Dịch vụ dành cho người từ 16 tuổi trở lên."
  3. Credits — trả trước; không hoàn nếu không hài lòng nội dung (trừ AI
     lỗi → tự động hoàn); mất khi xóa tài khoản; không hết hạn. Link sang
     `/chinh-sach-hoan-tien` cho chi tiết đầy đủ thay vì lặp lại toàn bộ
     bảng.
  4. Liên hệ — `SUPPORT_EMAIL`.

#### [NEW] `src/app/chinh-sach-quyen-rieng-tu/page.tsx`
- `LegalPageLayout title="Chính sách quyền riêng tư" updatedAt="27/08/2026"`.
- Section theo 06§4.1/§4.4:
  1. Dữ liệu thu thập — email (đăng nhập), câu hỏi trải bài, lịch sử trải
     bài, lịch sử giao dịch.
  2. Thời gian lưu — tới khi user xóa từng lượt/xóa tài khoản.
  3. Chia sẻ với bên thứ ba — Anthropic (xử lý AI diễn giải), PayOS (xử
     lý thanh toán) — không dùng cho mục đích khác, không bán dữ liệu.
  4. Quyền của bạn — xóa từng lượt trải bài (đã có ở `/tai-khoan`), xóa
     tài khoản (liên hệ `SUPPORT_EMAIL` — chưa có self-service xóa tài
     khoản trong app, ghi đúng thực tế thay vì hứa tính năng chưa có).
  5. Khi xóa tài khoản — xóa `profiles` + `readings`, giữ `orders` +
     `credit_ledger` (nghĩa vụ tài chính/kế toán) nhưng gỡ liên kết PII.

#### [NEW] `src/app/chinh-sach-hoan-tien/page.tsx`
- `LegalPageLayout title="Chính sách hoàn tiền" updatedAt="27/08/2026"`.
- Bảng 5 dòng nguyên văn từ `05-thanh-toan-credits.md §8` (AI lỗi → tự
  động hoàn; không hài lòng nội dung → không hoàn; nạp nhầm gói → hỗ trợ
  thủ công 7 ngày; xóa tài khoản → mất; không hết hạn).

### API Routes

#### [MODIFY] `src/app/api/reading/route.ts`
- Sau khi parse `topic`, trước `drawCard()`: lấy user tùy chọn qua
  `requireUser()` (đã có sẵn, trả `null` nếu chưa đăng nhập, không throw).
  - Đăng nhập: `checkRateLimit(`reading-quick:user:${user.id}`, 3600, 20)`.
  - Chưa đăng nhập: `checkRateLimit(`reading-quick:ip:${getClientIp(request)}`,
    86400, 3)`.
  - `false` → `NextResponse.json({ error: "rate_limited" }, { status: 429 })`.
  - Lỗi RPC → `Sentry.captureException` + 500, đúng pattern
    `shuffle/route.ts` hiện có.

#### [MODIFY] `src/app/api/orders/route.ts`
- Ngay sau `requireUser()` (route này luôn yêu cầu đăng nhập):
  `checkRateLimit(`orders-create:user:${user.id}`, 3600, 10)` → 429 nếu
  không cho phép.

#### [MODIFY] `src/app/api/reading/deep/shuffle/route.ts`
- Refactor gọi RPC trực tiếp (dòng 32-43) sang dùng
  `checkRateLimit("reading-deep-shuffle:user:" + user.id, 3600, 10)` từ
  helper mới — **đổi key từ `user:${id}` thành
  `reading-deep-shuffle:user:${id}`**. Lý do bắt buộc: nếu giữ nguyên
  `user:${id}`, key này sẽ trùng namespace với key mới ở
  `orders-create:user:${id}`/`reading-quick:user:${id}` chỉ vì tình cờ
  không trùng chuỗi — nhưng để tránh 1 route thứ 4 sau này vô tình chọn
  đúng `user:${id}` và đụng độ bucket, đặt tiền tố route cho cả 3 ngay từ
  đầu. Đổi key không cần migration — `rate_limits` chỉ là counter theo
  cửa sổ thời gian, key cũ tự hết hiệu lực.
- Xóa `console.error("[shuffle debug] rate_limit_check_failed", ...)` và
  `console.error("[shuffle debug] moderation_failed", ...)` (dòng 37, 49)
  — đã có `Sentry.captureException` song song, console.error là leftover
  dev logging vi phạm `code-style.md`.

#### [MODIFY] `src/app/api/reading/deep/personal/route.ts`
- Xóa các `console.error("[personal debug]", ...)` leftover (đã có
  `Sentry.captureException` song song ở cùng chỗ) — cùng lý do trên.
  Không đổi logic rate-limit (route này đã gate bằng credits, đúng thiết
  kế 06§2.2 "credits đã là giới hạn tự nhiên").

### Sentry Config

#### [MODIFY] `src/instrumentation.ts`
- Thêm `beforeSend` vào cả 2 `Sentry.init()` (nodejs + edge):
  ```ts
  beforeSend(event) {
    if (event.request) delete event.request.data;
    return event;
  },
  ```
- Lý do: `sendDefaultPii` hiện đang tắt (mặc định) nên request body
  không tự động gửi — đây là phòng vệ thêm 1 lớp, phòng trường hợp SDK
  đổi default hoặc ai đó bật `sendDefaultPii` sau này mà quên soát lại
  06§4.4.

#### [MODIFY] `src/instrumentation-client.ts`
- `beforeSend` tương tự (client-side event cũng có thể mang `request.data`
  nếu breadcrumb ghi lại fetch body).

### Payment Flow — link thật tới điều khoản

#### [MODIFY] `src/components/payment/NapCreditsFlow.tsx`
- Trong `<label>` (dòng 76-80), bọc cụm "trả trước, không hoàn lại..."
  hoặc thêm câu cuối: `Xem <Link href="/dieu-khoan">Điều khoản sử
  dụng</Link> và <Link href="/chinh-sach-hoan-tien">Chính sách hoàn
  tiền</Link>.` — vẫn giữ nguyên toàn bộ nội dung tóm tắt hiện có (không
  xóa, chỉ thêm link tới bản đầy đủ).

## Accessibility Plan
- **Semantic**: `<footer>` + `<nav aria-label="Pháp lý">`; 4 trang pháp
  lý dùng `<main>` (qua `LegalPageLayout`) + heading tuần tự `h1` → `h2`
  không nhảy cấp; link dùng `next/link`, không `<div onClick>`.
- **Keyboard**: mọi link Footer + trong nội dung pháp lý reachable bằng
  Tab, có focus visible từ token hiện có (không CSS mới cho focus ring).
- **Contrast**: `Footer` dùng `text-text-muted` trên `bg-surface` — cặp
  màu này **đã có sẵn** trong `contrast-audit.md` (dùng ở nhiều nơi khác
  như `ResultPanel` disclaimer) — không phải cặp mới, không cần đo lại.
  Copy khủng hoảng mới (`CrisisResourceNotice`) giữ nguyên `text-text`
  trên `--color-surface-raised` — cũng không phải cặp màu mới.
- **Focus management**: `/tai-nguyen-khung-hoang` là trang tĩnh load qua
  navigation thật (không phải nội dung chèn động) — không cần quản lý
  focus thủ công như `CrisisResourceNotice` làm khi nó xuất hiện inline
  trong SPA state.
- **Rate limit 429**: `DeepReadingStage.tsx` đã có nhánh 429 riêng (dòng
  38-44, message cụ thể) — không đổi. `ReadingStage.tsx` **không** có state
  máy lỗi riêng — lỗi `/api/reading` (bao gồm 429 mới) đi qua
  `CardSpread.tsx`'s catch chung (dòng 260-261,
  `role="alert"`) và hiện message generic "Không mở được lá này. Vui lòng
  thử lại." **Cố tình không phân biệt 429** ở đây: `CardSpread.tsx` đã qua
  7 vòng redesign (xem `.claude/brain/4c-picker-redesign/`), là component
  animation phức tạp, chung — thêm nhánh message theo status code đòi hỏi
  đổi kiểu trả về của `handlePick`/`onPick` prop, rủi ro không tương xứng
  với lợi ích (checklist Giai đoạn 7 chỉ yêu cầu có rate limit, không yêu
  cầu UX message riêng theo lý do lỗi). Ghi rõ trong "Out of Scope".

## Blast Radius
| Changed | Consumers | Risk |
|---|---|---|
| `ReadingDisclaimer.tsx` (mới, trích từ `ResultPanel.tsx`) | `ResultPanel.tsx`, `DeepResultStream.tsx` | Thấp — copy/style giữ nguyên 100%, chỉ đổi chỗ định nghĩa |
| `CrisisResourceNotice.tsx` copy | `DeepReadingStage.tsx` (đã ship), trang mới | Thấp — chỉ đổi text hiển thị, không đổi props/behavior |
| `src/app/layout.tsx` (+Footer) | Toàn bộ route trong app | Trung bình — site-wide, phải kiểm tra không phá layout ở trang có nội dung ngắn (vd `/dang-nhap`) tại 375px |
| `shuffle/route.ts` rate-limit key rename | Không có consumer ngoài (server-internal, không phải API response) | Thấp — user đang có counter cũ tự hết hạn theo window, không cần dọn dữ liệu |
| `env.ts` | Không đổi | — (cố tình không thêm var mới) |

## Verification Plan
### Automated
```bash
pnpm lint
npx tsc --noEmit
pnpm build
```
(theo `.claude/hooks/detect-stack.sh`; `test` = n/a, không có test script)

### Manual
1. `pnpm dev` — mở `/`, `/trai-bai`, `/doc-sau`, `/nap-credits`,
   `/tai-khoan` ở 375/768/1280px, cả 2 theme — xác nhận Footer không vỡ
   layout, không tạo scroll ngang.
2. Điều hướng tới cả 4 trang mới qua Footer bằng bàn phím (Tab), xác nhận
   focus visible, đọc nội dung, `next/link` không full reload.
3. `/doc-sau`: hoàn tất 1 lượt Đọc sâu thật (hoặc tới trạng thái
   `streaming`/`done`) — xác nhận `ReadingDisclaimer` xuất hiện dưới kết
   quả, đúng copy như `ResultPanel`.
4. Gọi `POST /api/reading` quá 3 lần liên tiếp khi chưa đăng nhập (test
   thủ công qua `curl`/không cookie) — xác nhận lần thứ 4 trả 429.
5. Gọi `POST /api/orders` quá 10 lần/giờ với 1 user thật — xác nhận 429
   (có thể test bằng cách hạ tạm `p_max_count` trong lúc test rồi trả lại,
   hoặc chấp nhận verify bằng code review + đơn vị nhỏ nếu tạo 10 đơn thật
   tốn thời gian — quyết định lúc `/execute`, ghi rõ cách đã làm vào
   walkthrough).
6. Zoom 200% ở 1 trang pháp lý dài nhất (`/chinh-sach-quyen-rieng-tu`) —
   không vỡ layout, `max-w-prose` vẫn giữ độ dài dòng đọc được.
7. Contrast: `Footer` + `CrisisResourceNotice` bản copy mới — xác nhận lại
   bằng công cụ đo (đã dùng ở `contrast-audit.md`) dù cặp màu không đổi,
   vì đây là nội dung hiển thị cho người dùng khủng hoảng (rủi ro cao).

## Out of Scope
- Message lỗi riêng cho 429 ở `ReadingStage.tsx`/`CardSpread.tsx` — dùng
  chung message lỗi generic đã có, không đổi `CardSpread.tsx` (lý do ở
  Accessibility Plan).
- Self-service xóa tài khoản trong app (Privacy Policy chỉ ghi "liên hệ
  hỗ trợ" vì tính năng này chưa tồn tại — không hứa quá những gì code làm
  được).
- Nâng cấp rate limit lên Upstash Redis.
- Gọi thật hotline để xác minh (vẫn ở Giai đoạn 10 checklist).
- Thay email placeholder bằng email thật — chỉ đặt hằng số +
  TODO, việc thay thế thật thuộc Giai đoạn 10.
- Test webhook PayOS gửi lại 3 lần (đã hoãn từ Giai đoạn 6 sang Giai đoạn 8).
