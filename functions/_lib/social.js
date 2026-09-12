// Tiện ích xác thực quyền xã hội, định danh bạn bè và giới hạn tần suất cho Campus (Phase 4C / 4C.1)
import { layPhien } from './api.js';

// Cache trượt trong bộ nhớ để chặn burst tức thời (100% không lo race condition tại cùng isolate)
const memoryBurstThrottles = new Map();
const memoryAbuseSlidingWindows = new Map();

/**
 * Kiểm tra giới hạn burst tức thời (UX Burst Throttle) — Hoàn toàn trong bộ nhớ Isolate
 * Dùng cho các khoảng thời gian cực ngắn (Chat 2s, DM 1s).
 * TUYỆT ĐỐI KHÔNG dùng KV với TTL 60s cho các khoảng 1-2s vì sẽ khóa nhầm người dùng 60s.
 * @param {string} key - Định danh (ví dụ: 'chat:123', 'dm:123')
 * @param {number} minIntervalMs - Khoảng cách tối thiểu giữa 2 request (mili-giây)
 * @returns {boolean} true nếu được phép gửi, false nếu vi phạm burst throttle
 */
export function checkBurstThrottle(key, minIntervalMs) {
  const now = Date.now();
  const last = memoryBurstThrottles.get(key) || 0;

  if (now - last < minIntervalMs) {
    return false; // Chưa đủ khoảng cách tối thiểu
  }

  memoryBurstThrottles.set(key, now);

  // Dọn dẹp định kỳ bộ nhớ
  if (memoryBurstThrottles.size > 3000) {
    for (const [k, t] of memoryBurstThrottles.entries()) {
      if (now - t > 300000) {
        memoryBurstThrottles.delete(k);
      }
    }
  }

  return true;
}

/**
 * Kiểm tra giới hạn lạm dụng thô (Coarse Abuse Ceiling) theo Time Bucket
 * Kết hợp bộ nhớ cục bộ + Time-bucketed KV (rl:<action>:<accountId>:<timeBucket>)
 * Khi bucket chuyển sang phút tiếp theo, bucket mới bắt đầu từ 0 và không bị ảnh hưởng bởi TTL của bucket cũ.
 * @param {object} env - Cloudflare environment
 * @param {string} action - Tên hành động ('chat', 'dm', 'search', 'freq', 'report')
 * @param {string|number} accountId - ID tài khoản
 * @param {number} maxRequests - Số lượng tối đa trong cửa sổ
 * @param {number} windowSec - Kích thước cửa sổ tính bằng giây (ví dụ: 60 cho 1 phút, 300 cho 5 phút)
 * @returns {Promise<boolean>} true nếu được phép, false nếu vượt ngưỡng
 */
export async function checkAbuseLimit(env, action, accountId, maxRequests, windowSec = 60) {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const memoryKey = `${action}:${accountId}`;

  // 1. Kiểm tra bộ nhớ Isolate (Sliding Window)
  const timestamps = memoryAbuseSlidingWindows.get(memoryKey) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  memoryAbuseSlidingWindows.set(memoryKey, validTimestamps);

  // Dọn dẹp định kỳ
  if (memoryAbuseSlidingWindows.size > 3000) {
    for (const [k, ts] of memoryAbuseSlidingWindows.entries()) {
      if (ts.length === 0 || now - ts[ts.length - 1] > 600000) {
        memoryAbuseSlidingWindows.delete(k);
      }
    }
  }

  // 2. Kiểm tra Cloudflare native Rate Limiting binding (nếu có cấu hình)
  if (typeof env?.RATE_LIMITER?.limit === 'function') {
    try {
      const bindingRes = await env.RATE_LIMITER.limit({ key: `${action}:${accountId}` });
      if (bindingRes && bindingRes.success === false) {
        return false;
      }
    } catch (e) {
      console.warn('[RateLimit] Native Rate Limiting binding error:', e);
    }
  }

  // 3. Kiểm tra Cloudflare KV dạng Time-Bucketed (rl:<action>:<accountId>:<timeBucket>)
  if (env?.RATE_LIMIT) {
    const timeBucket = Math.floor(now / windowMs);
    const kvKey = `rl:${action}:${accountId}:${timeBucket}`;
    let kvCount = 0;

    try {
      const raw = await env.RATE_LIMIT.get(kvKey);
      if (raw) {
        kvCount = parseInt(raw, 10) || 0;
      }
    } catch (err) {
      console.warn(`[RateLimit] KV get error on key ${kvKey}:`, err);
    }

    if (kvCount >= maxRequests) {
      return false;
    }

    try {
      // TTL đặt gấp đôi window (tối thiểu 60s theo chuẩn Cloudflare KV) để dọn dẹp sau khi hết bucket
      const ttl = Math.max(windowSec * 2, 60);
      await env.RATE_LIMIT.put(kvKey, String(kvCount + 1), {
        expirationTtl: ttl,
      });
    } catch (err) {
      console.warn(`[RateLimit] KV put error on key ${kvKey}:`, err);
    }
  }

  return true;
}

/**
 * Kiểm tra giới hạn tần suất tích hợp (Hỗ trợ cả UX burst throttle lẫn Abuse ceiling)
 * - Nếu windowMs < 5000ms: áp dụng cơ chế UX Burst Throttle tức thời (không dùng KV 60s) + trần lạm dụng phút
 * - Nếu windowMs >= 5000ms: áp dụng cơ chế Time-Bucketed KV + Sliding Window
 * @param {object} env - Môi trường Cloudflare
 * @param {string} key - Định danh hành động + tài khoản (ví dụ: 'chat:123', 'dm:123', 'search:123')
 * @param {number} maxRequests - Số request tối đa cho phép
 * @param {number} windowMs - Cửa sổ tính bằng mili-giây
 * @returns {Promise<boolean>} true nếu hợp lệ, false nếu bị giới hạn
 */
export async function checkRateLimit(env, key, maxRequests, windowMs) {
  const parts = String(key || '').split(':');
  const action = parts[0] || 'default';
  const accountId = parts[1] || 'global';

  // Trường hợp 1: Khoảng thời gian ngắn (< 5 giây) — Đây là UX Burst Throttle
  if (windowMs < 5000) {
    // 1.1 Kiểm tra khoảng cách burst tức thời trong bộ nhớ isolate
    const burstAllowed = checkBurstThrottle(key, windowMs);
    if (!burstAllowed) {
      return false;
    }

    // 1.2 Kiểm tra trần lạm dụng theo phút (coarse abuse ceiling) bằng Time-Bucketed KV
    // Chat: 30 tin/phút, DM: 60 tin/phút, Mặc định: 60/phút
    let abuseCeiling = 60;
    if (action === 'chat') abuseCeiling = 30;
    else if (action === 'dm') abuseCeiling = 60;

    const abuseAllowed = await checkAbuseLimit(env, `${action}_abuse`, accountId, abuseCeiling, 60);
    return abuseAllowed;
  }

  // Trường hợp 2: Cửa sổ thô (>= 5 giây) — Dùng Time-Bucketed Limiter
  const windowSec = Math.ceil(windowMs / 1000);
  return await checkAbuseLimit(env, action, accountId, maxRequests, windowSec);
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
