# Trải nghiệm ẩn danh — chỉ đăng nhập khi cần Credits

Cho phép user chưa đăng nhập dùng Trải Bài Sâu tới hết bước xem Lớp Nền miễn
phí (xáo bài + lật 3 lá + đọc diễn giải nền), và chỉ bị chặn lại — kèm mời
đăng nhập — đúng lúc bấm "Mở khóa luận giải chuyên sâu" (hành động thật sự
trừ Credits). Rút Nhanh và Thư viện 78 lá đã ẩn danh sẵn từ trước, không cần
đổi gì.

## Decisions Needed From You
> [!IMPORTANT]
> Không còn quyết định treo — 2 điểm mấu chốt đã chốt qua AskUserQuestion
> trước khi viết plan này:
> - Rate-limit ẩn danh cho Trải Bài Sâu: **theo IP, cùng ngưỡng Rút Nhanh**
>   (3/ngày/IP) — không dùng session ẩn danh kiểu Supabase anonymous auth.
> - Không lưu gì thêm cho user ẩn danh trước khi đăng nhập — vẫn chỉ dùng
>   sessionStorage tạm thời đã có sẵn (từ phiên trước, xem
>   `UnsavedDeepSessionModal`).

## Approach
Đây KHÔNG phải bật một cờ đơn giản — đây là đảo ngược có chủ đích một quyết
định bảo mật/chi phí đã ghi nhận và test thật ngày 2026-08-27
(`Research/plan/08-timeline.md` Giai đoạn 8, `06-bao-mat-kiem-duyet-phap-ly.md
§2.2`): Trải Bài Sâu bị buộc đăng nhập chính vì bước xáo bài gọi AI kiểm
duyệt thật (Gemini triage câu hỏi) trên MỌI lần thử, kể cả trước khi rút bài —
khác hẳn Rút Nhanh (chỉ đọc DB tĩnh, chi phí biên = 0). Cách xử lý: áp đúng
pattern ẩn danh-theo-IP mà Rút Nhanh (`/api/reading`) đã dùng, vào
`/api/reading/deep/shuffle`. Điểm phức tạp thật sự là token rút bài
(`signDrawToken`) nhúng cứng `userId` để `/personal` (bước trừ Credits) chặn
dùng token của người khác — token ký lúc ẩn danh phải cho phép "nhận" bởi
chính user đó SAU KHI họ đăng nhập, mà không phải rút bài lại (tốn thêm 1 lượt
kiểm duyệt AI vô ích và mất đúng 3 lá họ đã chọn).

**Considered và loại bỏ**
- *Session ẩn danh kiểu Supabase anonymous auth* — cho id ổn định hơn IP thuần,
  nhưng cần thêm hạ tầng mới (cookie, tương thích `requireUser()` ở các route
  khác) cho lợi ích không lớn hơn nhiều so với theo IP; user đã chọn theo IP.
- *Không rate-limit ẩn danh gì cả* — chấp nhận rủi ro lạm dụng AI kiểm duyệt
  thật, bị loại vì có chi phí biến đổi thật (khác Rút Nhanh).
- *Bắt rút bài lại sau khi đăng nhập (không "nhận" token cũ)* — đơn giản hơn
  (không đổi ownership check) nhưng phá trải nghiệm: user mất đúng 3 lá đã
  chọn + tốn thêm 1 lượt kiểm duyệt AI + rate-limit ẩn danh của họ, chỉ vì họ
  quyết định đăng nhập ngay sau khi xem xong Lớp Nền. Đây chính là điểm khác
  biệt so với Rút Nhanh (không có khái niệm "nhận lại" vì Rút Nhanh không có
  bước trả phí tiếp theo).

## Proposed Changes

### `src/lib/reading-token.ts`
#### [MODIFY]
- `DrawTokenPayload.userId`: `string` → `string | null`. `null` = token được
  ký lúc ẩn danh (chưa đăng nhập tại thời điểm `/shuffle`).
- `signDrawToken` nhận `userId: string | null` qua `Omit<..., "exp" |
  "readingId">` — không đổi chữ ký hàm, chỉ đổi kiểu field.
- **Consumers ảnh hưởng**: `shuffle/route.ts`, `resume/route.ts` (tiếp tục
  luôn truyền `user.id` thật — resume vẫn bắt buộc đăng nhập, xem dưới),
  `reveal/route.ts` (đọc `payload.cards`/`payload.topic`, không đọc
  `userId` — không đổi), `personal/route.ts` (đọc + so khớp `userId` — xem
  mục riêng).

### `src/app/api/reading/deep/shuffle/route.ts`
#### [MODIFY]
- Bỏ khối chặn cứng:
  ```ts
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  ```
  Thay bằng `const user = await requireUser();` (không early-return).
