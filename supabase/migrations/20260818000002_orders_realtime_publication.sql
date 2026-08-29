-- Bật Supabase Realtime cho bảng orders — cần cho QrPanel.tsx subscribe
-- postgres_changes (UPDATE) để tự chuyển màn khi đơn được thanh toán
-- (05-thanh-toan-credits.md §5). Đã áp dụng trên production dưới tên
-- "orders_realtime_publication" nhưng chưa có trong repo local — thêm lại
-- cho khớp, để build DB mới từ đầu (CI/disaster recovery) có đúng hành vi.
alter publication supabase_realtime add table orders;
