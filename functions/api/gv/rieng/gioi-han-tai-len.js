// Trần tải lên MỖI NGÀY của tài khoản được cấp quyền — giáo viên tự xem/chỉnh trên web, không
// cần sửa code (xem functions/_lib/thu-vien.js để biết cơ chế áp dụng thật).
//   GET   /api/gv/rieng/gioi-han-tai-len -> { gioiHanMB, macDinh, danhSachDaDung }
//         danhSachDaDung: mức đã tải HÔM NAY của từng tài khoản được cấp quyền, để giáo viên
//         biết ai sắp chạm trần/ai bất thường — KHÔNG phải để đặt trần.
//   PATCH /api/gv/rieng/gioi-han-tai-len { gioiHanMB } -> đặt mức mới (MB). gioiHanMB = 0/null
//         -> quay lại dùng mức mặc định.
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { GIOI_HAN_TAI_LEN_NGAY_PHU, gioiHanTaiLenNgayCuaLop, layMucDaTaiHomNay } from '../../../_lib/thu-vien.js';

const TOI_THIEU_MB = 1;
const TOI_DA_MB = 5000; // chặn gõ nhầm số khổng lồ vô nghĩa, không phải trần kỹ thuật thật

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const [gioiHan, dong] = await Promise.all([
    gioiHanTaiLenNgayCuaLop(env.DB, phien.lopId),
    env.DB.prepare('SELECT gioi_han_tai_len_ngay_byte AS gioiHanDat FROM lop WHERE id = ?1').bind(phien.lopId).first(),
  ]);

  // Gom danh tính của MỌI tài khoản được cấp quyền (tài khoản phụ + mã cá nhân có quyền) trong
  // lớp để tra mức đã tải hôm nay CÙNG LÚC — không hỏi CSDL từng người một.
  const [dsPhu, dsHocSinh] = await Promise.all([
    env.DB.prepare('SELECT id, ten FROM tai_khoan_phu WHERE lop_id = ?1 AND dang_hoat_dong = 1').bind(phien.lopId).all(),
    env.DB.prepare(
      `SELECT h.id, h.ho_ten AS hoTen FROM ma_ca_nhan m JOIN hoc_sinh h ON h.id = m.hoc_sinh_id
        WHERE m.lop_id = ?1 AND m.quyen != '' AND h.dang_hoc = 1`
    ).bind(phien.lopId).all(),
  ]);
  const danhSachTk = [
    ...dsPhu.results.map((r) => ({ danhTinh: `phu-${r.id}`, ten: r.ten })),
    ...dsHocSinh.results.map((r) => ({ danhTinh: `hs-${r.id}`, ten: r.hoTen })),
  ];
  const mucDaDung = await layMucDaTaiHomNay(env.DB, phien.lopId, danhSachTk.map((t) => t.danhTinh));

  return json({
    ok: true,
    gioiHanMB: Math.round(gioiHan / 1_000_000),
    macDinh: !dong?.gioiHanDat,
    danhSachDaDung: danhSachTk
      .map((t) => ({ ten: t.ten, daTaiByte: mucDaDung[t.danhTinh] || 0 }))
      .filter((t) => t.daTaiByte > 0)
      .sort((a, b) => b.daTaiByte - a.daTaiByte),
  });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const { gioiHanMB } = await docThan(request);

  if (!gioiHanMB) {
    // Để trống/0 -> quay lại dùng mặc định.
    await env.DB.prepare('UPDATE lop SET gioi_han_tai_len_ngay_byte = NULL WHERE id = ?1').bind(phien.lopId).run();
    return json({ ok: true, gioiHanMB: Math.round(GIOI_HAN_TAI_LEN_NGAY_PHU / 1_000_000) });
  }

  const soMB = Number(gioiHanMB);
  if (!Number.isFinite(soMB) || soMB < TOI_THIEU_MB || soMB > TOI_DA_MB) {
    return loi(`Mức trần phải từ ${TOI_THIEU_MB} đến ${TOI_DA_MB} MB.`);
  }

  await env.DB.prepare('UPDATE lop SET gioi_han_tai_len_ngay_byte = ?1 WHERE id = ?2').bind(Math.round(soMB * 1_000_000), phien.lopId).run();
  return json({ ok: true, gioiHanMB: Math.round(soMB) });
}, { canGiaoVien: true });
