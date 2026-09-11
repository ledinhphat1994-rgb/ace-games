// ==============================================================================
// cong-cu/qa-watch-together.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN PHASE 3C.1: CAMPUS CINEMA / WATCH TOGETHER CORE
// Hỗ trợ kiểm thử chi tiết từng phân lớp: API, Concurrency, Lifecycle & Real GUI E2E
// ==============================================================================
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = {
  api: { pass: 0, fail: 0 },
  concurrency: { pass: 0, fail: 0 },
  browser: { pass: 0, fail: 0 },
  detailed: {}
};

function ok(ten, dk, group = 'api', chiTiet = '') {
  if (dk) {
    pass++;
    if (resultsByGroup[group]) resultsByGroup[group].pass++;
    console.log(`  ✅ ${ten}`);
  } else {
    fail++;
    if (resultsByGroup[group]) resultsByGroup[group].fail++;
    console.log(`  ❌ ${ten} ${chiTiet}`);
  }
}

async function taoAuthCookie(user) {
  const token = await createToken(devSessionSecret, user, 3600);
  return `${COOKIE_NAME}=${token}`;
}

async function api(path, { method = 'GET', body = null, cookie = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

console.log('================================================================');
console.log('CHẠY BỘ KIỂM THỬ ĐỒNG BỘ WATCH TOGETHER CORE (PHASE 3C.1 HARDENING)');
console.log(`Target: ${BASE}`);
console.log('================================================================\n');

// Danh tính giả lập
const HS_A = { hocSinhId: 1, lopId: 1, role: 'student', ten: 'Học sinh 10A7-A (Chủ phòng)' };
const HS_B = { hocSinhId: 2, lopId: 1, role: 'student', ten: 'Học sinh 10A7-B (Người xem cùng lớp)' };
const HS_C = { hocSinhId: 39, lopId: 2, role: 'student', ten: 'Học sinh 11A1-C (Khác lớp)' };
const GV = { role: 'teacher', lopId: 1, ten: 'Giáo viên Chủ nhiệm' };

const cookieA = await taoAuthCookie(HS_A);
const cookieB = await taoAuthCookie(HS_B);
const cookieC = await taoAuthCookie(HS_C);
const cookieGV = await taoAuthCookie(GV);

// Dọn dẹp các phòng cũ còn mở của HS_A nếu có trước khi chạy kiểm thử
try {
  const dsCu = await api('/api/phong', { cookie: cookieA });
  if (dsCu.ok && Array.isArray(dsCu.data?.phongs)) {
    for (const p of dsCu.data.phongs) {
      if (p.chuPhongKhoa === `hs:${HS_A.hocSinhId}`) {
        await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: p.id } });
      }
    }
  }
} catch {
  // Bỏ qua lỗi dọn dẹp nếu có
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TẠO PHÒNG VIDEO TOÀN TRƯỜNG VÀ PHÒNG RIÊNG LỚP
// ─────────────────────────────────────────────────────────────────────────────
console.log('== 1. Khởi tạo phòng Xem chung (Trường & Lớp) ==');

const resTaoTruong = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Rạp Phim Toàn Trường QA Hardened',
    loai: 'video',
    phamVi: 'truong',
    moTa: 'Phòng kiểm thử tự động Watch Together toàn trường',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
});
ok('Tạo phòng video toàn trường hợp lệ thành công', resTaoTruong.ok && resTaoTruong.data.phong?.id > 0, 'api');
const phongTruongId = resTaoTruong.data.phong?.id;

const resTaoLop = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Xem Phim Riêng Lớp 10A7 QA Hardened',
    loai: 'video',
    phamVi: 'lop',
    moTa: 'Phòng kiểm thử riêng tư của 10A7',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  }
});
ok('Tạo phòng video riêng lớp thành công', resTaoLop.ok && resTaoLop.data.phong?.id > 0, 'api');
const phongLopId = resTaoLop.data.phong?.id;

// ─────────────────────────────────────────────────────────────────────────────
// 2. ĐỌC TRẠNG THÁI & BẢO VỆ RIÊNG TƯ (TEST A, H & PRIVACY)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 2. Đọc trạng thái phòng Watch Together (Test A, H & Privacy) ==');

