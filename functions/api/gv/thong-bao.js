// Thông báo hiện trên trang lớp — soạn ngay trên web, không phải sửa tệp nữa.
//   GET    /api/gv/thong-bao
//   POST   /api/gv/thong-bao   { ngay, tieuDe, noiDung, loai, ghim, noiBat, mucDo, videoUrl }
//   PATCH  /api/gv/thong-bao   { id, ...trường cần sửa }
//   DELETE /api/gv/thong-bao?id=
//
// "ghim": đẩy lên đầu danh sách Thông báo. "noiBat": có đưa vào băng điểm nhấn ở trang chủ
// hay không — HAI cờ TÁCH BIỆT NHAU, một thông báo có thể ghim mà không nổi bật, hoặc ngược lại.
// "mucDo": mức độ quan trọng ('', 'ok', 'warn', 'danger') — quyết định màu nhãn hiển thị cho
// học sinh dễ nhận biết, thay cho việc gán cứng "Quan trọng" theo cờ ghim như trước. Đây cũng
// là chức năng thay thế cho "Kế hoạch năm học" cũ (đã gộp vào đây, không dùng bảng ke_hoach nữa).
// Ảnh/nhạc đính kèm tải lên qua /api/gv/thong-bao-tep (thân nhị phân riêng, xem tệp đó) vì vượt
// giới hạn thân JSON ở đây; videoUrl chỉ là một đường dẫn văn bản (dán link YouTube…).
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi } from '../../_lib/api.js';

const MUC_DO_HOP_LE = new Set(['', 'ok', 'warn', 'danger']);

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  // Trả cả mã tham chiếu thư viện (anhId/amThanhId/videoId) THẬT lẫn khoá/kiểu đã tra sẵn để
  // xem trước ngay trong hộp thoại sửa, không cần gọi thêm API thư viện.
  const { results } = await env.DB.prepare(
    `SELECT tb.id, tb.ngay, tb.tieu_de AS tieuDe, tb.noi_dung AS noiDung, tb.loai, tb.ghim, tb.hien,
            tb.noi_bat AS noiBat, tb.muc_do AS mucDo,
            tb.anh_id AS anhId, ha.khoa AS hinhKhoa, ha.kieu AS hinhKieu, tb.hinh_url AS hinhUrl,
            tb.am_thanh_id AS amThanhId, at.khoa AS nhacKhoa, at.kieu AS nhacKieu, tb.nhac_url AS nhacUrl,
            tb.video_id AS videoId, v.khoa AS videoKhoa, v.kieu AS videoKieu, tb.video_url AS videoUrl
       FROM thong_bao tb
       LEFT JOIN hinh_anh ha ON ha.id = tb.anh_id
       LEFT JOIN am_thanh at ON at.id = tb.am_thanh_id
       LEFT JOIN video v ON v.id = tb.video_id
      WHERE tb.lop_id = ?1
      ORDER BY tb.ghim DESC, tb.ngay DESC LIMIT 200`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

// Kiểm tra id thư viện (ảnh/âm thanh/video) đính kèm THẬT SỰ thuộc lớp đang đăng nhập — chặn
// trường hợp gán nhầm/cố ý một mục thư viện của lớp khác vào thông báo công khai của lớp này.
async function xacThucThuVien(db, lopId, bang, id) {
  if (!Number.isInteger(id)) return true;
  const hang = await db.prepare(`SELECT id FROM ${bang} WHERE id = ?1 AND lop_id = ?2`).bind(id, lopId).first();
  return Boolean(hang);
}

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { ngay, tieuDe, noiDung, loai, ghim, noiBat, mucDo, videoUrl, anhId, hinhUrl, amThanhId, nhacUrl, videoId } = await docThan(request);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  const td = chuoi(tieuDe, 200);
  const nd = chuoi(noiDung, 5000);
  if (!td) return loi('Chưa nhập tiêu đề.');
  if (!nd) return loi('Chưa nhập nội dung.');
  if (mucDo !== undefined && !MUC_DO_HOP_LE.has(mucDo)) return loi('Mức độ không hợp lệ.');

  // Ràng buộc Media: Tài khoản phụ chỉ được đính kèm loại media nếu có quyền thư viện tương ứng
  if (phien.role === 'phu') {
    const quyenCo = phien.quyen || [];
    if ((anhId || hinhUrl) && !quyenCo.includes('hinh-anh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Ảnh. Bạn chỉ có thể soạn thông báo bằng văn bản.', 403);
    }
    if ((amThanhId || nhacUrl) && !quyenCo.includes('am-thanh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Âm thanh. Bạn chỉ có thể soạn thông báo bằng văn bản.', 403);
    }
    if ((videoId || videoUrl) && !quyenCo.includes('video')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Video. Bạn chỉ có thể soạn thông báo bằng văn bản.', 403);
    }
  }

  if (!(await xacThucThuVien(env.DB, phien.lopId, 'hinh_anh', anhId))) return loi('Ảnh đính kèm không hợp lệ.');
  if (!(await xacThucThuVien(env.DB, phien.lopId, 'am_thanh', amThanhId))) return loi('Âm thanh đính kèm không hợp lệ.');
  if (!(await xacThucThuVien(env.DB, phien.lopId, 'video', videoId))) return loi('Video đính kèm không hợp lệ.');

  const kq = await env.DB.prepare(
    `INSERT INTO thong_bao (ngay, tieu_de, noi_dung, loai, ghim, noi_bat, muc_do, video_url, anh_id, hinh_url, am_thanh_id, nhac_url, video_id, lop_id)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`
  ).bind(
    ngay, td, nd, chuoi(loai, 50) || 'Chủ nhiệm', ghim ? 1 : 0, noiBat ? 1 : 0,
    mucDo || '', chuoi(videoUrl, 500) || null,
    Number.isInteger(anhId) ? anhId : null, chuoi(hinhUrl, 1000) || null,
    Number.isInteger(amThanhId) ? amThanhId : null, chuoi(nhacUrl, 1000) || null,
    Number.isInteger(videoId) ? videoId : null, phien.lopId
  ).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare('SELECT id FROM thong_bao WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
  if (!tb) return loi('Không tìm thấy thông báo này.', 404);

  const dat = [];
  const thamSo = [];
  const them = (cot, tri) => {
    thamSo.push(tri);
    dat.push(`${cot} = ?${thamSo.length}`);
  };

  if (than.ngay !== undefined) {
    if (!ngayHopLe(than.ngay)) return loi('Ngày không hợp lệ.');
    them('ngay', than.ngay);
  }
  if (than.tieuDe !== undefined) {
    const td = chuoi(than.tieuDe, 200);
    if (!td) return loi('Tiêu đề không được để trống.');
    them('tieu_de', td);
  }
  if (than.noiDung !== undefined) {
    const nd = chuoi(than.noiDung, 5000);
    if (!nd) return loi('Nội dung không được để trống.');
    them('noi_dung', nd);
  }
  if (than.loai !== undefined) them('loai', chuoi(than.loai, 50) || 'Chủ nhiệm');
  if (than.ghim !== undefined) them('ghim', than.ghim ? 1 : 0);
  if (than.noiBat !== undefined) them('noi_bat', than.noiBat ? 1 : 0);
  if (than.hien !== undefined) them('hien', than.hien ? 1 : 0);
  if (than.mucDo !== undefined) {
    if (!MUC_DO_HOP_LE.has(than.mucDo)) return loi('Mức độ không hợp lệ.');
    them('muc_do', than.mucDo);
  }
  if (than.videoUrl !== undefined) them('video_url', chuoi(than.videoUrl, 500) || null);

  // Mỗi loại đính kèm: đúng MỘT trong hai (mã thư viện HOẶC link ngoài) — đặt cái này thì xoá
  // luôn cái kia, tránh còn sót giá trị cũ gây hiển thị sai (vd vừa có anh_id vừa có hinh_url).
  if (than.anhId !== undefined || than.hinhUrl !== undefined) {
    const giaTriAnh = Number.isInteger(than.anhId) ? than.anhId : null;
    const giaTriUrl = chuoi(than.hinhUrl, 1000) || null;
    if ((giaTriAnh || giaTriUrl) && phien.role === 'phu' && !(phien.quyen || []).includes('hinh-anh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Ảnh để đính kèm hình.', 403);
    }
    if (!(await xacThucThuVien(env.DB, phien.lopId, 'hinh_anh', than.anhId))) return loi('Ảnh đính kèm không hợp lệ.');
    them('anh_id', giaTriAnh);
    them('hinh_url', giaTriUrl);
  }
  if (than.amThanhId !== undefined || than.nhacUrl !== undefined) {
    const giaTriAmThanh = Number.isInteger(than.amThanhId) ? than.amThanhId : null;
    const giaTriNhacUrl = chuoi(than.nhacUrl, 1000) || null;
    if ((giaTriAmThanh || giaTriNhacUrl) && phien.role === 'phu' && !(phien.quyen || []).includes('am-thanh')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Âm thanh để đính kèm bài hát.', 403);
    }
    if (!(await xacThucThuVien(env.DB, phien.lopId, 'am_thanh', than.amThanhId))) return loi('Âm thanh đính kèm không hợp lệ.');
    them('am_thanh_id', giaTriAmThanh);
    them('nhac_url', giaTriNhacUrl);
  }
  if (than.videoId !== undefined) {
    const giaTriVideo = Number.isInteger(than.videoId) ? than.videoId : null;
    if (giaTriVideo && phien.role === 'phu' && !(phien.quyen || []).includes('video')) {
      return loi('Tài khoản chưa được cấp quyền Thư viện Video để đính kèm video.', 403);
    }
    if (!(await xacThucThuVien(env.DB, phien.lopId, 'video', than.videoId))) return loi('Video đính kèm không hợp lệ.');
    them('video_id', giaTriVideo);
  }

  if (!dat.length) return loi('Không có thông tin cần đổi.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE thong_bao SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`)
    .bind(...thamSo).run();

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  // Đính kèm giờ tham chiếu vào thư viện (anh_id/am_thanh_id/video_id) DÙNG CHUNG — xoá thông
  // báo KHÔNG xoá file trong thư viện (mục đó có thể còn dùng cho thông báo khác).
  const kq = await env.DB.prepare('DELETE FROM thong_bao WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy thông báo này.', 404);
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });
