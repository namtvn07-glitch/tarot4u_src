# Daily Reading (Trải bài 1 lá) — vận hành & những điều không hiển nhiên

Kế hoạch: `.claude/brain/trai-bai-4-loai-giai-doan-1/`. Thiết kế gốc: `design/PROMT XEMBAITAROT.VN (phần 1, 2).md`.

## Luồng
- Nội dung **sinh sẵn** (468 bản = 78 lá × 2 chiều × 3 biến thể) nằm trong bảng `daily_content`;
  runtime KHÔNG gọi AI. Chỉ lá có bản `status='approved'` mới được rút.
- `POST /api/reading/daily {drawId}` → RPC `claim_daily_draw` (atomic: free / paid / replay) → chọn lá
  "bộ bài riêng" (`src/lib/daily-draw.ts`) → ghi `readings` (`tier='daily'`, `result` JSON).
  Lỗi sau khi claim → `release_daily_draw` (nhả lượt free / hoàn credit).
- Ngày tính theo `Asia/Ho_Chi_Minh` ở phía DB. Trần 5 lượt/ngày, lượt free đầu tiên, lượt sau 1 credit
  (hằng số ở `src/lib/spreads.ts`).

## Sinh / duyệt nội dung
```bash
node scripts/daily-content/print-brief.mts --list            # 26 chunk (3 lá/chunk)
NODE_NO_WARNINGS=1 node scripts/daily-content/print-brief.mts 1   # bản giao việc cho agent
NODE_NO_WARNINGS=1 node scripts/daily-content/merge.mts --check <file>   # tự kiểm một chunk
NODE_NO_WARNINGS=1 node scripts/daily-content/merge.mts --strict          # gộp + chuẩn hoá điểm
node scripts/seedDailyContent.js            # nạp 'draft'   (API chưa dùng)
node scripts/seedDailyContent.js --approve  # nạp 'approved'
```
- Đổi prompt Daily (`scripts/daily-content/prompt-body.ts`) → phải sinh lại TOÀN BỘ để giữ giọng nhất quán;
  tăng `version` trong dòng import để bản mới thắng bản cũ.
- Lint tự động bắt: schema, 250–350 từ, ≤3 câu/đoạn, từ cấm, markdown, điểm 1–10, trùng headline/memorable.
  Lint KHÔNG bắt: sự lặp công thức. Bản hiện tại có 357/468 `insight` mở đầu "Có thể bạn…".
- Điểm theo lĩnh vực được chuẩn hoá về **trung vị của 3 biến thể** cho từng (lá, chiều).

## Đừng làm
- Đừng chọn lá bằng random trơn: người dùng quay lại mỗi ngày sẽ gặp lại cùng một đoạn chữ sau ~15 ngày.
- Đừng `drop function` `claim_daily_draw`/`release_daily_draw`/`debit_reading` — xem bài học 2026-09-20.
- Đừng để model viết disclaimer: là hằng số ở `src/lib/disclaimers.ts`.

## Tối ưu tải/lưu trữ (2026-10-05)
- **Lưu trữ mỗi lượt** (đo thực tế): Daily ~3,3 KB trước tối ưu, trong đó ~2,9 KB là bản sao. Nay lượt MỚI
  không ghi `personal_body` (bản sao chữ của `result`), còn lại `result` ~2,2 KB. Chưa làm: lưu tham chiếu
  `(variant, version)` thay vì chép nội dung (tiết kiệm thêm ~70%; cần sửa cách hiển thị lịch sử và
  KHÔNG bao giờ xoá phiên bản nội dung cũ).
- **Danh sách lịch sử nhẹ**: `HISTORY_LIST_SELECT` (src/lib/reading-history.ts) không lấy `result`; ba trường
  rút gọn (`deep_summary`, `daily_summary`, `daily_headline`) lấy bằng JSON path ở DB; giới hạn 200 dòng;
  `ReadingDetailModal` tự tải `personal_body, result` đúng lượt được mở. Bản ghi CŨ vẫn mang `personal_body`
  trong danh sách (chưa có cột preview riêng).
- **Khách chưa có phiên không gọi `GET /api/reading/daily`** (trạng thái dựng ở client bằng
  `guestState()`); ngày hiển thị tính ở client bằng `vietnamToday()` (src/lib/daily-day.ts).
- **Cache chỉ mục lá đã duyệt** trong bộ nhớ instance (5 phút ở production, 5 giây ở dev): duyệt/gỡ nội dung
  có thể mất tới 5 phút mới có hiệu lực. Gỡ một bản đang nằm trong cache → lần rút kế tiếp tự xoá cache.
- **Truy vấn lịch sử khi rút** dùng `daily_date is not null` + order theo `daily_date` để khớp index một phần
  `readings_user_daily`, và chỉ lấy 3 trường qua JSON path.
- supabase-js chỉ suy luận kiểu từ chuỗi `select` LITERAL: chuỗi nối (`+`) thành `GenericStringError[]`, nên
  danh sách đi qua `rowsToHistoryItems()` (ép kiểu ở một chỗ).
- Lỗi có SẴN (không do đợt này): Header của người ĐÃ ĐĂNG NHẬP tràn ngang ~9px ở 768px (nút "Thoát") trên mọi trang.