// Test A: Người xem cùng lớp (HS_B) đọc được trạng thái
const resReadB = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieB });
ok('Test A: Người xem cùng lớp (HS_B) đọc được trạng thái phòng', resReadB.ok && resReadB.data.state, 'api');
ok('Trạng thái khởi tạo mặc định là paused với revision = 1', resReadB.data.state?.playing === false && resReadB.data.state?.revision === 1, 'api');
ok('Người xem thông thường có canControl = false', resReadB.data.canControl === false, 'api');
ok('Nhận diện đúng provider NATIVE_HTML5 cho link mp4', resReadB.data.provider === 'NATIVE_HTML5', 'api');

// Privacy assertion: API không để lộ internal session/actor key chuPhongKhoa cho client
ok('Privacy: API /api/phong-watch KHÔNG để lộ chuPhongKhoa trong dữ liệu phòng', typeof resReadB.data.phong?.chuPhongKhoa === 'undefined', 'api');

// Neutral audit assertion: Viewer gọi GET đầu tiên KHÔNG bị ghi nhận là người điều khiển
ok('Audit Semantics: Người xem đọc trạng thái không bị gán nhầm là updatedBy', resReadB.data.state?.updatedBy !== HS_B.ten, 'api');

// Test H: Học sinh lớp khác (HS_C 11A1) VÀO phòng toàn trường trước, sau đó đọc trạng thái
const resJoinC = await api('/api/phong', {
  method: 'POST',
  cookie: cookieC,
  body: { hanhDong: 'vao', phongId: phongTruongId }
});
ok('Test H: Học sinh lớp khác (HS_C 11A1) vào phòng toàn trường thành công', resJoinC.ok, 'api');

const resReadC = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieC });
ok('Test H: Học sinh lớp khác đọc được phòng toàn trường sau khi vào phòng', resReadC.ok && resReadC.data.state, 'api');

// Chủ phòng đọc trạng thái: canControl = true
const resReadA = await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieA });
ok('Chủ phòng (HS_A) có canControl = true từ máy chủ', resReadA.data.canControl === true, 'api');

// ─────────────────────────────────────────────────────────────────────────────
// 3. PHÂN QUYỀN ĐIỀU KHIỂN CƠ BẢN (TEST B, C, D, E, F)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 3. Phân quyền điều khiển phát video (Test B, C, D, E, F) ==');

// Test B: Người xem thông thường gửi lệnh -> Bị từ chối HTTP 403
const resCmdUnauthorized = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieB,
  body: { phongId: phongTruongId, action: 'play', position: 10, expectedRevision: 1 }
});
ok('Test B: Người xem thông thường gửi lệnh bị chặn với HTTP 403', resCmdUnauthorized.status === 403, 'api');

// Test C: Chủ phòng gửi lệnh PLAY -> Thành công, revision tăng
const resPlay = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'play', position: 0, expectedRevision: 1 }
});
ok('Test C: Chủ phòng gửi lệnh PLAY thành công', resPlay.ok && resPlay.data.state?.playing === true, 'api');
ok('Revision tăng lên 2 sau lệnh PLAY', resPlay.data.state?.revision === 2, 'api');

// Test E: Chủ phòng gửi lệnh SEEK đến 60.5 giây
const resSeek = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 60.5, expectedRevision: 2 }
});
ok('Test E: Chủ phòng gửi lệnh SEEK thành công', resSeek.ok && resSeek.data.state?.positionSeconds === 60.5, 'api');
ok('Revision tăng lên 3 sau lệnh SEEK', resSeek.data.state?.revision === 3, 'api');

// Test D: Chủ phòng gửi lệnh PAUSE tại 60.5 giây
const resPause = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'pause', position: 60.5, expectedRevision: 3 }
});
ok('Test D: Chủ phòng gửi lệnh PAUSE thành công', resPause.ok && resPause.data.state?.playing === false, 'api');
ok('Revision tăng lên 4 sau lệnh PAUSE', resPause.data.state?.revision === 4, 'api');

