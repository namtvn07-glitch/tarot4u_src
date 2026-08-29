# Task: Giai đoạn 7 — Kiểm duyệt, bảo mật & pháp lý

> Created: 2026-08-27 · Slug: `phase-7-kiem-duyet-bao-mat-phap-ly`

## Goal
Mọi endpoint AI/thanh toán có rate limit thật, disclaimer xuất hiện dưới
mọi kết quả trải bài (không chỉ Đọc nhanh), và app có đủ 4 trang pháp lý
bắt buộc trước launch (điều khoản, quyền riêng tư, hoàn tiền, tài nguyên
khủng hoảng) — khớp 8 mục checklist Giai đoạn 7 ở
`Research/plan/08-timeline.md`.

## Scope
**In**:
- Rate limit (`check_rate_limit` RPC, đã có sẵn) wiring cho `POST
  /api/reading` (quick) và `POST /api/orders` — hiện chỉ `shuffle` có.
- Namespacing lại rate-limit key của `shuffle` (tránh đụng độ bucket với
  key mới ở `orders`).
- 4 trang mới: `/tai-nguyen-khung-hoang`, `/dieu-khoan`,
  `/chinh-sach-quyen-rieng-tu`, `/chinh-sach-hoan-tien`.
- Footer site-wide link tới 4 trang trên.
- Disclaimer trong luồng Đọc sâu (`DeepResultStream.tsx`) — hiện chỉ Đọc
  nhanh (`ResultPanel.tsx`) có. Gộp về 1 component dùng chung.
- Cập nhật copy khủng hoảng (`CrisisResourceNotice.tsx`) — thêm giờ hoạt
  động Ngày Mai + gợi ý 115 (quyết định đã chốt với user).
- `beforeSend` scrub trong Sentry init (server + client) — phòng vệ thêm,
  dù audit không thấy log rò rỉ nội dung câu hỏi hiện tại.
- Dọn `console.error("[shuffle debug]"...)`/`"[personal debug]"` (vi phạm
  `code-style.md` "No console.log trong code đã commit").
- Link "Điều khoản sử dụng" thật trong checkbox ở `NapCreditsFlow.tsx`.

**Out**:
- Tích hợp kiểm duyệt cho Đọc nhanh — **không cần**: Đọc nhanh không nhận
  free-text (`ReadingRequestSchema` chỉ có `topic` enum), xác nhận qua
  audit code trực tiếp. Item "tích hợp kiểm duyệt" trong 08-timeline.md
  coi như đã xong từ Giai đoạn 4c (`src/lib/moderation.ts` +
  `shuffle/route.ts`), không cần việc mới.
- Nâng cấp rate limit lên Upstash Redis (06§2.4, "Phase 2") — Postgres đủ
  cho quy mô hiện tại.
- Xác minh hotline bằng cách gọi thật — vẫn nằm ở Giai đoạn 10 checklist,
  không lặp lại ở đây.
- Nội dung SEO/thuế/hóa đơn điện tử (06§4.3) — thuộc phạm vi khác.

## Assumptions
- Độ tuổi tối thiểu: **16 tuổi** (xác nhận với user).
- Email liên hệ: placeholder `ho-tro@ventus-tarot.vn`, đặt trong 1 hằng số
  duy nhất (`src/lib/legal-contact.ts`) kèm comment TODO — **phải thay
  trước Giai đoạn 10 Deploy**, thêm dòng vào `08-timeline.md` Giai đoạn 10
  giống pattern ảnh tạm đối thủ.
- Copy khủng hoảng dùng bản cập nhật (giờ hoạt động + gợi ý 115) từ
  `Research/xac-minh-payos-va-hotline.md` — áp dụng cho cả
  `CrisisResourceNotice.tsx` và trang `/tai-nguyen-khung-hoang` mới, để 2
  nơi không lệch copy.
- Hạn mức rate limit dùng đúng số đề xuất ở `06-bao-mat-kiem-duyet-phap-ly.md
  §2.2`: quick reading 3/ngày/IP (chưa đăng nhập) hoặc 20/giờ (đã đăng
  nhập); orders 10/giờ.
- Không thêm env var mới cho rate limit — theo đúng pattern hiện có ở
  `shuffle/route.ts` (hằng số literal tại call site).

