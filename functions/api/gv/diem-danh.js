// Điểm danh — chỉ giáo viên chủ nhiệm (và tài khoản phụ được cấp quyền "diem-danh").
//   GET  /api/gv/diem-danh?ngay=2026-09-15&buoi=sang   -> danh sách lớp kèm trạng thái đã ghi
//   GET  /api/gv/diem-danh?hocSinhId=5   -> TOÀN BỘ lịch sử điểm danh (mọi ngày/buổi/loại) của
//        đúng một em — dùng cho ô "Tìm học sinh" ở trang Điểm danh (xem toàn bộ lịch sử để dễ
//        sửa một bản ghi cũ). Tách riêng khỏi /api/gv/rieng/hoc-sinh?id= (hồ sơ ĐẦY ĐỦ, chỉ giáo viên
//        chủ nhiệm) vì tài khoản phụ có quyền "diem-danh" cũng cần xem được đúng phần lịch sử
//        điểm danh này (không phải hồ sơ riêng tư: sđt phụ huynh, hoàn cảnh, ghi chú...).
//   POST /api/gv/diem-danh   { ngay, buoi, ghiNhan:[{hocSinhId, trangThai, lyDo}] }
//        trangThai = null/rỗng -> XOÁ điểm danh của em đó ngày/buổi này (bấm lại nút đang
//        chọn ở giao diện để "bỏ chọn", quay về trạng thái chưa ghi).
import { bocXuLy, json, loi, docThan, ngayHopLe, chuoi, ngayVNHomNay } from '../../_lib/api.js';
import { chupCheckpointDiemDanh } from '../../_lib/diem-danh-checkpoint.js';

const TRANG_THAI_HOP_LE = new Set(['co_mat', 'vang_phep', 'vang_khong_phep', 'tre']);
const TEN_BUOI = { sang: 'Sáng', chieu: 'Chiều', hoat_dong: 'Hoạt động', sang_phu: 'Sáng (phụ)', chieu_phu: 'Chiều (phụ)', hoat_dong_phu: 'Hoạt động (phụ)' };

