# Task: Redesign giao diện theo tinh thần Calestial (Figma)

> Created: 2026-08-27 · Slug: `calestial-redesign`

## Goal
Toàn bộ giao diện web app (trang chủ, trải bài, kết quả, cá nhân, nạp credits)
mang ngôn ngữ thị giác lấy cảm hứng từ template Figma "Calestial — Astrology &
Horoscope Website Design" (card bo-góc-lớn có glow phía sau, họa tiết sao/chấm
trang trí, heading serif kèu mix roman+italic, button outline mảnh, animation
sinh động hơn) — trong khi giữ nguyên 100% token màu Thổ+Kim đã qua kiểm WCAG
và không phá vỡ animation đã tinh chỉnh thật ở `ReadingStage`/`CardSpreadPicker`.

## Scope
**In**:
- Font serif display mới (Cormorant, qua `next/font/google`, có subset
  `vietnamese`) gán vào `--font-heading` — 1 token, áp dụng site-wide
- Component trang trí dùng chung: họa tiết sao/chấm (`StarField`), thuần
  SVG/CSS, `aria-hidden`
- Primitive `Card` mới (bo góc lớn, viền mảnh, `glow` prop tuỳ chọn) — hợp nhất
  markup card đang lặp lại ở `PackagePicker`/`ResultPanel`
- Redesign Hero + trang chủ (`src/app/page.tsx`)
- Reskin `TopicPicker.tsx` theo ngôn ngữ mới (giữ nguyên dạng pill, xem Open
  Questions)
- Redesign `PackagePicker.tsx` theo layout Pricing-Plan 3-card, glow cho gói
  phổ biến
- Đánh bóng visual `ResultPanel.tsx`/`DeepResultStream.tsx` — KHÔNG đổi
  logic stream/state
- Animation entrance/hover nhất quán ở chỗ đang tĩnh (trang chủ, nạp credits,
  cá nhân) bằng Framer Motion + token motion hiện có, tôn trọng reduced-motion
- Đánh bóng visual trang `tai-khoan` (credit card, `LedgerTable`,
  `ReadingHistoryList`)
- Polish `Header.tsx` theo tinh thần mới (không đổi cấu trúc nav)

**Out**:
- Không đổi token màu (`--color-accent` và mọi màu Thổ+Kim giữ nguyên)
- Không đổi `production/`/`design/` (deliverable đóng băng Giai đoạn 2)
- Không đổi `DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS` trong `CardSpreadPicker.tsx` hay
  `--motion-shuffle/draw/flip` — timing đã tinh chỉnh theo phản hồi thật
- Không đổi logic nghiệp vụ: RNG, credit debit/refund, PayOS, AI calls, RLS
- Không thêm Footer mới (site chưa có — xem Open Questions)
- Không đưa nội dung tiếng Anh của Calestial vào app — giữ nguyên copy tiếng
  Việt hiện có

## Assumptions
- Cormorant hỗ trợ Vietnamese subset (xác nhận qua
  fonts.google.com/specimen/Cormorant?subset=vietnamese) — an toàn cho heading
  có dấu
- `next/font/google` self-host lúc build, không cần gọi mạng runtime
- Giữ nguyên `--font-body` (system sans stack) — chỉ đổi giá trị
  `--font-heading`, giữ nguyên tên token và toàn bộ fallback chain cũ ở cuối
- Ornament sao/chấm dựng bằng SVG/CSS thuần — không thêm dependency particle
  mới

## Checklist
- [x] Plan approved — 2026-08-27, theo cả 3 đề xuất trong implementation-plan.md
- [x] Tokens / theme (`--font-heading` value, `--shadow-glow` mới)
- [x] Primitives (`Card`, `StarField`)
- [x] Composed components — TopicPicker, PackagePicker, ResultPanel,
  DeepResultStream, QrPanel đều xong (Layer 2-4)
- [x] Pages / routes — `page.tsx` (Layer 2) và `tai-khoan/page.tsx` (Layer
  cuối) đều xong
- [~] States — cấu trúc 4 trạng thái giữ nguyên (chỉ bọc thêm `Card`, không đổi
  nhánh logic); loading/error của `DeepResultStream`/`QrPanel` chưa xem trực
  tiếp bằng mắt (cần AI key hợp lệ / giao dịch PayOS thật — ngoài phạm vi)
- [x] Responsive: 375 / 768 / 1280 — verify bằng Playwright thật cho `/`,
  `/trai-bai`, `/nap-credits`, `/tai-khoan` (không scroll ngang, không vỡ
  layout ở tổ hợp nào)
- [x] Both themes — dark/light verify bằng Playwright cho `/`, `/trai-bai`,
  `/nap-credits`, `/tai-khoan`, cùng smoke-check `/doc-sau` (không đổi nhưng
  kế thừa token font mới)
- [x] Accessibility pass — focus-visible ring còn rõ trên pill đã chọn (glow +
  đổi màu + ring cùng lúc, xem screenshot), ornament `aria-hidden`, disclaimer
  `role="note"` giữ nguyên qua migrate sang `Card`
- [x] Gates green (lint / typecheck / build) — `pnpm lint`, `tsc --noEmit`,
  `pnpm build` xanh sau mỗi layer
