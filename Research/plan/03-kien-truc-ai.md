# 03 — Kiến trúc AI & Tối ưu chi phí

> File quan trọng nhất trong bộ tài liệu. Đọc hết trước khi viết API route đầu tiên.

## 1. Kiến trúc 2 lớp

Cách cache đơn giản nhất — lưu toàn bộ diễn giải theo `(card_id, orientation, topic)` — cho ra một CSDL nội dung tĩnh, không phải AI cá nhân hóa: khi cache hit, câu hỏi của user bị bỏ qua hoàn toàn. Kiến trúc dưới đây giữ được phần lớn khoản tiết kiệm mà không đánh mất tính cá nhân.

```
                     ┌─────────────────────────────────────────┐
   User rút lá  ────▶ │ LỚP NỀN (Base)                          │
                     │ • Ý nghĩa lá × hướng × chủ đề           │
                     │ • Sinh sẵn 1 lần bằng Batch API         │
                     │ • Đọc từ Postgres, 0 API call           │
                     │ • Chi phí runtime: $0                   │
                     └──────────────────┬──────────────────────┘
                                        │ hiển thị NGAY (<100ms)
                                        ▼
                     ┌─────────────────────────────────────────┐
   Câu hỏi user ───▶ │ LỚP CÁ NHÂN (Synthesis)   [chỉ Paid]    │
                     │ • Nối câu hỏi cụ thể với lá vừa rút     │
                     │ • Gọi Claude realtime, streaming        │
                     │ • Input nhỏ (~1.6k tok), output ngắn    │
                     │ • Chi phí: ~$0.009–0.02/lượt            │
                     └─────────────────────────────────────────┘
```

**Điểm mấu chốt:** lớp Cá nhân **không** nhận toàn bộ text của lớp Nền làm input. Nó chỉ nhận **từ khóa cô đọng** của lá bài + câu hỏi user. Điều này giữ input nhỏ và làm prompt caching hiệu quả (phần system prompt ổn định, phần thay đổi nằm ở cuối).

### Đánh đổi

| Tiêu chí | Kết quả |
|---|---|
| Chi phí AI/lượt free | $0 — chỉ một `SELECT` |
| Chi phí AI/lượt paid | ~$0.008–0.015 |
| Time-to-first-content | ~50ms (lớp Nền hiện ngay, không chờ AI) |
| Cá nhân hóa | Thật, theo câu hỏi cụ thể |
| Chịu được share MXH và rút lại cùng lá | Có — nội dung khác nhau giữa các lượt |

Ở 1.000 lượt trả phí/tháng, toàn bộ lớp Cá nhân tốn ~$12. Xem [07 §5](07-du-toan-chi-phi.md): AI chiếm ~5% doanh thu, nên đây không phải chỗ đáng tiết kiệm.

## 2. Ma trận sinh nội dung Lớp Nền

| Chiều | Số giá trị | Ghi chú |
|---|---|---|
| Lá bài | 78 | 22 Major + 56 Minor Arcana |
| Hướng | 2 | xuôi / ngược |
| Chủ đề | 5 | Tình yêu, Công việc, Tài chính, Tinh thần, Tổng quát |
| **Tổng** | **780 tổ hợp** | |

> Mọi chủ đề ở lớp Nền phải có **nghĩa xác định** để sinh sẵn được. Một chủ đề kiểu "băn khoăn cá nhân" là catch-all tự do, không có nội dung cố định — thứ đó thuộc về lớp Cá nhân, không phải lớp Nền.

## 3. Chọn model

Trực giác thông thường là *tác vụ free → model rẻ*. Logic đó đúng với tác vụ realtime nhưng **sai với nội dung sinh sẵn**.

> Nội dung Lớp Nền được viết **một lần** và phục vụ **hàng chục nghìn lượt đọc**. Chi phí phân bổ trên mỗi lượt ≈ $0. Thứ duy nhất đáng tối ưu ở đây là **chất lượng**.

### Bảng chọn model

| Tác vụ | Model | Lý do | Chi phí |
|---|---|---|---|
| **Lớp Nền** (780 tổ hợp, batch) | `claude-opus-5` | Viết 1 lần dùng mãi. Đây là "linh hồn" nội dung của sản phẩm — dùng model tốt nhất | ~$5 một lần |
| **Nội dung SEO** 78 trang (batch) | `claude-opus-5` | Cùng lý do; nội dung SEO kém = không có traffic | ~$3 một lần |
| **Lớp Cá nhân** (realtime, paid) | `claude-sonnet-5` | Cân bằng chất lượng/tốc độ/giá cho tác vụ lặp lại nhiều | ~$0.013/lượt |
| **Kiểm duyệt câu hỏi** | `claude-haiku-4-5` | Phân loại đơn giản, cần nhanh và rẻ | ~$0.0007/lượt |

> Nếu chất lượng lớp Cá nhân là điểm khác biệt cạnh tranh, cân nhắc `claude-opus-5` ($5/$25) cho gói cao cấp. Chi phí/lượt lên ~$0.022 — vẫn chỉ ~12% doanh thu. Nên A/B trước khi launch.

### Đơn giá tham chiếu

| Model | Input $/MTok | Output $/MTok | Context | Max output |
|---|---|---|---|---|
| `claude-opus-5` | $5.00 | $25.00 | 1M | 128K |
| `claude-sonnet-5` | **$3.00** | **$15.00** | 1M | 128K |
| `claude-haiku-4-5` | $1.00 | $5.00 | 200K | 64K |

> ⚠️ **Sonnet 5 đang có giá giới thiệu $2/$10 đến hết 31/08/2026.** Mọi dự toán trong bộ tài liệu này dùng **giá chuẩn $3/$15** để không bị hụt ngân sách từ tháng 9.

## 4. Sáu lớp tối ưu chi phí

Xếp theo tỷ lệ hiệu quả trên công sức. Lớp §4.1 nên làm đầu tiên: hai dòng cấu hình, cắt ~50% chi phí mỗi lượt.

### 4.1 Tắt thinking + hạ `effort` — lớp rẻ nhất, hiệu quả nhất

Sonnet 5 **mặc định bật adaptive thinking** khi bạn không truyền tham số `thinking` — nghĩa là bạn đang trả tiền cho token suy luận ở **mọi lượt trải bài**. Diễn giải tarot là tác vụ **sáng tạo/văn phong**, không phải suy luận nhiều bước — thinking gần như không cải thiện chất lượng nhưng tốn 200–800 token mỗi lượt.

```ts
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-5',
  max_tokens: 1200,
  thinking: { type: 'disabled' },        // TẮT — tarot không cần suy luận nhiều bước
  output_config: { effort: 'low' },      // mặc định là 'high'
  system: [/* ... */],
  messages: [/* ... */],
})
```

| Cấu hình | Output token TB | Chi phí/lượt (Sonnet 5) |
|---|---|---|
| Mặc định (adaptive thinking + effort high) | ~1.100 | ~$0.022 |
| `thinking: disabled` + `effort: low` | ~450 | ~$0.011 |

**Tiết kiệm ~50% mà không đụng gì tới cache.** Hãy A/B chất lượng ở `effort: 'low'` và `'medium'` trước khi chốt.

> ⚠️ **Hai cảnh báo quan trọng:**
>
> 1. **`effort` KHÔNG được hỗ trợ trên Haiku 4.5** — truyền vào sẽ lỗi. Chỉ dùng `effort` với Sonnet 5 / Opus 5.
> 2. **Khi tắt thinking trên các model đời mới, thỉnh thoảng model viết lời gọi tool thành văn bản thường thay vì tool block, hoặc rò tag `<thinking>` ra output.** Với luồng tarot của chúng ta thì rủi ro thấp (không dùng tool, output là văn xuôi). Nhưng nếu sau này thêm tool, hãy chuyển sang `thinking` bật + `effort: 'low'` thay vì tắt hẳn, và thêm vào system prompt: *"Không đưa thẻ XML nội bộ hay hệ thống vào câu trả lời."*

`max_tokens` giới hạn **thinking + text cộng lại**. Nếu bật thinking mà `max_tokens` chật, câu trả lời sẽ bị cắt giữa chừng.

### 4.2 Batch API — giảm 50%, dùng cho toàn bộ nội dung sinh sẵn

Batch API giảm 50% giá token cho công việc không cần realtime. Áp dụng cho:

| Việc | Số request | Khi nào chạy |
|---|---|---|
| Sinh 780 tổ hợp Lớp Nền | 780 | Một lần, trước launch |
| Sinh nội dung SEO 78 trang | 78 | Một lần, trước launch |
| Bổ sung khi thêm chủ đề mới | 156/chủ đề | Khi cần |

```ts
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic()

// 1. Tạo batch
const batch = await client.messages.batches.create({
  requests: combos.map((c) => ({
    custom_id: `${c.cardId}__${c.orientation}__${c.topic}`,
    params: {
      model: 'claude-opus-5',
      max_tokens: 1500,
      system: BASE_LAYER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildBasePrompt(c) }],
      output_config: { format: zodOutputFormat(BaseContentSchema) },
    },
  })),
})

// 2. Poll cho tới khi xong (thường <1h, tối đa 24h)
let status
do {
  await sleep(60_000)
  status = await client.messages.batches.retrieve(batch.id)
} while (status.processing_status !== 'ended')

// 3. Đọc kết quả — KẾT QUẢ VỀ KHÔNG THEO THỨ TỰ, phải map bằng custom_id
for await (const r of await client.messages.batches.results(batch.id)) {
  if (r.result.type !== 'succeeded') { logFailure(r); continue }
  const [cardId, orientation, topic] = r.custom_id.split('__')
  await upsertBaseContent({ cardId, orientation, topic, ... })
}
```

> **Bẫy thường gặp:** kết quả batch trả về **theo thứ tự bất kỳ**. Luôn map bằng `custom_id`, không bao giờ theo index của mảng.

Giới hạn: tối đa 100.000 request hoặc 256MB/batch — 780 request thì thoải mái. Kết quả giữ 29 ngày.

### 4.3 Cache Lớp Nền trong Postgres — bỏ hẳn API call

Sau khi batch xong, mọi lượt đọc Lớp Nền chỉ là một `SELECT`. Đây là lớp tiết kiệm lớn nhất về tổng thể: **100% traffic free tier tốn $0 API.**

Yêu cầu schema (chi tiết ở [04](04-database-schema.md)):

```sql
create unique index base_content_lookup
  on base_content (card_id, orientation, topic);
```

Không có unique index này thì lookup là full-scan và bản trùng sẽ tích tụ.

### 4.4 Prompt caching — ⚠️ chỉ bật từ Phase 2

**Ở lưu lượng thấp, prompt caching làm bạn tốn thêm tiền.**

| Loại | Giá |
|---|---|
| Cache **read** | 0.1× giá input |
| Cache **write** (TTL 5 phút) | **1.25×** giá input |
| Cache **write** (TTL 1 giờ) | **2×** giá input |

Điểm hòa vốn với TTL 5 phút: cần **ít nhất 2 request trong cùng 5 phút**. Ở Phase 1 (<500 user/tháng ≈ 17 lượt/ngày), các request cách nhau hàng chục phút → gần như **luôn miss** → bạn chỉ đơn thuần trả thêm 25%.

**Ngưỡng prefix tối thiểu — khác nhau theo model:**

| Model | Prefix tối thiểu để cache được |
|---|---|
| `claude-opus-5` | 512 token |
| `claude-sonnet-5` | **1.024 token** |
| `claude-haiku-4-5` | **4.096 token** |

System prompt tarot điển hình ~1.200–1.800 token → **cache được trên Sonnet 5, KHÔNG cache được trên Haiku 4.5**. Quan trọng: khi prefix quá ngắn, API **im lặng không cache** — không báo lỗi. Đừng ngồi debug tại sao không tiết kiệm.

