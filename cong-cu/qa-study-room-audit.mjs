// ==============================================================================
// cong-cu/qa-study-room-audit.mjs
// KIỂM CHỨNG MỨC API cho STUDY ROOM FUNCTIONAL AUDIT (đọc-thêm, không sửa hệ thống)
// Chạy: node cong-cu/qa-study-room-audit.mjs [BASE]
// Yêu cầu: wrangler pages dev đang chạy ở BASE + D1 local đã có schema.
// ==============================================================================
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const SECRET = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const log = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); log.push(`PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); log.push(`FAIL  ${name} ${detail}`); }
}
function obs(name, detail) { console.log(`  OBS   ${name} :: ${detail}`); log.push(`OBS   ${name} :: ${detail}`); }

async function cookie(user) {
  const t = await createToken(SECRET, user, 3600);
  return `${COOKIE_NAME}=${t}`;
}
async function api(path, { method = 'GET', body = null, ck = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (ck) headers['Cookie'] = ck;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const HS_A = { hocSinhId: 90001, lopId: 1, role: 'student', ten: 'HS-A ChuPhong' };
const HS_B = { hocSinhId: 90002, lopId: 1, role: 'student', ten: 'HS-B CungLop' };
const HS_C = { hocSinhId: 90003, lopId: 2, role: 'student', ten: 'HS-C KhacLop' };
const GV = { role: 'teacher', lopId: 2, id: 77, ten: 'GV Khac Lop' }; // GV lớp khác — kiểm tra quyền teacher toàn cục

const ckA = await cookie(HS_A);
const ckB = await cookie(HS_B);
const ckC = await cookie(HS_C);
const ckG = await cookie(GV);

console.log('=== A. ROOM LIFECYCLE ===');

// A1: tạo phòng video public
let r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'Audit Study Room Public', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
ok('A1 tao phong video public', r.status === 200 && r.data.phong?.id > 0, JSON.stringify(r.data).slice(0, 200));
const pubId = r.data.phong?.id;
obs('A1 sucChua mac dinh', `sucChua=${r.data.phong?.sucChua ?? 'n/a'}`);

// A2: tạo phòng password + capacity tùy chỉnh
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'Audit Study Room PW', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=abc12345678', accessMode: 'password', password: 'khoa123', sucChua: 3 } });
ok('A2 tao phong password sucChua=3', r.status === 200 && r.data.phong?.id > 0);
const pwId = r.data.phong?.id;

// A3: generic capacity cap — sucChua=50 được chấp nhận cho phòng video
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'Audit Cap50', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=abc12345678', sucChua: 50 } });
const cap50room = r.data.phong;
ok('A3 server chap nhan sucChua=50 cho phong video (khong co cap study=12)', cap50room?.sucChua === 50 || cap50room?.suc_chua === 50, `sucChua=${cap50room?.sucChua ?? cap50room?.suc_chua}`);
if (cap50room?.id) await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: cap50room.id } });

// A4: wrong password rejected
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'sai-pass' } });
ok('A4 sai mat khau bi tu choi 403', r.status === 403, `status=${r.status}`);

// A5: detail trước khi nhập pass — cauHinh bị ẩn
r = await api(`/api/phong?id=${pwId}`, { ck: ckB });
ok('A5 password room chua admitted: isAdmitted=false va cauHinh an', r.data.isAdmitted === false && (r.data.phong?.cauHinh == null), `isAdmitted=${r.data.isAdmitted} cauHinh=${JSON.stringify(r.data.phong?.cauHinh)}`);

// A6: join đúng password
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A6 vao phong dung mat khau', r.status === 200 && r.data.ok === true && r.data.isAdmitted === true, `status=${r.status}`);

// A7: capacity enforcement sucChua=3 — A(host) + B đã vào = 2; C join → 3 ok; 1 người nữa → 409
r = await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A7a thanh vien thu 3 vao duoc', r.status === 200 && r.data.ok === true, `status=${r.status} ${r.data.loi || ''}`);
const HS_D = { hocSinhId: 90004, lopId: 1, role: 'student', ten: 'HS-D Thu4' };
const ckD = await cookie(HS_D);
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A7b thanh vien thu 4 bi chan 409 khi phong day', r.status === 409, `status=${r.status} loi=${r.data.loi}`);

// A8: duplicate join — B vào lại vẫn ok (ON CONFLICT)
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A8 duplicate join khong loi', r.status === 200 && r.data.ok === true);

// A9: heartbeat
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'nhip', phongId: pwId } });
ok('A9 heartbeat nhip giu cho', r.status === 200 && r.data.ok === true);

// A10: member list
r = await api(`/api/phong?id=${pwId}`, { ck: ckB });
ok('A10 danh sach thanh vien sau khi admitted', Array.isArray(r.data.thanhVien) && r.data.thanhVien.length === 3, `count=${r.data.thanhVien?.length}`);
obs('A10 member fields leaked?', JSON.stringify(r.data.thanhVien?.[0] || {}));

// A11: close room — member không đóng được, host đóng được
r = await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'dong', phongId: pwId } });
ok('A11a member (non-host) khong dong duoc phong', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: pwId } });
ok('A11b host dong phong', r.status === 200 && r.data.ok === true);
r = await api(`/api/phong?id=${pwId}`, { ck: ckA });
ok('A11c phong da dong -> 404', r.status === 404, `status=${r.status}`);

// A12: teacher lớp KHÁC vẫn vào/điều khiển phòng public (quyền teacher toàn cục)
r = await api('/api/phong', { method: 'POST', ck: ckG, body: { hanhDong: 'vao', phongId: pubId } });
ok('A12 teacher lop khac vao phong truong + canControl=true', r.status === 200 && r.data.canControl === true, `canControl=${r.data.canControl}`);

console.log('\n=== B. VIDEO SYNC ===');

// B1: member đọc trạng thái, canControl=false
r = await api(`/api/phong-watch?phongId=${pubId}`, { ck: ckB });
ok('B1 member doc state, canControl=false', r.status === 200 && r.data.canControl === false && r.data.state?.revision >= 1, `status=${r.status}`);

// B2: member POST play → 403
r = await api('/api/phong-watch', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'play', position: 0, expectedRevision: 1 } });
ok('B2 member play bi tu choi 403', r.status === 403, `status=${r.status}`);

// B3: host play rev=1 → ok rev=2
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'play', position: 0, expectedRevision: 1 } });
ok('B3 host play rev1 -> rev2', r.status === 200 && r.data.state?.revision === 2, JSON.stringify(r.data.state || r.data));

// B4: stale revision → 409 + state mới
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'pause', position: 5, expectedRevision: 1 } });
ok('B4 stale revision -> 409 conflict kem state', r.status === 409 && r.data.conflict === true && r.data.state?.revision === 2, `status=${r.status}`);

// B5: set_rate hợp lệ / không hợp lệ
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'set_rate', playbackRate: 1.5, expectedRevision: 2 } });
ok('B5a set_rate 1.5 hop le', r.status === 200 && r.data.state?.playbackRate === 1.5, `status=${r.status}`);
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'set_rate', playbackRate: 3.0, expectedRevision: 3 } });
ok('B5b set_rate 3.0 bi tu choi', r.status === 400, `status=${r.status}`);

// B6: đổi video — KHÔNG có action nào
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'change_video', videoUrl: 'https://www.youtube.com/watch?v=xyz', expectedRevision: 3 } });
obs('B6 change_video qua phong-watch', `status=${r.status} loi=${r.data.loi || ''}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'doi-video', phongId: pubId, videoUrl: 'https://www.youtube.com/watch?v=xyz' } });
obs('B6b hanhDong doi-video qua phong', `status=${r.status} loi=${r.data.loi || ''}`);

