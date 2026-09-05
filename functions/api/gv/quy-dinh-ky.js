// Mẫu "Thu cố định" — một chuỗi khoản thu (quy_khoan) tự sinh nối tiếp nhau. Khác thiết kế cũ:
// giáo viên nhập TRƯỚC tổng số kỳ muốn thu, nên toàn bộ các kỳ được sinh SẴN ngay lúc tạo mẫu
// (không còn sinh dần mỗi khi mở trang Thủ quỹ) — mở "Các khoản thu" là thấy ngay toàn bộ lịch
// thu từ đầu đến cuối, không còn phải đoán "định kỳ là khi nào".
//   GET  /api/gv/quy-dinh-ky   -> lịch sử các đợt "Thu cố định" đã tạo (chỉ để xem lại)
//   POST /api/gv/quy-dinh-ky   { ten, chuKy, soTienMoiKy, ngayBatDau, ngayKetThuc, soKy }
//        ngayBatDau/ngayKetThuc: khoảng ngày của KỲ 1 (giáo viên tự chọn, không ép cứng độ
//        dài) — các kỳ sau tự tính nối tiếp, xem tinhCacKy() trong _lib/quy-dinh-ky.js.
// Không có PATCH/DELETE: một khi đã tạo, muốn bỏ một kỳ cụ thể thì xoá đúng khoản đó (khoản
// nào cũng xoá được độc lập qua /api/gv/quy?loai=khoan&id=), không cần khái niệm "dừng/tiếp
// tục" cả mẫu nữa vì mọi kỳ đã tồn tại sẵn ngay từ đầu.
import { bocXuLy, json, loi, docThan, ngayHopLe } from '../../_lib/api.js';
import { chupCheckpoint } from '../../_lib/quy-checkpoint.js';
import { tinhCacKy, tenKy } from '../../_lib/quy-dinh-ky.js';

const QUYEN = 'quy';
const TOI_DA_SO_KY = 60;   // đủ cho hơn 1 năm thu theo tuần, chặn nhập nhầm số cực lớn

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, ten, chu_ky AS chuKy, so_tien_moi_ky AS soTienMoiKy, ngay_bat_dau AS ngayBatDau,
            ngay_ket_thuc AS ngayKetThuc, so_ky AS soKy, tao_luc AS taoLuc
       FROM quy_dinh_ky ORDER BY tao_luc DESC`
  ).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: QUYEN });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { ten, chuKy, soTienMoiKy, ngayBatDau, ngayKetThuc, soKy } = await docThan(request);

  const tenSach = String(ten || '').trim().slice(0, 200);
  if (!tenSach) return loi('Chưa nhập tên khoản thu định kỳ.');
  if (!['tuan', 'thang', 'nam'].includes(chuKy)) return loi('Chu kỳ phải là tuần, tháng hoặc năm.');
  const soTien = Number(soTienMoiKy);
  if (!Number.isInteger(soTien) || soTien <= 0 || soTien > 10_000_000) return loi('Mức thu mỗi kỳ không hợp lệ.');
  if (!ngayHopLe(ngayBatDau) || !ngayHopLe(ngayKetThuc)) return loi('Ngày bắt đầu/kết thúc kỳ đầu tiên không hợp lệ.');
  if (ngayKetThuc < ngayBatDau) return loi('Ngày kết thúc kỳ đầu tiên phải từ ngày bắt đầu trở về sau.');
  const soKySo = Number(soKy);
  if (!Number.isInteger(soKySo) || soKySo < 1 || soKySo > TOI_DA_SO_KY) {
    return loi(`Số lượng kỳ phải là số nguyên từ 1 đến ${TOI_DA_SO_KY}.`);
  }

  const cacKy = tinhCacKy(ngayBatDau, ngayKetThuc, soKySo);
  const db = env.DB;

  await chupCheckpoint(db, `Trước khi: tạo mẫu thu cố định "${tenSach}" (${soKySo} kỳ)`, phien);

  const kq = await db.prepare(
    'INSERT INTO quy_dinh_ky (ten, chu_ky, so_tien_moi_ky, ngay_bat_dau, ngay_ket_thuc, so_ky) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  ).bind(tenSach, chuKy, soTien, ngayBatDau, ngayKetThuc, soKySo).run();
  const dinhKyId = kq.meta.last_row_id;

  await db.batch(cacKy.map((k) => db.prepare(
    `INSERT INTO quy_khoan (ten, hoc_ky, so_tien_moi_em, dinh_ky_id, ky_so, ngay_bat_dau, ngay_ket_thuc)
     VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6)`
  ).bind(tenKy(tenSach, chuKy, k), soTien, dinhKyId, k.kySo, k.ngayBatDau, k.ngayKetThuc)));

  return json({ ok: true, id: dinhKyId, soKySinh: cacKy.length });
}, { canGiaoVien: true, quyenCan: QUYEN });