**Khuyến nghị theo giai đoạn:**

| Phase | Prompt caching | Lý do |
|---|---|---|
| Phase 1 | ❌ Tắt | Traffic quá thấp, chỉ tốn thêm 25% |
| Phase 2+ | ✅ Bật, TTL 5 phút | Lưu lượng đủ để hòa vốn |

```ts
system: [
  { type: 'text', text: PERSONA_AND_FORMAT,   // phần ỔN ĐỊNH, ~1.400 token
    cache_control: { type: 'ephemeral' } },
],
messages: [
  { role: 'user', content: buildUserTurn(cards, question) },  // phần THAY ĐỔI, đặt SAU
]
```

**Xác minh cache có chạy thật không:**

```ts
const msg = await stream.finalMessage()
console.log(msg.usage.cache_read_input_tokens)      // >0 = đang đọc cache
console.log(msg.usage.cache_creation_input_tokens)  // >0 = đang ghi cache
```

Nếu `cache_read_input_tokens` luôn = 0 qua nhiều request giống nhau, có gì đó đang phá prefix. Thủ phạm phổ biến:

| Lỗi | Vì sao phá cache |
|---|---|
| Nhét `new Date()` / ngày hôm nay vào system prompt | Prefix đổi mỗi request |
| Nhét tên user / user ID vào system prompt | Mỗi user một prefix riêng, không chia sẻ được |
| `JSON.stringify` object không sắp xếp key | Byte khác nhau giữa các lần |
| Ghép system prompt có điều kiện (`if (paid) system += ...`) | Mỗi tổ hợp điều kiện là một prefix khác |

> Caching là **so khớp tiền tố**. Một byte đổi ở vị trí N làm hỏng toàn bộ cache từ N trở đi. Giữ system prompt **đóng băng**; mọi thứ động phải nằm trong `messages`.

### 4.5 Phân tầng model theo giá trị tác vụ

Xem bảng ở §3. Nguyên tắc: **phân tầng chỉ áp dụng cho tác vụ realtime.** Nội dung sinh sẵn luôn dùng model tốt nhất.

### 4.6 Giới hạn `max_tokens` theo loại trải bài

`max_tokens` là trần cứng, model **không biết** về nó — chạm trần thì câu trả lời bị cắt giữa chừng. Nhưng đặt quá cao cũng không tốn tiền (chỉ tính token thực sinh ra). Vấn đề là **model có xu hướng viết dài** nếu không bị ràng buộc bằng prompt.

Cách đúng: **ràng buộc độ dài bằng prompt**, đặt `max_tokens` rộng rãi hơn ~30% để không bị cắt.

| Loại | Độ dài mục tiêu (prompt) | `max_tokens` |
|---|---|---|
| Lớp Cá nhân, 1 lá | 150–200 từ | 800 |
| Lớp Cá nhân, 3 lá | 350–450 từ | 1.500 |
| Lớp Nền (batch) | 250–350 từ | 1.500 |
| Kiểm duyệt | JSON ngắn | 200 |

Trong system prompt:

> *"Viết 150–200 từ. Đi thẳng vào câu hỏi của người dùng, không mở bài, không nhắc lại câu hỏi, không tóm tắt lại ý nghĩa lá bài (phần đó người đọc đã thấy ở trên)."*

## 5. Prompt — thiết kế

### 5.1 System prompt Lớp Cá nhân (ổn định, cacheable)

Cấu trúc theo thứ tự **ổn định → biến động** để prompt caching hoạt động:

```
[1] Persona: giọng điệu, thế giới quan tarot
[2] Ranh giới an toàn: không tiên đoán y tế/pháp lý/tài chính cụ thể
[3] Quy tắc định dạng: độ dài, không mở bài, xưng hô
[4] Quy tắc nội dung: không hù dọa, không tuyệt đối hóa, luôn để ngỏ agency
                                    ↑ cache_control đặt ở cuối khối này
--- ranh giới cache ---
[5] User turn: lá bài đã rút + từ khóa + câu hỏi của user
```

