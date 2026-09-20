# Khách chưa đăng nhập thanh toán trực tiếp để mở khoá Đọc sâu

Hôm nay khách ẩn danh dùng được Đọc sâu tới hết Lớp Nền miễn phí rồi đụng tường
đăng nhập đúng lúc bấm "Mở khoá luận giải chuyên sâu". Việc này mở tường đó bằng
cách cho họ trả tiền ngay cho một lượt, không thấy form đăng ký nào, và chỉ mời
tạo tài khoản **sau khi** họ đã đọc xong và thấy giá trị.

## Decisions Needed From You

> [!IMPORTANT]
> - **Giá default `NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND`** — khuyến nghị `29000`.
>   Cao hơn giá quy đổi trong gói nhỏ (49.000đ/10cr = ~19.600đ/lượt) nên không
>   phá giá gói, vẫn là con số dễ quyết với người chưa tin sản phẩm.
> - **`/nap-credits` cho phiên ẩn danh** — khuyến nghị CHO VÀO. Trang
>   `/nap-credits/ket-qua` nằm dưới cùng prefix trong `PROTECTED_PREFIXES`, và
>   khách đã trả tiền bắt buộc phải xem được kết quả. Chặn `/tai-khoan` + `/admin`.
> - **Cửa sổ dọn phiên ẩn danh bỏ hoang** — khuyến nghị 30 ngày, và chỉ xoá hàng
>   **không có `orders` nào**. FK `on delete restrict` trên `orders`/`credit_ledger`
>   sẽ tự chặn phần còn lại; đó là hàng rào đúng hướng, đừng cố lách.
> - **Nâng cấp bằng Google** — đề nghị để v2. `enable_manual_linking = false`
>   trong `config.toml` nên `linkIdentity()` chưa dùng được; v1 làm email+password
>   qua `updateUser()`.

## Approach

Dùng **Supabase anonymous auth**: cú bấm "Mở khoá" của khách gọi
`signInAnonymously()`, tạo một hàng `auth.users` thật mà khách không hề thấy, rồi
**toàn bộ đường tiền hiện có chạy nguyên vẹn** — `POST /api/orders`, PayOS,
webhook → `credit_order`, poll trạng thái, `debit_reading`, ghi `readings`, RLS
`auth.uid() = user_id`. Chọn hướng này vì đường tiền là nơi bug làm mất tiền thật
và mất niềm tin, mà repo này đã từng bị đúng một bug như vậy (coi `returnUrl` là
bằng chứng đã trả tiền — ghi ở `src/app/nap-credits/ket-qua/page.tsx:16-23`);
thêm một đường fulfilment thứ hai song song là nhân đôi bề mặt đó.

Phần thừa hưởng may mắn: logic "nhận token ẩn danh" ở
`src/app/api/reading/deep/personal/route.ts:42` và guard `previousUserId === null`
trong `DeepReadScreen` (commit `3d11f9d`) **vốn đã được thiết kế cho đúng cú bắt
tay này** — không phải sửa.

Cái giá phải trả nằm ở tầng hiển thị/chặn đường, nơi bug là phiền toái chứ không
mất tiền: `is_anonymous` hiện **không được kiểm ở đâu cả**, nên phải đi gắn vào
khoảng một tá chỗ. Một ngoại lệ duy nhất phải coi như lỗi bảo mật, không phải
phiền toái — rate-limit (xem §Rate-limit).

**Considered and rejected**
- **Đơn hàng khách thật sự** (`orders.user_id` nullable + RPC fulfilment riêng +
  `/personal` thêm chế độ xác thực thứ hai + trang kết quả không cần session) —
  đúng nghĩa "không có tài khoản nào", nhưng tạo đường tiền thứ hai phải tự giữ
  đúng song song với đường cũ, khối lượng ~2x, và mọi truy vấn admin đang
  `join profiles on p.id = o.user_id` sẽ âm thầm bỏ sót doanh thu khách.
