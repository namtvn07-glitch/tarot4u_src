# Task: Admin Dashboard + Affiliate Link Tracking

## Goal

1. Trang `/admin` chỉ tài khoản admin xem được — tổng quan users + doanh thu +
   chi phí AI + xu hướng 30 ngày.
2. Công cụ tạo link affiliate + đo phễu chuyển đổi (click → signup → activated →
   paying → revenue) theo từng mã link.

## Decisions (đã chốt)

- Admin auth: bảng `admin_users` riêng, cấp quyền ngoài luồng bằng SQL.
- Attribution: **first-touch**, truyền **click-id (UUID)** qua cookie, không
  phải mã trần → không bịa được mã, đo được độ trễ click→signup.
- Ghi click: **service-role server-side** (middleware), không phải anon-insert.
  Có rate limit trong DB + lọc/đánh dấu bot.
- Metrics: phễu + doanh thu + credits tồn đọng + chi phí AI + phễu thanh toán +
  biểu đồ 30 ngày.

## Trạng thái DB

Đã áp dụng lên remote (chưa có file trong repo → G0 phải bù):
- `20260909080214_admin_users_table`
- `20260909080248_affiliate_schema`

## Checklist

### G0 — Đồng bộ repo ✅
- [x] `20260909080214_admin_users_table.sql` khớp remote
- [x] `20260909080248_affiliate_schema.sql` khớp remote (ghi rõ trong file rằng
      policy anon-insert ở đây là lỗ hổng, vá ở migration kế tiếp)

### G1 — Vá lỗ hổng ✅ (đã kiểm chứng bằng probe RLS trước VÀ sau)
- [x] 1a `referred_click_id` + trigger `guard_profiles_protected_columns()`
      → probe: `referred_by_code` BỊ CHẶN, `created_at` BỊ CHẶN,
      `credits` vẫn BỊ CHẶN (không hồi quy), `display_name` vẫn sửa được
      (không chặn nhầm) — `20260909084121`
- [x] 1b drop policy `affiliate_clicks_insert_anon` + revoke grants +
      `is_bot`, `landing_path` → probe: insert/đọc đều `permission denied`
      — `20260909084211`
- [x] 1b-bis bảng `admin_audit_log` → probe: user thường đọc bị chặn
      — `20260909084226`
- [x] 1c RPC `record_affiliate_click()` (validate mã + rate limit 200/giờ/IP)
      → probe: user thường gọi bị `permission denied` — `20260909084259`
- [x] 1d hardening `handle_new_user()` — bọc exception, **giữ `full_name`**
      → test 4 tình huống metadata (không ref / UUID rác / UUID không tồn tại /
      click thật) đều đúng, mã rác không ném lỗi ra ngoài — `20260909084329`
- [x] revoke execute hàm trigger cho đúng chuẩn repo — `20260909084448`
- [x] 6 file `.sql` đã ghi vào repo khớp đúng version remote
- [x] Smoke test signup THẬT qua `/auth/v1/signup` (đúng API trình duyệt gọi),
      3 kịch bản đều tạo profile thành công: có ref hợp lệ → gắn đúng
      `QATEST` + `referred_click_id`; không ref → null; ref rác
      `"day-khong-phai-uuid"` → null, **không** vỡ đăng ký. Đã xoá sạch 3 user
      probe, 0 profile mồ côi.
      (Còn giữ lại có chủ đích: link + click `QATEST` để test G3.)

### G2 — RPC thống kê ✅ (đã gọi thử cả 4, quyền chỉ postgres+service_role)
- [x] 2a `admin_overview_stats()` — `20260909084833`
- [x] 2b `admin_daily_series(p_days)` (clamp 1..365) — `20260909084928`
- [x] 2c `admin_list_users(p_limit, p_offset, p_search)` (clamp limit ≤200)
- [x] 2d `admin_affiliate_stats()` — `activated_hard` loại cả lượt đã hoàn credit
- [x] 2 file `.sql` đã ghi vào repo khớp version remote

