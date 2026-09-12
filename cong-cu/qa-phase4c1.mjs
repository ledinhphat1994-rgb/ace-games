// ==============================================================================
// cong-cu/qa-phase4c1.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN PHASE 4C.1:
// SOCIAL CORRECTNESS, SAFETY & POLLING HARDENING
// ==============================================================================
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = {
  db_schema: { pass: 0, fail: 0 },
  race_friend: { pass: 0, fail: 0 },
  block_safety: { pass: 0, fail: 0 },
  auth_readonly: { pass: 0, fail: 0 },
  account_active: { pass: 0, fail: 0 },
  search_privacy: { pass: 0, fail: 0 },
  rate_limits: { pass: 0, fail: 0 },
  report_moderation: { pass: 0, fail: 0 },
  highlights_guest: { pass: 0, fail: 0 },
  encoding: { pass: 0, fail: 0 },
  polling_audit: { pass: 0, fail: 0 },
};

function ok(ten, dk, group = 'db_schema', chiTiet = '') {
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

async function api(pathUrl, { method = 'GET', body = null, cookie = null, headers = {} } = {}) {
  const reqHeaders = { 'Content-Type': 'application/json', ...headers };
  if (cookie) reqHeaders['Cookie'] = cookie;
  const res = await fetch(`${BASE}${pathUrl}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, ok: res.ok, data, headers: res.headers, setCookie };
}

async function taoSessionCookie(payload) {
  const token = await createToken(devSessionSecret, payload, 3600);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}`;
}

function queryDb(sql) {
  const safeSql = sql.replace(/\r?\n/g, ' ').replace(/"/g, '""');
  const out = execSync(`npx wrangler d1 execute lop-10a7-db --local --command="${safeSql}" --json`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const parsed = JSON.parse(out);
  return parsed?.[0]?.results || [];
}

console.log('================================================================');
console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHASE 4C.1');
console.log('Target Server:', BASE);
console.log('================================================================\n');

// 1. Nạp fixture test accounts
const uidA = 91001; // Học sinh A
const uidB = 91002; // Học sinh B
const uidC = 91003; // Học sinh C
const uidGV = 91004; // Giáo viên

try {
  const seedFilePath = path.resolve(process.cwd(), 'cong-cu/seed-qa-phase4c1.sql');
  execSync(`npx wrangler d1 execute lop-10a7-db --local --file="${seedFilePath}" -y`, { stdio: 'ignore' });
} catch (e) {
  console.warn('Cảnh báo nạp fixture D1 cục bộ:', e.message);
}

const cookieA = await taoSessionCookie({
  role: 'student',
  accountId: uidA,
  tenDangNhap: 'qa4c1_hsa',
  tenHienThi: 'Nguyễn Văn A',
  hocSinhId: 35,
  lopId: 1,
  lopIds: [1],
});

const cookieB = await taoSessionCookie({
  role: 'student',
  accountId: uidB,
  tenDangNhap: 'qa4c1_hsb',
  tenHienThi: 'Trần Thị B',
  hocSinhId: 36,
  lopId: 1,
  lopIds: [1],
});

const cookieC = await taoSessionCookie({
  role: 'student',
  accountId: uidC,
  tenDangNhap: 'qa4c1_hsc',
  tenHienThi: 'Lê Văn C',
  hocSinhId: 37,
  lopId: 1,
  lopIds: [1],
});

const cookieGV = await taoSessionCookie({
  role: 'teacher',
  accountId: uidGV,
  tenDangNhap: 'qa4c1_gva',
  tenHienThi: 'Thầy Giáo Viên',
  lopId: 1,
  lopIds: [1],
});

// ─── 1. AUDIT DATABASE SCHEMA & INVARIANTS ───────────────────────────────────
console.log('--- 1. AUDIT DATABASE SCHEMA & INVARIANTS ---');
const schemaRows = queryDb("SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('campus_friendship', 'campus_block', 'campus_report');");
const friendshipTable = schemaRows.find(r => r.name === 'campus_friendship');
const blockTable = schemaRows.find(r => r.name === 'campus_block');
const reportTable = schemaRows.find(r => r.name === 'campus_report');

ok('Bảng campus_block tồn tại độc lập', !!blockTable, 'db_schema');
ok('Bảng campus_friendship có cột pair_low & pair_high',
  friendshipTable?.sql?.includes('pair_low') && friendshipTable?.sql?.includes('pair_high'), 'db_schema');
const uqIndexRows = queryDb("SELECT name, sql FROM sqlite_master WHERE type='index' AND name='uq_cf_unordered_pair';");
ok('Bảng campus_friendship có ràng buộc UNIQUE(pair_low, pair_high)',
  Boolean(friendshipTable?.sql?.includes('pair_low, pair_high') || uqIndexRows[0]?.sql?.includes('pair_low, pair_high')), 'db_schema');
ok('Bảng campus_report có cột action_note & resolved_at',
  reportTable?.sql?.includes('action_note') && reportTable?.sql?.includes('resolved_at'), 'db_schema');

// ─── 2. REVERSE FRIEND REQUEST RACE CONDITION TEST ──────────────────────────
console.log('\n--- 2. ADVERSARIAL TEST: CONCURRENT REVERSE FRIEND REQUEST RACE ---');
// Đảm bảo không có quan hệ trước đó
queryDb(`DELETE FROM campus_friendship WHERE (requester_account_id=${uidA} AND addressee_account_id=${uidB}) OR (requester_account_id=${uidB} AND addressee_account_id=${uidA});`);

// Thực hiện đồng thời A gửi lời mời B VÀ B gửi lời mời A cùng lúc
const [resReqAB, resReqBA] = await Promise.all([
  api('/api/campus-friends', { method: 'POST', cookie: cookieA, body: { action: 'request', targetAccountId: uidB } }),
  api('/api/campus-friends', { method: 'POST', cookie: cookieB, body: { action: 'request', targetAccountId: uidA } })
]);

ok('Cả hai request A->B và B->A đồng thời không crash server (status != 500)',
  resReqAB.status !== 500 && resReqBA.status !== 500, 'race_friend', `AB:${resReqAB.status}, BA:${resReqBA.status}`);

// Kiểm tra trong DB: Đúng DUY NHẤT 1 hàng quan hệ được tạo cho cặp (uidA, uidB)
const friendRows = queryDb(`SELECT id, requester_account_id, addressee_account_id, pair_low, pair_high, status FROM campus_friendship WHERE pair_low=${Math.min(uidA, uidB)} AND pair_high=${Math.max(uidA, uidB)};`);

ok('Đúng DUY NHẤT 1 hàng logic tình bạn tồn tại trong DB sau race (cardinality = 1)',
  friendRows.length === 1, 'race_friend', `Số hàng thực tế: ${friendRows.length}`);

ok('Cột pair_low đúng là MIN(A, B) và pair_high đúng là MAX(A, B)',
  friendRows[0]?.pair_low === Math.min(uidA, uidB) && friendRows[0]?.pair_high === Math.max(uidA, uidB), 'race_friend');

// Thử chuyển sang trạng thái accepted nếu đang pending
const activeFriendship = friendRows[0];
if (activeFriendship.status === 'pending') {
  const receiverCookie = activeFriendship.addressee_account_id === uidA ? cookieA : cookieB;
  const fromId = activeFriendship.requester_account_id;
  const resAccept = await api('/api/campus-friends', {
    method: 'POST',
    cookie: receiverCookie,
    body: { action: 'accept', requestId: activeFriendship.id, fromAccountId: fromId }
  });
  ok('Chấp nhận lời mời kết bạn thành công', resAccept.ok, 'race_friend');
}

const acceptedRows = queryDb(`SELECT id, status FROM campus_friendship WHERE pair_low=${Math.min(uidA, uidB)} AND pair_high=${Math.max(uidA, uidB)};`);
ok('Trạng thái tình bạn chuyển sang accepted', acceptedRows[0]?.status === 'accepted', 'race_friend');

// ─── 3. SEPARATE BLOCK TABLE & HARDENED BLOCK SAFETY ─────────────────────────
console.log('\n--- 3. ADVERSARIAL TEST: BLOCK CANNOT BE BYPASSED ---');
// User A blocks User B
const resBlock = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieA,
  body: { action: 'block', targetAccountId: uidB }
});
ok('User A chặn User B thành công (200 OK)', resBlock.ok, 'block_safety');

// Kiểm tra bảng campus_block
const blockRows = queryDb(`SELECT * FROM campus_block WHERE blocker_account_id=${uidA} AND blocked_account_id=${uidB};`);
ok('Bảng campus_block ghi nhận đúng quan hệ đơn hướng A -> B', blockRows.length === 1, 'block_safety');

// Khi A chặn B, hàng tình bạn cũ trong campus_friendship bị xóa bỏ
const friendshipAfterBlock = queryDb(`SELECT * FROM campus_friendship WHERE pair_low=${Math.min(uidA, uidB)} AND pair_high=${Math.max(uidA, uidB)};`);
ok('Hàng tình bạn cũ bị hủy bỏ hoàn toàn sau khi chặn (không còn quan hệ accepted ẩn)',
  friendshipAfterBlock.length === 0, 'block_safety');

// Test: A -> B gửi tin nhắn DM bị từ chối (403)
const resDmAb = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieA,
  body: { receiverAccountId: uidB, noiDung: 'Tin nhắn thử từ A' }
});
ok('A gửi DM cho B bị từ chối sau khi chặn (403)', resDmAb.status === 403, 'block_safety', `Status: ${resDmAb.status}`);