- **Bán gói 49.000đ như cũ cho khách** — ít việc nhất, nhưng thu 49k của người
  chỉ muốn 1 lượt rồi giữ lại 8 credits họ gần như chắc chắn không dùng là rủi ro
  chính sách hoàn tiền, không chỉ là UX.
- **Gửi email luận giải** — đường phục hồi bền nhất, nhưng dự án chưa có hạ tầng
  mail nào; đã chọn bỏ.

## Luồng đích (thứ tự có chủ đích)

```
Khách ở phase "revealed" (3 lá + drawToken userId:null)
 1. Bấm "Mở khoá"  → credits 0 & !isLoggedIn → mở GuestPurchaseSheet
 2. signInAnonymously()          → onAuthStateChange → isLoggedIn(anon)
    └ purgeForeignUserStorage(anonId): drawToken.userId === null → PHIÊN SỐNG SÓT ✓
    └ DeepReadScreen identity effect: previousUserId === null → KHÔNG reset ✓
 3. POST /api/orders { packId: "single" } → QR PayOS
 4. Khách chuyển khoản → webhook → credit_order → profile ẩn danh +2 credits
 5. Poll GET /api/orders?orderId= → "paid"
 6. POST /personal với ĐÚNG drawToken cũ → claim (userId null) → debit → stream
 7. readings row với user_id = anonId  (RLS đọc lại được)
 8. Stream xong → CTA "Lưu luận giải này vào tài khoản"
    → updateUser({email, password})  ← CÙNG uuid, giữ nguyên mọi thứ
```

Bước 8 **phải** là `updateUser`, không phải `signUp`. `signUp()` từ trong một
phiên ẩn danh tạo hàng `auth.users` **thứ hai** và bỏ rơi cả luận giải đã trả
tiền lẫn credits còn lại.

## Proposed Changes

### Config / env

#### [MODIFY] `supabase/config.toml`
- `:178` `enable_anonymous_sign_ins = false` → `true`.
- `:203` `anonymous_users = 30` → hạ xuống (đề nghị `10`/giờ/IP). Đây là chốt duy
  nhất chống việc đúc danh tính mới để reset hạn mức; 30 là quá rộng.
- **Bước tay ngoài repo**: bật cùng toggle trên project hosted — `config.toml`
  không quản lý project đã deploy.

#### [MODIFY] `src/lib/env.ts`
- Thêm `NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND: z.coerce.number().int().positive().default(29_000)`
  cạnh 3 biến pack hiện có (`:63-65`), và thêm entry tương ứng vào `RAW_ENV` bằng
  **`process.env.NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND` viết tĩnh** — learned pattern
  2026-08-18 trong `.claude/rules/project.md`: truy cập động làm mọi field
  `undefined` phía client, lỗi im lặng.

### Keystone — phân biệt được "ẩn danh" với "tài khoản thật"

Mọi thay đổi khác phụ thuộc vào hai file này. Làm trước, một mình, verify trước
khi đi tiếp.

#### [MODIFY] `src/lib/auth.ts`
- `requireUser()` đổi từ `Promise<{id} | null>` thành
  `Promise<{ id: string; isAnonymous: boolean } | null>`, đọc `user.is_anonymous`.
- **Consumers affected** (11 call site, mỗi chỗ phải quyết định rõ cho/chặn):
  `api/reading/route.ts:30`, `api/reading/deep/shuffle/route.ts:38`,
  `api/reading/deep/personal/route.ts:33`, `api/reading/deep/resume/route.ts:31`,
  `api/orders/route.ts:17,49`, `app/admin/layout.tsx:22-32`, và `requireAdmin()`
  cùng file (an toàn sẵn — ẩn danh không bao giờ có hàng trong `admin_users`).

#### [MODIFY] `src/types/tarot.ts`
- `UserProfile` (`:123-130`) thêm `isAnonymous: boolean`. Hiện type này **không có
  trường nào** biểu diễn được trạng thái ẩn danh, nên mọi consumer đang bất lực
  về mặt cấu trúc.

