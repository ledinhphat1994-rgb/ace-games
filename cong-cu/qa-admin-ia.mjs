// ==============================================================================
// cong-cu/qa-admin-ia.mjs
// BỘ KIỂM THỬ ADMIN INFORMATION ARCHITECTURE v1 (Phase 1 — Nền tảng):
// giao_vien_lop (GVCN kiêm nhiều lớp), nhat_ky_quan_tri (Audit Log), phạm vi quản trị.
// ==============================================================================
import { execSync } from 'child_process';
import { createToken, COOKIE_NAME } from '../functions/_lib/auth.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const devSessionSecret = process.env.SESSION_SECRET || 'khoa-ky-cookie-chi-de-chay-thu-tren-may-1234567890';

let pass = 0, fail = 0;
const resultsByGroup = { seed: { pass: 0, fail: 0 }, scope: { pass: 0, fail: 0 }, audit: { pass: 0, fail: 0 } };

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
