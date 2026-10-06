# Tối ưu hệ thống xử lý (đợt 2) — kế hoạch chi tiết

Nguồn: rà soát khách quan ngày 2026-10-05 (đo thật + đọc lại code) sau khi Daily/3 lá lên nhánh
`feat/trai-bai-4-loai`. Phạm vi gồm cả điểm **do đợt Daily gây ra** lẫn điểm **có từ trước**.

## Điều kiện tiên quyết
- Commit/merge nhánh `feat/trai-bai-4-loai` TRƯỚC, rồi làm đợt này trên nhánh mới (`perf/he-thong-xu-ly`).
  Lý do: nhánh hiện tại chưa commit, trộn hai đợt thì không hoàn tác riêng được.
- Thứ tự triển khai prod luôn là: **migration → code** (xem bài học 2026-09-20).

## Decisions Needed From You
> [!IMPORTANT]
> - **D1 (đã đồng ý)**: khách Daily dùng cookie ký, không tạo tài khoản ẩn danh; chấp nhận mất lá khi xoá cookie,
>   không có lịch sử cho khách.
> - **D2 — Mức xác thực cho route chạm tiền.** Đề xuất: `getClaims()` (kiểm JWT tại chỗ, 0 lượt mạng) cho trang, proxy,
>   `GET`, shuffle/resume, **Daily**; giữ `getUser()` (hỏi GoTrue) cho **orders, personal (trừ 2 credit), đổi mật khẩu,
>   xoá tài khoản**. Cái giá: token đã đăng xuất vẫn dùng được tới khi hết hạn (≤ 1 giờ) ở nhóm dùng `getClaims`.
> - **D3 — Lịch chạy cron đối soát.** Đề xuất mỗi 10 phút. Vercel Cron chạy dày chỉ có ở gói Pro; gói Hobby chỉ 1 lần/ngày.
>   Bạn đang ở gói nào? Nếu Hobby: dùng `pg_cron` của Supabase (miễn phí) gọi thẳng hàm SQL.
> - **D4 — Thêm devDependency**: `@electric-sql/pglite` (test migration không cần Docker) và `playwright-core`
>   (đưa bộ test giao diện vào repo). Bạn đồng ý?
> - **D5 — Tự lưu ảnh lưng bài** (đang hotlink từ `lh3.googleusercontent.com/aida-public/…`): bạn có quyền dùng/lưu ảnh đó không?
> - **D6 — Sentry**: hạ `tracesSampleRate` từ 1 xuống 0,1 (lỗi vẫn gửi 100%). Đồng ý?

## Bảng vấn đề → pha xử lý
| # | Vấn đề | Bằng chứng | Nguồn gốc | Pha |
|---|---|---|---|---|
| 1 | Mỗi khách rút Daily tạo 1 tài khoản ẩn danh (~7 dòng, 6 lượt gọi); giới hạn đăng nhập ẩn danh 10/giờ/IP (config.toml); cron dọn tối đa 200/ngày | đọc config + cron, đếm dòng | **Đợt Daily** | A |
| 2 | Lượt đã trừ tiền/claim bị đứt giữa chừng không tự hoàn; Daily replay 409 vĩnh viễn | đọc code | Có từ trước (3 lá) + Daily | B |
| 3 | Xác thực chạy 2 lần mỗi request (proxy + route), mỗi lần ~90 ms | đo: 90 ms/lượt | Có từ trước | C |
| 4 | Lượt rút Daily tuần tự 8 lượt gọi (tính cả xác thực) | đọc code | **Đợt Daily** | C |
| 5 | Ảnh lá bài `max-age=0`; `/thu-vien` tải 11,2 MB; ảnh lưng bài hotlink Google; JS 365–410 KB | đo Playwright + curl | Có từ trước | D |
| 6 | `images.remotePatterns` cho `hostname: "**"` mà không dùng `next/image` → `/_next/image` là proxy ảnh mở | đọc config + grep | Có từ trước | D |
| 7 | Sentry `tracesSampleRate: 1` ở client, server, edge | đọc config | Có từ trước | D |
| 8 | Timeout AI chỉ ngừng chờ, không huỷ request → có thể trả tiền hai lần | đọc `retry.ts` | Có từ trước | E |
| 9 | `checkRateLimit` nuốt lỗi và cho qua kể cả ở production; không log | đọc code | Có từ trước | E |
| 10 | Cron dọn ẩn danh không đặt `maxDuration`, xoá tuần tự | đọc code | Có từ trước | E |
| 11 | Callback prop không ổn định nằm trong deps (đã gây vòng lặp ở Daily) — còn ở `DeepReadScreen` | đã gặp lỗi thật | Có từ trước | E |
| 12 | Header người đã đăng nhập tràn ngang ~9 px ở 768 px | đo Playwright | Có từ trước | E |
| 13 | Danh sách lịch sử còn mang `personal_body` của bản ghi cũ; Daily chép nội dung vào mỗi lượt | đo kích thước | Có từ trước / Daily | F (khi vượt ngưỡng) |
| 14 | Không có test tự động; kết quả kiểm thử nằm trong thư mục tạm | repo không có `test` | Có từ trước | G |

