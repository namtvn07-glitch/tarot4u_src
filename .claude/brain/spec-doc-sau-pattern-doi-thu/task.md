# Task: Ghi spec 2 pattern từ boitarot.com.vn vào thiết kế Đọc sâu (4c)

> Created: 2026-08-16 · Slug: `spec-doc-sau-pattern-doi-thu`
> Thay thế hướng đi cũ ở `.claude/brain/cap-nhat-doi-thu-boitarot-comvn/`
> (chưa execute — user đổi ý: không cảnh báo "đừng copy" mà muốn áp dụng
> có điều chỉnh).

## Goal
`Research/plan/01-san-pham-pham-vi.md` và `03-kien-truc-ai.md` mô tả rõ 2
pattern quan sát được từ boitarot.com.vn — (a) ép cả 3 lá cùng hướng
xuôi/ngược cho câu hỏi tình cảm nhạy cảm, (b) giao diện trải bài rộng cho
user tự bấm chọn 3 lá — như **quyết định thiết kế chính thức** cho Giai
đoạn 4c (Đọc sâu, 3 lá, trả phí), có điều chỉnh để không phá nguyên tắc RNG
server-side/chống gian lận đã chốt. Đây là cập nhật tài liệu (spec), **chưa
viết code** — 4c chưa tới lượt build (phụ thuộc auth Giai đoạn 5 + AI
streaming chưa có).

## Scope
**In**:
- `Research/plan/01-san-pham-pham-vi.md` §3 (Trải bài) + §5.2 (luồng Trải
  bài sâu) — thêm mô tả UX giao diện tự chọn + bước phân loại ép hướng vào
  flow.
- `Research/plan/03-kien-truc-ai.md` §7 (RNG rút bài) — thêm 2 subsection
  mới: §7.1 ép hướng theo phân loại câu hỏi, §7.2 cơ chế "tự chọn lá" an
  toàn (không lộ RNG qua DOM).
- Nêu rõ trong cả 2 file: đây là **điều chỉnh**, không phải copy nguyên —
  khác biệt cụ thể so với cách đối thủ làm, và vì sao.

**Out**:
- Không viết code (`src/`) — 4c chưa bắt đầu build.
- Không sửa `Research/doi-thu-canh-tranh.md` lần này (bao gồm correction
  "có thu phí online" từ lượt plan trước) — để riêng, chưa quyết định.
- Không tạo bảng DB mới hay endpoint thật — chỉ mô tả thiết kế dự kiến, các
  quyết định cụ thể (lưu tạm bằng token ký hay bảng Postgres) chốt khi thật
  sự build 4c, không chốt cứng ở bước spec này.

## Assumptions
- 2 pattern áp dụng **chỉ cho luồng 3 lá trả phí (Đọc sâu)**, không đụng
  luồng 1 lá free hiện có (đã xác nhận qua AskUserQuestion).
- "Ép hướng" không dùng danh sách câu hỏi cứng như đối thủ (không khả thi
  với input tự do) — tận dụng bước kiểm duyệt Haiku 4.5 đã có sẵn ở
  `03-kien-truc-ai.md §5.3`, mở rộng structured output thêm 1 field, không
  thêm lượt gọi AI riêng.
- "Tự chọn lá" giữ lại **cảm giác** trải bài rộng cho user bấm, nhưng KHÔNG
  cần cơ chế nhân bản 40–60 lá như đối thủ — vì thiết kế an toàn của Ventus
  không gắn danh tính lá thật vào client trước khi "mở" (khác nguyên nhân
  đối thủ phải nhân bản: che số lượng 78 lá thật khi identity đã lộ sẵn
  trong DOM).

## Checklist
- [x] Plan approved
- [x] `01-san-pham-pham-vi.md` §3 — thêm mô tả UX tự chọn
- [x] `01-san-pham-pham-vi.md` §5.2 — cập nhật luồng
- [x] `03-kien-truc-ai.md` §7.1 — ép hướng theo phân loại câu hỏi
- [x] `03-kien-truc-ai.md` §7.2 — cơ chế tự chọn lá an toàn
- [x] Đọc lại 2 file, kiểm tra không mâu thuẫn với phần RNG/kiểm duyệt gốc
      đã có
- [x] `08-timeline.md` — chi tiết hoá checklist 4c + cập nhật ước tính ngày
      (theo yêu cầu follow-up của user)
- [x] `03-kien-truc-ai.md` §7.3 — quy tắc dùng tạm ảnh đối thủ cho §7.2
      (theo yêu cầu follow-up thứ 2 của user)
- [x] `public/_placeholder-doi-thu/` — copy 3 ảnh đã chọn lọc + gitignore
- [x] `.claude/rules/project.md` — pointer 2-4 dòng vào Learned Patterns
- [x] `08-timeline.md` Giai đoạn 10 — gate 🔴 chặn deploy tới khi thay ảnh

