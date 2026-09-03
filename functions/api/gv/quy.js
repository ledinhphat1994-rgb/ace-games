// Thủ quỹ lớp.
//   GET  /api/gv/quy                -> tổng quan: mọi khoản thu, mọi khoản chi, tồn quỹ
//   GET  /api/gv/quy?khoanId=1      -> chi tiết một khoản: từng em đã đóng bao nhiêu
//   POST /api/gv/quy  { hanhDong: 'tao_khoan' | 'ghi_dong' | 'ghi_chi', ... }
//   DELETE /api/gv/quy?loai=khoan&id=   |   ?loai=dong&id=   |   ?loai=chi&id=
//
// Công thức: Tồn quỹ = Tổng tiền đã thu (quy_dong) − Tổng tiền đã chi (quy_chi).
// Mỗi khoản thu có "mức thu mỗi em" để tính em nào đã đóng đủ / còn thiếu.
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';
import { chupCheckpoint } from '../../_lib/quy-checkpoint.js';
import { sinhKyConThieu } from '../../_lib/quy-dinh-ky.js';

// Danh mục khoản chi — dùng để xem "chi cho hoạt động bao nhiêu, văn phòng phẩm bao nhiêu...".
export const LOAI_CHI = [
  ['hoat_dong', 'Hoạt động lớp'],
  ['vpp', 'Văn phòng phẩm'],
  ['khen_thuong', 'Khen thưởng'],
  ['ho_tro', 'Hỗ trợ học sinh'],
  ['khac', 'Khác'],
];
const MA_LOAI_CHI = new Set(LOAI_CHI.map((x) => x[0]));

const QUYEN = 'quy';