---

## Pha A — Khách Daily bằng cookie ký (vấn đề 1)
**Mục tiêu:** lượt rút đầu của khách = 1 request, 0 dòng DB, 0 lượt gọi GoTrue. Khách chưa có cookie mở trang = 0 request.

**Thiết kế**
- `src/lib/daily-guest.ts` (mới): ký/kiểm cookie bằng HMAC-SHA256, khoá dẫn xuất từ `READING_TOKEN_SECRET` với tiền tố miền
  `daily-guest:` (không dùng chung định dạng token đọc sâu).
  - Cookie `dg` (httpOnly, SameSite=Lax, Secure ở production, 90 ngày): `{v:1, day, cardId, orientation, variant, recent:[≤20 cardId, mới nhất trước]}`.
    `recent` giữ "bộ bài riêng" qua nhiều ngày cho khách (dùng lại `pickCard`).
  - Cookie `dg_day` (KHÔNG httpOnly, 2 ngày): chỉ chứa ngày VN của lần rút gần nhất — để trình duyệt biết có nên gọi `GET` hay không.
- `POST /api/reading/daily`: nhánh khách khi `getRequestUser()` trả null:
  1. rate limit theo IP (giữ khoá `reading-daily:ip:`);
  2. cookie hợp lệ và `day === hôm nay` → trả lại đúng lá đó (idempotent: bấm đúp/tải lại không rút lá mới);
  3. ngược lại: chọn lá (`pickCard(approved, recent)` + `pickVariant`), ghi cookie, trả `{kind:"free", readingId:null, guest:true}`.
  Có phiên (kể cả ẩn danh do mua lẻ) → đi nhánh DB như hiện tại.
- `GET`: khách có cookie hợp lệ hôm nay → trả `today`; không → trạng thái mặc định.
- `DailyScreen`: bỏ `signInAnonymously()` khỏi luồng Daily; chỉ gọi `GET` khi `dg_day === hôm nay`; "Rút thêm" của khách mở
  `AuthModal` (thêm prop `onOpenAuth`), không còn nhánh "phiên ẩn danh → /luu-tai-khoan" cho Daily.
- Kiểu: `DailyDraw.readingId: string | null`, thêm cờ `guest`.

**Không đổi:** phiên ẩn danh phục vụ luồng mua lẻ Đọc sâu giữ nguyên.

**Kiểm thử / nghiệm thu**
- Đơn vị: ký–kiểm đúng; sửa 1 byte → bị từ chối; sai ngày → coi là lượt mới; cookie < 512 B với 20 lá.
- Giao diện (mở rộng bộ Playwright): mở `/hom-nay` mới = 0 request tới `/api` và Supabase; rút = đúng 1 POST, có `Set-Cookie`,
  0 request `auth/v1`; tải lại = đúng 1 GET, cùng lá; xoá cookie = lá mới; cookie giả → lá mới, không lỗi.
- Đo thật: số dòng mới trong `auth.users`/`readings`/`daily_draws` sau 20 lượt khách = 0.
- Hoàn tác: revert code; cookie cũ bị bỏ qua, không cần migration.

---

## Pha B — Đối soát lượt mồ côi (vấn đề 2)
**Mục tiêu:** mọi lượt đã trừ tiền hoặc claim mà không ra kết quả được tự hoàn/nhả trong ≤ 15 phút; không bao giờ hoàn nhầm lượt đã giao.

