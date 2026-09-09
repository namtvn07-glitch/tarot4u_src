# Task: Trải nghiệm ẩn danh — chỉ đăng nhập khi cần Credits

> Created: 2026-09-09 · Slug: `trai-nghiem-an-danh`

## Goal
User ẩn danh (chưa đăng nhập) dùng được toàn bộ app kể cả Trải Bài Sâu tới hết
bước xem Lớp Nền miễn phí (xáo bài + lật 3 lá + đọc diễn giải nền); chỉ bị chặn
và mời đăng nhập đúng lúc bấm "Mở khóa luận giải chuyên sâu" (hành động thật sự
trừ Credits).

## Scope
**In**:
- `POST /api/reading/deep/shuffle` — bỏ chặn `requireUser()`, cho ẩn danh với
  rate-limit theo IP (khung giống Rút Nhanh: 3/ngày/IP).
- `src/lib/reading-token.ts` — `userId` trong token cho phép `null` (ẩn danh
  lúc rút bài).
- `POST /api/reading/deep/personal` — cho phép "nhận" (claim) 1 token ẩn danh
  bằng tài khoản vừa đăng nhập, thay vì chỉ khớp đúng y hệt `userId`.
- `src/screens/DeepReadScreen.tsx` — dọn nhánh xử lý `401` ở bước xáo bài (giờ
  không còn xảy ra); polish nhánh `401` ở bước mở khóa để chủ động mở modal
  đăng nhập thay vì chỉ hiện chữ.
- Cập nhật lại đúng 2 tài liệu spec đã ghi nhận quyết định cũ (`06-...md §2.2`,
  `08-timeline.md` Giai đoạn 8) — nếu không sửa, tài liệu sẽ nói sai so với
  code.

**Out**:
- Rút Nhanh — đã ẩn danh sẵn từ trước, không đụng.
- Thư viện 78 lá — đã public sẵn, không đụng.
- `/api/reading/deep/resume` (xin cấp lại token khi hết hạn giữa lúc luận
  giải) — chỉ có thể tới được nhánh này sau khi đã thử mở khóa (đã cần đăng
  nhập), nên giữ nguyên yêu cầu đăng nhập.
- Lưu lịch sử đọc (readings) cho user ẩn danh — không lưu DB, chỉ giữ tạm ở
  sessionStorage như cơ chế đã có; không thêm cơ chế lưu mới.
- Nạp Credits, Tài khoản, thanh toán — vốn dĩ luôn cần đăng nhập, không đụng.

## Assumptions
- Giới hạn ẩn danh cho Trải Bài Sâu = 3 lượt/ngày/IP, giống hệt ngưỡng đã có
  ở Rút Nhanh (`06-bao-mat-kiem-duyet-phap-ly.md §2.2`) — vì tốn AI kiểm duyệt
  thật nên không nới lỏng hơn Rút Nhanh dù Rút Nhanh tốn chi phí biên = 0.
- User đã người dùng chọn (qua AskUserQuestion): rate-limit ẩn danh theo IP
  (không cần session ẩn danh kiểu Supabase anonymous auth), và không lưu gì
  thêm ngoài sessionStorage hiện có trước khi đăng nhập.
- Token ẩn danh (`userId: null`) có thể bị "nhận" bởi BẤT KỲ tài khoản nào
  đăng nhập rồi gọi `/personal` với đúng token đó — chấp nhận được vì token
  tự nó đã là bí mật ký HMAC, không rò rỉ giữa các user, sở hữu chuỗi token
  = sở hữu chính phiên rút bài đó.

## Checklist
- [x] Plan approved
- [x] Pages / routes (`shuffle`, `personal`)
- [x] Content & real copy (thông báo lỗi mới)
- [x] States: loading / empty / error / success (401 ở bước mở khóa)
- [x] Gates green (lint n/a — lỗi tooling có sẵn; typecheck + build sạch)
- [x] Cập nhật tài liệu spec (06, 08)
- [x] Learnings extracted

## Progress Log
> `/execute` appends one line per checkpoint.

- 2026-09-09 routes done — `reading-token.ts` (userId nullable), `shuffle/route.ts`
  (bỏ chặn 401, thêm rate-limit theo IP ẩn danh), `personal/route.ts` (nới
  ownership check cho token ẩn danh)
- 2026-09-09 copy + docs done — `DeepReadScreen.tsx` (bỏ nhánh 401 chết ở
  shuffle, chủ động mở modal đăng nhập ở 401 lúc mở khóa, sửa câu 429 không
  còn nêu sai mốc thời gian), cập nhật `06-...md §2.2` + `08-timeline.md`
- 2026-09-09 verify — typecheck sạch, `npm run build` thành công. Live E2E
  đầy đủ (ẩn danh → xáo bài → đăng nhập → mở khóa cùng token) **bị chặn bởi
  quota Gemini free-tier hết thật trong ngày** (`RESOURCE_EXHAUSTED`,
  20 request/ngày/model, xác nhận qua log server, không phải lỗi code) —
  không phải vấn đề của lần sửa này. Đã xác nhận được 1 phần qua request
  trực tiếp: request ẩn danh thứ 4 trong ngày cùng IP nhận đúng `429
  rate_limited` (chứng minh nhánh rate-limit theo IP mới chạy đúng
  end-to-end). Ownership-check mới trong `personal/route.ts`
  (`payload.userId && payload.userId !== user.id`) đã soát bằng bảng chân
  trị thủ công (null → luôn qua; khác id thật → luôn chặn; đúng id → như cũ)
  thay vì chạy được E2E do quota — nên coi là xác nhận một phần, khuyến nghị
  chạy lại E2E đầy đủ khi quota Gemini reset (thường theo ngày UTC) trước khi
  release.
- Đã tạo + xoá sạch 3 tài khoản test thật trong lúc verify (`verify-anon-a`,
  `verify-anon-b`, `verify-anon2-a`) và dọn `rate_limits` test noise — xác
  nhận `count(*) = 0`.

## Open Questions
- Không còn — 2 quyết định chính đã chốt qua AskUserQuestion trước khi viết
  plan này (rate-limit theo IP; chỉ sessionStorage, không lưu thêm).
