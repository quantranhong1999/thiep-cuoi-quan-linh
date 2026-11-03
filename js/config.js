// Cấu hình thiệp. Sửa giá trị ở đây rồi tải lại trang.
window.THIEP_CONFIG = {
  // URL ứng dụng web Apps Script (dạng https://script.google.com/macros/s/…/exec), xem google-sheets/Huong-dan.md.
  // Để trống: hồi âm và lời chúc chỉ lưu trong trình duyệt đang mở (dùng để thử).
  sheetUrl: '',
  intro: true,        // phong bì mở thiệp
  autoScroll: true,   // tự cuộn sau khi mở thiệp
  scrollSpeed: 80,    // tốc độ tự cuộn, cố định (px mỗi giây): 60 chậm, 80 vừa, 120 nhanh
  animations: true,   // hiệu ứng xuất hiện, cánh hoa rơi…
  musicUrl: '',       // để trống: dùng assets/le-duong.mp3
  showLunar: true,    // hiện ngày âm lịch
};