**Thiết kế**
- Migration `…_reconcile_orphans.sql`: hàm `reconcile_orphan_reads(p_older_than interval default '15 minutes', p_dry_run boolean default true, p_limit int default 200)`
  (`security definer`, chỉ `service_role`, grant/revoke tường minh, KHÔNG `drop function` hàm tiền):
  - **Đọc sâu**: dòng `credit_ledger` `reason='reading'` cũ hơn ngưỡng, chưa có dòng `refund`, và **không có** `readings` nào khớp
    - `readings.id = ref_id` (bản ghi mới), **hoặc**
    - cùng `user_id`, `tier='deep'`, `created_at` trong 10 phút sau lúc trừ (bản ghi cũ, `id` ngẫu nhiên — nếu bỏ qua điều này
      sẽ hoàn nhầm toàn bộ lịch sử cũ). Heuristic này nghiêng về "không hoàn" khi nghi ngờ.
    → gọi `refund_reading(ref_id)` (đã idempotent).
  - **Daily**: dòng `daily_draws` cũ hơn ngưỡng mà `readings.id = reading_id` không tồn tại → `release_daily_draw(reading_id)`.
  - `p_dry_run = true` chỉ liệt kê, không sửa.
  - Kèm một truy vấn cảnh báo (không sửa): `profiles.credits` lệch tổng `credit_ledger.delta`.
- `src/app/api/cron/reconcile-readings/route.ts`: xác thực `CRON_SECRET`, `maxDuration = 30`, gọi hàm (dry-run tắt), ghi Sentry nếu có
  mục được xử lý hoặc có lệch sổ cái. Lịch theo D3.
- `daily/route.ts` nhánh `replay`: nếu chưa có `readings` và dòng `daily_draws` cũ hơn 60 giây → `release_daily_draw` rồi claim lại một lần
  (thay vì trả 409 vĩnh viễn).
- Ghi `readings` sau khi sinh xong (3 lá): thử lại một lần khi lỗi ghi, vì lỗi ghi sẽ khiến bộ đối soát hoàn tiền cho lượt đã giao.
- Thông báo client sau khi hết thời gian chờ lấy lại: nói rõ "nếu không có kết quả, credits sẽ tự hoàn trong vài phút".

**Kiểm thử (PGlite, mở rộng `sqltest`)**: lượt mồ côi bị hoàn đúng 1 lần và số dư khôi phục; chạy lần hai không hoàn thêm; lượt đang xử lý (< 15 phút)
không bị đụng; bản ghi cũ khớp bằng heuristic không bị hoàn; Daily paid/free mồ côi được nhả/hoàn; **bất biến: `profiles.credits` = tổng `delta` sau mọi kịch bản**.

**Triển khai an toàn**: áp migration → chạy `p_dry_run = true` trên production, đọc danh sách ứng viên → chỉ khi danh sách đúng mới bật cron.

---

## Pha C — Giảm số lượt gọi mạng (vấn đề 3, 4)
**Cơ sở đã đo:** project dùng khoá ký **ES256** (JWKS có 1 khoá) → `auth.getClaims()` kiểm chữ ký tại chỗ bằng JWKS cache, không gọi GoTrue
(token cũ ký HS256 tự rơi về `getUser()` — êm khi chuyển giao). Thư viện đã cài: `auth-js 2.117.2`, có `getClaims`.

**Thiết kế**
- `src/lib/auth.ts`: `requireUser()` dùng `getClaims()` (id = `sub`, `isAnonymous = claims.is_anonymous === true`); thêm `requireUserVerified()`
  dùng `getUser()` cho nhóm chạm tiền (D2). Áp dụng: orders, personal, account (đổi mật khẩu/xoá) → Verified; còn lại → nhanh.
- `src/lib/supabase/middleware.ts`: thay `getUser()` bằng `getClaims()`; vẫn làm mới cookie phiên khi token hết hạn; giữ nguyên logic chặn
  `/tai-khoan`, `/admin`, `/nap-credits`.
- `daily/route.ts` POST: `[rate-limit ∥ đọc lịch sử] → claim → đọc nội dung → ghi`; **bỏ `readCredits` khi lượt là free** (credits không đổi,
  trả `creditsRemaining: null`); chỉ đọc credits sau lượt paid. `GET`: bỏ truy vấn credits (client đã có), còn `draws ∥ latest`.

**Số lượt gọi nối tiếp (mục tiêu)**
| Thao tác | Hiện tại | Sau |
|---|---|---|
| POST Daily (đã đăng nhập, lượt free) | 8 | **4** |
| GET Daily | 3 | **1** |
| Mỗi lần chuyển trang khi đã đăng nhập | +1 (proxy) | **0** |

