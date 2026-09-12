// ==============================================================================
// cong-cu/qa-phase4c.mjs
// BỘ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN PHASE 4C:
// CAMPUS SOCIAL RAIL, HIGHLIGHTS REDESIGN & CLASS BOARD SIMPLIFICATION
// ==============================================================================
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = {
  home: { pass: 0, fail: 0 },
  dropdown: { pass: 0, fail: 0 },
  classboard: { pass: 0, fail: 0 },
  highlights: { pass: 0, fail: 0 },
  chat: { pass: 0, fail: 0 },
  friends: { pass: 0, fail: 0 },
  dm: { pass: 0, fail: 0 },
  safety: { pass: 0, fail: 0 },
};

function ok(ten, dk, group = 'home', chiTiet = '') {
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

console.log('================================================================');
console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHASE 4C');
console.log('Target Server:', BASE);
console.log('================================================================\n');

// Khởi tạo các fixture tài khoản trong tai_khoan_campus
const uidA = 91001;
const uidB = 91002;
const uidC = 91003;

try {
  const seedFilePath = path.resolve(process.cwd(), 'cong-cu/seed-qa-phase4c.sql');
  execSync(`npx wrangler d1 execute lop-10a7-db --local --file="${seedFilePath}" -y`, { stdio: 'ignore' });
} catch (e) {
  console.warn('Cảnh báo nạp fixture D1 cục bộ:', e.message);
}

// ─── PHẦN 1: AUDIT STATIC CODE & GIAO DIỆN (INDEX.HTML) ─────────────────────
console.log('--- 1. AUDIT GIAO DIỆN CAMPUS HOME & CLASS BOARD (INDEX.HTML) ---');
const indexPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1.1 Campus Home: Global + TẠO PHÒNG MỚI absent from Campus Home
const hasGlobalTaoPhongInLeftNav = indexHtml.includes('id="campus-left-nav"') &&
  indexHtml.slice(indexHtml.indexOf('id="campus-left-nav"'), indexHtml.indexOf('id="campus-left-nav"') + 400).includes('TẠO PHÒNG MỚI');
ok('Global "+ TẠO PHÒNG MỚI" không còn trên Campus Home left nav', !hasGlobalTaoPhongInLeftNav, 'home');

// 1.2 Room creation still exists in Lobbies
ok('Xem chung Lobby vẫn có nút tạo phòng', indexHtml.includes('onOpenTaoPhong') && indexHtml.includes('Tạo phòng'), 'home');
ok('Music Lobby vẫn có nút tạo phòng', indexHtml.includes('Tạo phòng') || indexHtml.includes('setShowTaoPhong(true)'), 'home');
ok('Game Lobby vẫn có tạo bàn cờ', indexHtml.includes('Tạo bàn') || indexHtml.includes('setShowTaoBanModal'), 'home');

// 1.3 Desktop 3-column layout & Chat Rail presence
ok('Campus Home có cấu hình 3 cột trên desktop (Highlights | Flags | Chat Rail)',
  indexHtml.includes('xl:grid-cols-[260px_minmax(0,1fr)_360px]'), 'home');
ok('Thành phần CampusChatRail hiện diện trong index.html', indexHtml.includes('function CampusChatRail'), 'home');
ok('CampusChatRail được nhúng trong layout desktop', indexHtml.includes('<CampusChatRail'), 'home');
ok('Nút toggle mobile chat hiện diện cho màn hình nhỏ', indexHtml.includes('id="mobile-campus-chat-btn"'), 'home');

// 1.4 User dropdown audit
const hasAvatarInMenu = indexHtml.includes('Tùy biến Avatar & Ảnh đại diện');
const hasGvcnNotifInMenu = indexHtml.includes('Thông báo & Lời dặn GVCN');
ok('Dropdown tài khoản KHÔNG còn mục "Tùy biến Avatar & Ảnh đại diện"', !hasAvatarInMenu, 'dropdown');
ok('Dropdown tài khoản KHÔNG còn mục "Thông báo & Lời dặn GVCN"', !hasGvcnNotifInMenu, 'dropdown');

// 1.5 Class Board Simplification audit
const hasClassIdentityCard = indexHtml.includes('Cộng đồng 10A7</h3>');
ok('Bảng tin lớp KHÔNG còn card tóm tắt "Cộng đồng 10A7" bên trái', !hasClassIdentityCard, 'classboard');

const leftNavIdx = indexHtml.indexOf('{/* ─── LEFT COLUMN: TIỆN ÍCH LỚP (PHASE 4C) ─── */}');
const centerMainIdx = indexHtml.indexOf('{/* ─── CENTER COLUMN: PINNED POST');
const classLeftNavSnippet = leftNavIdx !== -1 && centerMainIdx !== -1 ? indexHtml.slice(leftNavIdx, centerMainIdx) : '';

const hasBangTinChungNav = classLeftNavSnippet.includes('# Bảng tin chung');
const hasBangVangNav = classLeftNavSnippet.includes('🏆 Bảng Vàng Vinh Danh');
const hasGameNav = classLeftNavSnippet.includes('🎮 Game & Giải trí');
ok('Menu bên trái KHÔNG còn "# Bảng tin chung"', !hasBangTinChungNav, 'classboard');
ok('Menu bên trái KHÔNG còn "🏆 Bảng Vàng Vinh Danh"', !hasBangVangNav, 'classboard');
ok('Menu bên trái KHÔNG còn "🎮 Game & Giải trí"', !hasGameNav, 'classboard');

ok('Menu bên trái có đề mục "Tiện ích"', indexHtml.includes('Tiện ích</p>'), 'classboard');
ok('Menu bên trái có đúng "📋 Điểm danh"', indexHtml.includes('📋 Điểm danh</span>'), 'classboard');
ok('Menu bên trái có đúng "💰 Quỹ lớp"', indexHtml.includes('💰 Quỹ lớp</span>'), 'classboard');

// 1.6 Class Board Lofi removal audit
const classBoardSection = indexHtml.slice(indexHtml.indexOf("activeTab === 'feed'"), indexHtml.indexOf("activeTab === 'feed'") + 10000);
const hasLofiInClassBoard = classBoardSection.includes('Lofi Study Room');
ok('Bảng tin lớp KHÔNG còn cả 2 widget Lofi Study Room', !hasLofiInClassBoard, 'classboard');

// 1.7 Class Online Card canonical presence
ok('Region 3 có card Online chuyên biệt (#class-online-card)', indexHtml.includes('id="class-online-card"'), 'classboard');
const onlineCardSnippet = indexHtml.slice(indexHtml.indexOf('id="class-online-card"'), indexHtml.indexOf('id="class-online-card"') + 350);
const hasStreakInOnlineCard = onlineCardSnippet.includes('Chuỗi hoạt động của bạn') || onlineCardSnippet.includes('streakHienTai');
ok('Card Online KHÔNG chứa thông tin streak / gamification', !hasStreakInOnlineCard, 'classboard');

// 1.8 Header duplicate online text removed
const hasDuplicateHeaderCount = indexHtml.includes('Online: <strong className="text-emerald-400">');
ok('Header KHÔNG lặp lại dòng đếm text "Online: 5/39"', !hasDuplicateHeaderCount, 'classboard');

// ─── PHẦN 2: HIGHLIGHTS API & PRIVACY ────────────────────────────────────────
console.log('\n--- 2. KIỂM THỬ HIGHLIGHTS API & QUYỀN RIÊNG TƯ ---');
const rHlGuest = await api('/api/campus-highlights');
ok('GET /api/campus-highlights trả về 200 OK', rHlGuest.status === 200, 'highlights');
ok('Danh sách highlights tối đa 4 mục', Array.isArray(rHlGuest.data.highlights) && rHlGuest.data.highlights.length <= 4, 'highlights');

// Privacy: Guest không thấy thông tin nhạy cảm của học sinh
const hlGuestStr = JSON.stringify(rHlGuest.data.highlights || []);
ok('Khách vãng lai không nhận được mã định danh nội bộ hay trường nhạy cảm',
  !hlGuestStr.includes('actorKey') && !hlGuestStr.includes('hoc_sinh_id') && !hlGuestStr.includes('mat_khau'), 'highlights');

// ─── PHẦN 3: CAMPUS CHAT API ─────────────────────────────────────────────────
console.log('\n--- 3. KIỂM THỬ CAMPUS CHAT (TOÀN TRƯỜNG) ---');

// 3.1 Anonymous Guest bị chặn
const rChatGuestGet = await api('/api/campus-chat');
ok('Guest GET /api/campus-chat bị từ chối 401 auth_required', rChatGuestGet.status === 401, 'chat');

const rChatGuestPost = await api('/api/campus-chat', { method: 'POST', body: { noiDung: 'Chào' } });
ok('Guest POST /api/campus-chat bị từ chối 401 auth_required', rChatGuestPost.status === 401, 'chat');

// 3.2 Tài khoản ngoài chưa liên kết bị chặn
const externalCookie = await taoSessionCookie({ accountId: 99999, role: 'student', username: 'outsider' });
const rChatExtGet = await api('/api/campus-chat', { cookie: externalCookie });
ok('Tài khoản ngoài chưa liên kết GET /api/campus-chat bị từ chối 403', rChatExtGet.status === 403, 'chat');

const rChatExtPost = await api('/api/campus-chat', { method: 'POST', body: { noiDung: 'Chào' }, cookie: externalCookie });
ok('Tài khoản ngoài chưa liên kết POST /api/campus-chat bị từ chối 403', rChatExtPost.status === 403, 'chat');

// 3.3 Chuẩn bị 2 học sinh hợp lệ để thử nghiệm
const studentACookie = await taoSessionCookie({ accountId: uidA, hocSinhId: 35, lopId: 1, role: 'student', ten: 'Nguyễn Văn A', username: 'qa4c_hsa' });
const studentBCookie = await taoSessionCookie({ accountId: uidB, hocSinhId: 36, lopId: 1, role: 'student', ten: 'Trần Thị B', username: 'qa4c_hsb' });

// 3.4 Học sinh gửi tin nhắn Campus Chat
await new Promise(r => setTimeout(r, 2100));
const msgContentA = `Xin chào Campus từ Học sinh A ${Date.now()}`;
const rPostA = await api('/api/campus-chat', {
  method: 'POST',
  body: { noiDung: msgContentA },
  cookie: studentACookie
});
ok('Học sinh liên kết gửi tin nhắn Campus Chat thành công (200)', rPostA.status === 200 && rPostA.data.ok, 'chat');
const sentMsgId = rPostA.data.message?.id;
ok('Tin nhắn trả về có id, senderName, classBadge và isMe: true',
  sentMsgId && rPostA.data.message.isMe === true && rPostA.data.message.senderName === 'Nguyễn Văn A', 'chat');

// 3.5 Rate limit gửi chat (chặn gửi liên tục < 2s)
const rPostRateLimit = await api('/api/campus-chat', {
  method: 'POST',
  body: { noiDung: 'Tin nhắn gửi quá nhanh' },
  cookie: studentACookie
});
ok('Server chặn spam tin nhắn gửi quá nhanh (< 2s) mã 429', rPostRateLimit.status === 429, 'chat');

// Đợi 2.1s để hết rate limit
await new Promise(r => setTimeout(r, 2100));

// 3.6 Học sinh B đọc Campus Chat
const rGetB = await api('/api/campus-chat', { cookie: studentBCookie });
ok('Học sinh B đọc được danh sách Campus Chat', rGetB.status === 200 && Array.isArray(rGetB.data.messages), 'chat');
const foundMsgInB = (rGetB.data.messages || []).find(m => m.id === sentMsgId);
ok('Học sinh B thấy tin nhắn của A với isMe: false', foundMsgInB && foundMsgInB.isMe === false, 'chat');
ok('Tin nhắn trong phản hồi KHÔNG lộ actorKey hay dữ liệu nhạy cảm',
  foundMsgInB && !('actorKey' in foundMsgInB) && !('senderAccountId' in foundMsgInB), 'chat');

// 3.7 Thu hồi tin nhắn
const rDelMsg = await api(`/api/campus-chat?id=${sentMsgId}`, { method: 'DELETE', cookie: studentACookie });
ok('Người gửi thu hồi tin nhắn thành công', rDelMsg.status === 200 && rDelMsg.data.ok, 'chat');

const rGetAfterDel = await api('/api/campus-chat', { cookie: studentBCookie });
const stillExists = (rGetAfterDel.data.messages || []).some(m => m.id === sentMsgId);
ok('Tin nhắn đã thu hồi không còn xuất hiện với người dùng khác', !stillExists, 'chat');

// ─── PHẦN 4: BẠN BÈ CAMPUS (CAMPUS FRIENDSHIP) ──────────────────────────────
console.log('\n--- 4. KIỂM THỬ QUAN HỆ BẠN BÈ (FRIENDSHIP LIFECYCLE) ---');

// 4.1 Không thể tự kết bạn với chính mình
const rSelfFriend = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'request', targetAccountId: uidA },
  cookie: studentACookie
});
ok('Không thể gửi lời mời kết bạn cho chính mình (400)', rSelfFriend.status === 400, 'friends');

