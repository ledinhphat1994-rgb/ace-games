// ==============================================================================
// cong-cu/qa-admin-ia.mjs
// BỘ KIỂM THỬ ADMIN INFORMATION ARCHITECTURE v1 (Phase 1 — Nền tảng):
// giao_vien_lop (GVCN kiêm nhiều lớp), nhat_ky_quan_tri (Audit Log), phạm vi quản trị.
// ==============================================================================
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = { seed: { pass: 0, fail: 0 }, scope: { pass: 0, fail: 0 }, audit: { pass: 0, fail: 0 }, users: { pass: 0, fail: 0 }, browser: { pass: 0, fail: 0 } };

function ok(ten, dk, group = 'scope', chiTiet = '') {
  if (dk) {
    pass++; resultsByGroup[group].pass++;
    console.log(`  ✅ [${group.toUpperCase()}] ${ten}`);
  } else {
    fail++; resultsByGroup[group].fail++;
    console.log(`  ❌ [${group.toUpperCase()}] ${ten} ${chiTiet}`);
  }
}

async function api(pathUrl, { method = 'GET', body = null, cookie = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${pathUrl}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function taoSessionCookie(payload) {
  const token = await createToken(devSessionSecret, payload, 3600);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}`;
}

async function run() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: ADMIN IA v1 — PHASE 1 NỀN TẢNG');
  console.log(`Target Server: ${BASE}`);
  console.log('================================================================\n');

  console.log('--- 0. SEEDING FIXTURES ---');
  try {
    execSync('npx wrangler d1 execute lop-10a7-db --local --file="cong-cu/seed-qa-phase4d1.sql"', { stdio: 'ignore' });
    execSync('npx wrangler d1 execute lop-10a7-db --local --file="cong-cu/seed-qa-admin-ia.sql"', { stdio: 'ignore' });
    ok('Nạp fixtures thành công (99820 Admin, 99821 GVCN kiêm 2 lớp, 99823 GVCN 1 lớp, 99825 chờ duyệt)', true, 'seed');
  } catch (e) {
    ok('Nạp fixtures thất bại', false, 'seed', e.message);
    process.exit(1);
  }

  const cookieAdmin = await taoSessionCookie({ accountId: 99820, role: 'teacher', lopId: 1, ten: 'Ban Giám Hiệu Admin', username: 'admin_truong_phase4d1', teacherPending: false });
  const cookieGvHaiLop = await taoSessionCookie({ accountId: 99821, role: 'teacher', lopId: 1, ten: 'Thầy Giáo Viên A', username: 'gv_class1_a', teacherPending: false });
  const cookieGvMotLop = await taoSessionCookie({ accountId: 99823, role: 'teacher', lopId: 2, ten: 'Thầy Giáo Viên C', username: 'gv_class2_c', teacherPending: false });
  // KHÔNG accountId, KHÔNG username — đúng y hệt phiên đăng nhập TRUYỀN THỐNG bằng mã giáo viên
  // riêng từng lớp (ma_dang_nhap / TEACHER_CODE) mà giáo viên chủ nhiệm thật đang dùng hằng ngày.
  const cookieTruyenThong = await taoSessionCookie({ role: 'teacher', lopId: 1, ten: 'Giáo Viên Đăng Nhập Truyền Thống' });

  // ---------- GROUP: PHIÊN ĐĂNG NHẬP TRUYỀN THỐNG (không có accountId) ----------
  // Bug nghiêm trọng đã phát hiện & sửa: layPhamViQuanTri() trước đây CHỈ nhận diện được tài khoản
  // Campus (có accountId) — phiên truyền thống (vẫn là cách đăng nhập chính, KHÔNG có accountId)
  // bị coi như "không có lớp nào" → Người dùng/Nhật ký/Tổng quan trống trơn với chính GVCN thật.
  console.log('\n--- 0.5 PHIÊN ĐĂNG NHẬP TRUYỀN THỐNG (không accountId) — chống hồi quy bug nghiêm trọng ---');
  const rTt1 = await api('/api/gv/lop-can-chu-y', { cookie: cookieTruyenThong });
  ok('Phiên truyền thống thấy ĐÚNG lớp của mình (không rỗng)',
    rTt1.status === 200 && (rTt1.data.danhSach || []).length === 1 && rTt1.data.danhSach[0].lopId === 1,
    'scope', JSON.stringify(rTt1.data));

  const rTt2 = await api('/api/gv/nguoi-dung', { cookie: cookieTruyenThong });
  ok('Phiên truyền thống xem được danh sách Người dùng của lớp mình (không rỗng)',
    rTt2.status === 200 && (rTt2.data.danhSach || []).length > 0, 'scope', `count=${(rTt2.data.danhSach || []).length}`);

  const rTt3 = await api('/api/whoami', { cookie: cookieTruyenThong });
  ok('Phiên truyền thống KHÔNG bị mặc định cấp quyền School Admin (an toàn)',
    rTt3.data.isSchoolAdmin === false, 'scope');

  // ---------- GROUP: PHẠM VI QUẢN TRỊ (/api/gv/lop-can-chu-y) ----------
  console.log('\n--- 1. PHẠM VI QUẢN TRỊ (giao_vien_lop) ---');

  const rAdmin = await api('/api/gv/lop-can-chu-y', { cookie: cookieAdmin });
  const lopIdsAdmin = (rAdmin.data.danhSach || []).map((l) => l.lopId).sort();
  ok('School Admin thấy TẤT CẢ lớp đang hoạt động (>= 2 lớp: 10A7 & 11A1)',
    rAdmin.status === 200 && lopIdsAdmin.includes(1) && lopIdsAdmin.includes(2),
    'scope', JSON.stringify(lopIdsAdmin));

  const rGv2 = await api('/api/gv/lop-can-chu-y', { cookie: cookieGvHaiLop });
  const lopIdsGv2 = (rGv2.data.danhSach || []).map((l) => l.lopId).sort();
  ok('GVCN kiêm nhiệm 2 lớp (99821) thấy ĐÚNG 2 lớp mình phụ trách [1,2], không thấy lớp khác',
    rGv2.status === 200 && JSON.stringify(lopIdsGv2) === JSON.stringify([1, 2]),
    'scope', JSON.stringify(lopIdsGv2));

  const rGv1 = await api('/api/gv/lop-can-chu-y', { cookie: cookieGvMotLop });
  const lopIdsGv1 = (rGv1.data.danhSach || []).map((l) => l.lopId).sort();
  ok('GVCN chỉ 1 lớp (99823, chưa có dòng giao_vien_lop) vẫn thấy đúng lớp qua fallback tai_khoan_campus.lop_id',
    rGv1.status === 200 && JSON.stringify(lopIdsGv1) === JSON.stringify([2]),
    'scope', JSON.stringify(lopIdsGv1));

  const rGv2Filtered = await api('/api/gv/lop-can-chu-y?lopId=1', { cookie: cookieAdmin });
  const lopIdsFiltered = (rGv2Filtered.data.danhSach || []).map((l) => l.lopId);
  ok('School Admin lọc theo ?lopId=1 chỉ nhận đúng lớp đó (không lộ lớp khác)',
    rGv2Filtered.status === 200 && JSON.stringify(lopIdsFiltered) === JSON.stringify([1]),
    'scope', JSON.stringify(lopIdsFiltered));

  // ---------- GROUP: AUDIT LOG (/api/gv/nhat-ky-quan-tri) ----------
  console.log('\n--- 2. AUDIT LOG (nhat_ky_quan_tri) ---');

  const rDuyet = await api('/api/gv/duyet-giao-vien', {
    method: 'POST', cookie: cookieAdmin, body: { accountId: 99825, action: 'approve' },
  });
  ok('School Admin duyệt hồ sơ giáo viên chờ (99825) thành công (200)', rDuyet.status === 200 && rDuyet.data.ok === true, 'audit', JSON.stringify(rDuyet.data));

  const rLogAdmin = await api('/api/gv/nhat-ky-quan-tri?limit=5', { cookie: cookieAdmin });
  const hasDuyetEntry = (rLogAdmin.data.danhSach || []).some((n) => n.hanhDong === 'duyet_giao_vien' && String(n.doiTuongId) === '99825');
  ok('Hành động duyệt giáo viên được ghi vào Audit Log, School Admin đọc được', rLogAdmin.status === 200 && hasDuyetEntry, 'audit', JSON.stringify(rLogAdmin.data.danhSach));

  const entryLopId = (rLogAdmin.data.danhSach || []).find((n) => n.hanhDong === 'duyet_giao_vien')?.lopId;
  ok('Dòng nhật ký gắn đúng lop_id của người thực hiện hành động (Admin, lopId=1)', entryLopId === 1, 'audit', `lopId ghi nhận: ${entryLopId}`);

  const rLogGv2 = await api('/api/gv/nhat-ky-quan-tri?limit=5', { cookie: cookieGvHaiLop });
  const gv2SeesIt = (rLogGv2.data.danhSach || []).some((n) => n.hanhDong === 'duyet_giao_vien' && String(n.doiTuongId) === '99825');
  ok('GVCN có quyền trên lớp 1 (99821, kiêm 2 lớp) CŨNG thấy đúng dòng nhật ký đó', gv2SeesIt, 'audit');

  const rLogGv1 = await api('/api/gv/nhat-ky-quan-tri?limit=5', { cookie: cookieGvMotLop });
  const gv1SeesIt = (rLogGv1.data.danhSach || []).some((n) => n.hanhDong === 'duyet_giao_vien' && String(n.doiTuongId) === '99825');
  ok('GVCN CHỈ có quyền trên lớp 2 (99823) KHÔNG thấy dòng nhật ký của lớp 1 — ranh giới riêng tư đúng', !gv1SeesIt, 'audit');

  // ---------- GROUP: NGƯỜI DÙNG (/api/gv/nguoi-dung) ----------
  console.log('\n--- 3. NGƯỜI DÙNG (gộp hoc_sinh + tai_khoan_campus) ---');

  const rListAdmin = await api('/api/gv/nguoi-dung', { cookie: cookieAdmin });
  const loaiAdmin = new Set((rListAdmin.data.danhSach || []).map((n) => n.loai));
  ok('School Admin thấy đủ các loại người dùng (giáo viên, tài khoản Campus tự do...)',
    rListAdmin.status === 200 && loaiAdmin.has('giao-vien') && loaiAdmin.has('tai-khoan-campus'),
    'users', JSON.stringify([...loaiAdmin]));

  const rListGv1 = await api('/api/gv/nguoi-dung', { cookie: cookieGvMotLop });
  const coTaiKhoanTuDo = (rListGv1.data.danhSach || []).some((n) => n.loai === 'tai-khoan-campus');
  ok('GVCN (không phải School Admin) KHÔNG thấy tài khoản Campus tự do (chưa liên kết lớp nào)',
    rListGv1.status === 200 && !coTaiKhoanTuDo, 'users');

  const rLoc = await api('/api/gv/nguoi-dung?loai=giao-vien', { cookie: cookieAdmin });
  const chiGiaoVien = (rLoc.data.danhSach || []).every((n) => n.loai === 'giao-vien');
  ok('Lọc ?loai=giao-vien chỉ trả về giáo viên', rLoc.status === 200 && chiGiaoVien && rLoc.data.danhSach.length > 0, 'users');

  const rTim = await api('/api/gv/nguoi-dung?q=' + encodeURIComponent('Giáo Viên A'), { cookie: cookieAdmin });
  const timDung = (rTim.data.danhSach || []).some((n) => n.ten.includes('Giáo Viên A'));
  ok('Tìm kiếm theo tên trả đúng kết quả', rTim.status === 200 && timDung, 'users', JSON.stringify(rTim.data.danhSach?.map((n) => n.ten)));

  const rChiTiet = await api('/api/gv/nguoi-dung?id=tk:99823', { cookie: cookieAdmin });
  ok('Xem chi tiết 1 tài khoản (tk:99823) trả đủ thông tin', rChiTiet.status === 200 && rChiTiet.data.chiTiet?.ten === 'Thầy Giáo Viên C (Lớp 2)', 'users', JSON.stringify(rChiTiet.data));

  const rKhoaAdmin = await api('/api/gv/nguoi-dung', { method: 'POST', cookie: cookieAdmin, body: { id: 'tk:99820', hanhDong: 'khoa' } });
  ok('KHÔNG thể khoá tài khoản School Admin (403)', rKhoaAdmin.status === 403, 'users', JSON.stringify(rKhoaAdmin.data));

  const rKhoa = await api('/api/gv/nguoi-dung', { method: 'POST', cookie: cookieAdmin, body: { id: 'tk:99823', hanhDong: 'khoa' } });
  ok('School Admin khoá tài khoản GVCN 99823 thành công', rKhoa.status === 200 && rKhoa.data.ok === true, 'users', JSON.stringify(rKhoa.data));

  const rChiTietSauKhoa = await api('/api/gv/nguoi-dung?id=tk:99823', { cookie: cookieAdmin });
  ok('Sau khi khoá, trạng thái tài khoản chuyển thành "bi-khoa"', rChiTietSauKhoa.data.chiTiet?.trangThai === 'bi-khoa', 'users');

  const rLogKhoa = await api('/api/gv/nhat-ky-quan-tri?limit=5', { cookie: cookieAdmin });
  const coGhiKhoa = (rLogKhoa.data.danhSach || []).some((n) => n.hanhDong === 'khoa_tai_khoan' && String(n.doiTuongId) === '99823');
  ok('Hành động khoá tài khoản được ghi vào Audit Log', coGhiKhoa, 'users');

  const rMoKhoa = await api('/api/gv/nguoi-dung', { method: 'POST', cookie: cookieAdmin, body: { id: 'tk:99823', hanhDong: 'mo_khoa' } });
  ok('Mở khoá lại tài khoản 99823 thành công (dọn trạng thái test)', rMoKhoa.status === 200 && rMoKhoa.data.ok === true, 'users');

  // ---------- GROUP: TRÌNH DUYỆT THẬT (Playwright) — trang Người dùng ----------
  console.log('\n--- 4. TRÌNH DUYỆT THẬT: TRANG NGƯỜI DÙNG ---');
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([
      { name: COOKIE_NAME, value: cookieAdmin.split('=')[1], domain: '127.0.0.1', path: '/' },
      { name: COOKIE_NAME, value: cookieAdmin.split('=')[1], domain: 'localhost', path: '/' },
    ]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/giao-vien/#/nguoi-dung`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const navNguoiDung = page.locator('#navNguoiDung');
    const coMucNav = (await navNguoiDung.count()) > 0;
    const dangActive = coMucNav && (await navNguoiDung.getAttribute('aria-current')) === 'page';
    ok('Mục "Người dùng" xuất hiện ở sidebar và đang được đánh dấu active', coMucNav && dangActive, 'browser');

    const bang = page.locator('.bang-qt');
    ok('Bảng danh sách người dùng render được (.bang-qt)', (await bang.count()) > 0, 'browser');

    const soDong = await page.locator('.bang-qt tbody tr').count();
    ok(`Bảng có ít nhất 1 dòng dữ liệu thật (đang có ${soDong} dòng)`, soDong > 0, 'browser');

    // Lọc theo "Giáo viên"
    await page.locator('button:has-text("Giáo viên")').first().click();
    await page.waitForTimeout(600);
    const dongSauLoc = await page.locator('.bang-qt tbody tr').count();
    const chuaLocGiaoVien = await page.locator('.bang-qt tbody').innerText();
    ok('Lọc "Giáo viên" thu hẹp danh sách và không còn dòng "Tài khoản Campus"',
      dongSauLoc > 0 && !chuaLocGiaoVien.includes('Tài khoản Campus'), 'browser');

    // Mở drawer chi tiết bằng cách click 1 dòng
    await page.locator('.bang-qt tbody tr').first().click();
    await page.waitForTimeout(500);
    const drawer = page.locator('.drawer-qt');
    ok('Click 1 dòng mở được drawer chi tiết (.drawer-qt)', (await drawer.count()) > 0, 'browser');

    await page.screenshot({ path: 'docs/qa-phase4g/admin-nguoi-dung.png' }).catch(() => {});

    // Thanh tab dưới di động — vừa tăng từ 6 lên 7 mục, kiểm tra không bị vỡ layout
    const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctxMobile.addCookies([
      { name: COOKIE_NAME, value: cookieAdmin.split('=')[1], domain: '127.0.0.1', path: '/' },
      { name: COOKIE_NAME, value: cookieAdmin.split('=')[1], domain: 'localhost', path: '/' },
    ]);
    const pageMobile = await ctxMobile.newPage();
    await pageMobile.goto(`${BASE}/giao-vien/#/tong-quan`, { waitUntil: 'domcontentloaded' });
    await pageMobile.waitForTimeout(1000);
    const tabDuoi = pageMobile.locator('#tabDuoi a');
    const soTab = await tabDuoi.count();
    const rongTab = (await pageMobile.locator('#tabDuoi').boundingBox())?.width || 0;
    ok(`Thanh tab dưới di động có đủ 7 mục, không tràn màn hình (rộng ${rongTab.toFixed(0)}px / viewport 390px)`,
      soTab === 7 && rongTab <= 390, 'browser', `soTab=${soTab}`);
    await pageMobile.screenshot({ path: 'docs/qa-phase4g/admin-mobile-tab-duoi.png' }).catch(() => {});
    await ctxMobile.close();
  } catch (err) {
    ok('Kiểm thử trình duyệt thật cho trang Người dùng', false, 'browser', err.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n================================================================');
  console.log(`🏁 HOÀN TẤT ADMIN IA v1 QA SUITE: ${pass} PASS, ${fail} FAIL`);
  console.log('Chi tiết theo nhóm:');
  for (const [g, r] of Object.entries(resultsByGroup)) console.log(`  - [${g.toUpperCase()}]: ${r.pass} Pass, ${r.fail} Fail`);
  console.log('================================================================');
  if (fail > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
