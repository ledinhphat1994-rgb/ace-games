// ==============================================================================
// cong-cu/qa-study-room-audit.mjs — v2 GOVERNANCE
// KIỂM CHỨNG MỨC API cho Study Room sau Phase 4G (governance/capability/queue/voice pair).
// Chạy: node cong-cu/qa-study-room-audit.mjs [BASE]
// Yêu cầu: wrangler pages dev ở BASE + local D1 đã nạp migration 77-study-room-governance.sql.
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

const HS_A = { hocSinhId: 90001, lopId: 1, role: 'student', ten: 'HS-A ChuPhong' };   // host
const HS_B = { hocSinhId: 90002, lopId: 1, role: 'student', ten: 'HS-B Member' };     // member cùng lớp
const HS_C = { hocSinhId: 90003, lopId: 2, role: 'student', ten: 'HS-C KhacLop' };    // member khác lớp
const HS_D = { hocSinhId: 90004, lopId: 1, role: 'student', ten: 'HS-D CoHost' };     // sẽ thành co-host
const GV = { role: 'teacher', lopId: 2, id: 77, ten: 'GV Toan Cuc' };                 // teacher toàn cục
const KHOA_B = 'hs:90002', KHOA_C = 'hs:90003', KHOA_D = 'hs:90004';

const ckA = await cookie(HS_A);
const ckB = await cookie(HS_B);
const ckC = await cookie(HS_C);
const ckD = await cookie(HS_D);
const ckG = await cookie(GV);

// Dọn phòng còn sót từ lần chạy trước (mỗi host tối đa 3 phòng mở — sót phòng làm tạo mới bị 429).
{
  const ds = await api('/api/phong', { ck: ckA });
  for (const p of ds.data.phongs || []) {
    for (const ck of [ckA, ckB]) {
      await api('/api/phong', { method: 'POST', ck, body: { hanhDong: 'dong', phongId: p.id } });
    }
  }
}

console.log('=== A. LIFECYCLE + CAPACITY 8/12 ===');

// A1: tạo phòng video → default sucChua=8, seed policy
let r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'QA Gov Public', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
ok('A1 tao phong video, sucChua mac dinh=8', r.status === 200 && (r.data.phong?.sucChua === 8 || r.data.phong?.suc_chua === 8), `sucChua=${r.data.phong?.sucChua}`);
const pubId = r.data.phong?.id;

// A2: sucChua=50 bị clamp về 12
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'QA Cap50', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=abc12345678', sucChua: 50 } });
ok('A2 sucChua=50 bi clamp ve 12', (r.data.phong?.sucChua ?? 0) === 12, `sucChua=${r.data.phong?.sucChua}`);
if (r.data.phong?.id) await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: r.data.phong.id } });

// A3: sucChua=1 bị clamp về 2
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'QA Cap1', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=abc12345678', sucChua: 1 } });
ok('A3 sucChua=1 bi clamp ve 2', (r.data.phong?.sucChua ?? 0) === 2, `sucChua=${r.data.phong?.sucChua}`);
if (r.data.phong?.id) await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: r.data.phong.id } });

// A4: phòng chat vẫn giữ rule generic (sucChua=20 mặc định, 50 được chấp nhận)
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'QA Chat Room', loai: 'chat', phamVi: 'truong', sucChua: 30 } });
ok('A4 phong chat giu generic cap (30)', (r.data.phong?.sucChua ?? 0) === 30, `sucChua=${r.data.phong?.sucChua}`);
const chatRoomId = r.data.phong?.id;
if (chatRoomId) await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: chatRoomId } });

// A5: password room + admission + capacity
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'tao', ten: 'QA PW', loai: 'video', phamVi: 'truong', videoUrl: 'https://www.youtube.com/watch?v=abc12345678', accessMode: 'password', password: 'khoa123', sucChua: 3 } });
const pwId = r.data.phong?.id;
ok('A5 tao phong password sucChua=3', r.status === 200 && pwId > 0);
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'sai' } });
ok('A5b sai mat khau 403', r.status === 403);
r = await api(`/api/phong?id=${pwId}`, { ck: ckB });
ok('A5c chua admitted: cauHinh bi an', r.data.isAdmitted === false && r.data.phong?.cauHinh == null);
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A5d dung mat khau vao duoc', r.status === 200 && r.data.isAdmitted === true);
r = await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A5e thanh vien 3 vao duoc', r.status === 200);
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'vao', phongId: pwId, matKhau: 'khoa123' } });
ok('A5f thanh vien 4 bi chan 409 (capacity)', r.status === 409, `status=${r.status}`);

