// Thiệp cưới Hồng Quân & Khánh Linh — nhận xác nhận tham dự + lời chúc
// Dán toàn bộ file này vào Apps Script của Google Sheet, chạy hàm setup() một lần, rồi Triển khai dạng Ứng dụng web.
//
// - Mỗi trình duyệt của khách có một "Mã khách". Gửi lại từ cùng trình duyệt thì sửa dòng cũ, không thêm dòng mới.
// - Lời chúc hiện trên thiệp ngay khi khách gửi. Xoá một dòng trong tab "Lời chúc" là lời chúc đó biến mất khỏi thiệp.

const TZ = 'Asia/Ho_Chi_Minh';
const SHEET_RSVP = 'Xác nhận';
const SHEET_WISH = 'Lời chúc';
// Cột đầu luôn là thời gian gửi lần đầu, hai cột cuối là "Sửa lúc" và "Mã khách".
const HEAD_RSVP = ['Thời gian', 'Tên', 'Tham dự', 'Dự tiệc bên', 'Số người', 'Lời chúc', 'Sửa lúc', 'Mã khách'];
const HEAD_WISH = ['Thời gian', 'Tên', 'Lời chúc', 'Sửa lúc', 'Mã khách'];
const SIDES = { gai: 'Nhà gái · 28.11', trai: 'Nhà trai · 29.11', ca: 'Cả hai' };

// Chống spam. Khách thật luôn gửi từ trang thiệp; bài gửi bị nghi là spam bị bỏ qua
// nhưng vẫn trả về "ok" để bot không biết mà đổi cách.
const MAX_PER_10_MIN = 60;         // tổng số lần gửi của mọi khách trong 10 phút
const MAX_PER_GUEST_PER_HOUR = 10; // một khách gửi hoặc sửa tối đa 10 lần mỗi giờ
const MIN_MS_ON_PAGE = 3000;       // gửi chưa tới 3 giây sau khi mở trang thì là bot

function setup() {
  const ss = SpreadsheetApp.getActive();
  const mk = (name, head, widths) => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#eceee3');
    sh.setFrozenRows(1);
    widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
    return sh;
  };
  mk(SHEET_RSVP, HEAD_RSVP, [150, 180, 80, 150, 80, 420, 150, 110]);
  const w = mk(SHEET_WISH, HEAD_WISH, [150, 180, 480, 150, 110]);
  w.getRange('C:C').setWrap(true);
  w.getRange('D:D').clearDataValidations(); // bản cũ dùng cột này làm ô tick "Duyệt"
}

function doPost(e) {
  let d;
  try {
    d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json({ ok: false });
  }
  const id = String(d.id || ''), name = clean(d.name, 80), msg = clean(d.msg, 1000);
  if (!name || !/^[A-Za-z0-9][\w-]{7,63}$/.test(id)) return json({ ok: false });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (isSpam(d, id, name, msg)) return json({ ok: true });
    const ss = SpreadsheetApp.getActive();
    const now = new Date();
    const yes = d.attend === 'yes';
    upsert(ss.getSheetByName(SHEET_RSVP), HEAD_RSVP, id, now,
      [name, yes ? 'Có' : 'Không', yes ? (SIDES[d.side] || '') : '', yes ? Math.min(20, Number(d.guests) || 1) : 0, msg]);
    const wish = ss.getSheetByName(SHEET_WISH);
    if (msg) upsert(wish, HEAD_WISH, id, now, [name, msg]);
    else remove(wish, HEAD_WISH, id); // khách xoá lời chúc khi sửa hồi âm
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// GET ?action=wishes&me=<mã khách>: mọi lời chúc còn trong tab "Lời chúc", mới nhất trước.
// Lời chúc của chính người hỏi được đánh dấu "mine" (mã khách không bao giờ được gửi ra ngoài).
function doGet(e) {
  const me = String((e && e.parameter && e.parameter.me) || '');
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_WISH);
  const rows = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEAD_WISH.length).getValues() : [];
  const list = rows
    .filter(r => r[1] && r[2])
    .reverse()
    .map(r => {
      const w = { name: String(r[1]), msg: String(r[2]), t: r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, 'dd/MM/yyyy') : '' };
      if (me && String(r[HEAD_WISH.length - 1]) === me) w.mine = true;
      return w;
    });
  return json(list);
}

// Ghi [Thời gian, ...values, Sửa lúc, Mã khách]: sửa dòng của khách nếu đã có, không thì thêm dòng mới.
function upsert(sh, head, id, now, values) {
  const row = findRow(sh, head, id);
  if (row) sh.getRange(row, 2, 1, values.length + 1).setValues([values.concat([now])]);
  else sh.appendRow([now].concat(values, ['', id]));
}

function remove(sh, head, id) {
  const row = findRow(sh, head, id);
  if (row) sh.deleteRow(row);
}

function findRow(sh, head, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const cell = sh.getRange(2, head.length, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

function isSpam(d, id, name, msg) {
  if (d.hp) return true;                                     // ô ẩn trên form, chỉ bot mới điền
  if (!(Number(d.ms) >= MIN_MS_ON_PAGE)) return true;        // không gửi từ trang thiệp, hoặc gửi quá nhanh
  if (/https?:\/\/|www\./i.test(name + ' ' + msg)) return true; // lời chúc không cần chèn link
  const cache = CacheService.getScriptCache();
  const now = Date.now();
  if (bump(cache, 'n:' + Math.floor(now / 600000), 600) > MAX_PER_10_MIN) return true;
  if (bump(cache, 'g:' + id + ':' + Math.floor(now / 3600000), 3600) > MAX_PER_GUEST_PER_HOUR) return true;
  return false;
}

function bump(cache, key, ttl) {
  const n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), ttl);
  return n;
}

function clean(v, max) {
  let s = String(v || '').replace(/\s+$/g, '').slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // chặn công thức độc hại
  return s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
