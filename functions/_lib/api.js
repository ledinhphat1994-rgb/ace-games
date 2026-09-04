// Tiện ích dùng chung cho toàn bộ API.
import { COOKIE_NAME, readCookie, verifyToken } from './auth.js';

export function json(duLieu, status = 200) {
  return new Response(JSON.stringify(duLieu), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function loi(thongDiep, status = 400) {
  return json({ ok: false, loi: thongDiep }, status);
}

// Lấy phiên đăng nhập; trả về null nếu không hợp lệ.
export async function layPhien(request, env) {
  return verifyToken(env.SESSION_SECRET, readCookie(request, COOKIE_NAME));
}

// Bọc một hàm xử lý: tự kiểm tra đăng nhập, quyền, và bắt lỗi.
//
// canGiaoVien: đường API này chỉ dành cho khu giáo viên (không phải học sinh).
// quyenCan: nếu đặt, một "tài khoản đặc biệt" (role 'phu' — lớp trưởng, thủ quỹ...)
//   được cấp đúng quyền này thì cũng thao tác được, không cần là giáo viên.
//   Không đặt quyenCan nghĩa là mục đó CHỈ giáo viên mới được vào (dữ liệu nhạy cảm hơn).
export function bocXuLy(xuLy, { canGiaoVien = false, quyenCan = null } = {}) {
  return async (context) => {
    const { request, env } = context;
    if (!env.DB) return loi('Chưa gắn cơ sở dữ liệu D1 vào project.', 500);

    let phien = await layPhien(request, env);
    if (!phien) return loi('Chưa đăng nhập.', 401);

    // Với tài khoản cán sự (tài khoản phụ hoặc mã cá nhân được cấp quyền): luôn lấy quyền
    // mới nhất từ cơ sở dữ liệu — giáo viên đổi quyền thì có hiệu lực ngay, không cần đăng
    // nhập lại.
    if (phien.role === 'phu' && phien.phuId && env.DB) {
      try {
        const tk = await env.DB.prepare(
          'SELECT ten, vai_tro AS vaiTro, quyen, dang_hoat_dong AS dangHoatDong FROM tai_khoan_phu WHERE id = ?1'
        ).bind(phien.phuId).first();
        if (tk) {
          if (!tk.dangHoatDong) {
            return loi('Tài khoản này đã bị khoá.', 403);
          }
          phien = {
            ...phien,
            ten: tk.ten || phien.ten,
            vaiTro: tk.vaiTro || phien.vaiTro,
            quyen: (tk.quyen || '').split(',').map((s) => s.trim()).filter(Boolean),
          };
        }
      } catch (_e) {}
    }
    if (phien.role === 'phu' && phien.hocSinhId && env.DB) {
      try {
        const m = await env.DB.prepare('SELECT quyen FROM ma_ca_nhan WHERE hoc_sinh_id = ?1').bind(phien.hocSinhId).first();
        phien = { ...phien, quyen: (m?.quyen || '').split(',').map((s) => s.trim()).filter(Boolean) };
      } catch (_e) {}
    }

    if (canGiaoVien) {
      const laGiaoVien = phien.role === 'teacher';
      const laPhuDuocCap = phien.role === 'phu' && quyenCan && (phien.quyen || []).includes(quyenCan);
      if (!laGiaoVien && !laPhuDuocCap) {
        return loi('Bạn không có quyền thao tác ở mục này.', 403);
      }
      // Tài khoản cán sự (không phải giáo viên) chỉ được thêm/sửa/cập nhật — KHÔNG được
      // xoá, để tránh mất dữ liệu nếu tài khoản bị chiếm quyền.
      if (!laGiaoVien && request.method === 'DELETE') {
        return loi('Tài khoản được cấp quyền chỉ được sửa/thêm, không được xoá. Nhờ giáo viên chủ nhiệm xoá giúp.', 403);
      }
    }

    try {
      return await xuLy({ ...context, phien });
    } catch (e) {
      return loi('Lỗi máy chủ: ' + (e && e.message ? e.message : String(e)), 500);
    }
  };
}

// Đọc phần thân JSON của yêu cầu, có giới hạn để tránh gửi dữ liệu quá lớn.
export async function docThan(request) {
  const raw = await request.text();
  if (raw.length > 200_000) throw new Error('Dữ liệu gửi lên quá lớn.');
  if (!raw) return {};
  return JSON.parse(raw);
}

// Kiểm tra ngày dạng NĂM-THÁNG-NGÀY.
export function ngayHopLe(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

// Giới hạn độ dài chuỗi người dùng nhập.
export function chuoi(v, toiDa = 2000) {
  return String(v ?? '').trim().slice(0, toiDa);
}
