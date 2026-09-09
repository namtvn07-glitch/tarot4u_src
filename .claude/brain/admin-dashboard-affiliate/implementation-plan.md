# Admin Dashboard + Affiliate Link Tracking (bản v2 — sau rà soát lỗ hổng)

## Context

App chưa có khái niệm admin/role nào, cũng chưa có cơ chế theo dõi nguồn traffic
marketing nào. Cần: (1) trang chỉ admin xem được — tổng quan user + doanh thu;
(2) công cụ tạo link affiliate + đo **chất lượng** user đến từ mỗi link.

Bản v1 đã được duyệt và bắt đầu thực thi, nhưng dừng giữa chừng để rà soát. Rà
soát đó **kiểm chứng trực tiếp trên DB thật** (giả lập role `authenticated`
trong transaction, đã dọn sạch) và tìm ra 2 lỗ hổng thật trong chính thiết kế
v1, cộng vài điểm mù. Bản v2 này là kết quả sau khi sửa.

### Đã áp dụng lên DB thật (không rollback)
| Version | Tên | Nội dung |
|---|---|---|
| `20260909080214` | `admin_users_table` | bảng `admin_users` + RLS select-own |
| `20260909080248` | `affiliate_schema` | `affiliate_links`, `affiliate_clicks`, `profiles.referred_by_code` |

⚠️ Hai migration này mới nằm trên remote, **chưa có file `.sql` trong repo** —
đúng loại lệch mà repo từng dính (kể lại trong `20260829000001`). Việc đầu tiên
của v2 là viết 2 file khớp đúng version đó vào `supabase/migrations/`.

### Kết quả rà soát (đã kiểm chứng, không phải suy đoán)
| # | Phát hiện | Trạng thái |
|---|---|---|
| 🔴 1 | `profiles.referred_by_code` **user tự update được** — `profiles_update_own` + column grant UPDATE mọi cột, trigger `guard_credits_column()` chỉ canh đúng cột `credits` | phải fix |
| 🔴 2 | `affiliate_clicks` **anon insert vô hạn** — anon key là public → bơm click rác / DoS ghi | phải fix |
| ✅ 3 | `profiles.credits` — test xác nhận **bị chặn đúng** ("credits chỉ được thay đổi server-side") | không phải lỗi |
| 🟠 4 | `handle_new_user()` là đường sống của signup — lookup affiliate lỗi = **không ai đăng ký được** | phải hardening |
| 🟠 5 | Plan v1 viết nhầm `raw_user_meta_data->>'display_name'`; hàm production dùng `'full_name'` | phải giữ `full_name` |
| 🟠 6 | Bot preview link (FB/Zalo/TikTok/Telegram) tính thành click, không bao giờ convert → link share social trông tệ giả tạo | lọc + đánh dấu |

### Quyết định đã chốt (v1 + v2)
- Admin auth: bảng `admin_users` riêng, cấp quyền ngoài luồng bằng SQL.
- Attribution: **first-touch**, và **dùng click-id (UUID)** thay vì mã trần.
- Health metrics: phễu chuyển đổi + doanh thu, **cộng** credits tồn đọng, chi
  phí AI, phễu thanh toán, và biểu đồ 30 ngày.
- Không làm: hoa hồng affiliate, retention 7/30 ngày, role nhiều cấp, light theme.

---

## Giai đoạn 0 — Đồng bộ repo với remote

Viết 2 file khớp **đúng** những gì đã chạy (không sửa nội dung, chỉ chép lại):
- `supabase/migrations/20260909080214_admin_users_table.sql`
- `supabase/migrations/20260909080248_affiliate_schema.sql`

Mọi thay đổi sau đó đi bằng migration **mới**, không sửa 2 file này.

---

## Giai đoạn 1 — Vá 2 lỗ hổng + hardening (migration mới)

### 1a. Khoá cột `referred_by_code` (+ chuẩn bị `referred_click_id`)