- [ ] Learnings extracted — việc của `/finish`

## Progress Log
> `/execute` appends một dòng mỗi checkpoint.

- 2026-08-27 Layer 1 xong — Cormorant wired qua `next/font/google` vào
  `--font-heading` (fallback nguyên vẹn khi thiếu), `--shadow-glow` mới
  (`color-mix()`, không cần token RGB phụ — deviation nhỏ so với plan gốc,
  xem báo cáo cuối), `Card`/`StarField` primitive mới. `pnpm lint` +
  `tsc --noEmit` xanh.
- 2026-08-27 Layer 2 xong — trang chủ: Hero có `StarField` + `FadeIn` entrance
  + italic-mix ở H1 (đúng phạm vi đã duyệt: chỉ Hero); 3-card "vì sao chọn"
  migrate sang `Card` (giữa = highlighted); `TopicPicker` reskin (glow khi
  chọn, giữ nguyên pill + behavior). Thêm 1 primitive ngoài dự kiến ban đầu:
  `FadeIn` (rút từ pattern `motionMs` sẵn có ở `ReadingStage.tsx`, nay tách
  ra `src/lib/motion.ts` dùng chung — xem deviations). `pnpm lint` +
  `tsc --noEmit` + `pnpm build` xanh (font Cormorant tải build-time OK).
- 2026-08-27 Layer 3 xong — `PackagePicker` migrate sang `Card` (gói
  "popular" = highlighted + badge chữ "Phổ biến nhất", không chỉ dựa glow),
  `FadeIn` stagger giữa 3 card; `QrPanel` chỉ thêm viền quanh khung QR
  (`--elevation-border`), không đụng progress-ring/Realtime/polling.
  `pnpm lint` + `tsc --noEmit` xanh.
- 2026-08-27 Layer 4 xong — `ResultPanel` migrate sang `Card variant="highlighted"`
  (disclaimer note giữ nguyên bên ngoài card, không đổi); `DeepResultStream`
  bọc nội dung streaming/done bằng `Card` mặc định (không glow); thêm
  `<StarField density="sparse">` làm ambience tĩnh ở `ReadingStage` (trong
  box 220×385 của GhostDeck) và `CardSpreadPicker` (trong group chọn lá) —
  KHÔNG đụng `DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS`, `--motion-shuffle/draw/flip`,
  hay gradient card-back. `pnpm lint` + `tsc --noEmit` xanh.
- 2026-08-27 Layer cuối — polish `tai-khoan/page.tsx` (credits card =
  highlighted, `LedgerTable`/`ReadingHistoryList` bọc `Card` mặc định ở cấp
  page, không sửa 2 file đó) + `Header.tsx` (bg-surface/90 + backdrop-blur).
  `pnpm build` xanh. Verify trực quan bằng Playwright (cài tạm ở scratchpad,
  không đụng `package.json`/lockfile của repo): `/` và `/trai-bai` ở
  375/768/1280px × dark/light — không scroll ngang, font Cormorant lên đúng,
  glow/focus-ring hoạt động đúng cùng lúc trên pill đã chọn, không console
  error. `/doc-sau` (chưa đăng nhập) smoke-check không regress.
- 2026-08-27 Verify nốt `/nap-credits`/`/tai-khoan` — tạo tài khoản test thật
  qua UI signup, Playwright chụp cả 2 trang ở 375/768/1280 × dark/light:
  không scroll ngang, không console error, `Card variant="highlighted"`
  (gói "Phổ biến nhất", credits card) đúng glow cả 2 theme. Đã xoá sạch tài
  khoản test (`count(*) = 0`, xác nhận qua SQL).

## `/design-review` 2026-08-27
Xem chi tiết đầy đủ ở `.claude/brain/quick-read-card-spread/task.md` §
`/design-review` (review chạy chung cho cả 2 task). Điểm liên quan trực tiếp
task này: **`src/lib/motion.ts` (`motionMs`, dùng bởi `FadeIn.tsx`) tính sai
đơn vị thời lượng** (Chromium trả `"1.1s"` thay vì `"1100ms"`, `parseFloat`
bỏ qua đơn vị) — mọi animation `FadeIn` trên trang chủ/nạp credits/cá nhân
chạy nhanh hơn dự định ~1000 lần, gần như tức thời thay vì fade+slide mượt
như thiết kế. Đã sửa `motionMs()` để nhận diện đơn vị `s`/`ms` — verify lại
qua Playwright xác nhận `--motion-*` đọc đúng giá trị thật. Không đổi giá
trị token nào, chỉ sửa cách đọc.

## Open Questions
- ~~Footer, TopicPicker pill-vs-card, phạm vi italic-mix~~ — **user duyệt
  2026-08-27: làm theo cả 3 đề xuất** (hoãn Footer tới GĐ7 · giữ pill ·
  italic-mix chỉ ở Hero + section header lớn). Không còn câu hỏi mở.
- ~~`/nap-credits`/`/tai-khoan` chưa verify trực quan~~ — đã verify
  2026-08-27 (xem Progress Log). Không còn câu hỏi mở.