#### [MODIFY] `src/lib/useAuthUser.ts`
- `GUEST_PROFILE` thêm `isAnonymous: false`.
- Set `isAnonymous: authUser.is_anonymous ?? false`.
- Chuỗi fallback tên (`:56-61`) hiện rơi tới literal `"Thành Viên"` cho user ẩn
  danh vì `display_name` NULL và `email` NULL → đổi thành `"Khách"` khi ẩn danh.

#### [MODIFY] `src/app/tai-khoan/page.tsx`
- `:29-92` là **bộ giải danh tính thứ hai, độc lập**, lặp lại nguyên logic của
  `useAuthUser` kèm đúng khiếm khuyết đó (`isLoggedIn: true` ở `:48`, fallback tên
  ở `:44`). Sửa một chỗ mà bỏ chỗ này thì riêng trang này vẫn gọi khách ẩn danh là
  "Thành Viên". **Khuyến nghị: rút thành helper dùng chung thay vì vá hai lần.**

#### [MODIFY] `src/app/tai-khoan/[id]/page.tsx`
- `:78-83` hardcode `isLoggedIn: true` cho Header bất kể ai đang xem, với
  `onLogout={() => {}}` ở `:86`. Dùng danh tính thật.

### Rate-limit — lỗ hổng do chính hướng này tạo ra (BẮT BUỘC)

Mọi route dưới đây đang theo công thức `user ? ":user:" : ":ip:"`. Anonymous auth
làm mọi phiên đều có `user.id`, nên nhánh `:ip:` thành code chết và hạn mức khách
vãng lai biến mất. Sửa thành: **ẩn danh vẫn đếm theo IP**.

#### [MODIFY] `src/app/api/reading/deep/shuffle/route.ts`
- `:39-48` — ẩn danh phải giữ key `reading-deep-shuffle:ip:` và cửa sổ
  `[86400, 10]`, không được nhảy sang `[3600, 30]` theo user.
- **Đây là chỗ nguy hiểm nhất**: mỗi lượt shuffle gọi `triageQuestion()` (`:61`)
  = một request Gemini có tiền. Không sửa thì vòng lặp
  `signInAnonymously()` → `/shuffle` là máy bơm chi phí AI không giới hạn.
- Comment `:31-37` đang giải thích giả định "ẩn danh = bucket IP" — phải viết lại
  cho đúng, nếu không người sau sẽ tin vào một câu đã sai.

#### [MODIFY] `src/app/api/reading/route.ts`
- `:31-37` — cùng lỗi, nhẹ hơn (Rút Nhanh chi phí biên thấp hơn): ẩn danh đang
  được nâng từ 20/ngày/IP lên 20/giờ/user.

#### [MODIFY] `src/app/api/reading/deep/resume/route.ts`
- `:40-42` — chỉ có biến thể theo user vì trước đây ẩn danh không tới được đây.
  Giờ tới được → thêm nhánh IP.

#### [MODIFY] `src/app/api/orders/route.ts`
- `:57` `orders-create:user:${user.id}` 10/giờ — reset được bằng một danh tính
  mới. Ẩn danh thêm key IP song song.
- `:49-52` POST: cho phiên ẩn danh đi qua (đó là mục đích), nhưng **chỉ với
  `packId === "single"`** — khách ẩn danh không có lý do gì mua gói 100 credits
  vào một phiên chỉ sống trong một cookie.
- Comment ở `src/lib/supabase/middleware.ts:16-17` hiện khẳng định điều ngược lại
  ("mua credits bắt buộc phải có tài khoản… không có luồng khách vãng lai") —
  phải sửa, nếu không tài liệu trong code nói trái với hành vi.

### Gói lẻ + UI thanh toán

#### [MODIFY] `src/lib/orders.ts`
- Thêm `single: { label: "Một lượt Đọc sâu", credits: 2, amountVnd: env.NEXT_PUBLIC_PACK_SINGLE_AMOUNT_VND }`.
  `credits: 2` phải khớp `env.DEEP_READING_COST` (default 2) — **không** hardcode
  rời: nếu hai số lệch nhau thì khách trả tiền một lượt mà không đủ mở khoá.