// Test: B -> A gửi tin nhắn DM bị từ chối (403)
const resDmBa = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieB,
  body: { receiverAccountId: uidA, noiDung: 'Tin nhắn thử từ B' }
});
ok('B gửi DM cho A bị từ chối sau khi bị chặn (403)', resDmBa.status === 403, 'block_safety', `Status: ${resDmBa.status}`);

// Test: A -> B gửi kết bạn bị từ chối
const resReqAbAfterBlock = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieA,
  body: { action: 'request', targetAccountId: uidB }
});
ok('A gửi lời mời kết bạn cho B bị từ chối khi đang chặn', !resReqAbAfterBlock.ok, 'block_safety');

// Test: B -> A gửi kết bạn bị từ chối
const resReqBaAfterBlock = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieB,
  body: { action: 'request', targetAccountId: uidA }
});
ok('B gửi lời mời kết bạn cho A bị từ chối khi bị chặn', !resReqBaAfterBlock.ok, 'block_safety');

// Gỡ chặn để chạy tiếp các test sau
queryDb(`DELETE FROM campus_block WHERE (blocker_account_id=${uidA} AND blocked_account_id=${uidB}) OR (blocker_account_id=${uidB} AND blocked_account_id=${uidA});`);

// ─── 4. SOCIAL AUTH READ-ONLY (NO SILENT WRITE SIDE-EFFECTS) ─────────────────
console.log('\n--- 4. SOCIAL AUTH READ-ONLY & IDENTITY RECONCILIATION ---');
// Tạo session học sinh legacy không có accountId và hocSinhId không tồn tại trong tai_khoan_campus
const cookieLegacyStudent = await taoSessionCookie({
  role: 'student',
  hocSinhId: 99999, // Không có tài khoản campus
  lopId: 1,
});

