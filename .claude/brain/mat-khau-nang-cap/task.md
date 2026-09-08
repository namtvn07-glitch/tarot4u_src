# Task: Đổi mật khẩu + Quên mật khẩu + Chuẩn mật khẩu NIST

> Created: 2026-09-08 · Slug: `mat-khau-nang-cap`
> Thay thế phần mật khẩu của [`../auth-zalo-hoan-lai/`](../auth-zalo-hoan-lai/task.md)
> (Zalo hoãn lại).

## Goal
Người dùng tự quản được mật khẩu của mình từ đầu đến cuối — đặt mật khẩu mạnh lúc
đăng ký, đổi mật khẩu trong `/tai-khoan`, và lấy lại được tài khoản qua email khi
quên — với một bộ quy tắc mật khẩu duy nhất, bám NIST SP 800-63B-4, áp dụng ở **cả
ba** lối vào.

## Scope
**In**:
- Bộ quy tắc mật khẩu dùng chung (`src/lib/password.ts`): độ dài, chặn mật khẩu đã lộ
  (HaveIBeenPwned k-anonymity), chặn mật khẩu phổ biến/theo ngữ cảnh, **không** ép
  quy tắc thành phần (hoa/thường/số/ký tự đặc biệt).
- UI phản hồi độ mạnh: checklist yêu cầu + nút hiện/ẩn, dùng lại ở 3 nơi.
- Đổi mật khẩu: `GET/POST /api/account/password` + form trong `/tai-khoan`, chỉ hiện
  với tài khoản **thật sự có mật khẩu**.
- Quên mật khẩu: sửa `AuthModal` (bỏ `alert()`), thêm trang `/dat-lai-mat-khau`, xử lý
  link hỏng/hết hạn.
- Áp quy tắc mới cho **đăng ký** (`AuthModal` tab Đăng ký) — hiện chỉ `min 6`.
- Cấu hình Supabase Auth cho khớp (việc bạn bấm trên Dashboard, tôi ghi rõ từng bước).

**Out**:
- Đăng nhập Zalo (task riêng, đã hoãn).
- Đặt mật khẩu lần đầu cho tài khoản Google/OAuth.
- MFA/2FA, passkey.
- Ép đăng xuất mọi thiết bị khác sau khi đổi mật khẩu.
- Đổi email, đổi tên hiển thị.
- Dọn code chết `src/components/auth/LoginForm.tsx` + `PasswordAuthForm.tsx` (không
  trang nào import).
- Refactor `AuthModal.tsx` sang design token (file dùng hex cứng toàn bộ; giữ nguyên
  quy ước local).

## Assumptions
- **Mật khẩu cũ của user hiện tại không bị ảnh hưởng** — quy tắc mới chỉ áp khi *đặt*
  mật khẩu (đăng ký / đổi / đặt lại), không áp lúc đăng nhập. Không ép ai đổi mật khẩu
  (NIST-4: cấm ép xoay vòng định kỳ).
- Supabase Auth dùng **bcrypt**, cắt sau **72 byte** → chặn cứng ở 72 byte thay vì cho
  nhập dài rồi âm thầm bị cắt.
- "Leaked password protection" của Supabase **cần gói Pro**. Vì vậy việc chặn mật khẩu
  đã lộ do **code của ta** làm (HIBP range API, miễn phí, không cần key); toggle của
  Supabase chỉ là lớp phòng thủ thứ hai nếu project đang ở Pro.
  → Advisor hiện tại đang cảnh báo `auth_leaked_password_protection` là **disabled**.
- Luồng recovery đi qua `/auth/callback` sẵn có: `createBrowserClient` (@supabase/ssr)
  lưu PKCE verifier trong **cookie**, nên route handler phía server đổi được code —
  đây chính là cơ chế magic link + Google đang chạy thật.
- `apply_migration` có thể bị permission classifier chặn (đã xảy ra ở Giai đoạn 6).
  Nếu bị: bạn chạy tay trên Dashboard, rồi verify lại bằng `information_schema` —
  "Success" chỉ chứng minh câu lệnh cuối (learned 2026-08-19).