**Số liệu thật đọc được lúc verify (2026-09-09):** 9 user · doanh thu 7.000đ ·
1 user trả phí · 108 credits tồn · **14 đơn tạo / 1 trả / 13 hết hạn** ·
6 lượt đọc (toàn deep) · token 30 ngày: gemini-3.6-flash 4.026 in / 2.892 out.
→ Tỉ lệ đơn hết hạn 93% là tín hiệu đáng xem khi có dữ liệu thật (có thể phần
lớn là đơn test lúc phát triển — cần xác nhận lại sau khi chạy thật).

### 🛑 CHẶN G3 — phát hiện: toàn bộ class token ngữ nghĩa KHÔNG sinh CSS

Kiểm chứng bằng chính CSS mà Next dev server đang phục vụ
(`/_next/static/chunks/[root-of-the-server]__*.css`, 120KB):

| Class | Số lần xuất hiện trong CSS thật |
|---|---|
| `.flex`, `.rounded-lg`, `.p-5` (utility chuẩn Tailwind) | 1 mỗi cái ✅ |
| `.bg-surface-raised`, `.bg-accent`, `.text-text-muted`, `.text-body-sm`, `.text-danger`, `.text-on-accent` | **0 — không tồn tại** ❌ |

Class `.bg-*`/`.text-*` DUY NHẤT trong toàn bộ CSS build ra là `.bg-grain`
(viết tay trong globals.css). `--color-accent` chỉ tồn tại dưới dạng biến CSS,
không có utility nào dùng nó.

**Nguyên nhân:** token nằm trong `:root` của `src/styles/tokens.css`, nhưng
Tailwind v4 chỉ sinh utility từ khối `@theme`. Toàn repo **không có `@theme`**
(đã grep cả .css/.ts/.js/.mjs ngoài node_modules).

**Phạm vi ảnh hưởng:** `text-text` 12 file · `text-body-sm` 10 file ·
`text-text-muted` 7 file · `bg-surface-raised` 5 file · `bg-accent` 3 file.
`Button.tsx` (`bg-accent text-on-accent`) và `Card.tsx` (`bg-surface-raised`)
đang không có màu nền như thiết kế.

**Vì sao lâu nay không lộ:** `@layer base` đặt sẵn nền + màu chữ cho `body`, nên
chữ vẫn đúng màu do kế thừa; phần còn lại được bù bằng class viết tay
(`.glass-panel`, `.tarot-card-glow`...) và inline `style={{ background:
"var(--color-surface)" }}` — đúng cách `PasswordAuthForm` đang làm.

→ **Cần quyết định của người dùng trước khi viết UI admin.** Ghi rõ ở đây để
lần sau không phải dò lại.

### G3 — Code app ✅
- [x] 3a `requireAdmin()` + `/admin` vào `PROTECTED_PREFIXES` + `layout.tsx`
      fail-closed (chưa login → redirect, login không phải admin → 404)
- [x] 3b middleware capture `?ref=` → click-id cookie + `record_affiliate_click`
      qua service-role + `waitUntil`. Cookie affiliate gắn ở TỪNG điểm return
      vì Supabase tạo lại response khi refresh token — gắn một lần từ đầu sẽ bị
      nuốt mất im lặng.
- [x] 3c `src/lib/affiliate.ts` + `ref_click` vào cả `PasswordAuthForm` và
      `AuthModal`
- [x] 3d 4 trang admin + API route (POST tạo / PATCH bật-tắt) +
      `admin-audit.ts` + `admin-queries.ts` + `ai-cost.ts`
- [x] 3e inline `var()` cho màu/chữ (class token chết), Tailwind cho layout;
      bảng bọc `overflow-x-auto`, `<th scope>`, `<caption class="sr-only">`,
      trạng thái có CHỮ không chỉ màu, biểu đồ có `<title>/<desc>` + bảng số
      liệu trong `<details>`, `aria-current` cho nav, target ≥44px
- [x] RPC phụ `admin_audit_log_page` — `20260909091500` (PostgREST không expose
      schema `auth` nên không query thẳng `auth.users` từ client được)