const countAccountsBefore = queryDb('SELECT COUNT(*) as c FROM tai_khoan_campus;')[0].c;

const resSocialCheck = await api('/api/campus-chat', { cookie: cookieLegacyStudent });
ok('Social API từ chối session học sinh chưa có tài khoản Campus (account_required / 401 / 403)',
  resSocialCheck.status === 401 || resSocialCheck.status === 403 || resSocialCheck.data?.account_required === true, 'auth_readonly');

const countAccountsAfter = queryDb('SELECT COUNT(*) as c FROM tai_khoan_campus;')[0].c;
ok('Social auth check là pure read-only, TUYỆT ĐỐI KHÔNG tự ý INSERT vào tai_khoan_campus',
  countAccountsBefore === countAccountsAfter, 'auth_readonly', `Trước: ${countAccountsBefore}, Sau: ${countAccountsAfter}`);

// Legacy Teacher session không có explicit accountId: CẤM tự map sang tài khoản GV bất kỳ của lớp
const cookieLegacyTeacher = await taoSessionCookie({
  role: 'teacher',
  lopId: 1, // Không có accountId
});

const resTeacherCheck = await api('/api/campus-chat', { cookie: cookieLegacyTeacher });
ok('Legacy Teacher session không có explicit accountId bị từ chối, KHÔNG impersonate tài khoản GV của lớp',
  !resTeacherCheck.ok || resTeacherCheck.data?.account_required === true, 'auth_readonly');

// ─── 5. ACCOUNT DEACTIVATION & REVOCATION VERIFICATION ───────────────────────
console.log('\n--- 5. SOCIAL ACCOUNT REVOCATION (DANG_HOAT_DONG = 0) ---');
// Vô hiệu hóa tài khoản User A
queryDb(`UPDATE tai_khoan_campus SET dang_hoat_dong = 0 WHERE id = ${uidA};`);

