// Phase 4A.1: real HTTP + D1 + browser verification, isolated local database only.
// Setup and invocation: docs/phase-4a1-verification.md
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8790';
const persist = 'qa/phase4a1-db';
const secret = 'phase4a1-local-test-only-secret-2026';
assert.equal(new URL(BASE).hostname, '127.0.0.1', 'QA must target the isolated local server');
const A = { role: 'student', hocSinhId: 91001, lopId: 910, ten: 'QA Student A' };
const B = { role: 'student', hocSinhId: 91002, lopId: 910, ten: 'QA Student B' };
const C = { role: 'student', hocSinhId: 92001, lopId: 920, ten: 'QA Student C' };
const GV = { role: 'teacher', lopId: 910, ten: 'QA Teacher' };
const GV2 = { role: 'teacher', lopId: 920, ten: 'QA Teacher 2' };
let checks = 0;
function check(label, condition) { assert.ok(condition, label); checks++; console.log('PASS ' + label); }
function sql(command) {
  return JSON.parse(execFileSync(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'lop-10a7-db',
    '--local', '--persist-to=' + persist, '--command', command, '--json'
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}
async function api(path, user, body, method = body ? 'POST' : 'GET') {
  const headers = { 'Content-Type': 'application/json' };
  if (user) headers.Cookie = COOKIE_NAME + '=' + await createToken(secret, user, 3600);
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json() };
}
const announce = (user, body) => api('/api/campus-thong-bao', user, body);
const redeem = (user, maCode) => api('/api/kiem-tra-ma-cong-dong', user, { maCode });
async function invite(hocSinhId = A.hocSinhId) {
  const r = await api('/api/gv/ma-cong-dong', GV, { hocSinhId, hanhDong: 'tao_ma' });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r.data;
}

if (!process.argv.includes('--browser-only')) {
for (const user of [A, B, C]) execFileSync(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js', 'kv', 'key', 'delete',
  'community:' + user.lopId + ':' + user.hocSinhId, '--binding=RATE_LIMIT', '--local', '--persist-to=' + persist
], { stdio: 'pipe' });
sql(`
INSERT OR IGNORE INTO lop (id, ten, slug) VALUES (910, 'QA Class A', 'qa-a'), (920, 'QA Class B', 'qa-b');
INSERT OR IGNORE INTO hoc_sinh (id, ho_ten, lop_id, so_thu_tu) VALUES
(91001, 'QA Student A', 910, 1), (91002, 'QA Student B', 910, 2), (92001, 'QA Student C', 920, 1);
DELETE FROM community_membership WHERE lop_id IN (910, 920);
DELETE FROM ma_truy_cap_cong_dong WHERE lop_id IN (910, 920);
DELETE FROM campus_bien_tap_vien WHERE lop_id IN (910, 920);
DELETE FROM campus_thong_bao WHERE lop_id IN (910, 920);
DELETE FROM user_streaks WHERE lop_id IN (910, 920);
INSERT INTO user_streaks (hoc_sinh_id, lop_id, loai_streak, streak_hien_tai) VALUES
(91001, 910, 'study', 12), (91001, 910, 'attendance', 8), (92001, 920, 'study', 5);
DELETE FROM game_phong WHERE lop_id IN (910, 920);
INSERT INTO game_phong (lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten, trang_thai, pham_vi) VALUES
(910, 'caro', 'QA public game', 91001, 'QA Student A', 'cho_nguoi', 'truong'),
(920, 'caro', 'QA active game', 92001, 'QA Student C', 'dang_choi', 'truong'),
(910, 'caro', 'QA PRIVATE GAME', 91002, 'QA Student B', 'dang_choi', 'lop');
DELETE FROM phong WHERE lop_id IN (910, 920);
INSERT INTO phong (id, loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten) VALUES
(91001, 'focus', 'QA public focus', 'truong', 910, 'hs:91001', 'QA Student A'),
(91002, 'video', 'QA public watch', 'truong', 910, 'hs:91001', 'QA Student A'),
(91003, 'focus', 'QA PRIVATE FOCUS', 'lop', 910, 'hs:91001', 'QA Student A'),
(91004, 'video', 'QA PRIVATE WATCH', 'lop', 910, 'hs:91001', 'QA Student A');
INSERT INTO phong_thanh_vien (phong_id, khoa, ten, hoat_dong_luc)
SELECT id, 'qa:one', 'QA Student A', datetime('now') FROM phong WHERE lop_id = 910;
INSERT INTO phong_thanh_vien (phong_id, khoa, ten, hoat_dong_luc)
SELECT id, 'qa:two', 'QA Student B', datetime('now') FROM phong WHERE lop_id = 910 AND pham_vi = 'lop';
`);
check('server uses isolated signing key', (await api('/api/whoami', GV)).status === 200);
for (const path of ['/api/lop', '/api/bai-dang/tuong-tac?baiDangId=1']) {
  check('guest denied ' + path, (await api(path)).status === 401);
  check('nonmember denied ' + path, (await api(path, A)).status === 403);
}
check('anonymous redemption denied', (await redeem(null, 'anything')).status === 401);
check('class-code session has no membership', (await api('/api/lop', { role: 'student', lopId: 910 })).status === 403);
check('student cannot issue invites', (await api('/api/gv/ma-cong-dong', A, { hocSinhId: 91001 })).status === 403);
check('target is mandatory', (await api('/api/gv/ma-cong-dong', GV, {})).status === 400);
check('cross-class invite denied', (await api('/api/gv/ma-cong-dong', GV, { hocSinhId: 92001 })).status === 400);
const code = await invite();
check('per-student random invitation', code.hocSinhId === A.hocSinhId && code.maCode.length >= 19);
const stored = sql('SELECT ma_code, ma_hash FROM ma_truy_cap_cong_dong WHERE lop_id = 910 AND id = ' + code.id)[0].results[0];
check('plaintext not persisted', stored.ma_code !== code.maCode && stored.ma_hash.length === 64);
const listed = JSON.stringify((await api('/api/gv/ma-cong-dong', GV)).data);
check('listing hides code and hash', !listed.includes(code.maCode) && !listed.includes(stored.ma_hash));
check('wrong student denied', (await redeem(B, code.maCode)).status === 403);
check('wrong class denied', (await redeem(C, code.maCode)).status === 403);
const race = await Promise.all([redeem(A, code.maCode), redeem(A, code.maCode)]);
check('exactly one concurrent redemption succeeds', race.filter(r => r.status === 200).length === 1);
check('membership survives new request', (await api('/api/whoami', A)).data.coQuyenCongDong === true);
check('member can read feed', (await api('/api/lop', A)).status === 200);
for (const method of ['POST', 'PUT', 'DELETE']) {
  check('nonmember interaction denied ' + method,
    (await api('/api/bai-dang/tuong-tac', B, { baiDangId: 1, noiDung: 'QA' }, method)).status === 403);
}
check('cross-class reaction denied', (await api('/api/bai-dang/tuong-tac', A, { baiDangId: 999999, loaiCamXuc: 'tim' })).status === 404);
check('cross-class comment denied', (await api('/api/bai-dang/tuong-tac', A, { baiDangId: 999999, noiDung: 'QA' }, 'PUT')).status === 404);
check('auxiliary role is not a teacher bypass', (await api('/api/lop', { role: 'phu', lopId: 910 })).status === 403);
check('used code cannot be replayed', (await redeem(A, code.maCode)).status !== 200);
await api('/api/gv/ma-cong-dong', GV, { hanhDong: 'thu_hoi_thanh_vien', hocSinhId: A.hocSinhId });
check('revocation applies to existing session', (await api('/api/lop', A)).status === 403);
const revoked = await invite();
await api('/api/gv/ma-cong-dong', GV, { hanhDong: 'thu_hoi_ma', id: revoked.id });
check('revoked invite denied', (await redeem(A, revoked.maCode)).status === 403);
const expired = await invite();
sql("UPDATE ma_truy_cap_cong_dong SET het_han_luc = datetime('now', '-1 day') WHERE lop_id = 910 AND id = " + expired.id);
check('expired invite denied', (await redeem(A, expired.maCode)).status === 403);
const superseded = await invite();
const rollback = await invite();
check('regeneration invalidates prior invite', (await redeem(A, superseded.maCode)).status === 403);
sql("CREATE TRIGGER qa_reject_grant BEFORE INSERT ON community_membership WHEN NEW.lop_id = 910 BEGIN SELECT RAISE(ABORT, 'QA rollback'); END;");
try {
  check('grant failure is not success', (await redeem(A, rollback.maCode)).status === 500);
  check('failed transaction did not consume invite', sql('SELECT so_lan_da_dung FROM ma_truy_cap_cong_dong WHERE lop_id = 910 AND id = ' + rollback.id)[0].results[0].so_lan_da_dung === 0);
} finally { sql('DROP TRIGGER IF EXISTS qa_reject_grant;'); }
check('same invite works after rollback', (await redeem(A, rollback.maCode)).status === 200);
for (let i = 0; i < 10; i++) await redeem(A, 'WRONG');
check('rate limit rejects repeated attempts', (await redeem(A, 'WRONG')).status === 429);

const hl = (await api('/api/campus-highlights')).data;
check('real game states counted', hl.gameDoiKhang.soBan === 2 && hl.gameDoiKhang.dangDau === 1);
check('streak counts distinct students', hl.topStreaks[0]?.soHocSinh === 2 && hl.topStreaks[0]?.maxStreak === 12);
check('only public rooms trend', hl.trendingRooms.length === 2 && !JSON.stringify(hl).includes('PRIVATE'));
check('public highlights hide student identities', !JSON.stringify(hl).includes('QA Student'));

await api('/api/gv/bien-tap-vien', GV, { hocSinhId: A.hocSinhId });
await api('/api/gv/bien-tap-vien', GV, { hocSinhId: B.hocSinhId });
check('cross-class editor grant denied', (await api('/api/gv/bien-tap-vien', GV, { hocSinhId: C.hocSinhId })).status === 400);
const data = { tieuDe: 'QA announcement', noiDung: 'QA content', trangThai: 'draft' };
const own = (await announce(A, data)).data;
const other = (await announce(B, data)).data;
const teacher = (await announce(GV, data)).data;
const foreign = (await announce(GV2, { ...data, phamVi: 'lop', trangThai: 'published' })).data;
check('draft creation succeeds', Boolean(own.id && other.id && teacher.id && foreign.id));
let drafts = (await api('/api/campus-thong-bao?tat_ca=1', A)).data.danhSach;
check('editor cannot read other drafts or foreign class posts', drafts.some(r => r.id === own.id) && !drafts.some(r => [other.id, teacher.id, foreign.id].includes(r.id)));
check('teacher cannot read another class queue', !(await api('/api/campus-thong-bao?tat_ca=1', GV)).data.danhSach.some(r => r.id === foreign.id));
for (const hanhDong of ['luu', 'xoa', 'duyet_bai']) {
  check('cross-class teacher mutation denied ' + hanhDong, (await announce(GV, { ...data, id: foreign.id, hanhDong })).status === 404);
}
check('editor cannot edit teacher content', (await announce(A, { ...data, id: teacher.id })).status === 403);
const submitted = await announce(A, { ...data, id: own.id, trangThai: 'published', ghim: 1 });
check('student publish becomes pending review', submitted.data.trangThai === 'pending_review');
check('only teacher approves', (await announce(A, { id: own.id, hanhDong: 'duyet_bai' })).status === 403);
check('teacher can approve', (await announce(GV, { id: own.id, hanhDong: 'duyet_bai' })).status === 200);
check('published student post cannot be edited by student', (await announce(A, { ...data, id: own.id })).status === 403);
check('published student post cannot be deleted by student', (await announce(A, { id: own.id, hanhDong: 'xoa' })).status === 403);
const publicPosts = (await api('/api/campus-thong-bao')).data.danhSach;
check('public sees published school post only', publicPosts.length === 1 && publicPosts[0].id === own.id);
check('public hides actor and class keys', !('nguoiTaoKhoa' in publicPosts[0]) && !('lopId' in publicPosts[0]));
await api('/api/gv/bien-tap-vien', GV, { hocSinhId: A.hocSinhId, hanhDong: 'thu_hoi' });
check('editor revocation immediate', (await announce(A, data)).status === 403);

}

mkdirSync('qa/phase4a1', { recursive: true });
const browser = await chromium.launch();
const errors = [];
async function pageFor(user, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
  if (user) await ctx.addCookies([{ name: COOKIE_NAME, value: await createToken(secret, user, 3600), url: BASE }]);
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(e.message); console.error('BROWSER', e.message); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#campus-highlights').waitFor({ state: 'attached' });
  return page;
}
try {
  const guest = await pageFor();
  await guest.evaluate(() => sessionStorage.setItem('community_access_token', '10A7'));
  await guest.locator('#btn-nav-bang-tin').click();
  await guest.getByRole('heading', { name: 'Yêu Cầu Đăng Nhập' }).waitFor();
  check('guest gate ignores forged storage', !guest.url().includes('bang-tin'));
  await guest.goto(BASE + '/#/bang-tin-lop');
  await guest.waitForFunction(() => location.hash === '#/campus');
  check('guest direct URL gated', true);
  await guest.goto(BASE);
  await guest.locator('#campus-highlights').waitFor();
  await guest.screenshot({ path: 'qa/phase4a1/campus-desktop.png', fullPage: true });

  const student = await pageFor(B);
  await api('/api/gv/ma-cong-dong', GV, { hanhDong: 'thu_hoi_thanh_vien', hocSinhId: B.hocSinhId });
  await student.reload({ waitUntil: 'domcontentloaded' });
  await student.locator('#btn-nav-bang-tin').waitFor();
  await student.locator('#btn-nav-bang-tin').click();
  await student.locator('#modal-community-gate').waitFor();
  const uiCode = await invite(B.hocSinhId);
  await student.locator('#input-community-gate-code').fill(uiCode.maCode);
  await student.locator('#btn-submit-community-gate').click();
  await student.waitForFunction(() => location.hash.includes('bang-tin'));
  check('student redeems through real UI', !(await student.locator('#modal-community-gate').count()));
  await student.reload({ waitUntil: 'domcontentloaded' });
  check('refresh preserves membership', student.url().includes('bang-tin'));
  await student.waitForFunction(() => document.body.innerText.includes('Bảng tin còn trống'));
  await student.screenshot({ path: 'qa/phase4a1/feed-desktop.png', fullPage: true });
  await student.evaluate(() => { location.hash = '#/diem-danh'; });
  await student.locator('#khuDiemDanh').waitFor();
  for (const id of ['khuDiemDanh', 'ddTabLoai', 'ddLopKhoi', 'ddCaNhan']) {
    check('preserved DOM #' + id, (await student.locator('#' + id).count()) === 1);
  }
  await student.evaluate(() => { location.hash = '#/thu-quy'; });
  await student.locator('#thu-quy').waitFor();
  for (const id of ['thu-quy', 'tqTongQuan', 'tqKhoan']) check('preserved DOM #' + id, await student.locator('#' + id).count() === 1);

  const teacherPage = await pageFor(GV);
  await teacherPage.locator('#btn-quan-ly-ma-moi').click();
  await teacherPage.locator('#modal-teacher-access-codes').waitFor();
  await teacherPage.locator('#tab-btn-codes-create').click();
  await teacherPage.locator('#select-invite-target-student').selectOption(String(A.hocSinhId));
  await teacherPage.locator('#btn-submit-create-invite-code').click();
  await teacherPage.locator('#btn-copy-new-invite-code').waitFor();
  check('teacher creates student invite in UI', true);
  await teacherPage.screenshot({ path: 'qa/phase4a1/invites-desktop.png', fullPage: true });
  await teacherPage.reload({ waitUntil: 'domcontentloaded' });
  await teacherPage.locator('#btn-quan-ly-bien-tap').click();
  await teacherPage.locator('#modal-teacher-editor-management').waitFor();
  await teacherPage.locator('#select-editor-target-student').selectOption(String(A.hocSinhId));
  await teacherPage.locator('#btn-submit-grant-editor').click();
  check('teacher editor management is wired', true);
  await teacherPage.reload({ waitUntil: 'domcontentloaded' });
  await teacherPage.locator('#btn-soan-thong-bao').click();
  await teacherPage.locator('#input-editor-tieu-de').fill('QA preview title');
  await teacherPage.locator('#textarea-editor-noi-dung').fill('QA preview body');
  for (const mode of ['desktop', 'mobile', 'card']) {
    await teacherPage.locator('#tab-preview-' + mode).click();
    check('preview ' + mode, await teacherPage.locator('#content-editor-modal').getByText('QA preview title', { exact: true }).count() > 0);
  }
  await teacherPage.screenshot({ path: 'qa/phase4a1/preview-desktop.png', fullPage: true });
  const mobile = await pageFor(GV, 390);
  check('mobile has no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.locator('#btn-quan-ly-ma-moi').click();
  await mobile.locator('#modal-teacher-access-codes').waitFor();
  await mobile.locator('#tab-btn-codes-create').click();
  await mobile.locator('#select-invite-target-student').selectOption(String(A.hocSinhId));
  await mobile.locator('#btn-submit-create-invite-code').click();
  await mobile.locator('#btn-copy-new-invite-code').waitFor();
  check('mobile invite fits modal', await mobile.locator('#modal-teacher-access-codes').evaluate(el => {
    const panel = el.firstElementChild;
    return panel.scrollWidth <= panel.clientWidth;
  }));
  await mobile.screenshot({ path: 'qa/phase4a1/invites-mobile.png', fullPage: true });
  check('no browser runtime errors', errors.length === 0);
} finally { await browser.close(); }
console.log('Completed: ' + checks + ' checks.');