### G4 — Vận hành (ngoài code)
- [x] Cấp quyền admin cho 2 tài khoản (2026-09-09): `ventus@admin.com` và
      `namtvn07@gmail.com`. Cấp thêm sau này bằng cách tra theo email, không
      cần copy uuid tay:
      ```sql
      insert into admin_users (user_id, note)
      select id, '<tên người>' from auth.users where email = '<email>'
      on conflict (user_id) do nothing;
      ```
      **Thu hồi quyền sẽ BỊ CHẶN** nếu người đó từng tạo link affiliate —
      `affiliate_links_created_by_fkey` để `NO ACTION` (đã xác nhận qua
      `pg_constraint`). Phải `update affiliate_links set created_by = null`
      cho người đó trước, hoặc đổi ràng buộc sang `on delete set null`.
- [x] Bảng giá AI đã điền: `gemini-3.6-flash` $0.75/$3.75 mỗi triệu token
      (nguồn ai.google.dev/gemini-api/docs/pricing, tra 2026-09-09).
      **Mã hoá sẵn mốc tăng gấp đôi 01/01/2027** — đã test: cùng lượng token
      cho 363đ hôm nay và 726đ sau mốc, đúng 2.00x. Tỉ giá 26.170đ/USD (giá
      ngân hàng BÁN ra, không phải tỉ giá trung tâm).
- [x] ~~Bật "Leaked password protection"~~ — **ĐÃ RÀ LẠI, KHÔNG LÀM.** Lý do:
      (a) dự án đã cân nhắc và cố ý bỏ HIBP ngày 2026-09-09, ghi rõ ở
      `src/lib/password.ts:7-8`; (b) tính năng này chỉ kiểm **lúc đặt/đổi mật
      khẩu**, không hồi tố và không chặn đăng nhập — nên bật hôm nay **không
      bảo vệ được 2 admin đã có mật khẩu sẵn**, đúng cái lý do tôi từng viện
      ra; (c) yêu cầu gói Pro trở lên.
      Đây là một khuyến nghị sai của tôi, do đọc cảnh báo advisor mà không đọc
      quyết định đã ghi trong code.
- [ ] **Việc thật sự thay thế nó**: mật khẩu của `namtvn07@gmail.com` trên app
      này phải là mật khẩu RIÊNG, không dùng lại từ trang khác. Đó là email
      thật (mục tiêu credential-stuffing) và tài khoản đó đọc được email +
      lịch sử chi tiêu của toàn bộ người dùng. `ventus@admin.com` rủi ro thấp
      hơn nhiều vì email không có thật.
      Ghi chú: luật mật khẩu hiện tại CHO QUA `Password2026`, `Qwerty12345`,
      `Admin@1234`, `matkhau123` (đã chạy thử `evaluatePassword`).
- [ ] `ventus@admin.com` không phải email thật → mất mật khẩu là mất đường
      khôi phục. Cân nhắc đổi sang email thật hoặc đảm bảo giữ mật khẩu kỹ.
- [ ] Dọn tài khoản rác `deepread-repro-1788927359614@example.com` (sót từ
      phiên làm việc khác, không phải của task này)

### Verify ✅ (trừ visual)
- [x] `routine_privileges`: cả 7 hàm chỉ `postgres + service_role`
- [x] Probe RLS: `referred_by_code` BỊ CHẶN · `affiliate_clicks` insert BỊ CHẶN ·
      `credits` vẫn BỊ CHẶN · `display_name` vẫn sửa được (không chặn nhầm)
- [x] Signup 3 kịch bản (có ref / không ref / ref rác) đều thành công
- [x] Audit log: 2 dòng `users.list` đúng meta `{page,q,returned}`,
      `affiliate.create` + `affiliate.toggle` đều ghi; trang tổng quan và trang
      affiliate **không** sinh dòng nào — đúng thiết kế
- [x] Attribution end-to-end: `?ref=` → cookie click-id → signup → profile gắn
      đúng `referred_by_code` + `referred_click_id`
