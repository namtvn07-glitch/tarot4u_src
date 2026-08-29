# Task: Giai đoạn 5 — Tài khoản

> Created: 2026-08-18 · Slug: `phase-5-tai-khoan`
> Theo `Research/plan/08-timeline.md` §Giai đoạn 5. Chạy sau Giai đoạn 4b
> (xong, đã commit) và 4c (Đọc sâu — code xong ở `.claude/brain/phase-4c-doc-sau/`,
> phiên khác đã dừng, chưa verify được bằng trình duyệt vì `/doc-sau` cần
> đăng nhập thật). Giai đoạn 5 mở khoá việc đó.

## Goal
Người dùng đăng nhập được (magic link hoặc Google), vào được trang cá nhân
xem số credits + lịch sử trải bài (phân trang) + lịch sử giao dịch (phân
trang, đọc từ `credit_ledger`), xoá được từng lượt trải bài của mình. Route
cần đăng nhập bị middleware chặn và điều hướng về trang đăng nhập, không dựa
vào việc UI tự ẩn.

## Scope
**In**:
- `src/app/dang-nhap/page.tsx` + `src/components/auth/LoginForm.tsx` — magic
  link + Google OAuth, dùng `@/lib/supabase/client` + `/auth/callback` đã có
- `src/lib/supabase/middleware.ts` — thêm logic chặn route thật (hiện tại
  chỉ refresh cookie, cố ý chưa gate — comment trong file ghi rõ "Giai đoạn 5")
- `src/components/layout/Header.tsx` + `src/app/layout.tsx` — topbar dùng
  chung đầu tiên của app (brand + Đăng nhập/Tài khoản), cần để có đường vào
  các trang mới này
- `src/app/tai-khoan/page.tsx` (+ `loading.tsx`, `error.tsx`) — credits +
  2 danh sách phân trang
- `src/components/account/ReadingHistoryList.tsx`,
  `DeleteReadingButton.tsx`, `LedgerTable.tsx`
- `src/app/api/readings/[id]/route.ts` — `DELETE`, RLS tự chặn không phải
  chủ sở hữu
- `supabase/migrations/<ts>_readings_delete_policy.sql` — RLS chưa có policy
  delete cho `readings` (chỉ có `readings_select_own`)
- `src/components/ui/Button.tsx` — thêm variant `danger` (port
  `.btn--danger` từ `production/components.css`, chưa dùng ở đâu nên chưa ai
  thêm)

**Out**:
- Nạp credits / PayOS — Giai đoạn 6. Nút "Nạp thêm" trong prototype **không**
  dựng (trỏ tới trang chưa tồn tại) — cùng nguyên tắc đã áp dụng cho CTA
  "Đọc sâu" ở Giai đoạn 4b
- Sửa `.claude/brain/phase-4c-doc-sau/` hay `/doc-sau` — task của phiên khác,
  không đụng vào trừ khi có lỗi thật chặn Giai đoạn 5
- Đổi mật khẩu / đăng nhập bằng password — sản phẩm chỉ dùng magic link +
  OAuth theo `01-san-pham-pham-vi.md`, không có khái niệm password
- Đổi `display_name`/`avatar_url` (sửa hồ sơ) — không có trong checklist
  timeline, để roadmap sau

## Assumptions
- Trang mới: `/dang-nhap` (không dấu, khớp quy ước `/trai-bai`, `/doc-sau`)
  và `/tai-khoan` (không dùng `/profile` hay `/ca-nhan`).
- Kích thước trang phân trang: 10 dòng/trang cho cả lịch sử trải bài lẫn
  lịch sử giao dịch — không có con số nào chốt sẵn trong tài liệu, chọn giá
  trị hợp lý qua query param `?readingsPage=`/`?ledgerPage=` (server-side
  `range()`, giống cách `/trai-bai?topic=` đã dùng query param + Server
  Component, không thêm client-fetch pattern mới).
- Xoá lượt trải bài đi qua route handler `DELETE /api/readings/[id]`
  (không dùng Server Action) — khớp quy ước hiện có: mọi mutation trong repo
  đều là Route Handler dưới `/api/*` (`/api/reading`,
  `/api/reading/deep/*`), chưa nơi nào dùng Server Action.