const resDeactivatedChat = await api('/api/campus-chat', { cookie: cookieA });
ok('Tài khoản bị vô hiệu hóa (dang_hoat_dong=0) bị từ chối truy cập Campus Chat ngay cả khi cookie còn hạn (403/401)',
  resDeactivatedChat.status === 403 || resDeactivatedChat.status === 401, 'account_active', `Status: ${resDeactivatedChat.status}`);

const resDeactivatedFriends = await api('/api/campus-friends', { cookie: cookieA });
ok('Tài khoản bị vô hiệu hóa bị từ chối truy cập Bạn bè (403/401)',
  resDeactivatedFriends.status === 403 || resDeactivatedFriends.status === 401, 'account_active', `Status: ${resDeactivatedFriends.status}`);

// Kích hoạt lại User A cho các bài kiểm tra tiếp theo
queryDb(`UPDATE tai_khoan_campus SET dang_hoat_dong = 1 WHERE id = ${uidA};`);
const resReactivatedChat = await api('/api/campus-chat', { cookie: cookieA });
ok('Tài khoản sau khi kích hoạt lại (dang_hoat_dong=1) truy cập bình thường',
  resReactivatedChat.ok, 'account_active');

// ─── 6. SEARCH PRIVACY & ANTI-ENUMERATION ────────────────────────────────────
console.log('\n--- 6. SEARCH PRIVACY & ANTI-ENUMERATION ---');
// 6.1 Truy vấn ngắn < 4 ký tự
const resShortSearch = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieA,
  body: { action: 'search', query: 'ng' }
});
ok('Tìm kiếm với 2 ký tự bị từ chối hoặc trả về danh sách rỗng (chống quét danh bạ)',
  !resShortSearch.ok || (resShortSearch.data?.list || []).length === 0, 'search_privacy');

// 6.2 Tìm kiếm với prefix hợp lệ >= 4 ký tự
const resValidSearch = await api('/api/campus-friends', {
  method: 'POST',
  cookie: cookieA,
  body: { action: 'search', query: 'qa4c1_hs' }
});
ok('Tìm kiếm với prefix >= 4 ký tự trả về kết quả đúng',
  resValidSearch.ok && Array.isArray(resValidSearch.data?.list) && resValidSearch.data.list.length > 0, 'search_privacy');

// 6.3 Kiểm tra không rò rỉ dữ liệu cá nhân nhạy cảm
const firstFound = (resValidSearch.data?.list || [])[0] || {};
ok('Kết quả tìm kiếm KHÔNG để lộ email, sđt, ngày sinh, hay mã học sinh nội bộ',
  firstFound.email === undefined && firstFound.sdt === undefined && firstFound.ngaySinh === undefined && firstFound.hocSinhId === undefined, 'search_privacy');

// ─── 7. ABUSE THROTTLING & BURST RATE LIMITING ──────────────────────────────
console.log('\n--- 7. ABUSE THROTTLING & BURST RATE LIMITING ---');
// 7.1 Burst Friend Search: Gửi 25 requests tìm kiếm dồn dập từ User B
const searchBurst = Array.from({ length: 25 }, () =>
  api('/api/campus-friends', { method: 'POST', cookie: cookieB, body: { action: 'search', query: 'qa4c1_hs' } })
);
const searchBurstResults = await Promise.all(searchBurst);
const search429Count = searchBurstResults.filter(r => r.status === 429).length;
ok('Burst tìm kiếm bạn bè bị rate-limit chặn lại (ít nhất 1 phản hồi 429 Too Many Requests)',
  search429Count > 0, 'rate_limits', `Số lượng 429: ${search429Count}/25`);

// 7.2 Campus Chat Burst: Gửi 10 tin nhắn dồn dập từ User C
const chatBurst = Array.from({ length: 10 }, (_, i) =>
  api('/api/campus-chat', { method: 'POST', cookie: cookieC, body: { noiDung: `Spam test ${i}` } })
);
const chatBurstResults = await Promise.all(chatBurst);
const chatSuccessCount = chatBurstResults.filter(r => r.ok).length;
const chat429Count = chatBurstResults.filter(r => r.status === 429).length;
ok('10 request gửi Campus Chat dồn dập từ 1 tài khoản KHÔNG tạo ra 10 tin nhắn (được chặn bởi rate-limit server)',
  chatSuccessCount < 10, 'rate_limits', `Thành công: ${chatSuccessCount}/10, 429: ${chat429Count}`);