// Test F: Giáo viên gửi lệnh điều khiển phòng
const resTeacherCmd = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieGV,
  body: { phongId: phongTruongId, action: 'play', position: 60.5, expectedRevision: 4 }
});
ok('Test F: Giáo viên có quyền điều khiển/giám sát phòng', resTeacherCmd.ok && resTeacherCmd.data.state?.playing === true, 'api');
ok('Revision tăng lên 5 sau lệnh của giáo viên', resTeacherCmd.data.state?.revision === 5, 'api');

// ─────────────────────────────────────────────────────────────────────────────
// 4. KIỂM THỬ NGHIÊM NGẶT PLAYBACK RATE & DÒNG THỜI GIAN
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 4. Kiểm thử Playback Rate Semantics & Timeline Continuity ==');

// A. Invalid Rate must fail HTTP 400
for (const invalidRate of [0, 0.1, 3.0, NaN, 'fast']) {
  const resBadRate = await api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: phongTruongId, action: 'set_rate', playbackRate: invalidRate, expectedRevision: 5 }
  });
  ok(`Invalid Rate (${invalidRate}) bị từ chối với HTTP 400`, resBadRate.status === 400, 'api');
}

// B. Valid set_rate: 1.5x
const resSetRate = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'set_rate', playbackRate: 1.5, expectedRevision: 5 }
});
ok('set_rate: Đặt tốc độ 1.5x thành công HTTP 200', resSetRate.ok && resSetRate.data.state?.playbackRate === 1.5, 'api');
ok('Revision tăng lên 6 sau set_rate', resSetRate.data.state?.revision === 6, 'api');

// C. Playback rate preservation on seek/pause/play (KHÔNG bị reset về 1.0)
const resSeekPreserveRate = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 20, expectedRevision: 6 }
});
ok('Rate Preservation: Lệnh seek không gửi kèm rate vẫn giữ nguyên tốc độ 1.5x', resSeekPreserveRate.data.state?.playbackRate === 1.5, 'api');
ok('Revision tăng lên 7 sau lệnh seek', resSeekPreserveRate.data.state?.revision === 7, 'api');

// D. Timeline continuity on set_rate while playing
const resPlayAt15 = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'play', position: 20, expectedRevision: 7 }
});
ok('Phát video tại mốc 20s với tốc độ 1.5x', resPlayAt15.ok && resPlayAt15.data.state?.revision === 8, 'api');

// Đợi 1 giây để thời gian trôi ~1.5 giây
await new Promise(r => setTimeout(r, 1000));

// Đổi tốc độ về 1.0x khi đang phát
const resChangeRatePlaying = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'set_rate', playbackRate: 1.0, expectedRevision: 8 }
});
ok('set_rate về 1.0x thành công khi đang phát', resChangeRatePlaying.ok && resChangeRatePlaying.data.state?.playbackRate === 1.0, 'api');
const posSauDoiRate = resChangeRatePlaying.data.state?.positionSeconds;
ok('Timeline Continuity: Vị trí sau khi đổi rate liên tục tịnh tiến (>= 21s), không nhảy lùi', posSauDoiRate >= 21.0, 'api');

// ─────────────────────────────────────────────────────────────────────────────
// 5. CÔ LẬP PHẠM VI LỚP HỌC (TEST G)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 5. Kiểm thử cô lập phạm vi lớp học (Test G) ==');

const resPrivateRead = await api(`/api/phong-watch?phongId=${phongLopId}`, { cookie: cookieC });
ok('Test G: Học sinh lớp khác (HS_C) không được đọc phòng riêng của lớp 10A7 (HTTP 403)', resPrivateRead.status === 403, 'api');

const resPrivateWrite = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieC,
  body: { phongId: phongLopId, action: 'play', position: 0, expectedRevision: 1 }
});
ok('Test G: Học sinh lớp khác không được gửi lệnh điều khiển phòng riêng (HTTP 403)', resPrivateWrite.status === 403, 'api');

// ─────────────────────────────────────────────────────────────────────────────
// 6. KHÓA LẠC QUAN & XUNG ĐỘNG ĐỒNG THỜI (TEST I, J & MULTI-STEP)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 6. Optimistic Concurrency & Revision Conflict (Test I, J) ==');

const curState = (await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieA })).data.state;
const curRev = curState.revision;

