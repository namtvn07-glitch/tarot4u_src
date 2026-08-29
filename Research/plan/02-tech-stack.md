# 02 — Tech Stack & Hạ tầng

## 1. Stack

| Nhóm | Công nghệ | Vai trò | Ghi chú |
|---|---|---|---|
| Framework | Next.js (App Router) + React | SSR/SSG cho SEO, API routes | 78 trang lá bài dùng SSG |
| Animation | Framer Motion | Xáo bài, lật bài | Xem §4 về `prefers-reduced-motion` |
| Styling | Tailwind CSS | UI nhất quán | Token định nghĩa trong `tailwind.config` — xem `.claude/rules/design-system.md` |
| Backend | Next.js API Routes (Node runtime) | Gọi Claude, PayOS, logic credits | **Không dùng Edge runtime** — xem §3 |
| DB & Auth | Supabase (Postgres) | User, lịch sử, đơn hàng, cache nội dung | |
| AI | Claude API (`@anthropic-ai/sdk`) | Sinh diễn giải | Xem [03](03-kien-truc-ai.md) |
| Thanh toán | PayOS (VietQR) | QR + webhook | |
| Hosting | Vercel | Deploy, CI/CD | **Pro bắt buộc** — xem §3 |
| Ảnh lá bài | Rider-Waite (public domain) | 78 ảnh | Static assets, **không** để Supabase Storage |
| Analytics | Plausible hoặc GA4 | Hành vi người dùng | |
| Error tracking | Sentry | Bắt lỗi runtime + webhook | Bắt buộc với luồng thanh toán |

## 2. Lý do cho từng dependency

Theo `.claude/rules/project.md`: *"No dependency added without stating why."*

| Package | Giải quyết vấn đề gì | Thay thế được không |
|---|---|---|
| `@anthropic-ai/sdk` | Client chính thức: streaming, retry tự động, typed errors, prompt caching | Có thể dùng `fetch` thô nhưng mất retry/backoff và type safety |
| `framer-motion` | Animation xáo/lật bài với spring physics và orchestration | CSS animation làm được nhưng orchestration nhiều lá + interrupt sẽ rất khổ |
| `@supabase/ssr` | Auth session trong App Router (cookie-based) | Bắt buộc nếu dùng Supabase Auth với SSR |
| `zod` | Validate input API route + schema cho structured output | Có thể viết tay nhưng dễ sót |
| `@sentry/nextjs` | Error tracking, đặc biệt cho webhook thanh toán | Không có thì mù hoàn toàn ở luồng tiền |
| `@upstash/ratelimit` | Rate limit có state trên serverless | Chỉ thêm ở Phase 2 — Phase 1 dùng bảng Postgres, không cần dependency mới |

> Cố ý **không** dùng: state management library (dùng React state + Server Components là đủ), form library (form ở đây rất đơn giản), UI component library (design là deliverable, tự viết).

## 3. Cấu hình Vercel — 3 điểm dễ vấp

### 3.1 Hobby cấm mục đích thương mại

Ngay khi có nút thanh toán, bạn cần **Vercel Pro (~$20/tháng)**, kể cả traffic bằng 0. Đây không phải khuyến nghị hiệu năng mà là điều khoản dịch vụ.

### 3.2 Function timeout vs. streaming

| Gói | Timeout mặc định | Với Fluid Compute |
|---|---|---|
| Hobby | 10s | — |
| Pro | 60s | tối đa 800s |

Diễn giải sâu 3 lá bằng Sonnet 5 có thể mất 20–45s. **Bật Fluid Compute** và đặt `maxDuration` tường minh:

```ts
// app/api/reading/route.ts
export const runtime = 'nodejs'      // KHÔNG dùng 'edge': SDK cần Node streams
export const maxDuration = 120       // giây
```

### 3.3 Ghi DB sau khi stream xong

Nếu bạn `await` việc ghi `readings` **trước** khi trả stream, user chờ thêm. Nếu ghi **trong khi** stream mà không giữ context, serverless function có thể bị đóng trước khi ghi xong → mất record.

```ts
import { after } from 'next/server'

export async function POST(req: Request) {
  const stream = anthropic.messages.stream({ /* ... */ })

  // Đăng ký việc ghi DB chạy SAU khi response đã gửi xong
  after(async () => {
    const final = await stream.finalMessage()
    await saveReading(final)
  })

  return new Response(stream.toReadableStream())
}
```

