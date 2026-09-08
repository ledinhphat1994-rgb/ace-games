// TOTP (RFC 6238) — mã 6 số đổi mỗi 30 giây, giống Google Authenticator/Authy. Chỉ dùng cho
// bước đăng nhập THỨ HAI của giáo viên (sau khi đã nhập đúng mã đăng nhập) — xem
// functions/api/login.js. Không phụ thuộc thư viện ngoài, chỉ dùng Web Crypto có sẵn trên
// Cloudflare Workers.

const BANG_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BUOC_GIAY = 30;   // mỗi mã sống 30 giây, đúng chuẩn mọi app Authenticator
const SO_CHU_SO = 6;

/** Sinh một khoá bí mật ngẫu nhiên, mã hoá Base32 (dạng chữ để gõ tay vào app Authenticator). */
export function totpSinhKhoa() {
  const bytes = crypto.getRandomValues(new Uint8Array(20)); // 160 bit, đúng khuyến nghị RFC
  return base32Encode(bytes);
}

/** "JBSWY3DPEHPK3PXP" -> "JBSW Y3DP EHPK 3PXP" (dễ đọc/gõ tay hơn khi hiện cho giáo viên). */
export function totpDinhDangKhoa(khoaBase32) {
  return (khoaBase32.match(/.{1,4}/g) || []).join(' ');
}

function base32Encode(bytes) {
  let bit = 0, gia_tri = 0, ra = '';
  for (const b of bytes) {
    gia_tri = (gia_tri << 8) | b;
    bit += 8;
    while (bit >= 5) {
      ra += BANG_BASE32[(gia_tri >>> (bit - 5)) & 31];
      bit -= 5;
    }
  }
  if (bit > 0) ra += BANG_BASE32[(gia_tri << (5 - bit)) & 31];
  return ra;
}

function base32Decode(khoaBase32) {
  const sach = khoaBase32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bit = 0, gia_tri = 0;
  const out = [];
  for (const ky_tu of sach) {
    const idx = BANG_BASE32.indexOf(ky_tu);
    if (idx < 0) continue;
    gia_tri = (gia_tri << 5) | idx;
    bit += 5;
    if (bit >= 8) {
      out.push((gia_tri >>> (bit - 8)) & 0xff);
      bit -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hmacSha1(khoaBytes, thongDiepBytes) {
  const key = await crypto.subtle.importKey('raw', khoaBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const chu_ky = await crypto.subtle.sign('HMAC', key, thongDiepBytes);
  return new Uint8Array(chu_ky);
}

/** Sinh mã 6 số tại đúng bước thời gian "buoc" (mặc định: bây giờ). */
export async function totpTaoMa(khoaBase32, buoc = Math.floor(Date.now() / 1000 / BUOC_GIAY)) {
  const khoaBytes = base32Decode(khoaBase32);
  const dem = new ArrayBuffer(8);
  new DataView(dem).setBigUint64(0, BigInt(buoc), false);
  const bam = await hmacSha1(khoaBytes, new Uint8Array(dem));
  const offset = bam[bam.length - 1] & 0x0f;
  const soNguyen = ((bam[offset] & 0x7f) << 24) | ((bam[offset + 1] & 0xff) << 16) |
                   ((bam[offset + 2] & 0xff) << 8) | (bam[offset + 3] & 0xff);
  return String(soNguyen % 10 ** SO_CHU_SO).padStart(SO_CHU_SO, '0');
}

/** So khớp mã 6 số người dùng nhập — cho phép lệch ±1 bước (30 giây) vì đồng hồ điện thoại và
    máy chủ không bao giờ khớp tuyệt đối, chặt quá sẽ báo sai oan. */
export async function totpKiemTra(khoaBase32, maNhap) {
  const ma = String(maNhap || '').trim();
  if (!/^\d{6}$/.test(ma)) return false;
  const buocHienTai = Math.floor(Date.now() / 1000 / BUOC_GIAY);
  for (const lech of [0, -1, 1]) {
    if (await totpTaoMa(khoaBase32, buocHienTai + lech) === ma) return true;
  }
  return false;
}
