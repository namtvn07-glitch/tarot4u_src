# Task: Giai đoạn 6 — Thanh toán

> Created: 2026-08-18 · Slug: `phase-6-thanh-toan`
> Theo `Research/plan/08-timeline.md` §Giai đoạn 6 + chi tiết đầy đủ ở
> `Research/plan/05-thanh-toan-credits.md` ("phần duy nhất một bug làm mất
> tiền thật"). Chạy sau Giai đoạn 5 (Tài khoản, xong) — cần `/tai-khoan` và
> auth thật để gắn credits vào đúng user.

## Goal
User đăng nhập, chọn 1 trong 3 gói credits, quét QR PayOS thật, thấy trạng
thái cập nhật realtime khi thanh toán xong, credits được cộng đúng — atomic,
idempotent kể cả khi PayOS gọi lại webhook nhiều lần. Trừ credits khi Đọc sâu
đã có sẵn từ 4c (`debit_reading`/`refund_reading`) — task này chỉ cần xác
nhận, không viết lại.

## Scope
**In**:
- `src/lib/payos.ts` — client PayOS (`@payos/node`), lazy giống `getSupabaseAdmin()`
- `src/lib/orders.ts` — `PACKS` (3 gói, hằng số server-side), zod schema
- `src/app/api/orders/route.ts` — POST tạo đơn + gọi PayOS `paymentRequests.create`
- `src/app/api/webhooks/payos/route.ts` — verify chữ ký → `credit_order` mới
- `src/app/api/cron/expire-orders/route.ts` — GET, bảo vệ bằng `CRON_SECRET`
- `vercel.json` — cấu hình cron (chưa deploy, nhưng config nằm sẵn trong repo)
- `src/app/nap-credits/page.tsx` — chọn gói + `QrPanel` (5 trạng thái, realtime + polling fallback)
- `src/app/nap-credits/ket-qua/page.tsx` — fallback nếu user đi qua `checkoutUrl` của PayOS thay vì ở lại QR trong trang
- `src/components/payment/PackagePicker.tsx`, `QrPanel.tsx`
- Migration: thay `credit_order(uuid)` bằng `credit_order(bigint, int)` — thêm
  kiểm tra số tiền khớp (chưa có ở bản hiện tại), dùng `for update` tường
  minh, trả text status thay vì void
- Migration: `alter publication supabase_realtime add table orders` — hiện
  publication rỗng, chưa bảng nào bật realtime
- `src/lib/env.ts` — thêm `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY`/`CRON_SECRET`
- `package.json` — thêm `@payos/node` (SDK chính thức), `qrcode` (render chuỗi
  `qrCode` PayOS trả về — text VietQR, không phải ảnh — thành mã quét được)
- `src/lib/supabase/middleware.ts` — thêm `/nap-credits` vào `PROTECTED_PREFIXES`

**Out**:
- Rate limit `/api/orders` — Giai đoạn 7 theo timeline, không phải thiếu sót
- Trang Điều khoản sử dụng đầy đủ — Giai đoạn 7 sở hữu; checkbox ở `/nap-credits`
  dùng nội dung thật đã có sẵn ở `05-thanh-toan-credits.md §8` (bảng chính
  sách hoàn tiền), không link tới trang chưa tồn tại
- Sửa `debit_reading`/`refund_reading` — đã đúng từ 4c, chỉ verify lại
- UI đối soát `profiles.credits` vs `sum(ledger.delta)` — chỉ verify query
  ở `04-database-schema.md §2.5` chạy đúng qua `execute_sql`, không dựng
  admin UI mới (không ai yêu cầu)

## Assumptions
- **Giá 3 gói dùng tạm 49k/129k/359k (10/30/100 credits)** — user xác nhận
  qua AskUserQuestion, đúng số đã có sẵn trong `05-thanh-toan-credits.md §2`
  + `production/prototype/topup.html`. Đổi số sau chỉ cần sửa 1 hằng số
  `PACKS` trong `src/lib/orders.ts`.
- SDK method thật khác snippet minh hoạ trong `05-thanh-toan-credits.md`
  (viết trước khi verify SDK thật) — đã xác minh qua npm/GitHub
  `payOSHQ/payos-lib-node` (v2, cần Node ≥20, máy đang chạy Node 25 — đủ):
  `new PayOS({clientId, apiKey, checksumKey})`,
  `payos.paymentRequests.create(data)` (không phải `createPaymentLink`),
  `payos.webhooks.verify(rawBody)` (không phải `verifyPaymentWebhookData`).
  Response `paymentRequests.create` có field `qrCode` (chuỗi text VietQR,
  cần render) + `checkoutUrl` (link hosted page PayOS, dùng làm fallback).
  Sẽ sửa lại snippet trong `05-thanh-toan-credits.md` cho khớp SDK thật.
- Render QR: thêm dependency `qrcode` — `qrCode` PayOS trả về là text thô
  theo chuẩn VietQR, không phải ảnh; cần thư viện sinh mã QR quét được từ
  text đó. Không có cách nào khác để hiện QR trong trang mà không cần lib.
- `credit_order` đổi chữ ký `(uuid)` → `(bigint, int)` — nhận thẳng
  `orderCode`/`amount` từ webhook payload thay vì phải tự tra `orders.id`
  trước; thêm bước so khớp `amount_vnd` (spec §3.4 gọi đây là lớp chống sửa
  số tiền, bản hiện tại từ Giai đoạn 3 chưa có). Migration `drop function`
  cũ + tạo mới + revoke lại `anon`/`authenticated` (đúng pattern
  `20260816000001_security_hardening.sql`).
- `/nap-credits` đưa vào `PROTECTED_PREFIXES` — mua credits bắt buộc phải có
  tài khoản để gắn đúng user, không có luồng khách vãng lai.
- QR trong trang là luồng chính (Giai đoạn 2 đã thiết kế chi tiết ở
  `production/prototype/topup.html`, 5 trạng thái + đồng hồ đếm ngược SVG);
  `checkoutUrl` của PayOS chỉ dùng làm `returnUrl`/`cancelUrl` bắt buộc phải
  truyền theo SDK — không chủ động điều hướng user sang đó.
- Không test được webhook thật trên localhost (PayOS cần URL public) — dùng
  `ngrok` cho dev. User đã có tài khoản PayOS thật nên **có thể** test được
  toàn bộ luồng thật lần này, khác với giới hạn gặp phải ở 4c
  (`ANTHROPIC_API_KEY`).

## Checklist
- [x] Plan approved
- [x] Migration `credit_order(bigint, int)` — user tự chạy thủ công qua
      Supabase Dashboard (2 lần `apply_migration` đều bị classifier chặn).
      Phát hiện + vá thêm 1 lỗ hổng: `revoke ... from public` cuối khối SQL
      không chạy khi paste thủ công → `PUBLIC` vẫn gọi được hàm cộng tiền.
      Vá bằng 1 migration riêng (`credit_order_revoke_public`, qua được
      classifier), xác nhận lại bằng `information_schema.routine_privileges`
      — giờ chỉ `postgres`/`service_role`.
- [x] Migration `alter publication supabase_realtime add table orders`
- [x] `env.ts` + `package.json` (`@payos/node`, `qrcode`, `@types/qrcode`)
- [x] `src/lib/payos.ts`, `src/lib/orders.ts`
- [x] `POST /api/orders`
- [x] `POST /api/webhooks/payos`
- [x] `GET /api/cron/expire-orders` + `vercel.json`
- [x] Middleware: `/nap-credits` vào `PROTECTED_PREFIXES`
- [x] `PackagePicker`, `QrPanel` (4 trạng thái nội bộ + realtime + polling 5s fallback)
- [x] `/nap-credits/page.tsx`, `/nap-credits/ket-qua/page.tsx`
- [ ] **TODO (hoãn theo quyết định user 2026-08-19)**: Test webhook thật qua
      ngrok. `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` đã có
      trong `.env.local` và đã verify tạo đơn thật thành công (QR render
      đúng, `checkoutUrl` PayOS thật) — chỉ còn thiếu bước cuối. `ngrok` đã
      cài (`brew install ngrok`, v3.39.11) nhưng cần user tự đăng ký tài
      khoản ngrok.com + `ngrok config add-authtoken` (không tự làm được, cần
      email/tài khoản của user). User chủ động chọn hoãn tới khi tính năng
      hoàn thiện hơn, không phải bị chặn. **PayOS không có sandbox** (xác
      nhận qua `payos.vn/docs/moi-truong-test`) — bước này bắt buộc là giao
      dịch thật, dù chỉ 49.000đ (gói Nhỏ). Khi quay lại: xem lại 3 bước còn
      lại trong tin nhắn trước (ngrok → đăng ký webhook URL trên PayOS
      Dashboard → quét QR thật + gọi lại webhook 3 lần kiểm tra idempotent).
- [x] States: idle, error, waiting — cả 3 verify bằng session thật (đăng ký
      thật, tick checkbox, chọn gói → 2026-08-18 lỗi PayOS thiếu env → đúng
      error UI + rollback sạch; 2026-08-19 sau khi có PAYOS_* thật → tạo đơn
      thật thành công, QR quét được render đúng, đếm ngược đúng từ
      `expiresAt`). ⏭️ `paid` — chưa verify được, cần webhook thật (hoãn theo
      quyết định user, xem Checklist mục ngrok).
- [x] Responsive: 375 / 768 / 1280 / 1920 — cả idle + error, xem screenshot
      trong scratchpad session
- [x] Cả 2 theme (dark mặc định + light qua `data-theme`)
- [x] Accessibility pass: nút "Chọn" disabled đúng bị Tab bỏ qua khi chưa tick
      checkbox, enabled + đúng thứ tự khi đã tick; focus-visible outline hiện
      rõ. ⏭️ live region/progress-ring lúc paid — chưa verify được (cần QR
      thật).
- [x] Gates green (lint / typecheck / build) — 2 lỗi `react-hooks/purity` +
      `react-hooks/refs` phát hiện + sửa lúc viết QrPanel, xem Progress Log
- [ ] Đối soát: chạy query `04-database-schema.md §2.5`, xác nhận 0 dòng lệch
      — chờ có giao dịch thật đầu tiên (gắn liền với TODO ngrok/webhook)
- [x] Cập nhật `05-thanh-toan-credits.md` cho khớp SDK thật (§2, §3.3, §3.4,
      §3.5 — PayOS không có sandbox)
- [x] Learnings extracted — xem walkthrough.md

## Progress Log
> `/execute` appends one line per checkpoint.
- 2026-08-18: Áp migration `orders_realtime_publication` thành công. Migration
  `credit_order_amount_check` (drop + tạo lại hàm xử lý tiền thật) bị auto-mode
  permission classifier chặn tự động — cần user tự duyệt hành động này riêng
  (không phải chặn do lỗi SQL). Verify: `credit_order(uuid)` cũ vẫn còn nguyên,
  không có state dở dang.
- 2026-08-18: Viết xong toàn bộ code layer (env, lib, 3 API routes, middleware,
  3 UI components, 2 pages, vercel.json). Gate lint/typecheck/build đều xanh.
  2 lỗi lint đáng chú ý đã sửa trong lúc viết: `react-hooks/purity` (gọi
  `Date.now()` trực tiếp trong thân render qua `useRef(...)` initializer — phải
  chuyển sang `useState(() => ...)` lazy initializer) và `react-hooks/refs`
  (đọc `ref.current` trong lúc render bị chặn — chuyển tổng thời lượng đếm
  ngược từ ref sang state). Đây là rule mới của React Compiler, chưa gặp ở các
  giai đoạn trước — ghi vào Learnings nếu tái diễn.
- 2026-08-18: Lệch nhỏ so với plan — checkbox điều khoản chuyển từ
  `nap-credits/page.tsx` (Server Component) vào bên trong `NapCreditsFlow.tsx`
  (Client Component), vì checkbox cần state tương tác để gate nút "Chọn" ở
  cùng component, mà Server Component không giữ được state chia sẻ với client
  component anh em.
- 2026-08-19: User tự chạy migration `credit_order(bigint, int)` thủ công qua
  Supabase Dashboard SQL Editor (báo "Success. No rows returned" — đúng, DDL
  không trả row). Verify lại bằng `information_schema`: hàm mới tồn tại đúng
  chữ ký, nhưng phát hiện `PUBLIC` vẫn có quyền `EXECUTE` — dòng `revoke`
  cuối khối SQL không chạy khi paste thủ công (lỗ hổng: ai cũng gọi được RPC
  cộng credits). Vá bằng migration riêng chỉ có 2 dòng revoke/grant — qua
  được permission classifier (khác DDL tạo/xoá function, rủi ro thấp hơn).
  Xác nhận lại: `PUBLIC` đã hết quyền, chỉ còn `postgres`/`service_role`.
  Ghi learning vào `docs/learned/supabase.md` + `project.md`.
- 2026-08-19: Xác nhận `.env.local` đã có đủ PAYOS_* thật — tạo đơn test thật
  qua session Playwright (tài khoản test, xoá sạch sau khi verify): QR render
  đúng, `checkoutUrl`/`qrCode` từ PayOS thật, đếm ngược đúng. Cài `ngrok` qua
  Homebrew cho user. Xác nhận qua tài liệu chính thức PayOS
  (`payos.vn/docs/moi-truong-test`): **không có sandbox**, mọi test webhook
  bắt buộc là giao dịch thật — cập nhật `05-thanh-toan-credits.md §3.5`. User
  quyết định hoãn bước test webhook thật (cần đăng ký tài khoản ngrok.com +
  cấu hình webhook trên PayOS Dashboard, cả 2 đều cần hành động trực tiếp từ
  user) tới khi tính năng hoàn thiện hơn — không phải bị chặn, là lựa chọn
  chủ động. Đóng task ở trạng thái "partially verified" theo `/finish`.

## Open Questions
- ~~Chờ user tự chạy migration `credit_order(bigint, int)`~~ — xong
  2026-08-19, xem Progress Log.
- ~~Chờ user thêm PAYOS_* vào `.env.local`~~ — xong, verify thành công.
- Test webhook thật qua ngrok — **hoãn theo quyết định user 2026-08-19**,
  không phải bị chặn. Xem TODO trong Checklist.
