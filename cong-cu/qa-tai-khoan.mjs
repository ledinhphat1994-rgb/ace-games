// Tích hợp D1 local + HTTP thật + trình duyệt. Không gửi dữ liệu thử nghiệm lên production.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';
import { bamMatKhau, taoSalt } from '../functions/_lib/passwords.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname), 'QA chỉ được chạy trên localhost');
const OUT = 'qa/account-reset'; fs.mkdirSync(OUT, { recursive: true });
const vars = Object.fromEntries(fs.readFileSync('.dev.vars', 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')];
}));
const secret = vars.SESSION_SECRET;
assert(secret, 'Cần SESSION_SECRET local');
const quote = x => "'" + String(x).replaceAll("'", "''") + "'";
function db(sql) {
  fs.writeFileSync(`${OUT}/query.sql`, sql);
  const out = execSync(`npx wrangler d1 execute lop-10a7-db --local --file=${OUT}/query.sql --json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  return JSON.parse(out.slice(out.indexOf('[')));
}
let passed = 0;
function ok(name, condition) { assert(condition, name); passed++; console.log(`PASS ${name}`); }
async function call(path, cookie = '', body) {
  const res = await fetch(BASE + path, { method: body ? 'POST' : 'GET', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  return { status: res.status, data: await res.json().catch(() => ({})), cookie: res.headers.get('set-cookie')?.split(';')[0] };
}
async function cookie(id, role, lopId, extra = {}) {
  return COOKIE_NAME + '=' + encodeURIComponent(await createToken(secret, { accountId: id, role, lopId, ...extra }, 3600));
}

// Tài khoản kiểm thử dùng id và tên riêng trên D1 local.
const password = randomBytes(20).toString('hex'), salt = taoSalt(), hash = await bamMatKhau(password, salt);
const fixtures = [
  [99980, 'qa_accounts_admin', 'Quản trị viên kiểm thử', 'teacher', 1, 0, 1],
  [99981, 'qa_accounts_student', 'Học sinh kiểm thử', 'student', 1, 0, 0],
  [99982, 'qa_accounts_other', 'Tài khoản lớp khác', 'student', 2, 0, 0],
  [99983, 'qa_accounts_teacher', 'Giáo viên lớp 1', 'teacher', 1, 0, 0],
  [99984, 'qa_accounts_pending', 'Giáo viên chờ duyệt', 'student', null, 1, 0],
  [99985, 'qa_accounts_free', '<img src=x onerror=alert(1)>', 'external', null, 0, 0],
];
db(fixtures.map(([id, username, name, role, lop, pending, admin]) => `INSERT INTO tai_khoan_campus
  (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro, lop_id, teacher_pending, la_admin_truong)
  VALUES (${id}, ${quote(username)}, ${quote(name)}, ${quote(hash)}, ${quote(salt)}, ${quote(role)}, ${lop ?? 'NULL'}, ${pending}, ${admin})
  ON CONFLICT(id) DO UPDATE SET ten_dang_nhap=excluded.ten_dang_nhap, ten_hien_thi=excluded.ten_hien_thi,
    mat_khau_hash=excluded.mat_khau_hash, salt=excluded.salt, vai_tro=excluded.vai_tro, lop_id=excluded.lop_id,
    teacher_pending=excluded.teacher_pending, la_admin_truong=excluded.la_admin_truong, dang_hoat_dong=1, thiet_bi=NULL, hoc_sinh_id=NULL;`).join('\n'));
const admin = await cookie(99980, 'teacher', 1), student = await cookie(99981, 'student', 1);
const teacher = await cookie(99983, 'teacher', 1), pending = await cookie(99984, 'teacher', 1, { teacherPending: false });
let browser;
try {
  ok('Khách không đọc được tài khoản', (await call('/api/gv/nguoi-dung')).status === 401);
  ok('Học sinh không có quyền quản trị', (await call('/api/gv/nguoi-dung', student)).status === 403);
  ok('Cookie teacher cũ không vượt qua vai trò đang chờ duyệt trong DB', (await call('/api/gv/nguoi-dung', pending)).status === 403);
  const all = await call('/api/gv/nguoi-dung', admin);
  ok('Admin thấy tài khoản tự do và tài khoản khác lớp', all.status === 200 && all.data.danhSach.some(x => x.id === 'tk:99985') && all.data.danhSach.some(x => x.id === 'tk:99982'));
  ok('Danh sách chỉ chứa tài khoản đã đăng ký', all.data.danhSach.every(x => x.id.startsWith('tk:')));
  ok('Không trả mật khẩu, hash, salt hoặc thiết bị', !/mat_khau|salt|thiet_bi|iterations/.test(JSON.stringify(all.data)));
  const scoped = await call('/api/gv/nguoi-dung', teacher);
  ok('GVCN không thấy tài khoản lớp khác / tự do', scoped.status === 200 && !scoped.data.danhSach.some(x => ['tk:99982', 'tk:99985'].includes(x.id)));
  ok('GVCN thấy hồ sơ chờ duyệt', scoped.data.danhSach.some(x => x.id === 'tk:99984'));
  ok('Tham số lopId không mở rộng quyền GVCN', (await call('/api/gv/nguoi-dung?lopId=2', teacher)).data.tong === 0);
  ok('Chi tiết khác lớp bị chặn', (await call('/api/gv/nguoi-dung?id=tk:99982', teacher)).status === 404);
  ok('Id học sinh cũ bị từ chối', (await call('/api/gv/nguoi-dung?id=hs:1', admin)).status === 400);
  ok('Id có hậu tố không bị parseInt chấp nhận', (await call('/api/gv/nguoi-dung?id=tk:99981oops', admin)).status === 400);
  ok('Tìm tên đăng nhập', (await call('/api/gv/nguoi-dung?q=qa_accounts_free', admin)).data.tong === 1);
  ok('Bộ lọc chờ duyệt', (await call('/api/gv/nguoi-dung?loai=cho-xac-minh', admin)).data.danhSach.every(x => x.teacherPending));
  const act = (id, hanhDong, c = admin) => call('/api/gv/nguoi-dung', c, { id, hanhDong });
  ok('Không khóa admin', (await act('tk:99980', 'khoa')).status === 403);
  ok('GVCN không tự khóa mình', (await act('tk:99983', 'khoa', teacher)).status === 403);
  ok('GVCN không khóa người khác lớp', (await act('tk:99982', 'khoa', teacher)).status === 404);
  ok('Admin khóa tài khoản giáo viên', (await act('tk:99983', 'khoa')).status === 200);
  ok('Phiên đã cấp của tài khoản bị khóa mất hiệu lực', (await call('/api/whoami', teacher)).status === 401);
  ok('Mở khóa giáo viên', (await act('tk:99983', 'mo_khoa')).status === 200);
  ok('Phê duyệt tài khoản đang chờ', (await act('tk:99984', 'duyet')).status === 200);
  ok('Không duyệt lại người đã được duyệt', (await act('tk:99984', 'duyet')).status === 403);
  ok('Không biến tài khoản thường thành giáo viên qua endpoint duyệt', (await call('/api/gv/duyet-giao-vien', admin, { accountId: 99981, action: 'approve' })).status === 403);
  const login = await call('/api/login', '', { username: 'qa_accounts_admin', password });
  ok('Đăng nhập bằng mật khẩu thật sau reset', login.status === 200 && Boolean(login.cookie));
  const stale = await cookie(99981, 'student', 1, { hocSinhId: 12345 });
  ok('Cookie cũ không phục hồi liên kết học sinh đã xóa', (await call('/api/whoami', stale)).data.hocSinhId === null);
  ok('Tài khoản đã xóa không tiếp tục dùng phiên cũ', (await call('/api/whoami', await cookie(99999, 'teacher', 1))).status === 401);
  const oldStudent = COOKIE_NAME + '=' + encodeURIComponent(await createToken(secret, { role: 'student', hocSinhId: 98765, lopId: 1 }, 3600));
  ok('Mã cá nhân đã xóa mất hiệu lực', (await call('/api/whoami', oldStudent)).status === 401);
  for (const path of ['/api/campus', '/api/su-kien', '/api/campus-thong-bao', '/api/campus-highlights']) ok('Campus empty-state ' + path, (await call(path)).status === 200);
  ok('Bảng tin lớp trống vẫn trả 200', (await call('/api/lop', login.cookie)).status === 200);
  for (const path of ['/api/gv/diem-danh', '/api/gv/quy', '/api/gv/rieng/hoc-sinh', '/api/gv/rieng/reset-du-lieu']) {
    const response = await call(path, login.cookie, {});
    ok('API cũ không còn ghi dữ liệu ' + path, response.status >= 400);
  }
  for (const path of ['/api/campus-thong-bao', '/api/campus-highlights', '/api/su-kien']) ok('Không còn quản trị nội dung ' + path, (await call(path, login.cookie, {})).status >= 400);

  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const value = decodeURIComponent(login.cookie.slice(login.cookie.indexOf('=') + 1));
  await ctx.addCookies([{ name: COOKIE_NAME, value, url: BASE }]);
  const page = await ctx.newPage(), errors = [], failed = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', res => { if (res.url().startsWith(BASE) && res.status() >= 500) failed.push(res.url()); });
  await page.goto(BASE + '/giao-vien/#/quy');
  await page.getByRole('heading', { name: 'Danh sách tài khoản', exact: true }).waitFor();
  await page.locator('.tk-table tbody tr').first().waitFor();
  ok('Tuyến cũ về đúng trang tài khoản duy nhất', new URL(page.url()).hash === '#/nguoi-dung');
  ok('Không còn sidebar/menu chức năng cũ', await page.locator('#moMenu, .cot-trai, .tab-duoi').count() === 0);
  await page.locator('#ndTim').fill('qa_accounts_');
  await page.waitForFunction(() => document.querySelectorAll('.tk-table tbody tr').length === 6);
  await page.screenshot({ path: OUT + '/accounts-1440.png' });
  await page.locator('#ndTim').fill('qa_accounts_free');
  await page.getByText('@qa_accounts_free', { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.tk-table tbody tr').length === 1);
  ok('Tên người dùng được hiển thị bằng text', await page.locator('.tk-table img').count() === 0);
  await page.getByRole('button', { name: 'Chi tiết tài khoản qa_accounts_free', exact: true }).click();
  await page.locator('dialog[open]').waitFor();
  ok('Drawer hiển thị tên đăng nhập', await page.locator('dialog').getByText('qa_accounts_free', { exact: true }).count() === 1);
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Khóa tài khoản', exact: true }).click();
  await page.locator('dialog').waitFor({ state: 'detached' });
  await page.locator('.tk-status.bi-khoa').waitFor();
  ok('Khóa tài khoản qua giao diện thật', true);
  await page.getByRole('button', { name: 'Chi tiết tài khoản qa_accounts_free', exact: true }).click();
  await page.getByRole('button', { name: 'Mở khóa tài khoản', exact: true }).click();
  await page.locator('dialog').waitFor({ state: 'detached' });
  await page.locator('.tk-status.binh-thuong').waitFor();
  ok('Mở khóa qua giao diện thật', true);
  await page.locator('#ndTim').fill('khong-co-tai-khoan-nay');
  await page.getByText('Không có tài khoản phù hợp.', { exact: false }).waitFor();
  ok('Tìm kiếm rỗng có thông báo', true);
  await page.locator('#ndTim').fill('qa_accounts_');
  await page.locator('.tk-table tbody tr').first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: OUT + '/accounts-390.png' });
  ok('Mobile không tràn ngang toàn trang', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  ok('Mobile không cần cuộn ngang bảng để mở chi tiết', await page.locator('.tk-table-wrap').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [path, name] of [['/', 'campus-1440'], ['/#/bang-tin-lop', 'feed-1440']]) {
    await page.goto(BASE + path); await page.waitForTimeout(2500);
    await page.screenshot({ path: OUT + '/' + name + '.png', fullPage: true });
    ok('Trang công khai render ' + name, await page.locator('#root').textContent().then(t => t.length > 100));
  }
  ok('Không có lỗi JavaScript', errors.length === 0);
  ok('Không có response 5xx', failed.length === 0);
  fs.writeFileSync(OUT + '/qa-results.json', JSON.stringify({ passed, errors, failed }, null, 2));
  console.log('QA tài khoản: ' + passed + ' PASS');
} finally {
  if (browser) await browser.close();
  // Chỉ xóa đúng fixtures QA, không đụng tài khoản người dùng khác.
  db("DELETE FROM nhat_ky_quan_tri WHERE tac_nhan_id BETWEEN 99980 AND 99985; DELETE FROM tai_khoan_campus WHERE id BETWEEN 99980 AND 99985 AND ten_dang_nhap LIKE 'qa_accounts_%';");
}
