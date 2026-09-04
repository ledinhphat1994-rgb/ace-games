// Dùng chung cho mọi loại "mã" trong hệ thống: mã lớp/giáo viên (ma_dang_nhap),
// mã cá nhân học sinh (ma_ca_nhan), mã tài khoản đặc biệt (tai_khoan_phu).

// Các mục có thể ẨN riêng theo từng mã cá nhân — mặc định XEM HẾT, giáo viên tích để ẨN BỚT.
export const CAC_MUC_CA_NHAN = ['quy', 'thong-bao', 'thoi-khoa-bieu', 'diem-danh', 'thong-ke'];

export function chuanHoaAnMuc(ds) {
  if (!Array.isArray(ds)) return '';
  return [...new Set(ds.filter((m) => CAC_MUC_CA_NHAN.includes(m)))].join(',');
}

// Bỏ các ký tự dễ đọc nhầm khi SINH NGẪU NHIÊN: 0/O, 1/I/L, 5/S, 2/Z.
const CHU_CAI = 'ABCDEFGHJKMNPQRTUVWXY346789';

export function sinhMa(doDai = 6) {
  const byte = new Uint8Array(doDai);
  crypto.getRandomValues(byte);
  return [...byte].map((b) => CHU_CAI[b % CHU_CAI.length]).join('');
}

// Mã TỰ CHỌN: giữ nguyên hoa/thường người dùng gõ — so khớp lúc đăng nhập phân biệt hoa/thường,
// nên ép hoa/thường ở đây sẽ vô tình đổi mã người dùng đã chọn. Chỉ bỏ khoảng trắng đầu/cuối.
export function chuanHoaMaTuyChinh(v) {
  return String(v || '').trim();
}

// Chấp nhận ĐẦY ĐỦ chữ hoa, chữ thường, chữ số và ký tự đặc biệt — chỉ chặn khoảng trắng
// bên trong (dễ gõ nhầm trên điện thoại, khó đọc lại) và giới hạn độ dài 3–32 ký tự.
export function maHopLe(ma) {
  return typeof ma === 'string' && ma.length >= 3 && ma.length <= 32 && !/\s/.test(ma);
}

// Kiểm tra một mã có đang trùng với BẤT KỲ mã nào khác trong toàn hệ thống không
// (mã lớp/giáo viên, mã tài khoản đặc biệt, mã cá nhân học sinh) — trừ chính bản ghi đang sửa.
//   boQua: { vaiTroDangNhap?, taiKhoanPhuId?, hocSinhId? } — bỏ qua bản ghi trùng với chính nó.
export async function maDaTonTai(db, ma, boQua = {}) {
  const [dangNhap, phu, caNhan] = await Promise.all([
    db.prepare('SELECT vai_tro AS vaiTro FROM ma_dang_nhap WHERE ma = ?1').bind(ma).first(),
    db.prepare('SELECT id FROM tai_khoan_phu WHERE ma = ?1').bind(ma).first(),
    db.prepare('SELECT hoc_sinh_id AS hocSinhId FROM ma_ca_nhan WHERE ma = ?1').bind(ma).first(),
  ]);
  if (dangNhap && dangNhap.vaiTro !== boQua.vaiTroDangNhap) return true;
  if (phu && phu.id !== boQua.taiKhoanPhuId) return true;
  if (caNhan && caNhan.hocSinhId !== boQua.hocSinhId) return true;
  return false;
}
