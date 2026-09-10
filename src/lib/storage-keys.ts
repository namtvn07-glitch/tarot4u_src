// Key lưu trữ phía trình duyệt.
//
// ⚠️ KHÔNG ĐỔI GIÁ TRỊ CHUỖI DƯỚI ĐÂY.
//
// Tiền tố "ventus_" là tên thương hiệu cũ (đổi sang "Xem Bài Tarot" ngày
// 2026-09-10), nhưng đây là HỢP ĐỒNG DỮ LIỆU với trình duyệt của người dùng,
// không phải nhãn hiển thị. Mọi lịch sử trải bài mà người dùng hiện có đang
// nằm dưới đúng chuỗi này. Đổi tên key = dữ liệu cũ vẫn còn trong máy họ
// nhưng code không bao giờ tìm thấy nữa — với người dùng thì đó là "mất sạch
// lịch sử", và không có cách nào lấy lại từ phía server vì nó chưa bao giờ
// rời khỏi trình duyệt.
//
// Nếu thật sự cần đổi, phải viết bước di trú: đọc key cũ, ghi sang key mới,
// giữ cả hai ít nhất một chu kỳ phát hành rồi mới bỏ key cũ.
export const READINGS_STORAGE_KEY = "ventus_readings";
export const DEEP_SESSION_STORAGE_KEY = "ventus_deep_session";
