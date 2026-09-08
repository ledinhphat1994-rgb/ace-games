// Tính khoảng ngày của TỪNG kỳ trong một mẫu "Thu cố định" — hàm THUẦN (không đụng DB).
//
// Kỳ 1 do giáo viên tự chọn khoảng ngày (không nhất thiết đúng 7/30/365 ngày — có thể là một
// "tuần" lệch để khớp lịch trường thực tế). Từ kỳ 2 trở đi, mỗi kỳ nối tiếp NGAY SAU kỳ liền
// trước, với ĐÚNG độ dài (số ngày) của kỳ 1 — không ép cứng theo lịch dương như thiết kế cũ.
// Toàn bộ "số lượng kỳ" được sinh SẴN một lần lúc tạo mẫu (xem functions/api/gv/rieng/quy-dinh-ky.js),
// không còn sinh dần mỗi khi mở trang Thủ quỹ.
export function tinhCacKy(ngayBatDauKy1, ngayKetThucKy1, soKy) {
  const bd1 = new Date(ngayBatDauKy1 + 'T00:00:00Z');
  const kt1 = new Date(ngayKetThucKy1 + 'T00:00:00Z');
  const doDaiNgay = Math.round((kt1 - bd1) / 86400000) + 1;   // số ngày của kỳ 1, tính cả 2 đầu

  const ds = [];
  for (let k = 1; k <= soKy; k++) {
    const bd = new Date(bd1);
    bd.setUTCDate(bd.getUTCDate() + (k - 1) * doDaiNgay);
    const kt = new Date(bd);
    kt.setUTCDate(kt.getUTCDate() + doDaiNgay - 1);
    ds.push({ kySo: k, ngayBatDau: bd.toISOString().slice(0, 10), ngayKetThuc: kt.toISOString().slice(0, 10) });
  }
  return ds;
}

const NHAN_CHU_KY = { tuan: 'Tuần', thang: 'Tháng', nam: 'Năm' };

function dinhDangNgan(iso) {
  const [, thang, ngay] = iso.split('-');
  return `${ngay}/${thang}`;
}

/** Tên hiển thị của một kỳ, vd: "Quỹ lớp — Tuần 2 (12/09–18/09)". */
export function tenKy(ten, chuKy, ky) {
  const nhan = NHAN_CHU_KY[chuKy] || 'Kỳ';
  return `${ten} — ${nhan} ${ky.kySo} (${dinhDangNgan(ky.ngayBatDau)}–${dinhDangNgan(ky.ngayKetThuc)})`;
}
