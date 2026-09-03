// Mã đăng nhập của lớp (học sinh) và của giáo viên chủ nhiệm — đổi/đặt tuỳ ý ngay trên web.
// Có hiệu lực NGAY LẬP TỨC, không cần vào Cloudflare dashboard hay deploy lại.
//   GET  /api/gv/ma-dang-nhap             -> trạng thái hiện tại (không lộ mã hiện có, chỉ báo đã tự đặt hay chưa)
//   POST /api/gv/ma-dang-nhap  { vaiTro: 'student'|'teacher', ma? }
//        Không truyền "ma" -> tự sinh mã ngẫu nhiên dễ đọc.
//        Có truyền "ma" -> dùng đúng mã đó (sau khi kiểm tra hợp lệ và không trùng).
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';

const CHU_CAI = 'ABCDEFGHJKMNPQRTUVWXY346789';   // bỏ ký tự dễ đọc nhầm: 0/O, 1/I/L, 5/S, 2/Z

function sinhMa(doDai = 8) {
  const byte = new Uint8Array(doDai);
  crypto.getRandomValues(byte);
  return [...byte].map((b) => CHU_CAI[b % CHU_CAI.length]).join('');
}

// KHÔNG ép chữ hoa ở đây — khác với mã cá nhân học sinh. Mã lớp/giáo viên là mã bí mật
// giáo viên tự chọn, có thể đã quen dùng chữ hoa/thường xen kẽ (vd "10A7-DinhQuan-...").
// So khớp lúc đăng nhập phân biệt hoa/thường, nên đổi hoa/thường ở đây sẽ vô tình đổi mã.
function chuanHoaMaTuyChinh(v) {
  return String(v || '').trim().replace(/\s+/g, '');
}

function maHopLe(ma) {
  return /^[A-Za-z0-9\-]{4,32}$/.test(ma);
}

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT vai_tro AS vaiTro, ma, cap_nhat_luc AS capNhatLuc FROM ma_dang_nhap').all();
  const daDat = Object.fromEntries(results.map((r) => [r.vaiTro, r]));

  const goi = (vaiTro, maMacDinh) => ({
    ma: daDat[vaiTro]?.ma || maMacDinh || '',
    daTuDat: Boolean(daDat[vaiTro]),
    capNhatLuc: daDat[vaiTro]?.capNhatLuc || null,
  });

  return json({ ok: true, student: goi('student', env.CLASS_CODE), teacher: goi('teacher', env.TEACHER_CODE) });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { vaiTro, ma } = await docThan(request);
  if (!['student', 'teacher'].includes(vaiTro)) return loi('Vai trò không hợp lệ.');

  let maMoi;
  if (ma) {
    maMoi = chuanHoaMaTuyChinh(ma);
    if (!maHopLe(maMoi)) {
      return loi('Mã chỉ gồm chữ in hoa, số, dấu gạch ngang, dài 4–32 ký tự.');
    }
  } else {
    maMoi = sinhMa();
  }

  // Kiểm tra không trùng với mã còn lại (mã kia trong D1, hoặc mã tài khoản đặc biệt đang hoạt động).
  const maKiaRow = await env.DB.prepare(
    'SELECT ma FROM ma_dang_nhap WHERE vai_tro = ?1'
  ).bind(vaiTro === 'student' ? 'teacher' : 'student').first();
  if (maKiaRow && maKiaRow.ma === maMoi) {
    return loi('Mã này đang được dùng cho vai trò kia rồi, chọn mã khác.');
  }
  const trungPhu = await env.DB.prepare('SELECT id FROM tai_khoan_phu WHERE ma = ?1').bind(maMoi).first();
  if (trungPhu) return loi('Mã này trùng với một tài khoản đặc biệt đang hoạt động, chọn mã khác.');

  await env.DB.prepare(
    `INSERT INTO ma_dang_nhap (vai_tro, ma, cap_nhat_luc) VALUES (?1, ?2, datetime('now'))
     ON CONFLICT(vai_tro) DO UPDATE SET ma = excluded.ma, cap_nhat_luc = datetime('now')`
  ).bind(vaiTro, maMoi).run();

  return json({ ok: true, ma: maMoi });
}, { canGiaoVien: true });
