# Redesign giao diện theo tinh thần Calestial

Áp dụng ngôn ngữ thị giác của template Figma "Calestial — Astrology &
Horoscope Website Design" (Community, fileKey `o422q5jV8jCYYasqUpHjDO`) lên
toàn bộ 5 màn hình sản phẩm hiện có, giữ nguyên token màu Thổ+Kim và animation
đã tinh chỉnh thật ở luồng trải bài. Vì đây là site landing-page marketing
(không phải app screens) nên chỉ mượn bố cục/motif/typography — không có màn
hình tương đương 1:1 nào để sao chép máy móc.

## Decisions Needed From You
> [!IMPORTANT]
> - **Footer**: Calestial có footer 4 cột. Site chưa có Footer component nào.
>   Đề xuất: **hoãn tới Giai đoạn 7** (khi có trang Điều khoản/Quyền riêng
>   tư/Hoàn tiền thật để liên kết tới) — thêm Footer trống/link-cụt bây giờ
>   tạo nợ UX mới ngay khi vừa thêm.
> - **TopicPicker**: giữ pill-button (chỉ đổi màu/viền/glow) hay chuyển hẳn
>   sang card-grid 5 ô kiểu Weekly Horoscope? Đề xuất: **giữ pill** — card-grid
>   ăn nhiều chiều cao hơn ở 375px (5 chủ đề × card cao ~250px = cuộn dài),
>   trong khi pill đã verify tốt và không phải bug.
> - **Italic-mix heading** ("Unveiling *the Universe*"): đề xuất chỉ dùng ở
>   Hero H1 trang chủ và 1-2 section header lớn mới — không dùng ở heading
>   nhỏ trong card (dễ rối ở cỡ chữ nhỏ, dấu tiếng Việt in nghiêng khó đọc
>   hơn tiếng Anh).
>
> Nếu bạn không phản hồi trước `/execute`, tôi sẽ triển khai theo 3 đề xuất
> trên.

## Approach
Chia thành 5 layer độc lập, mỗi layer là một checkpoint `/execute` có thể
dừng/tiếp tục riêng: (1) token + 2 primitive dùng chung (`Card`, `StarField`)
đặt nền cho mọi layer sau, (2) trang chủ, (3) nạp credits, (4) trải bài/kết
quả — chỉ polish visual, không đụng state machine hay timing đã tune, (5) cá
nhân. Mọi màu vẫn đọc từ token Thổ+Kim hiện có; thứ duy nhất thay đổi ở tầng
token là giá trị `--font-heading` (thêm Cormorant self-host qua `next/font`)
và một token shadow mới `--shadow-glow` cho hiệu ứng glow phía sau card nổi
bật — cả hai đều cắm vào đúng chỗ token rule đã chừa sẵn, không cần token
mới ngoài dự kiến.

**Considered and rejected**
- Đổi accent sang xanh chanh neon của Calestial — user đã chốt giữ vàng Kim,
  loại bỏ ngay từ đầu.
- Dùng thư viện particle (`tsparticles`, `react-particles`) cho họa tiết
  sao/chấm — vài chục điểm tĩnh không cần runtime particle engine, thêm
  dependency không cần thiết; SVG/CSS thuần đủ và rẻ hơn cho perf mobile.
- Viết lại toàn bộ `CardSpreadPicker`/`ReadingStage` animation từ đầu theo
  Calestial — hai component này KHÔNG có màn tương đương trong Calestial
  (landing page không có luồng "rút bài"), và timing hiện tại đã tune theo
  feedback thật qua 7 revision — rủi ro làm hỏng cái đang chạy tốt lớn hơn
  lợi ích thẩm mỹ.
- Chuyển `TopicPicker` sang card-grid ngay — xem Decisions Needed, để ngỏ
  chờ xác nhận thay vì tự quyết một thay đổi UX (không chỉ visual).

## Proposed Changes

### Layer 1 — Token & Primitives (nền cho mọi layer sau)

#### [MODIFY] `src/app/layout.tsx`
- Thêm `import { Cormorant } from "next/font/google"` (`subsets: ["latin",
  "latin-ext", "vietnamese"]`, `weight: ["500","600","700"]`, `style:
  ["normal","italic"]`, `variable: "--font-cormorant"`)
- Gắn `cormorant.variable` vào `className` của `<html>` (cạnh `data-theme`)
  để biến CSS có mặt toàn site