- Rate-limit key + ngưỡng, theo đúng pattern đã có ở `src/app/api/reading/route.ts`:
  ```ts
  const rateLimitKey = user
    ? `reading-deep-shuffle:user:${user.id}`
    : `reading-deep-shuffle:ip:${getClientIp(request)}`;
  const [rateLimitWindow, rateLimitMax] = user
    ? [3600, process.env.NODE_ENV === "development" ? 100 : 30]
    : [86400, 3];
  ```
  (giữ nguyên ngưỡng đã đăng nhập hiện có; thêm nhánh ẩn danh).
- Thêm import `getClientIp` từ `@/lib/rate-limit` (đã import `checkRateLimit`
  ở đó rồi).
- `signDrawToken({ userId: user?.id ?? null, ... })`.
- **Không đổi**: thứ tự gọi `triageQuestion` song song với auth/rate-limit
  (đã tối ưu độ trễ từ trước) — giữ nguyên, chỉ bỏ điều kiện chặn.

### `src/app/api/reading/deep/personal/route.ts`
#### [MODIFY]
- Đổi check sở hữu token, dòng ~37-40:
  ```ts
  // Trước:
  if (payload.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // Sau:
  if (payload.userId && payload.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  ```
  Ý nghĩa: token ký lúc ẩn danh (`userId === null`) được phép "nhận" bởi bất
  kỳ user nào đăng nhập gọi `/personal` với đúng chuỗi token đó (token tự nó
  đã là bí mật ký HMAC — không đoán được, không rò rỉ chéo user). Token ký
  lúc ĐÃ đăng nhập vẫn bị khoá cứng vào đúng `userId` đó như cũ.
- Không đổi gì khác trong route này — `requireUser()` + `debit_reading` vẫn
  bắt buộc đăng nhập thật để trừ Credits, đúng yêu cầu.

### `src/app/api/reading/deep/resume/route.ts`
#### [KHÔNG ĐỔI]
- Vẫn giữ `requireUser()` bắt buộc. Route này chỉ có thể tới được sau khi đã
  thử "Mở khóa luận giải" (tạo ra trạng thái `analysis` bị gián đoạn) hoặc
  token hết hạn hẳn (`sessionDead`) — cả hai đều đã đi qua/đang đi tới bước
  cần đăng nhập, nên không cần nới ở đây. Ghi lại lý do bằng comment ngắn nếu
  cần khi đọc lại.

### `src/screens/DeepReadScreen.tsx`
#### [MODIFY]
- `handleShuffle` (~dòng 409-413): bỏ nhánh `res.status === 401` (shuffle
  không còn trả 401 vì thiếu đăng nhập nữa) — rơi xuống nhánh lỗi chung hiện
  có (`translateReadingError`). Nếu `requireUser()` throw lỗi thật không
  liên quan tới thiếu đăng nhập, nó không bao giờ trả 401 theo cách cố ý —
  nhánh chung xử lý đủ.
- `handleUnlockDeepAnalysis`, nhánh `res.status === 401` (~dòng 574-576):
  hiện chỉ `setErrorMessage("Phiên đăng nhập đã hết...")`. Đổi thành gọi
  thêm `onOpenTopUp()` (cùng hàm đã dùng cho nhánh 402) — với user CHƯA từng
  đăng nhập, `onOpenTopUp` ở cả 2 trang cha đã tự động mở đúng AuthModal
  (xem `doc-sau/page.tsx`/`page.tsx`: `if (!user.isLoggedIn) setIsAuthOpen
  (true)`), nên chủ động bật modal thay vì chỉ hiện chữ chờ user tự bấm nút
  Đăng Nhập ở Header. Đổi câu chữ cho đúng ngữ cảnh "chưa từng đăng nhập"
  thay vì ngụ ý "phiên đã hết":
  `"Bạn cần đăng nhập để mở khóa luận giải chuyên sâu. 3 lá bạn đã rút vẫn
  còn nguyên."`
- **Không cần** thêm prop `isLoggedIn` mới: nhánh `credits < 2` hiện có
  (đầu `handleUnlockDeepAnalysis`) đã là lối chặn THỰC TẾ cho đa số user ẩn
  danh (`credits` luôn là `0` khi chưa đăng nhập, theo cách 2 trang cha
  truyền `credits={user.credits}` từ `useAuthUser()`), và đã gọi đúng
  `onOpenTopUp()` → mở đúng AuthModal. Nhánh 401 ở trên chỉ là phòng vệ cho
  trường hợp hiếm (state credits hiển thị sai/cũ).