```sql
alter table profiles
  add column referred_click_id uuid references affiliate_clicks(id) on delete set null;

-- Thay guard cũ bằng guard canh nhiều cột. Giữ NGUYÊN semantics của credits
-- (service_role bỏ qua, cùng thông điệp lỗi) — không đụng gì tới đường tiền.
create or replace function guard_profiles_protected_columns() returns trigger
language plpgsql as $$
begin
  if current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' then
    return new;
  end if;
  if new.credits is distinct from old.credits then
    raise exception 'credits chỉ được thay đổi server-side';
  end if;
  if new.referred_by_code is distinct from old.referred_by_code
     or new.referred_click_id is distinct from old.referred_click_id then
    raise exception 'attribution affiliate chỉ được thay đổi server-side';
  end if;
  -- created_at cũng đang user-sửa được: tự lùi ngày tạo tài khoản làm bẩn chỉ
  -- số "user mới" và mọi logic sau này dựa trên tuổi tài khoản. Khoá luôn vì
  -- đang sửa trigger này rồi.
  if new.created_at is distinct from old.created_at then
    raise exception 'created_at không được thay đổi';
  end if;
  return new;
end $$;

drop trigger profiles_guard_credits on profiles;
create trigger profiles_guard_protected_columns
  before update on profiles
  for each row execute function guard_profiles_protected_columns();
drop function guard_credits_column();
```
Attribution set lúc **INSERT** (trigger `handle_new_user`) nên không vướng guard
BEFORE UPDATE này. Sửa attribution về sau chỉ còn đường service-role.

### 1b. Đóng đường ghi công khai vào `affiliate_clicks`

```sql
drop policy affiliate_clicks_insert_anon on affiliate_clicks;
revoke all on affiliate_clicks from anon, authenticated;
revoke all on affiliate_links from anon, authenticated;
-- admin_users giữ SELECT cho authenticated (requireAdmin dùng client RLS-aware)
revoke insert, update, delete, truncate on admin_users from anon, authenticated;

alter table affiliate_clicks add column is_bot boolean not null default false;
alter table affiliate_clicks add column landing_path text;
```
Sau khi drop policy: RLS bật + không policy = default deny (đúng pattern
`rate_limits`/`affiliate_links` đang dùng). Advisor sẽ báo INFO
`rls_enabled_no_policy` — **đúng chủ đích**, giống `rate_limits`.

`ip_hash` chỉ lưu **16 ký tự hex đầu** của sha256 (đủ để dedupe/rate-limit, không
cần chống va chạm mật mã) — tiết kiệm ~20% dung lượng bảng click, khoản duy nhất
trong task này thực sự tăng theo lưu lượng.

### 1b-bis. `admin_audit_log` (bắt buộc vì đã có 2 admin)

```sql
create table admin_audit_log (
  id            bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id),
  action        text not null,   -- 'users.list' | 'users.view' | 'affiliate.create' | 'affiliate.toggle'
  meta          jsonb,           -- {q, page} hoặc {code, is_active} — không chứa dữ liệu cá nhân
  created_at    timestamptz not null default now()
);
create index admin_audit_log_created on admin_audit_log (created_at desc);
alter table admin_audit_log enable row level security;
revoke all on admin_audit_log from anon, authenticated;
-- Không policy nào: chỉ service-role ghi/đọc. Admin xem log qua chính trang admin.
```
Ghi ở **đúng chỗ chạm dữ liệu cá nhân** (`/admin/users`, xem chi tiết 1 user) và
mọi **hành động ghi** của admin (tạo/tắt link). **Không** ghi lượt xem trang tổng
quan hay trang affiliate — đó là số liệu gộp, log vào chỉ làm loãng tín hiệu.

Với 2 admin, đây là thứ duy nhất trả lời được "ai tạo mã này", "ai tắt mã kia",
"ai mở danh sách email lúc 3h sáng". Nó chỉ có giá trị hồi tố nên phải bật từ
ngày đầu — bật muộn không mua lại được quá khứ.

### 1c. Ghi click qua đúng 1 RPC server-side (có rate limit trong DB)

