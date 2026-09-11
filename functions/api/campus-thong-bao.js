// API Quản lý và Truy xuất Thông Báo Giáo Viên / Ban Quản Lý (Campus & Community)
import { json, loi, layPhien, docThan, chuoi, chuanUrlMedia } from '../_lib/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    const url = new URL(request.url);
    const xemTatCa = url.searchParams.get('tat_ca') === '1';

    const laGiaoVien = phien?.role === 'teacher';
    let laBienTapVien = false;
    let duocPhepDang = false;

    if (phien?.hocSinhId && phien?.lopId) {
      const btv = await db.prepare(
        `SELECT duoc_phep_dang AS duocPhepDang FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2`
      ).bind(phien.hocSinhId, phien.lopId).first().catch(() => null);

      if (btv) {
        laBienTapVien = true;
        duocPhepDang = Number(btv.duocPhepDang) === 1;
      }
    }

    const coQuyenQuanLy = laGiaoVien || laBienTapVien;

    let sql = `
      SELECT id, tieu_de AS tieuDe, noi_dung AS noiDung, noi_dung_dinh_dang AS noiDungDinhDang,
             anh_bia_url AS anhBiaUrl, loai, pham_vi AS phamVi, lop_id AS lopId, trang_thai AS trangThai,
             ghim, uu_tien AS uuTien, nguoi_tao_khoa AS nguoiTaoKhoa, nguoi_tao_ten AS nguoiTaoTen,
             nguoi_tao_vai_tro AS nguoiTaoVaiTro, nguoi_duyet_ten AS nguoiDuyetTen, xuat_ban_luc AS xuatBanLuc,
             tao_luc AS taoLuc, cap_nhat_luc AS capNhatLuc
      FROM campus_thong_bao
    `;

    const whereClauses = [];
    const params = [];

    if (coQuyenQuanLy && xemTatCa) {
      // Giáo viên hoặc biên tập viên xem danh sách quản lý (gồm nháp, chờ duyệt, đã đăng)
      if (!laGiaoVien && phien?.lopId) {
        whereClauses.push(`(pham_vi = 'truong' OR lop_id = ?${params.length + 1})`);
        params.push(phien.lopId);
      }
    } else {
      // Người dùng bình thường / khách: CHỈ xem bài đã xuất bản
      whereClauses.push(`trang_thai = 'published'`);
      if (phien?.lopId) {
        whereClauses.push(`(pham_vi = 'truong' OR lop_id = ?${params.length + 1})`);
        params.push(phien.lopId);
      } else {
        whereClauses.push(`pham_vi = 'truong'`);
      }
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY ghim DESC, uu_tien DESC, datetime(COALESCE(xuat_ban_luc, tao_luc)) DESC LIMIT 50`;

    const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
    const rs = await stmt.all();

    return json({
      ok: true,
      danhSach: rs.results || [],
      thongBao: rs.results || [],
      quyen: {
        laGiaoVien,
        laBienTapVien,
        duocPhepDang
      }
    });
  } catch (e) {
    console.error('campus-thong-bao GET error:', e);
    return loi('Không đọc được danh sách thông báo.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien) return loi('Chưa đăng nhập.', 401);

    const laGiaoVien = phien.role === 'teacher';
    let laBienTapVien = false;
    let duocPhepDang = false;

    if (phien.hocSinhId && phien.lopId) {
      const btv = await db.prepare(
        `SELECT duoc_phep_dang AS duocPhepDang FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2`
      ).bind(phien.hocSinhId, phien.lopId).first().catch(() => null);

      if (btv) {
        laBienTapVien = true;
        duocPhepDang = Number(btv.duocPhepDang) === 1;
      }
    }

    if (!laGiaoVien && !laBienTapVien) {
      return loi('Bạn không có quyền tạo hoặc chỉnh sửa thông báo.', 403);
    }

    const body = await docThan(request);
    const hanhDong = chuoi(body.hanhDong || 'luu');

    // 1. HÀNH ĐỘNG: XOÁ BÀI
    if (hanhDong === 'xoa') {
      const id = Number(body.id);
      if (!id || isNaN(id)) return loi('Thiếu ID thông báo cần xoá.');

      const bai = await db.prepare('SELECT * FROM campus_thong_bao WHERE id = ?1').bind(id).first();
      if (!bai) return loi('Không tìm thấy thông báo.');

      if (!laGiaoVien) {
        // Biên tập viên chỉ được xoá bản nháp do chính mình tạo
        if (bai.nguoi_tao_khoa !== (phien.hocSinhId || phien.phuId) || bai.trang_thai === 'published') {
          return loi('Bạn chỉ có thể xoá bản nháp do chính mình tạo.', 403);
        }
      }

      await db.prepare('DELETE FROM campus_thong_bao WHERE id = ?1').bind(id).run();
      return json({ ok: true, thongBao: 'Đã xoá thông báo thành công.' });
    }

    // 2. HÀNH ĐỘNG: DUYỆT BÀI (Chỉ Giáo viên)
    if (hanhDong === 'duyet_bai') {
      if (!laGiaoVien) return loi('Chỉ giáo viên mới có quyền phê duyệt thông báo.', 403);
      const id = Number(body.id);
      if (!id || isNaN(id)) return loi('Thiếu ID bài viết cần duyệt.');

      await db.prepare(`
        UPDATE campus_thong_bao
        SET trang_thai = 'published',
            nguoi_duyet_ten = ?1,
            xuat_ban_luc = CURRENT_TIMESTAMP,
            cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?2
      `).bind(phien.ten || 'Giáo viên', id).run();

      return json({ ok: true, thongBao: 'Đã phê duyệt và xuất bản thông báo.' });
    }

    // 3. HÀNH ĐỘNG: LƯU / TẠO MỚI / CẬP NHẬT
    const tieuDe = chuoi(body.tieuDe, 250);
    const noiDung = chuoi(body.noiDung, 10000);
    const anhBiaRaw = body.anhBiaUrl ? chuanUrlMedia(body.anhBiaUrl, 1000) : null;
    const anhBiaUrl = anhBiaRaw === false ? null : anhBiaRaw;
    const loai = ['thong_bao', 'nhac_nho', 'lich_thi', 'tin_khan'].includes(body.loai) ? body.loai : 'thong_bao';
    const phamVi = ['truong', 'lop'].includes(body.phamVi) ? body.phamVi : 'truong';
    const ghim = laGiaoVien ? (body.ghim ? 1 : 0) : 0; // Chỉ GV được ghim
    const uuTien = laGiaoVien ? (Number(body.uuTien) || 0) : 0;
    const lopId = phien.lopId || 1;

    if (!tieuDe) return loi('Tiêu đề thông báo không được để trống.');
    if (!noiDung) return loi('Nội dung thông báo không được để trống.');

    // Xác định trạng thái xuất bản
    let trangThai = chuoi(body.trangThai || 'draft');
    if (!['draft', 'pending_review', 'published', 'archived'].includes(trangThai)) {
      trangThai = 'draft';
    }

    // Bảo vệ quyền xuất bản
    if (trangThai === 'published' && !laGiaoVien && !duocPhepDang) {
      trangThai = 'pending_review'; // Biên tập viên chưa được cấp quyền đăng trực tiếp thì chuyển thành chờ duyệt
    }

    const nguoiTaoVaiTro = laGiaoVien ? 'giao_vien' : 'bien_tap_vien';
    const nguoiTaoKhoa = phien.hocSinhId || phien.phuId || 'giao_vien';
    const nguoiTaoTen = phien.ten || (laGiaoVien ? 'Giáo Viên' : 'Biên Tập Viên');

    const id = Number(body.id);

    if (id && !isNaN(id)) {
      // Cập nhật bài cũ
      const baiCu = await db.prepare('SELECT * FROM campus_thong_bao WHERE id = ?1').bind(id).first();
      if (!baiCu) return loi('Không tìm thấy thông báo để cập nhật.');

      if (!laGiaoVien && baiCu.nguoi_tao_khoa !== nguoiTaoKhoa && !duocPhepDang) {
        return loi('Bạn không có quyền sửa thông báo của người khác.', 403);
      }

      await db.prepare(`
        UPDATE campus_thong_bao
        SET tieu_de = ?1,
            noi_dung = ?2,
            anh_bia_url = ?3,
            loai = ?4,
            pham_vi = ?5,
            trang_thai = ?6,
            ghim = ?7,
            uu_tien = ?8,
            xuat_ban_luc = CASE WHEN ?6 = 'published' AND xuat_ban_luc IS NULL THEN CURRENT_TIMESTAMP ELSE xuat_ban_luc END,
            cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?9
      `).bind(tieuDe, noiDung, anhBiaUrl, loai, phamVi, trangThai, ghim, uuTien, id).run();

      return json({ ok: true, id, trangThai, thongBao: 'Đã cập nhật thông báo.' });
    } else {
      // Tạo bài mới
      const res = await db.prepare(`
        INSERT INTO campus_thong_bao (
          tieu_de, noi_dung, anh_bia_url, loai, pham_vi, lop_id, trang_thai,
          ghim, uu_tien, nguoi_tao_khoa, nguoi_tao_ten, nguoi_tao_vai_tro,
          xuat_ban_luc
        ) VALUES (
          ?1, ?2, ?3, ?4, ?5, ?6, ?7,
          ?8, ?9, ?10, ?11, ?12,
          CASE WHEN ?7 = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END
        )
      `).bind(
        tieuDe, noiDung, anhBiaUrl, loai, phamVi, lopId, trangThai,
        ghim, uuTien, nguoiTaoKhoa, nguoiTaoTen, nguoiTaoVaiTro
      ).run();

      return json({
        ok: true,
        id: res.meta?.last_row_id,
        trangThai,
        thongBao: trangThai === 'published' ? 'Đã xuất bản thông báo thành công.' : (trangThai === 'pending_review' ? 'Đã gửi bản thảo để giáo viên phê duyệt.' : 'Đã lưu bản nháp.')
      });
    }
  } catch (e) {
    console.error('campus-thong-bao POST error:', e);
    return loi('Lỗi khi lưu thông báo. Thử lại sau.', 500);
  }
}
