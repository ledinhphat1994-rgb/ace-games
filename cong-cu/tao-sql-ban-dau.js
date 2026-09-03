// Chuyển dữ liệu JSON hiện có thành câu lệnh SQL để nạp vào cơ sở dữ liệu D1.
// Chạy:  node cong-cu/tao-sql-ban-dau.js
const fs = require('fs');
const path = require('path');

const GOC = path.dirname(__dirname);
const doc = (p) => JSON.parse(fs.readFileSync(path.join(GOC, p), 'utf8'));

// Bọc chuỗi cho an toàn khi ghép vào câu lệnh SQL.
const s = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;
const n = (v) => (v === '' || v === null || v === undefined ? 'NULL' : Number(v));

// "11/07/2011" -> "2011-07-11"
function ngayISO(v) {
  const m = String(v || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return String(v || '');
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const dong = ['-- Dữ liệu ban đầu, sinh tự động từ các tệp JSON. Không sửa tay tệp này.', ''];

// ---------- Học sinh ----------
const hocSinh = doc('du-lieu-goc/hoc-sinh.json');
const theoDoi = doc('du-lieu-goc/theo-doi.json').danhSach || [];
const hoanCanhTheoId = Object.fromEntries(theoDoi.map((x) => [x.stt, x.hoanCanh || '']));

dong.push('DELETE FROM hoc_sinh;');
hocSinh.forEach((h) => {
  dong.push(
    'INSERT INTO hoc_sinh (id, ho_ten, gioi_tinh, ngay_sinh, lop_nghe, to_hop, chuc_vu, hoan_canh) VALUES (' +
    [n(h.stt), s(h.hoTen), s(h.gioiTinh), s(ngayISO(h.ngaySinh)), s(h.lopNghe), s(h.toHop),
     s(h.chucVu || ''), s(hoanCanhTheoId[h.stt] || '')].join(', ') + ');'
  );
});

// ---------- Theo dõi sách / đồng phục ----------
dong.push('', 'DELETE FROM theo_doi;');
theoDoi.forEach((x) => {
  if (x.sgk) {
    dong.push(`INSERT INTO theo_doi (hoc_sinh_id, muc, trang_thai, ghi_chu) VALUES (${n(x.stt)}, 'sgk', ${s(x.sgk)}, '');`);
  }
  if (x.dongPhuc) {
    dong.push(`INSERT INTO theo_doi (hoc_sinh_id, muc, trang_thai, ghi_chu) VALUES (${n(x.stt)}, 'dong_phuc', ${s(x.dongPhuc)}, ${s(x.sizeDongPhuc || '')});`);
  }
});

// ---------- Điểm danh lao động 3/9/2026 (dữ liệu lịch sử đã có) ----------
const DOI_TRANG_THAI = {
  'Có mặt đầy đủ': 'co_mat',
  'Chưa ĐD sau LĐ': 'tre',
  'Vắng có phép': 'vang_phep',
  'Không đi LĐ': 'vang_khong_phep',
};
dong.push('', "DELETE FROM diem_danh WHERE ngay = '2026-09-03' AND buoi = 'hoat_dong';");
theoDoi.forEach((x) => {
  const tt = DOI_TRANG_THAI[x.laoDong];
  if (!tt) return;
  dong.push(
    `INSERT INTO diem_danh (ngay, buoi, hoc_sinh_id, trang_thai, ly_do) VALUES ('2026-09-03', 'hoat_dong', ${n(x.stt)}, '${tt}', ${s(x.laoDong)});`
  );
});

// ---------- Thông báo ----------
dong.push('', 'DELETE FROM thong_bao;');
doc('du-lieu-goc/thong-bao.json').forEach((t) => {
  dong.push(
    'INSERT INTO thong_bao (ngay, tieu_de, noi_dung, loai, ghim) VALUES (' +
    [s(t.ngay), s(t.tieuDe), s(t.noiDung), s(t.loai || 'Chủ nhiệm'), t.ghim ? 1 : 0].join(', ') + ');'
  );
});

// ---------- Kế hoạch ----------
dong.push('', 'DELETE FROM ke_hoach;');
doc('du-lieu-goc/ke-hoach.json').forEach((k) => {
  dong.push(
    'INSERT INTO ke_hoach (ngay, tieu_de, mo_ta, muc_do) VALUES (' +
    [s(k.ngay), s(k.tieuDe), s(k.moTa || ''), s(k.mucDo || '')].join(', ') + ');'
  );
});

// ---------- Thời khoá biểu ----------
const tkb = doc('du-lieu-goc/thoi-khoa-bieu.json');
dong.push('', 'DELETE FROM thoi_khoa_bieu;');
(tkb.tiet || []).forEach((hang, i) => {
  (tkb.thu || []).forEach((tenThu) => {
    const mon = (hang.mon || {})[tenThu];
    if (!mon || mon === '—') return;
    const soThu = Number(String(tenThu).replace(/\D/g, '')) || 0;
    if (!soThu) return;
    dong.push(`INSERT INTO thoi_khoa_bieu (thu, tiet, mon) VALUES (${soThu}, ${i + 1}, ${s(mon)});`);
  });
});

const dich = path.join(GOC, 'co-so-du-lieu', '02-du-lieu-ban-dau.sql');
fs.writeFileSync(dich, dong.join('\n') + '\n', 'utf8');
console.log(`Đã tạo ${path.relative(GOC, dich)} — ${dong.filter((d) => d.startsWith('INSERT')).length} dòng dữ liệu.`);
