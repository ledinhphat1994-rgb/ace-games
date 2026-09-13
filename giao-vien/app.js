import { $, api, datNoiDung, khoiLoi, batDauTheoDoiPhien } from '/assets/js/chung.js';
import { KHUNG } from './lib.js';
import { trangNguoiDung } from './pages/nguoi-dung.js';
import { trangBangTin } from './pages/bang-tin.js';

async function khoiDong() {
  try {
    const phien = await api('/api/whoami');
    if (!phien.isVerifiedTeacher || !phien.isActive) {
      datNoiDung(KHUNG, khoiLoi('Tài khoản này chưa có quyền quản lý tài khoản web.'));
      return;
    }
    $('#tenQuanTri').textContent = phien.ten || phien.username || 'Quản trị viên';
    $('#phamViQuanTri').textContent = phien.isSchoolAdmin ? 'Quản trị toàn trường' : 'Tài khoản trong phạm vi được phân quyền';

    const capNhatTab = (hash) => {
      const tabNguoiDung = $('#tab-nguoi-dung');
      const tabBangTin = $('#tab-bang-tin');
      if (tabNguoiDung && tabBangTin) {
        if (hash === '#/bang-tin') {
          tabNguoiDung.classList.remove('active');
          tabBangTin.classList.add('active');
        } else {
          tabNguoiDung.classList.add('active');
          tabBangTin.classList.remove('active');
        }
      }
    };

    const dieuHuong = async () => {
      const h = location.hash;
      if (h === '#/bang-tin') {
        capNhatTab(h);
        await trangBangTin();
      } else {
        if (h !== '#/nguoi-dung') history.replaceState(null, '', '#/nguoi-dung');
        capNhatTab('#/nguoi-dung');
        await trangNguoiDung();
      }
    };

    window.addEventListener('hashchange', dieuHuong);
    await dieuHuong();
    batDauTheoDoiPhien();
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Không mở được trang quản trị: ' + err.message));
  }
}
khoiDong();