#### [MODIFY] `src/styles/tokens.css`
- `--font-heading`: đổi từ `ui-serif, Georgia, ...` thành
  `var(--font-cormorant), ui-serif, Georgia, "Iowan Old Style", "Palatino
  Linotype", serif` — giữ nguyên toàn bộ fallback chain cũ, chỉ chèn biến mới
  lên đầu. Không đổi tên token, không đổi consumer nào cần sửa code.
- Thêm `--shadow-glow` (elevation step thứ 4, đúng trần "3-4 bước" của
  design-system.md): soft halo dùng `--color-accent` ở alpha thấp, vd
  `0 0 48px rgb(var(--color-accent-rgb) / 0.25)` — cần thêm biến phụ
  `--color-accent-rgb` (giá trị RGB thuần của `--color-accent`, cả 2 theme)
  vì token màu hiện tại lưu dạng hex, không tách kênh RGB như
  `--shadow-color` đã làm.
- **Đồng bộ `production/tokens.css`** — theo quy ước dự án (2 file phải
  byte-identical), cùng 2 thay đổi trên.

#### [NEW] `src/components/ui/StarField.tsx`
- Component thuần trang trí: N ngôi sao 4 cánh (SVG) + M chấm tròn, vị trí
  rải ngẫu nhiên nhưng **cố định seed** (không random mỗi render — tránh
  layout-shift/hydration mismatch), `aria-hidden="true"`,
  `pointer-events-none`, `position:absolute inset-0 overflow-hidden`
- Props: `density?: "sparse" | "normal"`, không nhận children
- Optional twinkle animation (opacity 0.4↔1, stagger, `--motion-slow`) —
  **tắt hoàn toàn** dưới `prefers-reduced-motion`/`[data-motion="reduce"]`
  (không chỉ rút ngắn duration — twinkle liên tục vô hạn phải dừng hẳn,
  khác timing token thông thường)

#### [NEW] `src/components/ui/Card.tsx`
- Hợp nhất markup card đang lặp lại thủ công ở `PackagePicker.tsx` và
  `ResultPanel.tsx` (`bg-surface-raised rounded-lg shadow-md` + border)
- Props: `variant?: "default" | "highlighted"` (highlighted thêm
  `--shadow-glow` + `border-color: var(--color-accent)`), `as?: "div" |
  "article"` — layout (margin ngoài) vẫn do parent quyết định theo
  design-system.md
- **Consumers migrate ở Layer 2/3/4** — bản thân Layer 1 chỉ tạo primitive,
  không đổi hành vi gì đang chạy

### Layer 2 — Trang chủ (`src/app/page.tsx`)

#### [MODIFY] `src/app/page.tsx`
- Hero: bọc `<StarField />` phía sau, heading dùng `font-heading` (tự động
  nhận Cormorant qua token), áp `<em>` cho 1 cụm từ nhấn (semantic, không
  phải `<i>` — nhấn ý nghĩa thật) theo đề xuất ở Decisions Needed
- Entrance animation: hero heading + CTA fade+slide-up bằng Framer Motion,
  `duration: var(--motion-slow)` đọc qua inline style hoặc CSS class có sẵn,
  stagger 80–100ms giữa các dòng — **guard bằng `useReducedMotion()`** (hook
  đã có sẵn, dùng lại từ `ReadingStage.tsx`) để tắt stagger/transform khi cần,
  không chỉ dựa vào CSS token rút ngắn duration
- Section "vì sao chọn Ventus" (3 card, tinh thần "Why Choose Us" của
  Calestial) dùng `<Card variant="default">` mới, icon tròn + glow nhẹ khi
  hover (`--shadow-glow` ở `:hover`, KHÔNG glow mặc định — tránh 3 card cùng
  glow gây rối mắt)

#### [MODIFY] `src/components/reading/TopicPicker.tsx`
- Reskin: viền + `radius-lg`, trạng thái selected thêm `--shadow-glow` +
  giữ nguyên đổi màu nền hiện tại (glow là cue **thêm**, không **thay** —
  đúng rule "color không phải tín hiệu duy nhất")
- Giữ nguyên cấu trúc pill-grid, `transition-colors`, touch target 44px —
  không đổi behavior

### Layer 3 — Nạp credits

