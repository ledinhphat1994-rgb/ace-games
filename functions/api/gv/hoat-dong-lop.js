// "Hoạt động lớp" — bài đăng công khai ở trang chủ, do giáo viên (hoặc học sinh được cấp
// quyền) tạo. MỘT bài có thể gộp NHIỀU loại nội dung cùng lúc — văn bản + ảnh + video + âm
// thanh — bật/tắt độc lập từng loại, giống hệt cách Thông báo đã làm (không còn ép "đúng một
// trong bốn loại" như thiết kế cũ nữa).
//   GET    /api/gv/hoat-dong-lop  -> danh sách đã đăng, kèm mọi loại nội dung đang có của từng bài
//   POST   /api/gv/hoat-dong-lop  { tieuDe?, noiDung?, anhId?|hinhUrl?, videoId?|videoUrl?,
//                                    amThanhId?|amThanhUrl?, ngay? } — cần ít nhất MỘT trong số đó.
//   DELETE /api/gv/hoat-dong-lop?id=  -> gỡ một bài khỏi trang chủ (mọi nội dung trong bài đó)
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { locHtmlNoiDung } from '../../_lib/html-an-toan.js';
import { chupCheckpointChung } from '../../_lib/checkpoint-chung.js';

const QUYEN = ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'];