**Kiểm thử bắt buộc (vì chạm xác thực):** chưa đăng nhập vào trang bảo vệ → chuyển hướng; phiên ẩn danh bị chặn ở `/tai-khoan` và `/admin`;
JWT giả/sửa chữ ký → coi như chưa đăng nhập; token hết hạn → làm mới cookie; token HS256 cũ → vẫn vào được (fallback); route nhóm Verified vẫn từ chối
token đã đăng xuất. Đo lại bằng `rtt.cjs`.
**Hoàn tác:** đổi lại hai dòng gọi `getUser()`; không đụng dữ liệu.

---

## Pha D — Trang và tài nguyên tĩnh (vấn đề 5, 6, 7)
1. `next.config.ts`: **xoá** khối `images.remotePatterns` (không dùng `next/image`, `/_next/image` đang là proxy ảnh mở trên hoá đơn Vercel của bạn);
   thêm `headers()`: `/cards/:path*` → `public, max-age=2592000, stale-while-revalidate=604800`. Kiểm bằng `curl -I`.
2. **Ảnh thu nhỏ cho thư viện**: `scripts/generateCardThumbs.mjs` (dùng `sharp` đã có sẵn trong node_modules) → `public/cards/thumb/<id>.webp`, 240×360,
   chất lượng ~78 (≈ 12–20 KB/ảnh, ≈ 1,3 MB cả bộ). `LibraryScreen`/`LibraryIndexClient` dùng ảnh thu nhỏ + `loading="lazy"`, `decoding="async"`,
   `width`/`height` (chống giật bố cục); trang chi tiết lá bài và modal vẫn dùng ảnh gốc. Mục tiêu `/thu-vien`: 11,2 MB → ≤ 1,5 MB tổng, ≤ 0,5 MB lúc mở.
3. **Tự lưu ảnh lưng bài** (cần D5): tải một lần, đổi sang webp, đặt `public/card-back.webp`, sửa `CARD_BACK_IMAGE`. Bỏ phụ thuộc bên thứ ba
   (DNS + TLS + 88 KB mỗi lần mở trang).
4. **Giảm JS ban đầu**: chạy `next experimental-analyze` để có thành phần từng route (số 368 KB trước đây đo trên bản build webpack — đo lại bằng bản build Turbopack
   thật). Ứng viên đã thấy: `CreditTopUpModal`, `AuthModal`, `GuestUnlockChoice` được import tĩnh ở mọi trang dù đóng (đổi sang `next/dynamic` tải khi mở lần đầu);
   `qrcode` chỉ cần khi hiện QR. Ngân sách: `/hom-nay` ≤ 300 KB gz.
5. **Sentry** (D6): `tracesSampleRate` 1 → 0,1 (đặt qua biến môi trường, mặc định 0,1) ở `instrumentation.ts` (nodejs + edge) và `instrumentation-client.ts`.
6. Dọn: gỡ `framer-motion` khỏi `package.json` và xoá `StarField.tsx` (file chết duy nhất dùng nó). Giữ `ReadingDisclaimer`, `CrisisResourceNotice`, `ui/Card`
   (liên quan nội dung an toàn/pháp lý — quyết định riêng).

**Nghiệm thu:** chạy lại `bundle.mjs` (đưa vào repo) trước/sau, ghi số vào `docs/learned/`.

---

## Pha E — Độ bền hạ tầng (vấn đề 8–12)
1. **Huỷ thật request AI khi timeout**: thêm `signal?: AbortSignal` vào `AiGenerateJsonArgs`/`AiClassifyArgs`; `withAiRetry` tạo `AbortController` cho mỗi lần
   thử và `abort()` khi hết giờ; ba provider truyền xuống SDK (Gemini `config.abortSignal`, Anthropic/OpenAI `{ signal }`). Xoá `streamCompletion` (không còn nơi nào gọi).
   Kiểm thử: provider giả treo → sau timeout `signal.aborted === true` và lần thử sau không chạy chồng; một lần kiểm tay với provider thật.
2. **`checkRateLimit` có chính sách rõ ràng**: tham số `failOpen` bắt buộc. Route tốn tiền AI (shuffle, resume) → `failOpen: false` (trả 503 `rate_limit_unavailable`);
   Daily, orders → `failOpen: true`. Cả hai nhánh đều `Sentry.captureException` (hiện đang im lặng).
3. **Cron dọn ẩn danh**: `maxDuration = 60`, xoá song song 5 luồng, ngân sách thời gian 50 giây, trần 500/lần, log số còn lại. (Sau Pha A áp lực tạo mới giảm mạnh nhưng cron
   vẫn phải đúng.)
