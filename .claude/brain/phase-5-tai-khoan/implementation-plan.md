# Giai đoạn 5 — Tài khoản

Đăng nhập (magic link + Google), middleware bảo vệ route, trang cá nhân
(credits + lịch sử trải bài phân trang + lịch sử giao dịch phân trang + xoá
lượt trải bài). Hạ tầng auth (Supabase Auth wiring, `/auth/callback`,
`requireUser()`) đã có từ Giai đoạn 3/4c — task này xây UI + gate còn thiếu.

## Decisions Needed From You
> [!IMPORTANT]
> - **Bỏ nút "Nạp thêm" khỏi trang cá nhân** (prototype `profile.html` có
>   nút này trỏ `topup.html`) — Giai đoạn 6 (PayOS) chưa xây. Cùng nguyên
>   tắc đã dùng cho CTA "Đọc sâu" ở 4b: không dựng nút trỏ tới trang chưa
>   tồn tại. Thêm lại khi Giai đoạn 6 xong.
> - **Migration RLS mới sẽ áp thẳng lên Supabase project thật** qua
>   `mcp__supabase__apply_migration` (thêm 1 policy `delete` cho `readings`,
>   scope `auth.uid() = user_id`) — đây là thay đổi trên DB sống, xác nhận
>   trước khi tôi chạy.
> - **Xác nhận xoá bằng 2 bước ngay trên nút** (không phải modal, không phải
>   `window.confirm()`) — nếu bạn muốn một hộp thoại xác nhận rõ ràng hơn,
>   nói trước, vì thêm Modal primitive bây giờ tốn thêm 1-2 file nữa.

## Approach
Route protection thật ở tầng middleware (`src/lib/supabase/middleware.ts`,
file đã cố ý để trống phần gate từ Giai đoạn 3) — request tới `/tai-khoan`
mà không có session hợp lệ bị redirect `/dang-nhap?next=/tai-khoan` trước
khi Server Component nào kịp chạy, không dựa vào UI tự ẩn như `/doc-sau`
đang làm tạm. `LoginForm` là Client Component gọi thẳng
`@/lib/supabase/client` (`signInWithOtp`/`signInWithOAuth`) — cả hai đều an
toàn gọi bằng anon key, không cần route handler riêng; cả hai dùng chung
`/auth/callback` đã có sẵn từ Giai đoạn 3. Trang cá nhân là Server Component
đọc `profiles`/`readings`/`credit_ledger` qua anon-key server client (RLS tự
giới hạn theo `auth.uid()`), phân trang bằng query param + `.range()`, giống
hệt cách `/trai-bai?topic=` đã dùng query param cho state thay vì client
fetch. Xoá lượt trải bài là route handler riêng vì đó là mutation, khớp quy
ước hiện có (mọi mutation trong repo đều nằm dưới `/api/*`).

**Considered and rejected**
- *Server Action cho xoá thay vì Route Handler* — Next 15+ hỗ trợ tốt, nhưng
  repo chưa dùng Server Action ở đâu cả; giữ 1 quy ước mutation duy nhất
  (`/api/*`) thay vì trộn 2 cách cho cùng một loại việc.
- *Chỉ gate bằng in-page check như `/doc-sau` đang làm, bỏ qua middleware* —
  timeline liệt "Middleware bảo vệ route" là dòng riêng, tách khỏi "Trang cá
  nhân" — đọc là yêu cầu tường minh, không phải tuỳ chọn.
- *Modal xác nhận xoá* — chỉ 1 chỗ dùng, chưa đủ lý do thêm primitive mới
  theo `design-system.md` ("Search before creating" / không thêm abstraction
  cho 1 use case). Nêu ở Decisions Needed để bạn chốt.

## Proposed Changes

### Database
#### [NEW] `supabase/migrations/20260818000001_readings_delete_policy.sql`
```sql
create policy readings_delete_own on readings
  for delete using (auth.uid() = user_id);
```
`readings` không nằm trong danh sách "không được xoá" ở
`04-database-schema.md §6` (chỉ `orders`/`credit_ledger`/`profiles` bắt buộc
backup — `readings` sinh lại được về mặt dữ liệu, và sản phẩm **yêu cầu**
cho user tự xoá). Áp qua `mcp__supabase__apply_migration` lên project thật
(`zlnrflevvavlhxqvtthj`), theo đúng cách Giai đoạn 3/4a đã làm — không sửa
qua Dashboard UI.

