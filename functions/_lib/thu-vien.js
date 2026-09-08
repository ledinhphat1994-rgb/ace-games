// Thư viện dùng chung cho 3 loại media trên web: Ảnh (hinh_anh), Âm thanh (am_thanh), Video
// (video) — CÙNG một kho R2 (env.ANH), khác nhau ở bảng D1 lưu mô tả và tiền tố khoá.
// Mọi nơi tải file lên (trang thư viện, hoặc đính kèm ngay trong lúc soạn Thông báo) đều đi
// qua themTepVaoThuVien() — tải lên ở đâu cũng biến file đó thành MỘT MỤC THẬT trong đúng thư
// viện, không còn file "riêng" của một tính năng nào nữa.
//
// Mọi hàm ở đây đều nhận thêm lopId — thư viện của mỗi lớp tách biệt hoàn toàn (kể cả dung
// lượng tính riêng, xoá/sửa chỉ tác động đúng mục của lớp đó), dù cùng chung một kho R2/D1.
//
// Tài khoản được cấp quyền (không phải giáo viên) còn bị thêm trần TẢI LÊN MỖI NGÀY (gộp cả 3
// thư viện, không giới hạn số bài đăng) — xem kiemTraGioiHanTaiLenNgay()/ghiNhanTaiLenNgay() bên
// dưới. functions/api/gv/anh.js có đường tải ảnh RIÊNG (không qua themTepVaoThuVien vì hinh_anh
// có hình dạng cột khác từ trước) nên tự gọi 2 hàm đó, không được quên khi thêm đường tải mới.
import { loi } from './api.js';
import { taChuThich } from './quy-checkpoint.js';

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

/** Tổng dung lượng ĐÃ DÙNG của MỘT LỚP — cộng CẢ 3 thư viện, không bỏ sót bảng nào (khác các
    bản trước đây mỗi nơi tự tính SUM một bảng riêng, dẫn tới đếm thiếu). */
export async function tongDungLuongDaDung(db, lopId) {
  const [anh, amThanh, video] = await Promise.all([
    db.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM hinh_anh WHERE lop_id = ?1').bind(lopId).first('tong'),
    db.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM am_thanh WHERE lop_id = ?1').bind(lopId).first('tong'),
    db.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM video WHERE lop_id = ?1').bind(lopId).first('tong'),
  ]);
  return (Number(anh) || 0) + (Number(amThanh) || 0) + (Number(video) || 0);
}

// Trần mặc định nếu lớp chưa tự đặt riêng — 9,5 GB (ngưỡng miễn phí Cloudflare R2 là 10 GB).
export const GIOI_HAN_TOI_DA_TONG_BYTE = 9_500_000_000;

/** Trần lưu trữ RIÊNG của một lớp — đọc từ lop.gioi_han_byte (giáo viên chỉnh được mỗi lớp
    một mức khác nhau), dùng hằng số mặc định nếu vì lý do gì đó không đọc được. */
export async function gioiHanCuaLop(db, lopId) {
  const row = await db.prepare('SELECT gioi_han_byte AS gioiHan FROM lop WHERE id = ?1').bind(lopId).first();
  return row?.gioiHan || GIOI_HAN_TOI_DA_TONG_BYTE;
}

/* ---------- Giới hạn tải lên MỖI NGÀY cho tài khoản ĐƯỢC CẤP QUYỀN ----------
   Chỉ áp dụng vai trò 'phu' (tài khoản phụ hoặc mã cá nhân được cấp quyền) — giáo viên chủ
   nhiệm KHÔNG giới hạn. Gộp chung cả 3 thư viện (ảnh/nhạc/video), KHÔNG giới hạn số bài đăng ở
   Hoạt động lớp/Thông báo (chỉ giới hạn dung lượng file đính kèm nếu có đính kèm). Mục đích:
   một tài khoản bị lộ/lạm dụng chỉ phá được tối đa NGẦN ẤY dung lượng mỗi ngày, không "cháy"
   hết trần chung của cả lớp chỉ trong một lần. */
export const GIOI_HAN_TAI_LEN_NGAY_PHU = 50_000_000; // 50 MB/ngày

/** Định danh ỔN ĐỊNH của một phiên 'phu' để cộng dồn dung lượng — dùng id thật (không dùng
    thẳng mã đăng nhập) vì mã có thể đổi nhưng vẫn phải tính chung một người. null nếu không áp
    dụng (không phải vai trò 'phu', hoặc thiếu cả 2 id — an toàn thì coi như không giới hạn). */
function danhTinhTaiLen(phien) {
  if (!phien || phien.role !== 'phu') return null;
  if (phien.phuId) return `phu-${phien.phuId}`;
  if (phien.hocSinhId) return `hs-${phien.hocSinhId}`;
  return null;
}