#### [MODIFY] `src/components/payment/PackagePicker.tsx`
- Migrate 3 card sang `<Card>` primitive: card gói giữa/phổ biến dùng
  `variant="highlighted"` (glow + badge text "Phổ biến nhất" — **badge chữ
  giữ nguyên**, không thay bằng chỉ màu/glow, đúng a11y color-not-only-signal)
- Giá tiền dùng `font-heading` (Cormorant) cỡ lớn hơn, đúng tinh thần
  Pricing Plan gốc
- Entrance: 3 card fade+slide-up stagger nhẹ khi vào viewport
  (`IntersectionObserver` hoặc Framer Motion `whileInView`), guard reduced-motion

#### [MODIFY] `src/components/payment/QrPanel.tsx`
- Chỉ polish visual khung chứa QR (border/radius theo `Card`) — **không đổi**
  progress-ring SVG, Realtime subscribe, polling logic

### Layer 4 — Trải bài & Kết quả

> Ranh giới quan trọng nhất của layer này: **chỉ chạm phần chưa có
> animation/style tinh chỉnh**. `GhostDeck`/`FlipCard` trong `ReadingStage.tsx`
> và toàn bộ deal/fly/flip trong `CardSpreadPicker.tsx` giữ nguyên 100%.

#### [MODIFY] `src/components/reading/ResultPanel.tsx`
- Migrate sang `<Card variant="highlighted">` (kết quả là khoảnh khắc chính,
  xứng đáng glow mặc định — khác các card danh sách khác)
- Giữ nguyên: thumbnail 96×166px, orientation badge, disclaimer `role="note"`
  — chỉ đổi lớp bọc ngoài, không đổi nội dung/semantics bên trong

#### [MODIFY] `src/components/reading/DeepResultStream.tsx`
- Heading dùng `font-heading`; khung stream dùng style `Card` nhẹ (không
  glow — nội dung dài, glow nền sẽ gây mỏi mắt khi đọc lâu)
- Không đổi cơ chế `ReadableStream`/`requestAnimationFrame` throttle, không
  đổi cursor `▍`

#### [MODIFY] `src/components/reading/ReadingStage.tsx` / `CardSpreadPicker.tsx`
- **Chỉ** thêm `<StarField density="sparse" />` ở nền khu vực trải bài (nếu
  không che khuất bài) — do vùng này vốn đã dày đặc chuyển động thật, ưu
  tiên **không** thêm animation mới, chỉ thêm ambience tĩnh
- Không sửa `DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS`, không sửa
  `--motion-shuffle/draw/flip`, không sửa gradient card-back hiện có
  (`linear-gradient(135deg, var(--color-accent) 0%, var(--color-surface-raised)
  70%)`) — đây là brand moment đã chốt

### Layer 5 — Cá nhân

#### [MODIFY] `src/app/tai-khoan/page.tsx`
- Card số dư credits: migrate sang `<Card variant="highlighted">` (số dư là
  thông tin quan trọng nhất trên trang)
- Heading dùng `font-heading`

#### [MODIFY] `src/components/account/LedgerTable.tsx`, `ReadingHistoryList.tsx`
- Polish visual container (border/radius nhất quán với `Card`), giữ nguyên
  phân trang, giữ nguyên `DeleteReadingButton` logic
- Entrance fade nhẹ khi load xong (không stagger từng dòng — bảng dài sẽ gây
  giật, chỉ fade cả khối 1 lần)

### Header

#### [MODIFY] `src/components/layout/Header.tsx`
- Polish visual (border-bottom mảnh, backdrop nhẹ nếu cần) theo tinh thần
  Navbar Calestial — **không đổi** cấu trúc breadcrumb-portal
  (`HeaderBreadcrumbSlot`), không đổi auth nav logic

## Accessibility Plan
- Semantic: `<StarField>` luôn `aria-hidden="true"`; heading emphasis dùng
  `<em>` (ý nghĩa thật), không dùng `<i>`; `Card` render `<article>` khi nội
  dung là 1 đơn vị độc lập (package/result), `<div>` khi chỉ là khung bọc
- Contrast: **không tạo cặp màu mới** — mọi text tiếp tục dùng
  `--color-text`/`--color-text-muted`/`--color-accent-strong` đã audit;
  `--shadow-glow` chỉ dùng làm nền trang trí phía sau, không bao giờ là nơi
  đặt text lên trên nó trực tiếp mà không qua `--color-surface-raised` ở giữa
