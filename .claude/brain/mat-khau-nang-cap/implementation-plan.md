# Đổi mật khẩu + Quên mật khẩu + Chuẩn mật khẩu NIST

Hiện tại mật khẩu là phần yếu nhất của hệ thống tài khoản: đăng ký chỉ cần **6 ký tự**
bất kỳ, không có đường đổi mật khẩu, và "Quên mật khẩu?" gửi mail xong `alert()` —
nhưng **không có trang nào để đặt lại**, link trong mail rơi vào `/auth/callback` rồi
bị đá về trang chủ. Task này đóng cả ba lỗ bằng **một** bộ quy tắc mật khẩu dùng chung.

## Decisions — đã chốt 2026-09-08

> [!IMPORTANT]
> 1. **Độ dài tối thiểu = 8** (bạn chọn). Ghi rõ để sau này không ai hiểu nhầm: NIST
>    SP 800-63B-4 cho phép sàn 8 **khi có MFA**, và đòi **15 nếu mật khẩu là cách xác
>    thực duy nhất** — app này chưa có MFA, nên 8 là **sai lệch có chủ đích** so với
>    chuẩn, đổi lấy ma sát đăng ký thấp. Bù lại bằng những phần **không nhân nhượng**:
>    chặn mật khẩu đã lộ (HIBP), chặn mật khẩu phổ biến/theo ngữ cảnh, chặn chuỗi tuần
>    tự/lặp, và **khuyến khích 15** trong checklist (đạt ở 8, gắn nhãn "mạnh" ở 15).
>    Đây là dòng cần ghi vào `docs/learned/auth.md` lúc `/finish`: **ngày nào thêm MFA
>    thì con số 8 mới thật sự đúng chuẩn.**
> 2. **Gói Supabase: chưa rõ.** Code không phụ thuộc gói — việc chặn mật khẩu đã lộ do
>    `src/lib/password.ts` làm (HIBP range API, miễn phí, không cần key). Toggle
>    "Leaked password protection" của Supabase (cần **Pro**) chỉ là lớp thứ hai; bước
>    kiểm tra + bật nếu được nằm ở bảng cấu hình Dashboard bên dưới, xác nhận lúc
>    `/finish`. Advisor `auth_leaked_password_protection` hiện đang WARN.
> 3. **HIBP chết → fail-open + `Sentry.captureException`.** Không chặn người dùng đăng
>    ký vì API bên thứ ba sập.

## Approach

Một module thuần `src/lib/password.ts` là **nguồn sự thật duy nhất** cho "mật khẩu thế
nào là hợp lệ", import được ở cả client (phản hồi realtime khi gõ) lẫn server (API
route, nơi phán quyết thật sự) — dùng Web Crypto nên không có API riêng của Node, chạy
được cả hai phía. Hai component `PasswordField` + `PasswordRequirements` bọc phần UI,
rồi ba lối vào (đăng ký, đổi mật khẩu, đặt lại mật khẩu) chỉ việc lắp vào — đó là cách
duy nhất để ba nơi không trôi khỏi nhau sau vài tháng.

Việc đổi mật khẩu đi qua API route để có rate limit và xác minh mật khẩu hiện tại,
nhưng thao tác đổi thực hiện bằng **client tạm đăng nhập bằng chính mật khẩu cũ** rồi
gọi `updateUser()` — **không** dùng `admin.updateUserById()`. Lý do: đường admin đi
vòng qua chính sách mật khẩu của GoTrue (độ dài tối thiểu, leaked-password protection),
tức là ta sẽ tự tay tạo ra một cửa hậu yếu hơn cửa đăng ký. Đường user-context thì mọi
chính sách cấu hình trên Dashboard vẫn áp, còn service role thì không cần dùng đến.

Luồng quên mật khẩu tái sử dụng `/auth/callback` sẵn có (đã chạy thật cho magic link +
Google): mail recovery → `?next=/dat-lai-mat-khau` → callback đổi code lấy session →
trang đặt lại mật khẩu chỉ cần một session hợp lệ là làm việc được.

