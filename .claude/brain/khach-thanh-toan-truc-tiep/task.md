# Task: Khách chưa đăng nhập thanh toán trực tiếp để mở khoá Đọc sâu

> Created: 2026-09-13 · Slug: `khach-thanh-toan-truc-tiep`

## Goal
Khách chưa đăng nhập đang ở bước đã lật 3 lá có thể trả tiền ngay cho **một**
lượt luận giải chuyên sâu và nhận kết quả, **không phải thấy form đăng ký nào**;
sau khi đọc xong mới được mời biến phiên đó thành tài khoản thật.

## Scope
**In**:
- Bật Supabase anonymous auth; `signInAnonymously()` ngay tại cú bấm "Mở khoá".
- Gói mới `single` = 1 lượt Đọc sâu, giá lấy từ biến env (theo đúng pattern
  `NEXT_PUBLIC_PACK_*_AMOUNT_VND` đã có).
- `requireUser()` trả thêm `isAnonymous` — keystone cho mọi cổng chặn bên dưới.
- **Khôi phục tính toàn vẹn rate-limit**: phiên ẩn danh phải bị đếm theo IP dù
  đã có `user.id` (xem Assumptions — đây là lỗ hổng do chính hướng này tạo ra).
- Chặn các bề mặt phá hoại mà phiên ẩn danh bỗng chạm tới được: xoá tài khoản,
  đổi mật khẩu, "Thoát", `/tai-khoan`, `/admin`.
- Lưu `readings` thật cho phiên ẩn danh (cột `user_id` vốn đã nullable nhưng ta
  ghi id ẩn danh nên RLS `auth.uid() = user_id` hoạt động bình thường).
- Nâng cấp **tại chỗ** thành tài khoản thật bằng `updateUser({email, password})`
  — tuyệt đối không `signUp()`.
- Lọc user ẩn danh khỏi số liệu admin; cron dọn phiên ẩn danh bỏ hoang.
- Cập nhật chính sách hoàn tiền + điều khoản cho trường hợp mua lẻ không tài khoản.

**Out**:
- Gửi email luận giải (dự án chưa có hạ tầng mail) — đã chọn không làm.
- Link có chữ ký để xem lại — không làm, đường phục hồi là cookie phiên ẩn danh
  cộng CTA nâng cấp sau khi đọc.
- Nâng cấp bằng Google (`linkIdentity`) — cần `enable_manual_linking = true`,
  tách ra sau. v1 chỉ email+password.
- Rút Nhanh và Lớp Nền miễn phí — đã ẩn danh sẵn, không đụng logic, **nhưng**
  rate-limit của chúng bắt buộc phải sửa (xem In).
- Đổi giá hoặc cấu trúc 3 gói hiện có.
- Hoàn tiền tự động cho khách ẩn danh mất cookie — xử lý thủ công qua
  `payos_order_code`, ghi vào chính sách.

## Assumptions
- **Rate-limit hiện tại dựa trên giả định "ẩn danh = chưa có user.id" và
  anonymous auth phá vỡ giả định đó.** `signInAnonymously()` sinh uuid mới mỗi
  lần gọi, nên key đổi từ `:ip:` sang `:user:` và hạn mức theo IP trở thành
  không thể với tới: vòng lặp `signInAnonymously()` → `/shuffle` là một máy bơm
  chi phí Gemini không giới hạn (mỗi lượt shuffle gọi `triageQuestion` thật).
  `anonymous_users = 30/giờ/IP` trong `config.toml` là chốt duy nhất và nó cao
  hơn nhiều so với hạn mức `[86400, 10]` đang bảo vệ khách ẩn danh hôm nay.
  Coi đây là việc **bắt buộc**, không phải tuỳ chọn.
- Phiên ẩn danh **không bao giờ hết hạn** (`[auth.sessions] timebox` đang
  comment, `enable_refresh_token_rotation = true`) → hàng `profiles` ẩn danh
  tăng vô hạn nếu không có cron dọn.
- `handle_new_user` chạy cho cả user ẩn danh: `new.email` NULL →
  `split_part(NULL,'@',1)` NULL → `display_name` NULL. Insert **không** lỗi
  (cột nullable), nên mặc định hiện ra là nhãn `"Thành Viên"` — sai lệch, phải
  đổi thành "Khách".