console.log(`  Bắn 2 lệnh đồng thời với cùng expectedRevision = ${curRev}...`);
const [cmd1, cmd2] = await Promise.all([
  api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: phongTruongId, action: 'pause', position: 70, expectedRevision: curRev }
  }),
  api('/api/phong-watch', {
    method: 'POST',
    cookie: cookieA,
    body: { phongId: phongTruongId, action: 'seek', position: 100, expectedRevision: curRev }
  })
]);

const motThanhCong = (cmd1.status === 200 && cmd2.status === 409) || (cmd1.status === 409 && cmd2.status === 200);
ok('Test I: Hai lệnh dùng cùng expectedRevision thì CHÍNH XÁC 1 lệnh thành công, 1 lệnh nhận 409', motThanhCong, 'concurrency');

const conflictRes = cmd1.status === 409 ? cmd1 : cmd2;
ok('Test J: Phản hồi 409 trả về conflict: true', conflictRes.data.conflict === true, 'concurrency');
ok('Phản hồi 409 chứa state mới nhất để client hòa giải', conflictRes.data.state && conflictRes.data.state.revision > curRev, 'concurrency');

// Stale revision
const resStale = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'play', position: 0, expectedRevision: 1 }
});
ok('Stale revision (expectedRevision = 1) bị từ chối HTTP 409', resStale.status === 409 && resStale.data.conflict === true, 'concurrency');

// Realistic sequence: Play rev N -> Seek rev N+1 -> Lệnh cũ dùng rev N+1 bị 409
const stateMoiNhat = (await api(`/api/phong-watch?phongId=${phongTruongId}`, { cookie: cookieA })).data.state;
const revN = stateMoiNhat.revision;

const resSeqPlay = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'play', position: 10, expectedRevision: revN }
});
ok('Tuần tự: Lệnh Play với revision N thành công', resSeqPlay.ok, 'concurrency');

const resSeqSeek = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 30, expectedRevision: revN + 1 }
});
ok('Tuần tự: Lệnh Seek với revision N+1 thành công', resSeqSeek.ok, 'concurrency');

const resSeqStale = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'pause', position: 30, expectedRevision: revN + 1 }
});
ok('Tuần tự: Lệnh Pause dùng revision N+1 đã cũ nhận HTTP 409', resSeqStale.status === 409, 'concurrency');

// ─────────────────────────────────────────────────────────────────────────────
// 7. VALIDATION DỮ LIỆU ĐẦU VÀO (TEST L, M)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 7. Input Validation (Test L, M) ==');

const resBadUrl = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Phòng Link Độc',
    loai: 'video',
    videoUrl: 'javascript:alert(1)'
  }
});
ok('Test L: Link video độc hại javascript: bị từ chối tại API tạo phòng', !resBadUrl.ok, 'api');

const resNegPos = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: -15, expectedRevision: 100 }
});
ok('Test M: Vị trí âm (position = -15) bị từ chối HTTP 400', resNegPos.status === 400, 'api');

const resNanPos = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 'khong-phai-so', expectedRevision: 100 }
});
ok('Test M: Vị trí NaN bị từ chối HTTP 400', resNanPos.status === 400, 'api');

const resHugePos = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'seek', position: 1000000, expectedRevision: 100 }
});
ok('Test M: Vị trí vượt quá giới hạn 24h (> 86400s) bị từ chối HTTP 400', resHugePos.status === 400, 'api');

const resBadAction = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: phongTruongId, action: 'destroy_server', position: 10, expectedRevision: 100 }
});
ok('Hành động lạ không nằm trong whitelist bị từ chối HTTP 400', resBadAction.status === 400, 'api');

// ─────────────────────────────────────────────────────────────────────────────
// 8. VÒNG ĐỜI KHI ĐÓNG PHÒNG & XÓA BẢN GHI DỮ LIỆU ĐỒNG BỘ THẬT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 8. Vòng đời khi đóng phòng & Dọn dẹp DB thực tế (Test K & Lifecycle) ==');