**Considered and rejected**
- *`admin.auth.admin.updateUserById({password})`* — bỏ qua policy của GoTrue (xem trên).
- *Đổi mật khẩu thuần client (`signInWithPassword` rồi `updateUser`)* — không rate
  limit được, và không phân biệt được "chưa từng có mật khẩu" với "gõ sai".
- *Dùng `user.identities` để biết tài khoản có mật khẩu không* — user chỉ dùng magic
  link cũng có identity `email` nhưng **không có mật khẩu**; form sẽ hiện ra rồi luôn
  báo sai. Dùng RPC hỏi thẳng `auth.users.encrypted_password`.
- *Thêm thư viện `zxcvbn`* (~800KB) — chi phí bundle không xứng: NIST-4 cần
  **blocklist** (HIBP + phổ biến + ngữ cảnh) chứ không cần chấm điểm entropy tinh vi.
- *Ép quy tắc thành phần (1 hoa + 1 số + 1 ký tự đặc biệt)* — NIST-4 **cấm**; nó đẩy
  người dùng tới `Matkhau@123` (có trong mọi wordlist) mà không tăng an toàn thật.

## Proposed Changes

### Database
#### [NEW] `supabase/migrations/20260908000003_current_user_has_password.sql`
```sql
-- "Tài khoản này có mật khẩu không?" — auth.users không đọc được qua PostgREST,
-- và identities không trả lời được (user magic-link cũng có identity 'email'
-- nhưng không có mật khẩu). Chỉ trả boolean, không lộ gì thêm.
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
- Nếu `apply_migration` bị chặn → bạn chạy tay trên Dashboard, rồi **verify**:
  `select grantee, privilege_type from information_schema.routine_privileges where routine_name = 'current_user_has_password';`
  → phải thấy đúng `authenticated` + `service_role`, **không** có `PUBLIC`/`anon`.

### Lõi dùng chung
#### [NEW] `src/lib/password.ts`
```ts
export const PASSWORD_MIN_LENGTH = 8;         // chốt ở Decision #1 (dưới mức NIST-4
                                              // cho hệ không MFA — có chủ đích)
export const PASSWORD_RECOMMENDED_LENGTH = 15; // mốc gắn nhãn "mạnh" trong checklist
export const PASSWORD_MAX_BYTES = 72;         // bcrypt của GoTrue cắt sau 72 byte
```
- `PasswordRuleId = "length" | "maxLength" | "common" | "context" | "repeat"`
- `evaluatePassword(password, { email }): { failures: PasswordRuleId[]; isStrong: boolean }`
  — thuần, không network, dùng được lúc gõ:
  - `length` — < `PASSWORD_MIN_LENGTH` (đếm **code point**, không phải `.length` UTF-16)
  - `maxLength` — > 72 byte UTF-8 (`new TextEncoder().encode(pw).length`)
  - `common` — nằm trong `COMMON_PASSWORDS` (~200 mục inline: `123456`, `password`,
    `qwerty`, `matkhau`, `123456789`, … + biến thể VN không dấu). Không thêm dependency.
  - `context` — chứa (không phân biệt hoa thường) phần trước `@` của email, hoặc
    `tarot` / `ventus` / `boitarot` / tên miền site
  - `repeat` — toàn một ký tự lặp, hoặc chuỗi tuần tự (`abcdefgh…`, `12345678…`)
  - **Không** có rule nào về hoa/thường/số/ký tự đặc biệt (NIST-4 cấm) — cho phép
    khoảng trắng và unicode.
- `isPasswordBreached(password): Promise<boolean | null>` — HIBP k-anonymity: SHA-1
  bằng `crypto.subtle.digest("SHA-1", …)` (có ở cả Node 18+ lẫn browser), gửi **5 ký
  tự hex đầu** tới `https://api.pwnedpasswords.com/range/<prefix>` với header
  `Add-Padding: true`, so hậu tố trong danh sách trả về. Mật khẩu **không bao giờ** rời
  máy. Trả `null` khi lỗi mạng/timeout 3s → caller quyết định (mặc định: cho qua, log).