- `CreateOrderRequestSchema` (`:18`) thêm `"single"` vào enum.

#### [MODIFY] `src/components/CreditTopUpModal.tsx`
- Thêm prop `mode?: "packs" | "single"` (theo rule *variants over forks* trong
  `design-system.md`, không tạo component song song). `"packs"` = hành vi hiện tại
  và **không hiện gói `single`**; `"single"` = chỉ gói lẻ, copy hướng về "mở khoá
  luận giải này" chứ không phải "nạp credits".
- `:183-192` map 401 thành "Vui lòng đăng nhập…" — với luồng khách thì 401 không
  còn xảy ra; rà lại nhánh này.

#### [MODIFY] `src/screens/DeepReadScreen.tsx`
- `:630-634` guard `credits < 2` hiện **chính là tường đăng nhập** của khách (vì
  khách luôn `credits: 0`). Thêm nhánh: `!isLoggedIn` → mở sheet mua lẻ, không
  phải modal đăng nhập.
- `:672-680` nhánh 401 trở thành code chết thật sự (ẩn danh giờ qua được
  `requireUser()`); comment `:673-676` nói "ẩn danh luôn có credits = 0" sẽ thành
  câu sai — sửa hoặc bỏ.
- Sau khi `analysisComplete`, render CTA nâng cấp tài khoản.
- Thêm prop `isAnonymous` để phân biệt "khách chưa trả tiền" với "khách đã trả".

#### [MODIFY] `src/app/doc-sau/page.tsx`
- `:45-49` và `:66-71` hiện là `if (!user.isLoggedIn) → AuthModal; else → TopUp`.
  Đổi thành ba nhánh: khách → sheet mua lẻ; ẩn danh đã trả → TopUp; thật → TopUp.
- Truyền `isAnonymous` xuống `DeepReadScreen`.
- Cùng pattern 3 nhánh ở `src/app/page.tsx:162-167,204-209,234-239`,
  `src/app/trai-bai/page.tsx:22-26`,
  `src/components/library/LibraryChrome.tsx:54-58`,
  `src/app/nap-credits/page.tsx:20-24`.

#### [NEW] `src/components/account/UpgradeAnonymousAccount.tsx`
- Form email + mật khẩu, gọi `supabase.auth.updateUser({ email, password })` —
  giữ nguyên uuid nên luận giải đã trả tiền, credits còn lại và `readings` đều
  theo sang. Dùng lại `usePasswordCheck` + `PASSWORD_MIN_LENGTH` của
  `AuthModal.tsx` (`:5`, `:91`) thay vì viết lại luật mật khẩu.
- States: idle / submitting / cần xác nhận email / lỗi / xong.

#### [NEW] `src/app/api/account/claim-affiliate/route.ts`
- Lúc nâng cấp, gắn attribution affiliate từ cookie còn lại vào profile. Phải là
  route server-side vì `guard_profiles_protected_columns`
  (`20260909084121_...:30-33`) chặn mọi thay đổi `referred_by_code` /
  `referred_click_id` không phải service-role.

### Chặn bề mặt phá hoại mà phiên ẩn danh bỗng chạm tới

#### [MODIFY] `src/lib/supabase/middleware.ts`
- `:155-165` test `!user` → ẩn danh *là* user nên **cả ba** prefix
  `["/tai-khoan", "/nap-credits", "/admin"]` (`:22`) mở ra. Đổi thành: ẩn danh bị
  chặn ở `/tai-khoan` + `/admin`, được vào `/nap-credits` (cần cho trang kết quả).
- Đăng nhập ẩn danh **không** được gọi `withAffiliateMetadata` — xem Assumptions.