- Đăng nhập ẩn danh **không được** mang theo `ref_click`. Nếu mang, attribution
  affiliate bị đếm hai lần cho một người (anon + tài khoản thật sau đó, vì cookie
  không bao giờ bị xoá) → `percent(signups, clicks)` vượt 100% và phát sinh
  nghĩa vụ chi hoa hồng sai.
- Commit `3d11f9d` (`user-scoped-storage.ts` + `isDeepSessionOwnedBy`) đã nằm ở
  HEAD và **đang làm đúng việc cần cho tính năng này**: phiên có `drawToken` với
  `userId: null` sống sót qua lúc danh tính đổi, còn effect đổi danh tính trong
  `DeepReadScreen` cố ý return sớm khi `previousUserId === null`. Không phải sửa
  hai chỗ đó.
- Giá gói `single` để ở env, không hardcode (theo yêu cầu). Cần một giá trị
  default — xem Open Questions.

## Checklist
- [ ] Plan approved
- [x] Config: `enable_anonymous_sign_ins`, hạ `anonymous_users`, env giá gói lẻ
- [x] Keystone: `requireUser()` trả `isAnonymous` + `UserProfile.isAnonymous`
- [x] Rate-limit: ẩn danh đếm theo IP ở `reading`, `deep/shuffle`, `deep/resume`, `orders`
- [x] Chặn bề mặt phá hoại: middleware, Header, AccountScreen, `api/account*`, SignOutButton
- [x] Gói `single` + sheet thanh toán trong luồng mở khoá
- [x] Nâng cấp tại chỗ (`updateUser`), chuyển attribution affiliate lúc nâng cấp
- [x] Migration: lọc ẩn danh khỏi RPC admin
- [x] Cron dọn phiên ẩn danh bỏ hoang
- [x] Content & real copy (sheet thanh toán, CTA nâng cấp, nhãn "Khách")
- [x] States: loading / empty / error / success (chờ webhook là state thứ năm)
- [ ] Responsive: 375 / 768 / 1280 — CHƯA: không chạy được app, xem Blocked
- [~] Accessibility pass — tĩnh xong, thủ công CHƯA (không chạy được app)
- [x] Pháp lý: chính sách hoàn tiền + điều khoản
- [x] Gates green (lint / typecheck / build)
- [ ] Learnings extracted

## Progress Log
> `/execute` ghi một dòng mỗi checkpoint.

- **L1 config/env** — `config.toml`: anon sign-ins ON, `anonymous_users` 30→10.
  `env.ts`: `NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND` default 15_000 (đọc tĩnh).
  `.env.example` KHÔNG sửa được — `guard-paths.sh` chặn, không lách; user tự thêm.
- **L2 keystone** — `requireUser()` trả `AuthedUser{id,isAnonymous}`;
  `requireAdmin()` chặn ẩn danh tường minh. `UserProfile.isAnonymous` bắt buộc.
  Gộp 2 bộ giải danh tính trùng lặp (`useAuthUser` + `tai-khoan/page`) vào
  `src/lib/user-profile.ts` (`GUEST_PROFILE`/`toUserProfile`/`fromAuthModalLogin`);
  ẩn danh → tên "Khách", không còn rơi vào literal "Thành Viên".
  `tai-khoan/[id]` bỏ danh tính bịa, dùng `useAuthUser` thật. `tsc --noEmit` ✅
- **L3 rate-limit** — quy tắc "chỉ tài khoản THẬT mới đếm theo user" gom vào
  `resolveRateLimitIdentity()` (src/lib/rate-limit.ts), áp cho cả 4 route:
  `reading`, `deep/shuffle`, `deep/resume`, `orders`. `deep/resume` trước chỉ
  có nhánh user → giờ ẩn danh dùng CHUNG bucket + chung hạn mức IP với
  `deep/shuffle` để không có cửa sau rẻ hơn. `orders` POST: ẩn danh chỉ mua
  được `single` (403 `account_required_for_pack` cho gói khác).
- **L4a gói single** — `PACKS.single.credits = null` CỐ Ý: số credits là
  `DEEP_READING_COST` (server-only), resolve ở `resolvePackCredits()` trong
  orders route. Đọc nó trong `lib/orders.ts` (file client import) sẽ luôn ra
  default phía client → lệch im lặng. `returnUrl`/`cancelUrl` gói lẻ trỏ về
  `/doc-sau`, không phải trang kết quả nạp credits. `tsc --noEmit` ✅
