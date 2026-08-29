# Giai đoạn 6 — Thanh toán

Chọn gói credits → tạo đơn PayOS → QR trong trang + realtime → webhook cộng
credits atomic/idempotent → cron dọn đơn hết hạn. Đây là phần duy nhất trong
dự án mà một bug làm mất tiền thật (`05-thanh-toan-credits.md` §0) — ưu tiên
đúng-chậm hơn nhanh-có-thể-sai.

## Decisions Needed From You
> [!IMPORTANT]
> - **Giá 3 gói dùng tạm 49k/129k/359k (10/30/100 credits)** — đã chốt qua
>   AskUserQuestion trước đó, ghi lại đây để bạn xác nhận lần cuối trước khi
>   có giao dịch thật đầu tiên. Đổi được bất cứ lúc nào sau — chỉ 1 hằng số.
> - **Migration thay `credit_order(uuid)` bằng `credit_order(bigint, int)`
>   trên Supabase thật** — bản cũ (từ Giai đoạn 3) thiếu bước so khớp số
>   tiền mà `05-thanh-toan-credits.md §3.4` gọi là bắt buộc ("chống sửa số
>   tiền"). Không có gì gọi hàm cũ ở nơi khác (verify bằng grep trước khi
>   xoá) nên an toàn để thay, nhưng đây là thay đổi trên hàm xử lý tiền thật.
> - **Cần bạn chạy `ngrok http 3000` (hoặc tương đương) để test webhook
>   thật** — localhost không nhận được webhook từ PayOS. Tôi sẽ cần
>   `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` nằm trong
>   `.env.local` (bạn tự thêm, tôi không đọc/ghi file đó) và URL ngrok để
>   cấu hình webhook endpoint trên PayOS Dashboard.

## Approach
`POST /api/orders` tạo `orders` row (status=pending) rồi gọi
`payos.paymentRequests.create()` lấy `qrCode` (text VietQR) + `checkoutUrl` +
`expiresAt`; client render QR bằng lib `qrcode` ngay trong trang, subscribe
Realtime trên `orders:id=eq.<id>` (RLS `orders_select_own` đã cho phép), kèm
polling 5s làm lưới an toàn. `POST /api/webhooks/payos` verify chữ ký bằng
`payos.webhooks.verify()` trước tiên, luôn trả 200 trừ lỗi hạ tầng thật, gọi
Postgres function `credit_order(orderCode, amount)` — atomic (`for update`),
idempotent (check status + unique index `credit_ledger_idem` là lưới cuối),
so khớp số tiền. Cron `GET /api/cron/expire-orders` (bảo vệ bằng
`CRON_SECRET`, cấu hình lịch chạy trong `vercel.json`) dọn đơn pending quá
hạn.

**Considered and rejected**
- *Điều hướng user sang `checkoutUrl` hosted page của PayOS thay vì render
  QR trong trang* — đơn giản hơn, không cần thêm dependency `qrcode`. Loại
  vì Giai đoạn 2 đã thiết kế chi tiết 5 trạng thái QR trong trang
  (`production/prototype/topup.html`) và mất luồng realtime mượt nếu rời
  trang.
- *Giữ nguyên `credit_order(uuid)`, tra `orders.id` từ `payos_order_code`
  trong route webhook trước khi gọi* — vẫn đúng, nhưng đẩy bước so khớp số
  tiền ra khỏi transaction (route đọc `amount_vnd` rồi mới gọi function) →
  có khoảng hở giữa đọc và ghi dù nhỏ. Đặt so khớp NGAY TRONG function (cùng
  transaction với `for update`) chặt hơn.
- *Dùng `next/server` `after()` để cộng credits sau khi trả response webhook*
  — 4c đã tự đánh giá pattern `after()` trong `ReadableStream` chưa đủ tài
  liệu xác nhận (xem `phase-4c-doc-sau/task.md`). Ở đây còn rủi ro hơn: nếu
  `after()` fail âm thầm, PayOS đã nhận 200 nên **không retry**, credits
  không bao giờ được cộng mà không ai biết. Giữ đồng bộ: cộng credits xong
  mới trả response.

## Proposed Changes

### Database
#### [MODIFY] `credit_order` — thay chữ ký, thêm so khớp số tiền
```sql
drop function if exists credit_order(uuid);

create function credit_order(p_order_code bigint, p_amount int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_balance int;
begin
  select * into v_order from orders where payos_order_code = p_order_code for update;
  if not found then return 'not_found'; end if;
  if v_order.status = 'paid' then return 'already_paid'; end if;
  if v_order.status <> 'pending' then return 'not_pending'; end if;
  if v_order.amount_vnd <> p_amount then return 'amount_mismatch'; end if;

  update orders set status = 'paid', paid_at = now() where id = v_order.id;
  update profiles set credits = credits + v_order.credits_purchased, updated_at = now()
    where id = v_order.user_id returning credits into v_balance;
  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
    values (v_order.user_id, v_order.credits_purchased, v_balance, 'purchase', v_order.id);
  return 'credited';
end;
$$;

revoke execute on function credit_order(bigint, int) from anon, authenticated;
```
Trả `text` (không phải `void`) để route webhook log/rẽ nhánh đúng theo từng
case thay vì đoán. `for update` khoá dòng đơn — 2 webhook đồng thời bị tuần
tự hoá. Unique index `credit_ledger_idem (reason, ref_id) where ref_id is
not null` (đã có từ Giai đoạn 3) vẫn là lưới an toàn cuối cùng.

#### [NEW] `alter publication supabase_realtime add table orders;`
Publication hiện rỗng (xác nhận qua `pg_publication_tables`) — không bảng
nào bật realtime. Không có bảng nào khác cần realtime ở task này.

### Lib
#### [NEW] `src/lib/payos.ts`
```ts
import { PayOS } from "@payos/node";
import { env } from "@/lib/env";

let cached: PayOS | undefined;
export function getPayOS(): PayOS {
  return (cached ??= new PayOS({
    clientId: env.PAYOS_CLIENT_ID,
    apiKey: env.PAYOS_API_KEY,
    checksumKey: env.PAYOS_CHECKSUM_KEY,
  }));
}
```
Lazy giống `getSupabaseAdmin()` — tránh module-scope đọc `env` (đã học ở
Giai đoạn 3/4c, xem `src/lib/supabase/admin.ts`).

#### [NEW] `src/lib/orders.ts`
```ts
export const PACKS = {
  small:   { label: "Gói Nhỏ",      credits: 10,  amountVnd: 49_000  },
  popular: { label: "Gói Phổ biến", credits: 30,  amountVnd: 129_000 },
  large:   { label: "Gói Lớn",      credits: 100, amountVnd: 359_000 },
} as const;
export type PackId = keyof typeof PACKS;
export const CreateOrderRequestSchema = z.object({ packId: z.enum(["small","popular","large"]) });
```
Giá **server-side only** — client không bao giờ gửi `amount`/`credits` lên
(`05-thanh-toan-credits.md §2`: "lỗ hổng cơ bản nhất").

### API
#### [NEW] `src/app/api/orders/route.ts`
`POST`: `requireUser()` (401 nếu chưa đăng nhập — dù middleware đã chặn
`/nap-credits`, route API tự đứng được độc lập) → validate `packId` → tạo
`orderCode = Date.now()` + `expiresAt = now + 15p` → insert `orders`
(status=pending) qua `supabaseAdmin` (client không tự tạo đơn được, RLS
không có policy insert) → gọi `getPayOS().paymentRequests.create({
orderCode, amount: pack.amountVnd, description, returnUrl:
'.../nap-credits/ket-qua?orderId=', cancelUrl: '.../nap-credits' })` → trả
`{ orderId, qrCode, checkoutUrl, expiresAt }`. Lỗi gọi PayOS → xoá lại
`orders` row vừa tạo (không để đơn "pending" mồ côi không có QR), trả 500.

#### [NEW] `src/app/api/webhooks/payos/route.ts`
```ts
export async function POST(req: Request) {
  const raw = await req.text();
  let verified;
  try {
    verified = await getPayOS().webhooks.verify(JSON.parse(raw));
  } catch {
    Sentry.captureMessage("payos webhook: chữ ký không hợp lệ");
    return new Response("invalid signature", { status: 401 });
  }
  if (verified.code !== "00") return new Response("ok", { status: 200 });

  try {
    const { data, error } = await supabaseAdmin.rpc("credit_order", {
      p_order_code: verified.orderCode,
      p_amount: verified.amount,
    });
    if (error) throw error;
    if (data === "amount_mismatch") {
      Sentry.captureMessage("payos webhook: số tiền không khớp", { extra: { verified } });
    }
  } catch (e) {
    Sentry.captureException(e, { extra: { orderCode: verified.orderCode } });
    return new Response("retry", { status: 500 }); // hạ tầng lỗi thật — cho PayOS retry
  }
  return new Response("ok", { status: 200 });
}
export const runtime = "nodejs";
```
Đọc RAW body (`req.text()`, không `req.json()`) — chữ ký ký trên byte thô,
parse JSON trước khi verify làm sai lệch chữ ký nếu key order đổi.

#### [NEW] `src/app/api/cron/expire-orders/route.ts`
`GET`, check header `authorization === Bearer ${env.CRON_SECRET}` → 401 nếu
sai → update `orders` set status='expired' where status='pending' and
expires_at < now() (qua `supabaseAdmin`) → trả `{ ok: true, count }`.

#### [NEW] `vercel.json`
```json
{ "crons": [{ "path": "/api/cron/expire-orders", "schedule": "*/10 * * * *" }] }
```

### Middleware
#### [MODIFY] `src/lib/supabase/middleware.ts`
`PROTECTED_PREFIXES` thêm `"/nap-credits"`.

### UI
#### [NEW] `src/components/payment/PackagePicker.tsx`
3 card (giống `TopicPicker` pattern: chọn 1, nút xác nhận). Hiện
giá/credits/giá-mỗi-credit từ `PACKS`. Bấm "Chọn" → gọi callback `onSelect(packId)`.

#### [NEW] `src/components/payment/QrPanel.tsx`
Props `{ order: { id, qrCode, expiresAt }, onExpired, onPaid }`. 5 trạng
thái: loading (đang gọi `/api/orders`, do component cha quản lý, panel chỉ
nhận `order` khi đã có) / waiting (QR render bằng `qrcode.toDataURL` +
progress-ring đếm ngược từ `expiresAt - now()`, KHÔNG hardcode 15*60) /
expired (đồng hồ về 0 **hoặc** Realtime/poll báo `status=expired`) / paid
(Realtime/poll báo `status=paid`) / error. Subscribe
`supabase.channel('order:'+id).on('postgres_changes', {event:'UPDATE',
table:'orders', filter:'id=eq.'+id}, ...)` + `setInterval` poll 5s làm
fallback (`05 §5`: "Realtime có thể mất kết nối"). `role="timer"
aria-live="off"` cho progress-ring (đúng comment đã có sẵn trong
`production/prototype/topup.html` — không spam live region mỗi giây), 1 live
region ẩn riêng báo mốc còn 1 phút + khi paid.

#### [NEW] `src/components/payment/NapCreditsFlow.tsx`
Orchestrator (như `ReadingStage` ở 4b): state `idle → creating → active →
paid|error`. `idle`: `PackagePicker`. Chọn gói → `creating`: gọi
`POST /api/orders` → `active`: render `QrPanel`. `onExpired`: về lại
`PackagePicker` (không tự tạo lại đơn — user bấm "Tạo mã mới" chủ động,
tránh tạo đơn PayOS ngoài ý muốn). `onPaid`: hiện card thành công + link
`/trai-bai`.

#### [NEW] `src/app/nap-credits/page.tsx`
Server Component tối giản: `<h1>` + checkbox điều khoản (nội dung thật từ
`05-thanh-toan-credits.md §8`, không link trang chưa tồn tại) +
`<NapCreditsFlow />` (Client Component, chỉ enable nút "Chọn" sau khi tick
checkbox).

#### [NEW] `src/app/nap-credits/ket-qua/page.tsx`
Fallback nếu user đi qua `checkoutUrl` PayOS thay vì ở lại QR trong trang.
Server Component đọc `?orderId=`, query `orders` (RLS tự giới hạn theo
user), hiện đúng trạng thái hiện tại (paid/pending/expired/not-found) + link
`/nap-credits` hoặc `/trai-bai`.

