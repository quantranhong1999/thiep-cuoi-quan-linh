# Nối thiệp với Google Sheets

Sau khi nối, mỗi lần khách bấm **Gửi** trên thiệp:
- Tab **Xác nhận**: thêm 1 dòng (tên, có đến không, dự bên nào, số người, lời chúc).
- Tab **Lời chúc**: thêm 1 dòng nếu khách có viết lời chúc, ô **Duyệt** để trống.

Lời chúc **chỉ hiện trên thiệp khi anh/chị tick ô Duyệt**. Bỏ tick là ẩn lại.

## Cài đặt (khoảng 5 phút, làm một lần)

1. Vào Google Drive → **Mới → Google Trang tính**. Đặt tên, ví dụ "Thiệp cưới Q&L".
2. Menu **Tiện ích mở rộng → Apps Script**.
3. Xoá hết code mẫu, dán toàn bộ nội dung file `google-sheets/Code.gs` vào, bấm **Lưu** (biểu tượng đĩa).
4. Ở thanh trên, chọn hàm **setup** → bấm **Chạy**. Google sẽ hỏi quyền → chọn tài khoản → **Nâng cao → Đi tới… (không an toàn) → Cho phép**. (Cảnh báo này là bình thường vì script do chính anh tạo.)
   Quay lại Sheet sẽ thấy 2 tab **Xác nhận** và **Lời chúc**.
5. Bấm **Triển khai → Tùy chọn triển khai mới**:
   - Bánh răng → chọn **Ứng dụng web**
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
   - Bấm **Triển khai**, copy **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).
6. Dán URL đó vào `sheetUrl` trong file `js/config.js` của thiệp (hoặc gửi cho mình để gắn giúp).

## Duyệt lời chúc
Mở tab **Lời chúc** → tick ô cột **Duyệt** ở dòng muốn hiện. Khách mở (hoặc tải lại) thiệp sẽ thấy ngay.

## Lưu ý
- Nếu sửa code Apps Script, phải **Triển khai → Quản lý triển khai → Sửa → Phiên bản mới** thì mới có hiệu lực (URL giữ nguyên).
- Chỉ người có quyền vào Sheet mới xem được danh sách; khách chỉ thấy các lời chúc đã duyệt.