async function xacThucThamChieu(db, lopId, bang, id) {
  if (!Number.isInteger(id)) return true;
  // "da_xoa_luc IS NULL": mục đang trong THÙNG RÁC không được đính kèm mới (xem thu-vien.js).
  const hang = await db.prepare(`SELECT id FROM ${bang} WHERE id = ?1 AND lop_id = ?2 AND da_xoa_luc IS NULL`).bind(id, lopId).first();
  return Boolean(hang);
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    `SELECT hd.id, hd.loai, hd.tieu_de AS tieuDe, hd.tieu_de_html AS tieuDeHtml,
            hd.chu_thich AS chuThich, hd.noi_dung_html AS noiDungHtml, hd.ngay,
            hd.anh_id AS anhId, hd.hinh_url AS hinhUrl, ha.khoa AS anhKhoa,
            hd.video_id AS videoId, hd.video_url AS videoUrl, v.khoa AS videoKhoa, v.ten AS videoTen,
            hd.am_thanh_id AS amThanhId, hd.am_thanh_url AS amThanhUrl, at.khoa AS amThanhKhoa, at.ten AS amThanhTen
       FROM hoat_dong_lop hd
       LEFT JOIN hinh_anh ha ON ha.id = hd.anh_id
       LEFT JOIN video v ON v.id = hd.video_id
       LEFT JOIN am_thanh at ON at.id = hd.am_thanh_id
      WHERE hd.lop_id = ?1 ORDER BY hd.ngay DESC, hd.id DESC`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { tieuDe, tieuDeHtml, noiDung, noiDungHtml, anhId, hinhUrl, videoId, videoUrl, amThanhId, amThanhUrl, ngay } = await docThan(request);
  const ngayLuu = chuoi(ngay, 10) || new Date().toISOString().slice(0, 10);

  const td = chuoi(tieuDe, 150) || null;
  const nd = chuoi(noiDung, 2000) || null;
  // Không tin vào việc lọc HTML đã làm ở trình duyệt (hộp soạn thảo) — lọc lại lần nữa ở đây
  // trước khi lưu, vì API này gọi trực tiếp được (không bắt buộc phải qua giao diện).
  const tdHtml = tieuDeHtml ? (locHtmlNoiDung(tieuDeHtml, 300) || null) : null;
  const ndHtml = noiDungHtml ? (locHtmlNoiDung(noiDungHtml) || null) : null;

  const idAnh = Number.isInteger(anhId) ? anhId : null;
  const urlAnh = !idAnh ? (chuoi(hinhUrl, 1000) || null) : null;
  const idVideo = Number.isInteger(videoId) ? videoId : null;
  const urlVideo = !idVideo ? (chuoi(videoUrl, 1000) || null) : null;
  const idAmThanh = Number.isInteger(amThanhId) ? amThanhId : null;
  const urlAmThanh = !idAmThanh ? (chuoi(amThanhUrl, 1000) || null) : null;

  const coAnh = Boolean(idAnh || urlAnh);
  const coVideo = Boolean(idVideo || urlVideo);
  const coAmThanh = Boolean(idAmThanh || urlAmThanh);
  const coVanBan = Boolean(td || nd || ndHtml);

  if (!coVanBan && !coAnh && !coVideo && !coAmThanh) {
    return loi('Chưa nhập nội dung văn bản, cũng chưa chọn ảnh/video/âm thanh nào.');
  }

  // Ràng buộc quyền: tài khoản đặc biệt (phu) chỉ được gắn ĐÚNG loại media mình có quyền —
  // độc lập theo từng loại, vì giờ một bài có thể gộp nhiều loại cùng lúc.
  if (phien.role === 'phu') {
    const q = phien.quyen || [];
    if (coAnh && !q.includes('hinh-anh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Ảnh để đính kèm ảnh.', 403);
    }
    if (coVideo && !q.includes('video')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Video để đính kèm video.', 403);
    }
    if (coAmThanh && !q.includes('am-thanh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Âm thanh để đính kèm âm thanh.', 403);
    }
  }

  if (idAnh && !(await xacThucThamChieu(env.DB, phien.lopId, 'hinh_anh', idAnh))) {
    return loi('Ảnh đính kèm không thuộc thư viện của lớp.');
  }
  if (idVideo && !(await xacThucThamChieu(env.DB, phien.lopId, 'video', idVideo))) {
    return loi('Video đính kèm không thuộc thư viện của lớp.');
  }
  if (idAmThanh && !(await xacThucThamChieu(env.DB, phien.lopId, 'am_thanh', idAmThanh))) {
    return loi('Âm thanh đính kèm không thuộc thư viện của lớp.');
  }

  // "loai" giờ chỉ còn mang tính mô tả (gộp các loại đang có, cách nhau bằng dấu phẩy) — hiển
  // thị/icon ở giao diện đọc trực tiếp từ các cột dữ liệu thực tế, không còn dựa vào cột này.
  const loaiGop = [coVanBan && 'text', coAnh && 'anh', coVideo && 'video', coAmThanh && 'am-thanh']
    .filter(Boolean).join(',');

  await chupCheckpointChung(env.DB, 'hoat-dong-lop', 'Trước khi: đăng một mục Hoạt động lớp', phien);
  const kq = await env.DB.prepare(
    `INSERT INTO hoat_dong_lop
       (lop_id, loai, tieu_de, tieu_de_html, chu_thich, noi_dung_html, anh_id, hinh_url, video_id, video_url, am_thanh_id, am_thanh_url, ngay)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
  ).bind(phien.lopId, loaiGop, td, tdHtml, nd, ndHtml, idAnh, urlAnh, idVideo, urlVideo, idAmThanh, urlAmThanh, ngayLuu).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã mục hoạt động.');

  await chupCheckpointChung(env.DB, 'hoat-dong-lop', `Trước khi: gỡ mục Hoạt động lớp #${id}`, phien);
  const kq = await env.DB.prepare('DELETE FROM hoat_dong_lop WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy mục này.', 404);
  return json({ ok: true });
// choPhepXoaPhu: bocXuLy() mặc định chặn CỨNG mọi DELETE từ tài khoản không phải giáo viên,
// bất kể quyenCan có khớp hay không — phải khai báo rõ ở đây mới thật sự xoá được (thiếu dòng
// này là lý do nút "Gỡ" hiện ra đúng cho tài khoản có quyền nhưng bấm vào vẫn bị từ chối).
}, { canGiaoVien: true, quyenCan: QUYEN, choPhepXoaPhu: true });
