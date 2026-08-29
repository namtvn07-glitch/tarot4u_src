# 05 — Thanh toán & Credits

> Đây là phần duy nhất trong dự án mà một bug làm **mất tiền thật**. Đọc kỹ §3.

## 1. Luồng tổng quan

```
┌──────────┐                                        ┌────────────┐
│  Client  │                                        │   PayOS    │
└────┬─────┘                                        └─────┬──────┘
     │ 1. POST /api/orders {packId}                       │
     ├───────────────────────▶ ┌──────────┐               │
     │                         │  Server  │               │
     │                         └────┬─────┘               │
     │                              │ 2. INSERT orders     │
     │                              │    (status=pending)  │
     │                              │ 3. tạo link thanh toán
     │                              ├──────────────────────▶
     │                              │◀──────── {qrCode} ───┤
     │◀─── {orderId, qrCode} ───────┤                      │
     │                                                     │
     │ 4. subscribe Realtime trên orders:id=orderId        │
     │                                                     │
     │ 5. User quét QR, chuyển khoản ──────────────────────▶
     │                                                     │
     │                         ┌──────────┐  6. webhook    │
     │                         │  Server  │◀───────────────┤
     │                         └────┬─────┘                │
     │                              │ 7. verify signature  │
     │                              │ 8. TRANSACTION:      │
     │                              │    - orders → paid   │
     │                              │    - ledger insert   │
     │                              │    - profiles.credits│
     │                              │ 9. trả 200 (luôn)    │
     │                              ├──────────────────────▶
     │◀── Realtime: status=paid ────┤                      │
     │ 10. chuyển màn thành công                           │
```

## 2. Tạo đơn

```ts
// app/api/orders/route.ts
export const runtime = 'nodejs'

const PACKS = {
  starter: { credits: 10,  amountVnd: 49_000  },
  popular: { credits: 30,  amountVnd: 129_000 },
  value:   { credits: 100, amountVnd: 359_000 },
} as const

export async function POST(req: Request) {
  const user = await requireUser(req)
  const { packId } = BodySchema.parse(await req.json())
  const pack = PACKS[packId]

  // orderCode phải là số nguyên và duy nhất — PayOS yêu cầu
  const orderCode = Date.now()
  const expiresAt = new Date(Date.now() + 15 * 60_000)   // 15 phút

  const { data: order } = await admin.from('orders').insert({
    user_id: user.id,
    amount_vnd: pack.amountVnd,
    credits_purchased: pack.credits,
    payos_order_code: orderCode,
    expires_at: expiresAt.toISOString(),
  }).select().single()

  const link = await payos.paymentRequests.create({
    orderCode,
    amount: pack.amountVnd,
    description: `${pack.credits} credits`,
    expiredAt: Math.floor(expiresAt.getTime() / 1000),
    returnUrl: `${env.NEXT_PUBLIC_SITE_URL}/nap-credits/ket-qua`,
    cancelUrl: `${env.NEXT_PUBLIC_SITE_URL}/nap-credits`,
  })

  return Response.json({
    orderId: order.id,
    qrCode: link.qrCode,
    expiresAt: expiresAt.toISOString(),
  })
}
```

**Giá và số credits luôn lấy từ hằng số server-side.** Không bao giờ nhận `amount` hay `credits` từ client — đó là lỗ hổng cơ bản nhất.

> **Cập nhật Giai đoạn 6 (2026-08-18):** snippet trên viết trước khi verify SDK
> thật, dùng nhầm tên hàm cũ (`createPaymentLink`). SDK `@payos/node` v2 thật
> (xác minh qua `github.com/payOSHQ/payos-lib-node`) là `new PayOS({clientId,
> apiKey, checksumKey})` rồi `payos.paymentRequests.create(...)` — đã sửa lại
> ở trên. Response có field `checkoutUrl` (link hosted page PayOS) bên cạnh
> `qrCode` — không dùng ở snippet này nhưng cần cho `returnUrl`/`cancelUrl`
> fallback nếu user rời trang QR trong app (xem `src/app/api/orders/route.ts`).

## 3. Webhook — phần dễ mất tiền nhất

### 3.1 Ba yêu cầu bắt buộc

| # | Yêu cầu | Hậu quả nếu thiếu |
|---|---|---|
| 1 | **Verify chữ ký** trước khi làm bất cứ gì | Ai cũng POST được vào endpoint và tự cộng credits cho mình |
| 2 | **Idempotent** — chạy lại nhiều lần cho kết quả giống nhau | PayOS retry webhook → cộng credits 2–3 lần |
| 3 | **Luôn trả 200** khi đã xử lý xong (kể cả khi bỏ qua) | Trả 500 → PayOS retry vô hạn |

Yêu cầu #1 thì hầu như ai cũng nhớ. #2 và #3 mới là chỗ hay bỏ sót, và chúng là chỗ mất tiền.

### 3.2 Vì sao PayOS gọi webhook nhiều lần

Cổng thanh toán không biết bạn đã nhận được hay chưa. Nếu response chậm, timeout, hoặc trả mã lỗi, chúng nó **gửi lại**. Đây là hành vi bình thường và đúng của mọi cổng thanh toán — thiết kế phải chịu được nó.

### 3.3 Cài đặt

```ts
// app/api/webhooks/payos/route.ts
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const raw = await req.text()          // đọc RAW, không dùng req.json()

  // 1. VERIFY trước tiên, không tin gì cả
  let payload
  try {
    payload = await payos.webhooks.verify(JSON.parse(raw))
  } catch {
    Sentry.captureMessage('payos webhook: chữ ký không hợp lệ')
    return new Response('invalid signature', { status: 401 })
  }

  if (payload.code !== '00') {
    return new Response('ok', { status: 200 })
  }

  try {
    const status = await admin.rpc('credit_order', {
      p_order_code: payload.orderCode,
      p_amount: payload.amount,
    })
    if (status === 'amount_mismatch') {
      Sentry.captureMessage('payos webhook: số tiền không khớp', { extra: { payload } })
    }
  } catch (e) {
    Sentry.captureException(e, { extra: { orderCode: payload.orderCode } })
    // Trả 500 để PayOS retry — CHỈ khi lỗi hạ tầng thật sự (DB down)
    return new Response('retry', { status: 500 })
  }

  return new Response('ok', { status: 200 })
}
```

> **Cập nhật Giai đoạn 6 (2026-08-18):** `verifyPaymentWebhookData` là tên hàm
> cũ, không tồn tại trong SDK thật — đúng là `payos.webhooks.verify(...)`
> (async, trả `Promise<WebhookData>`). Cũng bỏ `markOrderFailed` (không cần —
> `code !== '00'` không phải lỗi của route này, không có gì để "đánh dấu
> failed"; đơn vẫn `pending` cho tới khi hết hạn hoặc có webhook `code==='00'`
> thật) và đổi `creditOrder(...)` (hàm tưởng tượng) thành gọi RPC
> `credit_order` thật — xem §3.4 bên dưới. Implementation thật ở
> `src/app/api/webhooks/payos/route.ts`.

### 3.4 Hàm cộng credits — atomic + idempotent

Viết trong Postgres function để cả 3 thao tác nằm trong một transaction:

```sql
create function credit_order(p_order_code bigint, p_amount int)
returns text
language plpgsql
security definer
as $$
declare
  v_order   orders%rowtype;
  v_balance int;
begin
  -- Khóa dòng đơn hàng, chặn 2 webhook chạy song song
  select * into v_order from orders
   where payos_order_code = p_order_code
   for update;

  if not found then
    raise exception 'không tìm thấy đơn %', p_order_code;
  end if;

  -- CHỐNG TRÙNG: đơn đã paid rồi thì thoát êm, không cộng lại
  if v_order.status = 'paid' then
    return 'already_paid';
  end if;

  if v_order.status <> 'pending' then
    return 'not_pending';
  end if;

  -- Kiểm tra số tiền khớp — chống sửa số tiền
  if v_order.amount_vnd <> p_amount then
    raise exception 'số tiền không khớp: đơn % vs webhook %',
      v_order.amount_vnd, p_amount;
  end if;

  update orders
     set status = 'paid', paid_at = now()
   where id = v_order.id;

  update profiles
     set credits = credits + v_order.credits_purchased,
         updated_at = now()
   where id = v_order.user_id
  returning credits into v_balance;

  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
  values (v_order.user_id, v_order.credits_purchased, v_balance,
          'purchase', v_order.id);

  return 'credited';
end $$;
```

**Ba lớp chống trùng:**
1. `for update` — khóa dòng, hai webhook song song bị tuần tự hóa
2. `if v_order.status = 'paid' then return` — kiểm tra trạng thái tường minh
3. Unique index `credit_ledger (reason, ref_id)` — lưới an toàn cuối cùng ở tầng DB

Ba lớp có vẻ thừa. Không thừa. Đây là chỗ mất tiền thật.

> **Cập nhật Giai đoạn 6 (2026-08-18):** implementation thật (migration
> `credit_order_amount_check`) trả **text status** (`'not_found'`,
> `'amount_mismatch'`...) thay vì `raise exception` cho 2 case đó — route
> webhook cần phân biệt "lỗi hạ tầng thật, cho PayOS retry" (exception thật,
> catch → 500) với "case nghiệp vụ đã biết trước, không cộng nhưng vẫn trả
> 200" (đơn không tồn tại, số tiền lệch...). `raise exception` cho cả 2 loại
> sẽ buộc route phải tự phân loại lại bằng cách parse message lỗi — dễ vỡ hơn
> so với nhận thẳng 1 trong các giá trị text đã liệt kê.

