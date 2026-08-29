-- Giai đoạn 5 — cho phép user tự xoá lượt trải bài của chính mình.
-- readings không nằm trong danh sách bảng bắt buộc giữ lại
-- (04-database-schema.md §6: chỉ orders/credit_ledger/profiles), và sản
-- phẩm yêu cầu tính năng "xoá từng lượt trải bài" (08-timeline.md GĐ5).
create policy readings_delete_own on readings
  for delete using (auth.uid() = user_id);
