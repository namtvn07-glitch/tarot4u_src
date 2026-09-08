# Đăng nhập Zalo + Đổi mật khẩu

> [!WARNING]
> **HOÃN 2026-09-08.** Phần Zalo tạm dừng; phần mật khẩu đã tách sang
> [`../mat-khau-nang-cap/implementation-plan.md`](../mat-khau-nang-cap/implementation-plan.md)
> và được thiết kế lại (không dùng admin API để đổi mật khẩu nữa, thêm chuẩn NIST).
> Chỉ đọc file này cho phần **Zalo**; mọi mục về mật khẩu ở đây đã lỗi thời.

Thêm một đường đăng nhập không cần email (Zalo — kênh phổ biến nhất ở VN) và trả lại
cho người dùng quyền tự đổi mật khẩu tài khoản email/mật khẩu của mình. Hai việc này
đi chung vì cả hai đều đụng cùng một câu hỏi: *"tài khoản này thuộc loại nào?"*

## Decisions Needed From You

> [!IMPORTANT]
> 1. **Zalo Developer app đã có chưa?** Cần `app_id` + `app_secret` của app đã duyệt,
>    domain đã xác minh, và Callback URL `https://<domain>/auth/zalo/callback` khai
>    trong Zalo console. Không có → code viết xong nhưng **không verify thật được**,
>    tôi sẽ báo `⏭️ skipped` chứ không ghi ✅.
> 2. **Có gộp luôn "Quên mật khẩu" không?** Hiện `AuthModal` gọi
>    `resetPasswordForEmail` rồi `alert(...)`, nhưng **không có trang đặt lại mật
>    khẩu** — link recovery về `/auth/callback` rồi đá về trang chủ, người dùng không
>    bao giờ đổi được. Đề xuất: **tách task riêng** (task này đã đủ rộng), nhưng nếu
>    bạn muốn gộp thì thêm ~1 route + 1 trang.
> 3. **Ngưỡng mật khẩu mới**: hiện `signUp` chỉ ràng `min 6`. Đề xuất mật khẩu **mới**
>    tối thiểu **8 ký tự** (chỉ áp cho luồng đổi, không đụng luồng đăng ký cũ).

## Approach

Supabase Auth **không có provider Zalo dựng sẵn**, và Zalo Login v4 không phải OIDC —
nên không có đường "bật toggle trong Dashboard" như Google. Ta tự chạy OAuth 2.0 +
PKCE ở tầng Next.js route handler (`/auth/zalo/start` → `oauth.zaloapp.com/v4/permission`
→ `/auth/zalo/callback`), rồi *bắc cầu* sang Supabase: tìm hoặc tạo user bằng service
role, sau đó cấp session bằng `admin.generateLink({type:'magiclink'})` →
`verifyOtp({token_hash})` để cookie session được set đúng chuẩn `@supabase/ssr` (mọi
thứ còn lại trong app — middleware, RLS, `requireUser()` — không cần biết user đến từ
đâu). Ánh xạ `zalo_id → user_id` nằm ở **bảng riêng chỉ service role đọc được**, không
nằm trong `profiles`, vì policy `profiles_update_own` cho phép user tự sửa mọi cột
ngoài `credits` — một cột `zalo_id` ở đó sẽ cho phép user tự gán Zalo ID của người
khác vào hồ sơ mình và nuốt luôn lần đăng nhập Zalo sau của họ.

Đổi mật khẩu đi qua một API route thay vì gọi thẳng `supabase.auth.updateUser()` từ
client, vì cần ba thứ mà client không tự làm được đàng hoàng: rate limit qua
`check_rate_limit`, xác minh **mật khẩu hiện tại** trước khi cho đổi, và biết được tài
khoản này *có* mật khẩu hay không (magic-link và Zalo cũng có identity `email`, nên
danh sách `identities` phía client không đủ để phân biệt — phải hỏi
`auth.users.encrypted_password` qua một RPC `security definer`).

**Considered and rejected**
- *Dùng `provider: 'keycloak'`/OIDC generic của Supabase cho Zalo* — Zalo v4 không phát
  hành `id_token` OIDC, không có discovery document. Không khả thi.
- *Cột `profiles.zalo_id`* — rẻ hơn một bảng, nhưng RLS hiện tại cho user tự UPDATE cột
  đó → chiếm quyền các lần đăng nhập Zalo về sau của người khác. Loại.