// Giờ Việt Nam (UTC+7) — nhất quán với cách các nơi khác trong dự án tính "ngày hôm nay".
function ngayVNHomNay() {
  const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/** Kiểm tra một lượt tải lên MỚI (soByteMoi) có làm vượt trần ngày của phiên 'phu' này không.
    Trả về thông báo lỗi (chuỗi) nếu vượt, hoặc null nếu vẫn còn trong hạn mức (kể cả khi không
    áp dụng, vd giáo viên). KHÔNG tự ghi nhận — gọi ghiNhanTaiLenNgay() SAU KHI tải lên thành công. */
export async function kiemTraGioiHanTaiLenNgay(db, lopId, phien, soByteMoi) {
  const danhTinh = danhTinhTaiLen(phien);
  if (!danhTinh) return null;

  try {
    const ngay = ngayVNHomNay();
    const daTai = await db.prepare(
      'SELECT COALESCE(SUM(co_byte), 0) AS tong FROM tai_len_theo_ngay WHERE lop_id = ?1 AND danh_tinh = ?2 AND ngay = ?3'
    ).bind(lopId, danhTinh, ngay).first('tong');

    if ((Number(daTai) || 0) + soByteMoi > GIOI_HAN_TAI_LEN_NGAY_PHU) {
      const daTaiMB = Math.round((Number(daTai) || 0) / 1_000_000 * 10) / 10;
      const tranMB = Math.round(GIOI_HAN_TAI_LEN_NGAY_PHU / 1_000_000);
      return `Tài khoản của bạn đã tải lên ${daTaiMB} MB hôm nay, vượt giới hạn ${tranMB} MB/ngày dành cho tài khoản được cấp quyền. Thử lại vào ngày mai, hoặc nhờ giáo viên chủ nhiệm tải giúp.`;
    }
    return null;
  } catch {
    // Bảng chưa tồn tại (chưa chạy migration) — không chặn tải lên vì lý do này.
    return null;
  }
}

/** Ghi nhận một lượt tải lên thành công vào sổ theo ngày — gọi NGAY SAU KHI tải lên thành công
    (không ghi khi tải thất bại). Không áp dụng (không phải 'phu') thì bỏ qua, không ghi gì. */
export async function ghiNhanTaiLenNgay(db, lopId, phien, soByte) {
  const danhTinh = danhTinhTaiLen(phien);
  if (!danhTinh) return;
  await db.prepare(
    'INSERT INTO tai_len_theo_ngay (lop_id, danh_tinh, ngay, co_byte) VALUES (?1, ?2, ?3, ?4)'
  ).bind(lopId, danhTinh, ngayVNHomNay(), soByte).run().catch(() => {});
}

/** Thêm một tệp nhị phân vào thư viện của MỘT LỚP — dùng chung cho trang quản lý thư viện VÀ
    cho việc "tải file mới" ngay trong lúc soạn Thông báo (kết quả trả về có id để đính kèm luôn).
    "phien" dùng để kiểm tra trần tải lên MỖI NGÀY của tài khoản được cấp quyền (xem
    kiemTraGioiHanTaiLenNgay ở trên) — giáo viên chủ nhiệm không bị giới hạn.
    Trả { loi } nếu có lỗi, hoặc { dong } nếu thành công (dong = dòng vừa thêm). */
export async function themTepVaoThuVien(env, loaiThuVien, duLieuNhiPhan, kieu, ten, lopId, phien) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return { loi: 'Loại thư viện không hợp lệ.' };
  if (!env.ANH) return { loi: 'Chưa gắn kho lưu trữ vào project.' };
  if (!cauHinh.kieuChoPhep.has(kieu)) return { loi: 'Định dạng file không được hỗ trợ.' };
  if (!duLieuNhiPhan || !duLieuNhiPhan.byteLength) return { loi: 'File rỗng hoặc không đọc được.' };
  if (duLieuNhiPhan.byteLength > cauHinh.toiDaByte) {
    return { loi: `File nặng ${Math.round(duLieuNhiPhan.byteLength / 1_000_000)} MB, vượt mức cho phép (${Math.round(cauHinh.toiDaByte / 1_000_000)} MB).` };
  }

  const [daDung, gioiHan, loiTranNgay] = await Promise.all([
    tongDungLuongDaDung(env.DB, lopId),
    gioiHanCuaLop(env.DB, lopId),
    kiemTraGioiHanTaiLenNgay(env.DB, lopId, phien, duLieuNhiPhan.byteLength),
  ]);
  if (daDung + duLieuNhiPhan.byteLength > gioiHan) {
    return { loi: `Kho lưu trữ của lớp đã đạt trần an toàn ${Math.round(gioiHan / 1_000_000_000 * 10) / 10} GB. Đã tự động khoá tải lên để bảo đảm không phát sinh chi phí.` };
  }
  if (loiTranNgay) return { loi: loiTranNgay };

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
        'INSERT INTO hinh_anh (khoa, chu_thich, ngay, kieu, co_byte, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
      ).bind(khoa, ten || '', new Date().toISOString().slice(0, 10), kieu, duLieuNhiPhan.byteLength, lopId).run()
    : await env.DB.prepare(
        `INSERT INTO ${cauHinh.bang} (ten, khoa, kieu, co_byte, lop_id) VALUES (?1, ?2, ?3, ?4, ?5)`
      ).bind(ten || '', khoa, kieu, duLieuNhiPhan.byteLength, lopId).run();

  await ghiNhanTaiLenNgay(env.DB, lopId, phien, duLieuNhiPhan.byteLength);

  return { dong: { id: kq.meta.last_row_id, ten: ten || '', khoa, kieu, coByte: duLieuNhiPhan.byteLength } };
}

