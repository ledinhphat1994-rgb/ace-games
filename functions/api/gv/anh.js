// Ảnh hoạt động của lớp.
//   GET    /api/gv/anh          -> danh sách ảnh ĐANG HIỂN THỊ (kèm dung lượng đã dùng)
//   GET    /api/gv/anh?rac=1    -> danh sách ảnh trong THÙNG RÁC (CHỈ giáo viên — tự dọn mục quá hạn)
//   POST   /api/gv/anh          { tenTep, kieu, duLieu (base64), chuThich, ngay }
//   PATCH  /api/gv/anh          { id, chuThich }
//   PATCH  /api/gv/anh          { id, khoiPhuc: true }   -> khôi phục khỏi thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/anh?id=              -> chuyển MỘT ảnh vào thùng rác (tài khoản có quyền "hinh-anh"
//                                            cũng xoá được — an toàn vì có thùng rác, giáo viên khôi
//                                            phục lại được nếu xoá nhầm/bị lạm dụng)
//   DELETE /api/gv/anh?ids=1,2,3         -> chuyển NHIỀU ảnh vào thùng rác (CHỈ giáo viên — xoá hàng
//                                            loạt rủi ro cao hơn nên không mở cho tài khoản cấp quyền)
//   DELETE /api/gv/anh?tatCa=1           -> chuyển sạch cả thư viện vào thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/anh?id=&vinhVien=1    -> xoá VĨNH VIỄN một ảnh ĐÃ ở trong thùng rác (CHỈ giáo viên)
//
// Ảnh đã được nén nhỏ ngay trên máy giáo viên trước khi gửi lên, nên mỗi tấm
// chỉ khoảng 100–300 KB. Nội dung ảnh lưu trong Cloudflare R2, phần mô tả lưu trong D1.
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';
import {
  tongDungLuongDaDung, gioiHanCuaLop, xoaKhoiThuVien, xoaNhieuKhoiThuVien,
  khoiPhucKhoiThuVien, xoaVinhVienKhoiThuVien, donDepThungRacHetHan,
} from '../../_lib/thu-vien.js';

const KIEU_CHO_PHEP = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TOI_DA_BYTE = 1_500_000;   // 1,5 MB mỗi ảnh sau khi nén

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const xemRac = new URL(request.url).searchParams.get('rac') === '1';
  // Thùng rác CHỈ giáo viên chủ nhiệm xem được — cùng nguyên tắc "chỉ giáo viên khôi phục được"
  // ở Lịch sử & khôi phục: tài khoản được cấp quyền xoá được (chuyển vào rác) nhưng không tự
  // khôi phục/xem lại được, để không thể tự xoá dấu vết nếu tài khoản bị chiếm.
  if (xemRac && phien.role !== 'teacher') return loi('Chỉ giáo viên chủ nhiệm xem được thùng rác.', 403);
  if (xemRac) await donDepThungRacHetHan(env, phien.lopId);

  const { results } = await env.DB.prepare(
    `SELECT id, khoa, chu_thich AS chuThich, ngay, kieu, co_byte AS coByte, da_xoa_luc AS daXoaLuc,
            xoa_boi AS xoaBoi, ly_do_xoa AS lyDoXoa
       FROM hinh_anh WHERE lop_id = ?1 AND da_xoa_luc IS ${xemRac ? 'NOT NULL' : 'NULL'}
      ORDER BY ${xemRac ? 'da_xoa_luc DESC' : 'ngay DESC, id DESC'}`
  ).bind(phien.lopId).all();

  const tongByte = results.reduce((a, r) => a + r.coByte, 0);
  return json({ ok: true, danhSach: results, soAnh: results.length, tongByte });