### Primitives
#### [MODIFY] `src/components/ui/Button.tsx`
Thêm `variant: "danger"` vào `ButtonProps`/`VARIANT_CLASS`:
`bg-danger text-on-accent hover:bg-danger` (không có "danger-strong" token
riêng — giữ nguyên màu khi hover, chỉ khác `active:translate-y-px` đã có sẵn
làm feedback bấm). Contrast tự tính (xem Assumptions ở task.md): 5.89:1
(dark) / 6.54:1 (light), cả hai pass 4.5:1.

### Middleware
#### [MODIFY] `src/lib/supabase/middleware.ts`
Thêm sau đoạn `await supabase.auth.getUser()`:
```ts
const PROTECTED_PREFIXES = ["/tai-khoan"];
const { data: { user } } = await supabase.auth.getUser();
if (!user && PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) {
  const url = request.nextUrl.clone();
  url.pathname = "/dang-nhap";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}
```
Đổi `catch` hiện tại (network lỗi → `NextResponse.next()`) giữ nguyên —
lỗi mạng khi refresh session không nên tự ý khoá route, chỉ chặn khi biết
chắc **không có** user. `PROTECTED_PREFIXES` là mảng để Giai đoạn 6 (trang
nạp credits) thêm entry mới không cần sửa logic.

### Auth UI
#### [NEW] `src/app/dang-nhap/page.tsx`
Server Component. Đọc `searchParams.next` (validate: phải bắt đầu `/`,
không bắt đầu `//` — copy đúng guard đã có ở `auth/callback/route.ts`, tránh
open-redirect). Nếu đã có `user` (`getUser()`) → `redirect(next ?? "/")`
ngay, không hiện lại form đăng nhập. Ngược lại render `<LoginForm next={next} />`.

#### [NEW] `src/components/auth/LoginForm.tsx`
Client Component, state `"idle" | "sending" | "sent" | "error"`.
- Input email + nút "Gửi link đăng nhập" → `supabase.auth.signInWithOtp({
  email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })`
  → state `"sent"`: "Đã gửi link đăng nhập tới {email}. Kiểm tra hộp thư."
- Nút "Đăng nhập bằng Google" → `supabase.auth.signInWithOAuth({ provider:
  "google", options: { redirectTo: cùng URL trên } })` — SDK tự
  `window.location` sang Google, không cần xử lý response.
- Lỗi (network/Supabase trả error) → state `"error"` + thông báo + cho thử
  lại (không mất giá trị email đã nhập).

### Layout / Navigation
#### [NEW] `src/components/layout/Header.tsx`
Server Component. Topbar đầu tiên của app thật (trước giờ chỉ có ở
prototype) — brand "Web Tarot AI" link `/`, bên phải: nếu có `user` →
`<SignOutButton />` + link "Tài khoản" (`/tai-khoan`); nếu không → link
"Đăng nhập" (`/dang-nhap`). Dùng token `--color-surface`/`--color-border`
(khớp `.topbar` ở `production/components.css`), `position: sticky` +
`z-index: var(--z-sticky)` (token đã có, chưa dùng ở đâu trong `src/`).

#### [NEW] `src/components/auth/SignOutButton.tsx`
Client Component nhỏ — `supabase.auth.signOut()` (browser client, tự xoá
cookie qua `@supabase/ssr`) rồi `router.push("/")` + `router.refresh()`.

#### [MODIFY] `src/app/layout.tsx`
Render `<Header />` trước `{children}`.
**Consumers affected**: mọi trang hiện có (`/`, `/trai-bai`, `/doc-sau`) đều
qua layout này — thêm 1 thanh cố định trên cùng, cần verify lại 3 trang đó
không bị che/lệch bởi topbar `sticky` (đặc biệt `/trai-bai` có
`scrollIntoView` khi có kết quả — kiểm tra không bị header che mất heading).