console.log('\n=== B. VIDEO CONTROL CAPABILITY ===');

// B1: member B vào phòng public; default video_control=staff_only → play 403
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'vao', phongId: pubId } });
ok('B1 member vao phong public', r.status === 200 && r.data.ok === true, `status=${r.status} ${r.data.loi || ''}`);
r = await api(`/api/phong-watch?phongId=${pubId}`, { ck: ckB });
ok('B2 member canControl=false, caps.video_control=false', r.status === 200 && r.data.canControl === false && r.data.caps?.video_control === false, `caps=${JSON.stringify(r.data.caps)}`);
r = await api('/api/phong-watch', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'play', position: 0, expectedRevision: 1 } });
ok('B3 member play bi 403 (staff_only mac dinh)', r.status === 403 && r.data.code === 'staff_only', `status=${r.status} code=${r.data.code}`);

// B2: host grant video_control cho B → B play được
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_B, capability: 'video_control', on: true } });
ok('B4 host grant video_control cho B', r.status === 200 && r.data.ok === true, `status=${r.status} ${r.data.loi || ''}`);
// đổi policy sang selected_members để grant có nghĩa
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'video_control', enabled: 1, accessMode: 'selected_members' } });
ok('B5 host set video_control=selected_members', r.status === 200, `status=${r.status}`);
r = await api('/api/phong-watch', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'play', position: 0, expectedRevision: 1 } });
ok('B6 member co grant play duoc', r.status === 200 && r.data.state?.playing === true, `status=${r.status} ${r.data.loi || ''}`);
const revB = r.data.state?.revision;

// B3: C (không grant) vẫn bị chặn
await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pubId } });
r = await api('/api/phong-watch', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'pause', position: 1, expectedRevision: revB } });
ok('B7 member khong grant bi 403 (grant_required)', r.status === 403 && r.data.code === 'grant_required', `status=${r.status} code=${r.data.code}`);

// B4: policy everyone → C play được
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'video_control', enabled: 1, accessMode: 'everyone' } });
r = await api('/api/phong-watch', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'pause', position: 5, expectedRevision: revB } });
ok('B8 policy everyone -> member play duoc', r.status === 200 && r.data.state?.playing === false, `status=${r.status}`);

// B5: OCC conflict vẫn giữ
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'play', position: 5, expectedRevision: 1 } });
ok('B9 stale revision -> 409 conflict kem state', r.status === 409 && r.data.conflict === true && r.data.state?.revision > 1, `status=${r.status}`);

// B6: set_video — member không có video_change → 403; host ok
r = await api('/api/phong-watch', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'set_video', videoUrl: 'https://www.youtube.com/watch?v=xyz12345678' } });
ok('B10 member set_video bi 403', r.status === 403, `status=${r.status} code=${r.data.code}`);
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'set_video', videoUrl: 'https://www.youtube.com/watch?v=xyz12345678' } });
ok('B11 host set_video ok + reset sync', r.status === 200 && r.data.ok === true && r.data.videoUrl.includes('xyz12345678'), `status=${r.status}`);
r = await api(`/api/phong-watch?phongId=${pubId}`, { ck: ckA });
ok('B12 sau set_video: paused/pos=0/rev tang', r.data.state?.playing === false && r.data.state?.positionSeconds === 0 && r.data.state?.revision > 1, `state=${JSON.stringify(r.data.state)}`);