- Color không phải tín hiệu duy nhất: card "phổ biến" giữ badge chữ, card
  đã chọn ở `TopicPicker` giữ đổi màu nền (glow chỉ là cue phụ thêm)
- Focus visible: `Card`/`TopicPicker`/`PackagePicker` sau khi thêm
  border/glow phải verify `:focus-visible` ring (`--color-focus-ring`) vẫn
  đủ tương phản trên nền mới — glow không được che focus ring
- Reduced motion: mọi entrance animation mới **phải** guard qua
  `useReducedMotion()` (không chỉ dựa vào token duration rút về 1ms) vì một
  số hiệu ứng (twinkle vô hạn, stagger delay) không tự tắt chỉ nhờ rút ngắn
  duration — verify bằng Playwright `reducedMotion:"reduce"` context, đúng
  pattern đã dùng ở 4b/4c

## Blast Radius
| Changed | Consumers | Risk |
|---|---|---|
| `--font-heading` giá trị | `ResultPanel.tsx:49,63` · `DeepResultStream.tsx:97` · `CardSpreadPicker.tsx:505` · `PackagePicker.tsx:26-27` · `Header.tsx:16` · `page.tsx:12,38,45,52,61` · `tai-khoan/page.tsx:59,64,69,81` | Đổi 1 token → mọi heading site-wide đổi font cùng lúc. Phải visual-check cả 8 điểm dùng, 3 breakpoint, 2 theme — không bỏ sót điểm nào |
| `--shadow-glow` mới + `--color-accent-rgb` mới | `Card` (highlighted), `TopicPicker` (selected state) | Token mới, ít consumer — rủi ro thấp, nhưng phải đồng bộ `production/tokens.css` theo quy ước dự án |
| `Card` primitive mới | `PackagePicker.tsx`, `ResultPanel.tsx` (migrate), section mới ở `page.tsx`, `tai-khoan/page.tsx` | Refactor 2 component đang chạy thật (có logic thanh toán/kết quả AI) sang dùng primitive mới — phải giữ nguyên mọi `role`/`aria-*` đang có (`ResultPanel` có `role="note"` disclaimer, không được mất khi đổi lớp bọc) |
| `StarField` mới | `page.tsx`, `PackagePicker.tsx`, `ReadingStage.tsx`/`CardSpreadPicker.tsx` (nền) | Thuần thêm mới, `pointer-events-none` — rủi ro chính là tràn ngang ở 375px nếu vị trí sao tính sai, phải verify không có horizontal scroll |
| `TopicPicker.tsx` reskin | Chỉ `page.tsx` (1 consumer) | Thấp — nhưng phải giữ 44px touch target |

## Verification Plan
### Automated
```
pnpm lint
npx tsc --noEmit
pnpm build
```
(không có `test` script — bỏ qua gate 3, ghi `n/a`)

### Manual
1. Mở `pnpm dev`, xem từng surface đã đổi (Hero, TopicPicker, PackagePicker,
   ResultPanel, DeepResultStream, tai-khoan) ở 375/768/1280px
2. Cả 2 theme (toggle qua `theme.js` đã có) — đặc biệt `--shadow-glow` phải
   đọc được trên cả nền sáng lẫn tối
3. Tab qua toàn bộ vùng đã đổi — focus ring còn thấy rõ trên card/pill mới
4. Bật `[data-motion="reduce"]` (toggle có sẵn) — xác nhận StarField hết
   twinkle, entrance animation không còn stagger/transform
5. Verify bằng Playwright context `reducedMotion:"reduce"` thật (không chỉ
   toggle demo) cho ít nhất Hero + PackagePicker — theo đúng pattern đã dùng
   ở Giai đoạn 4b/4c
6. Zoom 200% ở Hero/PackagePicker — glow/ornament không được che chữ hay
   tràn layout

## Out of Scope
- Footer mới (xem Decisions Needed — hoãn tới GĐ7)
- Chuyển `TopicPicker` sang card-grid (xem Decisions Needed)
- Bất kỳ thay đổi nào ở `DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS`,
  `--motion-shuffle/draw/flip`, hay gradient card-back hiện có
- Đổi `--color-*` (accent hay bất kỳ màu Thổ+Kim nào)
- Đổi `production/`/`design/` (deliverable đóng băng GĐ2)
- Logic nghiệp vụ: RNG, credit debit/refund, PayOS, AI streaming, RLS
- Trang/route mới ngoài 5 màn hình đã liệt kê