### Trang cá nhân
#### [NEW] `src/app/tai-khoan/page.tsx`
Server Component (route đã được middleware gate, không tự check `user` lại
theo kiểu redirect — nhưng vẫn đọc `user.id` từ `getUser()` để query, phòng
trường hợp lý thuyết cookie đổi giữa middleware và render).
- `profiles.credits` — 1 query.
- `readings`: `.select("*", {count:"exact"}).eq("user_id", user.id).order("created_at",{ascending:false}).range(offset, offset+9)`,
  đọc `?readingsPage=`.
- `credit_ledger`: cùng pattern, đọc `?ledgerPage=`.
- Render `<ReadingHistoryList readings={...} page={...} totalPages={...} />`
  và `<LedgerTable rows={...} page={...} totalPages={...} />`.

#### [NEW] `src/app/tai-khoan/loading.tsx`
Skeleton (3 dòng credits-card + 3 dòng list + 2 dòng bảng), dùng class
`skeleton` pattern y hệt `production/components.css` (port bằng Tailwind
`animate-pulse` + `bg-surface-raised` — không cần keyframe shimmer riêng
như bản CSS gốc, `animate-pulse` là utility có sẵn của Tailwind, không phải
token mới).

#### [NEW] `src/app/tai-khoan/error.tsx`
Client Component (`"use client"`, bắt buộc theo Next.js error boundary
convention) — "Không tải được trang cá nhân." + nút `reset()` để thử lại.

#### [NEW] `src/components/account/ReadingHistoryList.tsx`
Props: `{ readings, page, totalPages }`. Rỗng → "Bạn chưa trải bài lần nào"
+ link `/` (không phải `/trai-bai` trực tiếp — chưa chọn chủ đề). Có dữ liệu
→ mỗi dòng: tên lá + chủ đề + tier (Đọc nhanh/Đọc sâu) + ngày giờ (
`Intl.DateTimeFormat("vi-VN")`) + `<DeleteReadingButton readingId={...} cardName={...} />`.
Pagination: `<Link href="?readingsPage=N">` Trước/Sau, ẩn nút biên khi ở
trang đầu/cuối.

#### [NEW] `src/components/account/DeleteReadingButton.tsx`
Client Component, state `"idle" | "confirming" | "deleting" | "error"`.
`idle` → bấm 🗑 → `confirming` (đổi thành 2 nút nhỏ "Xác nhận"/"Huỷ" ngay tại
chỗ, `aria-label` mô tả rõ đang xoá lượt nào) → `deleting` → gọi `DELETE
/api/readings/{id}` → thành công: `router.refresh()` (Server Component load
lại danh sách, dòng biến mất tự nhiên) → lỗi: `"error"`, hiện lại nút với
thông báo ngắn + cho bấm lại.

#### [NEW] `src/components/account/LedgerTable.tsx`
Props: `{ rows, page, totalPages }`. Rỗng → "Chưa có giao dịch nào." Có dữ
liệu → `<table>` trong `<div className="overflow-x-auto">` (không cho page
cuộn ngang ở 375px), `<caption className="sr-only">`, `<th scope="col">` đủ
4 cột (Ngày/Loại/Thay đổi/Số dư sau) — "Loại" dịch từ `reason` enum
(`purchase→"Nạp"`, `reading→"Trừ — Đọc"`, `refund→"Hoàn"`, `bonus→"Tặng"`,
`admin_adjust→"Điều chỉnh"`). Cùng pattern pagination link như trên.

### API
#### [NEW] `src/app/api/readings/[id]/route.ts`
```ts
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("readings").delete().eq("id", id).select();
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```
RLS (`readings_delete_own`) tự chặn xoá lượt của người khác — `data.length
=== 0` gộp chung 2 trường hợp "không tồn tại" và "không phải chủ" thành 1
404, không lộ thông tin lượt đó có tồn tại hay không.

## Accessibility Plan
- Redirect `/tai-khoan` → `/dang-nhap` khi chưa đăng nhập: focus vào `<h1>`
  của `/dang-nhap` sau khi trang tải (Server Component redirect + trang mới
  tự nhiên có focus ở đầu document — không cần JS thêm, khác với SPA
  client-side navigation ở `/trai-bai` vốn cần tự quản lý focus).