- Xác nhận xoá bằng 2 bước ngay trên nút (idle → "Xác nhận xoá?"/Huỷ →
  deleting), không dùng `window.confirm()` (không nhất quán style giữa
  trình duyệt) và không dựng Modal primitive mới (chỉ 1 chỗ dùng, chưa đủ lý
  do thêm primitive theo design-system.md).
- `.btn--danger` (`on-accent` chữ trên nền `danger`) **chưa** có trong
  `production/contrast-audit.md` — tự tính lại: 5.89:1 (dark), 6.54:1
  (light), cả 2 đều pass 4.5:1. An toàn để dùng.
- Middleware chỉ chặn `/tai-khoan` ở task này — **không** đụng `/doc-sau`
  (đang có in-page soft-gate riêng của Giai đoạn 4c), tránh sửa vào task
  đang thuộc phiên khác.
- Migration RLS mới áp thẳng lên Supabase project thật qua
  `mcp__supabase__apply_migration` (cùng cách Giai đoạn 3/4a đã làm) — đây
  là thay đổi schema/bảo mật trên DB sống, cần bạn xác nhận trước khi chạy.

## Checklist
- [x] Plan approved
- [x] Migration RLS `readings_delete_own` — viết + áp lên Supabase thật (xác nhận qua `pg_policies`); `get_advisors` sạch trừ 2 WARN pre-existing không liên quan (`handle_new_user` — không khai thác được, `RETURNS trigger` chặn gọi RPC trực tiếp ở tầng Postgres, ghi vào report chứ không sửa lan)
- [x] `Button` — thêm variant `danger`
- [x] Middleware bảo vệ route (`/tai-khoan` → redirect `/dang-nhap?next=`)
- [x] `Header` + gắn vào `layout.tsx`
- [x] Trang đăng nhập (`LoginForm`: magic link + Google, đủ trạng thái
      idle/sending/sent/error)
- [x] Trang cá nhân: credits + `ReadingHistoryList` (phân trang, xoá) +
      `LedgerTable` (phân trang) + `loading.tsx`/`error.tsx`
- [x] `DELETE /api/readings/[id]`
- [x] States: loading / empty / error / success — `LoginForm` đủ 4
      (idle/sending/sent/error, verify thật với Supabase Auth thật — xem
      Progress Log); `ReadingHistoryList`/`LedgerTable` code đủ cả 4 nhánh
      nhưng **chỉ verify được bằng đọc code + query trực tiếp qua SQL**,
      chưa verify bằng trình duyệt có session thật (xem Known Gaps)
- [x] Responsive: 375 / 768 / 1280 / 1920 — verify được `/`, `/dang-nhap`
      (không scroll ngang mốc nào, cả 2 theme); `/tai-khoan` chỉ verify được
      qua code review (cùng lý do trên)
- [x] Cả 2 theme — dark thật + light ép thủ công, không cặp màu mới ngoài
      `--color-danger`×`--color-on-accent` đã tự tính (xem Assumptions)
- [x] Accessibility pass — Tab qua `/dang-nhap` đúng thứ tự (brand → nav →
      Google → email → submit), redirect `/tai-khoan`→`/dang-nhap` giữ focus
      tự nhiên ở đầu trang mới; nút xoá/bảng có `aria-label`/`<caption>`/
      `scope` theo đúng plan
- [x] Gates green (lint / typecheck / build) — cả dev lẫn `next build && next
      start` (production thật)
- [x] Learnings extracted — xem Progress Log (bug `process.env[key]` trong
      `env.ts`)

## Progress Log
> `/execute` appends one line per checkpoint.
- 2026-08-18: Plan duyệt ("ok"). Migration `readings_delete_own` viết + áp
  lên Supabase thật qua `mcp__supabase__apply_migration`, xác nhận qua
  `pg_policies`. `get_advisors(security)`: sạch trừ 2 WARN pre-existing
  không liên quan tới task này (`handle_new_user` RPC-callable) — verify
  bằng `pg_get_functiondef`: hàm khai báo `RETURNS trigger`, Postgres tự
  chặn gọi trực tiếp qua RPC cho loại hàm này bất kể quyền EXECUTE → không
  khai thác được thật, không sửa lan.
