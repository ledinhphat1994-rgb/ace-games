// Sổ điểm.
//   GET  /api/gv/so-diem?hocKi=1&mon=toan   -> bảng điểm cả lớp của một môn
//   GET  /api/gv/so-diem?hocKi=1            -> tổng hợp ĐTB tất cả các môn + xếp loại
//   POST /api/gv/so-diem  { hocKi, mon, ghiDiem:[{hocSinhId, loai, soThuTu, giaTri, nhanXet}] }
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { gomBangDiem, xepLoaiHocTap, dtbMonCaNam } from '../../_lib/tt22.js';

const LOAI_DIEM = new Set(['tx', 'gk', 'ck']);

async function layMon(db) {
  const { results } = await db.prepare(
    'SELECT ma, ten, cach_danh_gia, so_dgtx, thu_tu FROM mon_hoc WHERE dang_hoc = 1 ORDER BY thu_tu'
  ).all();
  return results;
}

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const q = new URL(request.url).searchParams;
  const hocKi = Number(q.get('hocKi')) === 2 ? 2 : 1;
  const mon = q.get('mon');

  const [cacMon, { results: hocSinh }] = await Promise.all([
    layMon(db),
    db.prepare('SELECT id, ho_ten AS hoTen FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id').all(),
  ]);

  // --- Bảng điểm của một môn ---
  if (mon) {
    const thongTinMon = cacMon.find((m) => m.ma === mon);
    if (!thongTinMon) return loi('Không có môn học này.', 404);

    const { results: diem } = await db.prepare(
      'SELECT hoc_sinh_id, mon, loai, so_thu_tu, gia_tri, nhan_xet FROM diem WHERE mon = ?1 AND hoc_ki = ?2'
    ).bind(mon, hocKi).all();

    const theoHs = {};
    diem.forEach((d) => { (theoHs[d.hoc_sinh_id] = theoHs[d.hoc_sinh_id] || []).push(d); });

    return json({
      ok: true, hocKi, mon: thongTinMon,
      danhSach: hocSinh.map((h) => ({
        id: h.id, hoTen: h.hoTen,
        ...gomBangDiem(theoHs[h.id] || [], [thongTinMon])[mon],
      })),
    });
  }

  // --- Tổng hợp toàn bộ môn ---
  const [{ results: diem }, { results: renLuyen }] = await Promise.all([
    db.prepare('SELECT hoc_sinh_id, mon, loai, so_thu_tu, gia_tri, nhan_xet FROM diem WHERE hoc_ki = ?1')
      .bind(hocKi).all(),
    db.prepare('SELECT hoc_sinh_id, muc, nhan_xet FROM ren_luyen WHERE hoc_ki = ?1').bind(hocKi).all(),
  ]);

  const theoHs = {};
  diem.forEach((d) => { (theoHs[d.hoc_sinh_id] = theoHs[d.hoc_sinh_id] || []).push(d); });
  const rlTheoHs = Object.fromEntries(renLuyen.map((r) => [r.hoc_sinh_id, r]));

  const danhSach = hocSinh.map((h) => {
    const bang = gomBangDiem(theoHs[h.id] || [], cacMon);
    const theoMon = {};
    cacMon.forEach((m) => {
      theoMon[m.ma] = m.cach_danh_gia === 'diem' ? bang[m.ma].dtb : (bang[m.ma].nhanXet || '');
    });

    const xepLoai = xepLoaiHocTap(cacMon.map((m) => ({
      cachDanhGia: m.cach_danh_gia,
      dtb: bang[m.ma].dtb,
      nhanXet: bang[m.ma].nhanXet,
    })));

    const coDiem = cacMon.filter((m) => m.cach_danh_gia === 'diem' && bang[m.ma].dtb !== null);
    const dtbChung = coDiem.length
      ? Math.round((coDiem.reduce((a, m) => a + bang[m.ma].dtb, 0) / coDiem.length) * 10) / 10
      : null;

    return {
      id: h.id, hoTen: h.hoTen, theoMon, xepLoai, dtbChung,
      soMonCoDiem: coDiem.length,
      renLuyen: (rlTheoHs[h.id] || {}).muc || '',
      nhanXetRenLuyen: (rlTheoHs[h.id] || {}).nhan_xet || '',
    };
  });

  return json({ ok: true, hocKi, monHoc: cacMon, danhSach });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { hocKi, mon, ghiDiem } = await docThan(request);

  const hk = Number(hocKi) === 2 ? 2 : 1;
  if (!mon || typeof mon !== 'string') return loi('Thiếu mã môn học.');
  if (!Array.isArray(ghiDiem) || !ghiDiem.length) return loi('Không có điểm nào để lưu.');
  if (ghiDiem.length > 500) return loi('Quá nhiều điểm trong một lần gửi.');

  const cauLenh = [];
  for (const g of ghiDiem) {
    const id = Number(g.hocSinhId);
    if (!Number.isInteger(id) || id <= 0) return loi('Mã học sinh không hợp lệ.');
    if (!LOAI_DIEM.has(g.loai)) return loi(`Loại điểm không hợp lệ: ${g.loai}`);

    const stt = Number(g.soThuTu) || 1;
    if (stt < 1 || stt > 10) return loi('Số thứ tự cột điểm không hợp lệ.');

    let giaTri = null;
    if (g.giaTri !== null && g.giaTri !== undefined && g.giaTri !== '') {
      giaTri = Number(g.giaTri);
      if (Number.isNaN(giaTri) || giaTri < 0 || giaTri > 10) {
        return loi(`Điểm phải nằm trong khoảng 0 đến 10 (nhận được: ${g.giaTri}).`);
      }
      giaTri = Math.round(giaTri * 10) / 10;
    }

    const nx = chuoi(g.nhanXet, 10);
    if (nx && !['D', 'CD'].includes(nx)) return loi('Nhận xét chỉ nhận D (Đạt) hoặc CD (Chưa đạt).');

    // Xoá hẳn khi giáo viên xoá trắng ô điểm, để không đếm nhầm là đã có điểm.
    if (giaTri === null && !nx) {
      cauLenh.push(env.DB.prepare(
        'DELETE FROM diem WHERE hoc_sinh_id = ?1 AND mon = ?2 AND hoc_ki = ?3 AND loai = ?4 AND so_thu_tu = ?5'
      ).bind(id, mon, hk, g.loai, stt));
    } else {
      cauLenh.push(env.DB.prepare(
        `INSERT INTO diem (hoc_sinh_id, mon, hoc_ki, loai, so_thu_tu, gia_tri, nhan_xet, cap_nhat_luc)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
         ON CONFLICT(hoc_sinh_id, mon, hoc_ki, loai, so_thu_tu)
         DO UPDATE SET gia_tri = excluded.gia_tri,
                       nhan_xet = excluded.nhan_xet,
                       cap_nhat_luc = datetime('now')`
      ).bind(id, mon, hk, g.loai, stt, giaTri, nx));
    }
  }

  await env.DB.batch(cauLenh);
  return json({ ok: true, daLuu: cauLenh.length });
}, { canGiaoVien: true });