- **L5 chặn bề mặt phá hoại** — middleware thêm `ANONYMOUS_BLOCKED_PREFIXES`
  (`/tai-khoan`, `/admin`); `/nap-credits` cố ý MỞ cho ẩn danh vì trang kết quả
  thanh toán nằm dưới prefix đó. `DELETE /api/account` + `POST/GET
  /api/account/password` chặn ẩn danh (password chặn TRƯỚC rate-limit để không
  đốt oan một suất). Header: 3 nhánh `hasAccount`/`isGuestSession`/khách — phiên
  khách KHÔNG có nút "Thoát" (một cú bấm nhầm = mất credits đã mua) và không có
  nút "Tài Khoản" (middleware chặn, chỉ dẫn tới redirect). `SignOutButton` với
  ẩn danh: xác nhận 2 bước + cảnh báo, `role="alertdialog"`. `AccountScreen`:
  badge "Khách", ẩn `ChangePasswordSection` + `DeleteAccountButton` — guard này
  KHÔNG thừa vì middleware fail-open khi lỗi mạng.
- **L5b nâng cấp tài khoản** — `UpgradeAnonymousAccount` dùng `updateUser()`
  (không bao giờ `signUp()` — nó tạo hàng auth.users THỨ HAI và bỏ rơi credits
  đã mua). Trang `/luu-tai-khoan` là đích CTA của Header (trang chứ không phải
  modal: Header có mặt ở mọi trang, làm modal phải luồn prop qua từng trang và
  mỗi trang quên là một lối cụt). 4 state: loading/khách/đã có TK/không phiên.
  `POST /api/account/claim-affiliate` gắn attribution ĐÚNG MỘT LẦN lúc nâng cấp
  (không truyền `ref_click` lúc signInAnonymously → không đếm hai lần).
  lint: 0 error, file mới đóng góp 0 warning (baseline 75). `tsc` ✅
- **L6 sheet mua lẻ + luồng mở khoá** — `CreditTopUpModal` thêm variant
  `mode="single"` (không fork component: đường tiền phải giữ đúng một bản).
  `signInAnonymously()` gọi NGAY TRƯỚC khi tạo đơn, không sớm hơn — không đúc
  danh tính rác cho người chỉ ghé xem giá; và KHÔNG truyền metadata affiliate.
  `PACKAGES` dựng từ `TOP_UP_PACK_IDS` nên gói lẻ không thể lọt vào bảng giá.
  `doc-sau` + `page.tsx`: 3 nhánh `hasAccount`/khách/ẩn danh, khách đi thẳng tới
  thanh toán thay vì AuthModal. CTA nâng cấp trong `DeepReadScreen` chỉ hiện khi
  `analysisComplete` — chen form vào lúc đang stream là cắt ngang thứ vừa mua.
  **A11y**: lưới chọn gói từ `<div onClick>` → radio thật trong `<fieldset>`
  (trước đó không tới được bằng Tab, không báo trạng thái cho screen reader).
- **L6b lỗ mất tiền phát hiện ngoài plan** — `AuthModal` gọi `signUp()`, mà
  `signUp()` từ trong phiên ẩn danh tạo hàng `auth.users` THỨ HAI và bỏ rơi
  credits đã trả tiền, KHÔNG báo lỗi gì. Đóng bằng `src/lib/upgrade-anonymous.ts`
  (một nguồn duy nhất cho `updateUser`), gọi từ cả `UpgradeAnonymousAccount` lẫn
  nhánh Register của `AuthModal`. Plan không nêu chỗ này.
- **L7 migration admin** — `20260913120000_admin_stats_exclude_anonymous.sql`.
  View `admin_countable_profiles` gom ĐÚNG MỘT điều kiện thay vì lặp ở 5 chỗ.
  **Lệch plan (có chủ đích)**: plan bảo lọc cả `paying_users`; tôi giữ khách đã
  TRẢ TIỀN trong mọi số liệu đếm người — loại họ thì doanh thu (vốn tính tiền
  của họ) không chia được cho số khách hàng, và tệ hơn là khi họ khiếu nại
  thanh toán thì admin tra `admin_list_users` không thấy người đâu.
  `admin_affiliate_stats` KHÔNG đụng — nó lọc theo `referred_by_code` mà ẩn
  danh không bao giờ có, vốn đã sạch. Đã `revoke`/`grant` lại sau mỗi
  `create or replace` (learned 2026-08-19).