// B7: teacher lớp khác điều khiển được video của phòng HS (canControl=teacher toàn cục)
r = await api(`/api/phong-watch?phongId=${pubId}`, { ck: ckG });
const gvRev = r.data.state?.revision;
r = await api('/api/phong-watch', { method: 'POST', ck: ckG, body: { phongId: pubId, action: 'pause', position: 10, expectedRevision: gvRev } });
ok('B7 GV lop khac pause duoc video phong hoc sinh', r.status === 200 && r.data.state?.playing === false, `status=${r.status}`);

console.log('\n=== C. ROOM CHAT ===');

// tạo lại 1 phòng password để test chat gating
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'Audit PW Chat', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=abc12345678', accessMode: 'password', password: 'pw1' } });
const pwChat = r.data.phong?.id;

// C1: chưa admitted → chat bị chặn
r = await api(`/api/phong-chat?phongId=${pwChat}`, { ck: ckB });
ok('C1a chua nhap pass -> doc chat 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong-chat', { method: 'POST', ck: ckB, body: { phongId: pwChat, noiDung: 'hello?' } });
ok('C1b chua nhap pass -> gui chat 403', r.status === 403, `status=${r.status}`);

// C2: sau khi vào đúng pass → chat ok
await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pwChat, matKhau: 'pw1' } });
r = await api('/api/phong-chat', { method: 'POST', ck: ckB, body: { phongId: pwChat, noiDung: 'Tin nhan dau tien cua B' } });
ok('C2 member da admitted gui chat thanh cong', r.status === 200 && r.data.tinNhan?.id > 0, `status=${r.status}`);