```sql
create or replace function record_affiliate_click(
  p_click_id uuid, p_code text, p_ip_hash text,
  p_is_bot boolean default false, p_landing_path text default null
) returns boolean
language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from affiliate_links where code = p_code and is_active) then
    return false;
  end if;
  -- Chống bơm click: tái dùng đúng bảng rate_limits + tiền tố tên route theo
  -- luật đã học (key trần dùng chung bucket giữa các route là bug im lặng).
  if not check_rate_limit('affiliate-click:ip:' || coalesce(p_ip_hash, 'unknown'), 3600, 30) then
    return false;
  end if;
  insert into affiliate_clicks (id, code, ip_hash, is_bot, landing_path)
    values (p_click_id, p_code, p_ip_hash, p_is_bot, p_landing_path)
    on conflict (id) do nothing;
  return true;
end $$;

revoke execute on function record_affiliate_click(uuid, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function record_affiliate_click(uuid, text, text, boolean, text) to service_role;
```
Một round-trip duy nhất từ middleware: validate mã + rate limit + insert. Bot
**vẫn được ghi** nhưng `is_bot = true` để thấy được bao nhiêu traffic là crawler
preview — chỉ loại khỏi con số headline, không giấu đi.

> Kiểm tra trước khi viết: `check_rate_limit` phải trả `boolean` và cho phép
> gọi nội bộ từ hàm khác. Nếu chữ ký khác, chỉnh lại cho khớp (đọc
> `20260809000003_credit_functions.sql`).

### 1d. Hardening `handle_new_user()` — không bao giờ để affiliate làm vỡ signup

```sql
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  v_click_id uuid;
  v_code text;
begin
  -- Toàn bộ khối affiliate được bọc exception: signup là đường sống, mọi lỗi
  -- ở đây phải degrade thành "không có attribution", không bao giờ chặn đăng ký.
  begin
    v_click_id := (new.raw_user_meta_data->>'ref_click')::uuid;
    if v_click_id is not null then
      select c.code into v_code
      from affiliate_clicks c
      join affiliate_links l on l.code = c.code and l.is_active
      where c.id = v_click_id
        and c.created_at >= now() - interval '30 days';
    end if;
  exception when others then
    v_click_id := null; v_code := null;
  end;
  if v_code is null then v_click_id := null; end if;

  insert into public.profiles (id, display_name, avatar_url, referred_by_code, referred_click_id)
  values (
    new.id,
    -- GIỮ NGUYÊN 'full_name' — đúng hàm đang chạy production
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_code,
    v_click_id
  );
  return new;
end $$;

revoke execute on function handle_new_user() from public, anon, authenticated;
grant execute on function handle_new_user() to service_role, postgres;
```
Cửa sổ 30 ngày trong lookup = thời hạn attribution, khớp tuổi thọ cookie.
Grant lặp lại y hệt `20260829000001` vì `create or replace` không tự khôi phục.

---

## Giai đoạn 2 — RPC thống kê

### 2a. `admin_overview_stats()`
Trả 1 dòng, mốc ngày tính theo `Asia/Ho_Chi_Minh` (UTC+7):

| Nhóm | Chỉ số |
|---|---|
| Người dùng | `total_users`, `new_users_7d`, `new_users_30d`, `dau`, `wau` |
| Doanh thu | `total_revenue_vnd`, `revenue_7d_vnd`, `revenue_30d_vnd`, `paying_users` |
| Nợ dịch vụ | `outstanding_credits` = `sum(profiles.credits)` — user đã trả tiền, chưa dùng |
| Phễu thanh toán | `orders_created_30d`, `orders_paid_30d`, `orders_expired_30d` |
| Sử dụng | `readings_total`, `readings_quick_30d`, `readings_deep_30d` |
| Chi phí AI | `ai_input_tokens_30d`, `ai_output_tokens_30d` (kèm breakdown theo `ai_provider`) |

### 2b. `admin_daily_series(p_days int default 30)`
Trả `day, signups, revenue_vnd, readings` theo ngày VN — nguồn cho biểu đồ xu hướng.

### 2c. `admin_list_users(p_limit, p_offset, p_search)`
Join `profiles` ⋈ `auth.users` lấy `email`, `last_sign_in_at`, kèm
`orders_count`, `readings_count`, `total_spent_vnd`, `referred_by_code`.
**Đã kiểm chứng**: SECURITY DEFINER đọc được `auth.users` (test bằng function
throwaway, `select count(*)` chạy được) → dùng SQL join, không cần
`auth.admin.listUsers()`.