- **L8 cron dọn** — `/api/cron/cleanup-anonymous` (03:00, thêm vào vercel.json)
  + RPC `list_abandoned_anonymous_users` (PostgREST không đọc thẳng `auth`
  được). 30 ngày, chỉ hàng không có `orders` lẫn `credit_ledger`. Xoá từng hàng
  qua Admin API chứ không `delete from auth.users` hàng loạt. FK đã xác minh:
  `profiles`/`readings` cascade, `orders`/`credit_ledger` restrict.
- **L9 pháp lý** — hoàn tiền thêm mục 3 (mua lẻ, đối soát thủ công qua mã đơn
  hàng), điều khoản thêm mục 4 (phiên khách, giới hạn, cửa sổ dọn 30 ngày).
- **L10 đồng bộ 3 trang còn lại** — `trai-bai`, `LibraryChrome`, `nap-credits`:
  ẩn danh bấm "nạp credits" → `/luu-tai-khoan` (server chỉ bán `single` cho họ,
  mở bảng gói là đâm thẳng vào 403 không giải thích được gì). `/nap-credits`
  không tự bung modal khi `loading` hoặc khi là phiên khách.
- **L11 contrast** — tính thật 10 cặp màu mới. 3 cặp trượt, đã sửa những cặp
  trong code MỚI: `#7a6e5d` (3.80:1) → `#b3a48d` (7.75:1) ở `/luu-tai-khoan` và
  thẻ gói lẻ; viền badge "Khách" 40% (2.21:1) → 60% (3.52:1). `#7a6e5d` cho chữ
  nhỏ là token CÓ SẴN dùng khắp repo và vẫn trượt 4.5:1 ở những chỗ cũ — ghi lại
  chứ không mở rộng phạm vi task này.

## Đã verify trên Supabase LOCAL (2026-09-13)

Môi trường: colima + `npx supabase start`, DB dùng xong vứt, **production không bị đụng**.
App chạy với env ghi đè trỏ vào local; PayOS đặt giá trị giả để chắc chắn không
tạo đơn thanh toán thật nào.

| Hạng mục | Kết quả |
|---|---|
| 2 migration mới áp sạch | ✅ (xác nhận `is_anonymous` tồn tại) |
| Quyền RPC/view: `anon`+`authenticated` bị chặn (probe thật, không tin bảng quyền) | ✅ |
| **3 uuid ẩn danh khác nhau → MỘT bucket `:ip:` (count 3)** | ✅ bài test quan trọng nhất của plan |
| Tài khoản thật → bucket `:user:` riêng | ✅ (đối chứng chứng minh server thật sự thấy user) |
| Bucket IP đầy → danh tính ẩn danh mới tinh vẫn 429 | ✅ |
| Tài khoản thật cùng IP KHÔNG bị vạ lây | ✅ 200 |
| Middleware: ẩn danh bị chặn `/tai-khoan` + `/admin` (307), vào được `/nap-credits`, `/nap-credits/ket-qua`, `/luu-tai-khoan` | ✅ |
| `DELETE /api/account` ẩn danh | ✅ 403 |
| `/api/account/password` ẩn danh GET `canChangePassword:false`, POST 403; tài khoản thật vẫn `true` | ✅ |
| `/api/orders` ẩn danh: small/popular/large → `account_required_for_pack`; single đi qua | ✅ |
| Đơn hỏng ở PayOS được route tự xoá | ✅ 0 đơn rác |
| **Đường tiền đầy đủ cho khách**: order → `credit_order` (qua service-role như webhook) → credits=2, ledger=1 | ✅ |
| **Nâng cấp `updateUser`**: uuid GIỮ NGUYÊN, credits 2→2, readings 1→1, đơn đã trả 1→1, `is_anonymous` t→f, `auth.users` 18→**18** | ✅ |
| **Đối chứng `signUp()` từ phiên ẩn danh**: uuid ĐỔI, `auth.users` 19→**20**, 2 credits đã trả tiền bị bỏ rơi | ✅ lỗ hổng là THẬT, đã vá |
| Admin stats: 20 profiles thô → `total_users`=5 (4 tài khoản thật + 1 khách đã trả tiền); `dau`/`wau`=1 | ✅ |
| Cron dọn: sai secret 401; đúng secret xoá 10, **2 khách đã trả tiền sống sót**, profiles cascade 20→10 | ✅ |
| RLS: khách ẩn danh đọc đúng luận giải của mình, không thấy của người khác | ✅ |

