# Task: Giai đoạn 4c — Đọc sâu (3 lá, trả phí, AI cá nhân hoá)

> Created: 2026-08-16 · Slug: `phase-4c-doc-sau`
> Theo `Research/plan/08-timeline.md` §Giai đoạn 4, mục 4c (checklist 10 dòng,
> đã chi tiết hoá 2026-08-16 sau khi chốt spec ở
> `Research/plan/03-kien-truc-ai.md §7.1/§7.2/§7.3` và
> `01-san-pham-pham-vi.md §3/§5.2`). Chạy sau Giai đoạn 4a+4b (xong) —
> KHÔNG chờ Giai đoạn 5 (Auth UI)/6 (Thanh toán UI)/7 (trang khủng hoảng
> riêng), xem Assumptions.

## Goal
User đã đăng nhập (khi Giai đoạn 5 có UI thật) gõ câu hỏi tự do → chọn 3 lá
từ dải bài "tự chọn" → nhận diễn giải Lớp Nền ngay + Lớp Cá nhân stream từ
Claude Sonnet 5, đúng câu hỏi vừa đặt, đúng cơ chế RNG/ép hướng/token-reveal
đã spec. Credits trừ atomic, hoàn khi lỗi. Câu hỏi rủi ro (khủng hoảng/y
tế/pháp lý/harmful) bị chặn trước khi rút bài, không trừ credits.

## Scope
**In**: xem `implementation-plan.md` § Proposed Changes — toàn bộ lib mới
(RNG mở rộng, token ký, kiểm duyệt, prompt), 3 API route mới, 4 component
UI mới, 1 route mới (`/doc-sau`), 1 component an toàn dùng chung
(`CrisisResourceNotice`), thêm `ANTHROPIC_API_KEY`/`READING_TOKEN_SECRET`
vào `env.ts`, thêm dependency `@anthropic-ai/sdk`.

**Out**:
- Trang đăng nhập thật, middleware chặn route theo session (Giai đoạn 5)
- Trang chọn gói/nạp credits thật, tích hợp PayOS (Giai đoạn 6)
- Trang tài nguyên khủng hoảng **riêng** (route độc lập) — dùng component
  dùng chung ngay trong luồng 4c, route riêng là Giai đoạn 7
- Migration DB mới — schema hiện có (`readings`, `credit_ledger`,
  `debit_reading`/`refund_reading`) đã đủ, không cần cột/bảng mới
- Rate limit theo IP đầy đủ ở mọi route khác — chỉ áp `check_rate_limit`
  RPC đã có cho riêng luồng 4c, không mở rộng phạm vi ra `/api/reading` cũ

## Assumptions
- **Không cần chờ Giai đoạn 5/6/7** — quyết định qua AskUserQuestion
  2026-08-16 ("Build phần không cần auth thật trước"). Code auth-check
  (`requireUser`) và credit-debit viết **đúng thật**, không mock — chỉ
  không kiểm thử E2E qua trình duyệt được cho tới khi có trang đăng
  nhập/nạp credits thật. Đây là giới hạn về **verify**, không phải về scope
  code.
- Kiểm duyệt khủng hoảng/y tế/pháp lý/harmful: nội dung + số hotline đã có
  sẵn đầy đủ ở `06-bao-mat-kiem-duyet-phap-ly.md §3.3` (đã xác minh số điện
  thoại) — xây **thật**, không phải placeholder, dưới dạng component dùng
  chung để Giai đoạn 7 tái dùng khi làm route riêng.
- Chi phí credits cho 1 lượt Đọc sâu 3 lá: **đề xuất 2 credits** (Lớp Cá
  nhân 3 lá dài ~gấp đôi 1 lá theo `03-kien-truc-ai.md §4.6`) — chưa có con
  số chính thức nào khác trong `Research/plan/`, cần bạn xác nhận (xem
  implementation-plan.md § Decisions).
- Số vị trí hiển thị trong dải bài "tự chọn": **đề xuất N=24** — đủ cảm
  giác "dải rộng", vẫn giữ touch target ≥44×44px ở 375px theo
  `accessibility.md`. Không cần khớp con số 78 hay nhân bản gì (đã spec ở
  `03-kien-truc-ai.md §7.2`).