- [x] Bot UA `facebookexternalhit` → ghi `is_bot=true`, **không** set cookie.
      Mã không tồn tại → **không** ghi dòng click. `ip_hash` đúng 16 ký tự.
- [x] Phân quyền (session thật): admin → 200 cả 4 trang · user thường → 404 cả
      4 trang + API · chưa login → 307 `/dang-nhap?next=/admin`.
      Xác nhận API chặn THẬT: link `hacker-test` không hề được tạo.
- [x] API: tạo 200 · trùng mã 409 kèm thông báo đúng · sai định dạng 400
- [x] Dọn sạch: 0 dòng test ở mọi bảng, 0 profile mồ côi.
      **Bẫy thứ tự FK phát hiện khi dọn:** `affiliate_links.created_by` trỏ tới
      `admin_users`, nên phải xoá link TRƯỚC khi xoá admin/user.
- [x] typecheck sạch · build thành công (4 route admin + API đều lên)
- [x] Advisor: không phát sinh cảnh báo mới. 3 mục INFO `rls_enabled_no_policy`
      trên bảng mới là CHỦ ĐÍCH (deny-all, giống `rate_limits` sẵn có).
- [ ] ⏭️ **visual 375/768/1280 — CHƯA LÀM**: repo không có Playwright/Puppeteer
      và không được tự thêm dependency. Chỉ mới xác nhận HTML render đúng cấu
      trúc, **chưa nhìn bằng mắt**.
- [ ] ⏭️ **lint — HỎNG SẴN TỪ TRƯỚC**: script `next lint` không còn tồn tại ở
      Next 16 (báo "Invalid project directory: .../lint"), và repo không có
      `eslint.config.js`. Không phải do thay đổi này; cần một task riêng.

### G5 — Cache tầng dữ liệu ✅ (đo bằng `pg_stat_statements`, không đoán)
- [x] Gỡ `export const revalidate = 60` khỏi các trang — **vô hiệu** vì trang
      đọc cookie xác thực nên luôn `ƒ Dynamic` (kết quả build xác nhận). Đây là
      đính chính một khẳng định sai của tôi trước đó.
- [x] `getOverviewStats` + `getDailySeries` bọc `unstable_cache` TTL 60s.
      Đo thật: mở `/admin` **6 lần → chỉ 1 lần** gọi DB mỗi hàm, trong khi
      **kiểm tra quyền admin vẫn chạy đủ 6 lần** (bảo mật không bị nới).
- [x] `getAffiliateStats` **cố ý KHÔNG cache**. Đã thử `unstable_cache` +
      `revalidateTag(tag, {expire:0})` và đo được lỗi thật: tạo link xong, lần
      mở trang NGAY SAU vẫn ra bản cũ (stale-while-revalidate), lần sau mới
      đúng → trông y như thao tác thất bại. API đúng cho việc này là
      `updateTag` nhưng nó chỉ gọi được từ Server Action, không dùng được
      trong Route Handler. Chọn bỏ cache để lấy tính đúng đắn; đo lại sau khi
      sửa: tạo link và tắt link đều hiện ra ngay lần mở đầu tiên.
- [x] Không bật `cacheComponents: true` (điều kiện của `use cache`, cách chuẩn
      Next 16) — đó là cờ toàn dự án, đổi ngữ nghĩa cache của cả 30+ route.
      Không đáng đổi cả app cho một trang quản trị.
- Số đo nền để so sánh sau này: `admin_overview_stats` 14,1ms ·
  `admin_daily_series` 3,2ms (lúc 9 user / 14 đơn / 6 lượt đọc).

### G6 — Lối vào khu quản trị ✅ (thiếu sót phát hiện khi dùng thật)
Xây xong `/admin` nhưng KHÔNG gắn lối vào nào — admin đăng nhập rồi vẫn phải tự
gõ URL. Đã bổ sung:
- [x] `src/lib/useIsAdmin.ts` — hook client, query `admin_users` dòng của chính
      mình (policy `admin_users_select_own` cho phép). **Chỉ để hiện nút**,
      không phải hàng rào: sửa giá trị trong trình duyệt cũng chỉ hiện ra cái
      nút dẫn tới /admin rồi nhận 404.
