import { KHUNG } from '../lib.js';
import { e, datNoiDung } from '/assets/js/chung.js';
import { theDieuHuong, tieuDeTrang } from '/assets/js/giao-dien.js';


export async function trangCaiDat() {
  const khung = e('div');
  khung.append(tieuDeTrang('⚙️ Cài đặt', 'Hồ sơ giáo viên, báo cáo xuất file, nhật ký đăng nhập và reset dữ liệu lớp.'));

  const luoi = e('div', 'luoi-qt');
  luoi.append(
    theDieuHuong('👤', 'Hồ sơ giáo viên', 'Tên hiển thị, ảnh đại diện, tiêu đề giới thiệu công khai.', '#/ho-so-gv', '#38BDF8'),
    theDieuHuong('📑', 'Báo cáo & Xuất file', 'Xuất CSV chuyên cần, sách giáo khoa, đồng phục để nộp trường.', '#/bao-cao', '#8B5CF6'),
    theDieuHuong('📋', 'Nhật ký đăng nhập', 'Lịch sử đăng nhập của các tài khoản trong lớp.', '#/nhat-ky-dang-nhap', '#10B981')
  );
  khung.append(luoi);

  // Khu vực nguy hiểm — tách hẳn khỏi lưới thẻ thường phía trên, không lẫn với các mục an toàn.
  const khuNguyHiem = e('div', 'the');
  khuNguyHiem.style.cssText = 'margin-top: 20px; padding: 18px; border-color: color-mix(in srgb, #F43F5E 40%, var(--vien));';
  khuNguyHiem.append(Object.assign(e('h3', null, '⚠️ Khu vực nguy hiểm'), {
    style: 'font-size: 13px; font-weight: 800; color: #F43F5E; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em;',
  }));
  const moTaNguyHiem = e('p', null, 'Xoá sạch dữ liệu lớp theo từng mục — hầu hết khôi phục lại được ngay sau đó.');
  moTaNguyHiem.style.cssText = 'color: var(--chu-nhat); font-size: 12.5px; margin: 0 0 14px;';
  const nutResetLink = e('a', 'nut nut-vien nut-nho', '↻ Reset dữ liệu lớp');
  nutResetLink.href = '#/reset-du-lieu';
  nutResetLink.style.cssText = 'border-color: #F43F5E; color: #F43F5E; border-radius: 12px; font-weight: 700;';
  khuNguyHiem.append(moTaNguyHiem, nutResetLink);
  khung.append(khuNguyHiem);

  datNoiDung(KHUNG, khung);
}
