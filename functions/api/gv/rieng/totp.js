// Xác thực 2 lớp (TOTP — mã 6 số kiểu Google Authenticator) cho CHÍNH bước đăng nhập bằng mã
// giáo viên — sau khi bật, đăng nhập giáo viên cần ĐÚNG mã đăng nhập VÀ đúng mã 6 số mới vào
// được (xem functions/api/login.js). Chỉ áp dụng cho vai trò giáo viên, không áp dụng cho tài
// khoản được cấp quyền — để không bắt học sinh cài thêm app Authenticator.
//   GET    /api/gv/rieng/totp                          -> đã bật chưa, đang thiết lập dở không
//   POST   /api/gv/rieng/totp { hanhDong: 'batDau' }    -> sinh khoá mới (CHƯA bật ngay), trả về
//                                                           mã thiết lập dạng chữ để gõ vào app
//   POST   /api/gv/rieng/totp { hanhDong: 'xacNhan', ma } -> xác nhận đúng 1 mã 6 số sinh từ app
//                                                            rồi mới THẬT SỰ bật (tránh gõ sai
//                                                            khoá vào app rồi tự khoá mình ra)
//   DELETE /api/gv/rieng/totp { ma }                    -> tắt đi — bắt buộc nhập đúng mã 6 số
//                                                           hiện tại, để một phiên bị đánh cắp
//                                                           (không phải chính giáo viên) không
//                                                           tự tắt được lớp bảo vệ này
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { totpSinhKhoa, totpDinhDangKhoa, totpKiemTra } from '../../../_lib/totp.js';

async function layDong(env, lopId) {
  return env.DB.prepare(
    'SELECT totp_secret AS totpSecret, totp_secret_cho AS totpSecretCho FROM ma_dang_nhap WHERE lop_id = ?1 AND vai_tro = ?2'
  ).bind(lopId, 'teacher').first();
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const dong = await layDong(env, phien.lopId);
  return json({
    ok: true,
    daBat: Boolean(dong?.totpSecret),
    dangThietLapDo: Boolean(dong?.totpSecretCho),
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { hanhDong, ma } = await docThan(request);
  const dong = await layDong(env, phien.lopId);
  // Chưa có dòng nào (lớp còn dùng mã mặc định từ biến môi trường, chưa từng tự đổi mã đăng
  // nhập lần nào) — bắt tự đặt mã đăng nhập trước, để "totp_secret" luôn gắn đúng vào một dòng
  // ma_dang_nhap có thật, không phải suy đoán mã từ biến môi trường.
  if (!dong) return loi('Hãy tự đặt mã đăng nhập giáo viên (mục "Mã đăng nhập" phía trên) ít nhất một lần trước khi bật xác thực 2 lớp.');

  if (hanhDong === 'batDau') {
    const khoaMoi = totpSinhKhoa();
    await env.DB.prepare('UPDATE ma_dang_nhap SET totp_secret_cho = ?1 WHERE lop_id = ?2 AND vai_tro = ?3')
      .bind(khoaMoi, phien.lopId, 'teacher').run();
    return json({ ok: true, khoa: totpDinhDangKhoa(khoaMoi) });
  }

  if (hanhDong === 'xacNhan') {
    if (!dong.totpSecretCho) return loi('Chưa bắt đầu thiết lập, bấm "Bật xác thực 2 lớp" trước.');
    if (!(await totpKiemTra(dong.totpSecretCho, ma))) {
      return loi('Mã 6 số không đúng hoặc đã hết hạn. Kiểm tra lại app Authenticator rồi thử mã mới nhất.');
    }
    await env.DB.prepare('UPDATE ma_dang_nhap SET totp_secret = totp_secret_cho, totp_secret_cho = NULL WHERE lop_id = ?1 AND vai_tro = ?2')
      .bind(phien.lopId, 'teacher').run();
    return json({ ok: true });
  }

  return loi('Hành động không hợp lệ.');
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const { ma } = await docThan(request);
  const dong = await layDong(env, phien.lopId);
  if (!dong?.totpSecret) return loi('Xác thực 2 lớp chưa bật.');
  if (!(await totpKiemTra(dong.totpSecret, ma))) {
    return loi('Mã 6 số không đúng — cần đúng mã hiện tại trên app Authenticator mới tắt được.');
  }
  await env.DB.prepare('UPDATE ma_dang_nhap SET totp_secret = NULL, totp_secret_cho = NULL WHERE lop_id = ?1 AND vai_tro = ?2')
    .bind(phien.lopId, 'teacher').run();
  return json({ ok: true });
}, { canGiaoVien: true });
