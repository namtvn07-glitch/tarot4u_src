# Task: Đọc nhanh dùng chung cơ chế trải-bài-chọn-lá với Đọc sâu

> Created: 2026-08-27 · Slug: `quick-read-card-spread`

## Goal
Trang Đọc nhanh (`/trai-bai`, `ReadingStage.tsx`) bỏ cơ chế "xáo 1 cọc → tự
lật" hiện tại, dùng lại đúng ngôn ngữ tương tác trải-bài-chọn-lá của Đọc sâu
(`CardSpreadPicker.tsx`: N lá úp, người dùng tự bấm chọn 1 lá, lá bay ra bàn
rồi lật) — qua một component lõi dùng chung, KHÔNG copy-paste, KHÔNG đổi
timing/behavior hiện có của `/doc-sau`. Animation mượt hơn nhờ thừa hưởng
easing/timing đã tune 7 vòng qua feedback thật của Đọc sâu.

## Scope
**In**:
- Tách phần "N-slot deck + pick + fly + flip" của `CardSpreadPicker.tsx`
  thành component dùng chung `src/components/reading/CardSpread.tsx`
- `CardSpreadPicker.tsx` refactor thành wrapper mỏng dùng `CardSpread`
  (giữ nguyên `ContextPanel`, breakout-layout desktop, mọi hằng số/behavior)
- `ReadingStage.tsx` viết lại: bỏ `GhostDeck`/`FlipCard`, dùng `CardSpread`
  với `pickCount=1`, giữ nguyên gọi `/api/reading`, giữ nguyên `ResultPanel`