// ─── 8. REPORT VALIDATION & TEACHER MODERATION QUEUE ─────────────────────────
console.log('\n--- 8. REPORT VALIDATION & TEACHER MODERATION QUEUE ---');
// Thiết lập lại tình bạn giữa B và C để gửi DM
queryDb(`INSERT OR REPLACE INTO campus_friendship (requester_account_id, addressee_account_id, pair_low, pair_high, status)
         VALUES (${uidB}, ${uidC}, ${Math.min(uidB, uidC)}, ${Math.max(uidB, uidC)}, 'accepted');`);

// B gửi tin nhắn DM cho C
const resDmBc = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieB,
  body: { receiverAccountId: uidC, noiDung: 'Tin nhắn không phù hợp để kiểm tra báo cáo' }
});
const msgId = resDmBc.data?.message?.id;
ok('B gửi DM cho C thành công để tạo fixture tin nhắn báo cáo', !!msgId, 'report_moderation', `Status: ${resDmBc.status}, Body: ${JSON.stringify(resDmBc.data)}`);

// C báo cáo tin nhắn này của B -> Hợp lệ
const resValidReport = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieC,
  body: { action: 'report', targetAccountId: uidB, messageId: msgId, reason: 'Ngôn từ không phù hợp' }
});
ok('C báo cáo đúng tin nhắn của B trong hội thoại DM thành công (200 OK)',
  resValidReport.ok, 'report_moderation', `Status: ${resValidReport.status}, Body: ${JSON.stringify(resValidReport.data)}`);

// C cố tình báo cáo một tin nhắn không tồn tại (999999)
const resFakeMsgReport = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieC,
  body: { action: 'report', targetAccountId: uidB, messageId: 999999, reason: 'Test lỗi 404' }
});
ok('Báo cáo tin nhắn không tồn tại bị từ chối (404 Not Found)',
  resFakeMsgReport.status === 404, 'report_moderation');

// A (người ngoài cuộc) cố tình báo cáo tin nhắn msgId (thuộc về B và C)
const resUnrelatedReport = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieA,
  body: { action: 'report', targetAccountId: uidB, messageId: msgId, reason: 'A báo cáo trộm tin nhắn' }
});
ok('Người ngoài cuộc A không thể báo cáo tin nhắn trong DM giữa B và C (403 Forbidden)',
  resUnrelatedReport.status === 403, 'report_moderation', `Status: ${resUnrelatedReport.status}, Body: ${JSON.stringify(resUnrelatedReport.data)}`);

// Tự báo cáo chính mình
const resSelfReport = await api('/api/campus-dm', {
  method: 'POST',
  cookie: cookieB,
  body: { action: 'report', targetAccountId: uidB, reason: 'Tự báo cáo mình' }
});
ok('Tự báo cáo chính mình bị từ chối', !resSelfReport.ok, 'report_moderation');

// Học sinh truy cập hàng đợi kiểm duyệt báo cáo -> Bị cấm (403)
const resStudentAccessQueue = await api('/api/gv/bao-cao', { cookie: cookieA });
ok('Học sinh không được phép đọc hàng đợi Báo cáo vi phạm (403 Forbidden)',
  resStudentAccessQueue.status === 403, 'report_moderation');

// Giáo viên truy cập hàng đợi kiểm duyệt báo cáo -> Thành công (200)
const resTeacherQueue = await api('/api/gv/bao-cao', { cookie: cookieGV });
ok('Giáo viên truy cập hàng đợi Báo cáo vi phạm thành công',
  resTeacherQueue.ok && Array.isArray(resTeacherQueue.data?.reports), 'report_moderation');

const reportsList = resTeacherQueue.data?.reports || [];
const foundReport = reportsList.find(r => r.messageId === msgId);
ok('Giáo viên nhìn thấy báo cáo của C về tin nhắn của B kèm trích dẫn nội dung tin nhắn',
  !!foundReport && foundReport.reportedMessageContent === 'Tin nhắn không phù hợp để kiểm tra báo cáo', 'report_moderation');

// Giáo viên xử lý báo cáo
if (foundReport) {
  const resResolve = await api('/api/gv/bao-cao', {
    method: 'POST',
    cookie: cookieGV,
    body: { reportId: foundReport.id, action: 'resolve', actionNote: 'Đã nhắc nhở học sinh' }
  });
  ok('Giáo viên đánh dấu xử lý vi phạm thành công', resResolve.ok && resResolve.data?.status === 'resolved', 'report_moderation');
}

// ─── 9. GUEST HIGHLIGHTS AUXILIARY DATA PRIVACY ─────────────────────────────
console.log('\n--- 9. GUEST HIGHLIGHTS PRIVACY AUDIT ---');
const resGuestHighlights = await api('/api/campus-highlights');
ok('Khách vãng lai gọi Highlights thành công (200 OK)', resGuestHighlights.ok, 'highlights_guest');

