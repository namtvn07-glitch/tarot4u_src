# Giai đoạn 4c — Đọc sâu (3 lá, trả phí, AI cá nhân hoá)

Tính năng trả phí cốt lõi của sản phẩm: user gõ câu hỏi thật, chọn 3 lá từ
một dải bài rộng, nhận diễn giải Lớp Nền tức thì + Lớp Cá nhân do Claude
Sonnet 5 viết riêng cho câu hỏi đó, streaming. Đây là lần đầu dự án gọi AI
runtime (mọi thứ trước đó là batch/sinh sẵn) và lần đầu có luồng trả phí
thật chạm tới credits.

## Decisions Needed From You
> [!IMPORTANT]
> - **Chi phí credits/lượt Đọc sâu 3 lá** — chưa có con số chính thức nào
>   trong `Research/plan/`. Đề xuất **2 credits** (Lớp Cá nhân 3 lá dài
>   ~gấp đôi 1 lá theo chi phí token ở `03-kien-truc-ai.md §4.6`). Cần bạn
>   chốt số thật trước khi hardcode vào `debit_reading(..., p_cost)`.
> - **Số vị trí hiển thị (N) trong dải bài "tự chọn"** — đề xuất **24**
>   (đủ cảm giác "dải rộng", vẫn giữ touch target ≥44×44px ở 375px). Đối
>   thủ dùng 40–60 nhưng vì lý do khác (che identity đã lộ sẵn — không áp
>   dụng cho thiết kế an toàn của Ventus, xem `03-kien-truc-ai.md §7.2`).
> - **Không có `ANTHROPIC_API_KEY` thật trong môi trường dev hiện tại** —
>   giống tình huống Giai đoạn 3 với Supabase/Sentry (env optional, code
>   không crash khi thiếu). Verify cho phần gọi AI thật sẽ dừng ở
>   lint/typecheck/build + đọc kỹ code, **không** chạy được 1 lượt thật cho
>   tới khi có key. Bạn có key để tôi test thật không, hay chấp nhận giới
>   hạn này cho lần build này?