// Tạo 1 phòng video riêng cho test vòng đời
const resPhongLifecycle = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: {
    hanhDong: 'tao',
    ten: 'Phòng Kiểm Thử Vòng Đời Dọn Dẹp',
    loai: 'video',
    phamVi: 'truong',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
});
const lcId = resPhongLifecycle.data.phong?.id;
ok('Tạo phòng video kiểm thử vòng đời thành công', lcId > 0, 'api');

// Đọc trạng thái phòng vừa tạo
const resLcReadBefore = await api(`/api/phong-watch?phongId=${lcId}`, { cookie: cookieA });
ok('Phòng đang mở: API /api/phong-watch trả về 200 OK', resLcReadBefore.ok, 'api');

// Đóng phòng
const resDongLc = await api('/api/phong', {
  method: 'POST',
  cookie: cookieA,
  body: { hanhDong: 'dong', phongId: lcId }
});
ok('Chủ phòng đóng phòng thành công', resDongLc.ok, 'api');

// 1. API Read trả 404
const resLcReadAfter = await api(`/api/phong-watch?phongId=${lcId}`, { cookie: cookieA });
ok('Sau khi đóng: API Read /api/phong-watch trả về HTTP 404', resLcReadAfter.status === 404, 'api');

// 2. API Write trả 404
const resLcWriteAfter = await api('/api/phong-watch', {
  method: 'POST',
  cookie: cookieA,
  body: { phongId: lcId, action: 'play', position: 0, expectedRevision: 1 }
});
ok('Sau khi đóng: API Write /api/phong-watch trả về HTTP 404', resLcWriteAfter.status === 404, 'api');

// 3. Kiểm tra DB thực tế: bản ghi phong_dong_bo_video thực sự bị xóa khỏi bảng (không chỉ bị ẩn)
if (BASE.includes('127.0.0.1') || BASE.includes('localhost')) {
  try {
    const rawSqlOut = execSync(`npx wrangler d1 execute lop-10a7-db --local --command="SELECT count(1) as total FROM phong_dong_bo_video WHERE phong_id = ${lcId};"`, { encoding: 'utf8' });
    const match = rawSqlOut.match(/"total":\s*(\d+)/);
    const dbCount = match ? parseInt(match[1], 10) : -1;
    ok('Lifecycle DB Cleanup: Bản ghi trong phong_dong_bo_video đã bị xóa hoàn toàn khỏi DB (count = 0)', dbCount === 0, 'api');
  } catch (err) {
    ok('Lifecycle DB Cleanup: Lỗi khi truy vấn trực tiếp DB local', false, 'api', err.message);
  }
} else {
  console.log('  ℹ️ [REMOTE DB] Bỏ qua truy vấn CLI cục bộ, đã xác thực qua HTTP 404.');
}

// Dọn dẹp phòng test ban đầu
await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: phongTruongId } });
await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: phongLopId } });

// ─────────────────────────────────────────────────────────────────────────────
// 9. REAL TWO-BROWSER PLAYWRIGHT SYNC & DOM VIDEO ASSERTIONS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n== 9. Real Two-Browser Playwright Synchronization (Native HTML5 MP4) ==');

