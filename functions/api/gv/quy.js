// Thủ quỹ lớp.
//   GET    /api/gv/quy                -> tổng quan: mọi khoản thu, mọi khoản chi, tồn quỹ
//   GET    /api/gv/quy?khoanId=1      -> chi tiết một khoản: từng em đã đóng bao nhiêu
//   POST   /api/gv/quy  { hanhDong: 'tao_khoan' | 'ghi_dong' | 'ghi_chi', ... }
//   PATCH  /api/gv/quy  { banGhi: 'khoan'|'dong'|'chi', id, ... } -> sửa một bản ghi đã ghi sai
//   DELETE /api/gv/quy?loai=khoan&id=   |   ?loai=dong&id=   |   ?loai=chi&id=
//
// Công thức: Tồn quỹ = Tổng tiền đã thu (quy_dong) − Tổng tiền đã chi (quy_chi).
// Mỗi khoản thu có "mức thu mỗi em" để tính em nào đã đóng đủ / còn thiếu.
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';
import { chupCheckpoint } from '../../_lib/quy-checkpoint.js';

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

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const khoanId = Number(new URL(request.url).searchParams.get('khoanId'));

  if (Number.isInteger(khoanId) && khoanId > 0) {
    // dinhKyTen/dinhKyChuKy/dinhKySoKy: chỉ có khi khoản này là một kỳ do mẫu "Thu cố định"
    // sinh ra — dùng để chú thích rõ "đây là kỳ mấy trong tổng số bao nhiêu kỳ" khi xem chi
    // tiết khoản (xem veChiTietKhoan ở trang-quy.js).
    const khoan = await db.prepare(
      `SELECT k.id, k.ten, k.hoc_ky AS hocKy, k.so_tien_moi_em AS soTienMoiEm, k.ghi_chu AS ghiChu, k.dang_mo AS dangMo,
              k.dinh_ky_id AS dinhKyId, k.ky_so AS kySo, k.ngay_bat_dau AS ngayBatDau, k.ngay_ket_thuc AS ngayKetThuc,
              dk.ten AS dinhKyTen, dk.chu_ky AS dinhKyChuKy, dk.so_ky AS dinhKySoKy
         FROM quy_khoan k LEFT JOIN quy_dinh_ky dk ON dk.id = k.dinh_ky_id
        WHERE k.id = ?1 AND k.lop_id = ?2`
    ).bind(khoanId, phien.lopId).first();
    if (!khoan) return loi('Không tìm thấy khoản thu này.', 404);

    const [{ results: hocSinh }, { results: dong }] = await Promise.all([
      db.prepare('SELECT id, ho_ten AS hoTen, to_so AS toSo, COALESCE(so_thu_tu, id) AS soThuTu FROM hoc_sinh WHERE dang_hoc = 1 AND lop_id = ?1 ORDER BY so_thu_tu, id').bind(phien.lopId).all(),
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
        hocSinhId: h.id, soThuTu: h.soThuTu || h.id, hoTen: h.hoTen, toSo: h.toSo,
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
  const [{ results: khoan }, { results: chi }, siSo, { results: dongTheoEm }] = await Promise.all([
    // dinhKyTen/dinhKyChuKy/dinhKySoKy: chỉ có khi khoản này là một kỳ của mẫu "Thu cố định" —
    // dùng để GOM các kỳ cùng một mẫu lại thành một nhóm trên giao diện (xem trang-quy.js),
    // thay vì liệt kê phẳng hàng chục dòng trông rất giống nhau, khó phân biệt.
    db.prepare(
      `SELECT k.id, k.ten, k.hoc_ky AS hocKy, k.so_tien_moi_em AS soTienMoiEm, k.dang_mo AS dangMo,
              k.dinh_ky_id AS dinhKyId, k.ky_so AS kySo, k.ngay_bat_dau AS ngayBatDau, k.ngay_ket_thuc AS ngayKetThuc,
              dk.ten AS dinhKyTen, dk.chu_ky AS dinhKyChuKy, dk.so_ky AS dinhKySoKy,
              COALESCE(SUM(d.so_tien), 0) AS tongDaThu
         FROM quy_khoan k LEFT JOIN quy_dong d ON d.khoan_id = k.id
                          LEFT JOIN quy_dinh_ky dk ON dk.id = k.dinh_ky_id
        WHERE k.lop_id = ?1
        GROUP BY k.id ORDER BY k.tao_luc DESC`
    ).bind(phien.lopId).all(),
    db.prepare('SELECT id, ngay, noi_dung AS noiDung, so_tien AS soTien, ghi_chu AS ghiChu, loai FROM quy_chi WHERE lop_id = ?1 ORDER BY ngay DESC, id DESC').bind(phien.lopId).all(),
    db.prepare('SELECT COUNT(*) AS n FROM hoc_sinh WHERE dang_hoc = 1 AND lop_id = ?1').bind(phien.lopId).first(),
    // Số tiền từng em đã đóng theo TỪNG khoản — dùng để đếm "bao nhiêu em đã đóng đủ" ngay
    // ở dòng tóm tắt (thu gọn), khỏi phải mở rộng khoản mới biết.
    db.prepare(
      `SELECT khoan_id AS khoanId, hoc_sinh_id AS hocSinhId, SUM(so_tien) AS tong
         FROM quy_dong WHERE lop_id = ?1 GROUP BY khoan_id, hoc_sinh_id`
    ).bind(phien.lopId).all(),
  ]);

  const emDuTheoKhoan = {};
  dongTheoEm.forEach((r) => { emDuTheoKhoan[r.khoanId] = emDuTheoKhoan[r.khoanId] || []; emDuTheoKhoan[r.khoanId].push(r); });

  const tongThu = khoan.reduce((a, k) => a + k.tongDaThu, 0);
  const tongChi = chi.reduce((a, c) => a + c.soTien, 0);

  const chiTheoLoai = {};
  chi.forEach((c) => { chiTheoLoai[c.loai || 'khac'] = (chiTheoLoai[c.loai || 'khac'] || 0) + c.soTien; });

  return json({
    ok: true,
    khoan: khoan
      .slice()
      .sort((a, b) => {
        const soThuTu = (k) => {
          if (Number.isFinite(k.kySo) && k.kySo > 0) return k.kySo;
          const m = /(?:tuần|tháng|kỳ|ky)\s*(\d+)/i.exec(k.ten || '');
          return m ? Number(m[1]) : Infinity;
        };
        const soA = soThuTu(a);
        const soB = soThuTu(b);
        if (soA !== soB) return soA - soB;
        return (a.id || 0) - (b.id || 0);
      })
      .map((k) => {
        const soEmDaDu = (emDuTheoKhoan[k.id] || []).filter((r) => r.tong >= k.soTienMoiEm).length;
        return {
          ...k,
          tongCanThu: k.soTienMoiEm * (siSo?.n || 0),
          soEmDaDu,
          soEmChuaDu: (siSo?.n || 0) - soEmDaDu,
        };
      }),
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

    // ngayBatDau/ngayKetThuc: khoảng thời gian thu của "Thu linh động" — không bắt buộc (khoản
    // thu tạo qua đường cũ, hoặc gọi trực tiếp API, có thể không kèm) nhưng nếu có thì phải
    // hợp lệ và kết thúc không trước bắt đầu.
    let ngayBatDau = null, ngayKetThuc = null;
    if (than.ngayBatDau !== undefined && than.ngayBatDau !== '') {
      if (!ngayHopLe(than.ngayBatDau) || !ngayHopLe(than.ngayKetThuc)) {
        return loi('Ngày bắt đầu/kết thúc không hợp lệ.');
      }
      if (than.ngayKetThuc < than.ngayBatDau) return loi('Ngày kết thúc phải từ ngày bắt đầu trở về sau.');
      ngayBatDau = than.ngayBatDau;
      ngayKetThuc = than.ngayKetThuc;
    }

    await chupCheckpoint(db, `Trước khi: mở khoản thu "${ten}" (Thu linh động)`, phien);
    const kq = await db.prepare(
      'INSERT INTO quy_khoan (ten, hoc_ky, so_tien_moi_em, ghi_chu, ngay_bat_dau, ngay_ket_thuc, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    ).bind(ten, Number(than.hocKy) === 2 ? 2 : 1, Number(than.soTienMoiEm), chuoi(than.ghiChu, 500), ngayBatDau, ngayKetThuc, phien.lopId).run();

    return json({ ok: true, id: kq.meta.last_row_id });
  }

  if (than.hanhDong === 'ghi_dong') {
    const khoanId = Number(than.khoanId);
    const hocSinhId = Number(than.hocSinhId);
    if (!Number.isInteger(khoanId) || khoanId <= 0) return loi('Thiếu khoản thu.');
    if (!Number.isInteger(hocSinhId) || hocSinhId <= 0) return loi('Mã học sinh không hợp lệ.');
    if (!soTienHopLe(than.soTien) || Number(than.soTien) <= 0) return loi('Số tiền không hợp lệ.');
    const ngay = ngayHopLe(than.ngay) ? than.ngay : new Date().toISOString().slice(0, 10);

    const khoan = await db.prepare('SELECT id, ten, dinh_ky_id AS dinhKyId FROM quy_khoan WHERE id = ?1 AND lop_id = ?2').bind(khoanId, phien.lopId).first();
    if (!khoan) return loi('Không tìm thấy khoản thu này.', 404);
    const hocSinh = await db.prepare('SELECT ho_ten AS hoTen FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(hocSinhId, phien.lopId).first();
    if (!hocSinh) return loi('Mã học sinh không hợp lệ.');
    const loaiThu = khoan.dinhKyId ? 'Thu cố định' : 'Thu linh động';

    await chupCheckpoint(db,
      `Trước khi: ghi thu ${than.soTien}đ — ${hocSinh?.hoTen || 'học sinh #' + hocSinhId} nộp khoản `
      + `"${khoan.ten}" (${loaiThu})`, phien);
    const kq = await db.prepare(
      'INSERT INTO quy_dong (khoan_id, hoc_sinh_id, so_tien, ngay, ghi_chu, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    ).bind(khoanId, hocSinhId, Number(than.soTien), ngay, chuoi(than.ghiChu, 300), phien.lopId).run();

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
      'INSERT INTO quy_chi (ngay, noi_dung, so_tien, ghi_chu, loai, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    ).bind(ngay, noiDung, Number(than.soTien), chuoi(than.ghiChu, 300), loai, phien.lopId).run();

    return json({ ok: true, id: kq.meta.last_row_id });
  }

  return loi('Hành động không hợp lệ.');
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const db = env.DB;
  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bản ghi.');

  if (than.banGhi === 'khoan') {
    const khoan = await db.prepare('SELECT ten, dinh_ky_id AS dinhKyId FROM quy_khoan WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
    if (!khoan) return loi('Không tìm thấy khoản thu này.', 404);

    const dat = []; const thamSo = [];
    const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };
    if (than.ten !== undefined) {
      const t = chuoi(than.ten, 200);
      if (!t) return loi('Tên khoản thu không được để trống.');
      them('ten', t);
    }
    if (than.soTienMoiEm !== undefined) {
      if (!soTienHopLe(than.soTienMoiEm)) return loi('Mức thu mỗi em không hợp lệ.');
      them('so_tien_moi_em', Number(than.soTienMoiEm));
    }
    if (than.ghiChu !== undefined) them('ghi_chu', chuoi(than.ghiChu, 500));
    if (than.dangMo !== undefined) them('dang_mo', than.dangMo ? 1 : 0);
    if (than.ngayBatDau !== undefined || than.ngayKetThuc !== undefined) {
      const nbd = than.ngayBatDau || null;
      const nkt = than.ngayKetThuc || null;
      if (nbd && !ngayHopLe(nbd)) return loi('Ngày bắt đầu không hợp lệ.');
      if (nkt && !ngayHopLe(nkt)) return loi('Ngày kết thúc không hợp lệ.');
      if (nbd && nkt && nkt < nbd) return loi('Ngày kết thúc phải từ ngày bắt đầu trở về sau.');
      them('ngay_bat_dau', nbd);
      them('ngay_ket_thuc', nkt);
    }
    if (!dat.length) return loi('Không có gì để sửa.');

    await chupCheckpoint(db,
      `Trước khi: sửa khoản thu "${khoan.ten}" (${khoan.dinhKyId ? 'Thu cố định' : 'Thu linh động'})`, phien);
    thamSo.push(id);
    await db.prepare(`UPDATE quy_khoan SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`).bind(...thamSo).run();
    return json({ ok: true });
  }

  if (than.banGhi === 'dong') {
    const dong = await db.prepare(
      `SELECT d.*, h.ho_ten AS hoTen, k.ten AS khoanTen, k.dinh_ky_id AS dinhKyId
         FROM quy_dong d
         JOIN hoc_sinh h ON h.id = d.hoc_sinh_id
         JOIN quy_khoan k ON k.id = d.khoan_id
        WHERE d.id = ?1 AND d.lop_id = ?2`
    ).bind(id, phien.lopId).first();
    if (!dong) return loi('Không tìm thấy lần ghi thu này.', 404);

    const soTien = than.soTien !== undefined ? Number(than.soTien) : dong.so_tien;
    if (!soTienHopLe(soTien) || soTien <= 0) return loi('Số tiền không hợp lệ.');
    const ngay = than.ngay !== undefined && ngayHopLe(than.ngay) ? than.ngay : dong.ngay;
    const ghiChu = than.ghiChu !== undefined ? chuoi(than.ghiChu, 300) : dong.ghi_chu;

    await chupCheckpoint(db,
      `Trước khi: sửa lần thu ${dong.so_tien}đ — ${dong.hoTen} nộp khoản "${dong.khoanTen}" `
      + `(${dong.dinhKyId ? 'Thu cố định' : 'Thu linh động'})`, phien);
    await db.prepare('UPDATE quy_dong SET so_tien = ?1, ngay = ?2, ghi_chu = ?3 WHERE id = ?4')
      .bind(soTien, ngay, ghiChu, id).run();
    return json({ ok: true });
  }

  if (than.banGhi === 'chi') {
    const chi = await db.prepare('SELECT * FROM quy_chi WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
    if (!chi) return loi('Không tìm thấy khoản chi này.', 404);

    const noiDung = than.noiDung !== undefined ? chuoi(than.noiDung, 300) : chi.noi_dung;
    if (!noiDung) return loi('Nội dung không được để trống.');
    const soTien = than.soTien !== undefined ? Number(than.soTien) : chi.so_tien;
    if (!soTienHopLe(soTien) || soTien <= 0) return loi('Số tiền không hợp lệ.');
    const ngay = than.ngay !== undefined && ngayHopLe(than.ngay) ? than.ngay : chi.ngay;
    const loaiChi = than.loai !== undefined ? (MA_LOAI_CHI.has(than.loai) ? than.loai : chi.loai) : chi.loai;
    const ghiChu = than.ghiChu !== undefined ? chuoi(than.ghiChu, 300) : chi.ghi_chu;

    await chupCheckpoint(db, `Trước khi: sửa khoản chi ${chi.so_tien}đ — "${chi.noi_dung}"`, phien);
    await db.prepare('UPDATE quy_chi SET noi_dung = ?1, so_tien = ?2, ngay = ?3, loai = ?4, ghi_chu = ?5 WHERE id = ?6')
      .bind(noiDung, soTien, ngay, loaiChi, ghiChu, id).run();
    return json({ ok: true });
  }

  return loi('Loại bản ghi (banGhi) không hợp lệ.');
}, { canGiaoVien: true, quyenCan: QUYEN });

// DELETE ?loai=&id=            -> xoá một bản ghi (như trước)
// DELETE ?loai=&ids=1,2,3      -> xoá nhiều bản ghi đã chọn (chỉ khoan/chi)
// DELETE ?loai=&tatCa=1        -> xoá SẠCH toàn bộ danh mục đó (chỉ khoan/chi)
// Tài khoản thủ quỹ (phu + quyền 'quy') xoá khoản thu/chi/lần đóng BÌNH THƯỜNG như giáo viên —
// mọi thao tác đều tự chụp checkpoint trước khi xoá (xem chupCheckpoint bên dưới) nên luôn
// khôi phục lại được. Ranh giới duy nhất: CHÍNH lịch sử khôi phục đó (xem/xoá checkpoint) thì
// mãi mãi chỉ giáo viên chủ nhiệm mới đụng tới được — xem functions/api/gv/quy-checkpoint.js
// (canGiaoVien không có quyenCan = chỉ giáo viên), để tránh trường hợp một mã bị lộ rồi tự
// xoá luôn dấu vết trong lịch sử khôi phục.
export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const loai = q.get('loai');

  const BANG = { khoan: 'quy_khoan', dong: 'quy_dong', chi: 'quy_chi' };
  if (!BANG[loai]) return loi('Loại không hợp lệ.');

  // Xoá hàng loạt/xoá sạch (tatCa/ids) CHỈ giáo viên — khác với xoá TỪNG bản ghi một (nhánh
  // else bên dưới) vẫn cho tài khoản thủ quỹ dùng bình thường. Cùng nguyên tắc đã áp dụng cho
  // 3 thư viện media (xem functions/api/gv/anh.js): một mã thủ quỹ bị lộ/đoán được chỉ có thể
  // gây gián đoạn dữ liệu quỹ ở mức "xoá từng dòng", không thể xoá sạch toàn bộ khoản thu/chi
  // chỉ bằng một request.
  const laGiaoVien = phien.role === 'teacher';
  if ((q.get('tatCa') === '1' || q.get('ids')) && !laGiaoVien) {
    return loi('Tài khoản thủ quỹ chỉ xoá được từng khoản một. Nhờ giáo viên chủ nhiệm nếu cần xoá nhiều khoản/xoá sạch cùng lúc.', 403);
  }

  let ids;
  if (q.get('tatCa') === '1') {
    if (loai !== 'khoan' && loai !== 'chi') return loi('Chỉ xoá tất cả được với khoản thu hoặc khoản chi.');
    const { results } = await env.DB.prepare(`SELECT id FROM ${BANG[loai]} WHERE lop_id = ?1`).bind(phien.lopId).all();
    ids = results.map((r) => r.id);
  } else if (q.get('ids')) {
    if (loai !== 'khoan' && loai !== 'chi') return loi('Chỉ xoá hàng loạt được với khoản thu hoặc khoản chi.');
    const yeuCau = [...new Set(q.get('ids').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    if (!yeuCau.length) return json({ ok: true, daXoa: 0 });
    const cho0 = yeuCau.map(() => '?').join(',');
    const { results } = await env.DB.prepare(`SELECT id FROM ${BANG[loai]} WHERE lop_id = ? AND id IN (${cho0})`).bind(phien.lopId, ...yeuCau).all();
    ids = results.map((r) => r.id);
  } else {
    const id = Number(q.get('id'));
    if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bản ghi.');
    const hang = await env.DB.prepare(`SELECT id FROM ${BANG[loai]} WHERE id = ? AND lop_id = ?`).bind(id, phien.lopId).first();
    ids = hang ? [id] : [];
  }
  if (!ids.length) return json({ ok: true, daXoa: 0 });

  // "dong" (một lần ghi thu) luôn xoá từng cái một (không có xoá hàng loạt) — nêu rõ ai nộp,
  // khoản nào, kiểu gì thay vì chỉ ghi số id trần trụi, để xem lại lịch sử khôi phục hiểu ngay
  // đang khôi phục lại đúng lần thu của ai.
  let moTa;
  if (loai === 'dong') {
    const rec = await env.DB.prepare(
      `SELECT d.so_tien AS soTien, h.ho_ten AS hoTen, k.ten AS khoanTen, k.dinh_ky_id AS dinhKyId
         FROM quy_dong d JOIN hoc_sinh h ON h.id = d.hoc_sinh_id JOIN quy_khoan k ON k.id = d.khoan_id
        WHERE d.id = ?1`
    ).bind(ids[0]).first();
    moTa = rec
      ? `lần thu ${rec.soTien}đ — ${rec.hoTen} nộp khoản "${rec.khoanTen}" (${rec.dinhKyId ? 'Thu cố định' : 'Thu linh động'})`
      : 'một lần ghi thu';
  } else {
    moTa = `${ids.length} ${loai === 'khoan' ? 'khoản thu' : 'khoản chi'}`;
  }
  await chupCheckpoint(env.DB, `Trước khi: xoá ${moTa}`, phien);

  const cho = ids.map(() => '?').join(',');
  if (loai === 'khoan') {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM quy_dong WHERE khoan_id IN (${cho})`).bind(...ids),
      env.DB.prepare(`DELETE FROM quy_khoan WHERE id IN (${cho})`).bind(...ids),
    ]);
  } else {
    await env.DB.prepare(`DELETE FROM ${BANG[loai]} WHERE id IN (${cho})`).bind(...ids).run();
  }

  return json({ ok: true, daXoa: ids.length });
}, { canGiaoVien: true, quyenCan: QUYEN, choPhepXoaPhu: true });