### Tài liệu spec (giữ tài liệu khỏi nói sai so với code)
#### [MODIFY] `Research/plan/06-bao-mat-kiem-duyet-phap-ly.md` §2.2
- Đổi dòng bảng hạn mức:
  ```diff
  - | `POST /api/reading` (deep) | — (bắt buộc login) | 30/giờ (credits đã là giới hạn tự nhiên) |
  + | `POST /api/reading` (deep) | 3/ngày/IP | 30/giờ (credits đã là giới hạn tự nhiên) |
  ```
  Kèm 1 dòng chú thích ngắn ngay dưới bảng: đổi ngày 2026-09-09, lý do (cho
  ẩn danh trải nghiệm free tới Lớp Nền, xem `trai-nghiem-an-danh`).

#### [MODIFY] `Research/plan/08-timeline.md` Giai đoạn 8
- Dòng 215-217 hiện ghi "Đọc sâu không đăng nhập → 401, không gọi AI (test
  thật 2026-08-27)" — đây là quyết định CŨ, giờ sai. Thêm 1 dòng note ngay
  dưới (không xoá dòng cũ — giữ lịch sử quyết định), kiểu:
  > ⚠️ 2026-09-09: quyết định trên đã đảo ngược có chủ đích — xem
  > `.claude/brain/trai-nghiem-an-danh/`. Đọc sâu tới Lớp Nền giờ ẩn danh
  > được, rate-limit theo IP; chỉ bước trừ Credits mới bắt buộc đăng nhập.

## Accessibility Plan
- Không thêm UI mới (không thêm element, không thêm modal) — chỉ đổi hành vi
  điều kiện + câu chữ thông báo lỗi đã có sẵn cấu trúc (`role`/live region
  hiện tại của banner lỗi không đổi).
- Câu thông báo mới ở nhánh 401 vẫn qua đúng `setErrorMessage`, render trong
  banner lỗi hiện có — không cần audit lại contrast/semantics (đã đạt trước
  đó, style tái dùng nguyên).

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `DrawTokenPayload.userId: string \| null` | `shuffle/route.ts` (ghi), `resume/route.ts` (ghi, luôn giá trị thật), `personal/route.ts` (đọc + so khớp) | Thấp — TypeScript sẽ tự bắt nếu chỗ nào đọc `payload.userId` như `string` không null-check; `reveal/route.ts` không đọc field này nên không ảnh hưởng |
| `shuffle/route.ts` bỏ 401 | `DeepReadScreen.tsx` (client duy nhất gọi route này) | Thấp — chỉ 1 consumer, đã sửa trong cùng plan |
| `personal/route.ts` ownership check nới lỏng | Không đổi API shape, chỉ đổi điều kiện — không ảnh hưởng consumer khác ngoài chính route |

## Verification Plan
### Automated
```
lint      : npm run lint (lưu ý lỗi tooling có sẵn của repo, không liên quan)
typecheck : npx tsc --noEmit
test      : n/a
build     : npm run build (khuyến nghị chạy 1 lần cho thay đổi đụng API route)
```

### Manual — kịch bản bắt buộc test thật (không chỉ đọc code)
1. **Ẩn danh, đủ hạn mức**: mở `/doc-sau` KHÔNG đăng nhập → nhập câu hỏi →
   xáo bài (thành công, không bị 401) → lật đủ 3 lá → thấy Lớp Nền đầy đủ +
   nút "Mở khóa luận giải chuyên sâu".
2. **Ẩn danh, bấm mở khóa** → modal đăng nhập bật lên NGAY (không chỉ hiện
   chữ) → đăng nhập bằng tài khoản thật (0 hoặc ≥2 Credits) → xác nhận: KHÔNG
   phải rút bài lại, cùng 3 lá cũ vẫn còn, bấm "Mở khóa" lại chạy tiếp đúng
   (nếu đủ Credits → luận giải chạy; nếu 0 Credits → đúng modal nạp Credits).
3. **Rate-limit ẩn danh**: gọi `/api/reading/deep/shuffle` ẩn danh 4 lần liên
   tiếp cùng IP trong test → lần thứ 4 nhận `429`.
4. **Không phá đường cũ đã đăng nhập sẵn**: user đã đăng nhập từ đầu, xáo bài
   + mở khóa — hành vi y hệt trước khi đổi (không đổi ownership check cho
   trường hợp `userId` khớp).
5. Dọn sạch mọi tài khoản test thật tạo ra trong lúc verify (theo quy ước đã
   có ở CLAUDE.md/memory — tạo qua UI signup thật, xoá đúng thứ tự FK, xác
   nhận `count(*) = 0`).

## Out of Scope
- Session ẩn danh kiểu Supabase anonymous auth (đã cân nhắc, loại bỏ ở trên).
- Đổi hành vi lưu lịch sử đọc (readings) cho user ẩn danh — vẫn không lưu DB.
- `/api/reading/deep/resume` — giữ nguyên yêu cầu đăng nhập.
- Rút Nhanh, Thư viện 78 lá, Tài khoản, Nạp Credits — không đụng, đã đúng
  hành vi mong muốn từ trước.