### 2d. `admin_affiliate_stats()`
Mỗi dòng = 1 link: `code, label, is_active, created_at,` +
`clicks` (không tính bot), `bot_clicks`, `unique_visitors` (distinct ip_hash),
`signups`, `activated_soft`, `activated_hard`, `paying` (≥1 order paid),
`revenue_vnd`, `avg_hours_to_signup` (từ `affiliate_clicks.created_at` →
`profiles.created_at`).

**Vì sao tách `activated` làm hai** (phát hiện khi rà policy): `readings` có
policy `readings_delete_own` — user **xoá được** lượt đọc của mình (cố ý, quyền
riêng tư). Nên đếm activation từ `readings` là **số mềm**, tụt xuống khi user
dọn lịch sử. `credit_ledger` thì user không xoá/ghi được → dùng
`credit_ledger.reason = 'reading'` làm **số cứng** cho lượt đọc sâu. UI phải ghi
rõ nhãn: `activated_soft` = có đọc bất kỳ (kể cả miễn phí, có thể hụt),
`activated_hard` = đã tiêu credit (bằng chứng không xoá được).

Tất cả RPC: `revoke execute ... from public, anon, authenticated;` +
`grant execute ... to service_role;` theo đúng pattern `credit_order`.

---

## Giai đoạn 3 — Code app

### 3a. Auth gate
- `src/lib/auth.ts` — thêm `requireAdmin()`: `requireUser()` rồi query
  `admin_users` bằng client RLS-aware (đúng mục đích policy select-own).
- `src/lib/supabase/middleware.ts` — thêm `"/admin"` vào `PROTECTED_PREFIXES`
  (chỉ redirect người chưa đăng nhập; **không** check quyền admin ở middleware
  vì middleware cố ý fail-open).
- `src/app/admin/layout.tsx` — chưa login → `redirect("/dang-nhap?next=/admin")`;
  login nhưng không phải admin → `notFound()` (404, không lộ có khu admin).
  Thêm `robots: { index: false }` trong metadata.

### 3b. Capture click trong middleware
`src/proxy.ts` nhận thêm `event: NextFetchEvent`; trong `updateSession`:

```ts
const AFF_COOKIE = "aff_ref";           // chứa click-id (UUID), KHÔNG phải mã
const BOT_UA = /bot|crawler|spider|facebookexternalhit|Twitterbot|TelegramBot|WhatsApp|Zalo|Slackbot|preview/i;

const ref = request.nextUrl.searchParams.get("ref");
if (ref && /^[A-Za-z0-9_-]{3,32}$/.test(ref) && !request.cookies.get(AFF_COOKIE)) {
  const isBot = BOT_UA.test(request.headers.get("user-agent") ?? "");
  const clickId = crypto.randomUUID();
  if (!isBot) {
    supabaseResponse.cookies.set(AFF_COOKIE, clickId, {
      maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,  // client JS phải đọc được lúc signUp() — xem rủi ro §5
    });
  }
  event.waitUntil(/* POST /rest/v1/rpc/record_affiliate_click với SERVICE ROLE key */);
}
```
Ghi bằng **service-role** (server-side, không lộ ra browser) qua plain REST
fetch — không nhét supabase-js vào bundle middleware. Đây là đảo ngược có chủ ý
của lập luận trong v1: policy anon-insert mở một endpoint ghi công khai thật sự,
rủi ro lớn hơn nhiều so với việc dùng service key trong code server-only.

### 3c. Gắn click-id lúc signup
- `src/lib/affiliate.ts` (mới) — `getAffiliateClickId()` đọc cookie `aff_ref`.
- `src/components/auth/PasswordAuthForm.tsx:40` và
  `src/components/AuthModal.tsx:195` — thêm `ref_click` vào `options.data`
  (AuthModal đã có `display_name` trong đó, chỉ mở rộng object).
- Giữ `?ref=` sống qua redirect đăng nhập: khi `PROTECTED_PREFIXES` đá về
  `/dang-nhap?next=...`, cookie đã set từ trước nên không mất — nhưng nếu user
  vào thẳng `/dang-nhap?ref=X` thì middleware vẫn bắt được vì chạy trên mọi route.