- *Tin vào `user.identities` để quyết định "tài khoản tự tạo"* — user chỉ dùng magic
  link cũng có identity `email` nhưng **không có mật khẩu**; form đổi mật khẩu sẽ hiện
  ra rồi luôn báo sai mật khẩu hiện tại. Loại, dùng RPC hỏi thẳng DB.
- *Đổi mật khẩu hoàn toàn client-side (`signInWithPassword` rồi `updateUser`)* — chạy
  được, nhưng không rate-limit được và không phân biệt được "chưa từng có mật khẩu".

## Proposed Changes

### Database
#### [NEW] `supabase/migrations/20260908000003_zalo_identity_and_password_check.sql`
```sql
-- Ánh xạ Zalo → user. KHÔNG để trong profiles: policy profiles_update_own cho
-- user tự sửa mọi cột ngoài credits, tức user tự gán zalo_id của người khác được.
create table zalo_identities (
  zalo_id    text primary key,
  user_id    uuid not null unique references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table zalo_identities enable row level security;
-- Cố ý KHÔNG có policy nào: chỉ service role (bỏ qua RLS) đọc/ghi được,
-- cùng khuôn với orders (20260809000002_rls_policies.sql).
revoke all on table zalo_identities from anon, authenticated;

-- "Tài khoản này có mật khẩu không?" — identities không trả lời được câu này
-- (magic-link/Zalo cũng có identity 'email'). auth.users không đọc được qua
-- PostgREST nên phải bọc security definer.
create function current_user_has_password() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select encrypted_password is not null and encrypted_password <> ''
       from auth.users where id = auth.uid()),
    false);
$$;
revoke execute on function current_user_has_password() from public, anon;
grant execute on function current_user_has_password() to authenticated, service_role;
```
- Nếu `apply_migration` bị classifier chặn (đã xảy ra ở Giai đoạn 6): người dùng chạy
  tay trên Dashboard, rồi **bắt buộc verify**:
  `select routine_name, grantee, privilege_type from information_schema.routine_privileges where routine_name = 'current_user_has_password';`
  và `select relrowsecurity from pg_class where relname = 'zalo_identities';`

### Config / Env
#### [MODIFY] `src/lib/env.ts`
- Thêm vào `fieldSchemas` **và** `RAW_ENV` (đọc tĩnh `process.env.TEN_BIEN` — learned
  pattern 2026-08-18, truy cập động làm `NEXT_PUBLIC_*` luôn `undefined` phía client):
  - `ZALO_APP_ID: z.string().min(1).optional()`
  - `ZALO_APP_SECRET: z.string().min(1).optional()`
  - `NEXT_PUBLIC_ZALO_LOGIN_ENABLED: z.enum(["true","false"]).default("false").transform(v => v === "true")`
- `optional()` chứ không bắt buộc kể cả prod: chưa có app Zalo thì site vẫn build/chạy,
  chỉ là nút không hiện.
#### [MANUAL] `.env.example`
- Hook `guard-paths.sh` chặn Claude đọc/ghi file env — **bạn tự thêm 3 dòng trên**
  (kèm comment "lấy ở developers.zalo.me → app → Đăng nhập"). Tôi sẽ nhắc lại ở
  `/finish`.

### Server — Zalo OAuth
#### [NEW] `src/lib/zalo.ts`
- `ZALO_AUTHORIZE_URL = "https://oauth.zaloapp.com/v4/permission"`,
  `ZALO_TOKEN_URL = "https://oauth.zaloapp.com/v4/access_token"`,
  `ZALO_GRAPH_ME_URL = "https://graph.zalo.me/v2.0/me"`.
- `createPkcePair()` — `code_verifier` = 32 byte ngẫu nhiên base64url; `code_challenge`
  = base64url(sha256(verifier)) (`node:crypto`).
- `exchangeCodeForToken(code, verifier)` — POST `application/x-www-form-urlencoded`,
  body `code|app_id|grant_type=authorization_code|code_verifier`, header
  `secret_key: <ZALO_APP_SECRET>`. Zalo trả `{access_token, refresh_token, expires_in}`
  **hoặc** `{error, error_name}` với HTTP 200 → phải kiểm tra `error` chứ không chỉ
  `res.ok`.
- `fetchZaloProfile(accessToken)` — GET `?fields=id,name,picture`, header
  `access_token`. Trả `{ id, name, pictureUrl }` (`picture.data.url`).
