// GET /api/gv/tong-quan — bảng điều khiển của giáo viên chủ nhiệm.
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const homNay = url.searchParams.get('ngay') || new Date().toISOString().slice(0, 10);
  const lopId = phien.lopId;

  // 30 ngày gần nhất tính từ ngày đang xem.
  const tuNgay = new Date(homNay + 'T00:00:00Z');
  tuNgay.setUTCDate(tuNgay.getUTCDate() - 30);
  const moc = tuNgay.toISOString().slice(0, 10);

  const [siSo, ddHomNay, vangNhieu, theoDoi, keHoachToi, hoanCanh] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM hoc_sinh WHERE dang_hoc = 1 AND lop_id = ?1').bind(lopId).first(),

    db.prepare(
      `SELECT buoi, trang_thai AS trangThai, COUNT(*) AS n
         FROM diem_danh WHERE ngay = ?1 AND buoi NOT LIKE '%_phu' AND lop_id = ?2 GROUP BY buoi, trang_thai`
    ).bind(homNay, lopId).all(),

    // Toàn bộ ứng viên có ít nhất 1 buổi không "có mặt" trong 30 ngày — KHÔNG giới hạn LIMIT ở đây,
    // vì đây là nguồn dữ liệu để tính "Cần chú ý" (lọc/sắp xếp lại bên dưới), không phải danh sách
    // hiển thị trực tiếp. Sĩ số lớp nhỏ (~37 em) nên không cần lo về số dòng.
    db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vangKhongPhep,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vangPhep,
              SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre
         FROM hoc_sinh h JOIN diem_danh d ON d.hoc_sinh_id = h.id
        WHERE d.ngay >= ?1 AND d.trang_thai <> 'co_mat' AND d.buoi NOT LIKE '%_phu' AND h.lop_id = ?2
        GROUP BY h.id
        HAVING vangKhongPhep + vangPhep + tre > 0`
    ).bind(moc, lopId).all(),


    db.prepare(
      `SELECT muc, trang_thai AS trangThai, COUNT(*) AS n
         FROM theo_doi WHERE lop_id = ?1 GROUP BY muc, trang_thai`
    ).bind(lopId).all(),

    // "Sắp tới" lấy thẳng từ Thông báo (không còn bảng ke_hoach riêng nữa) — thông báo nào
    // ghi ngày trong tương lai (vd: lịch kiểm tra, lễ khai giảng…) đều coi là một mốc sắp tới.
    db.prepare(
      `SELECT id, ngay, tieu_de AS tieuDe, muc_do AS mucDo
         FROM thong_bao WHERE ngay >= ?1 AND hien = 1 AND lop_id = ?2 ORDER BY ngay LIMIT 5`
    ).bind(homNay, lopId).all(),

    db.prepare(
      `SELECT id, ho_ten AS hoTen, hoan_canh AS hoanCanh
         FROM hoc_sinh WHERE dang_hoc = 1 AND hoan_canh <> '' AND lop_id = ?1 ORDER BY id`
    ).bind(lopId).all(),
  ]);

  // --- Cần chú ý: dựa trên chuyên cần — >=1 vắng KHÔNG phép, HOẶC >=2 lần trễ. Vắng CÓ phép
  //   không tính (đã được duyệt, là việc hành chính bình thường, không phải dấu hiệu xấu).
  //   "diemXepHang" CHỈ dùng để sắp xếp thứ tự hiển thị — mỗi em luôn kèm "lyDo" bằng tiếng
  //   Việt giải thích rõ vì sao xuất hiện.
  const canChuY = vangNhieu.results.map((h) => {
    const attendanceConcern = h.vangKhongPhep >= 1 || h.tre >= 2;

    const phanLyDo = [];
    if (h.vangKhongPhep >= 1) phanLyDo.push(`${h.vangKhongPhep} vắng không phép`);
    if (h.tre >= 2) phanLyDo.push(`${h.tre} lần đi trễ`);

    return {
      ...h,
      concern: attendanceConcern,
      lyDo: phanLyDo.join(' · '),
      diemXepHang: h.vangKhongPhep * 3 + h.tre * 1,
    };
  }).filter((h) => h.concern).sort((a, b) => b.diemXepHang - a.diemXepHang).slice(0, 8);

  // Tổng gộp mọi buổi (giữ để không phá phần đang dùng) + tách riêng theo từng buổi.
  const tongTheoTrangThai = {};
  const theoBuoi = {};
  ddHomNay.results.forEach((r) => {
    tongTheoTrangThai[r.trangThai] = (tongTheoTrangThai[r.trangThai] || 0) + r.n;
    theoBuoi[r.buoi] = theoBuoi[r.buoi] || {};
    theoBuoi[r.buoi][r.trangThai] = r.n;
  });

  return json({
    ok: true,
    ngay: homNay,
    siSo: siSo?.n ?? 0,
    diemDanhHomNay: tongTheoTrangThai,
    diemDanhHomNayTheoBuoi: theoBuoi,
    vangNhieu: vangNhieu.results,
    theoDoi: theoDoi.results,
    keHoachSapToi: keHoachToi.results,
    hoanCanh: hoanCanh.results,
    canChuY,
  });
}, { canGiaoVien: true });