function soTienHopLe(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100_000_000 && Number.isInteger(n);
}

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const khoanId = Number(new URL(request.url).searchParams.get('khoanId'));

  // Sinh nốt các kỳ thu định kỳ đã tới hạn (tuần này/tháng này...) trước khi trả dữ liệu,
  // để giáo viên luôn thấy khoản mới nhất mà không cần bấm nút riêng.
  await sinhKyConThieu(db);

  if (Number.isInteger(khoanId) && khoanId > 0) {
    const khoan = await db.prepare(
      `SELECT id, ten, hoc_ky AS hocKy, so_tien_moi_em AS soTienMoiEm, ghi_chu AS ghiChu, dang_mo AS dangMo,
              dinh_ky_id AS dinhKyId, ky_so AS kySo
         FROM quy_khoan WHERE id = ?1`
    ).bind(khoanId).first();
    if (!khoan) return loi('Không tìm thấy khoản thu này.', 404);

    const [{ results: hocSinh }, { results: dong }] = await Promise.all([
      db.prepare('SELECT id, ho_ten AS hoTen, to_so AS toSo FROM hoc_sinh WHERE dang_hoc = 1 ORDER BY id').all(),
      db.prepare(
        'SELECT id, hoc_sinh_id AS hocSinhId, so_tien AS soTien, ngay, ghi_chu AS ghiChu FROM quy_dong WHERE khoan_id = ?1 ORDER BY ngay DESC, id DESC'
      ).bind(khoanId).all(),
    ]);

    const theoHs = {};
    dong.forEach((d) => {
      theoHs[d.hocSinhId] = theoHs[d.hocSinhId] || { daDong: 0, lanDong: [] };
      theoHs[d.hocSinhId].daDong += d.soTien;
      theoHs[d.hocSinhId].lanDong.push(d);
    });

    const danhSach = hocSinh.map((h) => {
      const t = theoHs[h.id] || { daDong: 0, lanDong: [] };
      return {
        hocSinhId: h.id, hoTen: h.hoTen, toSo: h.toSo,
        daDong: t.daDong,
        conThieu: Math.max(0, khoan.soTienMoiEm - t.daDong),
        daDuDinh: t.daDong >= khoan.soTienMoiEm,
        lanDong: t.lanDong,
      };
    });

    // Gom theo tổ — để xem tổ nào đóng đủ, tổ nào cần nhắc.
    const theoTo = {};
    danhSach.forEach((h) => {
      const to = h.toSo ?? 0;
      theoTo[to] = theoTo[to] || { toSo: h.toSo, soEm: 0, soEmDuDinh: 0, tongDaThu: 0, tongCanThu: 0 };
      theoTo[to].soEm++;
      theoTo[to].tongDaThu += h.daDong;
      theoTo[to].tongCanThu += khoan.soTienMoiEm;
      if (h.daDuDinh) theoTo[to].soEmDuDinh++;
    });

    return json({
      ok: true, khoan, danhSach,
      theoTo: Object.values(theoTo).sort((a, b) => (a.toSo ?? 99) - (b.toSo ?? 99)),
      tongDaThu: dong.reduce((a, d) => a + d.soTien, 0),
      tongCanThu: khoan.soTienMoiEm * hocSinh.length,
      soEmDaDuDinh: danhSach.filter((x) => x.daDuDinh).length,
    });
  }

  // Tổng quan toàn bộ quỹ
  // Lưu ý: .first() trả thẳng một dòng (không bọc trong { results: [...] }) — khác với .all().
  const [{ results: khoan }, { results: chi }, siSo] = await Promise.all([
    db.prepare(
      `SELECT k.id, k.ten, k.hoc_ky AS hocKy, k.so_tien_moi_em AS soTienMoiEm, k.dang_mo AS dangMo,
              k.dinh_ky_id AS dinhKyId, k.ky_so AS kySo,
              COALESCE(SUM(d.so_tien), 0) AS tongDaThu
         FROM quy_khoan k LEFT JOIN quy_dong d ON d.khoan_id = k.id
        GROUP BY k.id ORDER BY k.tao_luc DESC`
    ).all(),
    db.prepare('SELECT id, ngay, noi_dung AS noiDung, so_tien AS soTien, ghi_chu AS ghiChu, loai FROM quy_chi ORDER BY ngay DESC, id DESC').all(),
    db.prepare('SELECT COUNT(*) AS n FROM hoc_sinh WHERE dang_hoc = 1').first(),
  ]);

  const tongThu = khoan.reduce((a, k) => a + k.tongDaThu, 0);
  const tongChi = chi.reduce((a, c) => a + c.soTien, 0);

  const chiTheoLoai = {};
  chi.forEach((c) => { chiTheoLoai[c.loai || 'khac'] = (chiTheoLoai[c.loai || 'khac'] || 0) + c.soTien; });

  return json({
    ok: true,
    khoan: khoan.map((k) => ({ ...k, tongCanThu: k.soTienMoiEm * (siSo?.n || 0) })),
    chi, tongThu, tongChi,
    chiTheoLoai: LOAI_CHI.map(([ma, ten]) => ({ ma, ten, soTien: chiTheoLoai[ma] || 0 })).filter((x) => x.soTien > 0),
    tonQuy: tongThu - tongChi,
    siSo: siSo?.n || 0,
  });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const db = env.DB;

  if (than.hanhDong === 'tao_khoan') {
    const ten = chuoi(than.ten, 200);
    if (!ten) return loi('Chưa nhập tên khoản thu.');
    if (!soTienHopLe(than.soTienMoiEm)) return loi('Mức thu mỗi em không hợp lệ.');

    await chupCheckpoint(db, `Trước khi: mở khoản thu "${ten}"`, phien);
    const kq = await db.prepare(
      'INSERT INTO quy_khoan (ten, hoc_ky, so_tien_moi_em, ghi_chu) VALUES (?1, ?2, ?3, ?4)'
    ).bind(ten, Number(than.hocKy) === 2 ? 2 : 1, Number(than.soTienMoiEm), chuoi(than.ghiChu, 500)).run();

    return json({ ok: true, id: kq.meta.last_row_id });
  }

  if (than.hanhDong === 'ghi_dong') {
    const khoanId = Number(than.khoanId);
    const hocSinhId = Number(than.hocSinhId);
    if (!Number.isInteger(khoanId) || khoanId <= 0) return loi('Thiếu khoản thu.');
    if (!Number.isInteger(hocSinhId) || hocSinhId <= 0) return loi('Mã học sinh không hợp lệ.');
    if (!soTienHopLe(than.soTien) || Number(than.soTien) <= 0) return loi('Số tiền không hợp lệ.');
    const ngay = ngayHopLe(than.ngay) ? than.ngay : new Date().toISOString().slice(0, 10);

    const khoan = await db.prepare('SELECT id, ten FROM quy_khoan WHERE id = ?1').bind(khoanId).first();
    if (!khoan) return loi('Không tìm thấy khoản thu này.', 404);

    await chupCheckpoint(db, `Trước khi: ghi thu ${than.soTien}đ cho học sinh #${hocSinhId} (${khoan.ten})`, phien);
    const kq = await db.prepare(
      'INSERT INTO quy_dong (khoan_id, hoc_sinh_id, so_tien, ngay, ghi_chu) VALUES (?1, ?2, ?3, ?4, ?5)'
    ).bind(khoanId, hocSinhId, Number(than.soTien), ngay, chuoi(than.ghiChu, 300)).run();

    return json({ ok: true, id: kq.meta.last_row_id });
  }

  if (than.hanhDong === 'ghi_chi') {
    const noiDung = chuoi(than.noiDung, 300);
    if (!noiDung) return loi('Chưa nhập nội dung chi.');
    if (!soTienHopLe(than.soTien) || Number(than.soTien) <= 0) return loi('Số tiền không hợp lệ.');
    const ngay = ngayHopLe(than.ngay) ? than.ngay : new Date().toISOString().slice(0, 10);
    const loai = MA_LOAI_CHI.has(than.loai) ? than.loai : 'khac';

    await chupCheckpoint(db, `Trước khi: ghi chi ${than.soTien}đ — "${noiDung}"`, phien);
    const kq = await db.prepare(
      'INSERT INTO quy_chi (ngay, noi_dung, so_tien, ghi_chu, loai) VALUES (?1, ?2, ?3, ?4, ?5)'
    ).bind(ngay, noiDung, Number(than.soTien), chuoi(than.ghiChu, 300), loai).run();

    return json({ ok: true, id: kq.meta.last_row_id });
  }

  return loi('Hành động không hợp lệ.');
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const loai = q.get('loai');
  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bản ghi.');

  const BANG = { khoan: 'quy_khoan', dong: 'quy_dong', chi: 'quy_chi' };
  if (!BANG[loai]) return loi('Loại không hợp lệ.');

  await chupCheckpoint(env.DB, `Trước khi: xoá ${loai} #${id}`, phien);

  if (loai === 'khoan') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM quy_dong WHERE khoan_id = ?1').bind(id),
      env.DB.prepare('DELETE FROM quy_khoan WHERE id = ?1').bind(id),
    ]);
  } else {
    await env.DB.prepare(`DELETE FROM ${BANG[loai]} WHERE id = ?1`).bind(id).run();
  }

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: QUYEN });
