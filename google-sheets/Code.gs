// Thiệp cưới Hồng Quân & Khánh Linh — nhận xác nhận tham dự + lời chúc
// Dán toàn bộ file này vào Apps Script của Google Sheet, chạy hàm setup() một lần, rồi Triển khai dạng Ứng dụng web.

const TZ = 'Asia/Ho_Chi_Minh';
const SHEET_RSVP = 'Xác nhận';
const SHEET_WISH = 'Lời chúc';
const SIDES = { gai: 'Nhà gái · 28.11', trai: 'Nhà trai · 29.11', ca: 'Cả hai' };

// Chống spam. Khách thật luôn gửi từ trang thiệp; bài gửi bị nghi là spam bị bỏ qua
// nhưng vẫn trả về "ok" để bot không biết mà đổi cách.
const MAX_PER_10_MIN = 60;        // tổng số lần gửi của mọi khách trong 10 phút
const MAX_PER_NAME_PER_HOUR = 5;  // một tên gửi tối đa 5 lần mỗi giờ (tính cả "Sửa hồi âm")
const MIN_MS_ON_PAGE = 3000;      // gửi chưa tới 3 giây sau khi mở trang thì là bot

function setup() {
  const ss = SpreadsheetApp.getActive();
  const mk = (name, head, widths) => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(head);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#eceee3');
      widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
    }
    return sh;
  };
  mk(SHEET_RSVP, ['Thời gian', 'Tên', 'Tham dự', 'Dự tiệc bên', 'Số người', 'Lời chúc'], [150, 180, 80, 150, 80, 420]);
  const w = mk(SHEET_WISH, ['Thời gian', 'Tên', 'Lời chúc', 'Duyệt (tick để hiện trên thiệp)'], [150, 180, 480, 120]);
  w.getRange('C:C').setWrap(true);
}

function doPost(e) {
  let d;
  try {
    d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ ok: false });
  }
  const name = clean(d.name, 80), msg = clean(d.msg, 1000);
  if (!name) return json({ ok: false });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (isSpam(d, name, msg)) return json({ ok: true });
    const ss = SpreadsheetApp.getActive();
    const now = new Date();
    const yes = d.attend === 'yes';
    ss.getSheetByName(SHEET_RSVP).appendRow([now, name, yes ? 'Có' : 'Không', yes ? (SIDES[d.side] || '') : '', yes ? Math.min(20, Number(d.guests) || 1) : 0, msg]);
    if (msg) {
      const sh = ss.getSheetByName(SHEET_WISH);
      sh.appendRow([now, name, msg, false]);
      sh.getRange(sh.getLastRow(), 4).insertCheckboxes();
    }
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_WISH);
  const rows = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : [];
  const list = rows
    .filter(r => r[3] === true && r[1] && r[2])
    .reverse()
    .map(r => ({ name: String(r[1]), msg: String(r[2]), t: r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, 'dd/MM/yyyy') : '' }));
  return json(list);
}

function isSpam(d, name, msg) {
  if (d.hp) return true;                                         // ô ẩn trên form, chỉ bot mới điền
  if (!(Number(d.ms) >= MIN_MS_ON_PAGE)) return true;            // không gửi từ trang thiệp, hoặc gửi quá nhanh
  if (/https?:\/\/|www\./i.test(name + ' ' + msg)) return true;     // lời chúc không cần chèn link
  const cache = CacheService.getScriptCache();
  const now = Date.now(), who = name.toLowerCase();
  const dup = 'd:' + digest([who, msg, d.attend, d.side, d.guests].join('\n'));
  if (cache.get(dup)) return true;                               // gửi lại y hệt lần trước
  if (bump(cache, 'n:' + Math.floor(now / 600000), 600) > MAX_PER_10_MIN) return true;
  if (bump(cache, 'u:' + digest(who) + ':' + Math.floor(now / 3600000), 3600) > MAX_PER_NAME_PER_HOUR) return true;
  cache.put(dup, '1', 21600);
  return false;
}

function bump(cache, key, ttl) {
  const n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), ttl);
  return n;
}

function digest(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8));
}

function clean(v, max) {
  let s = String(v || '').replace(/\s+$/g, '').slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // chặn công thức độc hại
  return s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