### Phát hiện về môi trường (KHÔNG phải bug của task này)
Stack `supabase start` local **không cấp DML cho `service_role`/`anon`/`authenticated`**
trên mọi bảng trong `public` (chỉ REFERENCES/TRIGGER/TRUNCATE) — kể cả các bảng
không migration nào đụng tới. Không migration nào trong repo revoke những quyền
đó; đây là khác biệt bootstrap của stack local so với project hosted. Production
chắc chắn có đủ quyền (app đang bán hàng, `/api/orders` insert qua service_role
hằng ngày). Đã vá **chỉ ở DB local**, không đưa vào migration. **Cân nhắc riêng**:
có nên thêm migration `grant` để môi trường mới tái lập được không.

## Vòng sửa theo phản hồi user (2026-09-13, sau khi test local)

1. **Header ẩn credits với người chưa đăng nhập.** `{user.credits} Credits +`
   giờ bọc trong `user.isLoggedIn` (cả desktop lẫn mobile). Với khách, con số
   "0 Credits" vừa vô nghĩa vừa là lối vào thanh toán lạc chỗ.
2. **Khối nút mở khoá trong `DeepReadScreen` cũng ẩn credits với khách** —
   badge "2 Credits" trên nút và dòng "Số dư tài khoản: 0 Credits" chỉ hiện khi
   `hasSession`. Trước đó chúng mâu thuẫn với thay đổi (1).
3. **Ngã ba mới `GuestUnlockChoice`** (`src/components/reading/`) — chỉ xuất
   hiện SAU khi lật đủ 3 lá (nút mở khoá nằm trong phase `revealed`; Header không
   còn lối vào cho khách). Hai lựa chọn: *Xem trực tiếp* (mua lẻ) và *Đăng nhập
   và mua gói*, kèm số tiết kiệm THẬT tính từ `PACKS`, không hardcode.
   Tách khỏi `CreditTopUpModal` vì đây thuần tuý là màn hình lựa chọn, không
   chạm tiền — không trộn marketing vào component mà mọi bug đều là mất tiền.
4. **`DEEP_READING_CREDIT_COST`** (client-safe, trong `lib/orders.ts`) thay cho
   magic number `2` rải rác ở 5 chỗ. `resolvePackCredits()` báo Sentry nếu
   `env.DEEP_READING_COST` lệch khỏi nó — giá khuyến mãi hiển thị sai là lỗi im
   lặng, không có cách nào tự lộ ra.
5. **`eslint.config.mjs` ignore `supabase/.temp/**`** — `supabase start` ghi
   bundle edge-runtime đã minify vào đó, làm gate lint đỏ 99 lỗi máy sinh cho
   bất kỳ ai chạy Supabase local.

### ĐÍNH CHÍNH quan trọng về giá
Cảnh báo ban đầu của tôi cho user ("gói lẻ rẻ hơn mọi gói, sẽ tự ăn doanh thu")
là **SAI** — nó lấy phép tính trong plan mà không kiểm lại. Số thật với
`DEEP_READING_COST = 2`:

| | giá | số lượt | đ/lượt | so với mua lẻ |
|---|---|---|---|---|
| Gói lẻ | 15.000đ | 1 | **15.000đ** | — |
| Gói Nhỏ | 49.000đ | 5 | 9.800đ | rẻ hơn 35% |
| Gói Phổ biến | 129.000đ | 15 | 8.600đ | rẻ hơn 43% |
| Gói Lớn | 359.000đ | 50 | 7.180đ | rẻ hơn 52% |

Mua lẻ là lựa chọn **đắt nhất** tính trên mỗi lượt. Các comment viết theo giả
định cũ ở `lib/orders.ts`, `CreditTopUpModal.tsx` và mục Decisions đã được sửa.

## Vòng sửa: hạn mức IP chặn cả việc test ở local (2026-09-13)

User báo bị "Bạn đã thực hiện quá nhiều lượt xáo bài" khi tự test. Nguyên nhân
gốc: nhánh theo user đã có ngoại lệ `NODE_ENV === "development" ? 100 : 30` từ
trước, nhưng nhánh theo IP thì hardcode `[86400, 10]`. Trước đây không ai để ý
vì test dev hiếm khi đi đường khách; từ khi phiên ẩn danh được đếm theo IP thì
MỌI request ở máy dev đổ vào cùng một bucket `::1` và khoá sau 10 lần bấm.

Thêm `relaxInDev(productionMax, devMax = 100)` trong `lib/rate-limit.ts`, áp cho
nhánh IP ở `reading`, `deep/shuffle`, `deep/resume` và cho `orders`.