- `PasswordSchema` (zod) — dùng ở API route: `z.string()` + `.superRefine` gọi
  `evaluatePassword` để thông điệp lỗi ở server và client là **một**.

#### [NEW] `src/components/auth/PasswordField.tsx` (`"use client"`)
- `<label htmlFor>` thật + input + nút hiện/ẩn (`<button type="button" aria-pressed
  aria-label="Hiện mật khẩu / Ẩn mật khẩu">`), `aria-describedby` trỏ tới khối
  requirements, `autoComplete` truyền từ ngoài vào (`new-password` /
  `current-password`), **cho phép dán** (không chặn `onPaste`).
- Style bám hex/`rounded-xl`/`text-xs` của `AuthModal.tsx` để lắp vào không lệch.

#### [NEW] `src/components/auth/PasswordRequirements.tsx` (`"use client"`)
- Nhận `password`, `email` → tự chạy `evaluatePassword` + gọi `isPasswordBreached`
  (debounce 500ms, huỷ request cũ bằng `AbortController`).
- Hiển thị checklist: mỗi dòng có **icon `Check`/`X` + chữ** (không chỉ dựa vào màu),
  bọc trong `aria-live="polite"` để screen reader biết trạng thái đổi.
- 3 trạng thái riêng cho HIBP: `Đang kiểm tra…` / `Mật khẩu này đã xuất hiện trong dữ
  liệu bị rò rỉ — hãy chọn mật khẩu khác` / đạt.
- Export `usePasswordCheck(password, email)` trả `{ failures, breached, isChecking,
  canSubmit }` để form cha khoá nút submit.

### Feature — Đổi mật khẩu (đã đăng nhập)
#### [NEW] `src/app/api/account/password/route.ts` — `runtime = "nodejs"`
- `GET` → `{ canChangePassword }`: `supabase.auth.getUser()` → 401 nếu chưa đăng nhập;
  `supabase.rpc("current_user_has_password")` bằng client SSR (cần `auth.uid()`, nên
  **không** dùng admin client).
- `POST` body `{ currentPassword, newPassword }`:
  1. 401 nếu chưa đăng nhập.
  2. `checkRateLimit("account-password:user:" + user.id, 3600, 5)` → 429 (tiền tố tên
     route — learned 2026-08-27).
  3. `PasswordSchema` + `newPassword !== currentPassword` → 400 `invalid_request` kèm
     `failures`.
  4. `isPasswordBreached(newPassword)` → `true` thì 400 `breached_password`; `null`
     (HIBP lỗi) thì cho qua + `Sentry.captureException`.
  5. RPC `current_user_has_password` false → 400 `no_password_set`.
  6. Client tạm: `createClient(url, anonKey, { auth: { persistSession: false,
     autoRefreshToken: false } })` → `signInWithPassword({ email, password:
     currentPassword })` → sai thì 400 `invalid_current_password`.
  7. Trên **chính client tạm đó**: `auth.updateUser({ password: newPassword })` → map
     lỗi GoTrue (`weak_password`, `same_password`) → 400. Rồi `auth.signOut()` để
     không để lại refresh token treo.
  8. 200 `{ ok: true }`. Session cookie hiện tại của user **vẫn còn hiệu lực** (không
     ép đăng nhập lại — nằm ngoài scope).

#### [NEW] `src/components/account/ChangePasswordForm.tsx` (`"use client"`)
- Mount → `GET /api/account/password`:
  **loading** (skeleton 1 dòng) / **không đủ điều kiện** → render `null` (user Google
  không thấy gì) / **sẵn sàng** → form.
- Form: mật khẩu hiện tại + mật khẩu mới (`PasswordField`) + `PasswordRequirements` +
  ô xác nhận; nút submit `disabled` khi `!canSubmit`.
- **success**: thay form bằng `role="status"` xanh + nút "Đổi mật khẩu khác"; chuyển
  focus vào thông báo (`tabIndex={-1}` + `ref.focus()` trong `useEffect`).