## Progress Log
- 2026-08-16: plan viết, user duyệt ("ok")
- 2026-08-16: Execute xong — 4 edit áp dụng đúng như implementation-plan.md
  (2 ở `01-san-pham-pham-vi.md` §3/§5.2, 2 subsection mới §7.1/§7.2 ở
  `03-kien-truc-ai.md`). Đọc lại cả 2 file sau khi sửa: §7.1/§7.2 không mâu
  thuẫn với nguyên tắc gốc đầu §7 (RNG server-side, `crypto.randomInt`,
  không tin input client) — `orientationMode` và token reveal đều bắt nguồn
  server-side, đúng nguyên tắc. `git diff` xác nhận đúng 2 file, không đụng
  gì khác ngoài phạm vi.
- 2026-08-16: Follow-up từ user ("Cập nhật lại task và timeline chi tiết")
  — chi tiết hoá checklist 4c trong `08-timeline.md` (9 dòng con thay 6,
  gồm cả `orientation_mode`, `drawCards` mở rộng, UI tự chọn lá, token ký,
  endpoint reveal); đổi tên mục 4c thành "Đọc sâu — 3 lá + Lớp Cá nhân";
  +1 ngày ước tính (2–3 → 3–4), cộng dồn vào tổng Giai đoạn 4 (8–10 → 9–11)
  và tổng dự án (33–42 → 34–43 ngày) — đã đối chiếu lại số cộng bằng tay,
  khớp. Thêm 1 dòng vào bảng "hạng mục hay ước lượng thiếu" (§1) và 1
  phương án cắt phạm vi mới (§5, #6: bỏ giao diện tự chọn lá) để tài liệu
  nhất quán với các phần khác cùng file.
- 2026-08-16: Follow-up thứ 2 từ user ("Thêm rule thiết kế UI/UX theo cách
  làm của đối thủ, có thể dùng tạm ảnh của nó, sau thay sau") — kiểm tra
  mirror `src_template`: KHÔNG có ảnh mặt 78 lá bài thật (thư mục ảnh plugin
  không được crawl), chỉ có `back.jpg` + vài ảnh thương hiệu/blog. Hỏi lại
  user 2 câu (phạm vi ảnh nào, cách xử lý rủi ro bản quyền) trước khi động
  file — cả 2 đều là quyết định có blast radius thật (file ảnh vào repo sản
  phẩm), không đoán. User chọn: dùng cả ảnh thương hiệu/trang trí khác +
  chấp nhận rủi ro có TODO rõ ràng.
  Lần copy đầu bị **auto-mode classifier chặn** (hợp lý — copy asset đối thủ
  vào `public/`, thư mục sẽ deploy) — dừng lại, giải thích cho user thay vì
  tìm cách lách. User xác nhận lại + loại trừ rõ logo/ảnh chân dung reader →
  copy thành công lần 2. Đã tự loại trừ (không đợi user liệt kê): 3 file
  logo/wordmark (`boitarot-*.png`, `favicon-boitarot-*.png`) và 3 ảnh chân
  dung reader (`kim-ngan-*`, `ngoc-lan.jpg`, `tuong-vy.jpg`) — rủi ro thương
  hiệu/quyền hình ảnh cao hơn hẳn 2 pattern nền + 1 ảnh mặt sau lá bài.
  Thực hiện: copy 3 file vào `public/_placeholder-doi-thu/` → thêm
  `.gitignore` NGAY sau đó, xác nhận bằng `git status`
  (rỗng) + `git check-ignore -v` (khớp) trước khi coi là an toàn → thêm
  §7.3 vào `03-kien-truc-ai.md` (danh sách được/không được dùng + lý do) →
  pointer 4 dòng vào `.claude/rules/project.md` § Learned Patterns (load
  mỗi session, không phải `docs/learned/` — README của thư mục đó loại trừ
  rõ "a one-off decision specific to a single task") → gate 🔴 chặn ở Giai
  đoạn 10 Deploy trong `08-timeline.md` + 1 dòng tham chiếu trong checklist
  4c cho dễ thấy lúc build.

## Open Questions
- Cách lưu tạm 3 lá đã rút chờ "mở" từng vị trí: token ký ngắn hạn
  (stateless) hay bảng Postgres tạm (`pending_draws` + TTL)? → Khuyến nghị
  **token ký** (đơn giản hơn, không cần bảng + cron dọn dẹp mới). Chốt thật
  khi build 4c, spec lần này chỉ ghi cả 2 lựa chọn.
- Field phân loại "ép hướng" đặt tên gì trong structured output Haiku
  (`orientation_mode`?) — đặt tên tạm trong spec, có thể đổi khi build.