// Xoá KHÔNG còn xoá thẳng nữa — R2 xoá là mất vĩnh viễn, không "khôi phục" nào cứu lại được file
// thật đã mất. "Xoá" giờ là CHUYỂN VÀO THÙNG RÁC (đặt da_xoa_luc, giữ nguyên file thật trong R2
// và dòng D1) — tự dọn hẳn sau NGAY_GIU_THUNG_RAC ngày (donDepThungRacHetHan(), gọi lười mỗi khi
// mở thùng rác), hoặc giáo viên tự bấm "Xoá vĩnh viễn" sớm hơn (xoaVinhVienKhoiThuVien()).
const NGAY_GIU_THUNG_RAC = 30;

/** "Xoá" một mục khỏi thư viện = chuyển vào thùng rác. Chỉ xoá được mục THUỘC ĐÚNG LỚP đang
    đăng nhập (lopId), không cho xoá nhầm/xoá lén mục của lớp khác. Ghi lại AI xoá (phien) và VÌ
    SAO (lyDo, không bắt buộc) — để tra soát được khi có sự cố, xem functions/_lib/quy-checkpoint.js. */
export async function xoaKhoiThuVien(env, loaiThuVien, id, lopId, phien, lyDo) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return loi('Loại thư viện không hợp lệ.');

  const kq = await env.DB.prepare(
    `UPDATE ${cauHinh.bang} SET da_xoa_luc = datetime('now'), xoa_boi = ?1, ly_do_xoa = ?2
       WHERE id = ?3 AND lop_id = ?4 AND da_xoa_luc IS NULL`
  ).bind(taChuThich(phien), lyDo || null, id, lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy mục này trong thư viện.', 404);

  // Bài đang là "nhạc nền trang chủ" mà bị chuyển vào thùng rác thì tắt luôn cờ đó.
  if (loaiThuVien === 'am-thanh') {
    await env.DB.prepare('UPDATE am_thanh SET dang_phat = 0 WHERE id = ?1 AND dang_phat = 1').bind(id).run();
  }
  // Ảnh đang làm BANNER trang chủ mà bị chuyển vào thùng rác thì tự xóa banner_anh_id
  // — tàn trang chủ không hiện một banner đã bị xóa (hiển thị 404 / khung trống).
  if (loaiThuVien === 'anh') {
    await env.DB.prepare(
      'UPDATE lop SET banner_anh_id = NULL WHERE id = ?1 AND banner_anh_id = ?2'
    ).bind(lopId, id).run();
  }
  return null;
}

/** Xoá NHIỀU mục cùng lúc (đã chọn từng mục, hoặc xoá sạch cả thư viện) = chuyển tất cả vào
    thùng rác. Chỉ xoá các id THUỘC ĐÚNG LỚP đang đăng nhập — id của lớp khác lỡ lọt vào danh
    sách sẽ bị bỏ qua, không xoá nhầm. Tự động chia nhỏ theo lô tối đa 50 mục để không vượt giới
    hạn tham số truy vấn của Cloudflare D1. Cũng ghi lại AI/VÌ SAO như xoaKhoiThuVien(). */