### Env / Dependencies
#### [MODIFY] `src/lib/env.ts`
Thêm 4 field vào `fieldSchemas` VÀ `RAW_ENV` (bài học Giai đoạn 5 —
`process.env.X` viết TĨNH, không qua biến động):
`PAYOS_CLIENT_ID: z.string().min(1)`, `PAYOS_API_KEY: z.string().min(1)`,
`PAYOS_CHECKSUM_KEY: z.string().min(1)`, `CRON_SECRET: z.string().min(16)`.

#### [MODIFY] `package.json`
`@payos/node` (SDK chính thức, xác minh version hiện tại + API thật qua npm/
GitHub — không dùng theo trí nhớ), `qrcode` + `@types/qrcode` (devDep) — lý
do ở Assumptions.

## Accessibility Plan
- `PackagePicker`: `role="group"`, mỗi gói 1 `<button>` (aria-pressed, giống
  `TopicPicker`), không phải `<div onClick>`.
- Checkbox điều khoản: `<label>` bọc `<input type="checkbox">` thật, nút
  "Chọn" gói bị `disabled` (không chỉ ẩn) tới khi tick — lỗi rõ ràng, không
  mơ hồ tại sao không bấm được.
- `QrPanel` progress-ring: `role="timer" aria-live="off"` + 1 live region
  `polite` ẩn riêng chỉ báo mốc còn 1 phút và khi chuyển `paid`/`expired` —
  đúng pattern đã thiết kế ở Giai đoạn 2, tránh spam màn đọc mỗi giây.
- Ảnh QR: `alt` mô tả đủ ("Mã QR thanh toán gói {tên}, {giá}đ"), không alt rỗng.
- Trạng thái `paid`: focus chuyển tới heading thành công (giống pattern
  `#result-heading` ở 4b).
- Contrast: không màu mới — dùng token đã audit (`--color-success` cho
  paid, `--color-danger` cho error/expired, đã pass ở `contrast-audit.md`).

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `credit_order` (đổi chữ ký) | Chỉ webhook route (mới viết) — verify grep không ai gọi hàm cũ | Thấp, nhưng là hàm tiền thật — test kỹ trước khi coi là xong |
| `src/lib/supabase/middleware.ts` | Toàn site (matcher áp mọi request) | Thấp — chỉ thêm 1 prefix vào mảng đã có, không đổi logic |
| `orders` publication realtime | Không ai khác đọc `orders` qua Realtime | Không |
| `env.ts` | Mọi route đọc field khác — do đã sửa per-field lazy ở GĐ5, thêm field mới không ảnh hưởng field cũ | Không |

## Verification Plan
### Automated
```
pnpm lint
npx tsc --noEmit
pnpm build
```

### Manual (cần ngrok + PayOS thật — bạn có sẵn)
1. Tạo đơn → QR hiện đúng, đồng hồ đếm đúng từ `expiresAt` server trả về.
2. Quét thật, chuyển khoản số tiền nhỏ → Realtime đẩy `paid` đúng, credits
   cộng đúng trong `/tai-khoan`.
3. **Case quan trọng nhất**: dùng PayOS Dashboard hoặc gọi lại thủ công
   cùng payload webhook 3 lần → `credit_ledger` chỉ có 1 dòng `purchase`
   cho đơn đó, credits không cộng trùng.
4. Chữ ký sai (sửa 1 byte body) → 401, không cộng.
5. Số tiền trong webhook khác `amount_vnd` đơn → `amount_mismatch`, không cộng, có Sentry log.
6. Không thao tác gì, đợi hết 15 phút → UI tự chuyển `expired`; sau đó gọi
   `expire-orders` cron thủ công → DB cũng `expired`; webhook đến sau đó
   (giả lập) → `not_pending`, không cộng.
7. Mất mạng realtime (DevTools offline tạm) → polling 5s vẫn bắt được `paid`.
8. 375/768/1280/1920, cả 2 theme, bàn phím, zoom 200%.
9. Chạy query đối soát `04-database-schema.md §2.5` → 0 dòng lệch.

## Out of Scope
- Rate limit `/api/orders` — Giai đoạn 7.
- Trang Điều khoản đầy đủ — Giai đoạn 7 (dùng nội dung thật inline thay vì link).
- Sửa `debit_reading`/`refund_reading` — đã đúng, chỉ verify.
- Admin UI đối soát — chỉ chạy query xác nhận, không dựng UI.