4. **Callback không ổn định**: tạo `useLatestRef`; thay mẫu thủ công trong `DailyScreen`; áp cho `DeepReadScreen.recoverAnalysis` (đang đổi danh tính mỗi lần render).
   Rà toàn bộ `useEffect`/`useCallback` có prop hàm trong deps.
5. **Header 768 px**: chuyển điểm hiện thanh điều hướng từ `md` sang `lg` (≤ 1023 px dùng menu di động). Kiểm 375/768/820/1024/1280, đăng nhập và chưa đăng nhập, không còn cuộn ngang.

---

## Pha F — Lưu trữ (làm khi vượt ngưỡng)
- **F1 `readings.preview text`**: thêm cột, backfill theo lô 1.000 dòng (tránh khoá bảng), route ghi `preview` cho lượt mới, danh sách thôi chọn `personal_body`.
  Ngưỡng làm: danh sách của một người > 100 KB hoặc DB > 50% hạn mức.
- **F2 Daily lưu tham chiếu** `(variant, version)` thay vì chép nội dung: chỉ khi > ~5.000 lượt Daily/ngày. Điều kiện: không bao giờ xoá phiên bản nội dung cũ; cần route
  giải nội dung ở server (không mở `daily_content` cho client).

## Pha G — Hạ tầng kiểm thử (làm xuyên suốt, cần D4)
- `npm run test` (node:test + type stripping, không thêm thư viện) cho logic thuần: `daily-draw`, `daily-guest`, `reading-context`, `three-card-result`.
- `tests/sql/` chạy migration trên PGlite (devDependency): các kịch bản của Pha B và 22 ca của `claim/release` hiện đang nằm ở thư mục tạm.
- `tests/e2e/` đưa bộ Playwright (API giả lập) vào repo; chạy tay trước khi deploy, không bắt buộc trên CI.

## Thứ tự và công sức
| Pha | Công sức | Phụ thuộc | Rủi ro |
|---|---|---|---|
| G (khung test) | 1 ngày | D4 | thấp |
| A khách bằng cookie | 1,5 ngày | — | trung bình (hành vi người dùng) |
| B đối soát | 1,5 ngày | D3 | **cao nếu sai** (tiền) → dry-run trước |
| C giảm lượt gọi / xác thực | 1,5 ngày | D2 | trung bình (xác thực) |
| D tài nguyên tĩnh | 1,5 ngày | D5, D6 | thấp |
| E hạ tầng | 1,5 ngày | — | thấp–trung bình |
| F lưu trữ | theo ngưỡng | — | — |
| **Tổng (A–E + G)** | **≈ 8,5 ngày** | | |

Làm theo thứ tự G → A → B → C → D → E. D và E độc lập với A–C nên có thể làm song song.

## Chỉ tiêu đo trước/sau
| Chỉ tiêu | Trước | Mục tiêu |
|---|---|---|
| Khách rút Daily lần đầu: lượt gọi / dòng DB mới | ~6 / ~7 | 1 / 0 |
| POST Daily (đã đăng nhập, free): lượt gọi nối tiếp | 8 | 4 |
| GET Daily | 3 | 1 |
| Chuyển trang khi đã đăng nhập: lượt xác thực ở proxy | 1 (≈ 90 ms) | 0 |
| `/thu-vien`: dữ liệu tải | 11,2 MB | ≤ 1,5 MB |
| `/hom-nay`: JS gz | 368 KB | ≤ 300 KB |
| Ảnh lá bài khi quay lại | 1 request kiểm tra mỗi ảnh | 0 |
| Lượt đứt giữa chừng | không tự hoàn | tự hoàn ≤ 15 phút |
| Cron dọn ẩn danh | 200/ngày, có thể quá giờ | ≥ 500/lần, không quá giờ |
| Sentry traces | 100% | 10% |

## Rủi ro và cách giảm
| Rủi ro | Cách giảm |
|---|---|
| Bộ đối soát hoàn nhầm lượt đã giao | heuristic bảo thủ cho bản ghi cũ + dry-run trên production + bất biến sổ cái trong test |
| `getClaims` chấp nhận token đã đăng xuất tới khi hết hạn | nhóm chạm tiền dùng `getUser()` (D2) |
| Khách xoá cookie để lấy thêm lượt free | giữ giới hạn theo IP; chi phí gần 0 vì nội dung sinh sẵn (đã chấp nhận) |
| Ảnh thu nhỏ lệch màu/mờ | duyệt mắt 78 ảnh ở 375/1280 trước khi thay |
| Đổi lịch cron gặp giới hạn gói Vercel | D3: dùng `pg_cron` nếu Hobby |
