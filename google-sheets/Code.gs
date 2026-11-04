// Thiệp cưới Hồng Quân & Khánh Linh — nhận xác nhận tham dự + lời chúc
// Dán toàn bộ file này vào Apps Script của Google Sheet, chạy hàm setup() một lần, rồi Triển khai dạng Ứng dụng web.
//
// - Mọi thứ nằm trong một tab "Xác nhận": mỗi khách một dòng, lời chúc ở cột "Lời chúc".
// - Mỗi trình duyệt của khách có một "Mã khách". Gửi lại từ cùng trình duyệt thì sửa dòng cũ, không thêm dòng mới.
// - Lời chúc hiện trên thiệp ngay khi khách gửi. Xoá ô lời chúc (hoặc cả dòng) là lời chúc đó biến mất khỏi thiệp.

const TZ = 'Asia/Ho_Chi_Minh';
const SHEET_RSVP = 'Xác nhận';
// Cột đầu là thời gian gửi lần đầu, hai cột cuối là "Sửa lúc" và "Mã khách".
const HEAD_RSVP = ['Thời gian', 'Tên', 'Tham dự', 'Dự tiệc bên', 'Số người', 'Lời chúc', 'Sửa lúc', 'Mã khách'];
const COL = { time: 1, name: 2, msg: 6, edited: 7, id: 8 };
const TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';
const SIDES = { gai: 'Nhà gái · 28.11', trai: 'Nhà trai · 29.11', ca: 'Cả hai' };

// Chống spam. Khách thật luôn gửi từ trang thiệp; bài gửi bị nghi là spam bị bỏ qua
// nhưng vẫn trả về "ok" để bot không biết mà đổi cách.
const MAX_PER_10_MIN = 60;         // tổng số lần gửi của mọi khách trong 10 phút
const MAX_PER_GUEST_PER_HOUR = 10; // một khách gửi hoặc sửa tối đa 10 lần mỗi giờ
const MIN_MS_ON_PAGE = 3000;       // gửi chưa tới 3 giây sau khi mở trang thì là bot

function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_RSVP) || ss.insertSheet(SHEET_RSVP);
  sh.getRange(1, 1, 1, HEAD_RSVP.length).setValues([HEAD_RSVP]).setFontWeight('bold').setBackground('#eceee3');
  sh.setFrozenRows(1);
  [150, 180, 80, 150, 80, 420, 150, 110].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange('F:F').setWrap(true);
  [COL.time, COL.edited].forEach(c => sh.getRange(2, c, sh.getMaxRows() - 1, 1).setNumberFormat(TIME_FORMAT));
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
    const yes = d.attend === 'yes';
    upsert(SpreadsheetApp.getActive().getSheetByName(SHEET_RSVP), id, new Date(),
      [name, yes ? 'Có' : 'Không', yes ? (SIDES[d.side] || '') : '', yes ? Math.min(20, Number(d.guests) || 1) : 0, msg]);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// GET ?action=wishes&me=<mã khách>: lời chúc của mọi dòng có lời chúc, mới nhất trước.
// Lời chúc của chính người hỏi được đánh dấu "mine" (mã khách không bao giờ được gửi ra ngoài).
function doGet(e) {
  const me = String((e && e.parameter && e.parameter.me) || '');
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_RSVP);
  const rows = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEAD_RSVP.length).getValues() : [];
  const list = rows
    .filter(r => r[COL.name - 1] && String(r[COL.msg - 1]).trim())
    .reverse()
    .map(r => {
      const t = r[COL.time - 1];
      const w = { name: String(r[COL.name - 1]), msg: String(r[COL.msg - 1]), t: t instanceof Date ? Utilities.formatDate(t, TZ, 'dd/MM/yyyy') : '' };
      if (me && String(r[COL.id - 1]) === me) w.mine = true;
      return w;
    });
  return json(list);
}

// Ghi [Thời gian, ...values, Sửa lúc, Mã khách]: sửa dòng của khách nếu đã có, không thì thêm dòng mới.
function upsert(sh, id, now, values) {
  const row = findRow(sh, id);
  if (row) {
    sh.getRange(row, COL.name, 1, values.length + 1).setValues([values.concat([now])]);
    sh.getRange(row, COL.edited).setNumberFormat(TIME_FORMAT);
  } else {
    sh.appendRow([now].concat(values, ['', id]));
    sh.getRange(sh.getLastRow(), COL.time).setNumberFormat(TIME_FORMAT);
  }
}

function findRow(sh, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const cell = sh.getRange(2, COL.id, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
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
