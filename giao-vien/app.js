import { $, api, datNoiDung, khoiLoi, batDauTheoDoiPhien } from '/assets/js/chung.js';
import { KHUNG } from './lib.js';
import { trangNguoiDung } from './pages/nguoi-dung.js';
async function khoiDong() {
  try {
    const phien = await api('/api/whoami');
    if (!phien.isVerifiedTeacher || !phien.isActive) {
      datNoiDung(KHUNG, khoiLoi('Tài khoản này chưa có quyền quản lý tài khoản web.'));
      return;
    }
    $('#tenQuanTri').textContent = phien.ten || phien.username || 'Quản trị viên';
    $('#phamViQuanTri').textContent = phien.isSchoolAdmin ? 'Quản trị toàn trường' : 'Tài khoản trong phạm vi được phân quyền';
    const chuanHoaTuyen = () => {
      if (location.hash !== '#/nguoi-dung') history.replaceState(null, '', '#/nguoi-dung');
    };
    chuanHoaTuyen();
    addEventListener('hashchange', chuanHoaTuyen);
    await trangNguoiDung();
    batDauTheoDoiPhien();
  } catch (err) { datNoiDung(KHUNG, khoiLoi('Không mở được trang quản trị: ' + err.message)); }
}
khoiDong();