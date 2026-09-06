// "Hoạt động lớp" — danh sách ảnh/video/âm thanh do giáo viên (hoặc học sinh được cấp quyền
// quản lý Ảnh/Âm thanh/Video) CHỌN TỪNG MỤC để đăng công khai ở trang chủ — KHÔNG tự động lấy
// hết thư viện như "Hình ảnh hoạt động" trước đây.
//   GET    /api/gv/hoat-dong-lop            -> danh sách đã đăng, kèm khoá/kiểu để xem trước
//   POST   /api/gv/hoat-dong-lop  { loai, anhId|videoId|amThanhId|url, chuThich? }
//   DELETE /api/gv/hoat-dong-lop?id=        -> gỡ một mục khỏi danh sách công khai
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';

const QUYEN = ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'];
const BANG_THEO_LOAI = { anh: 'hinh_anh', video: 'video', 'am-thanh': 'am_thanh' };

async function xacThucThamChieu(db, lopId, bang, id) {
  if (!Number.isInteger(id)) return true;
  const hang = await db.prepare(`SELECT id FROM ${bang} WHERE id = ?1 AND lop_id = ?2`).bind(id, lopId).first();
  return Boolean(hang);
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    `SELECT hd.id, hd.loai, hd.chu_thich AS chuThich, hd.ngay, hd.url,
            ha.khoa AS anhKhoa, v.khoa AS videoKhoa, v.ten AS videoTen, at.khoa AS amThanhKhoa, at.ten AS amThanhTen
       FROM hoat_dong_lop hd
       LEFT JOIN hinh_anh ha ON ha.id = hd.anh_id
       LEFT JOIN video v ON v.id = hd.video_id
       LEFT JOIN am_thanh at ON at.id = hd.am_thanh_id
      WHERE hd.lop_id = ?1 ORDER BY hd.ngay DESC, hd.id DESC`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { loai, anhId, videoId, amThanhId, url, chuThich, tieuDe, ngay } = await docThan(request);
  const ngayLuu = chuoi(ngay, 10) || new Date().toISOString().slice(0, 10);

  // 1. Hoạt động dạng văn bản (text thông thường / bài viết sự kiện)
  if (loai === 'text') {
    const nd = chuoi(chuThich, 2000);
    const td = chuoi(tieuDe, 150);
    const noiDungGop = td ? (nd ? `${td}\n\n${nd}` : td) : nd;
    if (!noiDungGop) return loi('Chưa nhập nội dung hoặc tiêu đề hoạt động.');

    const kq = await env.DB.prepare(
      `INSERT INTO hoat_dong_lop (lop_id, loai, chu_thich, ngay)
       VALUES (?1, 'text', ?2, ?3)`
    ).bind(phien.lopId, noiDungGop, ngayLuu).run();

    return json({ ok: true, id: kq.meta.last_row_id });
  }

  // 2. Hoạt động có đính kèm Media (Ảnh, Video, Âm thanh)
  // Ràng buộc Media: Tài khoản phụ (role='phu') bắt buộc phải có đúng quyền thư viện tương ứng
  if (phien.role === 'phu') {
    const quyenHienCo = phien.quyen || [];
    if (loai === 'anh' && !quyenHienCo.includes('hinh-anh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Ảnh. Bạn chỉ được ghi nội dung văn bản thông thường.', 403);
    }
    if (loai === 'video' && !quyenHienCo.includes('video')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Video. Bạn chỉ được ghi nội dung văn bản thông thường.', 403);
    }
    if (loai === 'am-thanh' && !quyenHienCo.includes('am-thanh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Âm thanh. Bạn chỉ được ghi nội dung văn bản thông thường.', 403);
    }
  }

  const bang = BANG_THEO_LOAI[loai];
  if (!bang) return loi('Loại hoạt động không hợp lệ.');

  const idThamChieu = loai === 'anh' ? anhId : loai === 'video' ? videoId : amThanhId;
  const idSo = Number.isInteger(idThamChieu) ? idThamChieu : null;
  const urlSach = String(url || '').trim();
  if (!idSo && !urlSach) return loi('Chưa chọn mục nào trong thư viện, cũng chưa dán link.');

  if (idSo && !(await xacThucThamChieu(env.DB, phien.lopId, bang, idSo))) {
    return loi('Mục này không thuộc thư viện của lớp.');
  }

  const kq = await env.DB.prepare(
    `INSERT INTO hoat_dong_lop (lop_id, loai, anh_id, video_id, am_thanh_id, url, chu_thich, ngay)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).bind(
    phien.lopId, loai,
    loai === 'anh' ? idSo : null,
    loai === 'video' ? idSo : null,
    loai === 'am-thanh' ? idSo : null,
    idSo ? null : urlSach,
    chuoi(chuThich, 2000),
    ngayLuu
  ).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã mục hoạt động.');

  const kq = await env.DB.prepare('DELETE FROM hoat_dong_lop WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy mục này.', 404);
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: QUYEN });