- **error**: `<p role="alert">` với thông điệp tiếng Việt map từ mã lỗi
  (`invalid_current_password` → "Mật khẩu hiện tại không đúng.", `rate_limited` →
  "Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.", `breached_password`,
  `no_password_set`, mặc định).
- Style bám khuôn [`DeleteAccountButton.tsx`](../../../src/components/account/DeleteAccountButton.tsx).

#### [MODIFY] `src/screens/AccountScreen.tsx`
- Thêm `<section>` "Bảo mật" **ngay trước** section "Vùng nguy hiểm" (dòng ~321), cùng
  khuôn `pt-6 border-t` + `<h2>` (thứ tự heading hiện tại `h1` → `h2`, không nhảy cấp).
  Chỉ render khi `user.isLoggedIn`. Truyền `email={user.email}` xuống form (cho rule
  `context`).

### Feature — Quên mật khẩu
#### [MODIFY] `src/components/AuthModal.tsx`
Ba thay đổi, không đụng logic Google/magic link:
1. **Bỏ `alert()`** ở nút "Quên mật khẩu?" (dòng ~279-295). Thay bằng handler async:
   `resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/dat-lai-mat-khau` })`,
   có `loading`, và kết quả hiện ở ô xanh sẵn có (`role="status"`): "Nếu email này có
   tài khoản, chúng tôi đã gửi link đặt lại mật khẩu." — **thông điệp trung tính,
   không tiết lộ email nào có tồn tại** (chống dò tài khoản).
2. **Tab Đăng ký** dùng `PasswordField` + `PasswordRequirements`; nút submit khoá tới
   khi đạt. Bỏ `minLength={6}`, bỏ thông điệp lỗi "ít nhất 6 ký tự".
3. Đọc `?error=link_expired` từ URL → hiện ô lỗi "Link đặt lại mật khẩu đã hết hạn
   hoặc đã dùng rồi. Hãy yêu cầu link mới."
> Tab **Đăng nhập** giữ nguyên: không áp quy tắc mới lúc đăng nhập, người dùng cũ với
> mật khẩu 6 ký tự vẫn vào được bình thường.

#### [NEW] `src/app/dat-lai-mat-khau/page.tsx` (`"use client"`)
- Mount → `supabase.auth.getUser()`:
  - **loading** — spinner.
  - **không có session** → trạng thái "link hết hạn": giải thích + ô nhập email + nút
    gửi lại link (dùng lại đúng hàm ở trên).
  - **có session** → form đặt mật khẩu mới (`PasswordField` + `PasswordRequirements` +
    ô xác nhận) → `supabase.auth.updateUser({ password })`.
- **success** → `role="status"` + tự chuyển `/tai-khoan` sau 2s (và có link bấm tay
  cho ai tắt JS/animation).
- Dùng `Header`/`Footer` như các trang khác để không rơi ra ngoài layout chung.
- **Không** thêm vào `sitemap.ts` (trang riêng tư, sitemap là danh sách liệt kê tay).

#### [MODIFY] `src/app/auth/callback/route.ts`
- Nhánh thất bại hiện tại đá thẳng về `/` — người dùng bấm link recovery hết hạn sẽ
  đứng ở trang chủ không hiểu chuyện gì. Sửa: nếu `next !== "/"` thì redirect
  `${origin}${next}?error=link_expired`, còn lại giữ nguyên về `/`.
- Không đụng phần chống open-redirect đang có (`startsWith("/")` + chặn `//`).

#### [MODIFY] `src/app/robots.ts`
- Thêm `/dat-lai-mat-khau` vào `disallow` (cạnh `/tai-khoan`, `/auth/`).

