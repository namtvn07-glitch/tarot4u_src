# Xác minh PayOS & hotline khủng hoảng

> Đầu vào cho Giai đoạn 1 — hai mục 🔴 trong [08-timeline.md §3](plan/08-timeline.md):
> "Xác minh yêu cầu PayOS" (chặn Giai đoạn 6) và "Xác minh số hotline hỗ trợ
> khủng hoảng còn hoạt động". Nghiên cứu qua nguồn công khai — **không thay
> thế** bước tự tạo tài khoản PayOS thật hoặc gọi thử hotline trước ngày
> launch (xem mục "Còn phải làm" ở mỗi phần).

## 1. PayOS có bắt buộc Hộ kinh doanh không?

**Kết luận: KHÔNG bắt buộc.** PayOS xác nhận công khai rằng cá nhân (chưa
có HKD) vẫn đăng ký và nhận thanh toán được, chỉ cần CCCD — đây là điểm
🔴 chặn lớn nhất của cả dự án theo `08-timeline.md`, và tin tốt là **rủi ro
này thấp hơn dự tính ban đầu**.

### Bằng chứng

| Nguồn | Nội dung |
|---|---|
| [payos.vn/docs/.../xac-thuc-to-chuc](https://payos.vn/docs/huong-dan-su-dung/xac-thuc-to-chuc/) | PayOS chia 2 nhóm: có pháp nhân (xác thực bằng MST) và **không có pháp nhân** — cá nhân/HKD chưa đăng ký (xác thực bằng **CCCD**, không cần MST) |
| [payos.vn/xac-thuc-khong-can-mst](https://payos.vn/xac-thuc-khong-can-mst/) | Đối tượng dùng CCCD thay MST gồm: cá nhân kinh doanh, hộ kinh doanh chưa đăng ký, startup chưa có pháp nhân, freelancer/developer. Đây là cải tiến so với hệ thống cũ (Casso) — trước đây bắt buộc MST |
| [payos.vn](https://payos.vn) (trang chủ) | Quảng bá trực tiếp: "Phá bỏ rào cản thủ tục đối với cá nhân kinh doanh, MMO, freelancer" — đăng ký ~5 phút, chỉ cần CCCD |
| [payos.vn/thu-tuc-dang-ky-cong-thanh-toan](https://payos.vn/thu-tuc-dang-ky-cong-thanh-toan/) | So sánh: cổng truyền thống (VNPay, ZaloPay, Momo) đòi giấy phép kinh doanh, duyệt 4 tuần–6 tháng; PayOS (mô hình chuyển khoản A2A ngân hàng-ngân hàng) chỉ 5–30 phút, không cần giấy phép |

### Quy trình xác thực cá nhân (theo tài liệu PayOS)

Nhập CCCD + họ tên → chuyển khoản QR một khoản nhỏ từ **đúng tài khoản ngân
hàng đứng tên trùng thông tin đăng ký** → hệ thống tự đối chiếu, duyệt tự
động. Nếu thất bại, gửi ảnh CCCD (+ giấy phép kinh doanh nếu có) cho đội hỗ
trợ PayOS duyệt thủ công — thời gian duyệt thủ công không có con số cụ thể.

### Chưa xác minh được / rủi ro còn lại

- **Nghĩa vụ thuế**: PayOS không đề cập nghĩa vụ kê khai thuế thu nhập cá
  nhân khi kinh doanh chưa có HKD — đây vẫn là rủi ro pháp lý người vận hành
  Ventus phải tự cân nhắc, PayOS chỉ giải quyết phần *tích hợp kỹ thuật*,
  không giải quyết phần *nghĩa vụ thuế*. Vẫn giữ nguyên hạng mục "Nghĩa vụ
  thuế khi bán dịch vụ số" ở checklist pháp lý trong `08-timeline.md` §3
  ngoài-timeline.
- **Môi trường sandbox**: không tìm thấy tài liệu chính thức xác nhận có
  sandbox tách biệt để test trước khi dùng tiền thật — cần tự kiểm tra trong
  dashboard sau khi tạo tài khoản.
- Các thông tin trên đến từ trang marketing/blog của chính PayOS, không phải
  bản Điều khoản dịch vụ đầy đủ (không fetch được ToS qua nguồn công khai).

### Còn phải làm trước khi coi là "đã xác minh" 100%

1. Tự tạo tài khoản thử bằng CCCD cá nhân tại [payos.vn](https://payos.vn)
   (miễn phí, ~5 phút theo quảng cáo) để xem thực tế quy trình duyệt.
2. Đọc Điều khoản sử dụng đầy đủ trong dashboard sau khi đăng ký, xác nhận
   PayOS không âm thầm đẩy nghĩa vụ thuế/pháp lý nào sang người dùng.
3. Liên hệ [payos.vn/lien-he](https://payos.vn/lien-he/) nếu cần xác nhận
   bằng văn bản trước khi cam kết tích hợp chính thức.

> Đề xuất cập nhật mức độ rủi ro trong `08-timeline.md §6` từ "Trung bình,
> chặn GĐ 6" xuống mức thấp hơn — nhưng **giữ nguyên** hạng mục "xác minh"
> cho tới khi bước 1–2 ở trên hoàn tất bằng tài khoản thật.

---

## 2. Hotline hỗ trợ khủng hoảng — xác minh còn hoạt động

`06-bao-mat-kiem-duyet-phap-ly.md §3.3` đã có sẵn nội dung trang tài nguyên
khủng hoảng, dùng 2 số: **Đường dây nóng Ngày Mai** và **Tổng đài 111**. Đã
xác minh qua nguồn công khai — cả hai còn hoạt động, số đúng.

| Hotline | Số | Giờ hoạt động | Đối tượng | Trạng thái |
|---|---|---|---|---|
| **Đường dây nóng Ngày Mai** | 096 306 1414 | **13:00–20:30, Thứ 4 → Chủ nhật** (không phải 24/7) | Người trầm cảm, khủng hoảng tâm lý, có ý định tự hại — chủ yếu người trẻ | ✅ Còn hoạt động — [duongdaynongngaymai.vn/hotline](https://duongdaynongngaymai.vn/hotline/), xác nhận chéo qua [Tuổi Trẻ](https://tuoitre.vn/plo/ngay-mai-duong-day-nong-ho-tro-nguoi-tram-cam-109626080.htm) |
| **Tổng đài Quốc gia Bảo vệ Trẻ em 111** | 111 | 24/7, miễn phí | Trẻ em/vị thành niên, có tiếp nhận khủng hoảng tâm lý và chuyển tuyến người thân | ✅ Còn hoạt động — [tongdai111.vn](https://tongdai111.vn/), do Cục Trẻ em vận hành từ 12/2019 |
| ~~1800 1567 "Phím số diệu kỳ"~~ | — | — | — | ❌ **Đã ngừng hoạt động, bị thay thế bởi 111 từ 12/2019** — không được nhắc trong doc hiện tại, xác nhận đúng là không dùng số này |

Các số khác lan truyền trên mạng (1900 1267, 1900 636446, CSAGA 1900 599 930,
các số cá nhân...) chỉ xuất hiện trên trang tổng hợp, không có xác nhận từ
tổ chức chính chủ — **không đủ tin cậy**, không đưa vào sản phẩm.

### Đề xuất sửa `06-bao-mat-kiem-duyet-phap-ly.md §3.3`

Ngày Mai chỉ hoạt động Thứ 4–CN, 13:00–20:30 — nếu hiển thị mà không ghi giờ,
user gọi ngoài khung giờ này sẽ hụt hẫng đúng lúc khủng hoảng. Đề xuất bổ
sung giờ hoạt động ngay cạnh số, và thêm gợi ý gọi 115 (cấp cứu y tế) nếu
ngoài giờ Ngày Mai và tình huống nguy cấp — bản nháp:

```
• Đường dây nóng Ngày Mai — 096 306 1414 (13:00–20:30, Thứ 4 → Chủ nhật)
• Tổng đài Quốc gia Bảo vệ Trẻ em — 111 (24/7)
• Cấp cứu y tế — 115 (nếu tình huống nguy cấp, ngoài giờ Ngày Mai)
```

*Chưa áp dụng vào `06-bao-mat-kiem-duyet-phap-ly.md` — cần bạn xác nhận vì
đây là copy hiển thị trực tiếp cho người dùng đang khủng hoảng, rủi ro cao
nếu sai.*

### Còn phải làm trước khi coi là "đã xác minh" 100%

Đúng như cảnh báo sẵn có ở `06-bao-mat-kiem-duyet-phap-ly.md §3.3`: nghiên
cứu qua nguồn công khai **không thay thế** việc gọi thử trực tiếp cả hai số
ngay trước ngày launch, và lặp lại kiểm tra mỗi 6 tháng — hotline phi lợi
nhuận Việt Nam có tỷ lệ đổi số/ngừng hoạt động cao.

*Nguồn: xem trích dẫn URL trong từng mục ở trên.*