## Checklist
- [x] Plan approved (chốt độ dài tối thiểu)
- [x] Migration: `current_user_has_password()`
- [x] `src/lib/password.ts` — quy tắc + HIBP + danh sách chặn
- [x] `PasswordField` + `PasswordRequirements` (component dùng chung)
- [x] API `GET/POST /api/account/password`
- [x] `ChangePasswordForm` + mục "Bảo mật" trong `AccountScreen`
- [x] Trang `/dat-lai-mat-khau` + sửa nhánh lỗi của `/auth/callback`
- [x] `AuthModal`: bỏ `alert()`, gửi mail reset đúng cách, áp quy tắc cho tab Đăng ký
- [ ] **Cấu hình Supabase Dashboard** (min length 8 / no required characters /
      leaked protection nếu Pro) — việc của người dùng, chưa làm
- [x] States: loading / empty / error / success ở cả 3 form
- [ ] Responsive: 375 / 768 / 1280 — **chưa xem được** (phiên này không có công cụ
      trình duyệt)
- [ ] Accessibility pass thủ công (tab order, focus nhìn thấy) — **chưa làm được**,
      phần code đã có label/aria-live/focus + target ≥44px
- [x] Gates: typecheck ✅ / build ✅ / lint n/a (script `next lint` hỏng sẵn từ trước,
      repo không có `eslint.config.*`)
- [x] Tài khoản test thật đã dọn sạch (`users_left = 0`, `profiles_left = 0`)
- [ ] Learnings extracted (`/finish`)

## Progress Log
> `/execute` ghi một dòng mỗi checkpoint.

- 2026-09-08 migration xong — `current_user_has_password()` đã áp qua
  `apply_migration` (KHÔNG bị classifier chặn), verify `routine_privileges`:
  chỉ `authenticated` + `service_role` + owner, không có `PUBLIC`/`anon`.
- 2026-09-08 lõi xong — `src/lib/password.ts` + `PasswordField` +
  `PasswordRequirements`.
- 2026-09-08 server xong — `GET/POST /api/account/password` (verifier client, không
  dùng admin API).
- 2026-09-08 UI xong — `ChangePasswordForm` + mục "Bảo mật", trang
  `/dat-lai-mat-khau`, `AuthModal` (bỏ `alert()`, quy tắc cho tab Đăng ký),
  `auth/callback` nhánh lỗi, `robots.ts`.
- 2026-09-08 verify — typecheck ✅, build ✅; test luật mật khẩu + HIBP thật
  (`Tr0ub4dor&3` → đã lộ; chuỗi ngẫu nhiên → sạch); tài khoản test thật chạy đủ
  vòng đổi mật khẩu trên Supabase production rồi xoá sạch. Trình duyệt: không có
  công cụ trong phiên này → gate visual/a11y thủ công chưa chạy.
- 2026-09-08 sửa theo phản hồi: form đổi mật khẩu **không** phơi sẵn trong trang nữa
  — mục "Bảo mật" chỉ còn nút "Đổi mật khẩu", form nằm trong modal (`role="dialog"`,
  Esc đóng, Tab bị giữ trong modal, focus trả về nút khi đóng). Focus trap được tách
  từ `CreditTopUpModal` ra `src/lib/useModalA11y.ts` để hai modal dùng chung một bản.
- 2026-09-08 sửa theo phản hồi ảnh chụp màn hình #1 (nhầm chẩn đoán ban đầu):
  1. Modal đổi mật khẩu bị `AmbientSoundPlayer` (nút nhạc nền góc phải dưới) đè —
     root cause: widget đó `z-50` và mount SAU `{children}` trong `layout.tsx`, cùng
     z-index với MỌI modal thì phần tử sau trong DOM thắng. Sửa 1 dòng: hạ
     `AmbientSoundPlayer` xuống `z-40`. **Đây KHÔNG phải bug thật user báo** — xem
     mục dưới.
  2. Checklist yêu cầu mật khẩu: bỏ chữ "— đạt/chưa đạt" hiển thị (còn `sr-only` cho
     screen reader); thiết kế lại theo mẫu Stripe/GitHub — yêu cầu CHƯA đạt dùng màu
     trung tính (không phải đỏ, tránh dí lỗi ngay từ ký tự gõ đầu), chỉ đạt mới
     chuyển xanh; bọc trong khung card riêng biệt thay vì trôi tự do giữa trang.
