# Task: Multi-provider AI cho Đọc sâu (Anthropic / OpenAI / Gemini)

> Created: 2026-08-27 · Slug: `multi-provider-deep-reading`

## Goal
Route Đọc sâu (`src/app/api/reading/deep/personal/route.ts`) gọi được 1 trong 3
nhà cung cấp AI — Anthropic (đã có), OpenAI, Google Gemini — chọn qua một biến
env duy nhất (`AI_PROVIDER`), để user tự đổi và so sánh chất lượng output giữa
các model theo thời gian, không cần sửa code mỗi lần đổi.

## Scope
**In**:
- Lớp abstraction chung chuẩn hoá stream/refusal/usage cho 3 SDK khác nhau.
- Implementation cho cả 3 provider (Anthropic refactor lại theo interface mới,
  OpenAI + Gemini mới hoàn toàn).
- `AI_PROVIDER` (bắt buộc) + model id override per-provider qua env
  (`ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL`), tất cả có default.
- Cột `ai_provider` mới trong bảng `readings` + migration + backfill dữ liệu cũ.
- Cập nhật route `personal/route.ts` để dùng lớp abstraction thay vì gọi
  Anthropic SDK trực tiếp.

**Out**:
- `scripts/base-content/` (tool sinh Lớp Nền hàng loạt) — vẫn Anthropic-only,
  không đụng.
- `src/lib/moderation.ts` (triage câu hỏi trước khi rút bài) — vẫn Anthropic
  Haiku-only, không liên quan tới việc chọn model cho Lớp Cá nhân.
- Chạy song song nhiều provider cùng lúc / A-B test tự động — user tự đổi
  `AI_PROVIDER` rồi thử, không cần hạ tầng so sánh tự động.
- Không đổi behavior an toàn/kiểm duyệt nội dung (triage layer đứng trước vẫn
  giữ nguyên).

## Assumptions
- Model id chính xác cho OpenAI/Gemini KHÔNG được hard-code cứng — dùng default
  hợp lý nhưng user phải tự xác nhận/sửa trong `.env.local` trước khi chạy
  thật, vì độ tin cậy của search result về tên model hiện tại thấp.
- OpenAI dùng Chat Completions API (`stream_options.include_usage`) — không
  dùng Responses API, để giữ interface đơn giản nhất tương đương Anthropic
  Messages API hiện tại.
- Gemini dùng `@google/genai` (SDK hợp nhất chính thức hiện tại của Google,
  thay cho `@google/generative-ai` đã deprecated).
- "Refusal" không có khái niệm thống nhất giữa 3 hãng — map best-effort theo
  `stop_reason`/`finish_reason` tương ứng mỗi SDK (chi tiết trong
  implementation-plan.md).
- Route giữ nguyên toàn bộ logic ngoài phần gọi AI: debit/refund credits,
  verify token, lưu Sentry — chỉ thay phần "gọi AI" bằng lớp abstraction mới.

## Checklist
- [x] Plan approved
- [x] `src/lib/env.ts` — thêm field provider/model/API key mới
- [x] `src/lib/ai/provider.ts` — interface + factory
- [x] `src/lib/ai/providers/anthropic.ts` — refactor theo interface mới
- [x] `src/lib/ai/providers/openai.ts` — implementation mới
- [x] `src/lib/ai/providers/gemini.ts` — implementation mới
- [x] `src/app/api/reading/deep/personal/route.ts` — dùng lớp abstraction
- [x] Migration `readings.ai_provider` + backfill
- [x] `package.json` — thêm `openai`, `@google/genai`
- [x] Gates green (lint / typecheck / build)
- [x] Verify thủ công với `AI_PROVIDER=anthropic` — smoke test route (400/410
      cho request thiếu/sai token), KHÔNG chạy full luồng đọc thật (cần user
      thật + credits thật, ngoài phạm vi phiên này) — xem Progress Log
- [ ] Learnings extracted

## Progress Log
> `/execute` appends one line per checkpoint.

- 2026-08-27 env.ts done — AI_PROVIDER + per-provider key/model fields (lazy-per-field)
- 2026-08-27 provider abstraction done — src/lib/ai/provider.ts + providers/{anthropic,openai,gemini}.ts
- 2026-08-27 route done — personal/route.ts dùng getAiProvider()
- 2026-08-27 migration applied — readings.ai_provider + backfill 'anthropic'
- 2026-08-27 deps added — openai@7.5.0, @google/genai@2.19.0 (pnpm approve-builds cho protobufjs + @google/genai, cả hai script benign — verified nội dung trước khi approve)
- 2026-08-27 gates: lint ✅, typecheck ✅, build ✅ (build tự xác nhận thêm: env.ts KHÔNG chạm OPENAI_API_KEY/GEMINI_API_KEY khi AI_PROVIDER mặc định là anthropic — đúng thiết kế lazy-per-field)
- 2026-08-27 smoke test: pnpm dev + curl route thiếu/sai token → 400/410 đúng, không 500, log dev server không có lỗi liên quan tới file mới. Không chạy full luồng đọc thật (cần user thật + credits thật)
- 2026-08-27 .env.example: BỊ CHẶN — Read/Write đều bị deny bởi rule `Read(./.env.*)` trong .claude/settings.json (áp cho cả Write, không chỉ Read). User cần tự thêm biến (danh sách ở implementation-plan.md) vào .env.example và .env.local

## Open Questions
- Model id chính xác cho OpenAI/Gemini — user tự điền vào `.env.local` sau khi
  plan này được duyệt (xem `.env.example` sẽ có comment nhắc).
