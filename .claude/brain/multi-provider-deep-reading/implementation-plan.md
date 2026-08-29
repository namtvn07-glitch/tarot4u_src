# Multi-provider AI cho Đọc sâu

Route Đọc sâu hiện chỉ gọi Anthropic trực tiếp, phụ thuộc chặt vào shape của
`@anthropic-ai/sdk` (content_block_delta, stop_reason, finalMessage, usage).
Thêm OpenAI + Gemini đòi hỏi một lớp abstraction chuẩn hoá 3 SDK về cùng một
hình dạng event, chọn qua `AI_PROVIDER` — để user đổi provider bằng cách sửa
env, không sửa code, và so sánh chất lượng output giữa các model.

## Decisions Needed From You
> [!IMPORTANT]
> Đã chốt qua câu hỏi trước đó — nhắc lại để xác nhận lần cuối trước khi
> `/execute`:
> - Cơ chế chọn: 1 biến `AI_PROVIDER` đọc lúc server chạy, đổi = sửa env +
>   redeploy/restart. Không có override qua request/header.
> - Model id: đặt default hợp lý (`claude-sonnet-5` / `gpt-5.1` /
>   `gemini-3-pro`) nhưng bạn cần tự xác nhận đúng tên model account bạn có
>   quyền gọi trước khi set `AI_PROVIDER=openai` hoặc `gemini` — tôi không có
>   cách xác minh chắc chắn tên model hiện tại của 2 hãng kia.
> - Thêm cột `readings.ai_provider` (nullable text) + backfill dữ liệu cũ
>   thành `'anthropic'`.

## Approach
Tạo `src/lib/ai/provider.ts` định nghĩa interface `AiProvider` với một method
duy nhất: `streamCompletion({ system, userTurn, maxTokens })` trả về
`AsyncGenerator<AiEvent>`, với `AiEvent` là union `{type:"delta", text}` hoặc
`{type:"final", text, stopReason, model, usage}`. Đây gần như đúng hình dạng
route hiện đang tự tay dựng từ Anthropic SDK — nên phần thay đổi trong route
chỉ là đổi nguồn phát sự kiện, không đổi logic nghiệp vụ (debit/refund/insert
readings) bên dưới.

Mỗi provider là 1 file trong `src/lib/ai/providers/`, implement interface trên
bằng SDK riêng của hãng đó, tự lo việc map `stop_reason`/`finish_reason` khác
nhau về `stopReason` chung ("complete" | "refusal" | "max_tokens"). Factory
`getAiProvider()` chọn implementation theo `env.AI_PROVIDER`, cache theo
provider (giống pattern lazy singleton của `src/lib/anthropic.ts` hiện tại).

**Considered và rejected**
- Giữ nguyên `getAnthropicClient()` export trực tiếp, thêm `if/else` theo
  provider ngay trong route — rejected: route đã dài (~170 dòng), nhồi thêm 2
  luồng SDK khác hẳn (khác cả cách stream lẫn cách đọc usage) vào 1 file phá
  vỡ "one responsibility" và làm review khó verify cả 3 luồng cùng lúc.
- Dùng LangChain/Vercel AI SDK làm lớp abstraction có sẵn — rejected: thêm 1
  dependency lớn, kéo theo tầng trừu tượng riêng (LangChain `ChatModel`, hay
  Vercel AI SDK provider registry) chỉ để làm đúng 1 việc rất hẹp (stream text
  + đọc usage + refusal cho 1 route duy nhất) — 3 SDK chính thức trực tiếp
  (`@anthropic-ai/sdk` đã có, `openai`, `@google/genai`) đủ và ít phụ thuộc
  hơn.

## Proposed Changes

### `src/lib/env.ts`
#### [MODIFY]
Thêm vào `fieldSchemas` (theo đúng pattern lazy-per-field đã có, literal
`process.env.X`, không dynamic key):
```ts
AI_PROVIDER: z.enum(["anthropic", "openai", "gemini"]).default("anthropic"),
ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
OPENAI_API_KEY: z.string().min(1),
OPENAI_MODEL: z.string().min(1).default("gpt-5.1"),
GEMINI_API_KEY: z.string().min(1),
GEMINI_MODEL: z.string().min(1).default("gemini-3-pro"),
```
`OPENAI_API_KEY`/`GEMINI_API_KEY` là **required** (không optional, không
default) — giống hệt cách `ANTHROPIC_API_KEY` đang được validate. Vì validate
là lazy-per-field, field này chỉ throw khi thực sự bị đọc — tức là chỉ khi
`getAiProvider()` chọn đúng provider đó. `AI_PROVIDER=anthropic` (default) thì
`OPENAI_API_KEY`/`GEMINI_API_KEY` không bao giờ bị chạm tới, dev hiện tại không
cần set 2 key mới này.

Comment cần thêm nhắc rõ: default model id là phỏng đoán tại thời điểm viết
code (2026-08), **phải tự xác nhận lại** tên model thật account có quyền gọi
trước khi đổi `AI_PROVIDER`.