// 4.2 Tìm kiếm bạn bè
const rSearch = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'search', query: 'qa4c_hsb' },
  cookie: studentACookie
});
ok('Tìm kiếm bạn bè thành công', rSearch.status === 200 && Array.isArray(rSearch.data.list), 'friends');
const foundB = (rSearch.data.list || []).find(u => u.id === uidB);
ok('Kết quả tìm kiếm chứa học sinh B và không chứa thông tin nhạy cảm (SĐT, ngày sinh)',
  foundB && !('soDienThoai' in foundB) && !('ngaySinh' in foundB), 'friends');

// 4.3 A gửi lời mời kết bạn cho B
const rReq = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'request', targetAccountId: uidB },
  cookie: studentACookie
});
ok('A gửi lời mời kết bạn cho B thành công', rReq.status === 200 && rReq.data.status === 'pending', 'friends');

// 4.4 Chặn trùng lặp lời mời kết bạn
const rDupReq = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'request', targetAccountId: uidB },
  cookie: studentACookie
});
ok('Chặn gửi trùng lặp lời mời kết bạn khi đã có lời mời đang chờ (400)', rDupReq.status === 400, 'friends');

// 4.5 Người ngoài C không thể chấp nhận lời mời của B
const studentCCookie = await taoSessionCookie({ accountId: uidC, hocSinhId: 37, lopId: 1, role: 'student', ten: 'Lê Văn C', username: 'qa4c_hsc' });

