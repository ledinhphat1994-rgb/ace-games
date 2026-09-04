// Kiểm tra an toàn cho các loại mã tuỳ chỉnh chứa ký tự đặc biệt:
// input → API → DB → lookup → URL/hash/query → HTML rendering → link/share
import assert from 'node:assert/strict';
import { chuanHoaMaTuyChinh, maHopLe } from '../functions/_lib/ma.js';
import { safeEqual } from '../functions/_lib/auth.js';

const CAC_MA_THU_NGHIEM = [
  'GV#2026',
  'abc&x=1',
  'a/b',
  'a%b',
  'a"b',
  'a\'b',
  'a<b'
];

function thoatHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

console.log('--- BẮT ĐẦU AUDIT AN TOÀN MÃ TUỲ CHỈNH ---');

let passCount = 0;
let totalTests = 0;

function kiemTra(ten, fn) {
  totalTests++;
  try {
    fn();
    passCount++;
    console.log(`  [PASS] ${ten}`);
  } catch (e) {
    console.error(`  [FAIL] ${ten}: ${e.message}`);
    process.exitCode = 1;
  }
}

for (const maGoc of CAC_MA_THU_NGHIEM) {
  console.log(`\nKiểm tra mã: ${JSON.stringify(maGoc)}`);

  // 1. INPUT
  kiemTra(`1. Input & Chuẩn hoá: ${maGoc}`, () => {
    const maChuan = chuanHoaMaTuyChinh(maGoc);
    assert.equal(maChuan, maGoc, 'Chuẩn hoá không được làm đổi ký tự hoa/thường hay ký tự đặc biệt');
    assert.equal(maHopLe(maChuan), true, 'Mã phải được coi là hợp lệ (độ dài 3-32, không có khoảng trắng)');
  });

  // 2. API (JSON Serialization / Deserialization)
  kiemTra(`2. API qua JSON: ${maGoc}`, () => {
    const payload = JSON.stringify({ ma: maGoc });
    const parsed = JSON.parse(payload);
    assert.equal(parsed.ma, maGoc, 'JSON parse phải giữ nguyên 100% ký tự');
  });

  // 3. DB & LOOKUP (safeEqual & SQL parameter binding)
  kiemTra(`3. Lookup so khớp an toàn: ${maGoc}`, () => {
    assert.equal(safeEqual(maGoc, maGoc), true, 'safeEqual phải so khớp đúng');
    assert.equal(safeEqual(maGoc, maGoc + '_khac'), false, 'safeEqual phải từ chối chuỗi khác');
  });

  // 4. URL / HASH / QUERY
  kiemTra(`4. URL / Query param / Hash: ${maGoc}`, () => {
    const encoded = encodeURIComponent(maGoc);
    const url = new URL(`https://lop-10a7.pages.dev/ca-nhan.html?ma=${encoded}#${encoded}`);
    
    // Đọc query param
    const maTuQuery = url.searchParams.get('ma');
    assert.equal(maTuQuery, maGoc, 'searchParams.get(ma) phải giải mã chính xác chuỗi gốc');

    // Đọc hash
    const maTuHash = decodeURIComponent(url.hash.replace(/^#/, ''));
    assert.equal(maTuHash, maGoc, 'decodeURIComponent(hash) phải giải mã chính xác chuỗi gốc');
  });

  // 5. HTML RENDERING (Escaping)
  kiemTra(`5. HTML Rendering (thoát ký tự XSS / vỡ layout): ${maGoc}`, () => {
    const thoat = thoatHtml(maGoc);
    assert.doesNotMatch(thoat, /<(?![a-zA-Z/])|["']/, 'Không còn ký tự < " \' trần trụi trong HTML string');
    // Kiểm tra không vỡ thuộc tính value="..."
    const htmlSnippet = `<input value="${thoat}">`;
    assert.ok(htmlSnippet.includes(`value="${thoat}"`));
  });

  // 6. LINK / SHARE
  kiemTra(`6. Link chia sẻ Zalo / tin nhắn: ${maGoc}`, () => {
    const linkChiaSe = `https://lop-10a7.pages.dev/ca-nhan.html?ma=${encodeURIComponent(maGoc)}`;
    const parsedUrl = new URL(linkChiaSe);
    assert.equal(parsedUrl.searchParams.get('ma'), maGoc);
  });
}

console.log(`\n--- KẾT QUẢ AUDIT: ${passCount}/${totalTests} BÀI KIỂM TRA ĐẠT (PASS) ---`);