### `src/lib/ai/provider.ts` [NEW]
- `export type AiStopReason = "complete" | "refusal" | "max_tokens"`
- `export type AiEvent = { type: "delta"; text: string } | { type: "final"; text: string; stopReason: AiStopReason; model: string; usage: { inputTokens: number; outputTokens: number } }`
- `export interface AiProvider { streamCompletion(args: { system: string; userTurn: string; maxTokens: number }): AsyncGenerator<AiEvent> }`
- `export function getAiProvider(): AiProvider` — switch theo `env.AI_PROVIDER`,
  cache instance per provider (module-level `Map` hoặc 3 biến `cached*`, theo
  đúng lý do lazy đã ghi trong `src/lib/anthropic.ts`: không tạo client ở
  module scope vì `next build` đánh giá tĩnh module graph).

### `src/lib/ai/providers/anthropic.ts` [NEW]
- Dùng `getAnthropicClient()` từ `src/lib/anthropic.ts` (không đổi file đó —
  `moderation.ts` vẫn import trực tiếp, ngoài phạm vi).
- `messages.stream({ model: env.ANTHROPIC_MODEL, max_tokens, thinking: {type:"disabled"}, output_config:{effort:"low"}, system, messages:[{role:"user", content: userTurn}] })`
  — y hệt config hiện tại trong route, chỉ đổi model từ hard-code sang
  `env.ANTHROPIC_MODEL`.
- Yield `delta` cho mỗi `content_block_delta`/`text_delta`.
- Sau `finalMessage()`: map `stop_reason` — `"refusal"` → `"refusal"`,
  `"max_tokens"` → `"max_tokens"`, còn lại → `"complete"`. Text = join các
  `TextBlock` (logic giống hệt route hiện tại, chuyển vào đây).
- Yield 1 `final` event với `model: final.model`,
  `usage: {inputTokens: final.usage.input_tokens, outputTokens: final.usage.output_tokens}`.

### `src/lib/ai/providers/openai.ts` [NEW]
- Client lazy singleton: `new OpenAI({ apiKey: env.OPENAI_API_KEY })`.
- `client.chat.completions.stream({ model: env.OPENAI_MODEL, max_completion_tokens: maxTokens, stream_options: { include_usage: true }, messages: [{role:"system", content: system}, {role:"user", content: userTurn}] })`.
- Yield `delta` cho mỗi chunk có `choices[0]?.delta?.content`.
- Đọc `finalChatCompletion()` (helper của SDK `openai` cho streaming) để lấy
  `finish_reason` + `usage`.
- Map `finish_reason`: `"content_filter"` → `"refusal"`, `"length"` →
  `"max_tokens"`, còn lại → `"complete"`.
- `usage`: `{inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens}`.

### `src/lib/ai/providers/gemini.ts` [NEW]
- Client lazy singleton: `new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })`
  (`@google/genai`).
- `client.models.generateContentStream({ model: env.GEMINI_MODEL, config: { systemInstruction: system, maxOutputTokens: maxTokens }, contents: [{role:"user", parts:[{text: userTurn}]}] })`.
- Yield `delta` cho mỗi chunk có `chunk.text`.
- Chunk cuối cùng mang `candidates[0].finishReason` + `usageMetadata`. Map
  finishReason: `"SAFETY" | "PROHIBITED_CONTENT" | "BLOCKLIST"` → `"refusal"`,
  `"MAX_TOKENS"` → `"max_tokens"`, còn lại (`"STOP"`...) → `"complete"`.
- `usage`: `{inputTokens: usageMetadata.promptTokenCount, outputTokens: usageMetadata.candidatesTokenCount}`.
- `model`: `env.GEMINI_MODEL` (Gemini response không luôn echo lại tên model
  trong response — dùng giá trị đã request).

### `src/app/api/reading/deep/personal/route.ts` [MODIFY]
- Bỏ `import type Anthropic from "@anthropic-ai/sdk"` và
  `import { getAnthropicClient } from "@/lib/anthropic"`.
- Thêm `import { getAiProvider } from "@/lib/ai/provider"`.
- Thay khối `getAnthropicClient().messages.stream(...)` +
  vòng `for await (const event of aiStream)` + `aiStream.finalMessage()`
  bằng:
  ```ts
  const provider = getAiProvider();
  let finalEvent: Extract<AiEvent, { type: "final" }> | undefined;
  for await (const event of provider.streamCompletion({
    system: PERSONAL_LAYER_SYSTEM,
    userTurn: buildUserTurn(payload.topic, cardsForPrompt, payload.question),
    maxTokens: 1500,
  })) {
    if (event.type === "delta") send({ type: "delta", text: event.text });
    else finalEvent = event;
  }
  if (!finalEvent) throw new Error("ai_stream_no_final_event");
  ```
- Thay mọi chỗ đọc `final.stop_reason === "refusal"` →
  `finalEvent.stopReason === "refusal"`, tương tự `"max_tokens"`.
- Thay `personalBody` (trước đây filter/join `final.content`) →
  `finalEvent.text` trực tiếp.
- Insert vào `readings` thêm `ai_provider: env.AI_PROVIDER`, giữ nguyên
  `model: finalEvent.model`, `input_tokens/output_tokens: finalEvent.usage.*`.