### Cấu hình Supabase (bạn bấm trên Dashboard — tôi không làm được)
| Nơi | Đặt thành | Vì sao |
|-----|-----------|--------|
| Authentication → Sign In / Providers → Email → **Minimum password length** | `8` (khớp `PASSWORD_MIN_LENGTH`) | Lớp chặn phía server của GoTrue, phòng khi có đường nào lách UI |
| … → **Password Requirements** | **No required characters** | NIST-4 cấm ép quy tắc thành phần |
| Authentication → **Leaked password protection** | Bật (nếu gói Pro) | Đóng luôn advisor `auth_leaked_password_protection` đang WARN |
| Authentication → URL Configuration → Redirect URLs | Đã có `.../auth/callback` cho Google/magic link — **kiểm tra lại** là đủ, không cần thêm | Link recovery dùng chung callback đó |

## Accessibility Plan
- **Ngữ nghĩa**: `<form>` + `<label htmlFor>` cho mọi input (không placeholder thay
  label); "Quên mật khẩu?" là `<button type="button">` (hành động, không điều hướng);
  trang reset có `<h1>` riêng, section Bảo mật là `<h2>` — không nhảy cấp.
- **Bàn phím**: Tab qua checklist yêu cầu không bị kẹt (chỉ text, không focusable);
  toggle hiện/ẩn nằm ngay sau input trong DOM; `Enter` submit; modal đăng nhập giữ
  nguyên hành vi hiện tại.
- **Thông báo động**: checklist trong `aria-live="polite"` (không `assertive` — nó đổi
  theo từng ký tự gõ, assertive sẽ cắt lời screen reader liên tục); kết quả submit
  dùng `role="alert"` (lỗi) / `role="status"` (thành công).
- **Focus**: sau khi đổi/đặt lại mật khẩu thành công, focus chuyển vào thông báo
  (`tabIndex={-1}`) để người dùng screen reader biết chuyện gì vừa xảy ra.
- **Không chỉ dựa vào màu**: mỗi dòng checklist có icon `Check`/`X` + chữ mô tả rõ.
- **Tương phản** (theme tối duy nhất của dự án): tái dùng cặp đã có —
  `#5fbf8c`/`#f0605f` trên `#15100b` (≥4.5:1), chữ `#f3ece1` trên `#0e0a08`. Chữ mờ
  `#7a6e5d` **không** dùng cho nội dung checklist (chỉ ~3.2:1) — dùng `#b3a48d`.