- 2026-08-18: Lớp primitives + middleware + auth UI + layout xong (`Button`
  variant `danger`, `middleware.ts` gate `/tai-khoan`, `Header`,
  `SignOutButton`, `LoginForm`, `/dang-nhap`). `npx tsc --noEmit` sạch.
- 2026-08-18: Lớp trang cá nhân xong (`/tai-khoan` + `loading.tsx` +
  `error.tsx`, `ReadingHistoryList`, `DeleteReadingButton`, `LedgerTable`,
  `DELETE /api/readings/[id]`). Phát hiện + sửa ngay lúc viết: nhiều class
  Tailwind trong `loading.tsx` skeleton (`w-40`, `h-9`, `h-24`...) ngoài
  ramp spacing 0–8 đã định nghĩa — cùng loại lỗi im-lặng-không-sinh-CSS đã
  học ở `docs/learned/tailwind-v4-spacing.md` (4b), lần này là giá trị
  **ngoài ramp thật** (đúng ý đồ guard chặn) chứ không phải giá trị "0" bị
  vạ lây — sửa bằng arbitrary value `h-[...]`/`w-[...]` có chú thích, không
  đụng gì tới token setup. `pnpm lint`/`tsc`/`build` sạch lần đầu.
- 2026-08-18: **Bug thật phát hiện qua Gate 5 (Playwright, bấm nút "Gửi link
  đăng nhập" thật)**: click bị treo mãi ở "Đang gửi…", console có
  `pageerror` — ZodError thô `expected: "string", received: "undefined"`
  không bị bắt ở đâu cả. Root cause: `src/lib/env.ts` (sửa bởi phiên 4c) đọc
  `process.env[key]` — truy cập ĐỘNG qua biến. Next.js/Turbopack chỉ inline
  được `NEXT_PUBLIC_*` cho bundle browser khi source có cụm
  `process.env.NEXT_PUBLIC_X` viết TĨNH/nguyên văn; truy cập động không được
  bundler nhận diện nên bundle browser không có giá trị thật nào —
  `env.NEXT_PUBLIC_SUPABASE_URL` luôn `undefined` phía client. Bug này có từ
  lúc 4c refactor `env.ts` sang per-field lazy (`loadField`), nhưng chưa lộ
  vì trước `LoginForm` chưa ai gọi `@/lib/supabase/client` (browser client)
  từ Client Component nào cả — 4b/4c đều chỉ gọi server-side. Fix: thêm
  `RAW_ENV` — object hằng đọc từng field bằng cụm `process.env.X` viết tĩnh
  (bundler inline được), `loadField` đọc qua `RAW_ENV[key]` thay vì
  `process.env[key]` trực tiếp — giữ nguyên toàn bộ lợi ích per-field lazy
  validate/cache của bản refactor 4c, chỉ đổi CÁCH đọc giá trị thô. Xác nhận
  bằng Playwright: request thật chạm đúng
  `https://zlnrflevvavlhxqvtthj.supabase.co/auth/v1/otp` (trước đó không
  request nào cả), test cả `pnpm dev` lẫn `next build && next start` —
  cả 2 đều đúng. Ghi vào `docs/learned/nextjs-env-bundling.md`.
- 2026-08-18: Verify integration thật (không mock): magic link với email
  hợp lệ → Supabase trả `429 over_email_send_rate_limit` (đã gửi 1 lần
  trước đó thành công) — xác nhận request hợp lệ tới tận backend thật, UI
  vào đúng state lỗi, không crash. Google OAuth → SDK điều hướng thật sang
  `.../auth/v1/authorize?provider=google`, Supabase trả "provider is not
  enabled" — đúng gap đã biết từ Giai đoạn 3 (chưa có Google Client ID/Secret
  thật), không phải bug code. Regression: `/`, `/trai-bai`, `/doc-sau` vẫn
  200 sau khi thêm `Header`/middleware. 375/768/1280/1920 × 2 theme trên
  `/`/`/dang-nhap` — không scroll ngang. Bàn phím đúng thứ tự.