Ví dụ khối [4] — quan trọng cho chất lượng và cho pháp lý:

```
- Tarot phản chiếu tình huống, không định đoạt tương lai. Không bao giờ nói
  điều gì đó "sẽ xảy ra" — nói về xu hướng, khả năng, và điều người đọc có
  thể chủ động làm.
- Không hù dọa. Lá bài "khó" (Tháp, Tử Thần, Ba Kiếm) nói về thay đổi và kết
  thúc, không phải tai họa.
- Không chẩn đoán bệnh, không tư vấn pháp lý, không khuyến nghị đầu tư cụ thể.
- Luôn kết thúc bằng một điều người đọc có thể tự quyết định hoặc tự làm.
```

### 5.2 User turn (biến động, đặt sau ranh giới cache)

```ts
function buildUserTurn(draw: Draw, question: string | null) {
  const cards = draw.cards.map(c =>
    `- ${c.name} (${c.orientation === 'upright' ? 'xuôi' : 'ngược'})` +
    ` — từ khóa: ${c.keywords.join(', ')}`
  ).join('\n')

  return [
    `Chủ đề: ${TOPIC_LABEL[draw.topic]}`,
    `Lá đã rút:\n${cards}`,
    question
      ? `Câu hỏi của người dùng: "${question}"`
      : 'Người dùng không đặt câu hỏi cụ thể. Viết cho tình huống chung của chủ đề.',
    'Viết phần diễn giải cá nhân. Người đọc đã xem ý nghĩa nền của từng lá — đừng lặp lại.',
  ].join('\n\n')
}
```

> **Lưu ý:** truyền **từ khóa**, không truyền toàn bộ text Lớp Nền. Giữ input ~1.6k token thay vì ~4k.

### 5.3 Kiểm duyệt câu hỏi (Haiku 4.5 + structured output)

Chạy **trước** khi rút bài. ~200ms, ~$0.0007/lượt (chi tiết bóc tách ở [07 §3.1](07-du-toan-chi-phi.md)).

```ts
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

const Triage = z.object({
  category: z.enum(['ok', 'crisis', 'medical', 'legal', 'harmful', 'nonsense']),
  reason: z.string(),
})

const res = await client.messages.parse({
  model: 'claude-haiku-4-5',
  max_tokens: 200,
  // KHÔNG truyền output_config.effort — Haiku 4.5 không hỗ trợ, sẽ lỗi
  system: TRIAGE_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: question }],
  output_config: { format: zodOutputFormat(Triage) },
})

switch (res.parsed_output!.category) {
  case 'crisis':  return showCrisisResources()   // KHÔNG trừ credits
  case 'medical':
  case 'legal':   return showRedirectNotice()    // KHÔNG trừ credits
  case 'harmful': return showDecline()           // KHÔNG trừ credits
  default:        return proceed()
}
```

Chi tiết chính sách xử lý ở [06-bao-mat-kiem-duyet-phap-ly.md](06-bao-mat-kiem-duyet-phap-ly.md).

## 6. Luồng API route đầy đủ

```
POST /api/reading
  │
  ├─ 1. Auth + validate input (zod)
  ├─ 2. Rate limit check                         → 429 nếu vượt
  ├─ 3. Kiểm duyệt câu hỏi (Haiku 4.5)           → chặn nếu crisis/medical/legal
  ├─ 4. RNG chọn lá — SERVER-SIDE, không tin client
  ├─ 5. Đọc Lớp Nền từ Postgres                  → trả về ngay trong response đầu
  │
  ├─ 6. Nếu là Đọc sâu:
  │     ├─ a. Trừ credits (atomic, ghi ledger)   → 402 nếu không đủ
  │     ├─ b. anthropic.messages.stream(...)
  │     ├─ c. Trả ReadableStream về client
  │     └─ d. after(): finalMessage() → lưu readings
  │            ├─ nếu stream lỗi → HOÀN credits + ghi ledger
  │            └─ ghi Sentry
  │
  └─ 7. Nếu là Đọc nhanh: trả Lớp Nền, kết thúc
```

