// Thông báo công khai và thông báo lớp được phép xem. Chức năng biên tập đã được bỏ.
import { json, loi, layPhien, kiemTraPhienHieuLuc } from '../_lib/api.js';
export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);
    let phien = await layPhien(request, env);
    if (phien) {
      const check = await kiemTraPhienHieuLuc(phien, env);
      if (!check.hopLe) return loi('Phiên đã hết hiệu lực.', 401);
      phien = check.phienMoi || phien;
    }
    const { results } = await env.DB.prepare(`SELECT id, tieu_de AS tieuDe, noi_dung AS noiDung,
      noi_dung_dinh_dang AS noiDungDinhDang, anh_bia_url AS anhBiaUrl, loai, pham_vi AS phamVi,
      trang_thai AS trangThai, ghim, uu_tien AS uuTien, nguoi_tao_ten AS nguoiTaoTen,
      nguoi_tao_vai_tro AS nguoiTaoVaiTro, xuat_ban_luc AS xuatBanLuc, tao_luc AS taoLuc
      FROM campus_thong_bao WHERE trang_thai = 'published' AND (pham_vi = 'truong' OR lop_id = ?)
      ORDER BY ghim DESC, uu_tien DESC, tao_luc DESC LIMIT 50`).bind(phien?.lopId || null).all();
    return json({ ok: true, danhSach: results || [], thongBao: results || [] });
  } catch (err) { console.error('campus-thong-bao GET:', err); return loi('Không đọc được thông báo.', 500); }
}