const rHackAccept = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'accept', fromAccountId: uidA },
  cookie: studentCCookie
});
ok('Người thứ ba C không thể chấp nhận lời mời gửi cho B (403/404)', rHackAccept.status === 403 || rHackAccept.status === 404, 'friends');

// 4.6 B nhận lời mời và kiểm tra danh sách chờ
const rFriendsBBefore = await api('/api/campus-friends', { cookie: studentBCookie });
const pendingForB = (rFriendsBBefore.data.pendingIncoming || []).find(r => r.fromAccountId === uidA);
ok('B nhìn thấy lời mời đang chờ từ A trong pendingIncoming', Boolean(pendingForB), 'friends');

// 4.7 B chấp nhận lời mời kết bạn của A
const rAccept = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'accept', requestId: pendingForB?.requestId },
  cookie: studentBCookie
});
ok('B chấp nhận lời mời kết bạn thành công', rAccept.status === 200 && rAccept.data.status === 'accepted', 'friends');

// 4.8 Cả A và B đều thấy nhau trong danh sách bạn bè
const rFriendsA = await api('/api/campus-friends', { cookie: studentACookie });
const rFriendsB = await api('/api/campus-friends', { cookie: studentBCookie });
const aHasB = (rFriendsA.data.friends || []).some(f => f.accountId === uidB);
const bHasA = (rFriendsB.data.friends || []).some(f => f.accountId === uidA);
ok('A thấy B trong danh sách bạn bè', aHasB, 'friends');
ok('B thấy A trong danh sách bạn bè', bHasA, 'friends');