Điểm quan trọng: **trừ credits trước khi gọi AI, hoàn lại nếu lỗi.** Không bao giờ gọi AI trước rồi trừ sau — user có thể đóng tab giữa chừng và bạn mất tiền API mà không thu được gì.

## 7. RNG rút bài

Rút bài **phải chạy server-side**. Nếu client tự random và gửi lên, user có thể chọn lá mình muốn — phá vỡ trải nghiệm và cho phép farm nội dung.

```ts
import { randomInt } from 'node:crypto'

export function drawCards(count: number): Draw {
  const deck = [...CARD_IDS]                    // 78 lá
  const drawn = []
  for (let i = 0; i < count; i++) {
    const idx = randomInt(deck.length)          // crypto, không dùng Math.random
    const [cardId] = deck.splice(idx, 1)        // rút không hoàn lại
    drawn.push({
      cardId,
      orientation: randomInt(2) === 0 ? 'upright' : 'reversed',
      position: i,
    })
  }
  return { cards: drawn }
}
```

> Dùng `crypto.randomInt`, không dùng `Math.random()` — không phải vì bảo mật mật mã, mà vì `Math.random()` trong V8 có thể cho phân phối kém khi gọi lượng lớn, và crypto không đắt hơn đáng kể ở quy mô này.

### 7.1 Ép hướng theo phân loại câu hỏi (chỉ Đọc sâu, 3 lá)

