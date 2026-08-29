# Walkthrough: Giai đoạn 6 — Thanh toán

> Completed: 2026-08-19 (partially verified — 1 hạng mục hoãn theo quyết định
> user, xem Known Gaps) · Task: `phase-6-thanh-toan`

## What Was Built
Luồng nạp credits qua PayOS: chọn 1 trong 3 gói (`PackagePicker`), tạo đơn
qua SDK `@payos/node` thật, render QR + đếm ngược + Realtime/polling
(`QrPanel`), webhook verify chữ ký + gọi Postgres function `credit_order`
atomic/idempotent, cron dọn đơn hết hạn. Toàn bộ code + DB đã lên production
Supabase thật và đã verify tạo đơn thật thành công (QR/`checkoutUrl` từ
PayOS thật). **Còn 1 việc**: chưa test webhook thật đầu-cuối (cần giao dịch
tiền thật + ngrok + cấu hình PayOS Dashboard) — user chủ động chọn hoãn tới
khi tính năng hoàn thiện hơn, không phải bị chặn kỹ thuật.

## Changes
| File | Action | What |
|------|--------|------|
| `src/lib/env.ts` | MODIFY | +4 field PayOS/`CRON_SECRET` (fieldSchemas + RAW_ENV literal access, đúng pattern GĐ5) |
| `package.json`, `pnpm-lock.yaml` | MODIFY | +`@payos/node`, `qrcode`, `@types/qrcode` |
| `src/lib/payos.ts` | NEW | Lazy `getPayOS()` client, cùng pattern `getSupabaseAdmin()` |
| `src/lib/orders.ts` | NEW | `PACKS` (giá server-side only), `CreateOrderRequestSchema` |
| `src/app/api/orders/route.ts` | NEW | Tạo đơn, gọi PayOS, rollback `orders` row nếu PayOS lỗi |
| `src/app/api/webhooks/payos/route.ts` | NEW | Verify chữ ký raw body → RPC `credit_order`, luôn 200 trừ lỗi hạ tầng |
| `src/app/api/cron/expire-orders/route.ts`, `vercel.json` | NEW | Dọn đơn `pending` quá hạn, bảo vệ bằng `CRON_SECRET`, lịch mỗi 10 phút |
| `src/lib/supabase/middleware.ts` | MODIFY | `/nap-credits` vào `PROTECTED_PREFIXES` |
| `src/components/payment/PackagePicker.tsx` | NEW | 3 card gói, `role="group"`, nút disabled tới khi tick điều khoản |
| `src/components/payment/QrPanel.tsx` | NEW | QR (lib `qrcode`) + progress-ring đếm ngược + Realtime + polling 5s fallback |
| `src/components/payment/NapCreditsFlow.tsx` | NEW | Orchestrator: checkbox điều khoản + state machine idle/creating/active/paid/error |
| `src/app/nap-credits/page.tsx` | NEW | Trang chọn gói |
| `src/app/nap-credits/ket-qua/page.tsx` | NEW | Fallback đọc lại trạng thái đơn nếu user rời QR trong trang |
| `Research/plan/05-thanh-toan-credits.md` | MODIFY | Sửa 3 chỗ snippet SDK cũ (`createPaymentLink`/`verifyPaymentWebhookData` → API thật đã verify) |
| `docs/learned/react-compiler-hooks.md` | NEW | `react-hooks/purity`/`react-hooks/refs` — bug mới gặp lần đầu |
| `.claude/rules/project.md` | MODIFY | 2 dòng Learned Patterns mới (React Compiler rule, permission classifier chặn DDL tiền thật) |
| DB migration `orders_realtime_publication` | Áp thành công | Bật Realtime cho bảng `orders` |
| DB migration `credit_order_amount_check` | Áp thành công (user chạy tay qua Dashboard) | Hàm mới `credit_order(bigint, int)` |
| DB migration `credit_order_revoke_public` | Áp thành công | Vá lỗ hổng `PUBLIC` vẫn có `EXECUTE` sau khi user chạy tay (xem Known Gaps) |
| `docs/learned/supabase.md` | MODIFY | +1 mục: migration dán tay có thể bỏ sót câu lệnh cuối |
| `Research/plan/05-thanh-toan-credits.md` | MODIFY (lần 2) | +1 ghi chú: PayOS không có sandbox, xác nhận qua tài liệu chính thức |

## Deviations From the Plan
| Planned | Actual | Why |
|---------|--------|-----|
| Checkbox điều khoản ở `nap-credits/page.tsx` (Server Component) | Chuyển vào `NapCreditsFlow.tsx` (Client Component) | Checkbox cần state tương tác để gate nút "Chọn" cùng component — Server Component không giữ được state chia sẻ với client component anh em |
| Không có trong plan | Sửa 2 lỗi `react-hooks/purity`/`react-hooks/refs` trong `QrPanel` | Rule mới của React Compiler (eslint-config-next) — `useRef(Date.now()-...)` và đọc `ref.current` lúc render đều bị gate lint chặn dù chạy đúng |