### 3.5 Test webhook

Không thể test webhook trên localhost — PayOS cần URL public.

| Cách | Khi nào |
|---|---|
| `ngrok http 3000` | Dev local |
| Vercel Preview deployment | Test trước khi merge |
| Production | Test cuối cùng bằng giao dịch thật số tiền nhỏ |

> **Cập nhật Giai đoạn 6 (2026-08-19):** xác nhận qua tài liệu chính thức
> (`payos.vn/docs/moi-truong-test`) — **PayOS không có sandbox**. Toàn bộ
> testing (kể cả ở bước dev) chạy trên production API thật, cùng API key,
> không có payload webhook giả lập. `payos.webhooks.confirm(url)` chỉ xác
> nhận endpoint có phản hồi đúng (đăng ký webhook), không kích hoạt webhook
> `code==='00'` như một giao dịch thật. Nghĩa là **mọi lần test webhook đều
> phải quét QR thật và chuyển khoản thật**, kể cả với ngrok ở bước dev — chọn
> gói nhỏ nhất (49.000đ) để giảm chi phí test.

**Các case bắt buộc test:**
- [ ] Webhook hợp lệ → cộng credits đúng
- [ ] **Gửi lại đúng webhook đó 3 lần → credits chỉ cộng 1 lần**
- [ ] Chữ ký sai → 401, không cộng
- [ ] Số tiền trong webhook khác số tiền đơn → từ chối
- [ ] `orderCode` không tồn tại → không crash
- [ ] User hủy giữa chừng → đơn về `cancelled`
- [ ] Đơn hết hạn 15 phút → về `expired`, sau đó webhook đến muộn → **không** cộng credits
- [ ] Hai webhook đến đồng thời → chỉ một cộng được

Case in đậm là case quan trọng nhất — nếu chỉ có thời gian test một thứ, test nó.

## 4. Trừ credits khi trải bài

Cùng nguyên tắc: atomic, có ledger.

```sql
create function debit_reading(p_user_id uuid, p_reading_id uuid, p_cost int)
returns boolean
language plpgsql security definer as $$
declare v_balance int;
begin
  update profiles
     set credits = credits - p_cost, updated_at = now()
   where id = p_user_id and credits >= p_cost      -- điều kiện chặn số âm
  returning credits into v_balance;

  if not found then
    return false;                                   -- không đủ credits
  end if;

  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id)
  values (p_user_id, -p_cost, v_balance, 'reading', p_reading_id);

  return true;
end $$;
```

`where id = ... and credits >= p_cost` là kiểm tra **atomic** — không có race condition giữa "đọc số dư" và "trừ". Nếu đọc trước rồi trừ sau bằng 2 câu lệnh riêng, hai request song song có thể cùng thấy đủ credits và cùng trừ → số dư âm.

### Hoàn credits khi AI lỗi

```ts
after(async () => {
  try {
    const msg = await stream.finalMessage()
    if (msg.stop_reason === 'refusal') throw new AIRefusalError()
    await saveReading(readingId, msg)
  } catch (e) {
    await admin.rpc('refund_reading', { p_reading_id: readingId })
    Sentry.captureException(e, { extra: { readingId } })
  }
})
```

```sql
create function refund_reading(p_reading_id uuid)
returns void language plpgsql security definer as $$
declare v_row credit_ledger%rowtype; v_balance int;
begin
  -- Tìm giao dịch trừ tương ứng
  select * into v_row from credit_ledger
   where reason = 'reading' and ref_id = p_reading_id;
  if not found then return; end if;

  -- Đã hoàn rồi thì thôi (idempotent)
  if exists (select 1 from credit_ledger
              where reason = 'refund' and ref_id = p_reading_id) then
    return;
  end if;

  update profiles set credits = credits + abs(v_row.delta)
   where id = v_row.user_id
  returning credits into v_balance;

  insert into credit_ledger (user_id, delta, balance_after, reason, ref_id, note)
  values (v_row.user_id, abs(v_row.delta), v_balance, 'refund',
          p_reading_id, 'hoàn do lỗi sinh nội dung');
end $$;
```

## 5. Realtime cập nhật trạng thái

```ts
// components/payment/QrPanel.tsx
useEffect(() => {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      if (payload.new.status === 'paid') onPaid()
      if (payload.new.status === 'failed') onFailed()
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [orderId])
```

> **Realtime tôn trọng RLS.** Policy `orders_select_own` phải cho phép user đọc đơn của mình, nếu không client sẽ không nhận được event.