let browser = null;
try {
  const { chromium } = await import('playwright');
  browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  // Tạo phòng video mới cho test 2 trình duyệt
  const resPhongBrowser = await api('/api/phong', {
    method: 'POST',
    cookie: cookieA,
    body: {
      hanhDong: 'tao',
      ten: 'Rạp Phim E2E Sync Hardened',
      loai: 'video',
      phamVi: 'truong',
      moTa: 'Phòng kiểm thử Playwright 2 browser video currentTime thật',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.webm'
    }
  });
  const livePhongId = resPhongBrowser.data.phong?.id;
  ok('Tạo phòng video cho test hai trình duyệt thành công', livePhongId > 0, 'browser');

  const urlObj = new URL(BASE);

  // Browser A: Chủ phòng (Host)
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tokenA = await createToken(devSessionSecret, HS_A, 3600);
  await ctxA.addCookies([{ name: COOKIE_NAME, value: tokenA, domain: urlObj.hostname, path: '/' }]);
  const pageA = await ctxA.newPage();
  await pageA.goto(`${BASE}/`);
  await pageA.waitForSelector('#campus-lobby', { timeout: 10000 });

  // Browser B: Người xem (Viewer)
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tokenB = await createToken(devSessionSecret, HS_B, 3600);
  await ctxB.addCookies([{ name: COOKIE_NAME, value: tokenB, domain: urlObj.hostname, path: '/' }]);
  const pageB = await ctxB.newPage();
  await pageB.goto(`${BASE}/`);
  await pageB.waitForSelector('#campus-lobby', { timeout: 10000 });

  // Chủ phòng A vào phòng qua Left Navigator Cinema
  const navCinemaA = pageA.locator('#cat-nav-CINEMA');
  await navCinemaA.click();
  await pageA.waitForSelector('#room-nav-list-CINEMA', { timeout: 5000 });
  const rowA = pageA.locator('#room-nav-list-CINEMA div:has-text("Rạp Phim E2E Sync Hardened")').first();
  await rowA.locator('button:has-text("Vào")').first().click();

  // Đợi màn hình ROOM_ACTIVE xuất hiện trên A
  await pageA.waitForSelector('#btn-roi-phong-top', { timeout: 8000 });
  await pageA.waitForTimeout(1000);

  // Xác thực Host UI (Bắt buộc tồn tại, KHÔNG CÓ FALLBACK API)
  const hostBadgeA = pageA.locator('#host-badge');
  ok('Browser A: Chủ phòng thấy huy hiệu "Chủ phòng"', (await hostBadgeA.count()) > 0, 'browser');

  const btnToggleHostA = pageA.locator('#btn-host-watch-toggle');
  ok('Browser A: Nút điều khiển phát chung của Host (#btn-host-watch-toggle) TỒN TẠI trên UI', (await btnToggleHostA.count()) > 0, 'browser');

  const sliderHostA = pageA.locator('#host-seek-slider');
  ok('Browser A: Thanh trượt seek (#host-seek-slider) TỒN TẠI trên UI', (await sliderHostA.count()) > 0, 'browser');

  // Người xem B vào phòng qua Left Navigator Cinema
  const navCinemaB = pageB.locator('#cat-nav-CINEMA');
  await navCinemaB.click();
  await pageB.waitForSelector('#room-nav-list-CINEMA', { timeout: 5000 });
  const rowB = pageB.locator('#room-nav-list-CINEMA div:has-text("Rạp Phim E2E Sync Hardened")').first();
  await rowB.locator('button:has-text("Vào")').first().click();

  // Đợi màn hình ROOM_ACTIVE xuất hiện trên B
  await pageB.waitForSelector('#btn-roi-phong-top', { timeout: 8000 });
  await pageB.waitForTimeout(1000);

  // Xác thực Viewer UI: Nút điều khiển của Host bị ẩn hoàn toàn
  const btnToggleViewerB = pageB.locator('#btn-host-watch-toggle');
  ok('Browser B: Người xem KHÔNG thấy nút điều khiển Host (#btn-host-watch-toggle = 0)', (await btnToggleViewerB.count()) === 0, 'browser');

  // Nút tương tác cấp quyền âm thanh / Autoplay xuất hiện
  const btnStartViewingB = pageB.locator('#btn-viewer-start-watch');
  const coNutStart = (await btnStartViewingB.count()) > 0;
  ok('Browser B: Người xem thấy nút cấp quyền âm thanh (#btn-viewer-start-watch)', coNutStart, 'browser');

  if (coNutStart) {
    await btnStartViewingB.click();
    await pageB.waitForTimeout(500);
  }

  // ──────────────────────────────────────────────────
  // 1. KIỂM THỬ PLAY THẬT TRÊN DOM VIDEO
  // ──────────────────────────────────────────────────
  console.log('  -> Host A bấm nút Phát Chung trên UI...');
  await btnToggleHostA.click(); // THỰC SỰ CLICK NÚT GIAO DIỆN, KHÔNG DÙNG API FALLBACK

  // Chờ Browser B sync và bắt đầu phát video (chu kỳ poll 2.5s)
  await pageB.waitForFunction(() => {
    const v = document.querySelector('video');
    return v && !v.paused;
  }, { timeout: 8000 }).catch(() => {});

  const isPausedB = await pageB.evaluate(() => {
    const v = document.querySelector('video');
    return v ? v.paused : null;
  });
  ok('Actual player PLAY: Browser B video.paused === false sau khi Host bấm Phát Chung', isPausedB === false, 'browser');
  resultsByGroup.detailed['Actual player PLAY'] = (isPausedB === false) ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 2. KIỂM THỬ SEEK CONVERGENCE THẬT TRÊN DOM VIDEO
  // ──────────────────────────────────────────────────
  console.log('  -> Host A seek đến vị trí 25.0s trên giao diện...');
  await pageA.evaluate(() => {
    const slider = document.querySelector('#host-seek-slider');
    if (slider) {
      slider.value = '25';
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      slider.dispatchEvent(new Event('mouseup', { bubbles: true }));
    }
  });

  // Chờ Browser B nhận mốc seek và hội tụ
  await pageB.waitForTimeout(3500);

  const curTimeB = await pageB.evaluate(() => {
    const v = document.querySelector('video');
    return v ? v.currentTime : -1;
  });
  // Với playback 1.0x sau 3.5s từ mốc 25s, vị trí dự kiến là ~28.5s. Dung sai <= 2.5s
  const seekConverged = Math.abs(curTimeB - 28.5) <= 2.5;
  ok(`Actual player SEEK convergence: Browser B video.currentTime hội tụ (hiện tại: ${curTimeB.toFixed(1)}s, dự kiến ~28.5s)`, seekConverged, 'browser');
  resultsByGroup.detailed['Actual player SEEK convergence'] = seekConverged ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 3. KIỂM THỬ PAUSE THẬT TRÊN DOM VIDEO
  // ──────────────────────────────────────────────────
  console.log('  -> Host A bấm nút Tạm Dừng trên UI...');
  await btnToggleHostA.click(); // Click Tạm Dừng

  await pageB.waitForTimeout(3500);

  const isPausedB_after = await pageB.evaluate(() => {
    const v = document.querySelector('video');
    return v ? v.paused : null;
  });
  ok('Actual player PAUSE: Browser B video.paused === true sau khi Host bấm Tạm Dừng', isPausedB_after === true, 'browser');

  const pausePos1 = await pageB.evaluate(() => document.querySelector('video')?.currentTime || 0);
  await pageB.waitForTimeout(1500);
  const pausePos2 = await pageB.evaluate(() => document.querySelector('video')?.currentTime || 0);
  const timelineStopped = Math.abs(pausePos2 - pausePos1) < 0.2;
  ok('Actual player PAUSE: timeline dừng hẳn, không tiếp tục chạy thêm', timelineStopped, 'browser');
  resultsByGroup.detailed['Actual player PAUSE'] = (isPausedB_after === true && timelineStopped) ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 4. KIỂM THỬ BÙ TRÔI (DRIFT CORRECTION)
  // ──────────────────────────────────────────────────
  console.log('  -> Cố tình làm lệch currentTime của Browser B +8 giây...');
  await pageB.evaluate(() => {
    const v = document.querySelector('video');
    if (v) v.currentTime += 8.0;
  });
  const perturbedTime = await pageB.evaluate(() => document.querySelector('video')?.currentTime || 0);

  // Host phát tiếp tại mốc 35.0s
  await pageA.evaluate(() => {
    const slider = document.querySelector('#host-seek-slider');
    if (slider) {
      slider.value = '35';
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      slider.dispatchEvent(new Event('mouseup', { bubbles: true }));
    }
  });
  await pageA.waitForTimeout(500);
  await btnToggleHostA.click(); // Phát lại

  // Đợi 2 chu kỳ poll (4.5s) để cơ chế bù trôi phát hiện drift > 1.5s và kéo về mốc đúng
  await pageB.waitForTimeout(4500);

  const correctedTimeB = await pageB.evaluate(() => document.querySelector('video')?.currentTime || 0);
  // Dự kiến: mốc 35s + 4.5s phát = ~39.5s. Nếu KHÔNG bù trôi sẽ là 35 + 8 + 4.5 = 47.5s.
  const driftCorrected = Math.abs(correctedTimeB - 39.5) <= 2.5;
  ok(`Drift correction: Video Browser B tự động kéo về mốc phòng (${correctedTimeB.toFixed(1)}s, dự kiến ~39.5s, không bị trôi 47s)`, driftCorrected, 'browser');
  resultsByGroup.detailed['Drift correction'] = driftCorrected ? 'PASS' : 'FAIL';

  // ──────────────────────────────────────────────────
  // 5. KIỂM THỬ DỌN DẸP POLLING KHI RỜI PHÒNG
  // ──────────────────────────────────────────────────
  console.log('  -> Kiểm thử ngắt polling khi rời phòng...');
  let watchReqAfterLeave = 0;
  pageB.on('request', req => {
    if (req.url().includes('/api/phong-watch')) {
      watchReqAfterLeave++;
    }
  });

  const btnRoiB = pageB.locator('#btn-roi-phong-top');
  await btnRoiB.click();
  await pageB.waitForSelector('#campus-lobby', { timeout: 5000 });

  // Đợi 5.5 giây (> 2 khoảng polling 2.5s)
  await pageB.waitForTimeout(5500);
  const pollingStopped = (watchReqAfterLeave === 0);
  ok(`Polling cleanup: Rời phòng ngắt hoàn toàn polling (${watchReqAfterLeave} request phát sinh trong 5.5s)`, pollingStopped, 'browser');
  resultsByGroup.detailed['Polling cleanup'] = pollingStopped ? 'PASS' : 'FAIL';

  // Mobile viewport 390px responsive check
  const pageMobile = await ctxA.newPage();
  await pageMobile.setViewportSize({ width: 390, height: 844 });
  await pageMobile.goto(`${BASE}/`);
  await pageMobile.waitForTimeout(1000);
  const overflow = await pageMobile.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  ok('Giao diện Mobile (390px): Không tràn chiều ngang màn hình (overflow-x = 0)', !overflow, 'browser');

  // Dọn dẹp phòng test
  await api('/api/phong', { method: 'POST', cookie: cookieA, body: { hanhDong: 'dong', phongId: livePhongId } });
} catch (err) {
  // KHÔNG SWALLOW LỖI: Bất kỳ exception nào từ Playwright đều tính là FAIL
  fail++;
  resultsByGroup.browser.fail++;
  console.error('\n  ❌ LỖI NGHIÊM TRỌNG PLAYWRIGHT E2E:', err.message);
} finally {
  if (browser) await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// BÁO CÁO KẾT QUẢ THEO ĐÚNG TIÊU CHUẨN SECTION 22
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log('BÁO CÁO KẾT QUẢ KIỂM THỬ ĐỒNG BỘ WATCH TOGETHER (PHASE 3C.1)');
console.log('================================================================');
console.log(`API tests:                     ${resultsByGroup.api.pass} PASS / ${resultsByGroup.api.fail} FAIL`);
console.log(`Concurrency tests:             ${resultsByGroup.concurrency.pass} PASS / ${resultsByGroup.concurrency.fail} FAIL`);
console.log(`Native HTML5 two-browser:      ${resultsByGroup.browser.pass} PASS / ${resultsByGroup.browser.fail} FAIL`);
console.log(`Actual player PLAY:            ${resultsByGroup.detailed['Actual player PLAY'] || 'FAIL'}`);
console.log(`Actual player SEEK convergence:${resultsByGroup.detailed['Actual player SEEK convergence'] || 'FAIL'}`);
console.log(`Actual player PAUSE:           ${resultsByGroup.detailed['Actual player PAUSE'] || 'FAIL'}`);
console.log(`Drift correction:              ${resultsByGroup.detailed['Drift correction'] || 'FAIL'}`);
console.log(`Polling cleanup:               ${resultsByGroup.detailed['Polling cleanup'] || 'FAIL'}`);
console.log(`YouTube:                       NOT AUTOMATED (Adapter sẵn sàng, hai trình duyệt chưa tự động hóa)`);
console.log(`Google Drive:                  UNSYNCHRONIZED BY DESIGN (Chế độ xem độc lập chuẩn)`);
console.log('----------------------------------------------------------------');
console.log(`TỔNG CỘNG:                     ${pass} PASS / ${fail} FAIL`);
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