### 3d. Trang + API
| File | Loại | Nội dung |
|---|---|---|
| `src/app/admin/page.tsx` | server | lưới `StatTile` + biểu đồ 30 ngày (SVG inline, không thêm thư viện) |
| `src/app/admin/users/page.tsx` | server | bảng user phân trang + form GET tìm kiếm (chạy được không cần JS) |
| `src/app/admin/affiliate/page.tsx` | server | bảng phễu theo mã + form tạo link |
| `src/components/admin/StatTile.tsx` | — | compose từ `Card` có sẵn |
| `src/components/admin/TrendChart.tsx` | — | SVG inline, `<title>`/`<desc>` + bảng số liệu ẩn cho screen reader |
| `src/components/admin/CreateAffiliateLinkForm.tsx` | client | tạo link (mã + nhãn + đường dẫn đích) → hiện URL đầy đủ + nút copy |
| `src/app/api/admin/affiliate-links/route.ts` | route | `POST` tạo link, `PATCH` bật/tắt `is_active` — gate `requireAdmin()`, validate Zod theo pattern `CreateOrderRequestSchema` |
| `src/app/admin/audit/page.tsx` | server | nhật ký hành động admin (mới nhất trước), phân trang |
| `src/lib/admin-audit.ts` | — | `logAdminAccess(adminId, action, meta)` — chỉ gọi ở chỗ chạm dữ liệu cá nhân + hành động ghi |
| `src/lib/ai-cost.ts` | — | bảng giá token/model để quy tokens → chi phí ước tính (ghi rõ là **ước tính** + ngày cập nhật, sửa 1 chỗ khi giá đổi) |

Mọi trang admin đặt `export const revalidate = 60` — bấm F5 liên tục không chạy
lại chuỗi truy vấn gộp. Miễn phí bây giờ, cứu về sau khi bảng lớn lên.