## Verification
| Gate | Result |
|------|--------|
| lint | ✅ |
| typecheck | ✅ |
| test | n/a |
| build | ✅ |
| visual (375/768/1280/1920) | ✅ trạng thái idle + error, cả 2 theme |
| a11y (keyboard + contrast) | ✅ (một phần — xem Not checked) |

**Manually checked**: đăng ký tài khoản test THẬT qua UI signup (không đụng
`.env`), tick checkbox → nút "Chọn" bật đúng, bấm "Chọn" → `POST /api/orders`
tạo `orders` row → gọi PayOS thật thất bại (thiếu env) → route rollback đúng
(xoá lại row, xác nhận `count(*) = 0` sau khi xoá tài khoản test) → UI hiện
đúng error state + nút "Thử lại". Bàn phím: nút "Chọn" disabled bị Tab bỏ qua
đúng lúc chưa tick, enabled + đúng thứ tự sau khi tick; `:focus-visible`
outline rõ. Responsive 375/768/1280/1920 + cả 2 theme (dark mặc định qua
`data-theme`, light qua set attribute tay — chưa có toggle UI, biết trước từ
GĐ trước). Trang `/nap-credits/ket-qua` không có `orderId` → đúng trạng thái
"Không tìm thấy đơn hàng này". Dọn sạch 5 tài khoản test tạo trong lúc verify
(`auth.users` xoá theo email pattern, xác nhận lại `count(*) = 0`).
**Not checked**: toàn bộ 9 case ở Verification Plan của
`implementation-plan.md` cần webhook thật (đặc biệt case gửi lại 3 lần →
chỉ cộng 1 lần) — xem Known Gaps. Đối soát `profiles.credits` vs
`sum(ledger.delta)` — chưa có giao dịch thật nào để đối soát.

**Thêm sau lúc viết walkthrough lần đầu (2026-08-19)**: tạo đơn thật qua
session Playwright (tài khoản test, xoá sạch sau) xác nhận `PAYOS_CLIENT_ID`/
`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` hoạt động đúng — `POST /api/orders` trả
`qrCode`/`checkoutUrl` PayOS thật, `QrPanel` render QR quét được + đếm ngược
đúng từ `expiresAt` server. Trạng thái `paid` vẫn chưa test được (cần webhook
thật, xem Known Gaps).

## Known Gaps
- **Webhook chưa test đầu-cuối qua PayOS thật — hoãn theo quyết định user
  (2026-08-19), không phải bị chặn.** Mọi thứ đã sẵn sàng phía code/hạ tầng:
  DB có hàm đúng, `.env.local` có PAYOS_* thật, tạo đơn thật đã verify chạy
  đúng, `ngrok` đã cài (`brew install ngrok`). Còn thiếu: user tự đăng ký tài
  khoản ngrok.com (cần email/tài khoản của user, không tự làm được) + đăng
  ký webhook URL trên PayOS Dashboard + **PayOS không có sandbox** (xác nhận
  qua `payos.vn/docs/moi-truong-test`) nên bước cuối bắt buộc là 1 giao dịch
  thật, dù chỉ 49.000đ (gói Nhỏ). User chủ động chọn để dành tới khi tính
  năng hoàn thiện hơn. Cho tới lúc đó: **thanh toán thật trên production sẽ
  KHÔNG cộng được credits nếu chưa cấu hình webhook** — đừng để user thật
  mua trước khi làm xong bước này.
- Rate limit `/api/orders` — cố ý ngoài phạm vi (Giai đoạn 7 theo timeline).
- Trang Điều khoản đầy đủ — cố ý ngoài phạm vi, checkbox dùng nội dung thật
  inline thay vì link tới trang chưa tồn tại.

## Learnings Recorded
- `docs/learned/react-compiler-hooks.md`: rule mới `react-hooks/purity` +
  `react-hooks/refs` của React Compiler — cách nhận diện + fix
  (`useState(() => ...)` lazy initializer thay vì `useRef(...)`)
- `docs/learned/supabase.md`: migration dán tay qua Dashboard có thể âm thầm
  bỏ sót câu lệnh cuối khối ("Success" không chứng minh cả khối đã chạy) —
  luôn verify `information_schema.routine_privileges` sau khi user tự chạy
  migration đụng tới function xử lý tiền
- `.claude/rules/project.md`: 3 dòng — pointer tới 2 doc trên, và nguyên tắc
  xử lý khi `apply_migration` bị permission classifier chặn (báo 1 lần,
  không thử lại nhiều lần, đề xuất 2 lối ra thật cho user)