- Không lưu Zalo access/refresh token ở đâu cả — ta chỉ cần danh tính một lần.
#### [NEW] `src/app/auth/zalo/start/route.ts` — `GET`, `runtime = "nodejs"`
- 503 + redirect `/dang-nhap?error=zalo_disabled` nếu thiếu `ZALO_APP_ID/SECRET`.
- Sinh PKCE + `state`; set 3 cookie `httpOnly, secure (prod), sameSite:"lax", path:"/auth/zalo", maxAge:600`:
  `zalo_cv`, `zalo_state`, `zalo_next` (`next` được lọc theo đúng quy tắc của
  `src/app/auth/callback/route.ts`: phải bắt đầu `/` và không bắt đầu `//`).
- Redirect 302 sang `permission?app_id&redirect_uri&code_challenge&state`.
#### [NEW] `src/app/auth/zalo/callback/route.ts` — `GET`, `runtime = "nodejs"`
1. Rate limit theo IP: `checkRateLimit("auth-zalo-callback:ip:" + getClientIp(req), 600, 20)`
   (tiền tố tên route — learned pattern 2026-08-27).
2. So `state` với cookie bằng `crypto.timingSafeEqual`; xoá cả 3 cookie ngay.
3. `exchangeCodeForToken` → `fetchZaloProfile`.
4. `select user_id from zalo_identities where zalo_id = ...` (service role).
   - Có → dùng user đó.
   - Chưa có → `admin.auth.admin.createUser({ email: "zalo-<id>@zalo.ventus-tarot.invalid",
     email_confirm: true, user_metadata: { full_name, avatar_url, zalo_id } })`
     (trigger `handle_new_user` tự tạo `profiles` với đúng tên + avatar), rồi
     `insert into zalo_identities`. Nếu insert đụng unique (2 tab song song) → đọc lại
     hàng đã có và dùng user đó thay vì báo lỗi.
5. Chặn user đã bị ban (`banned_until` trong tương lai) → redirect `/dang-nhap?error=zalo_banned`.
6. Cấp session: `admin.auth.admin.generateLink({ type: "magiclink", email })` →
   `properties.hashed_token` → `supabase.auth.verifyOtp({ type: "magiclink", token_hash })`
   với client `@supabase/ssr` của route (cookie được ghi vào response).
7. Redirect `${origin}${next}`. Mọi nhánh lỗi → `/dang-nhap?error=zalo` +
   `Sentry.captureException` (theo khuôn `src/app/api/orders/route.ts`).
#### [MODIFY] `src/app/api/account/route.ts`
- Thêm `await admin.from("zalo_identities").delete().eq("user_id", user.id)` trước bước
  ban. Không xoá thì người dùng xoá tài khoản xong đăng nhập Zalo lại sẽ rơi vào chính
  cái user đã bị ban → kẹt vĩnh viễn, không tạo được tài khoản mới.

### Server — Đổi mật khẩu
#### [NEW] `src/app/api/account/password/route.ts` — `runtime = "nodejs"`
- `GET` → `{ canChangePassword: boolean }`:
  `requireUser()` → 401; gọi `supabase.rpc("current_user_has_password")` bằng client
  SSR (cần `auth.uid()`, **không** dùng admin client vì admin không có uid).
- `POST` → body `{ currentPassword, newPassword }` (zod: hiện tại `min 6`, mới `min 8`,
  phải khác nhau):
  1. `requireUser()` → 401.
  2. `checkRateLimit("account-password:user:" + user.id, 3600, 5)` → 429.
  3. RPC `current_user_has_password` false → 400 `no_password_set`.
  4. Xác minh mật khẩu hiện tại bằng **client tạm** (`createClient(url, anonKey,
     {auth:{persistSession:false, autoRefreshToken:false}})`) gọi
     `signInWithPassword({ email: user.email, password: currentPassword })`; sai →
     400 `invalid_current_password`; đúng → `signOut()` ngay trên client tạm để không
     để lại refresh token treo.
  5. `admin.auth.admin.updateUserById(user.id, { password: newPassword })` → 200 `{ok:true}`.
- `requireUser()` hiện chỉ trả `{id}` — cần email, nên route tự gọi
  `supabase.auth.getUser()` (không sửa `src/lib/auth.ts`, tránh đụng 5 route khác).

