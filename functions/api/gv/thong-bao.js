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

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, ngay, tieu_de AS tieuDe, noi_dung AS noiDung, loai, ghim, hien, noi_bat AS noiBat,
            muc_do AS mucDo, hinh_khoa AS hinhKhoa, hinh_kieu AS hinhKieu, nhac_khoa AS nhacKhoa,
            video_url AS videoUrl
       FROM thong_bao ORDER BY ghim DESC, ngay DESC LIMIT 200`
  ).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { ngay, tieuDe, noiDung, loai, ghim, noiBat, mucDo, videoUrl } = await docThan(request);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  const td = chuoi(tieuDe, 200);
  const nd = chuoi(noiDung, 5000);
  if (!td) return loi('Chưa nhập tiêu đề.');
  if (!nd) return loi('Chưa nhập nội dung.');
  if (mucDo !== undefined && !MUC_DO_HOP_LE.has(mucDo)) return loi('Mức độ không hợp lệ.');

  const kq = await env.DB.prepare(
    `INSERT INTO thong_bao (ngay, tieu_de, noi_dung, loai, ghim, noi_bat, muc_do, video_url)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).bind(
    ngay, td, nd, chuoi(loai, 50) || 'Chủ nhiệm', ghim ? 1 : 0, noiBat ? 1 : 0,
    mucDo || '', chuoi(videoUrl, 500)
  ).run();

  return json({ ok: true, id: kq.meta.last_row_id });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const dat = [];
  const thamSo = [];
  const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };

  if (than.tieuDe !== undefined) them('tieu_de', chuoi(than.tieuDe, 200));
  if (than.noiDung !== undefined) them('noi_dung', chuoi(than.noiDung, 5000));
  if (than.loai !== undefined) them('loai', chuoi(than.loai, 50));
  if (than.ngay !== undefined) {
    if (!ngayHopLe(than.ngay)) return loi('Ngày không hợp lệ.');
    them('ngay', than.ngay);
  }
  if (than.ghim !== undefined) them('ghim', than.ghim ? 1 : 0);
  if (than.hien !== undefined) them('hien', than.hien ? 1 : 0);
  if (than.noiBat !== undefined) them('noi_bat', than.noiBat ? 1 : 0);
  if (than.mucDo !== undefined) {
    if (!MUC_DO_HOP_LE.has(than.mucDo)) return loi('Mức độ không hợp lệ.');
    them('muc_do', than.mucDo);
  }
  if (than.videoUrl !== undefined) them('video_url', chuoi(than.videoUrl, 500));

  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE thong_bao SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`)
    .bind(...thamSo).run();

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  // Dọn luôn tệp ảnh/nhạc đính kèm trong KV, tránh rác lại khi xoá thông báo.
  if (env.ANH) {
    const tb = await env.DB.prepare('SELECT hinh_khoa AS hinhKhoa, nhac_khoa AS nhacKhoa FROM thong_bao WHERE id = ?1').bind(id).first();
    if (tb) {
      if (tb.hinhKhoa) await env.ANH.delete(tb.hinhKhoa).catch(() => {});
      if (tb.nhacKhoa) await env.ANH.delete(tb.nhacKhoa).catch(() => {});
    }
  }

  await env.DB.prepare('DELETE FROM thong_bao WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });
