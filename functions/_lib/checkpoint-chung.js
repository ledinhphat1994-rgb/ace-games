// Lịch sử & khôi phục DÙNG CHUNG cho các chức năng chỉ có bảng D1, không đụng tới file R2:
// Thông báo, Thời khoá biểu, Hoạt động lớp. Cùng nguyên tắc với Thủ quỹ/Điểm danh (xem
// quy-checkpoint.js) — chụp TOÀN BỘ (các) bảng liên quan TRƯỚC mỗi lần ghi/sửa/xoá — nhưng gộp
// chung MỘT bảng checkpoint_chung (cột "tinh_nang" phân biệt) thay vì tạo riêng bảng
// *_checkpoint cho từng chức năng nhỏ.
import { taChuThich } from './quy-checkpoint.js';

export { taChuThich };

const TOI_DA_CHECKPOINT_MOI_MUC = 100;   // ít hơn Thủ quỹ/Điểm danh vì đây là chức năng phụ

// Mỗi chức năng liệt kê (các) bảng của mình, theo ĐÚNG thứ tự cha→con (bảng con tham chiếu
// khoá ngoại tới bảng đứng trước) — dùng để khôi phục đúng thứ tự (xoá ngược, chèn xuôi).
const CAC_TINH_NANG = {
  'thong-bao': ['thong_bao'],
  'hoat-dong-lop': ['hoat_dong_lop'],
  'thoi-khoa-bieu': ['tkb_phien_ban', 'tkb_o'],
  'theo-doi': ['theo_doi'],
};

export function tinhNangHopLe(tinhNang) {
  return Object.prototype.hasOwnProperty.call(CAC_TINH_NANG, tinhNang);
}

/** Chụp toàn bộ (các) bảng của một chức năng, CỦA ĐÚNG LỚP đang đăng nhập, TRƯỚC khi áp dụng
    một thay đổi — không chụp lẫn dữ liệu của lớp khác vào cùng một điểm khôi phục. */
export async function chupCheckpointChung(db, tinhNang, hanhDong, phien) {
  const cacBang = CAC_TINH_NANG[tinhNang];
  if (!cacBang) throw new Error('Tính năng không hợp lệ: ' + tinhNang);
  const lopId = phien?.lopId ?? 1;

  const duLieu = {};
  for (const bang of cacBang) {
    duLieu[bang] = (await db.prepare(`SELECT * FROM ${bang} WHERE lop_id = ?1`).bind(lopId).all()).results;
  }

  const kq = await db.prepare(
    'INSERT INTO checkpoint_chung (tinh_nang, hanh_dong, nguoi_thuc_hien, du_lieu, lop_id) VALUES (?1, ?2, ?3, ?4, ?5)'
  ).bind(tinhNang, hanhDong, taChuThich(phien), JSON.stringify(duLieu), lopId).run();

  // Dọn bớt các bản cũ CỦA ĐÚNG LỚP + ĐÚNG TÍNH NĂNG này, tránh phình bảng vô hạn.
  await db.prepare(
    `DELETE FROM checkpoint_chung WHERE lop_id = ?1 AND tinh_nang = ?2 AND id NOT IN
       (SELECT id FROM checkpoint_chung WHERE lop_id = ?1 AND tinh_nang = ?2 ORDER BY id DESC LIMIT ?3)`
  ).bind(lopId, tinhNang, TOI_DA_CHECKPOINT_MOI_MUC).run();

  return kq.meta.last_row_id;
}

export async function danhSachCheckpointChung(db, tinhNang, lopId) {
  const { results } = await db.prepare(
    `SELECT id, hanh_dong AS hanhDong, nguoi_thuc_hien AS nguoiThucHien, tao_luc AS taoLuc
       FROM checkpoint_chung WHERE lop_id = ?1 AND tinh_nang = ?2 ORDER BY id DESC LIMIT 200`
  ).bind(lopId, tinhNang).all();
  return results;
}

// Dựng lại đúng câu INSERT từ chính các cột một dòng đã chụp (Object.keys của kết quả SELECT *)
// thay vì liệt kê tay từng cột — để không bị lệch nếu sau này bảng có thêm cột mới (khác kiểu
// hardcode ở quy-checkpoint.js, ở đây có tới 4 bảng với rất nhiều cột nên tự suy ra cho gọn và
// luôn khớp đúng schema hiện tại). "bang"/tên cột đều lấy từ danh sách nội bộ CAC_TINH_NANG và
// từ chính D1 trả về — không phải dữ liệu người dùng gõ, nên nối chuỗi SQL ở đây an toàn.
function lenhChenDong(db, bang, dong, lopId) {
  const cot = Object.keys(dong).filter((c) => c !== 'lop_id');
  const giaTri = cot.map((c) => dong[c]);
  cot.push('lop_id');
  giaTri.push(lopId);
  const cho = cot.map((_, i) => `?${i + 1}`).join(',');
  return db.prepare(`INSERT INTO ${bang} (${cot.join(',')}) VALUES (${cho})`).bind(...giaTri);
}

/** Ghi đè toàn bộ (các) bảng của một chức năng, CỦA ĐÚNG LỚP, bằng đúng nội dung của một
    checkpoint đã chụp trước đó — không đụng tới dữ liệu của lớp khác. */
export async function khoiPhucCheckpointChung(db, tinhNang, checkpointId, lopId) {
  const cacBang = CAC_TINH_NANG[tinhNang];
  if (!cacBang) throw new Error('Tính năng không hợp lệ: ' + tinhNang);

  const cp = await db.prepare(
    'SELECT du_lieu FROM checkpoint_chung WHERE id = ?1 AND lop_id = ?2 AND tinh_nang = ?3'
  ).bind(checkpointId, lopId, tinhNang).first();
  if (!cp) throw new Error('Không tìm thấy điểm khôi phục này.');

  const duLieu = JSON.parse(cp.du_lieu);
  const cauLenh = [];
  // Xoá bảng CON trước bảng CHA (đảo ngược thứ tự khai báo trong CAC_TINH_NANG).
  for (const bang of [...cacBang].reverse()) {
    cauLenh.push(db.prepare(`DELETE FROM ${bang} WHERE lop_id = ?1`).bind(lopId));
  }
  // Chèn lại bảng CHA trước bảng CON.
  for (const bang of cacBang) {
    (duLieu[bang] || []).forEach((dong) => cauLenh.push(lenhChenDong(db, bang, dong, lopId)));
  }

  // batch() chạy trọn vẹn hoặc không chạy gì — không sợ khôi phục dở dang.
  await db.batch(cauLenh);
}