- Route mới: `/doc-sau` (phân biệt với `/trai-bai` của luồng free) — theo
  đúng quy ước đặt tên tiếng Việt không dấu đã dùng cho `/trai-bai`.
- Giao thức stream: NDJSON tự viết bằng `ReadableStream` thuần
  (`{"type":"base"|"delta"|"done"|"error", ...}` mỗi dòng) — không thêm
  dependency `ai` (Vercel AI SDK) vì chỉ có 1 use case, tự viết ngắn hơn
  learning một abstraction mới (xem implementation-plan.md § Considered and
  rejected).

## Checklist
- [ ] Plan approved
- [x] Lib: `env.ts` + `package.json` (`@anthropic-ai/sdk@latest` = 0.117.1)
- [x] Lib: `reading.ts` mở rộng (`drawCards`, `OrientationMode`, schema)
- [x] Lib: `reading-token.ts` (HMAC sign/verify)
- [x] Lib: `anthropic.ts` (client dùng chung)
- [x] Lib: `auth.ts` (`requireUser()`)
- [x] Lib: `moderation.ts` (Haiku triage + orientation_mode)
- [x] Lib: `ai/deep-reading-prompt.ts` (system prompt + user turn)
- [x] API: `POST /api/reading/deep/shuffle`
- [x] API: `POST /api/reading/deep/reveal` (free — kèm Lớp Nền, không đụng
      credits)
- [x] API: `POST /api/reading/deep/personal` (paid — trigger duy nhất bởi
      nút "Đọc sâu"; streaming + refund) — **deviation: không dùng
      `next/server` `after()`** như plan gốc, xem Progress Log
- [x] `npx tsc --noEmit` sạch sau lớp lib+API (checkpoint)
- [x] UI: `CrisisResourceNotice.tsx` (dùng chung)
- [x] UI: `DeepQuestionForm.tsx`
- [x] UI: `CardSpreadPicker.tsx`
- [x] UI: `DeepResultStream.tsx`
- [x] UI: `DeepReadingStage.tsx` (orchestrator)
- [x] Route: `src/app/doc-sau/page.tsx`
- [x] Content & copy thật (đã dùng nguyên văn từ 06-bao-mat-... cho các
      thông báo chặn, không có lorem ipsum)
- [x] States: loading/blocked/error/success — đủ, xem DeepReadingStage
- [x] Cả 2 theme — chỉ dùng token có sẵn (--color-danger, --color-border,
      --color-surface-raised...), không token màu mới
- [x] Accessibility — semantic button cho mọi lá, label thật cho câu hỏi,
      focus chuyển tới heading khi có kết quả/bị chặn, aria-live throttle
      qua requestAnimationFrame cho vùng stream
- [x] Gates: `pnpm lint` ✅, `npx tsc --noEmit` ✅, `pnpm build` ✅ (xác
      nhận build KHÔNG cần ANTHROPIC_API_KEY/READING_TOKEN_SECRET thật —
      đúng bất biến lazy-parse)
- [x] `pnpm dev` thật — `/`, `/doc-sau`, `/trai-bai` đều 200; `/doc-sau`
      hiện đúng "Cần đăng nhập"; 3 API route mới trả đúng mã lỗi
      (401/410) khi test bằng curl không có session/token thật
- [x] Responsive 375/768/1920 — verify 2026-08-19 bằng Playwright thật (phiên
      trước không có trình duyệt). Màn hỏi câu hỏi (`DeepQuestionForm`) đúng
      ở cả 3 width, touch target nút chủ đề = 44px chẵn ở 375px, cả 2 theme
      đúng (verify bằng `getComputedStyle` chứ không chỉ nhìn screenshot —
      ban đầu nghi có bug theme do đọc nhầm màu trên ảnh chụp, computed style
      xác nhận KHÔNG có bug). ⏭️ Chưa verify được `CardSpreadPicker` (N=24
      vị trí) và `DeepResultStream` (stream) ở responsive — cả 2 cần
      `ANTHROPIC_API_KEY` hợp lệ để vào được màn đó, xem finding mới dưới
- [ ] Learnings extracted — chưa chạy `/finish`
- [ ] UI: `CrisisResourceNotice.tsx` (dùng chung)
- [ ] UI: `DeepQuestionForm.tsx`
- [ ] UI: `CardSpreadPicker.tsx`
- [ ] UI: `DeepResultStream.tsx`
- [ ] UI: `DeepReadingStage.tsx` (orchestrator)
- [ ] Route: `src/app/doc-sau/page.tsx`
- [ ] Content & copy thật (câu hỏi placeholder, thông báo chặn, lỗi)
- [ ] States: loading/empty/error/success — đủ 4, xem implementation-plan.md
- [ ] Responsive 375/768/1280/1920 — đặc biệt N=24 vị trí ở 375px
- [ ] Cả 2 theme
- [ ] Accessibility pass (touch target 44px, focus, live region cho stream)
- [ ] Gates xanh (lint/typecheck/build) — `pnpm dev` verify thủ công vì
      không có Anthropic key/session thật trong môi trường dev hiện tại
- [ ] Learnings extracted

## Progress Log
- 2026-08-16: plan viết, chưa execute
- 2026-08-16: User duyệt ("build với số đề xuất, để sẵn biến") → đổi
  `DEEP_READING_COST`/`DEEP_SPREAD_SLOTS` từ hardcode sang đọc `env.ts` (đã
  sửa plan). Trước khi viết code Anthropic SDK: bắt buộc invoke skill
  `claude-api` theo system trigger — verify được 2 điểm quan trọng khác
  với giả định ban đầu trong plan:
  1. Sonnet 5 **mặc định BẬT adaptive thinking** khi không truyền
     `thinking` (khác Opus 4.8 trở về trước) — phải truyền tường minh
     `thinking: { type: 'disabled' }`, không được bỏ qua param.
  2. `messages.parse()` với `zodOutputFormat` — `response.parsed_output`
     có thể `null` nếu parse thất bại, SDK không tự throw — bắt buộc guard.
  Đã sửa cả 2 vào implementation-plan.md trước khi viết code, không để
  code sai theo giả định cũ.
- 2026-08-17: Viết xong lớp Lib + 3 API route. **Deviation so với plan**:
  route `personal` không dùng `next/server` `after()` để lưu `readings`/hoàn
  credits như implementation-plan.md mô tả — lý do: `after()` gọi từ BÊN
  TRONG callback `start()` của `ReadableStream` (chạy async, sau khi
  `Response` đã được trả về khỏi hàm route handler) là pattern chưa được
  xác nhận rõ trong doc Next.js đã đọc (docs chỉ cho ví dụ gọi `after()`
  đồng bộ trong thân handler trước `return`). Không có `ANTHROPIC_API_KEY`
  thật để test end-to-end xác minh pattern này chạy đúng, nên chọn phương
  án chắc chắn hơn: `await` trực tiếp việc ghi `readings`/hoàn credits
  ngay trong `start()`, trước `controller.close()` — chậm hơn vài trăm ms
  trước khi client thấy stream đóng hẳn, nhưng không phụ thuộc hành vi
  chưa xác minh. `npx tsc --noEmit` sạch (0 lỗi) sau khi viết xong 7 file
  lib + 3 route API.
- 2026-08-16: User review phát hiện lỗi thiết kế trong bản plan đầu — route
  `complete` gộp "trừ credits" + "hiện Lớp Nền" + "gọi AI" làm một, nhưng
  đúng ý đồ là Lớp Nền của cả 3 lá phải free (hiện ngay khi reveal từng
  lá), chỉ trừ credits khi user chủ động bấm nút "Đọc sâu" riêng. Đã sửa:
  tách route `complete` thành `reveal` (free, kèm Lớp Nền) +
  `personal` (paid, trigger bởi nút riêng) — cập nhật đồng bộ ở
  `01-san-pham-pham-vi.md §5.2`, `03-kien-truc-ai.md §7.2` (thêm bước 5/6,
  chuẩn hoá path `/api/reading/deep/*` xuyên suốt — trước đó lệch giữa
  `/api/reading/reveal` và `/api/reading/deep/reveal`), `08-timeline.md`
  checklist 4c, và `implementation-plan.md` (route/component/verification).
- 2026-08-17: Viết xong lớp UI (5 component) + trang `/doc-sau`. Chạy
  `pnpm dev` thật (server có sẵn từ trước, PID ngoài phiên này) — phát hiện
  **bug nghiêm trọng hơn dự tính**: middleware `proxy.ts` chạy trên MỌI
  request, chạm `env.NEXT_PUBLIC_SUPABASE_URL` → kéo theo lỗi thiếu
  `ANTHROPIC_API_KEY` → **toàn site 500**, không chỉ riêng route Đọc sâu
  như giả định ban đầu ("route nào chưa gọi AI vẫn chạy bình thường" — SAI,
  vì `env.ts` cũ validate CẢ schema cùng lúc, không phải từng field độc
  lập). Sửa gốc: viết lại `env.ts` để mỗi field validate + cache ĐỘC LẬP
  (`loadField<K>` thay vì `loadEnv()` trả cả object) — giờ field thiếu chỉ
  throw khi chính field đó được đọc, đúng lời hứa gốc của file. Cũng phát
  hiện `src/lib/supabase/admin.ts` có cùng lỗi gốc (đọc `env` eager ở
  module scope) — sửa thành lazy getter `getSupabaseAdmin()`, cập nhật 2
  route dùng nó. Cũng thêm `src_template/**` vào `eslint.config.mjs`
  ignores — 1165 lỗi/warning lint ban đầu hoá ra 100% từ JS vendor của đối
  thủ trong `src_template/`, không phải code của dự án; code trong `src/`
  sạch tuyệt đối cả trước và sau fix này. Verify cuối: `pnpm lint`/`npx tsc
  --noEmit`/`pnpm build` (không có key AI thật) đều xanh; `pnpm dev` thật
  qua curl xác nhận `/`, `/doc-sau`, `/trai-bai` = 200, `/doc-sau` hiện
  đúng "Cần đăng nhập", 3 route API mới trả đúng 401/410 khi thiếu
  session/token. Không test được luồng AI thật (không có
  `ANTHROPIC_API_KEY`) và không test được responsive/theme/a11y bằng
  trình duyệt thật (không có công cụ browser trong phiên này) — ghi rõ
  ⏭️ skipped, không giả vờ đã verify.

- 2026-08-19: Rà soát lại theo yêu cầu user (chuẩn bị cho `/report`). Gate
  lint/typecheck/build vẫn xanh. Test `pnpm dev` thật với session thật (đăng
  ký tài khoản test qua UI, xoá sạch sau) tới `/api/reading/deep/shuffle` —
  **lỗi mới, khác lỗi cũ**: `ANTHROPIC_API_KEY` trong `.env.local` giờ **đã
  có giá trị** (không còn undefined như lúc build 4c) nhưng **giá trị sai**
  — Anthropic API trả thẳng `401 authentication_error: "API key is
  invalid."`. Đây là lý do route `shuffle` luôn trả `moderation_failed`.
  Khác gốc rễ với Open Question cũ ("chưa có key") — giờ là "có key nhưng
  key sai", cần user tự kiểm tra lại giá trị đã dán vào `.env.local` (có thể
  dán nhầm key khác, thiếu ký tự, hoặc key đã bị revoke). Đã verify responsive
  cho phần UI không cần AI thật (câu hỏi + chọn chủ đề), xem checklist.

## Open Questions
- **MỚI 2026-08-19 — `ANTHROPIC_API_KEY` trong `.env.local` không hợp lệ**
  (401 từ Anthropic API, "API key is invalid") — chặn toàn bộ luồng AI của
  4c (shuffle/reveal/personal đều cần key này qua `moderation.ts`/
  `anthropic.ts`). Cần user tự kiểm tra lại giá trị key trong Anthropic
  Console và dán đúng vào `.env.local`.
- ~~Chi phí credits/lượt — 2 hay số khác?~~ **Đã chốt 2026-08-16**: dùng
  số đề xuất (2), nhưng đọc từ `env.DEEP_READING_COST` (default 2) thay vì
  hardcode — user muốn tự set lại sau này không cần sửa code.
- ~~N vị trí dải bài — 24 hay số khác?~~ **Đã chốt**: dùng số đề xuất (24),
  đọc từ `env.DEEP_SPREAD_SLOTS` (default 24), cùng lý do trên.
- **Chưa có `ANTHROPIC_API_KEY` thật** — user không cung cấp, tiếp tục
  build với giả định này (đã ghi trong Assumptions + Verification Plan):
  code viết đúng thật, verify dừng ở lint/typecheck/build + đọc code cho
  tới khi có key thật.
