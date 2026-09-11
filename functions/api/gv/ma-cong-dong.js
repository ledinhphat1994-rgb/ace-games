// API Giáo viên Quản trị Mã Mời & Quyền Thành Viên Bảng Tin Cộng Đồng (Phase 4A.1)
import { json, loi, layPhien, docThan, chuoi } from '../../_lib/api.js';

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

function sinhMaNgauNhien(tienTo = 'A7') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randBytes = new Uint8Array(16);
  crypto.getRandomValues(randBytes);
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) part1 += chars[randBytes[i] % chars.length];
  for (let i = 4; i < 16; i++) part2 += chars[randBytes[i] % chars.length];
  return `${tienTo.toUpperCase()}-${part1}-${part2}`;
}

export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien || phien.role !== 'teacher') {
      return loi('Chỉ giáo viên mới có quyền xem danh sách mã mời.', 403);
    }

    const lopId = phien.lopId;
    if (!lopId) return loi('Phiên không có lớp hợp lệ.', 403);

    // 1. Danh sách mã mời đã tạo (che giấu ký tự bí mật, không bao giờ lộ plaintext)
    const rsMa = await db.prepare(`
      SELECT m.id, m.lop_id AS lopId, m.hoc_sinh_id AS hocSinhId, hsTarget.ho_ten AS hocSinhTen,
             m.ten_goi AS tenGoi, m.ma_hien_thi AS maHienThi,
             m.so_lan_dung_toi_da AS soLanDungToiDa, m.so_lan_da_dung AS soLanDaDung,
             m.da_dung_boi_hoc_sinh_id AS daDungBoiHocSinhId, hsUsed.ho_ten AS daDungBoiHocSinhTen,
             m.da_dung_luc AS daDungLuc, m.het_han_luc AS hetHanLuc,
             m.dang_hoat_dong AS dangHoatDong, m.tao_luc AS taoLuc
      FROM ma_truy_cap_cong_dong m
      LEFT JOIN hoc_sinh hsTarget ON hsTarget.id = m.hoc_sinh_id AND hsTarget.lop_id = m.lop_id
      LEFT JOIN hoc_sinh hsUsed ON hsUsed.id = m.da_dung_boi_hoc_sinh_id AND hsUsed.lop_id = m.lop_id
      WHERE m.lop_id = ?1
      ORDER BY m.id DESC
    `).bind(lopId).all();

    const now = Date.now();
    const danhSachMa = (rsMa.results || []).map(row => {
      let trangThai = 'chua_dung';
      if (!row.dangHoatDong) {
        trangThai = 'thu_hoi';
      } else if (row.soLanDungToiDa > 0 && row.soLanDaDung >= row.soLanDungToiDa) {
        trangThai = 'da_dung';
      } else if (row.hetHanLuc && !isNaN(Date.parse(row.hetHanLuc)) && now > Date.parse(row.hetHanLuc)) {
        trangThai = 'het_han';
      }

      return {
        ...row,
        trangThai
      };
    });

    // 2. Danh sách thành viên đang có quyền truy cập Bảng Tin
    const rsMem = await db.prepare(`
      SELECT cm.id, cm.hoc_sinh_id AS hocSinhId, hs.ho_ten AS hoTen, hs.so_thu_tu AS soThuTu,
             cm.granted_by AS grantedBy, cm.granted_at AS grantedAt, cm.revoked_at AS revokedAt,
             m.ma_hien_thi AS maHienThi
      FROM community_membership cm
      JOIN hoc_sinh hs ON hs.id = cm.hoc_sinh_id
      LEFT JOIN ma_truy_cap_cong_dong m ON m.id = cm.ma_truy_cap_id
      WHERE cm.lop_id = ?1 AND cm.revoked_at IS NULL
      ORDER BY hs.so_thu_tu ASC, hs.id ASC
    `).bind(lopId).all();

    return json({
      ok: true,
      danhSachMa,
      thanhVien: rsMem.results || []
    });
  } catch (e) {
    console.error('gv/ma-cong-dong GET error:', e);
    return loi('Không tải được danh sách mã truy cập.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien || phien.role !== 'teacher') {
      return loi('Chỉ giáo viên mới có quyền quản lý mã mời.', 403);
    }

    const lopId = phien.lopId;
    if (!lopId) return loi('Phiên không có lớp hợp lệ.', 403);
    const body = await docThan(request);
    const hanhDong = chuoi(body.hanhDong || 'tao_ma');

    // 1. THU HỒI MÃ TRUY CẬP
    if (hanhDong === 'thu_hoi_ma') {
      const id = Number(body.id);
      if (!id || isNaN(id)) return loi('Thiếu ID mã cần thu hồi.');

      await db.prepare(`
        UPDATE ma_truy_cap_cong_dong
        SET dang_hoat_dong = 0
        WHERE id = ?1 AND lop_id = ?2
      `).bind(id, lopId).run();

      return json({ ok: true, thongBao: 'Đã thu hồi mã mời truy cập thành công.' });
    }

    // 2. THU HỒI QUYỀN THÀNH VIÊN CỦA HỌC SINH
    if (hanhDong === 'thu_hoi_thanh_vien') {
      const hocSinhId = Number(body.hocSinhId);
      if (!hocSinhId || isNaN(hocSinhId)) return loi('Thiếu ID học sinh cần thu hồi.');

      await db.batch([db.prepare(`
        UPDATE community_membership
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE hoc_sinh_id = ?1 AND lop_id = ?2
      `).bind(hocSinhId, lopId), db.prepare(`
        UPDATE ma_truy_cap_cong_dong SET dang_hoat_dong = 0
        WHERE hoc_sinh_id = ?1 AND lop_id = ?2 AND so_lan_da_dung = 0
      `).bind(hocSinhId, lopId)]);

      return json({ ok: true, thongBao: 'Đã thu hồi quyền thành viên Bảng Tin của học sinh.' });
    }

    // 3. TẠO MÃ MỜI MỚI (DYNAMIC HIGH-ENTROPY CODE)
    if (hanhDong !== 'tao_ma') return loi('Hành động không hợp lệ.');
    const hocSinhId = Number(body.hocSinhId);
    if (!Number.isSafeInteger(hocSinhId) || hocSinhId <= 0) return loi('Chọn học sinh được cấp mã.');
    let tenHocSinh = '';

    if (hocSinhId) {
      const hs = await db.prepare('SELECT ho_ten AS hoTen FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(hocSinhId, lopId).first();
      if (!hs) return loi('Học sinh không tồn tại trong lớp này.', 400);
      tenHocSinh = hs.hoTen;
    }

    // Xác định tiền tố lớp
    const lop = await db.prepare('SELECT ten FROM lop WHERE id = ?1').bind(lopId).first();
    const lopSlug = (lop?.ten || '10A7').replace(/[^a-zA-Z0-9]/g, '').slice(-2) || 'A7';

    const maCode = sinhMaNgauNhien(lopSlug); // e.g. A7-K9QP-X4T2
    const maHash = await sha256Hex(maCode);
    const maHienThi = `${lopSlug.toUpperCase()}-****-${maCode.slice(-4)}`; // e.g. A7-****-X4T2

    const tenGoi = chuoi(body.tenGoi || (tenHocSinh ? `Mã mời em ${tenHocSinh}` : 'Mã mời Bảng Tin'), 100);
    const soLanDungToiDa = 1;

    // Tính thời gian hết hạn
    const soNgay = Number(body.soNgayHetHan ?? 7);
    if (!Number.isInteger(soNgay) || soNgay < 1 || soNgay > 30) return loi('Thời hạn phải từ 1 đến 30 ngày.'); // mặc định 7 ngày
    let hetHanLuc = null;
    if (soNgay > 0) {
      const d = new Date();
      d.setDate(d.getDate() + soNgay);
      hetHanLuc = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    const actorKey = phien.id ? `gv:${phien.id}` : `gv:${lopId}`;

    const [, res] = await db.batch([db.prepare(`
      UPDATE ma_truy_cap_cong_dong SET dang_hoat_dong = 0
      WHERE hoc_sinh_id = ?1 AND lop_id = ?2 AND so_lan_da_dung = 0
    `).bind(hocSinhId, lopId), db.prepare(`
      INSERT INTO ma_truy_cap_cong_dong (
        ma_code, ma_hash, ma_hien_thi, lop_id, hoc_sinh_id,
        ten_goi, so_lan_dung_toi_da, het_han_luc, dang_hoat_dong, tao_boi_khoa
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9)
    `).bind(
      'sha256:' + maHash, maHash, maHienThi, lopId, hocSinhId,
      tenGoi, soLanDungToiDa, hetHanLuc, actorKey
    )]);

    return json({
      ok: true,
      id: res.meta?.last_row_id,
      maCode, // Trả plaintext 1 LẦN DUY NHẤT để giáo viên sao chép gửi học sinh
      maHienThi,
      hocSinhId,
      hocSinhTen: tenHocSinh,
      tenGoi,
      hetHanLuc,
      thongBao: 'Tạo mã mời thành công. Hãy sao chép mã và gửi cho học sinh.'
    });
  } catch (e) {
    console.error('gv/ma-cong-dong POST error:', e);
    return loi('Lỗi khi xử lý mã truy cập. Thử lại sau.', 500);
  }
}
