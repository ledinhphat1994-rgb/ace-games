// API Kiểm tra và Quản lý Mã Truy Cập Bảng Tin Cộng Đồng
import { json, loi, layPhien, docThan, chuoi } from '../_lib/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien || phien.role !== 'teacher') {
      return loi('Chỉ giáo viên mới có quyền xem danh sách mã truy cập.', 403);
    }

    const rs = await db.prepare(`
      SELECT id, ma_code AS maCode, lop_id AS lopId, ten_goi AS tenGoi,
             so_lan_dung_toi_da AS soLanDungToiDa, so_lan_da_dung AS soLanDaDung,
             het_han_luc AS hetHanLuc, dang_hoat_dong AS dangHoatDong, tao_luc AS taoLuc
      FROM ma_truy_cap_cong_dong
      ORDER BY tao_luc DESC
    `).all();

    return json({ ok: true, danhSachMa: rs.results || [] });
  } catch (e) {
    console.error('kiem-tra-ma-cong-dong GET error:', e);
    return loi('Không tải được danh sách mã.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const body = await docThan(request);
    const hanhDong = chuoi(body.hanhDong || 'kiem_tra');

    // 1. GIÁO VIÊN: TẠO MÃ MỚI HOẶC THU HỒI
    if (hanhDong === 'tao_ma' || hanhDong === 'thu_hoi') {
      const phien = await layPhien(request, env);
      if (!phien || phien.role !== 'teacher') {
        return loi('Chỉ giáo viên mới có quyền quản lý mã truy cập.', 403);
      }

      if (hanhDong === 'thu_hoi') {
        const id = Number(body.id);
        if (!id || isNaN(id)) return loi('Thiếu ID mã cần thu hồi.');
        await db.prepare('UPDATE ma_truy_cap_cong_dong SET dang_hoat_dong = 0 WHERE id = ?1').bind(id).run();
        return json({ ok: true, thongBao: 'Đã thu hồi mã truy cập thành công.' });
      }

      const maCode = chuoi(body.maCode, 50).toUpperCase().replace(/\s+/g, '');
      const lopId = Number(body.lopId) || 1;
      const tenGoi = chuoi(body.tenGoi || 'Mã giáo viên cấp', 100);
      const soLanDungToiDa = Math.max(0, Number(body.soLanDungToiDa) || 0);
      const hetHanLuc = body.hetHanLuc ? chuoi(body.hetHanLuc, 30) : null;

      if (!maCode || maCode.length < 4) {
        return loi('Mã truy cập phải từ 4 ký tự trở lên.');
      }

      await db.prepare(`
        INSERT INTO ma_truy_cap_cong_dong (
          ma_code, lop_id, ten_goi, so_lan_dung_toi_da, het_han_luc, tao_boi_khoa
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      `).bind(maCode, lopId, tenGoi, soLanDungToiDa, hetHanLuc, phien.hocSinhId || phien.phuId || 'giao_vien').run();

      return json({ ok: true, thongBao: 'Đã tạo mã truy cập mới thành công.' });
    }

    // 2. KHÁCH / HỌC SINH: KIỂM TRA MÃ TRUY CẬP ĐỂ VÀO BẢNG TIN
    const maCode = chuoi(body.maCode, 50).toUpperCase().replace(/\s+/g, '');
    if (!maCode) {
      return new Response(JSON.stringify({ ok: false, hopLe: false, loi: 'Vui lòng nhập mã truy cập.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const row = await db.prepare(`
      SELECT id, ma_code AS maCode, lop_id AS lopId, ten_goi AS tenGoi,
             so_lan_dung_toi_da AS soLanDungToiDa, so_lan_da_dung AS soLanDaDung,
             het_han_luc AS hetHanLuc, dang_hoat_dong AS dangHoatDong
      FROM ma_truy_cap_cong_dong
      WHERE ma_code = ?1 AND dang_hoat_dong = 1
    `).bind(maCode).first();

    if (!row) {
      return new Response(JSON.stringify({ ok: false, hopLe: false, loi: 'Mã truy cập không tồn tại hoặc đã bị khoá.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Kiểm tra hạn sử dụng
    if (row.hetHanLuc) {
      const hetHan = Date.parse(row.hetHanLuc);
      if (!isNaN(hetHan) && Date.now() > hetHan) {
        return new Response(JSON.stringify({ ok: false, hopLe: false, loi: 'Mã truy cập này đã hết hạn sử dụng.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Kiểm tra số lần sử dụng tối đa
    if (row.soLanDungToiDa > 0 && row.soLanDaDung >= row.soLanDungToiDa) {
      return new Response(JSON.stringify({ ok: false, hopLe: false, loi: 'Mã truy cập này đã đạt giới hạn lượt sử dụng.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Tăng số lượt đã dùng
    await db.prepare(`
      UPDATE ma_truy_cap_cong_dong
      SET so_lan_da_dung = so_lan_da_dung + 1
      WHERE id = ?1
    `).bind(row.id).run();

    return json({
      ok: true,
      hopLe: true,
      lopId: row.lopId,
      lopTen: 'Lớp 10A7',
      tenGoi: row.tenGoi,
      quyenTruyCap: true,
      thongBao: 'Xác thực mã truy cập thành công. Chào mừng vào Bảng tin cộng đồng!'
    });
  } catch (e) {
    console.error('kiem-tra-ma-cong-dong POST error:', e);
    return loi('Lỗi khi kiểm tra mã truy cập. Thử lại sau.', 500);
  }
}