- [x] `Header.tsx` — nút "Quản trị" (icon khiên) ở thanh trên, chỉ hiện với
      admin; kèm mục "Khu Quản Trị" trong menu mobile. Có `aria-label` vì dưới
      breakpoint `sm` chữ bị ẩn còn mỗi icon.
- [x] `admin/layout.tsx` — thêm "← Về trang chính": layout admin cố ý không
      dùng Header/Footer công khai nên trước đó vào rồi không có đường ra.
- [x] Verify đúng truy vấn mà trình duyệt sẽ gửi: admin → trả về dòng của mình
      (nút hiện); user thường → `[]` (nút ẩn); user thường đọc toàn bảng
      `admin_users` → `[]` (không liệt kê được ai là admin).

### G7 — Sửa ngữ nghĩa "tắt link" ✅ — `20260909114547`
Phát hiện khi user hỏi "tắt link có tác dụng gì". `handle_new_user()` cũ join
thêm `and l.is_active`, khiến tắt link có tác dụng **hồi tố**: ai đã bấm lúc
link còn chạy mà chưa kịp đăng ký thì mất luôn nguồn → kết thúc chiến dịch rồi
tắt link là số liệu tự báo chiến dịch kém hơn thực tế.
- [x] Bỏ `and l.is_active` khỏi lượt lần ngược lúc đăng ký. **Không mở lỗ nào**:
      `record_affiliate_click()` đã chặn từ lúc bấm, link tắt thì không có dòng
      click nào tồn tại để lần ngược. Kiểm tra `is_active` chỉ cần đúng 1 chỗ.
- [x] Verify 2 kịch bản đối nghịch qua API signup thật:
      A. bấm lúc BẬT → tắt link → đăng ký ⇒ gán đúng `off-test` (trước đây mất)
      B. bấm lúc ĐÃ TẮT → đăng ký ⇒ không nguồn (chốt chặn còn nguyên)
- [x] Giải thích ý nghĩa nút tắt ngay trên trang affiliate cho người vận hành.

### G8 — Tên miền trong link affiliate ✅
User phát hiện link sinh ra là `http://localhost:3001/?ref=...`. Loại lỗi sai
âm thầm: link trông hợp lệ, dán vào quảng cáo rồi mới biết hỏng.
- [x] Thêm ô **Tên miền** sửa được trong form, mặc định lấy `NEXT_PUBLIC_SITE_URL`,
      nhớ lại bằng localStorage. Tự thêm `https://`, tự bỏ `/` thừa.
- [x] Cảnh báo vàng khi giá trị trông như địa chỉ thử nghiệm
      (`localhost`, `127.0.0.1`, `*.vercel.app`).
- [x] **Không** tạo nguồn cấu hình thứ hai: `NEXT_PUBLIC_SITE_URL` vẫn là nguồn
      duy nhất, vì nó còn chi phối PayOS returnUrl/cancelUrl, sitemap, robots,
      metadataBase.
- Cảnh báo cho lúc gắn domain thật: `NEXT_PUBLIC_*` bake lúc build ⇒ sửa biến
  trên Vercel phải **Redeploy** mới ăn. Quên là **luồng thanh toán gãy** (PayOS
  trả về domain cũ), chứ không chỉ sai link affiliate.

### G9 — Nhật ký: gộp lượt lặp + hạn lưu ✅
User phản ánh nhật ký "rác và thừa". Đo dữ liệu thật: **18 dòng y hệt nhau**
(`users.list · trang 1 · 8 kết quả`) trong 7 phút, vì log ghi mỗi lần trang
render mà `/admin/users` lại là `force-dynamic`.
- [x] `20260909115157` — cột `view_count`/`last_at` + RPC `log_admin_access`
      gộp theo (người, hành động, từ khoá tìm kiếm) trong cửa sổ 15 phút.
      **Không gộp theo số trang** (lật trang = một lượt truy cập), **có tách
      theo từ khoá** (tìm một người cụ thể là thứ cần thấy riêng), **không bao
      giờ gộp hành động ghi** (mỗi lần tạo/tắt link là sự kiện riêng).