- Giữ 1 bước "idle" trước khi spread hiện ra (nút bấm + 1 nhịp xáo ngắn
  thuần client, xem Decisions Needed #3)

**Out**:
- Không đổi bất kỳ hằng số/behavior nào của `/doc-sau` khi refactor (chỉ đổi
  *nơi định nghĩa*, không đổi *giá trị*)
- Không đổi API `/api/reading`, không thêm token ký/credits cho Đọc nhanh
  (vẫn miễn phí, RNG server-side như cũ)
- Không đổi `ResultPanel`, `DeepResultStream`, `ContextPanel`, `RevealText`
- Không thay ảnh mặt sau lá bài tạm (`/_placeholder-doi-thu/card-back.jpg`)
  — kế thừa nợ kỹ thuật đã ghi nhận, không tạo nợ mới

## Assumptions
- Vị trí slot chỉ mang tính cảm giác — lá thật vẫn do RNG server-side quyết
  định độc lập với vị trí bấm (đúng nguyên tắc đã áp dụng ở Đọc sâu)
- Số lượng slot cho Đọc nhanh không cần bằng Đọc sâu (24) — đề xuất 12, xem
  Decisions Needed #2
- `next/font`/token/`Card`/`StarField` từ task `calestial-redesign` giữ
  nguyên, không đổi gì thêm ở tầng đó

## Checklist
- [x] Plan approved — 2026-08-27, theo cả 3 đề xuất trong implementation-plan.md
- [x] Primitives — tách `CardSpread.tsx` (deck/pick/fly/flip, hằng số y
  nguyên; `onPick` nhận thêm `revealIndex` để Đọc sâu vẫn hỏi đúng lá theo
  thứ tự token đã ký)
- [x] Composed components — `CardSpreadPicker.tsx` refactor thành wrapper
  mỏng dùng `CardSpread` (giữ nguyên `ContextPanel`/`RevealText`/breakout
  layout desktop). `pnpm lint`/`tsc --noEmit`/`pnpm build` xanh
- [x] Pages / routes — `ReadingStage.tsx` viết lại: bỏ `GhostDeck`/`FlipCard`,
  dùng `CardSpread` với 1 ô bàn căn giữa, 12 slot, state machine rút gọn còn
  `idle→shuffling→picking→success` (lỗi bốc lá xử lý tại chỗ trong
  `CardSpread`, không còn "error" cấp state riêng — xem Deviations).
  `pnpm lint`/`tsc --noEmit`/`pnpm build` xanh
- [x] States: loading (shuffling + spinner từng lá) / empty (idle) / error
  (inline `role="alert"` khi `/api/reading` fail, verify tại chỗ trong
  `CardSpread`) / success (`ResultPanel`) — cả 4 xác nhận qua Playwright thật
- [x] Responsive: 375 / 768 / 1280 — verify Playwright thật, không scroll
  ngang ở bất kỳ tổ hợp nào
- [x] Both theme — dark/light, cả `/trai-bai` (đủ 3 trạng thái) và `/doc-sau`
- [x] Accessibility pass — `aria-label` nhóm đổi theo ngữ cảnh ("Chọn 1 lá..."
  vs "Chọn 3 lá..."), touch target 44px giữ nguyên, reduced-motion verify
  bằng Playwright context thật (không chỉ toggle demo)
- [x] Gates green — `pnpm lint`/`tsc --noEmit`/`pnpm build` xanh mỗi layer
- [x] Hồi quy `/doc-sau` — verify bằng tài khoản test thật qua
  `/api/dev-mint-token`: spread 24 lá, breakout layout 768/1280px, bay/lật/
  RevealText trong `ContextPanel` — khớp đúng thiết kế gốc, không lệch
- [ ] Learnings extracted — việc của `/finish`

## Progress Log
- 2026-08-27 Xong toàn bộ 3 layer (Primitives/Composed/Pages) + verify đầy
  đủ. Phát hiện + vá 1 bug thật lúc verify bằng ảnh chụp: `onAllPicked` bắn
  ngay khi `flying.length` đổi (trước khi bay/lật kịp chạy) — nếu nơi gọi ẩn
  UI khi nhận callback này (đúng như `ReadingStage` làm) thì animation bị
  cắt ngang giữa chừng. Sửa bằng cách bắn `onAllPicked` đúng lúc trong
  `handlePick` (sau khi flip hoàn tất + `FLIP_MS` đệm), không qua effect dựa
  trên state suy ra. Không ảnh hưởng Đọc sâu (chỉ trễ thêm lúc hiện nút "Đọc
  sâu cho câu hỏi của bạn" ~420ms, đúng ra còn hợp lý hơn bản cũ). Cũng phát
  hiện + sửa 1 vấn đề UX lúc xem ảnh: giữ khu trải bài hiện cùng lúc với
  `ResultPanel` tạo ra ảnh lá bài trùng lặp (khác dự tính ban đầu) — quyết
  định ẩn khu trải bài khi vào "success", chỉ hiện `ResultPanel` (đúng câu
  "giữ nguyên ResultPanel" trong plan). Verify bằng tài khoản test thật (tạo
  qua UI signup, xoá sạch sau — 0 dòng còn lại, xác nhận qua
  `information_schema`/`count(*)`), Playwright thật cho toàn bộ 375/768/1280
  × dark/light + 1 pass reduced-motion, và hồi quy `/doc-sau` qua
  `/api/dev-mint-token`. `pnpm lint`/`tsc --noEmit`/`pnpm build` xanh.

## Open Questions
- ~~3 điểm trong "Decisions Needed From You"~~ — user duyệt 2026-08-27, làm
  theo cả 3 đề xuất (tách `CardSpread.tsx` dùng chung · 12 slot cho Đọc nhanh
  · giữ bước idle). Không còn câu hỏi mở.

## `/design-review` 2026-08-27 — đã fix Critical
- 🔴 **Mất focus về `<body>` mỗi lần bốc lá** (`CardSpread.tsx`) — nút deck bị
  `disabled` giữa chừng làm trình duyệt tự blur, nút "lá bay" mới mount
  không nhận focus. **Đã có từ bản gốc `CardSpreadPicker.tsx` trước khi tách
  file** (xác nhận qua `git show HEAD`), nhưng lần tách này nhân đôi sang cả
  luồng free — đã sửa: không disable nút đang tự nó loading + focus tường
  minh sang nút "lá bay" qua `flyingButtonRefs` một khi nó mount.
- 🔴 **Bấm "Xáo bài" làm mất focus về `<body>`** (`ReadingStage.tsx`) — regression
  thật của bản viết lại (bản cũ giữ nguyên nút, chỉ disable). Đã sửa: dời
  focus sang text "Đang xáo bài…" (`tabIndex={-1}`, cùng pattern
  `result-heading`) + thêm `role="status"` (fix luôn Warning liên quan,
  không tốn thêm chỗ sửa).
- **Bug thật phát hiện thêm lúc verify lại bằng Playwright** (không có trong
  báo cáo review, tự phát hiện khi kiểm chứng fix trên): `motionMs()` (dùng
  chung ở đây và `FadeIn.tsx`) tính sai đơn vị — Chromium trả computed style
  của custom property `<time>` dạng giây (`"1.1s"`), không phải chuỗi gốc
  (`"1100ms"`); `parseFloat` chỉ lấy `1.1`. Toàn bộ animation qua hàm này chạy
  nhanh hơn dự định ~1000 lần. Có từ bản gốc, không phải lỗi mới — đã sửa
  `src/lib/motion.ts` để nhận diện đơn vị `s`/`ms`. Verify lại: nhịp xáo giờ
  đúng ~1.1s (trước đó chưa tới 1 frame).
- Verify lại toàn bộ bằng Playwright thật (keyboard Enter, không chỉ
  `.click()`): focus đúng ở text xáo bài → giữ nguyên trên nút đang loading
  → chuyển đúng sang nút lá đã lật. Hồi quy `/doc-sau` + toàn bộ
  375/768/1280 × dark/light `/trai-bai` lại xanh sau 2 fix trên.
- **2026-08-27, phiên sau — fix nốt 5 Warning theo yêu cầu user**:
  - Thêm token `--color-scrim`/`--color-on-scrim` (tokens.css + production/),
    thay `bg-black/35`/`text-white`/`border-white/40` trong overlay loading
    của `CardSpread.tsx` bằng token
  - `stackOrigin`'s `+12` → `spacePx("--space-3", 12)`, thêm comment giải
    thích các hệ số dàn lệch (`*0.5`/`*0.4`) là thuần trang trí, cố ý không
    phải token
  - `ContextPanel` trong `CardSpreadPicker.tsx` migrate sang `Card`
  - `NapCreditsFlow.tsx`: consent-box → `Card` mặc định, paid-success box →
    `Card variant="highlighted"` (khoảnh khắc thanh toán thành công, xứng
    glow như `ResultPanel`)
  - Thêm 2 dòng vào `production/contrast-audit.md` cho cặp `--color-accent`
    (viền `Card` highlighted) / `--color-surface-raised`, cả 2 theme (4.78:1
    light, 7.19:1 dark — số liệu từ a11y-auditor)
  - Verify lại bằng Playwright (tài khoản test thật, xoá sạch sau): `/doc-sau`
    ContextPanel giờ qua `Card` vẫn đúng layout/breakout desktop, `/nap-credits`
    consent-box đúng style mới, không console error, `pnpm lint`/`tsc --noEmit`/
    `pnpm build` xanh
  - Còn lại chưa fix (thuộc mức Info, không nằm trong yêu cầu): z-index cục
    bộ raw (`40`, `50+tableIndex`) chưa đặt tên hằng số; `Card as="article"`
    thiếu `aria-labelledby` ở vài nơi; `spacePx`/`motionMs` vẫn là 2 hàm
    trùng logic khác tên.
