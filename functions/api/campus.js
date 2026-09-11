// API Discovery công khai của Digital Campus — dành cho KHÁCH chưa đăng nhập.
// Chỉ trả các trường an toàn của phòng toàn trường + sự kiện campus.
// TUYỆT ĐỐI KHÔNG trả: tên học sinh, khoá phiên, lop_id, danh sách thành viên,
// phòng riêng của lớp, hay bất kỳ dữ liệu riêng tư nào của lớp.
import { json, loi, ngayVNHomNay } from '../_lib/api.js';

const NHIP_HIEU_LUC = '-90 seconds';

function trangThaiSuKien(batDau, ketThuc, bayGio) {
  const bd = Date.parse(batDau), kt = Date.parse(ketThuc);
  if (bayGio >= bd && bayGio <= kt) return 'dang_dien_ra';
  if (bayGio < bd) return 'sap_dien_ra';
  return 'da_ket_thuc';
}

export async function onRequestGet({ env }) {
  try {
    const db = env.DB;

    // Phòng toàn trường đang mở — KHÔNG kèm chủ phòng, lớp hay danh tính.
    const phongs = await db.prepare(
      `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.tao_luc AS taoLuc,
              p.access_mode, p.suc_chua AS sucChua,
              (SELECT COUNT(*) FROM phong_thanh_vien v
                WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?1)) AS soNguoi
         FROM phong p
        WHERE p.trang_thai = 'mo' AND p.pham_vi = 'truong' AND p.chu_phong_khoa != 'he-thong'
        ORDER BY soNguoi DESC, p.tao_luc DESC LIMIT 30`
    ).bind(NHIP_HIEU_LUC).all();

    // Số người đang hoạt động — DISTINCT khoá phiên trong các phòng toàn trường đang mở.
    const dd = await db.prepare(
      `SELECT COUNT(DISTINCT v.khoa) AS n
         FROM phong_thanh_vien v
         JOIN phong p ON p.id = v.phong_id
        WHERE p.trang_thai = 'mo'
          AND p.pham_vi = 'truong'
          AND datetime(v.hoat_dong_luc) > datetime('now', ?1)`
    ).bind(NHIP_HIEU_LUC).first();

    // Sự kiện campus — chỉ trường an toàn.
    const suKienRs = await db.prepare(
      `SELECT id, tieu_de AS tieuDe, mo_ta AS moTa, loai, bat_dau AS batDau,
              ket_thuc AS ketThuc, phong_id AS phongId, noi_bat AS noiBat, tao_luc AS taoLuc
         FROM su_kien_campus
        WHERE trang_thai = 'hoat_dong' AND datetime(ket_thuc) > datetime('now', '-2 hours')
        ORDER BY noi_bat DESC, bat_dau ASC LIMIT 10`
    ).all().catch(() => ({ results: [] }));

    const bayGio = Date.now();
    const homNayVN = ngayVNHomNay();
    const suKien = (suKienRs.results || []).map(r => ({
      ...r,
      noiBat: !!r.noiBat,
      trangThai: trangThaiSuKien(r.batDau, r.ketThuc, bayGio),
      conLaiPhut: Math.max(0, Math.round((Date.parse(r.batDau) - bayGio) / 60000)),
      homNay: new Date(Date.parse(r.batDau) + 7 * 3600 * 1000).toISOString().slice(0, 10) === homNayVN
    }));

    return json({
      ok: true,
      phongs: phongs.results || [],
      dangHoatDong: dd?.n || 0,
      suKien
    });
  } catch (e) {
    console.error('campus GET:', e);
    return loi('Không đọc được dữ liệu campus.', 500);
  }
}
