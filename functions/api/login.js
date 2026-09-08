// POST /api/login  { code: "...", lop?: "<slug>" }  -> đặt cookie phiên nếu mã đúng.
// "lop" là slug của lớp đang hiện trên màn hình đăng nhập (nếu có) — dùng để CHẶN việc mã
// nhập vào tuy đúng thật nhưng lại thuộc một lớp KHÁC với lớp đang chọn trên màn hình.
import { COOKIE_NAME, createToken, safeEqual } from '../_lib/auth.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 ngày
const MAX_TRIES = 8;                  // số lần nhập sai tối đa
const WINDOW = 600;                   // trong 10 phút, tính theo IP

function json(data, status = 200, extraHeaders = {}, cookiePhu = null) {
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  Object.entries(extraHeaders).forEach(([k, v]) => h.append(k, v));
  if (cookiePhu) h.append('Set-Cookie', cookiePhu);
  return new Response(JSON.stringify(data), { status, headers: h });
}

// Giới hạn số lần thử nếu đã gắn KV namespace tên RATE_LIMIT (không bắt buộc).
async function tooManyTries(env, ip) {
  if (!env.RATE_LIMIT) return false;
  const key = `login:${ip}`;
  const n = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
  if (n >= MAX_TRIES) return true;
  await env.RATE_LIMIT.put(key, String(n + 1), { expirationTtl: WINDOW });
  return false;
}

async function clearTries(env, ip) {
  if (env.RATE_LIMIT) await env.RATE_LIMIT.delete(`login:${ip}`);
}

// Đọc/tạo mã thiết bị — một chuỗi ngẫu nhiên lưu trong cookie riêng của trình duyệt này,
// dùng để nhận ra "đây có phải đúng máy đã đăng nhập lần đầu" cho các mã ĐƯỢC CẤP QUYỀN
// quản lý (không áp dụng cho học sinh thường). Không phải cookie phiên — sống độc lập,
// không hết hạn theo phiên đăng nhập.
function docThietBi(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(/(?:^|;\s*)thiet_bi_id=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
function taoThietBi() {
  return crypto.randomUUID();
}

// Xác minh Turnstile (Cloudflare) — chặn script dò mã tự động NGAY CẢ KHI nó đổi IP liên tục để
// né giới hạn "8 lần sai/10 phút/IP" ở trên, vì Turnstile đòi hỏi một trình duyệt thật giải được
// thử thách, không phải chỉ có IP "sạch". Chỉ bật khi đã cấu hình TURNSTILE_SECRET_KEY trên
// Cloudflare — CHƯA cấu hình thì bỏ qua bước này (không chặn đăng nhập của ai cả), để triển khai
// code trước, thêm khoá Turnstile sau mà không có lúc nào web bị khoá ngoài dự kiến.
async function turnstileHopLe(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET_KEY);
    form.append('response', token);
    form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const kq = await res.json();
    return Boolean(kq.success);
  } catch {
    // Cloudflare siteverify không phản hồi được — không vì lỗi mạng phía máy chủ mà khoá hết
    // đường vào của mọi người, coi như bỏ qua bước này cho lần thử này.
    return true;
  }
}

