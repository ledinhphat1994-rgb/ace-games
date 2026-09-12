// ==============================================================================
// cong-cu/qa-phase4b1-hardening.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN PHASE 4B.1:
// ACCOUNT LINKAGE, CANONICAL IDENTITY, ROOM ADMISSION & AUTH HARDENING
// ==============================================================================
import crypto from 'crypto';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = {
  auth: { pass: 0, fail: 0 },
  scope: { pass: 0, fail: 0 },
  identity: { pass: 0, fail: 0 },
  chat: { pass: 0, fail: 0 },
  admission: { pass: 0, fail: 0 },
  game: { pass: 0, fail: 0 },
  linkage: { pass: 0, fail: 0 },
  race: { pass: 0, fail: 0 },
};

function ok(ten, dk, group = 'identity', chiTiet = '') {
  if (dk) {
    pass++;
    if (resultsByGroup[group]) resultsByGroup[group].pass++;
    console.log(`  ✅ [${group.toUpperCase()}] ${ten}`);
  } else {
    fail++;
    if (resultsByGroup[group]) resultsByGroup[group].fail++;
    console.log(`  ❌ [${group.toUpperCase()}] ${ten} ${chiTiet}`);
  }
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function api(path, { method = 'GET', body = null, cookie = null, headers = {} } = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  if (cookie) reqHeaders['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, ok: res.ok, data, headers: res.headers, setCookie };
}

function parseCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const match = setCookieHeader.match(/([^=;\s]+=[^;]+)/);
  return match ? match[1] : '';
}

console.log('================================================================');
console.log(`CHẠY BỘ KIỂM THỬ PHASE 4B.1 HARDENING TẠI: ${BASE}`);
console.log('================================================================\n');

try {
  // ── SEEDING DỮ LIỆU TEST CHO REDEMPTION & LINKAGE TRÊN LOCAL D1 ──
  console.log('--- 0. Khởi tạo dữ liệu kiểm thử invite codes trên D1 ---');
  const codeLink1 = 'A7-LINK-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const hashLink1 = sha256Hex(codeLink1);

  const codeDup1 = 'A7-DUP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const hashDup1 = sha256Hex(codeDup1);

  const codeRace1 = 'A7-RACE-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const hashRace1 = sha256Hex(codeRace1);

  try {
    const seedSql = `
      DELETE FROM ma_truy_cap_cong_dong WHERE hoc_sinh_id IN (2, 3, 4);
      DELETE FROM community_membership WHERE hoc_sinh_id IN (2, 3, 4);
      UPDATE tai_khoan_campus SET hoc_sinh_id = NULL, lop_id = NULL WHERE hoc_sinh_id IN (2, 3, 4);

      INSERT INTO ma_truy_cap_cong_dong (ma_code, ma_hash, ma_hien_thi, lop_id, hoc_sinh_id, ten_goi, so_lan_dung_toi_da, so_lan_da_dung, dang_hoat_dong)
      VALUES
        ('sha256:${hashLink1}', '${hashLink1}', 'A7-****-LINK', 1, 2, 'Mã test liên kết 1', 1, 0, 1),
        ('sha256:${hashDup1}', '${hashDup1}', 'A7-****-DUP', 1, 2, 'Mã test trùng học sinh', 1, 0, 1),
        ('sha256:${hashRace1}', '${hashRace1}', 'A7-****-RACE', 1, 4, 'Mã test tranh chấp race', 1, 0, 1);
    `.replace(/\r?\n/g, ' ');

    execSync(`npx wrangler d1 execute lop-10a7-db --local --command="${seedSql}"`, { stdio: 'pipe' });
    console.log('  -> Đã nạp thành công 3 mã mời kiểm thử vào local D1.');
  } catch (e) {
    console.log('  [Cảnh báo seeder local D1: ' + e.message + ']');
  }

  // ── 1. AUTHENTICATION & TURNSTILE BOT PROTECTION HARDENING ──
  console.log('\n--- 1. Auth & Turnstile Hardening ---');
  const randTag = Date.now().toString().slice(-6);
  const userA = `stu_4b1_a_${randTag}`;
  const userB = `stu_4b1_b_${randTag}`;
  const passShort = '12345';
  const passValid = 'StrongPass4B1!';

  // 1.1 Password min length >= 8 characters
  const resShort = await api('/api/register', {
    method: 'POST',
    body: { username: `short_${randTag}`, displayName: 'Short Pass', password: passShort, accountType: 'student' }
  });
  ok('Từ chối đăng ký mật khẩu ngắn (< 8 ký tự)', resShort.status === 400 && resShort.data?.loi?.includes('8 ký tự'), 'auth', `status=${resShort.status}`);

  // 1.2 Đăng ký Account A hợp lệ
  const resRegA = await api('/api/register', {
    method: 'POST',
    body: { username: userA, displayName: 'Học Sinh A', password: passValid, accountType: 'student' }
  });
  ok('Đăng ký tài khoản A thành công (HTTP 200)', resRegA.status === 200 && resRegA.data?.ok === true, 'auth');

  // 1.3 Đăng ký Account B hợp lệ
  const resRegB = await api('/api/register', {
    method: 'POST',
    body: { username: userB, displayName: 'Học Sinh B', password: passValid, accountType: 'student' }
  });
  ok('Đăng ký tài khoản B thành công (HTTP 200)', resRegB.status === 200 && resRegB.data?.ok === true, 'auth');

  // 1.4 Đăng nhập Account A
  const resLoginA = await api('/api/login', {
    method: 'POST',
    body: { username: userA, password: passValid }
  });
  ok('Đăng nhập tài khoản A thành công (HTTP 200)', resLoginA.status === 200 && resLoginA.data?.ok === true, 'auth');
  const cookieA = parseCookie(resLoginA.setCookie);
  ok('Cookie phiên A được thiết lập', Boolean(cookieA), 'auth');

  // 1.5 Đăng nhập Account B
  const resLoginB = await api('/api/login', {
    method: 'POST',
    body: { username: userB, password: passValid }
  });
  ok('Đăng nhập tài khoản B thành công (HTTP 200)', resLoginB.status === 200 && resLoginB.data?.ok === true, 'auth');
  const cookieB = parseCookie(resLoginB.setCookie);
  ok('Cookie phiên B được thiết lập', Boolean(cookieB), 'auth');

  // 1.6 Kiểm tra Whoami tài khoản Campus mới (chưa liên kết học sinh)
  const resWhoamiA = await api('/api/whoami', { cookie: cookieA });
  ok('Whoami trả về accountId', resWhoamiA.data?.accountId > 0, 'auth');
  ok('Whoami tài khoản mới có hocSinhId = null', resWhoamiA.data?.hocSinhId === null, 'auth');
  ok('Whoami tài khoản mới có lopId = null', resWhoamiA.data?.lopId === null, 'auth');
  ok('Whoami trả về isLinkedStudent = false', resWhoamiA.data?.isLinkedStudent === false, 'auth');
  ok('Whoami trả về isVerifiedTeacher = false', resWhoamiA.data?.isVerifiedTeacher === false, 'auth');
  ok('Whoami tài khoản mới coQuyenCongDong = false', resWhoamiA.data?.coQuyenCongDong === false, 'auth');

  // ── 2. CLASS ROOM RESTRICTION & FORBIDDEN GAME ROOM CREATION ──
  console.log('\n--- 2. Class Scope & Forbidden Room Creation Invariants ---');
  // 2.1 Tài khoản chưa liên kết lớp KHÔNG ĐƯỢC tạo phòng phamVi = 'lop'
  const resTaoLopA = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: { hanhDong: 'tao', ten: 'Phòng Lớp Không Hợp Lệ', loai: 'chat', phamVi: 'lop' }
  });
  ok('Chặn tài khoản chưa có lớp tạo phòng phamVi=lop (HTTP 403)', resTaoLopA.status === 403, 'scope', `status=${resTaoLopA.status}`);

  // 2.2 Không cho tạo phòng loai = 'game' qua API phong.js (phải qua Game Arena)
  const resTaoGamePhong = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: { hanhDong: 'tao', ten: 'Phòng Game Duplicate', loai: 'game', phamVi: 'truong' }
  });
  ok('Chặn tạo phòng generic loai=game trong phong.js (HTTP 400)', resTaoGamePhong.status === 400, 'scope', `status=${resTaoGamePhong.status}`);

  // ── 3. CANONICAL ACTOR KEY & CINEMA / FOCUS HOST REGRESSION TESTS ──
  console.log('\n--- 3. Canonical Actor Key & Host Controls (Cinema / Focus) ---');
  // 3.1 Account A tạo phòng Cinema công khai
  const resTaoCinema = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: {
      hanhDong: 'tao',
      ten: `Cinema Phòng của A ${randTag}`,
      loai: 'video',
      phamVi: 'truong',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  });
  ok('Account A tạo phòng Cinema thành công (HTTP 200)', resTaoCinema.status === 200 && resTaoCinema.data?.ok === true, 'identity');
  const cinemaId = resTaoCinema.data?.phong?.id;
  ok('Phòng Cinema có ID hợp lệ', cinemaId > 0, 'identity');
  ok('Tạo phòng không để lộ chuPhongKhoa hay internal keys', !resTaoCinema.data?.phong?.chuPhongKhoa && !resTaoCinema.data?.phong?.chu_phong_khoa, 'identity');

  // 3.2 Account A truy cập state Cinema -> canControl PHẢI LÀ TRUE
  const resWatchStateA = await api(`/api/phong-watch?phongId=${cinemaId}`, { cookie: cookieA });
  ok('Account A là Host của Cinema room (canControl = true)', resWatchStateA.data?.canControl === true, 'identity');

  // 3.3 Account A điều khiển Play/Pause video
  const resPlay = await api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: cinemaId, action: 'play', position: 10, expectedRevision: 1 }
  });
  ok('Host A có thể Play video (HTTP 200)', resPlay.status === 200 && resPlay.data?.state?.playing === true, 'identity');

  const resPause = await api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: cinemaId, action: 'pause', position: 15, expectedRevision: 2 }
  });
  ok('Host A có thể Pause video (HTTP 200)', resPause.status === 200 && resPause.data?.state?.playing === false, 'identity');

  // 3.4 Account A tạo phòng Focus / Music
  const resTaoFocus = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: {
      hanhDong: 'tao',
      ten: `Focus Phòng của A ${randTag}`,
      loai: 'nhac',
      phamVi: 'truong',
      nhacUrl: 'https://example.com/stream.mp3'
    }
  });
  ok('Account A tạo phòng Focus thành công (HTTP 200)', resTaoFocus.status === 200 && resTaoFocus.data?.ok === true, 'identity');
  const focusId = resTaoFocus.data?.phong?.id;
  ok('Phòng Focus có ID hợp lệ', focusId > 0, 'identity');

  // 3.5 Account A truy cập Focus state -> canControl PHẢI LÀ TRUE
  const resFocusStateA = await api(`/api/phong-focus?phongId=${focusId}`, { cookie: cookieA });
  ok('Account A là Host của Focus room (canControl = true)', resFocusStateA.data?.canControl === true, 'identity');

  // 3.6 Account A điều khiển Start/Pause Focus timer
  const resStartFocus = await api('/api/phong-focus', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: focusId, action: 'start', expectedRevision: 1 }
  });
  ok('Host A có thể Start Focus timer (HTTP 200)', resStartFocus.status === 200 && resStartFocus.data?.state?.status === 'running', 'identity');

  const resPauseFocus = await api('/api/phong-focus', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: focusId, action: 'pause', expectedRevision: 2 }
  });
  ok('Host A có thể Pause Focus timer (HTTP 200)', resPauseFocus.status === 200 && resPauseFocus.data?.state?.status === 'paused', 'identity');

  // 3.7 Account B vào phòng Focus của A -> canControl PHẢI LÀ FALSE
  await api('/api/phong', { method: 'POST', cookie: cookieB, body: { hanhDong: 'vao', phongId: focusId } });
  const resFocusStateB = await api(`/api/phong-focus?phongId=${focusId}`, { cookie: cookieB });
  ok('Account B trong phòng của A có canControl = false', resFocusStateB.status === 200 && resFocusStateB.data?.canControl === false, 'identity');

  // 3.8 Account B cố gắng điều khiển timer -> BỊ CHẶN 403
  const resNonHostControl = await api('/api/phong-focus', {
    method: 'POST',
    cookie: cookieB,
    body: { phongId: focusId, action: 'start', expectedRevision: 3 }
  });
  ok('Account B bị chặn 403 khi cố điều khiển timer phòng người khác', resNonHostControl.status === 403, 'identity');

  // ── 4. FOCUS ROOM TYPE INVARIANT ──
  console.log('\n--- 4. Focus Room Type Invariant ---');
  // 4.1 Gọi Focus API trên phòng Cinema (loai = 'video') -> BỊ TỪ CHỐI 400
  const resFocusOnVideoGet = await api(`/api/phong-focus?phongId=${cinemaId}`, { cookie: cookieA });
  ok('GET /api/phong-focus trên phòng video bị từ chối 400', resFocusOnVideoGet.status === 400, 'scope');

  const resFocusOnVideoPost = await api('/api/phong-focus', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: cinemaId, action: 'start', expectedRevision: 1 }
  });
  ok('POST /api/phong-focus trên phòng video bị từ chối 400', resFocusOnVideoPost.status === 400, 'scope');

  // ── 5. CHAT CANONICAL IDENTITY & ANTI-SPAM ISOLATION ──
  console.log('\n--- 5. Chat Canonical Identity & Anti-spam Isolation ---');
  // 5.1 Tạo phòng Chat chung
  const resTaoChat = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: { hanhDong: 'tao', ten: `Chat Lobby Test ${randTag}`, loai: 'chat', phamVi: 'truong' }
  });
  const chatId = resTaoChat.data?.phong?.id;

  // Account B vào phòng Chat
  await api('/api/phong', { method: 'POST', cookie: cookieB, body: { hanhDong: 'vao', phongId: chatId } });

  // 5.2 Account A gửi tin nhắn
  const resChatA = await api('/api/phong-chat', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: chatId, noiDung: 'Tin nhắn chào từ A' }
  });
  ok('Account A gửi tin nhắn thành công (HTTP 200)', resChatA.status === 200 && resChatA.data?.ok === true, 'chat');

  // 5.3 Ngay lập tức Account B gửi tin nhắn (KHÔNG ĐƯỢC BỊ CHẶN BỞI WINDOW SPAM CỦA A)
  const resChatB1 = await api('/api/phong-chat', {
    method: 'POST',
    cookie: cookieB,
    body: { phongId: chatId, noiDung: 'Tin nhắn chào từ B' }
  });
  ok('Account B gửi tin ngay không bị dính spam của A (actorKey độc lập, HTTP 200)', resChatB1.status === 200, 'chat');

  // 5.4 Account B gửi tiếp tin thứ hai ngay lập tức -> PHẢI BỊ CHẶN 429 SPAM CỦA CHÍNH B
  const resChatB2 = await api('/api/phong-chat', {
    method: 'POST',
    cookie: cookieB,
    body: { phongId: chatId, noiDung: 'Tin nhắn spam nhanh của B' }
  });
  ok('Account B gửi tin thứ 2 trong 3s bị rate limit 429', resChatB2.status === 429, 'chat');

  // ── 6. PASSWORD ROOM ADMISSION BOUNDARY & DIRECT API BYPASS MATRIX ──
  console.log('\n--- 6. Password Room Admission Boundary & Bypass Defense ---');
  // Đóng bớt phòng chat cũ của A để không vượt quá SO_PHONG_TOI_DA = 3
  await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: chatId } });

  const roomPass = 'SecretVault4B1!';
  // 6.1 Account A tạo phòng Chat khoá mật khẩu
  const resTaoLocked = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: {
      hanhDong: 'tao',
      ten: `Phòng Mật Khẩu Kín ${randTag}`,
      loai: 'chat',
      phamVi: 'truong',
      accessMode: 'password',
      matKhau: roomPass,
      sucChua: 10
    }
  });
  const lockedId = resTaoLocked.data?.phong?.id;
  ok('Tạo phòng có mật khẩu thành công', lockedId > 0 && resTaoLocked.data?.phong?.accessMode === 'password', 'admission');

  // 6.2 Account B xem chi tiết phòng KHI CHƯA NHẬP MẬT KHẨU
  const resLockedDetailB = await api(`/api/phong?id=${lockedId}`, { cookie: cookieB });
  ok('Preview phòng mật khẩu trả về ok=true', resLockedDetailB.status === 200 && resLockedDetailB.data?.ok === true, 'admission');
  ok('Preview phòng mật khẩu ẩn danh sách thành viên', Array.isArray(resLockedDetailB.data?.thanhVien) && resLockedDetailB.data?.thanhVien.length === 0, 'admission');
  ok('Preview phòng mật khẩu cờ admissionRequired = true', resLockedDetailB.data?.phong?.admissionRequired === true, 'admission');
  ok('Preview phòng mật khẩu không để lộ chuPhongKhoa', !resLockedDetailB.data?.phong?.chuPhongKhoa, 'admission');

  // 6.3 MA TRẬN CHẶN DIRECT API TRƯỚC KHI ĐƯỢC ADMIT (Direct Bypass Matrix)
  const resBypassChatGet = await api(`/api/phong-chat?phongId=${lockedId}`, { cookie: cookieB });
  ok('Chặn GET /api/phong-chat phòng khoá khi chưa vào (HTTP 403)', resBypassChatGet.status === 403, 'admission');

  const resBypassChatPost = await api('/api/phong-chat', {
    method: 'POST',
    cookie: cookieB,
    body: { phongId: lockedId, noiDung: 'Tin nhắn lậu' }
  });
  ok('Chặn POST /api/phong-chat phòng khoá khi chưa vào (HTTP 403)', resBypassChatPost.status === 403, 'admission');

  // 6.4 Nhập sai mật khẩu -> BỊ TỪ CHỐI 403
  const resWrongPass = await api('/api/phong', {
    method: 'POST',
    cookie: cookieB,
    body: { hanhDong: 'vao', phongId: lockedId, password: 'SaiMatKhau123' }
  });
  ok('Nhập sai mật khẩu phòng bị từ chối HTTP 403', resWrongPass.status === 403, 'admission');

  // 6.5 Nhập đúng mật khẩu -> ĐƯỢC DUYỆT VÀO PHÒNG (HTTP 200, isAdmitted = true)
  const resRightPass = await api('/api/phong', {
    method: 'POST',
    cookie: cookieB,
    body: { hanhDong: 'vao', phongId: lockedId, password: roomPass }
  });
  ok('Nhập đúng mật khẩu phòng thành công (HTTP 200)', resRightPass.status === 200 && resRightPass.data?.isAdmitted === true, 'admission');

  // 6.6 Sau khi admit, các API con hoạt động bình thường
  const resChatAfterAdmit = await api(`/api/phong-chat?phongId=${lockedId}`, { cookie: cookieB });
  ok('Sau khi admit, GET /api/phong-chat hoạt động (HTTP 200)', resChatAfterAdmit.status === 200, 'admission');

  // 6.7 Rời phòng -> quyền truy cập bị cắt ngay lập tức
  const resLeave = await api('/api/phong', {
    method: 'POST',
    cookie: cookieB,
    body: { hanhDong: 'roi', phongId: lockedId }
  });
  ok('Rời phòng thành công', resLeave.status === 200, 'admission');

  const resChatAfterLeave = await api(`/api/phong-chat?phongId=${lockedId}`, { cookie: cookieB });
  ok('Sau khi rời phòng, GET /api/phong-chat lại bị chặn (HTTP 403)', resChatAfterLeave.status === 403, 'admission');

  // ── 7. GAME ARENA MANUAL CARO PASSWORD SUPPORT ──
  console.log('\n--- 7. Game Arena Manual Caro Password Support ---');
  // 7.1 Tạo bàn Caro toàn trường có mật khẩu
  const gamePass = 'CaroSecretPass9!';
  // Dùng student token để tạo bàn toàn trường
  const studentTokenHost = await createToken(devSessionSecret, {
    accountId: 90001,
    hocSinhId: 2,
    lopId: 1,
    role: 'student',
    ten: 'Kỳ Thủ Host 2'
  }, 3600);
  const cookieGameHost = `${COOKIE_NAME}=${studentTokenHost}`;

  const studentTokenGuest = await createToken(devSessionSecret, {
    accountId: 90002,
    hocSinhId: 3,
    lopId: 1,
    role: 'student',
    ten: 'Kỳ Thủ Khách 3'
  }, 3600);
  const cookieGameGuest = `${COOKIE_NAME}=${studentTokenGuest}`;

  const resTaoBanCaro = await api('/api/game', {
    method: 'POST',
    cookie: cookieGameHost,
    body: {
      hanhDong: 'tao_ban',
      loaiGame: 'co_caro',
      phamVi: 'truong',
      accessMode: 'password',
      password: gamePass,
      tenBan: `Bàn Caro VIP ${randTag}`
    }
  });
  ok('Tạo bàn Caro có mật khẩu thành công (HTTP 200)', resTaoBanCaro.status === 200 && resTaoBanCaro.data?.phong?.accessMode === 'password', 'game', `status=${resTaoBanCaro.status} data=${JSON.stringify(resTaoBanCaro.data)}`);
  const gameBanId = resTaoBanCaro.data?.phong?.id;
  ok('Bàn Caro có ID hợp lệ', gameBanId > 0, 'game');

  // 7.2 Lấy danh sách bàn toàn trường -> có accessMode = 'password', không lộ hash/salt
  const resListGame = await api('/api/game?phamVi=truong&loai=co_caro', { cookie: cookieGameHost });
  const banTimThay = (resListGame.data?.danhSachBan || []).find(b => b.id === gameBanId);
  ok('Lobby Game hiển thị accessMode = password', banTimThay?.accessMode === 'password', 'game');
  ok('Lobby Game KHÔNG để lộ matKhauHash hay salt', !banTimThay?.matKhauHash && !banTimThay?.mat_khau_hash && !banTimThay?.mat_khau_salt, 'game');

  // 7.3 Khách vào bàn với sai mật khẩu -> BỊ TỪ CHỐI 403
  const resGameWrongPass = await api('/api/game', {
    method: 'POST',
    cookie: cookieGameGuest,
    body: { hanhDong: 'vao_ban', phongId: gameBanId, password: 'SaiMatKhauCaro' }
  });
  ok('Khách vào bàn Caro sai mật khẩu bị từ chối 403', resGameWrongPass.status === 403, 'game');

  // 7.4 Khách vào bàn với đúng mật khẩu -> THÀNH CÔNG 200
  const resGameRightPass = await api('/api/game', {
    method: 'POST',
    cookie: cookieGameGuest,
    body: { hanhDong: 'vao_ban', phongId: gameBanId, password: gamePass }
  });
  ok('Khách vào bàn Caro đúng mật khẩu được chấp thuận (HTTP 200)', resGameRightPass.status === 200 && resGameRightPass.data?.ok === true, 'game');

  // Dọn bàn game test
  await api('/api/game', { method: 'POST', cookie: cookieGameHost, body: { hanhDong: 'roi_ban', phongId: gameBanId } });

  // ── 8. COMMUNITY CODE REDEMPTION & CANONICAL STUDENT LINKAGE ──
  console.log('\n--- 8. Community Code Redemption & Atomic Account Linkage ---');
  // 8.1 Account A (chưa link) nhập mã mời hợp lệ của Học sinh 2
  const resRedeemA = await api('/api/kiem-tra-ma-cong-dong', {
    method: 'POST',
    cookie: cookieA,
    body: { maCode: codeLink1 }
  });
  ok('Account A nhập mã mời giáo viên thành công (HTTP 200)', resRedeemA.status === 200 && resRedeemA.data?.ok === true, 'linkage', `status=${resRedeemA.status}`);
  ok('Response trả về daKetNoiTaiKhoan = true', resRedeemA.data?.daKetNoiTaiKhoan === true, 'linkage');
  ok('Response phản ánh đúng hocSinhId = 2', resRedeemA.data?.hocSinhId === 2, 'linkage');
  ok('Response phản ánh đúng lopId = 1', resRedeemA.data?.lopId === 1, 'linkage');

  // 8.2 Kiểm tra session cookie được tái cấp trực tiếp
  const cookieRefreshedA = parseCookie(resRedeemA.setCookie);
  ok('Response tái cấp Set-Cookie mới cho học sinh', Boolean(cookieRefreshedA), 'linkage');

  // 8.3 Whoami với cookie mới ngay lập tức phản ánh danh tính học sinh chính thức
  const authCookieA = cookieRefreshedA || cookieA;
  const resWhoamiLinkedA = await api('/api/whoami', { cookie: authCookieA });
  ok('Whoami phản ánh hocSinhId = 2', resWhoamiLinkedA.data?.hocSinhId === 2, 'linkage');
  ok('Whoami phản ánh lopId = 1', resWhoamiLinkedA.data?.lopId === 1, 'linkage');
  ok('Whoami isLinkedStudent = true', resWhoamiLinkedA.data?.isLinkedStudent === true, 'linkage');
  ok('Whoami coQuyenCongDong = true', resWhoamiLinkedA.data?.coQuyenCongDong === true, 'linkage');

  // 8.4 Thử redeem lại mã vừa dùng -> BỊ TỪ CHỐI (Single use)
  const resRedeemAgain = await api('/api/kiem-tra-ma-cong-dong', {
    method: 'POST',
    cookie: authCookieA,
    body: { maCode: codeLink1 }
  });
  ok('Mã đã sử dụng bị từ chối khi nhập lại', resRedeemAgain.status !== 200, 'linkage');

  // 8.5 DUPLICATE STUDENT LINK PREVENTION (Account B cố link vào cùng Học sinh 2 bằng mã khác)
  const resRedeemDupB = await api('/api/kiem-tra-ma-cong-dong', {
    method: 'POST',
    cookie: cookieB,
    body: { maCode: codeDup1 }
  });
  ok('Chặn tài khoản thứ 2 liên kết vào cùng một học sinh chính thức (HTTP 409)', resRedeemDupB.status === 409, 'linkage', `status=${resRedeemDupB.status}`);

  // ── 9. RACE CONCURRENCY: 2 ACCOUNTS REDEEM SINGLE-USE CODE ──
  console.log('\n--- 9. Race Concurrency Defense (Single-Use Code) ---');
  const userC = `stu_race_c_${randTag}`;
  const userD = `stu_race_d_${randTag}`;
  await api('/api/register', { method: 'POST', body: { username: userC, displayName: 'Học Sinh Race C', password: passValid, accountType: 'student' } });
  await api('/api/register', { method: 'POST', body: { username: userD, displayName: 'Học Sinh Race D', password: passValid, accountType: 'student' } });

  const resLC = await api('/api/login', { method: 'POST', body: { username: userC, password: passValid } });
  const resLD = await api('/api/login', { method: 'POST', body: { username: userD, password: passValid } });
  const cookieC = parseCookie(resLC.setCookie);
  const cookieD = parseCookie(resLD.setCookie);

  // Gửi đồng thời cả 2 request claim codeRace1
  const [resClaimC, resClaimD] = await Promise.all([
    api('/api/kiem-tra-ma-cong-dong', { method: 'POST', cookie: cookieC, body: { maCode: codeRace1 } }),
    api('/api/kiem-tra-ma-cong-dong', { method: 'POST', cookie: cookieD, body: { maCode: codeRace1 } }),
  ]);

  const cOk = resClaimC.status === 200;
  const dOk = resClaimD.status === 200;
  ok('Chính xác MỘT trong hai tài khoản thành công khi race single-use code', (cOk && !dOk) || (!cOk && dOk), 'race');
  ok('Tài khoản thua race bị từ chối (HTTP 400/409)', (!cOk && resClaimC.status >= 400) || (!dOk && resClaimD.status >= 400), 'race');

  // ── TỔNG KẾT BÁO CÁO ──
  console.log('\n================================================================');
  console.log(`KẾT QUẢ KIỂM THỬ PHASE 4B.1 HARDENING: ${pass} PASS / ${fail} FAIL`);
  console.log('================================================================');
  Object.entries(resultsByGroup).forEach(([grp, st]) => {
    console.log(`  - Phân hệ ${grp.toUpperCase()}: ${st.pass} pass / ${st.fail} fail`);
  });
  console.log('================================================================\n');

  if (fail > 0) {
    process.exit(1);
  }
} catch (err) {
  console.error('Lỗi nghiêm trọng trong quá trình chạy QA Phase 4B.1:', err);
  process.exit(1);
}
