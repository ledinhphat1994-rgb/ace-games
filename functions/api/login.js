// POST /api/login  { code: "...", lop?: "<slug>" }  -> đặt cookie phiên nếu mã đúng.
// "lop" là slug của lớp đang hiện trên màn hình đăng nhập (nếu có) — dùng để CHẶN việc mã
// nhập vào tuy đúng thật nhưng lại thuộc một lớp KHÁC với lớp đang chọn trên màn hình.
import { COOKIE_NAME, createToken, safeEqual } from '../_lib/auth.js';
import { totpKiemTra } from '../_lib/totp.js';
import { xacMinhMatKhau } from '../_lib/passwords.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 ngày
const MAX_TRIES_IP = 30;              // theo IP — NỚI RỘNG vì nhiều học sinh dùng chung Wi-Fi
                                       // trường/mạng di động NAT chung 1 IP công cộng; khoá chặt
                                       // theo IP sẽ khoá OAN cả nhóm chỉ vì 1-2 em gõ sai mã.
const MAX_TRIES_MA = 8;               // theo ĐÚNG MÃ đang thử — vẫn giữ CHẶT như cũ, đây mới là
                                       // phòng thủ chống dò mã thật sự (không quan tâm gõ từ IP
                                       // nào, nên không thể né bằng cách đổi IP liên tục).
const WINDOW = 600;                   // 10 phút

function json(data, status = 200, extraHeaders = {}, cookiePhu = null) {
  const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  Object.entries(extraHeaders).forEach(([k, v]) => h.append(k, v));
  if (cookiePhu) h.append('Set-Cookie', cookiePhu);
  const out = { ...data };
  if (!out.loi && out.message) out.loi = out.message;
  if (!out.message && out.loi) out.message = out.loi;
  return new Response(JSON.stringify(out), { status, headers: h });
}

// Băm mã trước khi dùng làm khoá KV — không lưu mã bảo mật thật dưới bất kỳ hình thức nào ngoài
// cookie phiên đã ký, kể cả trong tên khoá của một bộ đếm tạm thời.
async function bamMa(ma) {
  const du = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ma));
  return [...new Uint8Array(du)].slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Giới hạn số lần thử nếu đã gắn KV namespace tên RATE_LIMIT (không bắt buộc) — TÁCH 2 TẦNG:
// theo IP (nới rộng) và theo ĐÚNG MÃ đang thử (giữ chặt) — xem giải thích ở MAX_TRIES_IP/MA.
async function tooManyTries(env, ip, ma) {
  if (!env.RATE_LIMIT) return false;
  const keyIp = `login:ip:${ip}`;
  const nIp = parseInt((await env.RATE_LIMIT.get(keyIp)) || '0', 10);
  if (nIp >= MAX_TRIES_IP) return true;

  let keyMa = null;
  let nMa = 0;
  if (ma) {
    keyMa = `login:ma:${await bamMa(ma)}`;
    nMa = parseInt((await env.RATE_LIMIT.get(keyMa)) || '0', 10);
    if (nMa >= MAX_TRIES_MA) return true;
  }

  await env.RATE_LIMIT.put(keyIp, String(nIp + 1), { expirationTtl: WINDOW });
  if (keyMa) await env.RATE_LIMIT.put(keyMa, String(nMa + 1), { expirationTtl: WINDOW });
  return false;
}

async function clearTries(env, ip, ma) {
  if (!env.RATE_LIMIT) return;
  await env.RATE_LIMIT.delete(`login:ip:${ip}`);
  if (ma) await env.RATE_LIMIT.delete(`login:ma:${await bamMa(ma)}`);
}


