// Thư viện dùng chung cho 3 loại media trên web: Ảnh (hinh_anh), Âm thanh (am_thanh), Video
// (video) — CÙNG một kho R2 (env.ANH), khác nhau ở bảng D1 lưu mô tả và tiền tố khoá.
// Mọi nơi tải file lên (trang thư viện, hoặc đính kèm ngay trong lúc soạn Thông báo) đều đi
// qua themTepVaoThuVien() — tải lên ở đâu cũng biến file đó thành MỘT MỤC THẬT trong đúng thư
// viện, không còn file "riêng" của một tính năng nào nữa.
import { loi } from './api.js';

const CAU_HINH = {
  anh: {
    bang: 'hinh_anh', tienTo: 'anh',
    kieuChoPhep: new Set(['image/jpeg', 'image/png', 'image/webp']),
    toiDaByte: 1_500_000,
    kieuMacDinh: 'image/jpeg',
  },
  'am-thanh': {
    bang: 'am_thanh', tienTo: 'nhac',
    kieuChoPhep: new Set(['audio/mpeg', 'audio/mp3']),
    toiDaByte: 12_000_000,
    kieuMacDinh: 'audio/mpeg',
  },
  video: {
    bang: 'video', tienTo: 'video',
    kieuChoPhep: new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg']),
    toiDaByte: 50_000_000,
    kieuMacDinh: 'video/mp4',
  },
};

export function cauHinhThuVien(loaiThuVien) {
  return CAU_HINH[loaiThuVien] || null;
}

/** Tổng dung lượng ĐÃ DÙNG trên toàn bộ kho — cộng CẢ 3 thư viện, không bỏ sót bảng nào (khác
    các bản trước đây mỗi nơi tự tính SUM một bảng riêng, dẫn tới đếm thiếu). */
export async function tongDungLuongDaDung(db) {
  const [anh, amThanh, video] = await Promise.all([
    db.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM hinh_anh').first('tong'),
    db.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM am_thanh').first('tong'),
    db.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM video').first('tong'),
  ]);
  return (Number(anh) || 0) + (Number(amThanh) || 0) + (Number(video) || 0);
}

// Giới hạn an toàn tuyệt đối: 9,5 GB (ngưỡng miễn phí của Cloudflare R2 là 10 GB). Chặn 100%
// việc tải thêm nếu vượt quá, bảo đảm tài khoản không bao giờ phát sinh chi phí.
export const GIOI_HAN_TOI_DA_TONG_BYTE = 9_500_000_000;

/** Thêm một tệp nhị phân vào thư viện — dùng chung cho trang quản lý thư viện VÀ cho việc
    "tải file mới" ngay trong lúc soạn Thông báo (kết quả trả về có id để đính kèm luôn).
    Trả { loi } nếu có lỗi, hoặc { dong } nếu thành công (dong = dòng vừa thêm). */
export async function themTepVaoThuVien(env, loaiThuVien, duLieuNhiPhan, kieu, ten) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return { loi: 'Loại thư viện không hợp lệ.' };
  if (!env.ANH) return { loi: 'Chưa gắn kho lưu trữ vào project.' };
  if (!cauHinh.kieuChoPhep.has(kieu)) return { loi: 'Định dạng file không được hỗ trợ.' };
  if (!duLieuNhiPhan || !duLieuNhiPhan.byteLength) return { loi: 'File rỗng hoặc không đọc được.' };
  if (duLieuNhiPhan.byteLength > cauHinh.toiDaByte) {
    return { loi: `File nặng ${Math.round(duLieuNhiPhan.byteLength / 1_000_000)} MB, vượt mức cho phép (${Math.round(cauHinh.toiDaByte / 1_000_000)} MB).` };
  }

  const daDung = await tongDungLuongDaDung(env.DB);
  if (daDung + duLieuNhiPhan.byteLength > GIOI_HAN_TOI_DA_TONG_BYTE) {
    return { loi: 'Kho lưu trữ đã đạt ngưỡng an toàn 9,5 GB (trong mức 10 GB miễn phí). Đã tự động khoá tải lên để bảo đảm 100% không phát sinh chi phí.' };
  }

  const khoa = `${cauHinh.tienTo}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await env.ANH.put(khoa, duLieuNhiPhan, {
    httpMetadata: { contentType: kieu },
    customMetadata: { kieu },
    metadata: { kieu },
  });

  // hinh_anh có hình dạng cột khác (chu_thich/ngay thay vì ten) vì đã tồn tại từ trước khi có
  // khái niệm thư viện chung — giữ nguyên hình dạng bảng đó, chỉ ánh xạ "ten" sang "chu_thich".
  const kq = loaiThuVien === 'anh'
    ? await env.DB.prepare(
        'INSERT INTO hinh_anh (khoa, chu_thich, ngay, kieu, co_byte) VALUES (?1, ?2, ?3, ?4, ?5)'
      ).bind(khoa, ten || '', new Date().toISOString().slice(0, 10), kieu, duLieuNhiPhan.byteLength).run()
    : await env.DB.prepare(
        `INSERT INTO ${cauHinh.bang} (ten, khoa, kieu, co_byte) VALUES (?1, ?2, ?3, ?4)`
      ).bind(ten || '', khoa, kieu, duLieuNhiPhan.byteLength).run();

  return { dong: { id: kq.meta.last_row_id, ten: ten || '', khoa, kieu, coByte: duLieuNhiPhan.byteLength } };
}

/** Xoá một mục khỏi thư viện — dọn cả file R2 lẫn dòng D1. */
export async function xoaKhoiThuVien(env, loaiThuVien, id) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return loi('Loại thư viện không hợp lệ.');

  const dong = await env.DB.prepare(`SELECT khoa FROM ${cauHinh.bang} WHERE id = ?1`).bind(id).first();
  if (!dong) return loi('Không tìm thấy mục này trong thư viện.', 404);

  if (env.ANH) await env.ANH.delete(dong.khoa).catch(() => {});
  await env.DB.prepare(`DELETE FROM ${cauHinh.bang} WHERE id = ?1`).bind(id).run();
  return null;
}

/** Xoá NHIỀU mục cùng lúc (đã chọn từng mục, hoặc xoá sạch cả thư viện) — dùng chung logic dọn
    R2 + D1 với xoaKhoiThuVien(), tránh phải chọn/xoá từng cái một khi có nhiều mục.
    Tự động chia nhỏ theo lô tối đa 50 mục để không vượt giới hạn tham số truy vấn của Cloudflare D1. */
export async function xoaNhieuKhoiThuVien(env, loaiThuVien, ids) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return { loi: 'Loại thư viện không hợp lệ.' };
  if (!ids.length) return { daXoa: 0 };

  let tongDaXoa = 0;
  const KICH_THUOC_LO = 50;
  for (let i = 0; i < ids.length; i += KICH_THUOC_LO) {
    const lo = ids.slice(i, i + KICH_THUOC_LO);
    const cho = lo.map(() => '?').join(',');
    const { results } = await env.DB.prepare(`SELECT khoa FROM ${cauHinh.bang} WHERE id IN (${cho})`).bind(...lo).all();
    if (results && results.length) {
      if (env.ANH) await Promise.all(results.map((r) => env.ANH.delete(r.khoa).catch(() => {})));
      await env.DB.prepare(`DELETE FROM ${cauHinh.bang} WHERE id IN (${cho})`).bind(...lo).run();
      tongDaXoa += results.length;
    }
  }
  return { daXoa: tongDaXoa };
}