> `after()` là API của Next.js để chạy việc sau khi response kết thúc. Nếu phiên bản Next.js chưa có, dùng `waitUntil` từ `@vercel/functions`.

## 4. Cấu hình Supabase

### 4.1 Free tier tự pause sau 7 ngày không hoạt động

Chỉ dùng cho giai đoạn dev/test. **Lên Pro (~$25/tháng) trước khi launch.** Một lần pause ở production là mất khách vĩnh viễn.

### 4.2 Egress — đừng để ảnh trong Storage

Cám dỗ tự nhiên là để 78 ảnh lá bài trong Supabase Storage cạnh dữ liệu. Đừng.

| Cách | Chi phí | Tốc độ |
|---|---|---|
| Supabase Storage | Tính egress theo GB — khoản dễ bùng nhất ở Phase 3 | Không có CDN edge mặc định |
| `/public` trong repo → Vercel CDN | Nằm trong bandwidth Vercel | Edge cache toàn cầu |

78 ảnh × ~200KB = ~16MB. Để thẳng trong `/public/cards/`, dùng `next/image` với `width`/`height` tường minh (chống layout shift theo `.claude/rules/design-system.md`).

### 4.3 Connection pooling

Serverless tạo nhiều connection ngắn. Dùng **connection string của Supavisor (port 6543, transaction mode)** cho API routes, không dùng direct connection (port 5432).

## 5. Biến môi trường

```bash
# Public (an toàn để lộ ra client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=

# Server-only — KHÔNG BAO GIỜ có tiền tố NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=      # chỉ dùng trong webhook + thao tác credits
ANTHROPIC_API_KEY=
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=             # dùng để verify chữ ký webhook
SENTRY_DSN=
CRON_SECRET=                    # bảo vệ endpoint batch/cron
```

**Kiểm tra bắt buộc trước khi commit lần đầu:** `.env*` phải nằm trong `.gitignore`. Hook `.claude/hooks/guard-paths.sh` là lưới an toàn, không phải giấy phép bất cẩn.

Validate env lúc khởi động để lỗi cấu hình nổ sớm, không nổ giữa luồng thanh toán:

```ts
// lib/env.ts
import { z } from 'zod'

export const env = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  PAYOS_CHECKSUM_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // ...
}).parse(process.env)
```

## 6. Ảnh lá bài — ghi chú bản quyền

Bộ Rider–Waite–Smith (1909), tranh của Pamela Colman Smith (mất 1951). Bản quyền Việt Nam là **đời tác giả + 50 năm** → hết hạn năm 2001. **Public domain, dùng thoải mái.**

Lưu ý: bản *scan* thương mại có thể có claim riêng của nhà xuất bản. Lấy từ nguồn rõ ràng free:
- Wikimedia Commons (category "Rider–Waite tarot deck")
- sacred-texts.com

Nếu sau này tự thiết kế bộ riêng thì đó là lợi thế khác biệt — nhưng không phải việc của v1.

## 7. Cấu trúc thư mục đề xuất

```
app/
  (marketing)/
    page.tsx                    # trang chủ
    la-bai/[slug]/page.tsx      # 78 trang SSG
  (app)/
    trai-bai/page.tsx
    ca-nhan/page.tsx
    nap-credits/page.tsx
  api/
    reading/route.ts            # gọi Claude, streaming
    orders/route.ts             # tạo đơn PayOS
    webhooks/payos/route.ts     # nhận webhook
    cron/warmup/route.ts        # batch sinh nội dung nền
components/
  card/                         # CardFace, CardBack, CardSpread — component + style + test cạnh nhau
  reading/
lib/
  anthropic/                    # client, prompts, batch
  supabase/
  payos/
  credits/                      # trừ/cộng credits, luôn đi qua đây
data/
  cards.json                    # 78 lá — KHÔNG để trong DB
public/
  cards/                        # 78 ảnh
```

> Không dùng barrel file (`index.ts`) bên trong feature — chỉ ở ranh giới package. Xem `.claude/rules/code-style.md`.

---

**Tiếp theo:** [03-kien-truc-ai.md](03-kien-truc-ai.md)