const guestData = resGuestHighlights.data || {};
const focusTongQuan = guestData.focusTongQuan;
const focusSummary = guestData.focusSummary;

ok('Highlights của Khách không để lộ tenPhong trong focusTongQuan',
  !focusTongQuan || focusTongQuan.tenPhong === undefined || focusTongQuan.tenPhong === null, 'highlights_guest');
ok('Highlights của Khách không để lộ tenPhong trong focusSummary',
  !focusSummary || focusSummary.tenPhong === undefined || focusSummary.tenPhong === null, 'highlights_guest');

// ─── 10. PLAIN UTF-8 ENCODING & NO HTML ESCAPE DAMAGE ────────────────────────
console.log('\n--- 10. PLAIN UTF-8 ENCODING CONTRACT ---');
await new Promise(r => setTimeout(r, 2100));
const sampleText = 'Chào bạn <3 và a < b & "quote"';
const resChatSend = await api('/api/campus-chat', {
  method: 'POST',
  cookie: cookieB,
  body: { noiDung: sampleText }
});
ok('Gửi tin nhắn chứa ký tự đặc biệt (<3, <, &, ") thành công', resChatSend.ok, 'encoding', `Status: ${resChatSend.status}, Body: ${JSON.stringify(resChatSend.data)}`);

const resChatFetch = await api('/api/campus-chat?limit=5', { cookie: cookieB });
const recentMsgs = resChatFetch.data?.messages || [];
const matchingMsg = recentMsgs.find(m => m.id === resChatSend.data?.message?.id);

ok('Tin nhắn lưu trữ và trả về đúng nguyên vẹn chuỗi UTF-8 thuần túy (KHÔNG bị escape thành &lt;3 hay &amp;)',
  matchingMsg?.content === sampleText, 'encoding', `Thực tế nhận: "${matchingMsg?.content}"`);

// ─── 11. AUDIT GIAO DIỆN & PERFORMANCE POLLING (INDEX.HTML) ──────────────────
console.log('\n--- 11. AUDIT GIAO DIỆN & PERFORMANCE POLLING (INDEX.HTML) ---');
const indexPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

ok('Sử dụng media query isXlScreen (min-width: 1280px) để quản lý viewport',
  indexHtml.includes("window.matchMedia('(min-width: 1280px)')"), 'polling_audit');

ok('Desktop CampusChatRail được render có điều kiện với {isXlScreen && (không để ẩn ngầm chạy polling)',
  indexHtml.includes('{isXlScreen && (\r\n                <aside') || indexHtml.includes('{isXlScreen && (\n                <aside'), 'polling_audit');

ok('Mobile drawer chỉ được render khi {!isXlScreen && showMobileChatRail (tránh double polling)',
  indexHtml.includes('{!isXlScreen && showMobileChatRail && ('), 'polling_audit');

ok('CampusChatRail hỗ trợ prop isActive để tạm dừng polling khi không active',
  indexHtml.includes('isActive = true') && indexHtml.includes('isActive={activeTab === \'campus\'}'), 'polling_audit');

ok('CampusChatRail sử dụng refs cho lastCampusMessageIdRef và lastDmMessageIdRef',
  indexHtml.includes('lastCampusMessageIdRef') && indexHtml.includes('lastDmMessageIdRef'), 'polling_audit');

ok('Polling useEffect của CampusChatRail KHÔNG phụ thuộc vào campusMessages.length hay dmMessages.length',
  !indexHtml.includes('campusMessages.length, dmMessages.length, taiCampusChat'), 'polling_audit');

ok('TeacherControlCenterModal có tab Báo Cáo kiểm duyệt với actions xử lý vi phạm & bỏ qua',
  indexHtml.includes("id: 'bao_cao'") && indexHtml.includes('Hàng đợi Kiểm duyệt Báo cáo Vi phạm') && indexHtml.includes('handleActionReport'), 'polling_audit');

// ─── TỔNG KẾT BÁO CÁO ────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`📊 TỔNG KẾT KIỂM THỬ PHASE 4C.1: ${pass} ĐẠT, ${fail} HỎNG`);
console.log('Chi tiết theo nhóm:');
for (const [grp, res] of Object.entries(resultsByGroup)) {
  console.log(`  - [${grp.toUpperCase()}]: ${res.pass} PASS / ${res.pass + res.fail} TOTAL`);
}
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
}