## Approach
Xây theo 5 lớp phụ thuộc: (1) **lib thuần** (RNG mở rộng, HMAC token,
Anthropic client, kiểm duyệt, prompt) — không phụ thuộc route/UI, test được
độc lập; (2) **3 API route** dưới `src/app/api/reading/deep/` — tách riêng
hoàn toàn khỏi `/api/reading` cũ (route đó ghi rõ "Đọc sâu là route/logic
riêng của 4c", giữ đúng lời hứa đó); (3) **UI component** — 1 orchestrator
(`DeepReadingStage`) composes 3 component con theo đúng state machine đã
spec ở `01-san-pham-pham-vi.md §5.2`; (4) **route** `/doc-sau`; (5) **nội
dung thật**. Auth-check và credit-debit viết đúng thật ngay từ lớp API
(không mock) — quyết định đã chốt qua AskUserQuestion, xem task.md
Assumptions.

**Considered and rejected**
- Gộp shuffle+reveal+personal thành 1 API route với nhiều `action` param —
  rejected: 3 route riêng map đúng 3 bước bảo mật khác nhau (rút bài kín →
  tiết lộ từng lá → trừ tiền+gọi AI), dễ audit hơn, đúng tinh thần route
  `/api/reading` cũ đã tách theo tier thay vì nhánh `if` trong 1 route.
- Vercel AI SDK (`ai` package) cho streaming — rejected: 1 use case duy
  nhất, tự viết `ReadableStream` + NDJSON ngắn hơn học 1 abstraction mới,
  và giữ đúng nguyên tắc "không thêm dependency mà không nêu lý do".
- Cho `debit_reading` chạy ngay sau khi chọn đủ 3 vị trí (tự động, không
  cần bấm gì thêm) — **rejected sau review với user 2026-08-16**: bản đầu
  của plan này làm vậy, nhưng đúng thiết kế là diễn giải Lớp Nền của cả 3
  lá phải hiện ra **miễn phí trước**, credits chỉ trừ khi user chủ động
  bấm nút "Đọc sâu" riêng — đúng phễu chuyển đổi "xem free trước, trả tiền
  cho cá nhân hoá" đã chốt từ `03-kien-truc-ai.md §1`. Đây là lý do có 2
  route riêng (`reveal` free, `personal` paid) thay vì 1 route `complete`
  duy nhất.
- Route `/api/reading/deep/reveal` yêu cầu server tự kiểm tra thứ tự reveal
  đã đủ 3 trước khi cho `personal` chạy — rejected: token đã tự chứa đúng 3
  lá cố định, gọi `personal` sớm chỉ khiến UI hiện thiếu lá đã "mở", không
  phải lỗ hổng bảo mật (không lộ thêm gì ngoài những gì token vốn đã có
  cho URL user); đơn giản hoá server, ràng buộc thứ tự đủ ở UI (chỉ hiện
  nút "Đọc sâu" sau khi client tự đếm đủ 3 lần reveal thành công).

## Proposed Changes

### Lib / nền tảng

#### [MODIFY] `package.json`
- `pnpm add @anthropic-ai/sdk@latest` — cài bản mới nhất tại thời điểm
  build thay vì hardcode số version đoán (skill `claude-api` không cho số
  version cụ thể, chỉ xác nhận package name và API shape). SDK chính thức
  Anthropic, cần cho `messages.stream()` + `messages.parse()` (kiểm duyệt
  structured output) + helper `zodOutputFormat` (import từ
  `@anthropic-ai/sdk/helpers/zod`). Không có SDK khác thay thế hợp lý cho
  Claude.

#### [MODIFY] `src/lib/env.ts`
- Thêm vào schema: `ANTHROPIC_API_KEY: z.string().min(1)`,
  `READING_TOKEN_SECRET: z.string().min(32)` (secret ký HMAC cho token
  "pending draw" ở §7.2 — không phải service-role key, riêng biệt để xoay
  vòng độc lập nếu lộ).
- **Thêm 2 biến cấu hình được (không phải secret), có default = số đề
  xuất, để chỉnh sau này không cần sửa code**: `DEEP_READING_COST` —
  `z.coerce.number().int().positive().default(2)`; `DEEP_SPREAD_SLOTS` —
  `z.coerce.number().int().positive().default(24)`. Server-only (không
  cần `NEXT_PUBLIC_`) — client luôn nhận `slots` qua response của
  `shuffle`, không tự hardcode.
- Giữ nguyên pattern lazy-parse hiện có — không parse eager, tránh lặp lại
  đúng bug đã vá ở Giai đoạn 3 (`pnpm build` fail khi thiếu biến môi
  trường chưa cần).

#### [NEW] `src/lib/reading.ts` (MODIFY, thêm bên cạnh export cũ)
- `export type OrientationMode = "independent" | "unified"`
- `export function drawCards(count: number, mode: OrientationMode = "independent"): Draw[]`
  — implement đúng code sketch ở `03-kien-truc-ai.md §7.1` (rút không hoàn
  lại từ `CARD_IDS`, `crypto.randomInt`, hướng chung nếu `unified`).
  **Không sửa `drawCard()` hiện có** (4b free vẫn dùng nguyên, tránh review
  lại luồng đang chạy tốt).
- `export const DEEP_SPREAD_SIZE = 3` (số lá rút — cố định theo spread
  "three_card", không cấu hình qua env vì đổi giá trị này kéo theo đổi cả
  schema/UI, không phải tinh chỉnh vận hành)
- `export const DeepReadingRequestSchema = z.object({ topic: TopicSchema, question: z.string().trim().min(1).max(300) })`
- **`DEEP_SPREAD_SLOTS` và `DEEP_READING_COST` đọc từ `env.ts`** (xem mục
  env ở trên), không phải const tĩnh trong file này — route `shuffle` đọc
  trực tiếp từ `env`, không qua `reading.ts`.

#### [NEW] `src/lib/reading-token.ts`
- `signDrawToken(payload: { userId: string; topic: Topic; question: string; cards: Draw[] }): string`
  — JSON.stringify payload + `exp` (now + 10 phút) → base64url → HMAC-SHA256
  bằng `node:crypto` `createHmac('sha256', env.READING_TOKEN_SECRET)` →
  trả `${base64Payload}.${signatureHex}`. Không dùng thư viện JWT ngoài —
  cùng triết lý "native trước, dependency sau" như `crypto.randomInt` đã
  dùng.
- `verifyDrawToken(token: string): DrawTokenPayload | null` — tách theo
  `.`, verify HMAC bằng `crypto.timingSafeEqual` (chống timing attack),
  check `exp`, trả `null` nếu sai chữ ký/hết hạn thay vì throw (caller
  quyết định response code).

#### [NEW] `src/lib/anthropic.ts`
- `export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })`
  — 1 instance dùng chung cho `moderation.ts` và route `personal`.

#### [NEW] `src/lib/moderation.ts`
- `TriageSchema` — đúng enum đã thêm `orientation_mode` ở
  `03-kien-truc-ai.md §7.1`: `category: z.enum(['ok','crisis','medical','legal','harmful','nonsense'])`,
  `reason: z.string()`, `orientation_mode: z.enum(['independent','unified'])`.
- `TRIAGE_SYSTEM` — nguyên văn từ `06-bao-mat-kiem-duyet-phap-ly.md §3.2`,
  cộng thêm 1 câu hướng dẫn phân loại `orientation_mode` (câu hỏi quan hệ
  tình cảm cụ thể → `unified`, còn lại → `independent`).
- `triageQuestion(question: string): Promise<Triage>` — gọi
  `anthropic.messages.parse({ model: 'claude-haiku-4-5', max_tokens: 200, system: TRIAGE_SYSTEM, messages: [...], output_config: { format: zodOutputFormat(TriageSchema) } })`
  (helper `zodOutputFormat` từ `@anthropic-ai/sdk/helpers/zod`, đã xác minh
  qua skill `claude-api` — đây đúng là cách hiện tại, không phải suy đoán).
  **Không** truyền `effort` hay `thinking` (Haiku 4.5 không hỗ trợ `effort`
  — lỗi 400 nếu truyền; không set `thinking` thì mặc định không suy luận,
  đúng ý — kiểm duyệt là phân loại nhanh, không cần suy luận nhiều bước).
  **Guard bắt buộc:** `response.parsed_output` có thể là `null` nếu parse
  thất bại (SDK không tự throw) — check `null` và coi như lỗi hệ thống
  (Sentry + trả lỗi 500), không bao giờ giả định luôn có giá trị.

#### [NEW] `src/lib/ai/deep-reading-prompt.ts`
- `PERSONAL_LAYER_SYSTEM` — ghép đúng 4 khối theo thứ tự ổn định→biến động
  ở `03-kien-truc-ai.md §5.1` (persona, ranh giới an toàn, quy tắc định
  dạng, quy tắc nội dung), `cache_control: { type: 'ephemeral' }` ở cuối
  khối — **nhưng knob bật/tắt cache để trống theo Phase** (Phase 1 tắt,
  xem §4.4 — thêm biến `ENABLE_PROMPT_CACHE` đơn giản, mặc định `false`).
- `buildUserTurn(cards: RevealedCard[], question: string): string` — đúng
  format ở §5.2 (chủ đề, danh sách lá + từ khoá, câu hỏi, hướng dẫn không
  lặp lại Lớp Nền).

### API routes

#### [NEW] `src/app/api/reading/deep/shuffle/route.ts`
- `export const runtime = "nodejs"`
- POST: parse `DeepReadingRequestSchema` → `requireUser()` (helper mới,
  xem dưới) → 401 nếu chưa đăng nhập → `check_rate_limit` RPC (key
  `user:<id>`, cửa sổ hợp lý vd 10 lượt/giờ) → 429 nếu vượt →
  `triageQuestion(question)` → nếu `category !== 'ok'`: trả
  `{ blocked: true, category }` (client render `CrisisResourceNotice` hoặc
  thông báo tương ứng bảng ở `06 §3.2`), **không** rút bài, không tạo
  token → nếu `ok`: `drawCards(3, orientation_mode)` →
  `signDrawToken({ userId, topic, question, cards })` → trả
  `{ token, slots: env.DEEP_SPREAD_SLOTS }`.

#### [NEW] `src/app/api/reading/deep/reveal/route.ts`
- POST `{ token, revealIndex: 0|1|2 }` → `verifyDrawToken` → 401/410 nếu
  null (hết hạn/sai) → lấy `cards[revealIndex]` → merge với
  `getCardById()` (ảnh, tên) **+ query `base_content` cho đúng
  `(cardId, orientation, topic)` của lá đó** (cùng cách `/api/reading` 4b
  đã làm) → trả `{ cardId, nameVi, image, orientation, base: { body, summary, keywords } }`.
  **Đây vẫn là Đọc nhanh — không ghi DB, không gọi `debit_reading`, không
  đụng credits.** Route này là ranh giới free, không phải bước trung gian
  của luồng trả phí.

#### [NEW] `src/app/api/reading/deep/personal/route.ts`
- Trigger **duy nhất** bởi nút "Đọc sâu cho câu hỏi của bạn" trên UI — sau
  khi client đã gọi `reveal` đủ 3 lần và hiện xong Lớp Nền của cả 3 lá.
  Đây là route **duy nhất trong toàn bộ 4c** chạm tới credits và gọi AI
  thật.
- POST `{ token }` → `verifyDrawToken` → `requireUser()` (recheck, token
  không tự chứng minh session còn hiệu lực) → **guard**: `userId` trong
  token phải khớp user hiện tại (chặn dùng token của người khác) →
  `readingId = crypto.randomUUID()` → `debit_reading(userId, readingId, env.DEEP_READING_COST)`
  qua `supabaseAdmin.rpc` → bắt lỗi `insufficient_credits` → 402 → dựng
  `ReadableStream` (không cần gửi lại `base` — client đã có từ 3 lần
  `reveal`) → gọi
  `anthropic.messages.stream({ model: 'claude-sonnet-5', max_tokens: 1500, thinking: { type: 'disabled' }, output_config: { effort: 'low' }, system: PERSONAL_LAYER_SYSTEM, messages: [...] })`
  — **đã xác minh qua skill `claude-api`**: Sonnet 5 mặc định BẬT adaptive
  thinking khi không truyền `thinking` (khác Opus 4.8 trở về trước), nên
  bắt buộc phải truyền tường minh `thinking: { type: 'disabled' }` để tắt —
  không được bỏ qua param này như dự định ban đầu. Đọc text bằng
  `for await (const event of stream)`, forward mỗi
  `event.type === 'content_block_delta' && event.delta.type === 'text_delta'`
  thành dòng `{"type":"delta","text":event.delta.text}\n` → sau khi stream
  kết thúc: `const final = await stream.finalMessage()` → check
  `final.stop_reason` (`refusal` → đọc `final.stop_details?.category` +
  `refund_reading` + Sentry; `max_tokens` → Sentry cảnh báo cấu hình) →
  lấy token thật từ `final.usage.{input_tokens,output_tokens}` (không đoán)
  → lưu `readings` (topic, spread='three_card',
  tier='deep', cards_drawn, question, personal_body, model, input_tokens,
  output_tokens) → enqueue dòng cuối `{"type":"done","readingId":...}\n`
  hoặc `{"type":"error",...}\n` nếu lỗi giữa chừng + gọi `refund_reading`.
  Lưu ý khi ghi `cards_drawn`: dùng đúng shape snake_case đã tài liệu ở
  `04-database-schema.md §2.3` (`{card_id, orientation, position}[]`), không
  giữ nguyên camelCase (`cardId`) từ `Draw` type nội bộ — map lại trước khi
  insert, tránh lệch quy ước cột JSONB so với schema doc.

#### [NEW] `src/lib/auth.ts`
- `requireUser(): Promise<{ id: string } | null>` — dùng
  `createClient()` (anon, đã có) `.auth.getUser()`, trả `null` nếu chưa
  đăng nhập thay vì throw — caller (route) tự quyết 401. Helper dùng
  chung cho cả 3 route trên, tránh lặp code.

### UI Components

#### [NEW] `src/components/safety/CrisisResourceNotice.tsx`
- Props: `category: 'crisis' | 'medical' | 'legal' | 'harmful' | 'nonsense'`.
- Nội dung **đúng nguyên văn** bảng + đoạn văn ở
  `06-bao-mat-kiem-duyet-phap-ly.md §3.2/§3.3` (bao gồm 3 số hotline đã xác
  minh: Ngày Mai 0963 061 414, 111, Cấp cứu 115 cho `crisis`).
- **Không có CTA thương mại, không link nạp credits** — đúng yêu cầu §3.3.
- Semantic: `role="status"` hoặc `aria-live="polite"` tuỳ ngữ cảnh xuất
  hiện (đây là kết quả của một hành động submit, không phải toast tự
  động — dùng heading + đoạn văn thường, focus chuyển tới heading khi hiện,
  giống pattern `#result-heading` đã có ở `ResultPanel`).
- Thiết kế để Giai đoạn 7 tái dùng ở route riêng — component thuần, không
  phụ thuộc gì vào state của 4c.

#### [NEW] `src/components/reading/DeepQuestionForm.tsx`
- Tái dùng đúng pattern nút chủ đề 5 ô của `TopicPicker.tsx` (không tạo
  biến thể mới — "Variants over forks").
- `<textarea>` câu hỏi, `maxLength={300}`, đếm ký tự còn lại (live, không
  cần `aria-live` vì gắn liền input, đọc được qua duyệt bàn phím bình
  thường), `<label>` thật (theo `accessibility.md` — Forms gate).
- Nút "Xào bài" disabled tới khi có cả chủ đề + câu hỏi không rỗng.

#### [NEW] `src/components/reading/CardSpreadPicker.tsx`
- Nhận `slots: number` (24), render N vị trí `<button>` (không phải `<div onClick>`
  — Semantics First), mỗi nút ảnh mặt sau
  (`/_placeholder-doi-thu/card-back.jpg` theo §7.3, kích thước tối thiểu
  44×44px kể cả ở 375px — **hard gate**, tính toán grid ở bước build).
- Click → gọi `/api/reading/deep/reveal`, animate lật (tái dùng đúng
  pattern `rotateY` 3D + `backfaceVisibility` đã có ở `ReadingStage.tsx`
  `FlipCard`, không phát minh lại) → response đã kèm `base` (Lớp Nền của
  đúng lá đó) → **hiện diễn giải ngay dưới lá vừa lật, miễn phí** (tái
  dùng layout gần giống `ResultPanel` nhưng thu nhỏ cho ngữ cảnh 1-trong-3
  lá — kéo phần chung ra nếu hợp lý, quyết định cụ thể lúc build) → cập
  nhật danh sách đã lộ.
- Khi đủ 3 lần reveal + đã hiện đủ 3 Lớp Nền → hiện nút
  **"Đọc sâu cho câu hỏi của bạn"** ngay trong component này (hoặc emit
  callback để `DeepReadingStage` render nút — quyết định cụ thể lúc build,
  không ảnh hưởng API) → bấm nút mới gọi `/api/reading/deep/personal` và
  chuyển sang `DeepResultStream`.
- Đường `prefers-reduced-motion`: cross-fade thay vì `rotateY`, đúng
  pattern đã có.

#### [NEW] `src/components/reading/DeepResultStream.tsx`
- Chỉ mount **sau** khi user đã bấm "Đọc sâu" — nhận `ReadableStream`
  response từ `/api/reading/deep/personal` → đọc bằng
  `response.body.getReader()` + `TextDecoder`, tách theo `\n`,
  `JSON.parse` từng dòng, cập nhật state theo `type`.
- **Không** còn xử lý dòng `base` — Lớp Nền đã hiện xong ở `CardSpreadPicker`
  trước đó. Component này chỉ render text Lớp Cá nhân nối dần khi nhận
  `delta` — vùng chứa cần `aria-live="polite"` (nội dung xuất hiện không
  do page reload, đúng gate "Dynamic Content" ở `accessibility.md`) nhưng
  **throttle** cập nhật live-region (không bắn mỗi ký tự — bài học
  "live-region spam" đã bị bắt ở `/design-review` Giai đoạn 2, xem
  `08-timeline.md` Giai đoạn 2).
- `done` → dừng loading state. `error` → thông báo lỗi + nút thử lại (đã
  trừ credits thì đã hoàn tự động phía server, copy phải nói rõ điều này
  để user không hoang mang — 3 lá + Lớp Nền đã xem vẫn còn nguyên, không
  mất gì ngoài credits đã hoàn).

#### [NEW] `src/components/reading/DeepReadingStage.tsx`
- Orchestrator, state machine: `question → shuffling → picking (free, reveal từng lá + Lớp Nền) → readyForDeep (đủ 3 lá, hiện nút) → personalStreaming (paid) → success | blocked | error`.
  **Ranh giới free/paid nằm giữa `readyForDeep` và `personalStreaming`** —
  đúng 1 điểm duy nhất trong toàn bộ state machine chạm credits.
- Compose 3 component trên + gọi 3 API route theo đúng thứ tự spec.
- Nếu `requireUser` phía server trả 401 khi vào `/doc-sau` (chưa đăng
  nhập) — xem route page bên dưới, xử lý ở tầng page, không ở component
  này.

### Pages / routes

#### [NEW] `src/app/doc-sau/page.tsx`
- Server Component: `createClient()` → `auth.getUser()`. Nếu **không** có
  user: render trạng thái "Cần đăng nhập" — copy thật, ví dụ: *"Đọc sâu
  cần tài khoản để lưu lịch sử và quản lý credits. Trang đăng nhập đang
  được hoàn thiện — quay lại sau."* + link về `/`. Đây là trạng thái
  **thật**, không phải TODO ẩn — đúng 1 trong 4 trạng thái bắt buộc
  (loading/empty/error/success), ở đây đóng vai "empty/chưa sẵn sàng".
- Nếu có user: render `DeepReadingStage`.
- Breadcrumb theo đúng pattern `trai-bai/page.tsx` đã có.

### Content
- Copy thông báo chặn theo category — lấy nguyên văn bảng
  `06-bao-mat-kiem-duyet-phap-ly.md §3.2` cho `medical`/`legal`/`harmful`/`nonsense`;
  `crisis` dùng `CrisisResourceNotice`.
- Copy lỗi 402 (không đủ credits): *"Bạn không đủ credits cho lượt Đọc sâu
  này. Trang nạp credits đang được hoàn thiện — quay lại sau."* (Giai đoạn
  6 chưa có, giống pattern trang đăng nhập ở trên — trung thực, không giả
  vờ có nút hoạt động).