- Toàn bộ phần debit/refund/token-verify/Sentry giữ nguyên y hệt.

### `supabase/migrations/<timestamp>_readings_ai_provider.sql` [NEW]
```sql
alter table readings add column ai_provider text;

comment on column readings.ai_provider is
  'anthropic | openai | gemini — nhà cung cấp AI dùng cho personal_body';

-- Backfill dữ liệu cũ: mọi reading có model đã tồn tại trước tính năng này
-- đều chạy qua Anthropic.
update readings set ai_provider = 'anthropic'
  where ai_provider is null and model is not null;
```
Migration này KHÔNG đụng SECURITY DEFINER function xử lý tiền — không thuộc
diện phải chạy tay qua Supabase Dashboard theo Non-Negotiable đã ghi ở
`.claude/rules/project.md`; `apply_migration` dùng bình thường được.

### `package.json` [MODIFY]
- Thêm `"openai": "^7.7.0"` — SDK chính thức OpenAI, cần cho streaming Chat
  Completions + type an toàn cho `finish_reason`/`usage`.
- Thêm `"@google/genai": "^2.19.0"` — SDK hợp nhất chính thức hiện tại của
  Google cho Gemini API (thay `@google/generative-ai` đã deprecated), hỗ trợ
  `systemInstruction` + streaming + `usageMetadata`.

### `.env.example` [MODIFY]
Thêm (không có giá trị thật, chỉ tên biến + comment):
```
# Chọn nhà cung cấp AI cho Lớp Cá nhân (Đọc sâu): anthropic | openai | gemini
AI_PROVIDER=anthropic

# Model id — default trong code là phỏng đoán, TỰ XÁC NHẬN tên model thật
# account bạn có quyền gọi trước khi đổi AI_PROVIDER khỏi anthropic.
ANTHROPIC_MODEL=claude-sonnet-5
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.1
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-pro
```
Ghi chú: `Read`/`Bash cat` trên `.env.example` bị `guard-paths.sh` chặn ngay
cả ở chế độ đọc trong phiên lập plan này — `/execute` cần dùng `Edit` (không
phải `Read` trước) hoặc hỏi lại nếu cũng bị chặn; nếu bị chặn hoàn toàn, báo
user tự thêm các dòng trên vào `.env.example`/`.env.local`.

## Accessibility Plan
n/a — thay đổi thuần backend/API, không có UI mới.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/lib/env.ts` (thêm field) | Mọi nơi import `env` | Thấp — field mới, lazy-per-field nên không ảnh hưởng field khác |
| `readings` table (+ cột) | `personal/route.ts`, mọi query `select * from readings` (trang lịch sử, nếu có) | Thấp — cột nullable, thêm không xoá |
| `src/lib/anthropic.ts` | `moderation.ts`, `src/lib/ai/providers/anthropic.ts` (mới) | Không đổi — chỉ thêm consumer mới, giữ nguyên export hiện có |
| `personal/route.ts` | Không ai import route này (Next.js route handler, chỉ gọi qua HTTP) | Trung bình — đây là đường duy nhất tạo Đọc sâu thật, cần verify kỹ luồng `AI_PROVIDER=anthropic` (mặc định) không đổi hành vi |

## Verification Plan
### Automated
```bash
.claude/hooks/detect-stack.sh
pnpm lint
npx tsc --noEmit   # không có script "typecheck" riêng
pnpm build
```
`test`: n/a — không có test script/framework trong repo.

### Manual
1. Với `AI_PROVIDER=anthropic` (mặc định, không cần key mới): chạy `pnpm dev`,
   đi hết luồng Đọc sâu thật (rút 3 lá → hỏi câu hỏi → nhận diễn giải), xác
   nhận NDJSON stream + refund-on-error + insert `readings` (bao gồm
   `ai_provider = 'anthropic'`) không đổi hành vi so với trước.
2. Với `AI_PROVIDER=openai`/`gemini`: KHÔNG có API key thật trong môi trường
   dev hiện tại (giống tình trạng `ANTHROPIC_API_KEY` từng gặp ở Giai đoạn
   4c) — chỉ verify được bằng lint/typecheck/build (compile đúng type), không
   verify được gọi API thật. Ghi rõ trong báo cáo `/finish` là
   `⏭️ skipped (chưa có OPENAI_API_KEY/GEMINI_API_KEY thật)`, không phải ✅.
3. Kiểm tra `refusal`/`max_tokens` mapping bằng cách đọc lại code từng
   provider (không có cách ép model trả refusal thật một cách tin cậy trong
   test thủ công) — flag đây là review-only, không phải test hành vi thật.

## Out of Scope
- `scripts/base-content/`, `src/lib/moderation.ts` — không đổi.
- UI hiển thị provider/model đã dùng cho user cuối — chỉ lưu vào DB để phân
  tích nội bộ, không hiển thị trên `/tai-khoan` hay bất kỳ trang nào.
- Cơ chế so sánh/A-B test tự động nhiều provider cùng lúc.
- Retry/fallback tự động sang provider khác khi 1 provider lỗi.