export async function xoaNhieuKhoiThuVien(env, loaiThuVien, ids, lopId, phien, lyDo) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return { loi: 'Loại thư viện không hợp lệ.' };
  if (!ids.length) return { daXoa: 0 };

  const nguoiXoa = taChuThich(phien);
  let tongDaXoa = 0;
  const KICH_THUOC_LO = 50;
  for (let i = 0; i < ids.length; i += KICH_THUOC_LO) {
    const lo = ids.slice(i, i + KICH_THUOC_LO);
    const cho = lo.map(() => '?').join(',');
    const kq = await env.DB.prepare(
      `UPDATE ${cauHinh.bang} SET da_xoa_luc = datetime('now'), xoa_boi = ?, ly_do_xoa = ?
         WHERE lop_id = ? AND da_xoa_luc IS NULL AND id IN (${cho})`
    ).bind(nguoiXoa, lyDo || null, lopId, ...lo).run();
    tongDaXoa += kq.meta.changes || 0;
  }

  // Xem xoaKhoiThuVien(): bài "nhạc nền trang chủ" bị chuyển vào thùng rác thì tắt luôn cờ đó.
  if (loaiThuVien === 'am-thanh' && tongDaXoa) {
    await env.DB.prepare('UPDATE am_thanh SET dang_phat = 0 WHERE lop_id = ?1 AND dang_phat = 1 AND da_xoa_luc IS NOT NULL').bind(lopId).run();
  }
  // Ảnh đang làm BANNER trang chủ mà bị xóa hàng loạt thì tự xóa banner_anh_id.
  if (loaiThuVien === 'anh' && tongDaXoa) {
    await env.DB.prepare(
      'UPDATE lop SET banner_anh_id = NULL WHERE id = ?1 AND banner_anh_id IN (' + ids.map(() => '?').join(',') + ')'
    ).bind(lopId, ...ids).run();
  }
  return { daXoa: tongDaXoa };
}

/** Khôi phục một mục ĐANG NẰM TRONG THÙNG RÁC về lại thư viện bình thường. */
export async function khoiPhucKhoiThuVien(env, loaiThuVien, id, lopId) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return loi('Loại thư viện không hợp lệ.');

  const kq = await env.DB.prepare(
    `UPDATE ${cauHinh.bang} SET da_xoa_luc = NULL WHERE id = ?1 AND lop_id = ?2 AND da_xoa_luc IS NOT NULL`
  ).bind(id, lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy mục này trong thùng rác.', 404);
  return null;
}

/** Xoá VĨNH VIỄN một mục ĐANG NẰM TRONG THÙNG RÁC — dọn cả file R2 lẫn dòng D1, không thể hoàn
    tác. Chỉ xoá vĩnh viễn được mục ĐÃ ở trong thùng rác (chặn xoá tắt qua thùng rác của mục còn
    đang hiển thị bình thường). */
export async function xoaVinhVienKhoiThuVien(env, loaiThuVien, id, lopId) {
  const cauHinh = cauHinhThuVien(loaiThuVien);
  if (!cauHinh) return loi('Loại thư viện không hợp lệ.');

  const dong = await env.DB.prepare(
    `SELECT khoa FROM ${cauHinh.bang} WHERE id = ?1 AND lop_id = ?2 AND da_xoa_luc IS NOT NULL`
  ).bind(id, lopId).first();
  if (!dong) return loi('Không tìm thấy mục này trong thùng rác.', 404);

  if (env.ANH) await env.ANH.delete(dong.khoa).catch(() => {});
  await env.DB.prepare(`DELETE FROM ${cauHinh.bang} WHERE id = ?1`).bind(id).run();
  return null;
}

/** Dọn thùng rác của MỘT LỚP: xoá vĩnh viễn (R2 + D1) mọi mục đã nằm trong thùng rác quá
    NGAY_GIU_THUNG_RAC ngày, ở cả 3 thư viện. Gọi LƯỜI mỗi khi có ai mở xem thùng rác — dự án
    không dùng Cloudflare Cron Triggers nên không có tiến trình nền chạy riêng. */
export async function donDepThungRacHetHan(env, lopId) {
  for (const loaiThuVien of Object.keys(CAU_HINH)) {
    const cauHinh = CAU_HINH[loaiThuVien];
    const { results } = await env.DB.prepare(
      `SELECT id, khoa FROM ${cauHinh.bang}
        WHERE lop_id = ?1 AND da_xoa_luc IS NOT NULL AND da_xoa_luc < datetime('now', '-${NGAY_GIU_THUNG_RAC} days')`
    ).bind(lopId).all();
    if (!results || !results.length) continue;

    if (env.ANH) await Promise.all(results.map((r) => env.ANH.delete(r.khoa).catch(() => {})));
    const ids = results.map((r) => r.id);
    const cho = ids.map(() => '?').join(',');
    await env.DB.prepare(`DELETE FROM ${cauHinh.bang} WHERE id IN (${cho})`).bind(...ids).run();
  }
}