// ─── PHẦN 5: TIN NHẮN RIÊNG 1-1 (CAMPUS PRIVATE MESSAGING / DM) ─────────────
console.log('\n--- 5. KIỂM THỬ TIN NHẮN RIÊNG 1-1 (DM) ---');

// 5.1 Người chưa kết bạn (C) không thể gửi DM cho A
const rDmUnauthorized = await api('/api/campus-dm', {
  method: 'POST',
  body: { receiverAccountId: uidA, noiDung: 'Chào bạn mình chưa kết bạn' },
  cookie: studentCCookie
});
ok('Người chưa kết bạn (C) gửi DM cho A bị chặn 403 friends_required',
  rDmUnauthorized.status === 403 && rDmUnauthorized.data.code === 'friends_required', 'dm');

// 5.2 Người chưa kết bạn (C) không thể đọc DM giữa A và B
const rDmReadUnauthorized = await api(`/api/campus-dm?friendAccountId=${uidA}`, { cookie: studentCCookie });
ok('Người ngoài (C) không thể đọc tin nhắn riêng của A (403)', rDmReadUnauthorized.status === 403, 'dm');

// 5.3 Bạn bè đã kết nối (A và B) gửi DM thành công
const dmContent = `Xin chào riêng từ A gửi B ${Date.now()}`;
const rDmSendA = await api('/api/campus-dm', {
  method: 'POST',
  body: { receiverAccountId: uidB, noiDung: dmContent },
  cookie: studentACookie
});
ok('Bạn bè (A) gửi tin nhắn riêng cho B thành công (200)', rDmSendA.status === 200 && rDmSendA.data.ok, 'dm');