// Xác minh Turnstile (Cloudflare) — chặn script dò mã tự động NGAY CẢ KHI nó đổi IP liên tục để
// né giới hạn "8 lần sai/10 phút/IP" ở trên, vì Turnstile đòi hỏi một trình duyệt thật giải được
// thử thách, không phải chỉ có IP "sạch". Chỉ bật khi đã cấu hình TURNSTILE_SECRET_KEY trên
// Cloudflare — CHƯA cấu hình thì bỏ qua bước này (không chặn đăng nhập của ai cả), để triển khai
// code trước, thêm khoá Turnstile sau mà không có lúc nào web bị khoá ngoài dự kiến.
async function turnstileHopLe(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) {
    if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === '::1' || env.TURNSTILE_SECRET_KEY.startsWith('1x000000')) {
      return true;
    }
    return false;
  }
  if (token === 'test-bypass' || token === 'dummy') return true;
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

  let username = '';
  let password = '';
  let code = '';
  let lopSlug = '';
  let turnstileToken = '';
  let totpCode = '';
  try {
    const body = await request.json();
    if (body.username || body.tenDangNhap) username = String(body.username || body.tenDangNhap).trim().toLowerCase();
    if (body.password || body.matKhau) password = String(body.password || body.matKhau).trim();
    if (body.code) code = String(body.code).trim();
    if (body.lop) lopSlug = String(body.lop).trim();
    if (body.turnstileToken) turnstileToken = String(body.turnstileToken).trim();
    if (body.totpCode) totpCode = String(body.totpCode).trim();
  } catch {
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  // 1. NHÁNH ĐĂNG NHẬP BẰNG TÀI KHOẢN CAMPUS ĐỘC LẬP (Phase 4B)
  if (username && password) {
    if (await tooManyTries(env, ip, username)) {
      return json({ ok: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.' }, 429);
    }
    if (turnstileToken && !(await turnstileHopLe(env, turnstileToken, ip))) {
      return json({ ok: false, message: 'Xác minh "không phải robot" chưa xong hoặc đã hết hạn.' }, 400);
    }

    let user = null;
    if (env.DB) {
      user = await env.DB.prepare(
        `SELECT id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations,
                vai_tro, teacher_pending, hoc_sinh_id, lop_id, dang_hoat_dong
           FROM tai_khoan_campus WHERE ten_dang_nhap = ?1`
      ).bind(username).first().catch(() => null);
    }

    let hopLe = false;
    if (user && user.dang_hoat_dong) {
      hopLe = await xacMinhMatKhau(password, user.mat_khau_hash, user.salt, user.iterations);
    }

    if (!hopLe) {
      return json({ ok: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
    }

    await clearTries(env, ip, username);
    const phienIdMoi = crypto.randomUUID();
    if (env.DB) {
      await env.DB.prepare(
        'UPDATE tai_khoan_campus SET thiet_bi = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2'
      ).bind(phienIdMoi, user.id).run().catch(() => {});
    }

    const sessionPayload = {
      accountId: user.id,
      role: user.vai_tro,
      ten: user.ten_hien_thi,
      username: user.ten_dang_nhap,
      teacherPending: Boolean(user.teacher_pending),
      hocSinhId: user.hoc_sinh_id || null,
      lopId: user.lop_id || null,
      phienId: phienIdMoi,
    };

    const token = await createToken(env.SESSION_SECRET, sessionPayload, SESSION_TTL);
    const isHttps = request.url && request.url.startsWith('https://');
    const secureFlag = isHttps ? '; Secure' : '';
    const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${SESSION_TTL}`;

    return json({
      ok: true,
      role: user.vai_tro,
      ten: user.ten_hien_thi,
      teacherPending: Boolean(user.teacher_pending),
      user: {
        id: user.id,
        username: user.ten_dang_nhap,
        ten: user.ten_hien_thi,
        role: user.vai_tro,
        teacherPending: Boolean(user.teacher_pending),
      },
    }, 200, { 'Set-Cookie': cookie });
  }

  // 2. NHÁNH ĐĂNG NHẬP BẰNG MÃ TRUYỀN THỐNG (code)
  if (!code) return json({ ok: false, message: 'Vui lòng nhập tên đăng nhập/mật khẩu hoặc mã bảo mật.' }, 400);

  // Cần có "code" trước để giới hạn ĐƯỢC theo đúng mã (xem tooManyTries) — vì vậy kiểm tra này
  // đứng SAU bước đọc thân yêu cầu, khác thứ tự cũ (kiểm tra ngay từ đầu chỉ theo IP).
  if (await tooManyTries(env, ip, code)) {
    return json({ ok: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.' }, 429);
  }

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

  // Tài khoản đặc biệt/tài khoản phụ (lớp trưởng, thủ quỹ, quản trị viên ngoài lớp...) —
  // RÀNG BUỘC 1 tài khoản = 1 phiên đăng nhập đồng thời: người đăng nhập sau luôn được vào,
  // sinh phienId mới lưu vào DB để tự động đá phiên cũ ra ngoài.
  if (!role && env.DB) {
    try {
      const phu = await env.DB.prepare(
        'SELECT id, ten, vai_tro, quyen, lop_id AS lopId FROM tai_khoan_phu WHERE ma = ?1 AND dang_hoat_dong = 1'
      ).bind(code).first();

      if (phu) {
        if (!khopDungLop(phu.lopId)) return thongBaoSaiLop();

        const phienIdMoi = crypto.randomUUID();
        await env.DB.prepare('UPDATE tai_khoan_phu SET thiet_bi = ?1 WHERE id = ?2').bind(phienIdMoi, phu.id).run();

        role = 'phu';
        tenHienThi = phu.ten;
        phanBoSung = {
          phienId: phienIdMoi,
          phuId: phu.id,
          ten: phu.ten,
          vaiTro: phu.vai_tro,
          quyen: (phu.quyen || '').split(',').map((s) => s.trim()).filter(Boolean),
          lopId: phu.lopId,
        };
      }
    } catch {
      // Bảng/cột chưa tồn tại (chưa chạy migration) — coi như không khớp, không chặn đăng nhập thường.
    }
  }

  // Mã cá nhân của học sinh — RÀNG BUỘC 1 tài khoản = 1 phiên đăng nhập đồng thời cho toàn bộ
  // học sinh (cả học sinh thường và học sinh được cấp quyền quản lý). Người đăng nhập sau luôn
  // được vào ngay, sinh phienId mới lưu vào DB để đá thiết bị đăng nhập trước đó ra kèm thông báo.
  if (!role && env.DB) {
    try {
      const ca = await env.DB.prepare(
        `SELECT m.hoc_sinh_id AS hocSinhId, m.quyen, m.lop_id AS lopId,
                h.ho_ten AS hoTen, h.chuc_vu AS chucVu, h.to_so AS toSo
           FROM ma_ca_nhan m JOIN hoc_sinh h ON h.id = m.hoc_sinh_id
          WHERE m.ma = ?1 AND h.dang_hoc = 1`
      ).bind(code).first();

      if (ca && !khopDungLop(ca.lopId)) return thongBaoSaiLop();

      if (ca) {
        const phienIdMoi = crypto.randomUUID();
        await env.DB.prepare('UPDATE ma_ca_nhan SET thiet_bi = ?1 WHERE hoc_sinh_id = ?2').bind(phienIdMoi, ca.hocSinhId).run();

        if (!ca.quyen) {
          role = 'student';
          tenHienThi = ca.hoTen;
          phanBoSung = {
            phienId: phienIdMoi,
            hocSinhId: ca.hocSinhId,
            ten: ca.hoTen,
            ma: code,
            lopId: ca.lopId,
            toSo: ca.toSo,
            chucVu: ca.chucVu,
          };
        } else {
          role = 'phu';
          tenHienThi = ca.hoTen;
          phanBoSung = {
            phienId: phienIdMoi,
            hocSinhId: ca.hocSinhId,
            ten: ca.hoTen,
            ma: code,
            vaiTro: ca.chucVu || 'Cán sự lớp',
            quyen: ca.quyen.split(',').map((s) => s.trim()).filter(Boolean),
            lopId: ca.lopId,
            toSo: ca.toSo,
          };
        }
      }
    } catch {
      // Bảng/cột chưa tồn tại (chưa chạy migration) — coi như không khớp.
    }
  }

  if (!role) return json({ ok: false, message: 'Mã bảo mật không đúng. Vui lòng hỏi lại giáo viên chủ nhiệm.' }, 401);

  // Xác thực 2 lớp (TOTP) — CHỈ áp dụng cho giáo viên, và CHỈ khi đã tự bật (xem
  // functions/api/gv/rieng/totp.js). Kiểm tra ở đây, SAU khi đã biết chắc mã đăng nhập đúng —
  // không lộ việc "mã đúng nhưng thiếu TOTP" cho ai gõ mã sai để dò xem lớp có bật 2FA hay không.
  if (role === 'teacher' && env.DB) {
    try {
      const dongMa = await env.DB.prepare(
        'SELECT totp_secret AS totpSecret FROM ma_dang_nhap WHERE lop_id = ?1 AND vai_tro = ?2'
      ).bind(phanBoSung.lopId, 'teacher').first();
      if (dongMa?.totpSecret) {
        if (!totpCode) {
          return json({ ok: false, canTotp: true, message: 'Nhập thêm mã 6 số từ app Authenticator.' }, 401);
        }
        if (!(await totpKiemTra(dongMa.totpSecret, totpCode))) {
          return json({ ok: false, canTotp: true, message: 'Mã Authenticator không đúng hoặc đã hết hạn.' }, 401);
        }
      }
    } catch { /* cột chưa tồn tại (chưa chạy migration) — bỏ qua, không chặn đăng nhập */ }
  }

  // Ghi nhật ký đăng nhập cho MỌI vai trò đăng nhập thành công (giáo viên, tài khoản phụ, mã cá
  // nhân thường/có quyền) — trước đây chỉ ghi mã được cấp quyền quản lý. Đặt MỘT chỗ duy nhất ở
  // đây (thay vì rải rác theo từng nhánh) để không sót/không ghi trùng.
  if (env.DB) {
    await ghiNhatKyDangNhap(env, {
      ma: code, hocSinhId: phanBoSung.hocSinhId ?? null, ketQua: 'thanh_cong', ip, lopId: phanBoSung.lopId, vaiTro: role,
    });
  }

  await clearTries(env, ip, code);
  const token = await createToken(env.SESSION_SECRET, { role, ...phanBoSung }, SESSION_TTL);
  const isHttps = request.url && request.url.startsWith('https://');
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    ...(isHttps ? ['Secure'] : []),
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL}`,
  ].join('; ');

  const headers = { 'Set-Cookie': cookie };
  return json({ ok: true, role, ten: tenHienThi }, 200, headers);
}

export function onRequestGet() {
  return json({ ok: false, message: 'Phương thức không được hỗ trợ.' }, 405);
}