#### [MODIFY] `src/components/Header.tsx`
- `:139` — nút "Đăng Nhập" biến mất ngay khi `signInAnonymously()` resolve. Đó
  chính là affordance quan trọng nhất ("tạo tài khoản thật để không mất thứ vừa
  trả tiền"). Với ẩn danh: **giữ** nút, đổi nhãn thành CTA nâng cấp.
- `:112-123` và `:239-248` ẩn "Tài Khoản" với ẩn danh.
- `:176-183` và `:272-292` — "Thoát" với phiên ẩn danh là **phá huỷ tài khoản**,
  không phải đăng xuất: mất vĩnh viễn credits đã mua, không có đường phục hồi.
  Ẩn hoặc bắt buộc xác nhận có cảnh báo.
- `:172-174` render `user.name.split(" ")[0]` → "Thành" cho mọi user ẩn danh.

#### [MODIFY] `src/screens/AccountScreen.tsx`
- `:104-108` badge "Thành Viên" + `:110` `{user.email || "Chưa đăng nhập"}` →
  UI tự mâu thuẫn. Ẩn danh: badge "Khách", kèm CTA nâng cấp.
- `:322-330` ẩn `ChangePasswordSection` (đang mount với `email=""` rồi fetch vô
  ích mỗi lần tải trang, luôn trả về trạng thái "không khả dụng").
- `:332-339` **ẩn `DeleteAccountButton`** — xem dưới.

#### [MODIFY] `src/app/api/account/route.ts`
- `:20-27` DELETE không có guard ẩn danh. `:46-51` gọi `updateUserById` với
  `email: deleted-<uuid>@xembaitarot.invalid` — với user ẩn danh (`email` NULL)
  việc này **ghi một email lên hàng vốn không có email** rồi ban vĩnh viễn
  (`ban_duration: "876000h"`). Nếu họ đã trả tiền: `orders`/`credit_ledger` sống
  sót nhờ `on delete restrict`, nhưng tài khoản bị ban → **credits đã mua bị
  tiêu diệt, không còn danh tính nào để phục hồi**. Chặn ẩn danh ở đầu route.

#### [MODIFY] `src/app/api/account/password/route.ts`
- `:19-26` GET và `:37-44` POST: chặn ẩn danh **trước** `:50` (hiện đốt một suất
  rate-limit rồi mới fail ở `:88` với thông báo sai nghĩa "no_password_set").

#### [MODIFY] `src/components/auth/SignOutButton.tsx`
- `:12-18` `signOut()` trần + `router.push("/")`. Với ẩn danh đây là phá huỷ tài
  khoản. (Grep cho thấy hiện chưa được import ở đâu, nhưng vẫn là code sống.)

### Số liệu admin — migration

#### [NEW] `supabase/migrations/<ts>_admin_stats_exclude_anonymous.sql`
Mọi RPC dưới đây đọc `profiles` không lọc ẩn danh, mà mỗi `signInAnonymously()`
tạo một hàng `profiles` thật. Lọc bằng `auth.users.is_anonymous = false`.
- `20260909084833_admin_overview_stats_rpc.sql`: `:31` `total_users`, `:32-33`
  `new_users_7d/30d`, `:50` `paying_users`.
- `:37-42` **`dau`/`wau`** — nguy hiểm nhất: guard `user_id is not null` ở `:35-36`
  tồn tại **đúng để loại khách vãng lai**, và anonymous auth vô hiệu hoá nó. Mỗi
  lượt đọc ẩn danh thành một "active user"; vì mỗi lần gọi sinh uuid mới, một
  người quay lại N lần đếm thành N user.
- `20260909084928_admin_read_rpcs.sql`: `:21-22` `admin_daily_series.signups`
  (đường biểu đồ đổi hình ngay ngày lên tính năng → không so sánh trước/sau được),
  `:41-83` `admin_list_users` (hàng ẩn danh có `email` NULL và `display_name` NULL
  nên `ilike` ở `:76-79` không bao giờ khớp → **không tìm được nhưng vẫn chiếm
  từng trang phân trang**, đẩy user thật khỏi trang 1).
- `:90-158` `admin_affiliate_stats` — xem Assumptions về attribution.
- **Nhớ `revoke`/`grant` lại sau `create or replace`** (learned pattern
  2026-08-19 + tiền lệ ở `20260909114547_...:61`).

### Dọn phiên bỏ hoang

#### [NEW] `src/app/api/cron/cleanup-anonymous/route.ts`
- Theo đúng khuôn 3 route cron hiện có: `runtime = "nodejs"`, so bearer với
  `env.CRON_SECRET`, service-role.
- Xoá `auth.users` có `is_anonymous = true`, `created_at < now() - 30 days`, và
  **không có `orders` nào**. FK `on delete restrict` sẽ chặn phần có đơn — đó là
  hàng rào đúng, không lách.
- Thêm entry vào `vercel.json` (hoặc Cloud Scheduler nếu task Firebase App Hosting
  được làm trước).

### Pháp lý / nội dung

#### [MODIFY] `src/app/chinh-sach-hoan-tien/page.tsx`
- `:18` hiện viết *"Credits sẽ tự động được hoàn trả về **tài khoản của bạn**"* và
  `:23-25` toàn bộ đóng khung quanh "gói Credits". Với khách không có tài khoản,
  câu đó vô nghĩa. Cần mục riêng: mua lẻ một lượt là sản phẩm số giao ngay; nếu
  lỗi kỹ thuật thì hoàn credits vào chính phiên đó; nếu mất phiên thì đối soát
  thủ công qua `payos_order_code` + biên lai gửi `SUPPORT_EMAIL`.

#### [MODIFY] `src/app/dieu-khoan/page.tsx`
- Thêm điều khoản mua không cần tài khoản và giới hạn của nó (phiên sống trong
  cookie của trình duyệt đó).

## Accessibility Plan
- **Semantic**: sheet mua lẻ là `<dialog>`/modal theo đúng khuôn `CreditTopUpModal`
  đang dùng; form nâng cấp là `<form>` với `<label>` thật cho email + mật khẩu
  (`autoComplete="email"` / `"new-password"`).
- **Keyboard**: focus vào sheet khi mở, trap trong lúc mở, trả về nút "Mở khoá"
  khi đóng, `Esc` đóng — dùng lại `useModalA11y` (`src/lib/useModalA11y.ts`).
- **Trạng thái chờ webhook** là một live region: `role="status" aria-live="polite"`
  (đã có tiền lệ ở `nap-credits/ket-qua/page.tsx:88-89`). Khách đang chờ tiền về
  phải được đọc to tiến triển, không chỉ thấy spinner.
- **Màu**: không thêm cặp màu mới — dùng token sẵn có cho trạng thái chờ/lỗi.
  Nếu buộc phải thêm, kiểm contrast cả hai theme.
- **Không chỉ dùng màu** cho "đang chờ / đã trả / thất bại": kèm icon + chữ.

## Blast Radius

| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/lib/auth.ts` `requireUser()` | 11 call site | Đổi kiểu trả về → typecheck bắt hết, nhưng **mỗi chỗ là một quyết định cho/chặn**, không phải sửa máy móc |
| `src/types/tarot.ts` `UserProfile` | ~12 file render Header/Account | Thêm field bắt buộc → mọi literal khởi tạo phải cập nhật (`tai-khoan/[id]:78`, `dang-nhap:16`, `dat-lai-mat-khau:17`) |
| Rate-limit 4 route | — | **Sai ở đây = hoá đơn Gemini không giới hạn.** Verify bằng request thật, không chỉ đọc code |
| `PACKS` trong `src/lib/orders.ts` | Cả server route và client modal | Phải giữ client-safe (chỉ `NEXT_PUBLIC_*`) |
| RPC admin | `src/app/admin/*` (cache 60s) | Số liệu đang cache → đổi RPC xong phải chờ/invalidate mới thấy |
| `handle_new_user` | Mọi signup | **Không đụng trigger này.** Nó là đường sống của toàn bộ signup; giải quyết attribution ở tầng gọi (không truyền `ref_click`) |

## Verification Plan

### Automated
- `npm run lint` — chú ý rule React Compiler (`react-hooks/purity`) đã bẫy dự án
  này một lần (learned 2026-08-18).
- `npx tsc --noEmit` — đây là gate chính bắt hết consumer của `requireUser()` và
  `UserProfile`.
- `npm run build`.
- Không có `test` script — ghi `n/a`.

### Manual
1. **Lỗ rate-limit (làm trước mọi thứ khác).** Gọi `signInAnonymously()` 3 lần
   liên tiếp rồi `/api/reading/deep/shuffle` mỗi lần. Phải thấy **429 từ lần vượt
   hạn mức IP**, chứ không phải 3 lượt shuffle thành công với 3 uuid khác nhau.
   Đây là bài kiểm tra quan trọng nhất của cả task.
2. **Luồng tiền đầy đủ, tiền thật, gói lẻ**: khách → 3 lá → mua → chuyển khoản →
   credit vào profile ẩn danh → stream xong → `readings` có hàng với `user_id` là
   uuid ẩn danh. Đối chiếu `orders`, `credit_ledger`, `readings` trong DB.
3. **Phiên sống sót qua lúc đăng nhập ẩn danh**: đúng 3 lá và đúng câu hỏi còn
   nguyên sau `signInAnonymously()` (commit `3d11f9d` phải lo việc này — xác nhận
   chứ đừng giả định).
4. **Nâng cấp giữ nguyên mọi thứ**: `updateUser` xong, luận giải vừa trả tiền vẫn
   đọc được ở `/tai-khoan`, credits còn lại không đổi, **chỉ có một** hàng
   `auth.users` cho người đó.
5. **Bề mặt phá hoại**: phiên ẩn danh không vào được `/tai-khoan` và `/admin`;
   không thấy `DeleteAccountButton`; `DELETE /api/account` trả lỗi; "Thoát" không
   âm thầm phá tài khoản đã trả tiền.
6. **Attribution affiliate**: bấm link `?ref=<mã đang bật>` → mua ẩn danh →
   nâng cấp. Chỉ được **một** hàng `profiles` mang `referred_click_id`;
   `percent(signups, clicks)` trong `/admin/affiliate` không vượt 100%.
7. **Số liệu admin**: sau khi tạo vài phiên ẩn danh, `total_users` và `dau`/`wau`
   **không** tăng; `/admin/users` trang 1 không bị hàng NULL chen vào.
8. **Responsive 375 / 768 / 1280** cho sheet mua lẻ và CTA nâng cấp; bàn phím đi
   hết được cả hai.
9. **Dọn sạch dữ liệu test** đúng thứ tự FK (`readings`/`credit_ledger` trước
   `auth.users`) và xác nhận `count(*) = 0` — theo learned pattern 2026-08-18.

> [!WARNING]
> Quota Gemini free-tier (20 request/ngày/model) đã **chặn E2E của task
> `trai-nghiem-an-danh`** đúng ở bước này. Lên kế hoạch verify trong ngày còn
> quota, hoặc chấp nhận ghi `⏭️ skipped` trung thực chứ không viết "verified".

## Out of Scope
- Gửi email luận giải; hạ tầng mail.
- Link có chữ ký để xem lại.
- Nâng cấp bằng Google / Zalo (`enable_manual_linking`, và task
  `auth-zalo-hoan-lai` đang hoãn).
- Hoàn tiền tự động cho khách mất cookie — thủ công qua `payos_order_code`.
- Đổi giá hoặc cấu trúc 3 gói hiện có.
- Sửa các lỗi có sẵn phát hiện trong lúc khảo sát nhưng không liên quan:
  `readings` insert không set `id` nên `done.readingId` là ledger ref chứ không
  phải `readings.id`; nhánh insert lỗi ở `personal/route.ts:186-188` không hoàn
  tiền; `/personal` không có rate-limit; `decoder.decode` thiếu `{stream:true}`
  làm mất dòng NDJSON bị cắt ngang. **Ghi lại để xử lý riêng.**