- `DeleteReadingButton`: `aria-label` mô tả đủ ngữ cảnh ("Xoá lượt trải bài
  Lá Tháp, 09/08/2026"), không chỉ "Xoá". Trạng thái `confirming` phải giữ
  focus ở nút "Xác nhận" (không nhảy đi đâu) để không bẫy người dùng phải
  tìm lại vị trí.
- `LedgerTable`: `<caption>`, `<th scope="col">` — bảng đọc được bằng screen
  reader, không chỉ đọc được bằng mắt.
- `Header`: `<nav aria-label="Tài khoản">` bọc link Đăng nhập/Tài khoản/Đăng
  xuất — landmark rõ ràng, không lẫn với brand link.
- Contrast: `--color-danger` × `--color-on-accent` tự verify (xem trên) vì
  chưa có trong audit gốc; mọi màu khác tái dùng nguyên token đã audit.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/lib/supabase/middleware.ts` | Chạy trên MỌI request (matcher trong `src/proxy.ts` áp toàn site) | Trung bình — sai logic redirect có thể khoá nhầm route công khai; giới hạn `PROTECTED_PREFIXES` chỉ 1 entry, test kỹ `/`, `/trai-bai`, `/doc-sau` vẫn vào được khi chưa đăng nhập |
| `src/app/layout.tsx` | Mọi trang trong app | Thấp-trung bình — thêm topbar cố định, cần verify không che nội dung/focus target ở các trang đã có (đặc biệt `/trai-bai`'s `scrollIntoView`) |
| `src/components/ui/Button.tsx` | `TopicPicker`, `ReadingStage` (4b) đang dùng `Button` | Thấp — chỉ thêm variant mới, không đổi variant cũ |
| `readings` (RLS mới) | Chỉ thêm quyền `delete`, không đổi `select`/`insert`/`update` hiện có | Thấp — scope chặt `auth.uid() = user_id`, đã dùng đúng pattern các policy khác |

## Verification Plan
### Automated
```
pnpm lint
npx tsc --noEmit
pnpm build
```

### Manual
1. Chưa đăng nhập: vào `/tai-khoan` → redirect `/dang-nhap?next=/tai-khoan`.
   `/`, `/trai-bai`, `/doc-sau` vẫn vào bình thường (không bị khoá nhầm).
2. Đăng nhập bằng magic link thật (email test) → nhận mail → bấm link →
   vào đúng `next` đã lưu → `/tai-khoan` load được, không redirect lại.
3. `/tai-khoan`: credits hiện đúng, danh sách trải bài + giao dịch hiện
   đúng dữ liệu thật của user đó (tạo vài lượt Đọc nhanh ở `/trai-bai` trước
   để có dữ liệu — nhưng nhớ: 4b **không** lưu Đọc nhanh vào `readings`, nên
   cần ít nhất 1 lượt Đọc sâu thật từ 4c, hoặc chèn tay 1-2 dòng test qua
   SQL để verify UI có dữ liệu).
4. Xoá 1 lượt: 2-bước confirm, dòng biến mất sau khi xoá, số lượng còn lại
   đúng; thử xoá ID không tồn tại (qua curl) → 404, không crash.
5. Đăng xuất → quay lại `/tai-khoan` → bị redirect về `/dang-nhap` lại.
6. 375/768/1280/1920, cả 2 theme — đặc biệt bảng giao dịch ở 375px không
   làm page cuộn ngang.
7. Tab qua toàn bộ `/dang-nhap` và `/tai-khoan` — focus luôn thấy được,
   không keyboard trap ở trạng thái `confirming` của nút xoá.
8. Zoom 200% — topbar mới không đè/cắt nội dung.

## Out of Scope
- Nạp credits / PayOS — Giai đoạn 6 (xem Decisions).
- Sửa hồ sơ (display_name/avatar).
- `/doc-sau` chuyển sang dùng middleware gate chung — để nguyên soft-gate
  hiện tại của Giai đoạn 4c, không đụng.
- Theme-toggle control thật trên `Header` — vẫn ngoài phạm vi như đã ghi ở
  4b, token đã theme-aware nên không chặn gate.
