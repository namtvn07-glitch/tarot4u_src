-- Giai đoạn Admin Dashboard — bảng phân quyền admin.
--
-- Cố ý là BẢNG RIÊNG, không phải cột `is_admin` trên profiles: profiles là bảng
-- dữ liệu người dùng thông thường, có policy `profiles_update_own` cho user tự
-- sửa dòng của mình. Nhét cờ quyền vào đó là đặt quyền hạn nằm chung chỗ với dữ
-- liệu user tự ghi được — chỉ cần một khe hở cột là user tự cấp quyền admin.
--
-- Cấp quyền admin làm NGOÀI LUỒNG bằng SQL trực tiếp (MCP/Dashboard) qua
-- service_role. Không có UI tự cấp, không có policy insert/update/delete cho
-- anon/authenticated — chỉ có đúng 1 policy select-own bên dưới.
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  note text
);

alter table admin_users enable row level security;

-- User chỉ tự xem được đúng dòng của chính mình (vô hại — chỉ để requireAdmin()
-- dùng client RLS-aware kiểm tra bản thân, không cần service_role cho việc này).
-- Không ai select được dòng của người khác => không liệt kê được danh sách admin.
create policy admin_users_select_own on admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);