### 3e. Design-system / a11y
- Stat tile: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` trong `max-w-7xl mx-auto`.
- Bảng: bọc `overflow-x-auto` + `min-w-[640px]`, `<th scope="col">` — bảng cuộn
  trong container của nó, không phải cả trang.
- Form: theo đúng pattern `PasswordAuthForm` (`useId()` + `<label htmlFor>`,
  `min-h-[44px]`, `role="alert"`), dùng `Button`/`Card` token-based — **không**
  port lối hardcode hex của `AuthModal`/`Header`.
- Biểu đồ không được chỉ dùng màu để phân biệt; kèm bảng số liệu cho screen reader.
- Repo hiện **chỉ có 1 theme (dark)**, không có hạ tầng light theme → dùng token
  sẵn có để sau này thêm theme thì ăn theo, không tự dựng theme thứ 2 ở task này.

---

## Giai đoạn 4 — Việc vận hành ngoài code (không phải việc của migration)

Với 2 admin, đường vào dễ nhất của kẻ tấn công không phải SQL mà là **chính tài
khoản đăng nhập admin**. Ba việc này nằm ngoài code, người vận hành phải làm:

- [ ] **Bật "Leaked password protection"** trên Supabase Dashboard (Auth →
      Policies). Advisor đang cảnh báo là đang TẮT — nghĩa là admin có thể đặt
      mật khẩu đã nằm trong các vụ lộ dữ liệu công khai mà không bị chặn. Một
      toggle, miễn phí.
- [ ] **Hai tài khoản admin phải dùng email thật.** App cố ý cho user thường
      dùng email không có thật (comment trong `PasswordAuthForm`); với admin thì
      mất mật khẩu = mất luôn đường khôi phục.
- [ ] Cấp quyền admin bằng `insert into admin_users(user_id, note)` cho đúng 2
      `user_id`, `note` ghi rõ ai là ai — để nhật ký sau này đọc được nghĩa.

Ngoài phạm vi task, nhưng là bước có giá trị nhất tiếp theo: **MFA (TOTP)** cho
tài khoản admin — biện pháp duy nhất khiến "lộ mật khẩu" không đồng nghĩa với
"mất toàn bộ dữ liệu user". Supabase hỗ trợ sẵn.

---

## Rủi ro còn lại (chấp nhận, có ý thức)

1. **Cookie không thể `httpOnly`** — signup chạy client-side nên JS phải đọc
   được. Nhưng với click-id, giả mạo giờ đòi hỏi một UUID **có thật trong
   `affiliate_clicks`** → cách duy nhất là tự bấm link thật (vô hại). Cộng với
   guard ở 1a, không sửa được attribution sau khi đã đăng ký.
2. **Ghi click lỗi = mất attribution** cho lượt đó (cookie trỏ vào UUID không
   tồn tại). Hiếm, đánh đổi có chủ ý để đổi lấy chống giả mạo.
3. **In-app browser (TikTok/FB/Zalo)** sandbox cookie; click điện thoại rồi đăng
   ký trên desktop cũng mất dấu. **Số signup theo mã sẽ luôn thấp hơn thực tế** —
   đọc như cận dưới, không phải con số tuyệt đối.
4. **Chi phí AI là ước tính** — quy từ token theo bảng giá hardcode; giá nhà
   cung cấp đổi thì phải sửa `src/lib/ai-cost.ts`.
5. **`activated_soft` tụt khi user xoá lịch sử đọc** — `readings_delete_own` là
   tính năng có chủ đích, không sửa. Dùng `activated_hard` (từ `credit_ledger`)
   khi cần con số không lay chuyển được.
6. **Audit log không tự bảo vệ được chính nó** — admin có service-role về lý
   thuyết xoá được dòng log. Trong phạm vi này chấp nhận: log để trả lời "ai làm
   gì" giữa 2 người tin nhau và để phát hiện tài khoản bị chiếm, không phải để
   chống chính chủ. Muốn chống cả chính chủ thì phải đẩy log ra ngoài hệ thống
   (Sentry/log service) — việc riêng, không nằm trong task này.
7. **Migration đụng `auth.users`/hàm tài chính có thể bị permission classifier
   chặn** — nếu bị, chạy tay qua Dashboard rồi **bắt buộc** verify lại bằng
   `information_schema.routine_privileges` ("Success" không chứng minh mọi câu
   lệnh đã chạy — bài học đã ghi trong `.claude/rules/project.md`).

---

## Verify

1. Sau **mỗi** migration: `select * from information_schema.routine_privileges
   where routine_name in ('admin_overview_stats','admin_list_users',
   'admin_affiliate_stats','admin_daily_series','record_affiliate_click',
   'handle_new_user')` → `anon`/`authenticated` không có EXECUTE.
2. **Probe lại RLS bằng đúng cách đã dùng khi rà soát** (giả lập role
   `authenticated` trong transaction, rollback + dọn):
   - `update profiles set referred_by_code` → phải **BỊ CHẶN** (trước fix: ghi được).
   - `insert into affiliate_clicks` → phải **BỊ CHẶN** (trước fix: ghi được).
   - `update profiles set credits` → vẫn bị chặn (không được hồi quy).
3. Seed link test `QATEST` qua `execute_sql`.
4. Tạo tài khoản test **thật qua UI signup** (không insert thẳng `auth.users`):
   - TK1 → cấp admin bằng `insert into admin_users`.
   - TK2 → vào `/?ref=QATEST` trước rồi mới đăng ký → verify
     `profiles.referred_by_code = 'QATEST'` **và** `referred_click_id` khớp
     đúng dòng trong `affiliate_clicks`.
5. Signup **không** có cookie ref → vẫn đăng ký được bình thường
   (chứng minh hardening 1d không làm vỡ đường sống).
6. Signup với `ref_click` là UUID **bịa** → vẫn đăng ký được, attribution null.
7. Playwright session thật: admin → `/admin` 200; user thường → 404; chưa đăng
   nhập → redirect `/dang-nhap?next=/admin`.
8. Bot check: gọi `/?ref=QATEST` với UA `facebookexternalhit` → có dòng click
   `is_bot = true`, **không** set cookie, và không tính vào `clicks` headline.
9. Dọn sạch đúng thứ tự FK: `affiliate_clicks` (code QATEST) → xoá 2 user test
   qua `auth.admin.deleteUser()` (cascade `profiles`, `admin_users`) →
   `affiliate_links` → xác nhận `count(*) = 0`.
10. Gate ladder: `.claude/hooks/detect-stack.sh` → lint/typecheck/build; visual
    375/768/1280; a11y keyboard + contrast cho bảng, form, biểu đồ.
