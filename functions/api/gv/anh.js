// Ảnh hoạt động của lớp.
//   GET    /api/gv/anh          -> danh sách ảnh (kèm dung lượng đã dùng)
//   POST   /api/gv/anh          { tenTep, kieu, duLieu (base64), chuThich, ngay }
//   PATCH  /api/gv/anh          { id, chuThich }
//   DELETE /api/gv/anh?id=            -> xoá một ảnh
//   DELETE /api/gv/anh?ids=1,2,3       -> xoá nhiều ảnh đã chọn
//   DELETE /api/gv/anh?tatCa=1         -> xoá sạch cả thư viện
//
// Ảnh đã được nén nhỏ ngay trên máy giáo viên trước khi gửi lên, nên mỗi tấm
// chỉ khoảng 100–300 KB. Nội dung ảnh lưu trong Cloudflare R2, phần mô tả lưu trong D1.
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';
import { tongDungLuongDaDung, gioiHanCuaLop, xoaKhoiThuVien, xoaNhieuKhoiThuVien } from '../../_lib/thu-vien.js';

const KIEU_CHO_PHEP = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TOI_DA_BYTE = 1_500_000;   // 1,5 MB mỗi ảnh sau khi nén

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, khoa, chu_thich AS chuThich, ngay, kieu, co_byte AS coByte FROM hinh_anh WHERE lop_id = ?1 ORDER BY ngay DESC, id DESC'
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
  const { id, chuThich } = await docThan(request);
  if (!Number.isInteger(Number(id))) return loi('Thiếu mã ảnh.');

  const kq = await env.DB.prepare('UPDATE hinh_anh SET chu_thich = ?1 WHERE id = ?2 AND lop_id = ?3')
    .bind(chuoi(chuThich, 300), Number(id), phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy ảnh.', 404);
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;

  if (q.get('tatCa') === '1' || q.get('ids')) {
    let ids;
    if (q.get('tatCa') === '1') {
      const { results } = await env.DB.prepare('SELECT id FROM hinh_anh WHERE lop_id = ?1').bind(phien.lopId).all();
      ids = results.map((r) => r.id);
    } else {
      ids = [...new Set(q.get('ids').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    }
    const { daXoa } = await xoaNhieuKhoiThuVien(env, 'anh', ids, phien.lopId);
    return json({ ok: true, daXoa });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã ảnh.');

  const loiXoa = await xoaKhoiThuVien(env, 'anh', id, phien.lopId);
  if (loiXoa) return loiXoa;
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });
