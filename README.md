# Thiệp cưới online · Hồng Quân & Khánh Linh

Trang tĩnh (HTML, CSS, JS thuần, không cần build), dựng từ gói `design_handoff_thiep_cuoi`, đổi sang tông xanh rêu.
Đăng lên GitHub Pages bằng GitHub Actions mỗi lần push lên `main`. Repo cố ý không ghi link thiệp.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `index.html` | Toàn bộ nội dung thiệp, theo thứ tự các phần trong README bàn giao |
| `css/style.css` | Màu (khối `:root` ở đầu file), chữ, bố cục |
| `js/config.js` | Cấu hình: `sheetUrl`, bật/tắt phong bì, tự cuộn và tốc độ cuộn, hiệu ứng, âm lịch |
| `js/app.js` | Phong bì, hiệu ứng, tự cuộn tốc độ cố định, album, hồi âm, lời chúc dạng khung chat, thêm vào lịch, sao chép số TK |
| `assets/` | Ảnh đã nén (bản gốc + bản 640px), mã QR, nhạc 128 kbps, ảnh xem trước `og.jpg`, file lịch `cal/*.ics` cho iPhone |
| `google-sheets/` | Apps Script nhận hồi âm + lời chúc, và hướng dẫn cài |
| `scripts/optimize-assets.sh` | Tạo lại `assets/` từ gói bàn giao và thư mục `Ảnh cưới` (danh sách ảnh dùng trên thiệp ở đầu script, cần ffmpeg) |
| `scripts/build-site.mjs`, `.github/workflows/pages.yml` | Đăng lên GitHub Pages: chép trang vào `_site/`, chèn URL Google Sheets từ secret `SHEET_URL` và link đầy đủ cho ảnh xem trước |
| `scripts/build-artifact.mjs` | Tạo `dist-artifact/index.html` cho bản xem thử trên Claude Artifact (bật lời chúc mẫu) |

## Chạy thử trên máy

Trong thư mục `thiep-cuoi`:

```bash
python3 -m http.server 5173
```

Mở http://localhost:5173. Khi chưa có `sheetUrl`, hồi âm và lời chúc chỉ lưu trong trình duyệt đang mở.

## Cập nhật thiệp

Sửa file, commit rồi push lên `main`. GitHub Actions tự đăng lại sau khoảng một phút.
Để `sheetUrl` trong `js/config.js` luôn trống trong repo; URL thật nằm ở secret `SHEET_URL`.
Trình duyệt của khách có thể giữ bản cũ thêm tối đa 10 phút.

## Google Sheets

Hồi âm và lời chúc về Google Sheet "database thiệp cưới", qua dự án Apps Script "Thiệp cưới Quân & Linh"
gắn với Sheet đó (Tiện ích → Apps Script). URL ứng dụng web nằm trong secret `SHEET_URL` của repo.
Sửa `google-sheets/Code.gs` thì dán lại vào Apps Script và tạo phiên bản triển khai mới, xem `google-sheets/Huong-dan.md`.

Ghi chú: mã QR cô dâu chứa tài khoản ảo MB `VQRQANHPB1802` (mã tham chiếu `NPS6869`), không phải số `01602486663322`
in trên thiệp. Đây là chủ ý, giữ nguyên mã này. Mã chú rể khớp số `0965697012`.