**Đã xác minh bằng bản build production thật (không phải suy luận)**: chạy
`next start` trên cổng 3001 với `NODE_ENV=production` → bucket=12 trả 429,
bucket=5 đi qua. Nới dev KHÔNG rò ra production. Ở dev: bucket=12 đi qua,
bucket=100 trả 429 (hạn mức vẫn còn, chỉ cao hơn).

**Bẫy gặp phải, đáng nhớ**: thêm một export mới vào `lib/rate-limit.ts` KHÔNG
lan qua HMR của Turbopack — route gọi `relaxInDev` undefined nên throw, và
thông báo lộ ra là `rate_limit_check_failed` (catch quanh `checkRateLimit`),
che hoàn toàn nguyên nhân thật. Triệu chứng: 500 ở mọi request VÀ không có dòng
nào được tạo trong `rate_limits`. Cách xử lý: restart dev server, không phải đi
sửa logic hạn mức.

## Vòng sửa: "Có lỗi dữ liệu lá bài" khi test local (2026-09-13)

KHÔNG phải lỗi code. `supabase start` in cảnh báo `no files matched pattern:
supabase/seed.sql` và bảng `base_content` rỗng (0/780 dòng), nên
`/api/reading/deep/reveal` trả `base_content_unavailable` → UI hiện "Có lỗi dữ
liệu lá bài".

Khắc phục: nạp bằng chính script của dự án, trỏ env vào local (không đụng
`.env.local`, vốn bị `guard-paths.sh` chặn):

```bash
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
SUPABASE_SERVICE_ROLE_KEY="<service_role_key của supabase status>" \
node scripts/seedBaseContent.js
```

Nguồn dữ liệu: `scripts/base-content/output/base-content.json` — 780 tổ hợp
(78 lá × 2 chiều × 5 chủ đề). Đã verify sau khi nạp: `/api/reading` trả
`base.body` ~1.5k ký tự; `/shuffle` → `/reveal` cả 3 lá đều ra nội dung.

**Còn trống ở DB local, sẽ cắn tiếp nếu không biết trước**:
- `admin_users` = 0 → không ai là admin, `/admin` trả 404. Muốn test trang
  admin phải insert thủ công `user_id` của mình vào bảng đó.
- `affiliate_links` = 0 → luồng `?ref=` không ghi click nào (RPC
  `record_affiliate_click` chặn mã không tồn tại — đúng thiết kế).

**Đề xuất chưa làm (cần bạn quyết)**: thêm `supabase/seed.sql` để
`supabase start` tự dựng môi trường chạy được. Nó sẽ nặng ~2MB trong repo, nên
tôi không tự thêm.

## Rà soát "giá trị hiển thị có bám theo server không" (2026-09-13)

Kiểm bằng cách build với bộ giá trị dị (77777 / 188888 / 555555 / 25252, chi phí
mỗi lượt = 4) rồi soi bundle client + HTML server-render.

| Giá trị | Nguồn | Kết quả |
|---|---|---|
| Giá 3 gói + gói lẻ | `NEXT_PUBLIC_PACK_*_AMOUNT_VND` | ✅ vào bundle; **0 chunk** còn số default |
| Email hỗ trợ | `NEXT_PUBLIC_SUPPORT_EMAIL` | ✅ vào cả 3 trang pháp lý |
| Giá mỗi lượt + % tiết kiệm | tính từ `PACKS` | ✅ không hardcode |
| Chi phí mỗi lượt | **trước: hardcode `2`** | ❌ → đã sửa |

**Lỗ đã vá**: `DEEP_READING_COST` là biến server-only, nên client buộc phải
hardcode `2`. Đổi nó trên server thì server trừ đúng số mới, còn UI vẫn hiện số
cũ VÀ bảng "tiết kiệm %" tính sai theo — sai trong im lặng. Thay bằng
`NEXT_PUBLIC_DEEP_READING_COST` dùng chung cho cả server lẫn client
(`p_cost` của `debit_reading` cũng lấy từ đó). Biến cũ giữ trong schema dạng
optional chỉ để báo Sentry nếu deployment còn set nó với giá trị khác.

**Hai lỗi hiển thị chỉ lộ ra khi đổi giá trị**, cũng đã vá trong
`GuestUnlockChoice`:
1. Số lượt mỗi gói `credits / cost` có thể ra số lẻ (10/4 = "2.5 lượt"). Giờ
   làm tròn XUỐNG — thừa credits chứ không bán được nửa lượt.