// C3: rate limit 3s
r = await api('/api/phong-chat', { method: 'POST', ck: ckB, body: { phongId: pwChat, noiDung: 'spam ngay sau do' } });
ok('C3 gui 2 tin <3s -> 429', r.status === 429, `status=${r.status}`);

// C4: moderation — không có endpoint xoá/kick tin nhắn phòng
r = await api(`/api/phong-chat?phongId=${pwChat}&xoa=1`, { method: 'DELETE', ck: ckA });
obs('C4 DELETE phong-chat', `status=${r.status}`);

console.log('\n=== D. COLLAB (notes/sheet/whiteboard) ===');

// D1: default payload
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckB });
ok('D1 notes default version=0', r.data.ok === true && r.data.version === 0);

// D2: B lưu notes v0→v1
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'notes', payload: { text: 'Ghi chu cua B' }, expectedVersion: 0 } });
ok('D2 member (non-staff) GHI DUOC notes (khong co capability check)', r.status === 200 && r.data.version === 1, `status=${r.status}`);

// D3: A lưu notes với expectedVersion=0 (stale) → 409 + currentPayload — lost update proof
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'notes', payload: { text: 'Ghi chu cua A ghi de' }, expectedVersion: 0 } });
ok('D3 stale notes -> 409 conflict whole-doc', r.status === 409 && r.data.conflict === true, `status=${r.status}`);

// D4: whole-document overwrite — A ghi đè bằng version mới: text của B biến mất (không merge)
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'notes', payload: { text: 'CHI CON text cua A' }, expectedVersion: 1 } });
ok('D4 whole-doc overwrite (khong merge)', r.status === 200 && r.data.version === 2);
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckB });
ok('D4b text cua B bi mat hoan toan', r.data.payload?.text === 'CHI CON text cua A', `text=${r.data.payload?.text}`);

// D5: whiteboard — 2 user append stroke đồng thời: người sau bị 409, mất nét
await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'whiteboard', payload: { strokes: [{ tool: 'pen', color: '#fff', width: 3, points: [{ x: 1, y: 1 }, { x: 9, y: 9 }] }] }, expectedVersion: 0 } });
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'whiteboard', payload: { strokes: [{ tool: 'pen', color: '#f00', width: 3, points: [{ x: 2, y: 2 }, { x: 8, y: 8 }] }] }, expectedVersion: 0 } });
ok('D5 2 nguoi ve dong thoi -> nguoi sau 409, stroke bi mat', r.status === 409, `status=${r.status}`);

// D6: sheet — 2 user sửa ô khác nhau vẫn xung đột whole-doc
await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'sheet', payload: { cells: { A1: 'cua A' }, rows: 10, cols: 8 }, expectedVersion: 0 } });
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'sheet', payload: { cells: { A1: 'cua A', B2: 'cua B' }, rows: 10, cols: 8 }, expectedVersion: 0 } });
ok('D6 2 nguoi sua o khac nhau van 409 whole-doc', r.status === 409, `status=${r.status}`);

// D7: phòng password — collab bị chặn khi chưa admitted
r = await api(`/api/phong-collab?phongId=${pwChat}&resource=notes`, { ck: ckC });
ok('D7 collab phong password chua admitted -> 403', r.status === 403, `status=${r.status}`);

console.log('\n=== E. VOICE SIGNALING ===');

// E1: join A, join B ok; join C -> 409 full
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'voice_signal', signalType: 'join', payload: {} } });
ok('E1a A join voice', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'voice_signal', signalType: 'join', payload: {} } });
ok('E1b B join voice', r.status === 200 && r.data.ok === true);
r = await api('/api/phong-collab', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'voice_signal', signalType: 'join', payload: {} } });
ok('E1c C join voice -> 409 voice_room_full', r.status === 409 && r.data.code === 'voice_room_full', `status=${r.status}`);