Quan sát từ boitarot.com.vn: với câu hỏi tình cảm nhạy cảm (vd "người yêu
cũ còn giữ tình cảm không"), họ ép cả bộ bài rút được cùng 1 chiều xuôi/ngược
thay vì random độc lập từng lá — tạo cảm giác diễn giải "nhất quán, có chủ
đích" hơn thay vì 3 lá ngẫu nhiên rời rạc về hướng.

**Khác với đối thủ, Ventus không so khớp câu hỏi bằng danh sách cố định**
(không khả thi — input tự do tiếng Việt có vô số cách diễn đạt cùng một ý).
Thay vào đó, mở rộng structured output của bước kiểm duyệt Haiku 4.5 đã có ở
§5.3 — model tự phân loại câu hỏi có thuộc nhóm cần "ép hướng" không, dựa
trên ngữ nghĩa thật thay vì so khớp chuỗi:

```ts
const Triage = z.object({
  category: z.enum(['ok', 'crisis', 'medical', 'legal', 'harmful', 'nonsense']),
  reason: z.string(),
  orientation_mode: z.enum(['independent', 'unified']),  // MỚI
})
```

`orientation_mode: 'unified'` cho câu hỏi dạng quan hệ/tình cảm cần cảm giác
nhất quán (vd "người ấy nghĩ gì về tôi"); `'independent'` cho mọi câu hỏi
khác — mặc định giữ hành vi hiện tại (random độc lập từng lá).

```ts
function drawCards(
  count: number,
  orientationMode: 'independent' | 'unified' = 'independent'
): Draw {
  const deck = [...CARD_IDS]
  const drawn = []
  const unifiedOrientation: Orientation =
    randomInt(2) === 0 ? 'upright' : 'reversed'   // chỉ dùng nếu unified

  for (let i = 0; i < count; i++) {
    const idx = randomInt(deck.length)
    const [cardId] = deck.splice(idx, 1)
    const orientation =
      orientationMode === 'unified'
        ? unifiedOrientation
        : (randomInt(2) === 0 ? 'upright' : 'reversed')
    drawn.push({ cardId, orientation, position: i })
  }
  return { cards: drawn }
}
```

> `orientationMode` luôn đến từ kết quả kiểm duyệt Haiku 4.5 chạy server-side
> ở bước trước, **không bao giờ** nhận trực tiếp từ client — cùng nguyên tắc
> "RNG server-side, không tin input phía client" đã nêu ở đầu §7.

### 7.2 Giao diện "tự chọn lá" an toàn (chỉ Đọc sâu, 3 lá)

Quan sát từ boitarot.com.vn: họ trải 40–60 lá (nhân bản từ 78 lá thật) để
user tự bấm chọn, cảm giác thật hơn so với chỉ bấm 1 nút "xáo bài". Nhưng
đọc source JS của họ cho thấy card id/tên thật đã được gắn vào từng phần tử
DOM **ngay khi dựng bộ bài**, trước khi user bấm — ai mở DevTools/Network
cũng đọc được toàn bộ kết quả sắp "rút ra", phá vỡ tính ngẫu nhiên và cho
phép chọn lá muốn có. Việc nhân bản 40–60 lá từ 78 lá thật chỉ để che bớt
cảm giác lặp, không giải quyết vấn đề gốc.

**Ventus giữ lại cảm giác "tự tay chọn từ một dải bài rộng", bỏ đi phần lộ
danh tính:**

1. Khi user bấm "Xào bài", server rút sẵn 3 lá + hướng bằng `drawCards(3,
   orientationMode)` ở §7.1 — đóng gói kết quả vào 1 token ký (HMAC, TTL vài
   phút), **không** trả nội dung thật về client.
2. Client hiện N vị trí lá úp giống hệt nhau (N tuỳ chọn khi build, ví dụ
   21–120 — không cần khớp con số 78 hay nhân bản card thật nào, vì không vị
   trí nào mang danh tính thật trước khi mở).
3. User bấm chọn 3 trong N vị trí, theo thứ tự bất kỳ.
4. Mỗi lần bấm, client gửi token (giữ nguyên, không đổi) tới
   `POST /api/reading/deep/reveal { token, revealIndex }` — server verify chữ ký,
   trả về đúng lá thứ `revealIndex` (1, 2, hoặc 3) trong 3 lá đã rút ở bước 1,
   **kèm luôn diễn giải Lớp Nền của đúng lá đó** (đọc `base_content` theo
   `(card_id, orientation, topic)`, $0 API — cùng cách `/api/reading` (4b)
   đã làm). **Vị trí user bấm trên UI không có quan hệ gì với lá nào bị
   lộ** — chỉ có thứ tự bấm (lần 1/2/3) mới quyết định.
5. Client hiện diễn giải Lớp Nền ngay sau mỗi lần reveal — **không trừ
   credits** ở bước này, đúng nguyên tắc "Đọc nhanh luôn $0" đã chốt ở §1
   phía trên.
6. Sau khi đủ 3 lần reveal, hiện nút riêng **"Đọc sâu cho câu hỏi của
   bạn"**. Chỉ khi user bấm nút này mới: trừ credits (atomic) → gọi Claude
   Sonnet 5 stream Lớp Cá nhân (dùng đúng câu hỏi + 3 lá đã reveal, xem
   §5.2) → lưu `readings`. Route riêng với bước 4
   (`POST /api/reading/deep/personal`, không phải
   `POST /api/reading/deep/reveal`) — tách theo đúng ranh giới free/paid,
   không gộp 2 việc "tiết lộ lá" và "gọi AI" vào 1 request.

> Vì client không bao giờ nhận danh tính lá thật trước khi reveal, không cần
> cơ chế nhân bản 78→40-60 lá của đối thủ để "che" identity — N vị trí hiển
> thị hoàn toàn tuỳ chỉnh theo mong muốn hình ảnh, tách rời khỏi bảo mật RNG.

### 7.3 Tài nguyên hình ảnh tạm thời cho §7.2

Khi build UI trải bài "tự chọn lá", được phép **tạm thời** dùng lại một số
ảnh của boitarot.com.vn làm placeholder (thay vì tự thiết kế ngay từ đầu),
quyết định ngày 2026-08-16 — **có điều kiện chặt**:

**Được dùng tạm** (đã copy sẵn vào `public/_placeholder-doi-thu/`, gitignore
— xem `.gitignore`, không commit/deploy):
- `card-back.jpg` — mặt sau lá bài, dùng cho N vị trí úp ở §7.2
- `bg-pattern.png`, `box-bg.png` — 2 pattern nền trang trí chung chung

**Không bao giờ dùng, kể cả tạm** (loại trừ có chủ đích, không nằm trong bộ
đã copy):
- Mọi ảnh logo/wordmark của họ (`boitarot-*.png`, `favicon-boitarot-*.png`)
  — nhận diện thương hiệu, rủi ro nhầm lẫn thương hiệu
- Ảnh chân dung 3 "tarot reader" của họ (`kim-ngan-*`, `ngoc-lan.jpg`,
  `tuong-vy.jpg`) — ảnh người thật/gắn định danh, rủi ro quyền hình ảnh cao
  nhất trong toàn bộ tài nguyên, không liên quan gì tới UI trải bài

**Bắt buộc trước khi deploy** (Giai đoạn 10, xem `08-timeline.md`): thay
toàn bộ 3 file trên bằng asset thật của Ventus, xoá thư mục
`public/_placeholder-doi-thu/`. Đây không phải asset của Ventus và không
public domain như bộ Rider-Waite ở `public/cards/` (nguồn Wikimedia Commons
đã xác minh — xem `08-timeline.md` Giai đoạn 1) — giữ lại tới lúc ship là vi
phạm chính nguyên tắc đã áp dụng cho bộ ảnh lá bài.

## 8. Đo lường trước khi ước tính

**Không dùng `tiktoken`** — đó là tokenizer của OpenAI, đếm sai cho Claude (thường thiếu 15–20%, sai nhiều hơn với tiếng Việt).

```ts
const { input_tokens } = await client.messages.countTokens({
  model: 'claude-sonnet-5',
  system: PERSONA_AND_FORMAT,
  messages: [{ role: 'user', content: buildUserTurn(sampleDraw, sampleQuestion) }],
})
```

Chạy trên ~20 mẫu thật trước khi chốt dự toán ở [07](07-du-toan-chi-phi.md).

## 9. Xử lý lỗi

Dùng typed exception của SDK, **không** so khớp chuỗi thông báo lỗi:

```ts
import Anthropic from '@anthropic-ai/sdk'

try {
  const msg = await stream.finalMessage()
} catch (e) {
  if (e instanceof Anthropic.RateLimitError) {
    // 429 — SDK đã tự retry 2 lần; tới đây là hết. Hoàn credits, báo user thử lại.
  } else if (e instanceof Anthropic.APIConnectionError) {
    // Mất mạng — hoàn credits
  } else if (e instanceof Anthropic.APIError) {
    // Lỗi khác — hoàn credits, ghi Sentry kèm e.status
  }
  throw e
}
```

**Mọi nhánh lỗi đều phải hoàn credits.** Không có `catch {}` rỗng — theo `.claude/rules/code-style.md`.

Ngoài ra kiểm tra `stop_reason`:

| `stop_reason` | Xử lý |
|---|---|
| `end_turn` | Bình thường |
| `max_tokens` | Bị cắt giữa chừng — tăng `max_tokens`, ghi Sentry (đây là bug cấu hình) |
| `refusal` | Model từ chối vì lý do an toàn. **Hoàn credits**, hiện thông báo lịch sự. Kiểm tra `stop_reason` **trước** khi đọc `content` — nếu không, code đọc `content[0]` sẽ crash |

## 10. Đặt giới hạn chi tiêu

Vào Anthropic Console đặt **spend limit + cảnh báo email** ngay từ ngày đầu. Một lỗi vòng lặp hoặc một đợt bot cào có thể đốt ngân sách trong một đêm. Đây là việc 5 phút, đừng bỏ qua.

---

**Tiếp theo:** [04-database-schema.md](04-database-schema.md)