2. Gói có thể ĐẮT HƠN mua lẻ ở một số tổ hợp cấu hình (cost=4 → Gói Nhỏ
   38.888đ/lượt vs mua lẻ 25.252đ). Giờ chỉ liệt kê gói thật sự rẻ hơn; không
   có gói nào rẻ hơn thì ẩn hẳn nhãn "Tiết kiệm" và lời hứa về giá.

**KHÔNG phải env, là hằng số trong code** (cố ý — đây là cấu trúc sản phẩm,
không phải giá): số credits mỗi gói (10 / 30 / 100) trong `PACKS`. Đổi nó phải
sửa code + deploy.

**Lưu ý vận hành**: `NEXT_PUBLIC_*` được bake lúc BUILD. Đổi trên Vercel xong
phải **Redeploy**, restart không đủ.

## Rà soát bất đồng bộ + đường tiền (2026-09-20)

User yêu cầu soi toàn bộ race condition và guard cho case đặc biệt. Tìm được 6
lỗ, vá cả 6.

### Race mất tiền — do chính hướng của task này tạo ra
`CreditTopUpModal` chặn double-submit bằng STATE (`isProcessing`), mà state chỉ
có hiệu lực từ lần render sau. Trước đây hậu quả là một đơn thừa (cùng user, tự
hết hạn). Sau khi thêm `signInAnonymously()` vào cùng handler thì nặng hơn: mỗi
lần lọt đúc thêm một danh tính ẩn danh, đơn tạo dưới danh tính đầu thành mồ côi,
khách trả tiền xong credits vào tài khoản mà phiên hiện tại không còn là nó.
Vá bằng ref đồng bộ, đúng pattern `isUnlockingRef` mà DeepReadScreen đã dùng.

### Webhook giấu hai đường mất tiền
`not_pending` và `not_found` bị gom chung với `already_paid` và gọi là "no-op an
toàn". Với `already_paid` thì đúng; hai cái kia thì sai — tới được đó nghĩa là
PayOS đã xác nhận `code="00"`, tức khách ĐÃ chuyển tiền.

| Kết quả | Kịch bản | Cũ |
|---|---|---|
| `not_pending` | trả tiền sát hạn, webhook trễ (site đang deploy → PayOS retry), cron `expire-orders` chen vào | mất tiền, im lặng |
| `not_found` | nhánh rollback `POST /api/orders` đã `delete` dòng đơn sau lỗi PayOS, nhưng link đã kịp tồn tại | mất tiền + mất luôn bằng chứng đối soát |

**Giải pháp** — nguyên tắc: *xác nhận của PayOS là sự thật về tiền; `status` chỉ
là sổ sách nội bộ*. Chỉ hai lý do chính đáng để từ chối: đã cộng rồi
(`already_paid`) và số tiền lệch (`amount_mismatch`).
- Migration `20260920000100`: `credit_order` cộng cho mọi đơn chưa `paid`, trả
  thêm `credited_late` để phân biệt.
- `POST /api/orders`: lỗi PayOS → đánh `failed` thay vì `delete`, giữ bằng chứng
  (chính sách hoàn tiền hứa đối soát qua `payos_order_code`).
- Webhook: `credited_late` → Sentry warning. Migration chỉ chặn hậu quả; GỐC là
  webhook bị trễ, và con số này để nhìn thấy nó.

Kiểm chứng 6 kịch bản qua PostgREST trên DB local: pending→`credited`,
expired→`credited_late`, failed→`credited_late`, sai tiền→`amount_mismatch`
(đơn vẫn pending), gọi lại→`already_paid`, mã lạ→`not_found`. Credits +6 đúng
bằng 3 đơn hợp lệ × 2, đúng 3 dòng ledger.

### Mất 3 lá khi ẩn danh → đăng nhập tài khoản thật khác
Effect reset phiên dùng luật `previousUserId === null`, chỉ đúng chiều
"khách → đăng nhập". Bỏ sót chiều "phiên khách → đăng nhập": khách bấm trả tiền
(sinh phiên ẩn danh), đổi ý, chọn "Đăng nhập" → phiên bị xoá dù `drawToken` vẫn
ký `userId: null` và server vẫn cho tài khoản mới nhận bộ bài đó.

Đổi sang `isDeepSessionOwnedBy` — hàm ĐÃ CÓ SẴN và đã là luật đúng, khớp y hệt
`personal/route.ts` và `purgeForeignUserStorage`. Đây là sửa một chỗ đang quyết
định NGƯỢC với hai chỗ kia (storage giữ phiên, màn hình lại xoá), không phải
nới lỏng. 9 ca kiểm chứng bằng chính hàm production, 4 ca `XOÁ` bảo vệ riêng tư
vẫn nguyên.