// B7: capability_off — host tắt video_control → staff vẫn điều khiển được, member không
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'video_control', enabled: 0 } });
r = await api('/api/phong-watch', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'play', position: 0, expectedRevision: r.data.state?.revision || 2 } });
ok('B13 video_control off -> member 403 capability_off', r.status === 403 && r.data.code === 'capability_off', `status=${r.status} code=${r.data.code}`);
r = await api(`/api/phong-watch?phongId=${pubId}`, { ck: ckA });
r = await api('/api/phong-watch', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'play', position: 0, expectedRevision: r.data.state.revision } });
ok('B14 staff van play khi capability off', r.status === 200, `status=${r.status}`);
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'video_control', enabled: 1, accessMode: 'staff_only' } });

console.log('\n=== C. ROOM CHAT + video_time_sec + moderation ===');

// C1: member chat được (default everyone), tin nhắn gắn video_time_sec
r = await api('/api/phong-chat', { method: 'POST', ck: ckB, body: { phongId: pubId, noiDung: 'Doan nay chua hieu', videoTimeSec: 754 } });
ok('C1 member chat + videoTimeSec luu', r.status === 200 && r.data.tinNhan?.videoTimeSec === 754, `videoTimeSec=${r.data.tinNhan?.videoTimeSec}`);
const tinId = r.data.tinNhan?.id;

// C2: member xoá tin → 403; staff xoá được
r = await api(`/api/phong-chat?phongId=${pubId}&id=${tinId}`, { method: 'DELETE', ck: ckC });
ok('C2a member xoa tin -> 403', r.status === 403, `status=${r.status}`);
r = await api(`/api/phong-chat?phongId=${pubId}&id=${tinId}`, { method: 'DELETE', ck: ckA });
ok('C2b host xoa tin ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api(`/api/phong-chat?phongId=${pubId}&sauId=0`, { ck: ckA });
ok('C2c tin da xoa khong con trong feed', !(r.data.tinNhan || []).some(t => t.id === tinId));

// C3: tắt chat → member đọc/ghi bị chặn, staff vẫn đọc
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'chat', enabled: 0 } });
r = await api(`/api/phong-chat?phongId=${pubId}&sauId=0`, { ck: ckB });
ok('C3a chat off -> member doc 403 capability_off', r.status === 403 && r.data.code === 'capability_off');
r = await api(`/api/phong-chat?phongId=${pubId}&sauId=0`, { ck: ckA });
ok('C3b chat off -> staff van doc duoc (kiem duyet)', r.status === 200, `status=${r.status}`);
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'chat', enabled: 1, accessMode: 'everyone' } });

console.log('\n=== D. COLLAB V2 (entries / ops / cells) ===');

// D1: notes — 2 user append, không conflict, cả 2 entry còn
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'notes', payload: { text: 'Note cua A', videoTimeSec: 10 } } });
ok('D1a A them note', r.status === 200 && r.data.id > 0, `status=${r.status} ${r.data.loi || ''}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'notes', payload: { text: 'Note cua B', videoTimeSec: 20 } } });
ok('D1b B them note KHONG conflict', r.status === 200 && r.data.id > 0, `status=${r.status}`);
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckB });
const noteIds = (r.data.payload?.notes || []).map(n => n.noiDung);
ok('D1c ca 2 note con nguyen + co videoTimeSec', noteIds.includes('Note cua A') && noteIds.includes('Note cua B') && r.data.payload.notes.every(n => n.videoTimeSec != null), JSON.stringify(r.data.payload?.notes?.length));
const noteBId = (r.data.payload?.notes || []).find(n => n.noiDung === 'Note cua B')?.id;
const noteAId = (r.data.payload?.notes || []).find(n => n.noiDung === 'Note cua A')?.id;

// D2: member chỉ xoá note của mình; staff xoá được của người khác
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'notes', action: 'xoa_note', id: noteAId } });
ok('D2a member xoa note cua nguoi khac -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'notes', action: 'xoa_note', id: noteBId } });
ok('D2b member xoa note cua minh ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'notes', action: 'xoa_note', id: noteAId } });
ok('D2c staff xoa note cua member ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);

// D3: whiteboard — append-only ops, 2 user vẽ đồng thời KHÔNG conflict
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'whiteboard', payload: { type: 'stroke', stroke: { tool: 'pen', color: '#fff', width: 3, points: [{ x: 1, y: 1 }, { x: 9, y: 9 }] } } } });
ok('D3a A append stroke', r.status === 200 && r.data.id > 0, `status=${r.status}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'whiteboard', payload: { type: 'stroke', stroke: { tool: 'pen', color: '#f00', width: 3, points: [{ x: 2, y: 2 }, { x: 8, y: 8 }] } } } });
ok('D3b B append stroke KHONG conflict', r.status === 200 && r.data.id > 0, `status=${r.status}`);
r = await api(`/api/phong-collab?phongId=${pubId}&resource=whiteboard&sauId=0`, { ck: ckB });
ok('D3c ca 2 stroke trong ops', (r.data.payload?.ops || []).filter(o => o.type === 'stroke').length === 2, `ops=${r.data.payload?.ops?.length}`);