### UI
#### [MODIFY] `src/components/AuthModal.tsx`
- Thêm nút "Tiếp tục với Zalo" **ngay trên** nút Google, chỉ render khi
  `env.NEXT_PUBLIC_ZALO_LOGIN_ENABLED`. Là `<a href="/auth/zalo/start?next=...">` chứ
  không phải `<button>` — đây là điều hướng thật, không phải hành động JS (rule
  "semantics first"); style dùng lại đúng class của nút Google để hai nút cân nhau,
  cao 44px (`h-11` sẵn có).
- Icon Zalo: inline SVG logo + màu thương hiệu `#0068FF`. Đây là **một trong các ngoại
  lệ hợp lệ của token rule** (màu thương hiệu bên thứ ba, y hệt 4 màu Google đang nằm
  trong file) — kèm comment nói rõ.
- Đọc `?error=zalo…` từ URL để hiện lại đúng ô lỗi đỏ đã có (`errorMsg`), thay vì im
  lặng: `zalo` → "Không đăng nhập được bằng Zalo. Vui lòng thử lại.", `zalo_banned` →
  "Tài khoản này đã bị vô hiệu hoá."
#### [NEW] `src/components/account/ChangePasswordForm.tsx` (`"use client"`)
- Fetch `GET /api/account/password` lúc mount → **loading** (skeleton 1 dòng) /
  **không đủ điều kiện** (render `null`, kèm không gì cả — user Google/Zalo không thấy
  mục này) / **sẵn sàng** (form).
- Form: 3 input (`current-password`, `new-password` ×2 để xác nhận), mỗi input có
  `<label htmlFor>` thật, `autoComplete` đúng, `minLength`, nút hiện/ẩn mật khẩu có
  `aria-label` + `aria-pressed`.
- **success**: thay form bằng thông báo xanh `role="status"` + nút "Đổi mật khẩu khác".
  **error**: `<p role="alert">` với thông điệp tiếng Việt map từ mã lỗi
  (`invalid_current_password`, `rate_limited`, `no_password_set`, mặc định).
- Style bám khuôn `DeleteAccountButton.tsx` (cùng bảng hex legacy, `rounded-xl`,
  `text-xs`, min-height 44px cho vùng bấm).
#### [MODIFY] `src/screens/AccountScreen.tsx`
- Thêm `<section>` "Bảo mật" **ngay trước** section "Vùng nguy hiểm" (dòng ~321), cùng
  khuôn `border-t`, tiêu đề `h2` — thứ tự heading hiện tại là `h1` (tên user) → `h2`,
  không nhảy cấp. Chỉ render khi `user.isLoggedIn`.

## Accessibility Plan
- **Ngữ nghĩa**: nút Zalo là `<a>` (điều hướng); form đổi mật khẩu là `<form>` + `<label>`
  gắn `htmlFor`/`useId`; section mới có `<h2>` thật, không phải div to chữ.
- **Bàn phím**: Tab từ nút Zalo → Google → email → mật khẩu → submit (thứ tự DOM =
  thứ tự thị giác, không có `tabIndex` dương). Form đổi mật khẩu: 3 input → toggle
  hiện/ẩn → submit; `Enter` submit; không có bẫy focus (không phải modal).
- **Thông báo động**: kết quả đổi mật khẩu vào `role="alert"` (lỗi) /`role="status"`
  (thành công) để screen reader đọc mà không cần đổi trang.
- **Màu**: `#0068FF` chỉ dùng làm nền icon/viền, **không** dùng làm chữ trên nền tối
  (`#0068FF` trên `#251d16` chỉ ~2.9:1). Chữ nút giữ nguyên `#f3ece1` trên `#251d16`
  (~11:1) như nút Google. Ô lỗi/thành công tái dùng cặp màu đã có
  (`#f0605f`/`#5fbf8c` trên `#15100b`) — đã đạt ≥4.5:1 ở các màn hiện tại.
- **Không chỉ dựa vào màu**: lỗi có icon `AlertCircle` + chữ; thành công có
  `CheckCircle` + chữ.