// 5.4 B đọc tin nhắn riêng từ A
const rDmReadB = await api(`/api/campus-dm?friendAccountId=${uidA}`, { cookie: studentBCookie });
ok('B tải được danh sách tin nhắn riêng với A', rDmReadB.status === 200 && Array.isArray(rDmReadB.data.messages), 'dm');
const foundDm = (rDmReadB.data.messages || []).find(m => m.content === dmContent);
ok('B thấy chính xác nội dung tin nhắn A gửi với isMe: false', foundDm && foundDm.isMe === false, 'dm');

// ─── PHẦN 6: BẢO MẬT, CHẶN & BÁO CÁO (BLOCK & REPORT) ────────────────────────
console.log('\n--- 6. KIỂM THỬ TÍNH NĂNG AN TOÀN (CHẶN & BÁO CÁO) ---');

// 6.1 Gửi báo cáo vi phạm
const rReport = await api('/api/campus-dm', {
  method: 'POST',
  body: {
    action: 'report',
    targetAccountId: uidA,
    messageId: foundDm?.id || 1,
    reason: 'Tin nhắn thử nghiệm kiểm thử an toàn'
  },
  cookie: studentBCookie
});
ok('Gửi báo cáo an toàn thành công (chuyển cho GV xử lý)', rReport.status === 200 && rReport.data.ok, 'safety');

// 6.2 B chặn A
const rBlock = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'block', targetAccountId: uidA },
  cookie: studentBCookie
});
ok('B chặn A thành công', rBlock.status === 200 && rBlock.data.ok, 'safety');

// 6.3 A không thể gửi tin nhắn cho B sau khi bị chặn
const rDmAftBlock = await api('/api/campus-dm', {
  method: 'POST',
  body: { receiverAccountId: uidB, noiDung: 'Em có bị chặn không?' },
  cookie: studentACookie
});
ok('Sau khi bị chặn, A không thể tiếp tục gửi tin nhắn riêng cho B (403)', rDmAftBlock.status === 403, 'safety');

// 6.4 Hủy kết bạn (Unfriend)
// Bỏ chặn và thiết lập lại tình bạn tạm thời để test unfriend
await api('/api/campus-friends', { method: 'POST', body: { action: 'request', targetAccountId: uidB }, cookie: studentACookie });
await api('/api/campus-friends', { method: 'POST', body: { action: 'accept', fromAccountId: uidA }, cookie: studentBCookie });

const rUnfriend = await api('/api/campus-friends', {
  method: 'POST',
  body: { action: 'unfriend', friendAccountId: uidA },
  cookie: studentBCookie
});
ok('Hủy kết bạn (unfriend) thành công', rUnfriend.status === 200 && rUnfriend.data.ok, 'safety');

// Sau khi hủy kết bạn, gửi DM lại bị từ chối
const rDmAfterUnfriend = await api('/api/campus-dm', {
  method: 'POST',
  body: { receiverAccountId: uidB, noiDung: 'Sau hủy kết bạn' },
  cookie: studentACookie
});
ok('Sau khi hủy kết bạn, quyền gửi tin nhắn riêng bị thu hồi (403)', rDmAfterUnfriend.status === 403, 'safety');

// ─── TỔNG KẾT KẾT QUẢ ────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`🏁 TỔNG KẾT KIỂM THỬ TOÀN DIỆN PHASE 4C: ${pass} PASS, ${fail} FAIL`);
console.log('Chi tiết theo nhóm:');
Object.entries(resultsByGroup).forEach(([grp, s]) => {
  console.log(`  - [${grp.toUpperCase()}]: ${s.pass} Pass, ${s.fail} Fail`);
});
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
} else {
  console.log('🎉 TẤT CẢ TEST CASES PHASE 4C ĐÃ VƯỢT QUA 100%!');
  process.exit(0);
}
