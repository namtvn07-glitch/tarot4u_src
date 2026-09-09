-- Nhật ký hành động admin. Bắt buộc từ khi có admin thứ 2: mọi lượt đọc dữ
-- liệu admin đều đi qua service_role, nên bản thân database KHÔNG phân biệt
-- được người thật đứng sau — danh tính chỉ tồn tại ở tầng Next.js rồi bị vứt
-- đi ở ranh giới service-role. Đây là chỗ duy nhất ghi lại được "ai".
--
-- pgaudit không thay thế được bảng này, đúng vì lý do trên: nó cũng chỉ thấy
-- service_role.
create table admin_audit_log (
  id            bigint generated always as identity primary key,
  admin_user_id uuid not null references auth.users(id),
  action        text not null,
  meta          jsonb,
  created_at    timestamptz not null default now()
);
create index admin_audit_log_created on admin_audit_log (created_at desc);

alter table admin_audit_log enable row level security;
revoke all on admin_audit_log from anon, authenticated;
-- Không policy nào: chỉ service_role ghi/đọc (admin xem qua trang /admin/audit).

comment on table admin_audit_log is
  'Chỉ ghi lượt CHẠM DỮ LIỆU CÁ NHÂN (users.list, users.view) và HÀNH ĐỘNG GHI của admin (affiliate.create, affiliate.toggle). KHÔNG ghi lượt xem trang tổng quan/affiliate — đó là số liệu gộp, log vào chỉ làm loãng tín hiệu.';
comment on column admin_audit_log.meta is
  'Ngữ cảnh hành động (vd {"q":"abc","page":2} hoặc {"code":"TIKTOK1"}). Không chứa dữ liệu cá nhân của user bị xem.';