// D4: member clear bảng → 403; staff clear ok
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'whiteboard', payload: { type: 'clear' } } });
ok('D4a member clear bang -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'whiteboard', payload: { type: 'clear' } } });
ok('D4b staff clear ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);

// D5: sheet — 2 user sửa 2 ô khác nhau KHÔNG conflict
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'sheet', payload: { cell: 'A1', value: 'cua A' } } });
ok('D5a A ghi A1', r.status === 200 && r.data.ok === true, `status=${r.status} ${r.data.loi || ''}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, resource: 'sheet', payload: { cell: 'B2', value: 'cua B' } } });
ok('D5b B ghi B2 KHONG conflict', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api(`/api/phong-collab?phongId=${pubId}&resource=sheet`, { ck: ckB });
ok('D5c ca 2 cell con nguyen', r.data.payload?.cells?.A1 === 'cua A' && r.data.payload?.cells?.B2 === 'cua B');
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, resource: 'sheet', payload: { cell: 'Z9', value: 'x' } } });
ok('D5d cell ngoai luoi -> 400', r.status === 400, `status=${r.status}`);

// D6: capability_off — tắt notes → member đọc/ghi 403, staff vẫn đọc
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'notes', enabled: 0 } });
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckB });
ok('D6a notes off -> member doc 403 capability_off', r.status === 403 && r.data.code === 'capability_off');
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckA });
ok('D6b notes off -> staff van doc', r.status === 200, `status=${r.status}`);
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'notes', enabled: 1, accessMode: 'everyone' } });

console.log('\n=== E. VOICE PAIR-BOUND 1-1 ===');

// E1: default voice=selected_members → member join bị grant_required
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'voice_join' } });
ok('E1 member join voice -> grant_required (mac dinh selected)', r.status === 403 && r.data.code === 'grant_required', `status=${r.status} code=${r.data.code}`);

// E2: member voice_request → staff thấy trong yeuCauVoice → grant → join ok slot a
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'voice_request' } });
ok('E2a member voice_request ok', r.status === 200 && r.data.requested === true, `status=${r.status} ${JSON.stringify(r.data)}`);
r = await api(`/api/phong-collab?phongId=${pubId}&action=voice_poll&sauId=0`, { ck: ckA });
ok('E2b staff thay yeu cau cua B', (r.data.yeuCauVoice || []).some(y => y.khoa === KHOA_B), `yeuCau=${JSON.stringify(r.data.yeuCauVoice)}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_B, capability: 'voice', on: true } });
ok('E2c staff grant voice cho B', r.status === 200 && r.data.ok === true);
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'voice_join' } });
ok('E2d B join voice slot=a', r.status === 200 && r.data.slot === 'a', `status=${r.status} ${JSON.stringify(r.data)}`);

// E3: grant C → join slot b → cặp active; D join → 409 voice_room_full
await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pubId } });
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_C, capability: 'voice', on: true } });
r = await api('/api/phong-collab', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'voice_join' } });
ok('E3a C join voice slot=b', r.status === 200 && r.data.slot === 'b', `status=${r.status}`);
await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'vao', phongId: pubId } });
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_D, capability: 'voice', on: true } });
r = await api('/api/phong-collab', { method: 'POST', ck: ckD, body: { phongId: pubId, action: 'voice_join' } });
ok('E3b D join -> 409 voice_room_full', r.status === 409 && r.data.code === 'voice_room_full', `status=${r.status} code=${r.data.code}`);