### Cần fallback polling

Realtime có thể mất kết nối (mạng yếu, tab background trên mobile). Thêm polling nhẹ làm mạng lưới:

```ts
useEffect(() => {
  const t = setInterval(async () => {
    const { data } = await supabase.from('orders')
      .select('status').eq('id', orderId).single()
    if (data?.status === 'paid') onPaid()
  }, 5_000)
  return () => clearInterval(t)
}, [orderId])
```

User thanh toán xong nhưng màn hình đứng im là trải nghiệm tệ nhất có thể ở luồng tiền — họ sẽ nghĩ mất tiền và nhắn hỗ trợ. Polling là bảo hiểm rẻ.

## 6. Năm trạng thái màn hình QR

Ngoài 4 trạng thái async thông thường, màn QR có trạng thái thứ 5:

| Trạng thái | UI |
|---|---|
| Loading | Spinner "Đang tạo mã thanh toán..." |
| Success (chờ) | QR + đồng hồ đếm ngược 15:00 + "Đang chờ thanh toán" |
| **Expired** | QR mờ đi + "Mã đã hết hạn" + nút "Tạo mã mới" |
| Paid | Animation thành công + số credits mới + nút "Trải bài ngay" |
| Error | "Không tạo được mã QR" + nút thử lại + link liên hệ hỗ trợ |

## 7. Cron dọn đơn hết hạn

```ts
// app/api/cron/expire-orders/route.ts
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 })
  }
  await admin.from('orders')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
  return Response.json({ ok: true })
}
```

`vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/expire-orders", "schedule": "*/10 * * * *" }] }
```

> Đơn đã `expired` mà webhook đến muộn sẽ bị `credit_order` từ chối (`not_pending`). Đây là hành vi **đúng** — nhưng phải ghi Sentry và có quy trình xử lý thủ công, vì user đã trả tiền thật. Cân nhắc để cửa sổ hết hạn rộng hơn PayOS một chút (ví dụ đơn 15 phút nhưng đánh dấu expired sau 20 phút).

## 8. Chính sách hoàn tiền

Credits là **trả trước** — phải có chính sách rõ ràng trên trang điều khoản:

| Tình huống | Xử lý |
|---|---|
| AI lỗi không sinh được nội dung | Tự động hoàn credits, không cần yêu cầu |
| User không hài lòng nội dung | Không hoàn (giống mọi dịch vụ nội dung) — **phải ghi rõ trước khi mua** |
| Nạp nhầm gói | Hỗ trợ thủ công trong 7 ngày, dùng `admin_adjust` trong ledger |
| Tài khoản bị xóa | Credits còn lại mất — **phải ghi rõ** |
| Credits có hết hạn không | Khuyến nghị: **không hết hạn**. Đơn giản, ít tranh cãi, và không phải là nguồn thu đáng kể |

Ghi tất cả vào trang "Điều khoản sử dụng" và hiển thị checkbox xác nhận ở màn chọn gói.

## 9. Đối soát `profiles.credits` vs `sum(credit_ledger.delta)`

`profiles.credits` là số dư hiện tại; `credit_ledger` là sổ cái từng giao
dịch (nạp/trừ/hoàn). Hai cái phải luôn khớp — lệch nghĩa là có đường ghi
credits nào đó không đi qua ledger (bug thật, không phải chuyện vặt). Query
đối soát, chạy định kỳ (xem `08-timeline.md` Giai đoạn 11 — hàng tuần sau
launch):

```sql
select
  p.id as user_id,
  p.credits as profile_credits,
  coalesce(sum(cl.delta), 0) as ledger_sum,
  p.credits - coalesce(sum(cl.delta), 0) as lech
from profiles p
left join credit_ledger cl on cl.user_id = p.id
group by p.id, p.credits
having p.credits <> coalesce(sum(cl.delta), 0);
```

**0 dòng = khớp hoàn toàn.** Bất kỳ dòng nào trả về là lệch cần điều tra ngay.

**Chạy thật 2026-08-27**: 0 dòng lệch, trên 1 user thật (28 dòng
`credit_ledger` — nạp/trừ/hoàn credits qua nhiều lượt Đọc sâu test trong
Giai đoạn 4c/multi-provider AI, bao gồm cả các lượt lỗi đã hoàn credits qua
`refund_reading`). Xác nhận cơ chế atomic (`debit_reading`/`refund_reading`/
`credit_order`, xem [04 §4](04-database-schema.md)) giữ đúng bất biến "số dư
= tổng sổ cái" qua toàn bộ vòng test, kể cả đường lỗi (hoàn credits).

---

**Tiếp theo:** [06-bao-mat-kiem-duyet-phap-ly.md](06-bao-mat-kiem-duyet-phap-ly.md)
