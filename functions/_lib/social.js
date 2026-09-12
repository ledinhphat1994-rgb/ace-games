// Tiện ích xác thực quyền xã hội, định danh bạn bè và giới hạn tần suất cho Campus (Phase 4C / 4C.1)
import { layPhien } from './api.js';

// Cache trượt trong bộ nhớ để chặn burst tức thời (100% không lo race condition tại cùng instance)
const memoryRateLimits = new Map();

/**
 * Kiểm tra giới hạn tần suất request (Rate Limiter)
 * @param {object} env - Môi trường Cloudflare (chứa RATE_LIMIT KV nếu có)
 * @param {string} key - Định danh hành động + tài khoản (ví dụ: 'chat:123', 'search:123')
 * @param {number} maxRequests - Số request tối đa cho phép trong cửa sổ
 * @param {number} windowMs - Kích thước cửa sổ tính theo mili-giây
 * @returns {Promise<boolean>} true nếu hợp lệ (chưa vượt), false nếu đã chạm ngưỡng (429)
 */
export async function checkRateLimit(env, key, maxRequests, windowMs) {
  const now = Date.now();

  // 1. Kiểm tra bộ nhớ cục bộ (sliding window)
  const timestamps = memoryRateLimits.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false; // Quá tần suất
  }

  validTimestamps.push(now);
  memoryRateLimits.set(key, validTimestamps);

  // Dọn dẹp định kỳ tránh rò rỉ bộ nhớ
  if (memoryRateLimits.size > 2000) {
    for (const [k, ts] of memoryRateLimits.entries()) {
      if (ts.length === 0 || now - ts[ts.length - 1] > 300000) {
        memoryRateLimits.delete(k);
      }
    }
  }

  // 2. Kiểm tra KV nếu có cấu hình env.RATE_LIMIT
  if (env?.RATE_LIMIT) {
    try {
      const kvKey = `rl:${key}`;
      const count = parseInt((await env.RATE_LIMIT.get(kvKey)) || '0', 10);
      if (count >= maxRequests) {
        return false;
      }
      await env.RATE_LIMIT.put(kvKey, String(count + 1), {
        expirationTtl: Math.max(Math.ceil(windowMs / 1000), 60),
      });
    } catch {}
  }

  return true;
}

/**
 * Xác thực quyền truy cập mạng xã hội Campus (READ-ONLY, tuyệt đối KHÔNG có write side-effect)
 * - Kiểm tra phiên đăng nhập
 * - Kiểm tra ranh giới học sinh đã link hoặc giáo viên xác minh
 * - Đọc trực tiếp từ CSDL để đảm bảo tài khoản còn hoạt động (dang_hoat_dong = 1)
 * - Tuyệt đối không tự động tạo tài khoản ngầm hay gán bừa tài khoản giáo viên theo lop_id
 */
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

  const isVerifiedTeacherClaim = Boolean(phien.role === 'teacher' && !phien.teacherPending);
  const isLinkedStudentClaim = Boolean(phien.hocSinhId && phien.lopId);

  if (!isVerifiedTeacherClaim && !isLinkedStudentClaim) {
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

  let accountRecord = null;

  // 1. Nếu phiên có sẵn accountId rõ ràng
  if (phien.accountId) {
    try {
      accountRecord = await db.prepare(`
        SELECT id, ten_dang_nhap, ten_hien_thi, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id
        FROM tai_khoan_campus
        WHERE id = ?1
      `).bind(Number(phien.accountId)).first();
    } catch (e) {
      console.error('Lỗi truy vấn tài khoản theo accountId:', e);
    }
  }

  // 2. Nếu phiên học sinh cũ chưa có accountId, thử ánh xạ theo hoc_sinh_id ĐÃ TỒN TẠI
  if (!accountRecord && phien.hocSinhId) {
    try {
      accountRecord = await db.prepare(`
        SELECT id, ten_dang_nhap, ten_hien_thi, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id
        FROM tai_khoan_campus
        WHERE hoc_sinh_id = ?1
        LIMIT 1
      `).bind(Number(phien.hocSinhId)).first();
    } catch (e) {
      console.error('Lỗi truy vấn tài khoản theo hocSinhId:', e);
    }
  }

  // 3. Nếu vẫn không tìm thấy tài khoản hợp lệ:
  // TUYỆT ĐỐI KHÔNG INSERT VÀO DB ĐỂ TRÁNH SIDE-EFFECT TRONG QUÁ TRÌNH AUTH
  if (!accountRecord) {
    return {
      ok: false,
      status: 403,
      loi: 'Cần có tài khoản Campus hợp lệ để sử dụng tính năng này.',
      code: 'account_required',
    };
  }

  // 4. Kiểm tra trạng thái hoạt động thực tế (Chống thu hồi quyền trễ hạn cookie)
  if (accountRecord.dang_hoat_dong === 0 || accountRecord.dang_hoat_dong === false) {
    return {
      ok: false,
      status: 403,
      loi: 'Tài khoản đã bị tạm khóa.',
      code: 'account_deactivated',
    };
  }

  // 5. Kiểm tra quyền Giáo viên thực tế (Nếu cookie xưng là teacher nhưng DB đã hạ quyền hoặc đang pending)
  const isRealTeacher = Boolean(accountRecord.vai_tro === 'teacher' && accountRecord.teacher_pending === 0);
  if (phien.role === 'teacher' && !isRealTeacher) {
    return {
      ok: false,
      status: 403,
      loi: 'Quyền Giáo viên chưa được phê duyệt hoặc đã bị thu hồi.',
      code: 'teacher_unverified',
    };
  }

  // 6. Lấy thông tin lớp
  let lopTen = '';
  const lopId = accountRecord.lop_id || phien.lopId;
  if (lopId) {
    try {
      const l = await db.prepare('SELECT ten FROM lop WHERE id = ?1').bind(lopId).first();
      if (l?.ten) lopTen = l.ten;
    } catch {}
  }

  return {
    ok: true,
    accountId: accountRecord.id,
    username: accountRecord.ten_dang_nhap,
    displayName: accountRecord.ten_hien_thi || phien.ten || 'Thành viên',
    role: isRealTeacher ? 'teacher' : 'student',
    classBadge: lopTen,
    lopId,
    isVerifiedTeacher: isRealTeacher,
    isLinkedStudent: Boolean(accountRecord.hoc_sinh_id && lopId),
  };
}

/**
 * Làm sạch nội dung tin nhắn văn bản (Plain UTF-8, loại bỏ control chars, giữ nguyên < > & cho React render an toàn)
 * @param {string} raw
 * @returns {string}
 */
export function lamSachNoiDung(raw = '', maxLength = 500) {
  if (typeof raw !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const stripped = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return stripped.slice(0, maxLength);
}