// E4: người ngoài cặp gửi signal → 403 not_in_pair
r = await api('/api/phong-collab', { method: 'POST', ck: ckD, body: { phongId: pubId, action: 'voice_signal', signalType: 'offer', payload: { sdp: 'fake' } } });
ok('E4a nguoi ngoai cap gui offer -> 403 not_in_pair', r.status === 403 && r.data.code === 'not_in_pair', `status=${r.status} code=${r.data.code}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckD, body: { phongId: pubId, action: 'voice_signal', signalType: 'leave', payload: {} } });
ok('E4b nguoi ngoai cap gui leave -> 403', r.status === 403, `status=${r.status}`);

// E5: voice_poll chỉ trả signal của partner; không lộ senderKey
r = await api('/api/phong-collab', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'voice_signal', signalType: 'offer', payload: { sdp: 'offer-B' } } });
r = await api(`/api/phong-collab?phongId=${pubId}&action=voice_poll&sauId=0`, { ck: ckC });
ok('E5a C (partner) nhan signal cua B', (r.data.signals || []).some(s => s.signalType === 'offer'), `signals=${JSON.stringify(r.data.signals)}`);
ok('E5b khong lo senderKey', !(r.data.signals || []).some(s => 'senderKey' in s || 'sender_key' in s));
r = await api(`/api/phong-collab?phongId=${pubId}&action=voice_poll&sauId=0`, { ck: ckD });
ok('E5c D (ngoai cap) khong nhan signal nao', (r.data.signals || []).length === 0, `signals=${JSON.stringify(r.data.signals)}`);
ok('E5d D van thay trang thai cap (aTen/bTen, khong lo khoa)', r.data.pair?.active === true && r.data.pair?.aTen && !('aKhoa' in (r.data.pair || {})), `pair=${JSON.stringify(r.data.pair)}`);

// E6: staff voice_end → cặp bị xoá; member voice_end → 403
r = await api('/api/phong-collab', { method: 'POST', ck: ckD, body: { phongId: pubId, action: 'voice_end' } });
ok('E6a member voice_end -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong-collab', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'voice_end' } });
ok('E6b staff voice_end ok', r.status === 200 && r.data.ok === true);
r = await api(`/api/phong-collab?phongId=${pubId}&action=voice_poll&sauId=0`, { ck: ckA });
ok('E6c cap da bi ngat (pair.active=false)', r.data.pair?.active === false, `pair=${JSON.stringify(r.data.pair)}`);

console.log('\n=== F. GOVERNANCE — co-host / kick / policy / grant ===');

// F1: host cấp co-host cho D → D là staff
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'set_co_host', phongId: pubId, khoaTV: KHOA_D, on: true } });
ok('F1a host cap co_host cho D', r.status === 200 && r.data.vaiTroPhong === 'co_host', `status=${r.status} ${r.data.loi || ''}`);
r = await api(`/api/phong?id=${pubId}`, { ck: ckD });
ok('F1b D la co_host + isStaff + thay policies', r.data.vaiTroPhong === 'co_host' && r.data.isStaff === true && r.data.policies != null, `vaiTro=${r.data.vaiTroPhong} isStaff=${r.data.isStaff}`);

// F2: co-host KHÔNG được: set_co_host, dong, doi_mat_khau
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'set_co_host', phongId: pubId, khoaTV: KHOA_B, on: true } });
ok('F2a co-host khong cap duoc co_host', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'dong', phongId: pubId } });
ok('F2b co-host khong dong duoc phong', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'doi_mat_khau', phongId: pubId, matKhauMoi: 'x' } });
ok('F2c co-host khong doi mat khau', r.status === 403, `status=${r.status}`);

// F3: co-host ĐƯỢC: đổi policy, grant, kick member
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'policy', phongId: pubId, capability: 'notes', enabled: 1, accessMode: 'staff_only' } });
ok('F3a co-host doi policy ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_B, capability: 'notes', on: true } });
ok('F3b co-host grant ok', r.status === 200 && r.data.ok === true);

// F4: moderation không bao giờ grant cho member được
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_B, capability: 'moderation', on: true } });
ok('F4a grant moderation cho member -> 400', r.status === 400, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'moderation', enabled: 1, accessMode: 'everyone' } });
r = await api(`/api/phong?id=${pubId}`, { ck: ckA });
ok('F4b policy moderation khong the mo ra everyone', r.data.policies?.moderation?.access_mode === 'staff_only', `access=${r.data.policies?.moderation?.access_mode}`);

// F5: member không gọi được governance actions
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'policy', phongId: pubId, capability: 'chat', enabled: 0 } });
ok('F5a member doi policy -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'grant', phongId: pubId, khoaTV: KHOA_C, capability: 'voice', on: true } });
ok('F5b member grant -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'kick', phongId: pubId, khoaTV: KHOA_C } });
ok('F5c member kick -> 403', r.status === 403, `status=${r.status}`);

// F6: kick — member bị kick + ban không vào lại được; staff bỏ ban → vào lại được
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'notes', enabled: 1, accessMode: 'everyone' } });
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'kick', phongId: pubId, khoaTV: KHOA_C } });
ok('F6a host kick member C', r.status === 200 && r.data.ok === true, `status=${r.status} ${r.data.loi || ''}`);
r = await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pubId } });
ok('F6b C bi ban khong vao lai duoc', r.status === 403 && r.data.code === 'room_banned', `status=${r.status} code=${r.data.code}`);
r = await api(`/api/phong-chat?phongId=${pubId}&sauId=0`, { ck: ckC });
ok('F6c C bi ban khong doc duoc chat (khong con member)', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'bo_chan', phongId: pubId, khoaTV: KHOA_C } });
ok('F6d host bo_chan C', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pubId } });
ok('F6e C vao lai duoc sau bo_chan', r.status === 200 && r.data.ok === true, `status=${r.status}`);

// F7: co-host kick member được, KHÔNG kick được co-host/host
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'kick', phongId: pubId, khoaTV: KHOA_C } });
ok('F7a co-host kick member C ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'bo_chan', phongId: pubId, khoaTV: KHOA_C } });
await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: pubId } });
// host cấp co-host cho C rồi cho D kick C → phải 403
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'set_co_host', phongId: pubId, khoaTV: KHOA_C, on: true } });
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'kick', phongId: pubId, khoaTV: KHOA_C } });
ok('F7b co-host khong kick duoc co-host khac', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'set_co_host', phongId: pubId, khoaTV: KHOA_C, on: false } });
ok('F7c host thu co_host cua C', r.status === 200 && r.data.vaiTroPhong === 'member');

// F8: không kick được host/GV
r = await api('/api/phong', { method: 'POST', ck: ckD, body: { hanhDong: 'kick', phongId: pubId, khoaTV: 'hs:90001' } });
ok('F8a co-host kick host -> 400/403', r.status === 400 || r.status === 403, `status=${r.status}`);
await api('/api/phong', { method: 'POST', ck: ckG, body: { hanhDong: 'vao', phongId: pubId } });
r = await api(`/api/phong?id=${pubId}`, { ck: ckG });
const khoaGv = r.data.thanhVien?.find(t => t.vaiTro === 'giao_vien')?.khoa;
if (khoaGv) {
  r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'kick', phongId: pubId, khoaTV: khoaGv } });
  ok('F8b host kick GV -> 403', r.status === 403, `status=${r.status}`);
} else obs('F8b', 'khong tim thay khoa GV trong danh sach');

// F9: đổi password phòng — host đổi, member mới phải nhập pass mới
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'doi_mat_khau', phongId: pubId, matKhauMoi: 'newpass9' } });
ok('F9a host doi mat khau', r.status === 200 && r.data.ok === true, `status=${r.status}`);
const HS_E = { hocSinhId: 90005, lopId: 1, role: 'student', ten: 'HS-E Moi' };
const ckE = await cookie(HS_E);
r = await api('/api/phong', { method: 'POST', ck: ckE, body: { hanhDong: 'vao', phongId: pubId } });
ok('F9b member moi khong co pass -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckE, body: { hanhDong: 'vao', phongId: pubId, matKhau: 'newpass9' } });
ok('F9c member moi voi pass moi -> vao duoc', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'bo_mat_khau', phongId: pubId } });
ok('F9d host bo mat khau -> public', r.status === 200 && r.data.ok === true);

console.log('\n=== G. VIDEO QUEUE ===');

// G1: default queue=staff_only → member enqueue 403
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'enqueue', videoUrl: 'https://www.youtube.com/watch?v=queue001' } });
ok('G1 member enqueue bi 403 (staff_only)', r.status === 403, `status=${r.status} code=${r.data.code}`);

// G2: mở queue everyone → member enqueue/add_next/send_to_chat
await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'policy', phongId: pubId, capability: 'queue', enabled: 1, accessMode: 'everyone' } });
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'enqueue', videoUrl: 'https://www.youtube.com/watch?v=queue001', title: 'Video Q1' } });
ok('G2a member enqueue sau khi everyone', r.status === 200 && r.data.id > 0, `status=${r.status}`);
const q1 = r.data.id;
r = await api('/api/phong-queue', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'enqueue', videoUrl: 'https://www.youtube.com/watch?v=queue002', title: 'Video Q2' } });
const q2 = r.data.id;
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'add_next', videoUrl: 'https://www.youtube.com/watch?v=queue003', title: 'Video Q3 next' } });
const q3 = r.data.id;
r = await api(`/api/phong-queue?phongId=${pubId}&action=list`, { ck: ckB });
const qOrder = (r.data.queue || []).filter(q => q.trangThai === 'queued').map(q => q.id);
ok('G2b add_next len dau hang doi', qOrder[0] === q3, `order=${JSON.stringify(qOrder)}`);

// G3: reorder
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'reorder', ids: [q1, q3, q2] } });
ok('G3a reorder ok', r.status === 200 && r.data.ok === true);
r = await api(`/api/phong-queue?phongId=${pubId}&action=list`, { ck: ckB });
const qOrder2 = (r.data.queue || []).filter(q => q.trangThai === 'queued').map(q => q.id);
ok('G3b reorder ap dung', JSON.stringify(qOrder2) === JSON.stringify([q1, q3, q2]), `order=${JSON.stringify(qOrder2)}`);

// G4: member xoá mục của người khác → 403; của mình → ok
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'remove', id: q2 } });
ok('G4a member xoa muc cua nguoi khac -> 403', r.status === 403, `status=${r.status}`);
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'remove', id: q1 } });
ok('G4b member xoa muc cua minh ok', r.status === 200 && r.data.ok === true);

// G5: play_now cần video_change (staff_only) → member 403; host play_now ok → video đổi
r = await api('/api/phong-queue', { method: 'POST', ck: ckC, body: { phongId: pubId, action: 'play_now', id: q3 } });
ok('G5a member play_now -> 403 (video_change)', r.status === 403, `status=${r.status}`);
r = await api('/api/phong-queue', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'play_now', id: q3 } });
ok('G5b host play_now ok', r.status === 200 && r.data.videoUrl?.includes('queue003'), `status=${r.status} ${JSON.stringify(r.data)}`);
r = await api(`/api/phong-watch?phongId=${pubId}`, { ck: ckA });
ok('G5c video dang phat doi theo queue', r.data.phong?.videoUrl?.includes('queue003'), `videoUrl=${r.data.phong?.videoUrl}`);

// G6: send_to_chat → tin nhắn vào chat phòng
r = await api('/api/phong-queue', { method: 'POST', ck: ckB, body: { phongId: pubId, action: 'send_to_chat', id: q2 } });
ok('G6a send_to_chat ok', r.status === 200 && r.data.ok === true, `status=${r.status}`);
r = await api(`/api/phong-chat?phongId=${pubId}&sauId=0`, { ck: ckB });
ok('G6b tin video xuat hien trong chat', (r.data.tinNhan || []).some(t => (t.noiDung || '').includes('queue002')));

// G7: skip → phát video kế tiếp
r = await api('/api/phong-queue', { method: 'POST', ck: ckA, body: { phongId: pubId, action: 'skip' } });
ok('G7 skip -> video tiep theo (queue002)', r.status === 200 && r.data.videoUrl?.includes('queue002'), `status=${r.status} ${JSON.stringify(r.data)}`);

console.log('\n=== H. SECURITY ===');
r = await api(`/api/phong?id=${pubId}`, {});
ok('H1 unauth GET phong -> 401', r.status === 401);
r = await api(`/api/phong-watch?phongId=${pubId}`, {});
ok('H2 unauth phong-watch -> 401', r.status === 401);
r = await api(`/api/phong?id=${pubId}`, { ck: ckA });
const bodyStr = JSON.stringify(r.data);
ok('H3 khong lo matKhauHash/Salt/chuPhongKhoa', !/matKhau(Hash|Salt)|mat_khau_(hash|salt)/.test(bodyStr) && !/chuPhongKhoa|chu_phong_khoa/.test(bodyStr));
r = await api(`/api/phong?id=${pubId}`, { ck: ckB });
ok('H4 member khong thay khoa cua nguoi khac', !(r.data.thanhVien || []).some(t => t.khoa), `tv0=${JSON.stringify(r.data.thanhVien?.[0])}`);
ok('H4b member khong nhan policies/grants', r.data.policies === undefined && r.data.grants === undefined, `policies=${typeof r.data.policies}`);
r = await api(`/api/phong?id=${pubId}`, { ck: ckA });
ok('H5 staff thay khoa thanh vien (de kick/grant)', (r.data.thanhVien || []).some(t => t.khoa), `tv0=${JSON.stringify(r.data.thanhVien?.[0])}`);

// H6: phòng 'lop' lớp 1 — HS lớp khác bị chặn (tạo bằng B để không vướng giới hạn phòng của A)
r = await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'tao', ten: 'QA Lop Room', loai: 'video', phamVi: 'lop', videoUrl: 'https://www.youtube.com/watch?v=abc12345678' } });
const lopRoomId = r.data.phong?.id;
ok('H6a tao phong lop thanh cong', r.status === 200 && lopRoomId > 0, `status=${r.status} loi=${r.data.loi || ''}`);
r = await api(`/api/phong?id=${lopRoomId}`, { ck: ckC });
ok('H6b HS lop khac bi chan GET phong lop', r.status === 403, `status=${r.status}`);
r = await api('/api/phong', { method: 'POST', ck: ckC, body: { hanhDong: 'vao', phongId: lopRoomId } });
ok('H6c HS lop khac bi chan vao phong lop', r.status === 403, `status=${r.status}`);
r = await api(`/api/phong-chat?phongId=${lopRoomId}`, { ck: ckC });
ok('H6d HS lop khac bi chan chat phong lop', r.status === 403, `status=${r.status}`);
if (lopRoomId) await api('/api/phong', { method: 'POST', ck: ckB, body: { hanhDong: 'dong', phongId: lopRoomId } });

// H7: phòng đóng → mọi tài nguyên 404
r = await api('/api/phong', { method: 'POST', ck: ckA, body: { hanhDong: 'dong', phongId: pubId } });
ok('H7a host dong phong', r.status === 200 && r.data.ok === true);
r = await api(`/api/phong-collab?phongId=${pubId}&resource=notes`, { ck: ckA });
ok('H7b phong dong -> collab 404', r.status === 404);
r = await api(`/api/phong-queue?phongId=${pubId}`, { ck: ckA });
ok('H7c phong dong -> queue 404', r.status === 404);
r = await api(`/api/phong-chat?phongId=${pubId}`, { ck: ckA });
ok('H7d phong dong -> chat 404', r.status === 404);

console.log(`\n=== TỔNG: ${pass} PASS, ${fail} FAIL ===`);
import fs from 'fs';
fs.writeFileSync('cong-cu/qa-study-room-audit-result.txt', log.join('\n') + `\nTOTAL: ${pass} PASS ${fail} FAIL\n`);
process.exit(fail > 0 ? 1 : 0);
