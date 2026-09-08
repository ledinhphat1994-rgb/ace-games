// Mã đăng nhập của lớp (học sinh) và của giáo viên chủ nhiệm — đổi/đặt tuỳ ý ngay trên web.
// Có hiệu lực NGAY LẬP TỨC, không cần vào Cloudflare dashboard hay deploy lại.
//   GET  /api/gv/rieng/ma-dang-nhap             -> trạng thái hiện tại (không lộ mã hiện có, chỉ báo đã tự đặt hay chưa)
//   POST /api/gv/rieng/ma-dang-nhap  { vaiTro: 'student'|'teacher', ma? }
//        Không truyền "ma" -> tự sinh mã ngẫu nhiên dễ đọc.
//        Có truyền "ma" -> dùng đúng mã đó (chấp nhận chữ hoa/thường/số/ký tự đặc biệt, 3–32 ký tự).
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { sinhMa, chuanHoaMaTuyChinh, maHopLe, maDaTonTai } from '../../../_lib/ma.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare('SELECT vai_tro AS vaiTro, ma, cap_nhat_luc AS capNhatLuc FROM ma_dang_nhap WHERE lop_id = ?1').bind(phien.lopId).all();
  const daDat = Object.fromEntries(results.map((r) => [r.vaiTro, r]));

  // Biến môi trường CLASS_CODE/TEACHER_CODE chỉ còn ý nghĩa mặc định cho lớp gốc (lopId=1) —
  // lớp thêm sau này luôn phải có mã riêng đặt qua web, không có biến môi trường dự phòng.
  const goi = (vaiTro, maMacDinh) => ({
    ma: daDat[vaiTro]?.ma || (phien.lopId === 1 ? maMacDinh : '') || '',
    daTuDat: Boolean(daDat[vaiTro]),
    capNhatLuc: daDat[vaiTro]?.capNhatLuc || null,
  });

  return json({ ok: true, student: goi('student', env.CLASS_CODE), teacher: goi('teacher', env.TEACHER_CODE) });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { vaiTro, ma } = await docThan(request);
  if (!['student', 'teacher'].includes(vaiTro)) return loi('Vai trò không hợp lệ.');

  let maMoi;
  if (ma) {
    maMoi = chuanHoaMaTuyChinh(ma);
    if (!maHopLe(maMoi)) {
      return loi('Mã dài 3–32 ký tự, không chứa khoảng trắng (chấp nhận chữ hoa, chữ thường, số, ký tự đặc biệt).');
    }
  } else {
    maMoi = sinhMa(8);
  }

  if (await maDaTonTai(env.DB, maMoi, { vaiTroDangNhap: vaiTro })) {
    return loi('Mã này đã có người/vai trò khác dùng rồi, chọn mã khác.');
  }

  await env.DB.prepare(
    `INSERT INTO ma_dang_nhap (lop_id, vai_tro, ma, cap_nhat_luc) VALUES (?1, ?2, ?3, datetime('now'))
     ON CONFLICT(lop_id, vai_tro) DO UPDATE SET ma = excluded.ma, cap_nhat_luc = datetime('now')`
  ).bind(phien.lopId, vaiTro, maMoi).run();

  return json({ ok: true, ma: maMoi });
}, { canGiaoVien: true });
