# Thiệp cưới online · Hồng Quân & Khánh Linh

Trang tĩnh (HTML, CSS, JS thuần, không cần build), dựng từ gói `design_handoff_thiep_cuoi`, đổi sang tông xanh rêu.

- Thiệp: https://quantranhong1999.github.io/thiep-cuoi-quan-linh/ (GitHub Pages, nhánh `main`, thư mục gốc)
- Bản demo (Claude Artifact, có lời chúc mẫu): https://claude.ai/artifact/7rMGnvD9TYHz12qaFexiD8

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `index.html` | Toàn bộ nội dung thiệp, theo thứ tự các phần trong README bàn giao |
| `css/style.css` | Màu (khối `:root` ở đầu file), chữ, bố cục |
| `js/config.js` | Cấu hình: `sheetUrl`, bật/tắt phong bì, tự cuộn và tốc độ cuộn, hiệu ứng, âm lịch |
| `js/app.js` | Phong bì, hiệu ứng, tự cuộn tốc độ cố định, album, hồi âm, lời chúc dạng khung chat, sao chép số TK |
| `assets/` | Ảnh đã nén (bản gốc + bản 640px), mã QR, nhạc 128 kbps, ảnh xem trước `og.jpg` |
| `google-sheets/` | Apps Script nhận hồi âm + lời chúc, và hướng dẫn cài |
| `scripts/optimize-assets.sh` | Tạo lại `assets/` từ gói bàn giao và thư mục `Ảnh cưới` (danh sách ảnh dùng trên thiệp ở đầu script, cần ffmpeg) |
| `scripts/build-artifact.mjs` | Tạo `dist-artifact/index.html` cho bản demo trên Claude Artifact (bật lời chúc mẫu) |

## Chạy thử trên máy

Trong thư mục `thiep-cuoi`:

```bash
python3 -m http.server 5173
```

Mở http://localhost:5173. Khi chưa có `sheetUrl`, hồi âm và lời chúc chỉ lưu trong trình duyệt đang mở.

## Cập nhật thiệp

Sửa file, commit rồi push lên `main`. GitHub Pages tự đăng lại sau khoảng một phút.
Trình duyệt của khách có thể giữ bản cũ thêm tối đa 10 phút.

## Việc còn lại trước khi gửi khách

- Cài Google Sheets theo `google-sheets/Huong-dan.md`, dán URL vào `sheetUrl` trong `js/config.js`.
  Khi chưa có `sheetUrl`, hồi âm và lời chúc của khách chỉ nằm trong trình duyệt của khách, cô dâu chú rể không nhận được.

Ghi chú: mã QR cô dâu chứa tài khoản ảo MB `VQRQANHPB1802` (mã tham chiếu `NPS6869`), không phải số `01602486663322`
in trên thiệp. Đây là chủ ý, giữ nguyên mã này. Mã chú rể khớp số `0965697012`.