- Vùng bấm ≥44×44 (`h-11` cho nút, `py-2.5`+`min-h-[44px]` cho input).

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/lib/env.ts` | Toàn app (import cả ở client qua `orders.ts`) | Trung bình — thêm field sai kiểu làm vỡ build mọi trang. Chỉ thêm, không sửa field cũ; nhớ cả 2 nơi (`fieldSchemas` + `RAW_ENV`). |
| `src/components/AuthModal.tsx` | 7 trang (`/`, `/trai-bai`, `/doc-sau`, `/thu-vien`, `/tai-khoan`, `/nap-credits`, `/dang-nhap`) | Trung bình — mọi lối đăng nhập đi qua đây. Thêm 1 nút + 1 nhánh đọc query param, không đụng logic Google/email hiện có. |
| `src/screens/AccountScreen.tsx` | `/tai-khoan` | Thấp — thêm 1 section cuối trang. |
| `src/app/api/account/route.ts` (DELETE) | Nút xoá tài khoản | Thấp, nhưng **bắt buộc**: thiếu bước xoá ánh xạ = user tự khoá mình vĩnh viễn. |
| `zalo_identities`, `current_user_has_password()` | Mới hoàn toàn | Thấp về tương thích; cao về bảo mật nếu quên `revoke`/RLS → verify bằng `information_schema` sau migration. |
| Avatar Zalo (`*.zdn.vn`) | `Header.tsx`, `AccountScreen.tsx` | Không cần đổi gì — cả hai dùng `<img>` thường, và `next.config` đã mở `remotePatterns: hostname "**"`. Đã kiểm. |
| `/auth/zalo/*` | Route mới | `src/proxy.ts` chạy `updateSession` trên mọi request nhưng `/auth/zalo/*` không nằm trong `PROTECTED_PREFIXES` → không bị redirect. Đã kiểm. |

## Verification Plan

### Automated
- `npm run lint` (có rule React Compiler — không gọi hàm impure trong thân render;
  dùng `useState(() => …)` nếu cần giá trị tính một lần — learned 2026-08-18)
- `npx tsc --noEmit`
- `npm run build`
- `test`: n/a (dự án chưa có test script)

### Manual
1. **Spike trước tiên** (chặn cả task): với một user email/mật khẩu test có sẵn, chạy
   thử `generateLink` + `verifyOtp` trong một route tạm → xác nhận cookie session được
   set và `/tai-khoan` vào được. Không đạt → dừng, báo lại, không xây tiếp phần Zalo.
2. **Zalo end-to-end** (cần app thật): `/dang-nhap` → "Tiếp tục với Zalo" → cấp quyền →
   quay lại đúng `next`, Header hiện tên + avatar Zalo, `/tai-khoan` hiển thị đúng.
   Đăng nhập lần 2 phải vào **đúng user cũ** (không tạo user mới) —
   `select count(*) from zalo_identities`.
3. **Nhánh lỗi Zalo**: sửa `state` trong URL callback → về `/dang-nhap?error=zalo` với ô
   lỗi đỏ, không có session nào được cấp.
4. **Đổi mật khẩu**: tài khoản email/mật khẩu → `/tai-khoan` thấy mục "Bảo mật"; sai
   mật khẩu hiện tại → lỗi đúng; đổi thành công → đăng xuất, đăng nhập lại bằng mật
   khẩu **mới** (và mật khẩu cũ phải thất bại).
5. **Phân biệt loại tài khoản**: đăng nhập bằng Google (hoặc Zalo) → mục "Bảo mật"
   **không** hiện.
6. **Rate limit**: gọi `POST /api/account/password` sai mật khẩu 6 lần → lần 6 nhận 429.
7. **Responsive/theme**: `/dang-nhap` và `/tai-khoan` ở 375 / 768 / 1280 (dự án chỉ có
   một theme tối — không có toggle theme để đối chiếu).
8. **Bàn phím**: Tab qua toàn bộ modal đăng nhập và form đổi mật khẩu, focus luôn thấy được.
9. **Dọn dữ liệu test**: xoá user test theo đúng thứ tự FK (`readings`/`credit_ledger`
   → `zalo_identities` → `auth.users`) rồi xác nhận `count(*) = 0` (learned 2026-08-18).

## Out of Scope
- Trang `/dat-lai-mat-khau` cho luồng "Quên mật khẩu" (hiện đang hỏng — xem
  `task.md`, quyết định #2).
- Cho user Google/Zalo **đặt** mật khẩu lần đầu, và liên kết Zalo vào tài khoản email
  đã tồn tại (Zalo không trả email nên không có khoá nào để khớp tự động).
- Xoá `src/components/auth/LoginForm.tsx` + `PasswordAuthForm.tsx` (code chết).
- Refactor `AuthModal.tsx` sang design token.
- Lưu/refresh Zalo access token, gọi thêm API Zalo (gửi tin, OA).