// E2: C bị chặn join nhưng VẪN gửi offer được (không kiểm tra pair membership)
r = await api('/api/phong-collab', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'voice_signal', signalType: 'offer', payload: { sdp: 'v=0 fake-offer-from-C' } } });
ok('E2 C (khong trong cap 1-1) van gui duoc offer -> signaling khong rang buoc pair', r.status === 200 && r.data.ok === true, `status=${r.status}`);

// E3: voice_poll — A thấy signal của C lẫn B (broadcast toàn phòng, không addressing)
r = await api(`/api/phong-collab?phongId=${pubId}&action=voice_poll&sauId=0`, { ck: ckA });
const senders = (r.data.signals || []).map(s => s.senderKey);
ok('E3 voice_poll broadcast: A nhan signal ca B lan C', senders.includes('hs:90002') && senders.includes('hs:90003'), `senders=${JSON.stringify(senders)}`);

// E4: leave từ người ngoài pair vẫn phát broadcast (ai cũng gửi leave được)
r = await api('/api/phong-collab', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'voice_signal', signalType: 'leave', payload: {} } });
ok('E4 C gui leave van duoc chap nhan (co the ngat cap dang noi)', r.status === 200 && r.data.ok === true, `status=${r.status}`);

console.log('\n=== F. YOUTUBE SEARCH ===');
r = await api('/api/youtube-search');
ok('F1 no q -> ok + configured flag', r.status === 200 && r.data.ok === true && 'configured' in r.data, `configured=${r.data.configured}`);
r = await api('/api/youtube-search?q=test');
obs('F2 youtube-search khong can auth (public endpoint)', `status=${r.status} configured=${r.data.configured} code=${r.data.code || ''}`);

console.log('\n=== G. SECURITY ===');
// G1: chưa đăng nhập -> 401 trên các API phòng
r = await api(`/api/phong?id=${pubId}`, {});
ok('G1 unauth GET phong -> 401', r.status === 401, `status=${r.status}`);
r = await api(`/api/phong-watch?phongId=${pubId}`, {});
ok('G2 unauth phong-watch -> 401', r.status === 401, `status=${r.status}`);
r = await api('/api/youtube-search?q=x', {});
ok('G3 youtube-search unauth van 200 (public, chi co IP rate-limit)', r.status === 200, `status=${r.status}`);

// G4: hash/salt không lộ
r = await api(`/api/phong?id=${pubId}`, { ck: ckA });
const bodyStr = JSON.stringify(r.data);
ok('G4 khong lo matKhauHash/Salt/chuPhongKhoa trong detail', !/matKhau(Hash|Salt)|mat_khau_(hash|salt)/.test(bodyStr) && !/chuPhongKhoa|chu_phong_khoa/.test(bodyStr), bodyStr.slice(0, 300));

// G5: list phòng không lộ cau_hinh
r = await api('/api/phong', { ck: ckA });
ok('G5 list khong tra cauHinh', !(r.data.phongs || []).some(p => p.cauHinh || p.cau_hinh || p.matKhauHash));

// G6: phòng 'lop' lớp 1 — HS lớp 2 bị chặn
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'Audit Lop Room', loai: 'video', phamVi: 'lop', videoUrl: 'https://www.youtube.com/watch?v=abc12345678' } });
const lopRoomId = r.data.phong?.id;
r = await api(`/api/phong?id=${lopRoomId}`, { ck: ckC });
ok('G6 HS lop khac bi chan phong lop', r.status === 403, `status=${r.status}`);
if (lopRoomId) await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: lopRoomId } });

// G7: đóng phòng rồi vẫn đọc collab được không?
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: pubId } });
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckA });
ok('G7 phong dong -> collab 404', r.status === 404, `status=${r.status}`);
r = await api(`/api/phong-chat?phongId=${pubId}`, { ck: ckA });
ok('G7b phong dong -> chat 404', r.status === 404, `status=${r.status}`);

console.log(`\n=== TỔNG: ${pass} PASS, ${fail} FAIL ===`);
import fs from 'fs';
fs.writeFileSync('cong-cu/qa-study-room-audit-result.txt', log.join('\n') + `\nTOTAL: ${pass} PASS ${fail} FAIL\n`);
process.exit(fail > 0 ? 1 : 0);