- 2026-09-08 sửa theo phản hồi ảnh chụp màn hình #2 — bug THẬT: overlay
  `ChangePasswordSection` dùng `flex items-center justify-center` CÙNG LÚC với
  `overflow-y-auto`. Đây là lỗi CSS kinh điển: khi hộp thoại cao hơn viewport,
  trình duyệt căn giữa bằng cách đẩy phần tràn ra đều 2 phía, nhưng vùng cuộn chỉ
  tính từ điểm bắt đầu flex line — phần tràn XUỐNG DƯỚI (ô "Nhập lại mật khẩu mới"
  + 2 nút Huỷ/Đổi) không cách nào cuộn tới, form bị cắt cụt trước cả Footer. Đã bỏ
  flex centering, đổi sang `mx-auto` (ngang) + margin cố định (dọc) — nội dung cao
  hơn viewport giờ cuộn được tới mọi chỗ theo luồng tài liệu bình thường, không thể
  kẹt kiểu này nữa. **Lưu ý cho sau**: `CreditTopUpModal.tsx` dùng đúng pattern lỗi
  này (`flex items-center justify-center ... overflow-y-auto`) — chưa sửa vì ngoài
  phạm vi task này, nhưng cùng một lớp bug, sẽ lộ khi nội dung modal đó đủ cao.
- 2026-09-08 sửa theo phản hồi ảnh chụp màn hình #3 — vẫn thấy Footer sát ngay dưới
  modal sau fix #2. Không debug tiếp bằng suy luận CSS (không có browser trong phiên
  này để xác minh trực tiếp) — chuyển sang fix cấu trúc triệt để: modal giờ
  `createPortal` thẳng vào `document.body` thay vì render lồng sâu trong
  `AccountScreen` > `<section>` > `ChangePasswordSection`. Lý do: `<body>`
  (`layout.tsx`) có `relative overflow-x-hidden` — bất kỳ tổ tiên nào (kể cả tương
  lai) lỡ có `transform`/`filter`/`contain` đều biến `position: fixed` từ "theo
  viewport" thành "theo tổ tiên đó", đúng lớp bug hay gặp nhất với modal lồng sâu.
  Portal loại bỏ khả năng này vĩnh viễn — modal không còn phụ thuộc CSS của bất kỳ
  ai render ra nó. Thêm luôn khoá cuộn `document.body` khi modal mở (thiếu từ đầu).
  **Chưa tự xác nhận bằng mắt được** (không có công cụ trình duyệt) — cần user
  hard-refresh và xác nhận lại.
- 2026-09-08 phát hiện + vá trong lúc test: danh sách chặn ban đầu chỉ so khớp
  chính xác nên `Matkhau123456` / `Password123` / `p@ssw0rd!!` lọt lưới — đã thêm
  so khớp phần lõi chữ cái + dịch ngược leetspeak.

## Open Questions — đã chốt 2026-09-08
- **Độ dài tối thiểu = 8.** Thấp hơn mức NIST-4 đòi cho hệ không có MFA (15) — sai
  lệch có chủ đích, đổi lấy ma sát đăng ký thấp; bù bằng blocklist HIBP + phổ biến +
  ngữ cảnh + tuần tự (những phần này không nới). Ghi vào `docs/learned/auth.md`: có
  MFA rồi thì con số 8 mới thật sự đúng chuẩn.
- **Gói Supabase: chưa rõ** → code không phụ thuộc gói; việc bật toggle
  "Leaked password protection" (cần Pro) là bước kiểm tra ở `/finish`.
- **HIBP lỗi mạng → fail-open + log Sentry.**