Bẫy gặp phải: đưa `drawToken` vào deps làm `resetSession()` (có
`setDrawToken(null)`) kích hoạt lại chính effect đó — React Compiler chặn ở gate
lint. Không suppress; dùng ref đồng bộ khai báo TRƯỚC effect danh tính.

### Hai lỗ nhỏ hơn
- `UpgradeAnonymousAccount`: cùng lỗi state-guard. Hai submit → hai
  `updateUser()`; lần hai báo lỗi và UI lật sang thất bại DÙ lần đầu đã xong.
- `CreditTopUpModal`: `setTimeout(…, 2500)` tự đóng modal không lưu id nên
  cleanup không huỷ được — người dùng đóng modal trong 2,5s đó rồi mở thứ khác,
  timer vẫn nổ và gọi `onClose()` của parent.

### Đã đúng sẵn, không phải sửa
`credit_order` (`for update` + `already_paid` + `amount_mismatch`) · `/personal`
double-debit (2 lớp) · `claim-affiliate` (`.is(null)` trong UPDATE) · polling +
`visibilitychange` cleanup · `SignOutButton` cờ `cancelled` · cron
`cleanup-anonymous` chạy chồng.

### Còn mở — cần người quyết
- `expire-orders/route.ts` ghi comment "cron mỗi 10 phút" nhưng `vercel.json` là
  `0 0 * * *` (mỗi ngày). Ai đó "sửa cho khớp comment" sẽ tăng tần suất cửa sổ
  rủi ro 144 lần. Nên sửa một trong hai cho khớp sự thật.
- `personal/route.ts:187` `insertError` chỉ log, không hoàn credits. Khách vẫn
  đọc được nội dung đã stream nên không hẳn mất trắng. Ghi lại từ plan gốc.

## Còn lại — không tự verify được
- **Không có công cụ trình duyệt trong phiên** → gate visual 375/768/1280 và
  đi bàn phím thủ công vẫn CHƯA làm. Contrast thì đã tính thật bằng số (mọi
  cặp màu trong `GuestUnlockChoice` đều đạt).
- **Header với phiên ẩn danh / tài khoản thật chưa render-verify được**: các
  trang này là client component nên HTML server-render luôn là trạng thái khách
  ban đầu. Đã xác minh được đúng trường hợp KHÁCH (HTML không chứa chuỗi
  credits nào); hai trạng thái còn lại mới chỉ đọc code + typecheck.
- **PayOS thật chưa chạy** — cố ý đặt credential giả để không tạo đơn thanh toán
  thật. Bước "quét QR, tiền về" phải verify khi đã lên staging/production.
- **`.env.example` chưa thêm `NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND`** —
  `guard-paths.sh` chặn file `.env*`, không lách hook.
- **Dev và prod DÙNG CHUNG Supabase project** (user xác nhận) → thứ tự go-live
  bắt buộc: chạy migration → tag+deploy → bật toggle trên Dashboard → hạ
  `anonymous_users` xuống 10 trong Dashboard (config.toml chỉ áp cho local).

## Decisions (chốt 2026-09-13)
- **`NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND` default = `15000`.** User chốt.
  **Đính chính (2026-09-13)**: cảnh báo ban đầu của tôi cho user là SAI — nó
  lấy phép tính trong plan (`49k/10cr ≈ 19.600đ/lượt`, ngầm coi 4 credits/lượt)
  mà không kiểm lại. `DEEP_READING_COST = 2`, nên số thật là:
  gói lẻ 15.000đ/lượt · Nhỏ 9.800đ · Phổ biến 8.600đ · Lớn 7.180đ.
  Gói lẻ là lựa chọn **đắt nhất** tính trên mỗi lượt; các gói rẻ hơn 35–52%.
  Hệ quả: không có rủi ro "ăn doanh thu gói"; ngược lại, sheet mở khoá phải
  NÓI RÕ mua gói tiết kiệm hơn (yêu cầu của user).
- **`/nap-credits` cho phiên ẩn danh vào.** Chặn `/tai-khoan` + `/admin`.
- **Cron dọn phiên ẩn danh: 30 ngày**, chỉ xoá hàng không có `orders` nào.
- **Nâng cấp bằng Google: v2.** v1 email+password qua `updateUser()`.