function chuanHoaBuoi(buoi, loai) {
  if (!buoi || typeof buoi !== 'string') return null;
  let b = buoi.trim();
  // "loai" quyết định hẳn có hậu tố "_phu" hay không — không tin vào hậu tố client tự gửi sẵn.
  // Trước đây chỉ THÊM "_phu" khi loai='phu' nhưng không bao giờ BỎ nó khi loai khác 'phu', nên
  // một request gửi buoi="sang_phu" kèm loai="chinh"/rỗng vẫn lọt qua — ghi nhầm vào sổ phụ
  // trong khi checkpoint lại gắn nhãn "chinh", lẫn lộn giữa hai sổ đáng lẽ phải tách bạch rõ.
  b = b.replace(/_phu$/, '');
  if (loai === 'phu') b = `${b}_phu`;
  const goc = b.replace(/_phu$/, '');
  if (!['sang', 'chieu', 'hoat_dong'].includes(goc)) return null;
  return b;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);

  const hocSinhId = Number(url.searchParams.get('hocSinhId'));
  if (Number.isInteger(hocSinhId) && hocSinhId > 0) {
    // "ORDER BY ngay DESC, buoi DESC" — PHẢI khớp CHÍNH XÁC thứ tự ở /api/diem-danh.js (chuyên
    // cần cá nhân em học sinh tự xem), nếu không cùng một bộ dữ liệu sẽ hiện thứ tự KHÁC NHAU ở
    // hai nơi (bản ghi cùng ngày nhưng khác buổi không có thứ tự cố định nếu chỉ ORDER BY ngay),
    // trông như dữ liệu sai lệch dù thật ra chỉ là thứ tự hiển thị ngẫu nhiên.
    const { results } = await env.DB.prepare(
      `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
         FROM diem_danh WHERE hoc_sinh_id = ?1 AND lop_id = ?2 ORDER BY ngay DESC, buoi DESC LIMIT 60`
    ).bind(hocSinhId, phien.lopId).all();
    return json({ ok: true, lichSu: results });
  }

  const ngay = url.searchParams.get('ngay') || ngayVNHomNay();
  const buoiGoc = url.searchParams.get('buoi') || 'sang';
  const loai = url.searchParams.get('loai') || '';
  const buoi = chuanHoaBuoi(buoiGoc, loai);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!buoi) return loi('Buổi không hợp lệ.');


  // "so_thu_tu" mới là số thứ tự thật trong sổ lớp — "id" chỉ là khoá kỹ thuật tăng dần theo
  // thứ tự TẠO record (học sinh thêm sau/chuyển vào sau có id lớn hơn hẳn, không liên quan gì
  // tới vị trí của em trong sổ lớp). Trước đây thiếu "so_thu_tu" ở đây nên giao diện phải tạm
  // lấy "id" làm STT hiển thị VÀ sắp xếp luôn theo "id" — học sinh thêm sau (id lớn, vd 68, 69)
  // bị hiện STT sai VÀ trôi lạc xuống cuối danh sách, dù trang "Học sinh" (đã dùng đúng
  // so_thu_tu) hiện đúng. Khớp đúng quy ước đã dùng ở /api/gv/rieng/hoc-sinh.js.
  const { results } = await env.DB.prepare(
    `SELECT h.id, h.so_thu_tu AS soThuTu, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.lop_nghe AS lopNghe,
            d.trang_thai AS trangThai, d.ly_do AS lyDo
       FROM hoc_sinh h
       LEFT JOIN diem_danh d
         ON d.hoc_sinh_id = h.id AND d.ngay = ?1 AND d.buoi = ?2 AND d.lop_id = ?3
      WHERE h.dang_hoc = 1 AND h.lop_id = ?3
      ORDER BY h.so_thu_tu, h.id`
  ).bind(ngay, buoi, phien.lopId).all();

  const daGhi = results.filter((r) => r.trangThai).length;
  return json({ ok: true, ngay, buoi, daGhi, tongSo: results.length, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const { ngay, buoi: buoiGoc = 'sang', loai = '', ghiNhan } = than;
  const buoi = chuanHoaBuoi(buoiGoc, loai);

  if (!ngayHopLe(ngay)) return loi('Ngày không hợp lệ.');
  if (!buoi) return loi('Buổi không hợp lệ.');

  if (!Array.isArray(ghiNhan) || !ghiNhan.length) return loi('Chưa có dữ liệu điểm danh.');
  if (ghiNhan.length > 200) return loi('Quá nhiều bản ghi trong một lần gửi.');

  // Chỉ chấp nhận học sinh THẬT SỰ thuộc lớp đang đăng nhập — chặn trường hợp id học sinh
  // của lớp khác lỡ lọt vào dữ liệu gửi lên. Lấy sẵn họ tên để ghi lịch sử chi tiết bên dưới.
  const { results: hsLop } = await env.DB.prepare('SELECT id, ho_ten AS hoTen FROM hoc_sinh WHERE lop_id = ?1').bind(phien.lopId).all();
  const tenMap = new Map(hsLop.map((h) => [h.id, h.hoTen]));

  // Trạng thái TRƯỚC khi ghi (đúng ngày/buổi này) — so sánh để biết CHÍNH XÁC ai đổi từ gì
  // sang gì, kể cả bị xoá hẳn — phục vụ lịch sử chi tiết từng học sinh (xem trang "Lịch sử
  // điểm danh"), không chỉ một dòng mô tả chung chung như trước.
  const { results: truocDs } = await env.DB.prepare(
    'SELECT hoc_sinh_id AS hocSinhId, trang_thai AS trangThai, ly_do AS lyDo FROM diem_danh WHERE ngay = ?1 AND buoi = ?2 AND lop_id = ?3'
  ).bind(ngay, buoi, phien.lopId).all();
  const truocMap = new Map(truocDs.map((r) => [r.hocSinhId, r]));

  const cauLenh = [];
  const chiTiet = [];
  for (const g of ghiNhan) {
    const id = Number(g.hocSinhId);
    if (!Number.isInteger(id) || id <= 0 || !tenMap.has(id)) return loi('Mã học sinh không hợp lệ.');
    const truoc = truocMap.get(id) || null;

    if (!g.trangThai) {
      // Bỏ chọn — xoá hẳn bản ghi, không phải một "trạng thái rỗng". Chỉ ghi vào lịch sử nếu
      // TRƯỚC ĐÓ thật sự đã có gì đó (bỏ chọn khi chưa từng ghi thì không phải một thay đổi).
      if (truoc) {
        chiTiet.push({ hocSinhId: id, hoTen: tenMap.get(id), truoc: truoc.trangThai, sau: null, lyDo: truoc.lyDo || '' });
      }
      cauLenh.push(
        env.DB.prepare('DELETE FROM diem_danh WHERE ngay = ?1 AND buoi = ?2 AND hoc_sinh_id = ?3 AND lop_id = ?4')
          .bind(ngay, buoi, id, phien.lopId)
      );
      continue;
    }

    if (!TRANG_THAI_HOP_LE.has(g.trangThai)) return loi(`Trạng thái không hợp lệ: ${g.trangThai}`);
    const lyDoMoi = chuoi(g.lyDo, 300);
    if (!truoc || truoc.trangThai !== g.trangThai || (truoc.lyDo || '') !== lyDoMoi) {
      chiTiet.push({ hocSinhId: id, hoTen: tenMap.get(id), truoc: truoc ? truoc.trangThai : null, sau: g.trangThai, lyDo: lyDoMoi });
    }
    cauLenh.push(
      env.DB.prepare(
        `INSERT INTO diem_danh (ngay, buoi, hoc_sinh_id, trang_thai, ly_do, cap_nhat_luc, lop_id)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), ?6)
         ON CONFLICT(ngay, buoi, hoc_sinh_id)
         DO UPDATE SET trang_thai = excluded.trang_thai,
                       ly_do = excluded.ly_do,
                       cap_nhat_luc = datetime('now')`
      ).bind(ngay, buoi, id, g.trangThai, lyDoMoi, phien.lopId)
    );
  }

  // Chụp lại toàn bộ điểm danh hiện tại TRƯỚC khi ghi đè — giống hệt cơ chế của Thủ quỹ, để
  // ghi nhầm hay tài khoản bị chiếm vẫn khôi phục lại được (xem trang "Lịch sử điểm danh").
  // Chỉ chụp khi THẬT SỰ có gì đổi (chiTiet không rỗng) — tránh lịch sử rác cho lần bấm lưu
  // mà không đổi gì.
  if (chiTiet.length) {
    const hanhDong = `Ghi điểm danh ${TEN_BUOI[buoi] || buoi} ngày ${ngay} — ${chiTiet.length} học sinh`;
    await chupCheckpointDiemDanh(env.DB, hanhDong, phien, loai === 'phu' ? 'phu' : 'chinh', chiTiet);
  }

  await env.DB.batch(cauLenh);
  return json({ ok: true, daLuu: cauLenh.length });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });
