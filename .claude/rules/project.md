# Project Rules — Tarot

> Web design project. This file is the entry point for project-wide context.
> Read it before planning, executing, or reviewing anything.

## What This Project Is

A web design project. Design quality is the deliverable — a change that ships
broken spacing, an inaccessible contrast ratio, or a layout that collapses at
375px is a **failed** change, even if it compiles.

## Stack Detection (stack-agnostic policy)

The stack is not fixed. **Never assume** a framework, package manager, or build
command. Detect it, then act:

```bash
.claude/hooks/detect-stack.sh
```

That script prints the resolved package manager and the available
`lint` / `typecheck` / `test` / `build` scripts. Every workflow that needs to
verify something calls it instead of hardcoding `npm run build`.

| Signal | Meaning |
|--------|---------|
| `pnpm-lock.yaml` / `yarn.lock` / `bun.lockb` / `package-lock.json` | package manager |
| `next.config.*` | Next.js — App Router unless `pages/` exists |
| `vite.config.*` | Vite SPA |
| `tailwind.config.*` or `@import "tailwindcss"` in CSS | Tailwind |
| no `package.json` | static HTML/CSS/JS — verify by opening the page, not by building |

> [!IMPORTANT]
> If detection is ambiguous, **ask the user once** and record the answer in
> `docs/learned/stack.md`. Do not guess twice about the same thing.

## Directory Contract

| Path | Purpose | Who writes it |
|------|---------|---------------|
| `.claude/rules/` | Durable rules. Loaded every session via `CLAUDE.md`. | `/finish` |
| `.claude/commands/` | Slash-command workflows. | Human, or `/finish` **with approval** |
| `.claude/agents/` | Subagent definitions. | Human |
| `.claude/templates/` | Artifact skeletons used by commands. | Human |
| `.claude/brain/<task-slug>/` | Per-task working artifacts (`task.md`, `implementation-plan.md`, `walkthrough.md`). | `/plan`, `/execute`, `/finish` |
| `docs/learned/` | Stack-specific deep knowledge and gotchas. | `/finish`, `/debug` |
| `docs/teach/` | Narrative debriefs, one per task, date-prefixed. | `/teach` |

## Non-Negotiables

- **No secrets in the repo.** API keys, tokens, and `.env` values never land in
  tracked files. The `guard-paths.sh` hook blocks the obvious cases; it is a
  safety net, not permission to be careless.
- **No dependency added without stating why.** A new package is a permanent
  cost. Name the problem it solves and what it replaces.
- **Design tokens over magic numbers.** See [design-system.md](design-system.md).
- **Accessibility is a gate, not a polish step.** See [accessibility.md](accessibility.md).
- **Verify before reporting done.** See [verification.md](verification.md).

## Learned Patterns

> `/finish` appends here. Newest at the bottom. Keep each entry to 2–4 lines.
> If an entry grows past that, it belongs in `docs/learned/` with a pointer here.

- **2026-08-16 — Ảnh tạm từ đối thủ trong `public/_placeholder-doi-thu/`
  (gitignored) là nợ kỹ thuật có hạn, không phải asset lâu dài.** Dùng để
  dựng UI trải bài "tự chọn lá" (Giai đoạn 4c) trước khi có asset thật của
  Ventus — **bắt buộc** thay + xoá thư mục trước Giai đoạn 10 (Deploy). Chi
  tiết + danh sách loại trừ (logo, ảnh chân dung reader) ở
  [03-kien-truc-ai.md §7.3](../../Research/plan/03-kien-truc-ai.md).

- **2026-08-16 — `--spacing-*: initial` trong `globals.css` xoá luôn giá trị
  "0" của Tailwind, không chỉ các bước ngoài-ramp.** `inset-0`/`top-0`/`p-0`/
  `gap-0`... im lặng không sinh CSS gì — một `absolute inset-0` co lại về
  ~4px thay vì lấp đầy parent. Đã vá bằng `--spacing-0: 0px` tường minh. Chi
  tiết + cách xác minh nhanh (đếm rule trong `document.styleSheets`) ở
  [docs/learned/tailwind-v4-spacing.md](../../docs/learned/tailwind-v4-spacing.md).

- **2026-08-16 — Repo này có nhiều phiên/task chạy song song, không commit
  ngay.** Giai đoạn 4b bắt đầu mà không kiểm tra kỹ `git status` đầu phiên
  ngoài việc đọc summary — suýt bỏ sót việc Giai đoạn 4c (`phase-4c-doc-sau`)
  đã có cả một khối lượng lớn file WIP chưa commit nằm sẵn trong tree. Không
  đụng độ lần này chỉ vì tên file khác nhau, không phải vì đã kiểm tra chủ
  động. **Trước khi `/plan` một tính năng mới, đọc kỹ phần untracked/modified
  trong git status đầu phiên — không chỉ lướt qua — nếu thấy thư mục/file lạ
  gợi ý một phase khác, xác minh nó là gì trước khi giả định nó không liên
  quan.**

- **2026-08-18 — `src/lib/env.ts` phải đọc từng biến bằng `process.env.TEN_BIEN`
  viết tĩnh, không bao giờ qua biến động (`process.env[key]`).** Next.js chỉ
  inline được `NEXT_PUBLIC_*` cho bundle browser khi nhận diện được cụm chữ
  đó nguyên văn trong source — truy cập động khiến mọi field luôn `undefined`
  phía client, lỗi im lặng (ZodError không ai bắt) chỉ lộ ra khi có Client
  Component đầu tiên thật sự gọi tới. Chi tiết + cách phát hiện nhanh ở
  [docs/learned/nextjs-env-bundling.md](../../docs/learned/nextjs-env-bundling.md).

- **2026-08-18 — Không tự chế session/user test bằng cách vòng qua
  `guard-paths.sh` (vd. đọc `.env.local` để lấy service role key gọi Admin
  API, hay chèn thẳng `auth.users` qua SQL).** Hook chặn đọc `.env.local` là
  chủ đích, không phải trở ngại cần lách. **Nhưng nếu app đã có đường đăng
  ký thật** (vd. email+password sau khi thêm ở Giai đoạn 5): tạo tài khoản
  test THẬT qua chính UI signup của app (không đụng secret/`.env`), seed dữ
  liệu cần thiết bằng `execute_sql` trực tiếp theo `user_id` thật đó, verify
  bằng Playwright với session thật, rồi xoá sạch (đúng thứ tự FK:
  `readings`/`credit_ledger` trước `auth.users` — `on delete restrict` chặn
  ngược lại) và xác nhận lại bằng `count(*) = 0`. Cách này verify được đầy đủ
  hơn nhiều so với chỉ đọc code — đã dùng để đóng hoàn toàn gap "chưa verify
  `/tai-khoan` với dữ liệu thật" ở Giai đoạn 5.

- **2026-08-18 — `eslint-config-next` ở dự án này bật rule React Compiler
  (`react-hooks/purity`, `react-hooks/refs`) — gọi hàm impure (`Date.now()`...)
  trực tiếp trong thân render hoặc đọc `ref.current` lúc render đều bị chặn ở
  gate lint, dù build/runtime vẫn đúng.** Dùng `useState(() => impureInit())`
  (lazy initializer) thay vì `useRef(impureInit())` cho giá trị "tính một lần
  lúc mount". Chi tiết ở
  [docs/learned/react-compiler-hooks.md](../../docs/learned/react-compiler-hooks.md).

- **2026-08-18 — DDL đổi/xoá function xử lý tiền thật (`credit_order`...) bị
  auto-mode permission classifier chặn `apply_migration`, không phải lỗi
  SQL — và không gỡ được bằng cách user xác nhận lại qua chat hay đổi sang
  `execute_sql` (cùng rủi ro, nên cũng bị/nên chặn).** Đây là gate hệ thống
  nằm ngoài phạm vi Claude quyết định — báo user 1 lần, không thử lại nhiều
  lần, và đề xuất 2 lối ra thật: user tự chạy SQL qua Supabase Dashboard, hoặc
  user tự thêm Bash permission rule nếu muốn Claude làm được việc này sau
  này. Gặp ở Giai đoạn 6 (Thanh toán) khi thay `credit_order(uuid)` →
  `credit_order(bigint, int)`.
  **Đính chính 2026-09-20:** lần này `apply_migration` thay nguyên
  `credit_order(bigint,int)` trên production **KHÔNG bị chặn** — chạy thẳng,
  `{"success":true}`. Nên đừng coi việc bị chặn là chắc chắn: cứ thử một lần,
  chặn thì mới đi đường Dashboard. Phần còn lại của bài học vẫn đúng — bị chặn
  thì báo user một lần, không thử lại nhiều lần.

- **2026-08-19 — Khi user tự chạy migration thủ công (vì `apply_migration` bị
  chặn), "Success" trên Supabase Dashboard KHÔNG chứng minh mọi câu lệnh
  trong khối SQL đã chạy — chỉ chứng minh câu lệnh cuối cùng.** Gặp ở Giai
  đoạn 6: `credit_order` tạo đúng, nhưng `revoke execute ... from public`
  cuối khối không chạy — `PUBLIC` vẫn gọi được hàm cộng tiền thật qua
  `/rest/v1/rpc/`. Luôn `select * from information_schema.routine_privileges
  where routine_name = '<fn>'` để xác nhận sau bất kỳ migration thủ công nào
  đụng tới `SECURITY DEFINER` function xử lý tiền. Chi tiết ở
  [docs/learned/supabase.md](../../docs/learned/supabase.md).

- **2026-08-27 — Key truyền vào `check_rate_limit` RPC phải luôn có tiền tố
  tên route (vd. `orders-create:user:<id>`), không bao giờ dùng key trần
  như `user:<id>`.** RPC chỉ đếm theo chuỗi `key`, không tự phân biệt route
  nào gọi nó — 2 route dùng cùng key trần sẽ vô tình chia sẻ chung 1 bucket
  đếm, gây rate-limit sai mà không có lỗi nào báo. Phát hiện ở Giai đoạn 7
  khi thêm rate limit cho `/api/orders` sau khi `shuffle` route (Giai đoạn
  4c) đã lỡ dùng key trần `user:<id>` — phải đổi lại thành
  `reading-deep-shuffle:user:<id>` để tránh đụng
  `orders-create:user:<id>`/`reading-quick:user:<id>` mới thêm. Helper dùng
  chung ở `src/lib/rate-limit.ts`.

- **2026-09-20 — `supabase.migrations` trên production KHÔNG phải nguồn sự thật;
  phải soi object thật.** Timestamp trong bảng đó lệch hẳn với tên file trong
  `supabase/migrations/` (prod `20260816073657 initial_schema` vs repo
  `20260809000001_initial_schema.sql`), và `refund_rate_limit` TỒN TẠI trên
  production dù không hề nằm trong danh sách `list_migrations`. Muốn biết một
  migration đã áp chưa thì hỏi `pg_proc`/`information_schema`, đừng hỏi bảng
  lịch sử.

- **2026-09-20 — Đường trừ credits của production đang sống nhờ một mặc định
  ngầm của Supabase hosted, không nhờ thứ gì viết trong repo.**
  `20260908000001` dùng `drop function` rồi tạo lại `debit_reading`/
  `refund_reading` mà không `grant execute ... to service_role` lại — DROP xoá
  sạch grant. Production vẫn chạy vì hosted đặt `alter default privileges ...
  grant all on functions to ... service_role`; chính mặc định đó là lý do
  `20260908000002` phải tồn tại để revoke khỏi anon/authenticated. Chỗ nào
  không có mặc định đó thì gãy — `supabase start` ở máy dev CHÍNH LÀ chỗ đó,
  triệu chứng là mọi lượt Đọc sâu trả `debit_failed`. **Sau bất kỳ
  `drop function` nào trên hàm tiền, phải `grant` lại tường minh trong cùng
  migration.** Đã vá bằng `20260920000000_regrant_debit_refund_to_service_role`.

- **2026-09-20 — Chốt chống double-submit phải là `useRef`, không phải state.**
  `disabled={isProcessing}` chỉ có hiệu lực từ lần render SAU, nên hai cú bấm
  trong cùng một tick đều lọt. Ở `CreditTopUpModal` điều đó từng chỉ tạo một đơn
  thừa; từ khi handler gọi thêm `signInAnonymously()` thì nó đúc ra danh tính
  ẩn danh THỨ HAI và đơn hàng tạo dưới danh tính đầu thành mồ côi — khách trả
  tiền xong credits vào tài khoản mà phiên hiện tại không còn là nó. Mẫu đúng
  đã có sẵn trong repo: `isUnlockingRef` ở `DeepReadScreen`.

- **2026-09-20 — `supabase start` KHÔNG seed `base_content`.** Stack local dựng
  từ migrations, mà migrations chỉ tạo cấu trúc. Bảng rỗng → `/reveal` trả
  `base_content_unavailable` → UI hiện "Có lỗi dữ liệu lá bài". Nạp bằng
  `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<key
  từ supabase status> node scripts/seedBaseContent.js` (780 tổ hợp từ
  `scripts/base-content/output/base-content.json`). `admin_users` và
  `affiliate_links` cũng rỗng — `/admin` trả 404 cho tới khi tự insert.

- **2026-09-20 — Push TAG trước, push NHÁNH sau. Ngược lại là build bị huỷ và
  không bao giờ chạy lại.** Vercel chỉ tạo deployment khi push **nhánh**; push
  **tag** không kích hoạt gì. Mà `scripts/vercel-ignore-build.sh` lại hỏi
  GitHub API *"commit này có tag chưa"* ngay tại thời điểm deployment được tạo.
  Nên `push main` rồi mới `push tag` = lúc script chạy thì tag chưa có → huỷ
  build → và cú push tag sau đó không tạo deployment nào để chạy lại. Đúng thứ
  tự: `git push origin <tag>` trước, `git push origin main` sau. Lỡ làm ngược
  rồi thì vào Vercel → Deployments → commit đó → ⋯ → Redeploy, **bỏ tick** "Use
  existing Build Cache" để `ignoreCommand` chạy lại.