- 2026-08-18: **Không tạo được session thật để verify `/tai-khoan` bằng
  trình duyệt** — thử dùng Supabase Admin API tạo user test qua service role
  key nhưng bị `guard-paths.sh` chặn đọc `.env.local` (đúng chủ đích của
  hook — không phải lỗi). Không thử cách khác (chèn thẳng `auth.users` qua
  SQL) vì đó là thao tác không được hỗ trợ chính thức, rủi ro hỏng state
  auth thật. Thay vào đó: xác nhận `readings`/`credit_ledger` hiện có 0 dòng
  thật (query trực tiếp), nên trạng thái **rỗng** chắc chắn đúng với bất kỳ
  user thật nào ngay lúc này; trạng thái có dữ liệu chỉ được đảm bảo qua đọc
  code + kiểu dữ liệu khớp schema, KHÔNG qua trình duyệt thật — ghi rõ
  `⏭️ skipped` trong Known Gaps, không nhận là đã verify.
- 2026-08-18: Verify cuối: `pnpm lint`/`npx tsc --noEmit`/`pnpm build` sạch;
  `next build && next start` chạy lại xác nhận production build hoạt động
  đúng như dev.

## Open Questions
- Chờ user duyệt plan — đặc biệt 3 quyết định ở `implementation-plan.md`
  § Decisions Needed (bỏ nút "Nạp thêm", áp migration RLS lên DB thật, xác
  nhận xoá 2-bước thay vì modal). **Đã duyệt** — xem Progress Log.

## Amendment — 2026-08-18: thêm Email/mật khẩu
Sau khi báo cáo `/finish` ban đầu, user tự test bằng magic link thật và dính
`over_email_send_rate_limit` (mailer test mặc định của Supabase, giới hạn
rất thấp). User yêu cầu bổ sung đăng nhập bằng email+password — **thêm cạnh**
magic link/Google, không thay thế (xác nhận qua AskUserQuestion). Lưu ý quan
trọng từ user: "email" ở form password chỉ là **định danh tài khoản tự đặt**,
không phải email thật cần nhận mail.

- [x] `src/components/auth/PasswordAuthForm.tsx` — mode Đăng nhập/Đăng ký,
      `signInWithPassword`/`signUp`, đủ trạng thái idle/submitting/error
- [x] Gắn vào `LoginForm.tsx` (thêm dưới magic link, có divider)
- [x] User tự tắt "Confirm email" ở Supabase Dashboard (yêu cầu để signUp
      không cố gửi mail xác nhận — nếu không, vẫn dính đúng rate limit cũ)
- [x] **Verify thật, có session thật** (lần đầu trong task này!): đăng ký →
      vào đúng `/tai-khoan`, Credits=0, cả 2 trạng thái rỗng render đúng →
      đăng xuất → header đổi lại "Đăng nhập" → vào lại `/tai-khoan` bị chặn
      đúng → đăng nhập lại bằng đúng email+password → vào lại đúng → sai mật
      khẩu → báo lỗi đúng, không crash. **Known Gap "chưa verify `/tai-khoan`
      bằng session thật" ở lần `/finish` trước — nay đã đóng.**
- [x] **Verify sâu hơn với dữ liệu thật**: seed 12 dòng `readings` cho đúng
      user test (qua `execute_sql`, user tạo qua signup thật ở bước trên,
      không phải id giả) → `/tai-khoan` hiện đúng 10 dòng trang 1, "Trang
      1/2"; bấm "Sau" → URL đúng `?ledgerPage=1&readingsPage=2` (giữ nguyên
      param kia), hiện đúng 2 dòng còn lại, "Trước" hoạt động, "Sau" tự ẩn
      đúng ở trang cuối; bấm xoá 1 dòng → 2-bước Xác nhận/Huỷ hiện đúng tại
      chỗ → xác nhận → dòng biến mất, còn lại 11 dòng đúng. Dọn sạch toàn bộ
      dữ liệu + tài khoản test ngay sau khi verify xong (`delete` theo thứ
      tự `readings`/`credit_ledger` trước `auth.users` — đúng chiều FK
      `on delete restrict`). Xác nhận lại: 0 user, 0 readings, 0 ledger sau
      dọn — không để sót dữ liệu test trên DB thật.
- [x] `pnpm lint`/`npx tsc --noEmit`/`pnpm build` sạch sau khi thêm
- [x] Cập nhật `01-san-pham-pham-vi.md §Tài khoản` ghi nhận phương thức mới