// Cho phép cả tài khoản chỉ có quyền "thong-bao" xem danh sách này — cần để dùng bộ chọn
// "đính kèm từ thư viện" trong hộp thoại soạn Thông báo (chỉ ĐỌC, không thêm/xoá được).
}, { canGiaoVien: true, quyenCan: ['hinh-anh', 'thong-bao'] });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  if (!env.ANH) return loi('Chưa gắn kho ảnh vào project.', 500);

  const { kieu, duLieu, chuThich, ngay } = await docThan(request);

  if (!KIEU_CHO_PHEP.has(kieu)) return loi('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
  if (typeof duLieu !== 'string' || !duLieu) return loi('Không có dữ liệu ảnh.');
  if (ngay && !ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');

  let byte;
  try {
    const nhiPhan = atob(duLieu);
    byte = new Uint8Array(nhiPhan.length);
    for (let i = 0; i < nhiPhan.length; i++) byte[i] = nhiPhan.charCodeAt(i);
  } catch {
    return loi('Dữ liệu ảnh không đọc được.');
  }

  if (byte.length > TOI_DA_BYTE) {
    return loi(`Ảnh còn ${Math.round(byte.length / 1024)} KB, vượt mức cho phép. Hãy chọn ảnh nhỏ hơn.`);
  }

  // Chốt chặn an toàn theo TRẦN RIÊNG của lớp — cộng ĐỦ CẢ 3 thư viện (Ảnh + Âm thanh + Video)
  // của đúng lớp này, không tính thiếu và không đụng dung lượng của lớp khác.
  const [daDung, gioiHan] = await Promise.all([
    tongDungLuongDaDung(env.DB, phien.lopId),
    gioiHanCuaLop(env.DB, phien.lopId),
  ]);
  if (daDung + byte.length > gioiHan) {
    return loi(`Kho lưu trữ của lớp đã đạt trần an toàn ${Math.round(gioiHan / 1_000_000_000 * 10) / 10} GB. Đã tự động khoá tải lên để bảo đảm không phát sinh chi phí.`);
  }

  const khoa = 'anh-' + Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
  await env.ANH.put(khoa, byte, {
    httpMetadata: { contentType: kieu },
    customMetadata: { kieu },
    metadata: { kieu },
  });

  const kq = await env.DB.prepare(
    'INSERT INTO hinh_anh (khoa, chu_thich, ngay, kieu, co_byte, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  ).bind(khoa, chuoi(chuThich, 300), ngay || new Date().toISOString().slice(0, 10), kieu, byte.length, phien.lopId).run();

  return json({ ok: true, id: kq.meta.last_row_id, khoa, coByte: byte.length });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const { id, chuThich, khoiPhuc } = await docThan(request);
  if (!Number.isInteger(Number(id))) return loi('Thiếu mã ảnh.');

  if (khoiPhuc) {
    if (phien.role !== 'teacher') return loi('Chỉ giáo viên chủ nhiệm khôi phục được.', 403);
    const loiKp = await khoiPhucKhoiThuVien(env, 'anh', Number(id), phien.lopId);
    if (loiKp) return loiKp;
    return json({ ok: true });
  }

  const kq = await env.DB.prepare('UPDATE hinh_anh SET chu_thich = ?1 WHERE id = ?2 AND lop_id = ?3')
    .bind(chuoi(chuThich, 300), Number(id), phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy ảnh.', 404);
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const laGiaoVien = phien.role === 'teacher';
  // Lý do xoá (không bắt buộc) gửi kèm thân JSON dù là DELETE — docThan() trả {} nếu không có
  // thân, nên gọi vô điều kiện là an toàn.
  const { lyDo } = await docThan(request);

  if (q.get('vinhVien') === '1') {
    if (!laGiaoVien) return loi('Chỉ giáo viên chủ nhiệm xoá vĩnh viễn được.', 403);
    const id = Number(q.get('id'));
    if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã ảnh.');
    const loiXoa = await xoaVinhVienKhoiThuVien(env, 'anh', id, phien.lopId);
    if (loiXoa) return loiXoa;
    return json({ ok: true });
  }

  if (q.get('tatCa') === '1' || q.get('ids')) {
    // Xoá hàng loạt CHỈ giáo viên — tài khoản được cấp quyền chỉ xoá được từng ảnh một (xem
    // nhánh cuối cùng bên dưới), tránh một tài khoản bị chiếm quét sạch cả thư viện cùng lúc.
    if (!laGiaoVien) return loi('Tài khoản được cấp quyền chỉ xoá được từng ảnh một. Nhờ giáo viên chủ nhiệm nếu cần xoá nhiều ảnh cùng lúc.', 403);
    let ids;
    if (q.get('tatCa') === '1') {
      const { results } = await env.DB.prepare('SELECT id FROM hinh_anh WHERE lop_id = ?1 AND da_xoa_luc IS NULL').bind(phien.lopId).all();
      ids = results.map((r) => r.id);
    } else {
      ids = [...new Set(q.get('ids').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    }
    const { daXoa } = await xoaNhieuKhoiThuVien(env, 'anh', ids, phien.lopId, phien, chuoi(lyDo, 300));
    return json({ ok: true, daXoa });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã ảnh.');

  const loiXoa = await xoaKhoiThuVien(env, 'anh', id, phien.lopId, phien, chuoi(lyDo, 300));
  if (loiXoa) return loiXoa;
  return json({ ok: true });
// choPhepXoaPhu: tài khoản được cấp quyền "hinh-anh" xoá được (chuyển vào thùng rác) — an toàn vì
// giáo viên luôn khôi phục lại được nếu xoá nhầm hoặc tài khoản bị chiếm quyền lạm dụng.
}, { canGiaoVien: true, quyenCan: 'hinh-anh', choPhepXoaPhu: true });
