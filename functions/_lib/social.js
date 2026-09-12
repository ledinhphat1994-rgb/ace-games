// Tiện ích xác thực quyền xã hội và định danh bạn bè cho Campus (Phase 4C)
import { layPhien } from './api.js';

export async function kiemTraQuyenSocial(env, requestOrPhien) {
  let phien = requestOrPhien;
  if (requestOrPhien && typeof requestOrPhien.headers === 'object') {
    phien = await layPhien(requestOrPhien, env);
  }

  if (!phien) {
    return {
      ok: false,
      status: 401,
      loi: 'Đăng nhập để tham gia Chat',
      code: 'auth_required',
    };
  }

  const isVerifiedTeacher = Boolean(phien.role === 'teacher' && !phien.teacherPending);
  const isLinkedStudent = Boolean(phien.hocSinhId && phien.lopId);

  if (!isVerifiedTeacher && !isLinkedStudent) {
    return {
      ok: false,
      status: 403,
      loi: 'Tính năng giao lưu và kết bạn chỉ dành cho học sinh và giáo viên đã liên kết.',
      code: 'school_member_required',
    };
  }

  const db = env.DB;
  if (!db) {
    return { ok: false, status: 500, loi: 'Chưa gắn cơ sở dữ liệu D1.' };
  }

  let accountId = phien.accountId ? Number(phien.accountId) : null;
  let displayName = phien.ten || '';
  let lopTen = '';

  // Lấy tên lớp nếu có
  if (phien.lopId) {
    try {
      const l = await db.prepare('SELECT ten FROM lop WHERE id = ?1').bind(phien.lopId).first();
      if (l?.ten) lopTen = l.ten;
    } catch {}
  }

  // Đảm bảo có accountId chuẩn tắc từ tai_khoan_campus
  if (!accountId) {
    if (phien.hocSinhId) {
      try {
        const tk = await db.prepare(
          'SELECT id, ten_hien_thi FROM tai_khoan_campus WHERE hoc_sinh_id = ?1 LIMIT 1'
        ).bind(phien.hocSinhId).first();
        if (tk) {
          accountId = tk.id;
          if (!displayName) displayName = tk.ten_hien_thi;
        } else {
          // Tạo bản ghi tương thích cho học sinh phiên cũ
          const tenDn = `hs_${phien.hocSinhId}_${Date.now().toString(36)}`;
          const tenHt = displayName || `Học sinh ${phien.hocSinhId}`;
          const res = await db.prepare(
            `INSERT INTO tai_khoan_campus (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro, hoc_sinh_id, lop_id)
             VALUES (?1, ?2, 'legacy', 'legacy', 'student', ?3, ?4)`
          ).bind(tenDn, tenHt, phien.hocSinhId, phien.lopId).run();
          accountId = res.meta?.last_row_id || null;
        }
      } catch (e) {
        console.error('Lỗi định danh tài khoản học sinh:', e);
      }
    } else if (isVerifiedTeacher) {
      try {
        const tk = await db.prepare(
          "SELECT id, ten_hien_thi FROM tai_khoan_campus WHERE vai_tro = 'teacher' AND (lop_id = ?1 OR id = ?1) LIMIT 1"
        ).bind(phien.lopId || 1).first();
        if (tk) {
          accountId = tk.id;
          if (!displayName) displayName = tk.ten_hien_thi;
        } else {
          const tenDn = `gv_lop_${phien.lopId || 1}`;
          const tenHt = displayName || 'Giáo viên';
          const res = await db.prepare(
            `INSERT INTO tai_khoan_campus (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro, teacher_pending, lop_id)
             VALUES (?1, ?2, 'legacy', 'legacy', 'teacher', 0, ?3)`
          ).bind(tenDn, tenHt, phien.lopId || 1).run();
          accountId = res.meta?.last_row_id || null;
        }
      } catch (e) {
        console.error('Lỗi định danh tài khoản giáo viên:', e);
      }
    }
  }

  if (!accountId) {
    return {
      ok: false,
      status: 403,
      loi: 'Không xác định được danh tính tài khoản hợp lệ.',
      code: 'invalid_account',
    };
  }

  return {
    ok: true,
    accountId,
    displayName: displayName || 'Thành viên',
    role: isVerifiedTeacher ? 'teacher' : 'student',
    classBadge: lopTen,
    lopId: phien.lopId || null,
    isVerifiedTeacher,
    isLinkedStudent,
  };
}

export function lamSachNoiDung(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}