// Ghi 1 dòng vào nhật ký đăng nhập — nay ghi CHO MỌI VAI TRÒ (không chỉ mã được cấp quyền như
// trước), và tự tính "canh_bao_ip": đăng nhập THÀNH CÔNG mà IP khác với lần đăng nhập THÀNH CÔNG
// gần nhất của ĐÚNG mã này thì đánh dấu để giáo viên xem, KHÔNG chặn (mạng di động đổi IP liên
// tục là chuyện bình thường, chặn cứng sẽ khoá nhầm học sinh dùng điện thoại).
async function ghiNhatKyDangNhap(env, { ma, hocSinhId, ketQua, ip, lopId, vaiTro }) {
  try {
    let canhBaoIp = 0;
    if (ketQua === 'thanh_cong') {
      const truoc = await env.DB.prepare(
        `SELECT ip FROM nhat_ky_dang_nhap WHERE ma = ?1 AND lop_id = ?2 AND ket_qua = 'thanh_cong'
          ORDER BY id DESC LIMIT 1`
      ).bind(ma, lopId).first();
      if (truoc && truoc.ip && truoc.ip !== ip) canhBaoIp = 1;
    }
    await env.DB.prepare(
      'INSERT INTO nhat_ky_dang_nhap (ma, hoc_sinh_id, ket_qua, ip, lop_id, vai_tro, canh_bao_ip) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    ).bind(ma, hocSinhId ?? null, ketQua, ip, lopId, vaiTro, canhBaoIp).run();
  } catch { /* bảng/cột chưa có (chưa chạy migration) — bỏ qua, không chặn đăng nhập */ }
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  if (!env.SESSION_SECRET) {
    return json({ ok: false, message: 'Máy chủ chưa được cấu hình.' }, 500);
  }

  if (await tooManyTries(env, ip)) {
    return json({ ok: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.' }, 429);
  }

  let code = '';
  let lopSlug = '';
  let turnstileToken = '';
  try {
    const body = await request.json();
    code = String(body.code || '').trim();
    lopSlug = String(body.lop || '').trim();
    turnstileToken = String(body.turnstileToken || '').trim();
  } catch {
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  if (!code) return json({ ok: false, message: 'Vui lòng nhập mã bảo mật.' }, 400);

  if (!(await turnstileHopLe(env, turnstileToken, ip))) {
    return json({ ok: false, message: 'Xác minh "không phải robot" chưa xong hoặc đã hết hạn. Tải lại trang rồi thử lại.' }, 400);
  }

  // Màn đăng nhập cho người vào thẳng "?lop=<slug>" hoặc đã bấm chọn một lớp trong danh sách —
  // mã nhập vào PHẢI thuộc ĐÚNG lớp đang hiện trên màn hình đó, không được âm thầm đưa qua lớp
  // khác dù mã có khớp thật (vd giáo viên chủ nhiệm nhiều lớp gõ nhầm mã của lớp quen tay hơn).
  // Không có slug (vào link chung, không chọn lớp nào) thì vẫn giữ hành vi cũ: mã tự quyết định
  // vào lớp nào.
  let lopIdDaChon = null;
  let lopDaChonTen = '';
  if (lopSlug && env.DB) {
    try {
      const l = await env.DB.prepare('SELECT id, ten FROM lop WHERE slug = ?1').bind(lopSlug).first();
      if (l) { lopIdDaChon = l.id; lopDaChonTen = l.ten; }
    } catch { /* bảng chưa có cột slug — bỏ qua, coi như không chọn lớp nào */ }
  }
  const thongBaoSaiLop = () => json({
    ok: false,
    message: `Mã này không phải của ${lopDaChonTen || 'lớp bạn đã chọn'}. Bấm "‹ Chọn lại lớp khác" nếu em nhầm lớp, hoặc kiểm tra lại mã.`,
  }, 401);
  const khopDungLop = (lopId) => lopIdDaChon === null || lopId === lopIdDaChon;

  // Làm chậm nhẹ để hạn chế dò mã tự động.
  await new Promise((r) => setTimeout(r, 400));

  // Mã giáo viên: MỖI LỚP có một mã riêng trong ma_dang_nhap (khoá (lop_id, vai_tro)) — so
  // khớp mã nhập vào với TẤT CẢ các dòng vai_tro='teacher' (số lớp rất ít, quét hết là đủ
  // nhanh), dòng nào khớp thì biết luôn lớp nào. Riêng LỚP MẶC ĐỊNH (lopId=1): nếu lớp đó
  // CHƯA TỰ ĐẶT mã riêng qua web thì mới dùng biến môi trường cũ trên Cloudflare — kiểm tra
  // đúng "lớp 1 đã có dòng riêng chưa", KHÔNG PHẢI "cả bảng có trống hay không", để việc lớp
  // khác đã tự đặt mã không vô tình khoá luôn lối vào bằng biến môi trường của lớp 1.
  // Không còn "mã học sinh cả lớp" dùng chung nữa — mỗi em đăng nhập bằng đúng mã cá nhân của
  // mình (xem nhánh ma_ca_nhan bên dưới).
  let role = null;
  let phanBoSung = {};
  let tenHienThi = '';

  if (env.DB) {
    try {
      const { results: dsGiaoVien } = await env.DB.prepare(
        "SELECT lop_id AS lopId, ma FROM ma_dang_nhap WHERE vai_tro = 'teacher'"
      ).all();
      const khop = dsGiaoVien.find((dn) => safeEqual(code, dn.ma));
      const lop1DaTuDat = dsGiaoVien.some((dn) => dn.lopId === 1);
      if (khop) {
        if (!khopDungLop(khop.lopId)) return thongBaoSaiLop();
        role = 'teacher';
        phanBoSung = { lopId: khop.lopId };
      } else if (!lop1DaTuDat && env.TEACHER_CODE && safeEqual(code, env.TEACHER_CODE)) {
        if (!khopDungLop(1)) return thongBaoSaiLop();
        role = 'teacher';
        phanBoSung = { lopId: 1 };
      }
    } catch {
      // Bảng chưa tồn tại (chưa chạy migration) — dùng biến môi trường như trước, lớp mặc định.
      if (env.TEACHER_CODE && safeEqual(code, env.TEACHER_CODE)) {
        if (!khopDungLop(1)) return thongBaoSaiLop();
        role = 'teacher';
        phanBoSung = { lopId: 1 };
      }
    }
  } else if (env.TEACHER_CODE && safeEqual(code, env.TEACHER_CODE)) {
    if (!khopDungLop(1)) return thongBaoSaiLop();
    role = 'teacher';
    phanBoSung = { lopId: 1 };
  }

  if (!role && env.DB) {
    // Không khớp mã giáo viên nào — thử tìm trong bảng tài khoản đặc biệt
    // (lớp trưởng, thủ quỹ... do giáo viên tự cấp trên web).
    try {
      const phu = await env.DB.prepare(
        'SELECT id, ten, vai_tro, quyen, lop_id AS lopId FROM tai_khoan_phu WHERE ma = ?1 AND dang_hoat_dong = 1'
      ).bind(code).first();

      if (phu) {
        if (!khopDungLop(phu.lopId)) return thongBaoSaiLop();
        role = 'phu';
        tenHienThi = phu.ten;
        phanBoSung = {
          phuId: phu.id,
          ten: phu.ten,
          vaiTro: phu.vai_tro,
          quyen: (phu.quyen || '').split(',').map((s) => s.trim()).filter(Boolean),
          lopId: phu.lopId,
        };
      }
    } catch {
      // Bảng chưa tồn tại (chưa chạy migration) — coi như không khớp, không chặn đăng nhập thường.
    }
  }

  // Mã cá nhân của học sinh — giờ là cách DUY NHẤT học sinh vào trang lớp (không còn mã cả
  // lớp dùng chung). Hai trường hợp:
  //   - Không được cấp quyền quản lý: role 'student' như trước, xem được mọi thứ công khai,
  //     KHÔNG giới hạn thiết bị (không có gì để mất nếu xem từ nhiều máy).
  //   - ĐƯỢC CẤP quyền quản lý: role 'phu' + quyen, RÀNG BUỘC 1 mã = 1 thiết bị + ghi nhật ký
  //     đăng nhập, vì tài khoản này có thể sửa/xoá dữ liệu thật.
  let ketQuaThietBi = null;
  let dongCookieThietBi = null;
  if (!role && env.DB) {
    try {
      const ca = await env.DB.prepare(
        `SELECT m.hoc_sinh_id AS hocSinhId, m.quyen, m.thiet_bi AS thietBi, m.lop_id AS lopId,
                h.ho_ten AS hoTen, h.chuc_vu AS chucVu, h.to_so AS toSo
           FROM ma_ca_nhan m JOIN hoc_sinh h ON h.id = m.hoc_sinh_id
          WHERE m.ma = ?1 AND h.dang_hoc = 1`
      ).bind(code).first();

      if (ca && !khopDungLop(ca.lopId)) return thongBaoSaiLop();

      if (ca && !ca.quyen) {
        role = 'student';
        tenHienThi = ca.hoTen;
        phanBoSung = { hocSinhId: ca.hocSinhId, ten: ca.hoTen, ma: code, lopId: ca.lopId, toSo: ca.toSo, chucVu: ca.chucVu };
      } else if (ca && ca.quyen) {
        const thietBiMay = docThietBi(request);
        if (!ca.thietBi) {
          // Lần đầu đăng nhập bằng mã này — gắn luôn vào máy đang dùng.
          const idMoi = thietBiMay || taoThietBi();
          await env.DB.prepare('UPDATE ma_ca_nhan SET thiet_bi = ?1 WHERE hoc_sinh_id = ?2').bind(idMoi, ca.hocSinhId).run();
          if (!thietBiMay) {
            dongCookieThietBi = `thiet_bi_id=${idMoi}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
          }
          ketQuaThietBi = 'thanh_cong';
        } else if (thietBiMay === ca.thietBi) {
          ketQuaThietBi = 'thanh_cong';
        } else {
          ketQuaThietBi = 'sai_thiet_bi';
        }

        if (ketQuaThietBi === 'sai_thiet_bi') {
          await ghiNhatKyDangNhap(env, { ma: code, hocSinhId: ca.hocSinhId, ketQua: ketQuaThietBi, ip, lopId: ca.lopId, vaiTro: 'phu' });
          return json({
            ok: false,
            message: 'Mã này đã đăng nhập trên một thiết bị khác. Nhờ giáo viên chủ nhiệm đặt lại thiết bị nếu đây là máy mới của em.',
          }, 403);
        }

        role = 'phu';
        tenHienThi = ca.hoTen;
        phanBoSung = {
          hocSinhId: ca.hocSinhId,
          ten: ca.hoTen,
          ma: code,
          vaiTro: ca.chucVu || 'Cán sự lớp',
          quyen: ca.quyen.split(',').map((s) => s.trim()).filter(Boolean),
          lopId: ca.lopId,
          toSo: ca.toSo,
        };
      }
    } catch {
      // Bảng/cột chưa tồn tại (chưa chạy migration) — coi như không khớp.
    }
  }

  if (!role) return json({ ok: false, message: 'Mã bảo mật không đúng. Vui lòng hỏi lại giáo viên chủ nhiệm.' }, 401);

  // Ghi nhật ký đăng nhập cho MỌI vai trò đăng nhập thành công (giáo viên, tài khoản phụ, mã cá
  // nhân thường/có quyền) — trước đây chỉ ghi mã được cấp quyền quản lý. Đặt MỘT chỗ duy nhất ở
  // đây (thay vì rải rác theo từng nhánh) để không sót/không ghi trùng.
  if (env.DB) {
    await ghiNhatKyDangNhap(env, {
      ma: code, hocSinhId: phanBoSung.hocSinhId ?? null, ketQua: 'thanh_cong', ip, lopId: phanBoSung.lopId, vaiTro: role,
    });
  }

  await clearTries(env, ip);
  const token = await createToken(env.SESSION_SECRET, { role, ...phanBoSung }, SESSION_TTL);
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL}`,
  ].join('; ');

  const headers = { 'Set-Cookie': cookie };
  return json({ ok: true, role, ten: tenHienThi }, 200, headers, dongCookieThietBi);
}

export function onRequestGet() {
  return json({ ok: false, message: 'Phương thức không được hỗ trợ.' }, 405);
}
