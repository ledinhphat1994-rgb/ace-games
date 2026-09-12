// functions/_lib/rooms.js
// Quản trị kiểm tra quyền truy cập và rào chắn phòng (Room Admission & Scope Security)
import { actorKey } from './auth.js';

export const NHIP_HOAT_DONG = '-90 seconds';
export const NHIP_HIEU_LUC = '-15 minutes';

// Làm sạch đối tượng phòng trước khi gửi về client:
// - Luôn xóa matKhauHash, matKhauSalt, chuPhongKhoa
// - Nếu phòng có mật khẩu và người dùng CHƯA được duyệt vào phòng (chưa nhập pass / không phải host/GV):
//   ẩn toàn bộ cauHinh (videoUrl, nhacUrl) và các thông tin nội bộ.
export function lamSachPhong(p, { isAdmitted = true, canControl = false } = {}) {
  if (!p) return null;
  const clone = { ...p };
  delete clone.matKhauHash;
  delete clone.matKhauSalt;
  delete clone.mat_khau_hash;
  delete clone.mat_khau_salt;
  delete clone.chuPhongKhoa;
  delete clone.chu_phong_khoa;

  clone.access_mode = clone.accessMode || clone.access_mode || 'public';
  clone.accessMode = clone.access_mode;
  clone.canControl = Boolean(canControl);
  clone.laChuPhong = Boolean(canControl);

  const soNguoi = clone.soNguoi || 0;
  const sucChua = clone.sucChua || 20;
  if (clone.loai === 'game') {
    clone.trangThaiChiTiet = clone.trangThai === 'mo' ? (soNguoi >= sucChua ? 'dang_choi' : 'cho_nguoi') : clone.trangThai;
  } else {
    clone.trangThaiChiTiet = soNguoi >= sucChua ? 'full' : (soNguoi > 1 ? 'active' : 'waiting');
  }

  // Rào chắn bảo mật cho phòng khoá mật khẩu
  if (clone.accessMode === 'password' && !isAdmitted && !canControl) {
    clone.cauHinh = null;
    clone.cau_hinh = null;
    delete clone.videoUrl;
    delete clone.nhacUrl;
    clone.admissionRequired = true;
  }

  return clone;
}

// Kiểm tra quyền truy cập phòng tập trung cho toàn bộ API (phong, phong-chat, phong-watch, phong-focus)
export async function kiemTraTruyCapPhong(db, phongId, phien, {
  loai = null,
  requireAdmitted = false,
  requireHostOrTeacher = false,
} = {}) {
  const id = parseInt(phongId || '', 10);
  if (!(id > 0)) return { loi: 'Thiếu mã phòng.', status: 400 };

  const p = await db.prepare(`
    SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
           p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen,
           p.cau_hinh AS cauHinh, p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
           p.access_mode AS accessMode, p.mat_khau_hash AS matKhauHash, p.mat_khau_salt AS matKhauSalt,
           p.suc_chua AS sucChua,
           l.ten AS lopTen,
           (SELECT COUNT(*) FROM phong_thanh_vien v
             WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?2)) AS soNguoi
      FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
     WHERE p.id = ?1
  `).bind(id, NHIP_HOAT_DONG).first();

  if (!p || p.trangThai !== 'mo') {
    return { loi: 'Phòng không tồn tại hoặc đã đóng.', status: 404 };
  }

  if (loai && p.loai !== loai) {
    return { loi: `Phòng này không phải phòng ${loai}.`, status: 400 };
  }

  // 1. Kiểm tra phạm vi lớp (Class Scope Boundary)
  if (p.phamVi !== 'truong' && phien.role !== 'teacher') {
    if (!phien.lopId || p.lopId !== phien.lopId) {
      return { loi: 'Phòng này chỉ dành cho lớp ' + (p.lopTen || 'khác') + '.', status: 403 };
    }
  }

  // 2. Xác định định danh phiên chuẩn tắc
  const actor = actorKey(phien);
  const isHost = Boolean(p.chuPhongKhoa && p.chuPhongKhoa === actor);
  const isTeacher = Boolean(phien.role === 'teacher');
  const canControl = isHost || isTeacher;

  // 3. Xác định trạng thái đã được duyệt vào phòng (isAdmitted)
  let isAdmitted;
  if (canControl) {
    isAdmitted = true;
  } else if (p.accessMode !== 'password') {
    // Phòng công khai: người dùng thỏa mãn phạm vi lớp/trường mặc nhiên được tham gia xem/nghe/chat
    isAdmitted = true;
  } else {
    // Phòng có mật khẩu: bắt buộc phải có bản ghi tham gia hợp lệ trong phong_thanh_vien
    const tv = await db.prepare(`
      SELECT 1 FROM phong_thanh_vien
      WHERE phong_id = ?1 AND khoa = ?2 AND datetime(hoat_dong_luc) > datetime('now', ?3)
    `).bind(p.id, actor, NHIP_HIEU_LUC).first().catch(() => null);
    isAdmitted = Boolean(tv);
  }

  // 4. Kiểm tra yêu cầu quyền điều khiển (Host / Teacher)
  if (requireHostOrTeacher && !canControl) {
    return { loi: 'Chỉ chủ phòng hoặc giáo viên mới có quyền thực hiện.', status: 403 };
  }

  // 5. Rào chắn phòng mật khẩu cho các tài nguyên bên trong (Chat, Video, Focus, Detail)
  if (requireAdmitted && !isAdmitted) {
    return { loi: 'Cần nhập mật khẩu phòng trước khi truy cập.', status: 403, code: 'admission_required' };
  }

  return {
    phong: p,
    isHost,
    isTeacher,
    canControl,
    isAdmitted,
    actorKey: actor,
  };
}