- [x] `20260909115234` — hàm đọc trả thêm `view_count`/`last_at`; trang hiển
      thị "N lượt" và khoảng thời gian.
- [x] `20260909115321` + `/api/cron/cleanup-logs` + vercel.json (02:00 hằng
      ngày): nhật ký giữ 365 ngày; lượt bấm link giữ 180 ngày **nhưng chỉ xoá
      lượt CHƯA chuyển đổi** — lượt đã dẫn tới đăng ký giữ vĩnh viễn, xoá là
      mất `referred_click_id` và hỏng chỉ số thời gian chốt của chiến dịch cũ.
- [x] Verify gộp: 8 lượt ghi → 4 dòng (5 lượt xem danh sách gộp thành 1 dòng
      đếm 5; tìm "nguyen" tách riêng; 2 lần tạo link giữ 2 dòng).
- Ước tính dung lượng: ~170 B/dòng. Trước ~12 MB/năm và tăng vô hạn; sau
  ~1 MB/năm và bị chặn trần bởi hạn lưu.

### G10 — Xem/chép/xoá link + nhật ký sống sót ✅
User báo: không xem lại được link đã tạo, và không xoá được link tạo nhầm.
- [x] `AffiliateRowActions` thay `ToggleAffiliateLink`: mỗi dòng có **Chép
      link** / Bật-Tắt / Xoá. Tên miền tách ra `src/lib/affiliate-domain.ts`
      dùng chung với form — nếu mỗi nơi tự đọc một nguồn thì sửa tên miền ở
      form mà nút chép vẫn ra địa chỉ cũ.
- [x] `DELETE /api/admin/affiliate-links` — **chặn xoá link đã có người đăng
      ký** (409 kèm lý do). `profiles.referred_by_code` có `on delete set null`
      nên xoá là âm thầm gỡ nguồn của những người đó. Test 2 chiều: link rỗng
      xoá được; link có 1 người đăng ký bị chặn, dữ liệu nguồn còn nguyên.
- [x] `20260909120512` — nhật ký sống sót khi admin bị gỡ: thêm ảnh chụp
      `admin_email` lúc ghi + khoá ngoại `on delete set null`.
      **Trước đó không xoá nổi một tài khoản admin nào còn dòng nhật ký** —
      hoặc kẹt admin cũ, hoặc phải xoá lịch sử (làm hỏng chính mục đích).
      Verify: tạo admin tạm → ghi 2 dòng → xoá tài khoản ⇒ xoá được, 2 dòng
      còn nguyên, đọc được email, `admin_user_id` về null.
- Ảnh chụp email còn đúng hơn về nghiệp vụ: ghi email TẠI THỜI ĐIỂM hành động,
  người ta đổi email sau này thì nhật ký cũ vẫn phản ánh đúng lúc đó.

### Hạn chế đã biết (có ý thức, chưa sửa)
- **Mã sai/đã tắt vẫn set cookie** → lượt truy cập đó ôm một click-id không tồn
  tại, và vì first-touch nên nó chặn luôn một `?ref=` hợp lệ đến sau trong 30
  ngày. Sửa đúng thì phải `await` RPC trước khi set cookie = thêm độ trễ cho
  đúng request quan trọng nhất của phễu marketing. Chọn giữ tốc độ.
- **Chi phí AI chưa quy ra tiền**: `MODEL_PRICES` cố ý để trống, UI hiện "chưa
  cấu hình giá". Điền số phỏng đoán còn tệ hơn vì nó sẽ được dùng để tính biên
  lợi nhuận.
- **Đường dẫn đích của link không lưu vào DB** — chỉ dùng để ghép chuỗi URL.

## Non-goals

Hoa hồng affiliate, retention 7/30 ngày, role nhiều cấp, light theme,
audit log khi admin đọc dữ liệu user.

## Tham chiếu

`implementation-plan.md` cùng thư mục (bản v2, có SQL đầy đủ + rationale).
