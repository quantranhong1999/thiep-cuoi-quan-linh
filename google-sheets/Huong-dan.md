# Nối thiệp với Google Sheets

Sau khi nối, mỗi lần khách bấm **Gửi hồi âm** trên thiệp:
- Tab **Xác nhận**: thêm 1 dòng (tên, có đến không, dự bên nào, số người, lời chúc).
- Tab **Lời chúc**: thêm 1 dòng nếu khách có viết lời chúc, ô **Duyệt** để trống.

Lời chúc **chỉ hiện trên thiệp khi anh/chị tick ô Duyệt**. Bỏ tick là ẩn lại.

## Cài đặt (khoảng 5 phút, làm một lần)

1. Mở Google Sheet dùng cho thiệp. Giữ Sheet ở chế độ **Bị hạn chế** (không chia sẻ "Bất kỳ ai có đường liên kết"):
   script chạy bằng tài khoản của anh nên không cần chia sẻ Sheet cho ai.
2. Menu **Tiện ích mở rộng → Apps Script**.
3. Xoá hết code mẫu, dán toàn bộ nội dung file `google-sheets/Code.gs` vào, bấm **Lưu** (biểu tượng đĩa).
4. Ở thanh trên, chọn hàm **setup** → bấm **Chạy**. Google sẽ hỏi quyền → chọn tài khoản → **Nâng cao → Đi tới… (không an toàn) → Cho phép**. (Cảnh báo này là bình thường vì script do chính anh tạo.)
   Quay lại Sheet sẽ thấy 2 tab **Xác nhận** và **Lời chúc**.
5. Bấm **Triển khai → Tùy chọn triển khai mới**:
   - Bánh răng → chọn **Ứng dụng web**
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai**
   - Bấm **Triển khai**, copy **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).
6. Lưu URL đó thành secret `SHEET_URL` của repo GitHub, rồi đăng lại thiệp. URL không nằm trong mã nguồn của repo;
   GitHub Actions chèn nó vào thiệp lúc đăng. Chọn một trong hai cách:
   - **Trên terminal** (lệnh đầu sẽ hỏi URL, dán vào rồi Enter):
     ```bash
     gh secret set SHEET_URL --repo quantranhong1999/thiep-cuoi-quan-linh
     ```
     ```bash
     gh workflow run pages.yml --repo quantranhong1999/thiep-cuoi-quan-linh
     ```
   - **Trên web:** repo → **Settings → Secrets and variables → Actions → New repository secret**,
     Name `SHEET_URL`, Secret là URL ở bước 5. Sau đó vào tab **Actions → Deploy to GitHub Pages → Run workflow**.

Khoảng một phút sau, thiệp trên GitHub Pages bắt đầu gửi hồi âm về Sheet.

## Duyệt lời chúc
Mở tab **Lời chúc** → tick ô cột **Duyệt** ở dòng muốn hiện. Khách mở (hoặc tải lại) thiệp sẽ thấy ngay.

## Chống spam
Script tự bỏ qua (nhưng vẫn báo "đã gửi" để bot không biết):
- bài gửi có điền vào ô ẩn trên form (chỉ bot mới thấy ô này);
- bài gửi không đi từ trang thiệp, hoặc gửi chưa tới 3 giây sau khi mở trang;
- lời chúc có chèn link (`http://`, `https://`, `www.`);
- bài gửi giống hệt một bài trong 6 giờ trước;
- quá 60 bài gửi trong 10 phút (tính chung mọi khách), hoặc quá 5 bài mỗi giờ cho cùng một tên.

Các ngưỡng nằm ở đầu file `Code.gs` (`MAX_PER_10_MIN`, `MAX_PER_NAME_PER_HOUR`, `MIN_MS_ON_PAGE`).
URL ứng dụng web vẫn xem được trên trang thiệp (F12), giống link Google Form: ai có URL thì gửi được, nhưng không đọc được Sheet.

## Lưu ý
- Nếu sửa code Apps Script, phải **Triển khai → Quản lý triển khai → Sửa → Phiên bản mới** thì mới có hiệu lực (URL giữ nguyên).
- Chỉ người có quyền vào Sheet mới xem được danh sách; khách chỉ thấy các lời chúc đã duyệt.