## Checklist
- [x] Plan approved
- [x] Rate limit: `src/lib/rate-limit.ts` (helper mới) + wiring 3 route
- [x] Composed components: `ReadingDisclaimer`, `LegalPageLayout`, `Footer`
- [x] Pages / routes: 4 trang pháp lý + crisis
- [x] Content & real copy: điều khoản, quyền riêng tư, hoàn tiền, khủng hoảng
- [x] States: loading / empty / error / success — 429 dùng lại state "error"
      có sẵn ở `DeepReadingStage.tsx`; `ReadingStage.tsx` dùng lại catch
      chung của `CardSpread.tsx` (cố tình, xem implementation-plan.md "Out
      of Scope"); trang tĩnh không có state async
- [ ] Responsive: 375 / 768 / 1280 — ⏭️ skipped, không có browser/Playwright
      tool trong session này, xem Progress Log
- [ ] Both themes — ⏭️ skipped, cùng lý do trên
- [ ] Accessibility pass — ⏭️ skipped (kiểm tra bằng mắt/bàn phím thật),
      chỉ verify được cấu trúc semantic tĩnh qua HTML fetch
- [x] Gates green (lint / typecheck / build)
- [x] Sentry `beforeSend` + dọn console debug logs
- [x] Learnings extracted

## Progress Log
> `/execute` appends one line per checkpoint.

- 2026-08-27 rate limit done — `src/lib/rate-limit.ts` + `src/lib/legal-contact.ts`
  mới; wired vào `reading/route.ts` (IP/user tuỳ đăng nhập), `orders/route.ts`
  (user, 10/giờ), refactor `shuffle/route.ts` dùng chung helper + đổi key
  sang `reading-deep-shuffle:user:<id>`; xoá 2 dòng `console.error` debug ở
  `shuffle/route.ts` + `personal/route.ts`.
- 2026-08-27 composed components done — `ReadingDisclaimer` (mới, trích từ
  `ResultPanel.tsx`) dùng chung ở `ResultPanel.tsx` + `DeepResultStream.tsx`;
  `CrisisResourceNotice.tsx` copy cập nhật giờ hoạt động + 115;
  `LegalPageLayout` + `Footer` mới, `Footer` wired vào `layout.tsx`.
- 2026-08-27 pages + Sentry done — 4 trang mới (`/dieu-khoan`,
  `/chinh-sach-quyen-rieng-tu`, `/chinh-sach-hoan-tien`,
  `/tai-nguyen-khung-hoang`), link điều khoản thật trong
  `NapCreditsFlow.tsx` checkbox, `beforeSend` scrub thêm vào
  `instrumentation.ts`/`instrumentation-client.ts`. Deviation: thêm
  `"use client"` vào `CrisisResourceNotice.tsx` (thiếu, cần thiết để dùng
  từ Server Component page mới — phát hiện lúc build).
- 2026-08-27 gates: `pnpm lint` ✅, `npx tsc --noEmit` ✅, `pnpm build` ✅
  (21 route, đủ 4 route mới). Smoke test qua `node --eval` fetch (dev
  server có sẵn của phiên khác đang chạy port 3000, không tự khởi 1 server
  mới để tránh đụng độ): cả 5 trang mới trả 200, Footer chứa đủ 4 link +
  email, copy khủng hoảng có giờ hoạt động + "115". Rate limit
  `/api/reading` xác nhận thật: 3 request đầu 200, request thứ 4 trả 429
  đúng thiết kế (IP giả `203.0.113.7`, không ảnh hưởng user thật).
  **Không** verify được rate limit `/api/orders`/`shuffle` end-to-end (cần
  session đăng nhập thật + tạo đơn PayOS/gọi AI thật, tốn phí) — verify
  qua code review: cùng helper `checkRateLimit` đã chứng minh hoạt động
  đúng qua test `/api/reading` ở trên, chỉ khác key/tham số.
  **Không** verify được visual/responsive/theme/a11y bằng mắt — không có
  browser automation tool (Playwright/Chrome) trong session này. Cấu trúc
  semantic (heading order, `<nav aria-label>`, link thay vì div) đã tự
  review khi viết code, nhưng chưa xác nhận qua render thật.

## Open Questions
- Không còn — 3 quyết định pháp lý (tuổi, email, copy khủng hoảng) đã chốt
  với user trước khi viết plan này.