- Vùng bấm ≥44×44 (`h-11` / `min-h-[44px]`), input `py-2.5` trở lên.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/components/AuthModal.tsx` | 7 trang (`/`, `/trai-bai`, `/doc-sau`, `/thu-vien`, `/tai-khoan`, `/nap-credits`, `/dang-nhap`) | **Cao nhất trong task** — mọi lối đăng nhập/đăng ký đi qua đây. Chỉ đụng nhánh đăng ký + nút quên mật khẩu; nhánh đăng nhập, Google, magic link không đổi. Verify cả 3 nhánh sau khi sửa. |
| `src/app/auth/callback/route.ts` | Google OAuth, magic link, recovery | Trung bình — chỉ đổi **nhánh lỗi**; nhánh thành công giữ nguyên từng dòng. |
| `src/screens/AccountScreen.tsx` | `/tai-khoan` | Thấp — thêm 1 section. |
| `src/lib/password.ts` (mới) | 3 form + 1 API route | Thấp lúc thêm; sau này **đổi hằng số ở đây là đổi luật ở cả 4 nơi** — đúng ý đồ. |
| `current_user_has_password()` | API route mới | Thấp về tương thích, cao nếu quên `revoke` → verify bằng `information_schema`. |
| `/dat-lai-mat-khau` (route mới) | — | Thấp, nhưng **cố ý KHÔNG thêm vào `PROTECTED_PREFIXES`** (`src/lib/supabase/middleware.ts`): người bấm link hết hạn chưa có session, thêm vào đó là đá họ sang `/dang-nhap` thay vì cho họ thấy trạng thái "link hết hạn" + gửi lại. |
| Cấu hình Dashboard (min length 8) | Toàn bộ signUp/updateUser | Trung bình — nếu số trên Dashboard lệch với `PASSWORD_MIN_LENGTH` thì user nhận lỗi khó hiểu từ GoTrue (hoặc UI chặn chặt hơn server một cách vô hình). Hai con số **phải khớp**. |

## Verification Plan

### Automated
- `npm run lint` (React Compiler rules: không gọi hàm impure trong thân render —
  learned 2026-08-18)
- `npx tsc --noEmit`
- `npm run build`
- `test`: n/a (dự án chưa có test script)

### Manual
> Dùng tài khoản test **thật** tạo qua chính UI đăng ký (learned 2026-08-18 — không
> vòng qua `guard-paths.sh` để tự chế session), dọn sạch sau khi xong.

1. **Đăng ký**: `password` → chặn (phổ biến); `Matkhau123456` chứa "matkhau" → chặn
   (context/common); `12345678` → chặn (tuần tự); mật khẩu 7 ký tự → chặn (độ dài);
   một mật khẩu đã lộ nổi tiếng (vd. `Tr0ub4dor&3`) → chặn bởi HIBP; mật khẩu ngẫu
   nhiên 14 ký tự → qua, tạo được tài khoản. Đồng thời kiểm tra mật khẩu **8 ký tự
   ngẫu nhiên chưa lộ** → qua (đúng ngưỡng đã chốt, không được chặt hơn ngầm).
2. **HIBP không mạng**: chặn `api.pwnedpasswords.com` trong DevTools → form vẫn submit
   được (fail-open) và có 1 event Sentry.
3. **Đổi mật khẩu**: `/tai-khoan` → mục "Bảo mật" hiện; sai mật khẩu hiện tại → lỗi
   đúng; mật khẩu mới trùng cũ → lỗi; đổi thành công → **đăng xuất, đăng nhập lại bằng
   mật khẩu mới** (và mật khẩu cũ phải thất bại).
4. **Phân biệt loại tài khoản**: đăng nhập bằng Google → mục "Bảo mật" **không** hiện.
5. **Quên mật khẩu end-to-end**: nhập email thật → nhận mail → bấm link →
   `/dat-lai-mat-khau` có form → đặt mật khẩu mới → vào thẳng `/tai-khoan` → đăng nhập
   lại bằng mật khẩu mới.
6. **Link hỏng**: mở `/auth/callback?code=sai&next=/dat-lai-mat-khau` → về
   `/dat-lai-mat-khau?error=link_expired`; mở `/dat-lai-mat-khau` khi chưa đăng nhập →
   trạng thái "link hết hạn" + gửi lại được.
7. **Rate limit**: `POST /api/account/password` sai mật khẩu 6 lần → lần thứ 6 nhận 429.
8. **Không lộ thông tin**: gửi reset cho email **không tồn tại** → vẫn hiện đúng thông
   điệp trung tính như email có thật.
9. **Responsive**: `/dang-nhap` (modal), `/tai-khoan`, `/dat-lai-mat-khau` ở
   **375 / 768 / 1280**. Chỉ có một theme tối — không có theme sáng để đối chiếu.
10. **Bàn phím + screen reader**: Tab hết modal đăng ký và form đổi mật khẩu, focus
    luôn nhìn thấy; checklist đọc được khi thay đổi; sau khi đổi xong focus nhảy vào
    thông báo.
11. **Dọn dữ liệu test**: xoá theo đúng thứ tự FK (`readings` / `credit_ledger` →
    `auth.users`, vì `on delete restrict`) rồi xác nhận `count(*) = 0`.

## Out of Scope
- Đăng nhập Zalo — [`../auth-zalo-hoan-lai/`](../auth-zalo-hoan-lai/task.md).
- Đặt mật khẩu lần đầu cho tài khoản Google/OAuth; liên kết provider.
- MFA/2FA/passkey (nếu sau này có MFA thì mốc NIST tụt về 8 ký tự — ghi lại ở
  `docs/learned/auth.md` khi `/finish`).
- Ép đăng xuất mọi thiết bị khác sau khi đổi mật khẩu.
- Dọn code chết `LoginForm.tsx` / `PasswordAuthForm.tsx`; refactor `AuthModal` sang token.
