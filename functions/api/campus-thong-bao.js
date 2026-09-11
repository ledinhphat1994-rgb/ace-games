// API Quản lý và Truy xuất Thông Báo Giáo Viên / Ban Quản Lý (Phase 4A.1 Hardening)
import { json, loi, layPhien, kiemTraPhienHieuLuc, docThan, chuoi, chuanUrlMedia } from '../_lib/api.js';

function layActorKey(phien) {
  if (!phien) return 'khach';
  if (phien.role === 'teacher') return phien.id ? `gv:${phien.id}` : `gv:${phien.lopId || 1}`;
  if (phien.role === 'phu') return `phu:${phien.phuId || phien.taiKhoanPhuId || 1}`;
  return `hs:${phien.hocSinhId || 0}`;
}

export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (phien && !(await kiemTraPhienHieuLuc(phien, env)).hopLe) return loi('Phiên đã hết hiệu lực.', 401);
    const url = new URL(request.url);
    const xemTatCa = url.searchParams.get('tat_ca') === '1';

    const laGiaoVien = phien?.role === 'teacher';
    let laBienTapVien = false;

    if (phien?.hocSinhId && phien?.lopId) {
      const btv = await db.prepare(
        'SELECT 1 FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
      ).bind(phien.hocSinhId, phien.lopId).first().catch(() => null);

      if (btv) laBienTapVien = true;
    }

    const coQuyenQuanLy = laGiaoVien || laBienTapVien;
    const actorKey = layActorKey(phien);

    // 1. Quản lý hiển thị: Trường dữ liệu an toàn (Privacy)
    // Giáo viên hoặc tác giả mới thấy trạng thái nháp/chờ duyệt và actor key
    let sql = `
      SELECT id, tieu_de AS tieuDe, noi_dung AS noiDung, noi_dung_dinh_dang AS noiDungDinhDang,
             anh_bia_url AS anhBiaUrl, loai, pham_vi AS phamVi, trang_thai AS trangThai,
             ghim, uu_tien AS uuTien, nguoi_tao_ten AS nguoiTaoTen,
             nguoi_tao_vai_tro AS nguoiTaoVaiTro, nguoi_duyet_ten AS nguoiDuyetTen,
             xuat_ban_luc AS xuatBanLuc, tao_luc AS taoLuc
    `;

    if (coQuyenQuanLy && xemTatCa) {
      sql += `, nguoi_tao_khoa AS nguoiTaoKhoa, lop_id AS lopId`;
    }

    sql += ` FROM campus_thong_bao`;

    const whereClauses = [];
    const params = [];

    if (coQuyenQuanLy && xemTatCa) {
      if (laGiaoVien) {
        // Giáo viên: Xem tất cả bài trong phạm vi trường hoặc lớp mình quản lý
        if (phien?.lopId) {
          whereClauses.push(`lop_id = ?${params.length + 1}`);
          params.push(phien.lopId);
        } else {
          whereClauses.push('0 = 1');
        }
      } else {
        // Biên tập viên học sinh: CHỈ thấy bài đã xuất bản HOẶC nháp/chờ duyệt DO CHÍNH MÌNH TẠO
        whereClauses.push(`(
          trang_thai = 'published'
          OR (nguoi_tao_khoa = ?${params.length + 1} AND trang_thai IN ('draft', 'pending_review'))
        )`);
        params.push(actorKey);
        whereClauses.push(`(pham_vi = 'truong' OR lop_id = ?${params.length + 1})`);
        params.push(phien.lopId);
      }
    } else {
      // Khách vãng lai / Học sinh bình thường: CHỈ xem bài đã xuất bản
      whereClauses.push("trang_thai = 'published'");
      if (phien?.lopId) {
        whereClauses.push(`(pham_vi = 'truong' OR lop_id = ?${params.length + 1})`);
        params.push(phien.lopId);
      } else {
        whereClauses.push("pham_vi = 'truong'");
      }
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY ghim DESC, uu_tien DESC, datetime(COALESCE(xuat_ban_luc, tao_luc)) DESC LIMIT 50`;

    const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
    const rs = await stmt.all();
    const danhSach = (rs.results || []).map(row => coQuyenQuanLy && xemTatCa ? {
      ...row,
      coQuyenSua: row.lopId === phien.lopId && (laGiaoVien ||
        (row.nguoiTaoKhoa === actorKey && ['draft', 'pending_review'].includes(row.trangThai)))
    } : row);

    return json({
      ok: true,
      danhSach,
      thongBao: danhSach,
      quyen: {
        laKhach: !phien || Boolean(phien?.isGuest),
        laGiaoVien,
        laBienTapVien,
        duocPhepDang: laGiaoVien
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
    if (!(await kiemTraPhienHieuLuc(phien, env)).hopLe) return loi('Phiên đã hết hiệu lực.', 401);
    const lopId = phien.lopId;
    if (!lopId) return loi('Phiên không có lớp hợp lệ.', 403);

    const laGiaoVien = phien.role === 'teacher';
    let laBienTapVien = false;

    if (phien.hocSinhId && phien.lopId) {
      const btv = await db.prepare(
        'SELECT 1 FROM campus_bien_tap_vien WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
      ).bind(phien.hocSinhId, phien.lopId).first().catch(() => null);

      if (btv) laBienTapVien = true;
    }

    if (!laGiaoVien && !laBienTapVien) {
      return loi('Bạn không có quyền tạo hoặc chỉnh sửa thông báo.', 403);
    }

    const actorKey = layActorKey(phien);
    const body = await docThan(request);
    const hanhDong = chuoi(body.hanhDong || 'luu');

    // 1. HÀNH ĐỘNG: XOÁ BÀI
    if (hanhDong === 'xoa') {
      const id = Number(body.id);
      if (!id || isNaN(id)) return loi('Thiếu ID thông báo cần xoá.');

      const bai = await db.prepare('SELECT * FROM campus_thong_bao WHERE id = ?1 AND lop_id = ?2').bind(id, lopId).first();
      if (!bai) return loi('Không tìm thấy thông báo.', 404);

      if (!laGiaoVien) {
        // Biên tập viên học sinh: CẤM xoá bài của giáo viên hoặc bài đã xuất bản
        if (bai.nguoi_tao_khoa !== actorKey || !['draft', 'pending_review'].includes(bai.trang_thai)) {
          return loi('Bạn chỉ có thể xoá bản nháp chưa xuất bản do chính mình tạo.', 403);
        }
      }

      const deleted = await db.prepare(`
        DELETE FROM campus_thong_bao WHERE id = ?1 AND lop_id = ?2
        AND (?3 = 1 OR (nguoi_tao_khoa = ?4 AND trang_thai IN ('draft', 'pending_review')))
      `).bind(id, lopId, laGiaoVien ? 1 : 0, actorKey).run();
      if (deleted.meta.changes !== 1) return loi('Bài đã thay đổi. Vui lòng tải lại.', 409);
      return json({ ok: true, thongBao: 'Đã xoá thông báo thành công.' });
    }

    // 2. HÀNH ĐỘNG: PHÊ DUYỆT & XUẤT BẢN (CHỈ GIÁO VIÊN)
    if (hanhDong === 'duyet_bai') {
      if (!laGiaoVien) return loi('Chỉ giáo viên mới có quyền phê duyệt thông báo.', 403);
      const id = Number(body.id);
      if (!id || isNaN(id)) return loi('Thiếu ID bài viết cần duyệt.');

      const approved = await db.prepare(`
        UPDATE campus_thong_bao
        SET trang_thai = 'published',
            nguoi_duyet_ten = ?1,
            xuat_ban_luc = CURRENT_TIMESTAMP,
            cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?2 AND lop_id = ?3 AND trang_thai IN ('draft', 'pending_review')
      `).bind(phien.ten || 'Giáo viên chủ nhiệm', id, lopId).run();
      if (approved.meta.changes !== 1) return loi('Không tìm thấy bản thảo cần duyệt.', 404);

      return json({ ok: true, trangThai: 'published', thongBao: 'Đã phê duyệt và xuất bản thông báo.' });
    }

    // 3. HÀNH ĐỘNG: LƯU BẢN NHÁP / GỬI DUYỆT / CẬP NHẬT
    const tieuDe = chuoi(body.tieuDe, 250);
    const noiDung = chuoi(body.noiDung, 10000);
    const anhBiaRaw = body.anhBiaUrl ? chuanUrlMedia(body.anhBiaUrl, 1000) : null;
    const anhBiaUrl = anhBiaRaw === false ? null : anhBiaRaw;
    const loai = ['thong_bao', 'nhac_nho', 'lich_thi', 'tin_khan'].includes(body.loai) ? body.loai : 'thong_bao';
    const phamVi = ['truong', 'lop'].includes(body.phamVi) ? body.phamVi : 'truong';
    const ghim = laGiaoVien ? (body.ghim ? 1 : 0) : 0; // Chỉ Giáo viên được ghim
    const uuTien = laGiaoVien ? (Number(body.uuTien) || 0) : 0;

    if (!tieuDe) return loi('Tiêu đề thông báo không được để trống.');
    if (!noiDung) return loi('Nội dung thông báo không được để trống.');

    // XÁC THỰC TRẠNG THÁI & PHÂN QUYỀN (Phase 4A.1 Privilege Escalation Prevention)
    let trangThai = chuoi(body.trangThai || '');
    if (!trangThai) {
      if (hanhDong === 'gui_duyet') trangThai = 'pending_review';
      else if (hanhDong === 'xuat_ban') trangThai = laGiaoVien ? 'published' : 'pending_review';
      else trangThai = 'draft';
    }
    if (!['draft', 'pending_review', 'published', 'archived'].includes(trangThai)) {
      trangThai = 'draft';
    }

    // BIÊN TẬP VIÊN HỌC SINH KHÔNG THỂ XUẤT BẢN TRỰC TIẾP
    if (!laGiaoVien) {
      if (trangThai === 'published' || trangThai === 'archived') {
        trangThai = 'pending_review'; // Tự động chuyển thành chờ duyệt
      }
    }

    const nguoiTaoVaiTro = laGiaoVien ? 'giao_vien' : 'bien_tap_vien';
    const nguoiTaoTen = phien.ten || (laGiaoVien ? 'Giáo Viên' : 'Biên Tập Viên Học Sinh');

    const id = Number(body.id);

    if (id && !isNaN(id)) {
      // CẬP NHẬT BÀI ĐÃ CÓ
      const baiCu = await db.prepare('SELECT * FROM campus_thong_bao WHERE id = ?1 AND lop_id = ?2').bind(id, lopId).first();
      if (!baiCu) return loi('Không tìm thấy thông báo để cập nhật.', 404);

      if (!laGiaoVien) {
        // Biên tập viên học sinh: KHÔNG ĐƯỢC SỬA BÀI GIÁO VIÊN HOẶC BÀI CỦA NGƯỜI KHÁC
        if (baiCu.nguoi_tao_khoa !== actorKey) {
          return loi('Bạn không có quyền sửa thông báo của người khác hoặc của giáo viên.', 403);
        }

        // Biên tập viên học sinh: KHÔNG ĐƯỢC SỬA BÀI ĐÃ XUẤT BẢN
        if (!['draft', 'pending_review'].includes(baiCu.trang_thai)) {
          return loi('Thông báo đã xuất bản — chỉ giáo viên mới có thể điều chỉnh.', 403);
        }
      }

      const updated = await db.prepare(`
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
        WHERE id = ?9 AND lop_id = ?10
          AND (?11 = 1 OR (nguoi_tao_khoa = ?12 AND trang_thai IN ('draft', 'pending_review')))
      `).bind(tieuDe, noiDung, anhBiaUrl, loai, phamVi, trangThai, ghim, uuTien, id, lopId, laGiaoVien ? 1 : 0, actorKey).run();
      if (updated.meta.changes !== 1) return loi('Bài đã thay đổi. Vui lòng tải lại.', 409);

      return json({
        ok: true,
        id,
        trangThai,
        thongBao: trangThai === 'pending_review' ? 'Đã gửi bản thảo để giáo viên duyệt.' : 'Đã cập nhật thông báo.'
      });
    } else {
      // TẠO BÀI MỚI
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
        ghim, uuTien, actorKey, nguoiTaoTen, nguoiTaoVaiTro
      ).run();

      return json({
        ok: true,
        id: res.meta?.last_row_id,
        trangThai,
        thongBao: trangThai === 'published'
          ? 'Đã xuất bản thông báo thành công.'
          : (trangThai === 'pending_review' ? 'Đã gửi bản thảo để giáo viên phê duyệt.' : 'Đã lưu bản nháp.')
      });
    }
  } catch (e) {
    console.error('campus-thong-bao POST error:', e);
    return loi('Lỗi khi lưu thông báo. Thử lại sau.', 500);
  }
}