- Placeholder ô câu hỏi: ví dụ trung tính, không gợi ý câu hỏi "strict" nào
  (không copy danh sách câu hỏi cứng của đối thủ — đã quyết định ở
  `03-kien-truc-ai.md §7.1`).

## Accessibility Plan
- Semantic: `<button>` cho mọi lá trong dải chọn (không `<div onClick>`),
  `<label>` thật cho ô câu hỏi, heading nhận focus khi có kết quả (đúng
  pattern `#result-heading` hiện có).
- Keyboard path: Tab qua 5 chủ đề → ô câu hỏi → nút Xào bài → Tab qua N
  nút lá trong dải chọn (44×44px tối thiểu, kể cả 375px) → nút "Xem ý
  nghĩa" xuất hiện sau khi chọn đủ 3 → vùng kết quả streaming.
- `aria-live="polite"` cho vùng streaming, **throttle** update (bài học đã
  có, không lặp lại lỗi live-region spam).
- Contrast: mọi màu mới phải dùng token có sẵn (`--color-accent`,
  `--color-surface-raised`, `--color-metal`...) — không thêm token màu mới
  trừ khi buộc phải (chưa thấy lý do buộc phải ở component này).
- `prefers-reduced-motion`: dải bài lật bằng cross-fade thay `rotateY`,
  đúng pattern đã kiểm chứng ở 4b.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/lib/env.ts` | Mọi route đọc `env.*` | Thấp — chỉ thêm field mới, lazy-parse nên không phá route cũ chưa cần key AI |
| `src/lib/reading.ts` | `src/app/api/reading/route.ts` (4b, dùng `drawCard`/`ReadingRequestSchema` cũ) | Thấp — chỉ thêm export mới, không sửa export cũ |
| `package.json` | build/CI | Thấp — 1 dependency mới, có lý do rõ |
| `src/components/reading/*` mới | Không component cũ nào import — toàn bộ file mới | Không có |
| `src/app/doc-sau/` | Route mới, không ai link tới chưa (chưa thêm CTA từ `/trai-bai` — đúng quyết định đã ghi ở `phase-4b-trai-bai/task.md`: "không dựng CTA trỏ tới tính năng chưa tồn tại") | Cân nhắc: có nên thêm link/CTA từ trang chủ hoặc `/trai-bai` sang `/doc-sau` trong plan này không — **đề xuất: không**, giữ nguyên lý do 4b đã ghi (auth chưa xong), thêm CTA khi Giai đoạn 5 xong |

## Verification Plan
### Automated
- `pnpm lint`, `npx tsc --noEmit`, `pnpm build` — cả 3 phải xanh.
- Không có test runner trong dự án — không thêm framework test mới chỉ
  cho task này (ngoài phạm vi, chưa có tiền lệ).

### Manual
1. `pnpm dev` — verify từng route bằng `curl`/Playwright request trực
   tiếp (không qua UI thật vì chưa có trang đăng nhập): `shuffle` trả 401
   khi không có cookie session; `reveal`/`personal` trả lỗi hợp lý với
   token giả/hết hạn. Xác nhận riêng: gọi `reveal` 3 lần với token hợp lệ
   **không** làm `profiles.credits` đổi (query DB trước/sau) — chỉ
   `personal` mới được phép đổi.
2. Kiểm duyệt: gọi `triageQuestion` trực tiếp (script/console) với vài câu
   mẫu mỗi category (`crisis`, `medical`, `nonsense`, `ok`) — xác nhận
   phân loại đúng, không trừ credits ở nhánh chặn.
3. UI `CardSpreadPicker` ở 375/768/1280/1920px — đếm touch target thật
   bằng DevTools, không đoán.
4. `prefers-reduced-motion` thật (Playwright context) cho dải bài + stream.
5. Cả 2 theme.
6. Nếu có `ANTHROPIC_API_KEY` thật (xem Decisions): 1 lượt đầy đủ, đối
   chiếu `readings.input_tokens/output_tokens` với response thật; nếu
   không có key: dừng ở review code + gate tự động, ghi rõ trong report
   verify là ⏭️ skipped kèm lý do — không viết "verified" cho phần chưa
   chạy thật.

## Out of Scope
- Trang đăng nhập, middleware chặn route theo session — Giai đoạn 5.
- Trang chọn gói/nạp credits, tích hợp PayOS — Giai đoạn 6.
- Route riêng cho trang tài nguyên khủng hoảng (component dùng chung đã có
  sẵn, route độc lập là Giai đoạn 7).
- CTA liên kết `/trai-bai` ↔ `/doc-sau` — thêm khi Giai đoạn 5 xong.
- Rate limit theo IP cho khách vãng lai — 4c yêu cầu đăng nhập nên rate
  limit theo `user:<id>` là đủ cho phạm vi này.
- Prompt caching thật (`cache_control`) — code chừa chỗ (`ENABLE_PROMPT_CACHE`)
  nhưng mặc định tắt theo đúng khuyến nghị Phase 1 ở `03-kien-truc-ai.md §4.4`.
