import { KHUNG, PHAM_VI_LOP_ID, PHIEN, apiTheoPhamVi, duocVaoTuyen, locMenuTheoQuyen } from '../lib.js';
import { api, datNoiDung, e, khoiDangTai, layNhanTaiKhoan, ngayVN, nhac, nhanMucDo } from '/assets/js/chung.js';
import { dongHopThoai, moHopThoai, nut, tieuDeTrang } from '/assets/js/giao-dien.js';
import { moHopThoaiThemHoatDong } from '/assets/js/hoat-dong-lop-dialog.js';
import { moHopThoaiSoanThongBao } from '/assets/js/thong-bao-dialog.js';


export const TAB_TRANG_THAI_NOI_DUNG = [
  { id: 'nhap', nhan: '📝 Nháp' },
  { id: 'xuat_ban', nhan: '✅ Đã xuất bản' },
  { id: 'luu_tru', nhan: '🗄 Đã lưu trữ' },
];

export async function trangThongBao() {
  datNoiDung(KHUNG, khoiDangTai());
  let trangThaiLoc = 'xuat_ban';

  async function ve() {
    const d = await api(apiTheoPhamVi('/api/gv/thong-bao?trangThai=' + trangThaiLoc));
    const khung = e('div');

    const dau = e('div', 'tieu-de-trang');
    const trai = e('div');
    trai.append(e('h1', null, 'Thông báo'), e('p', null, 'Đăng lên trang lớp, cả lớp xem được ngay.'));
    const phai = e('div', 'phai');
    phai.append(
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien nut-nho', () => { location.hash = '#/thong-bao-khoi-phuc'; }),
      nut('+ Soạn thông báo', '', () => soanThongBao(null, ve))
    );
    dau.append(trai, phai);
    khung.append(dau);

    const thanhTab = e('div');
    thanhTab.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0;';
    TAB_TRANG_THAI_NOI_DUNG.forEach((tab) => {
      thanhTab.append(nut(tab.nhan, tab.id === trangThaiLoc ? 'nut-chinh nut-nho' : 'nut-vien nut-nho', () => {
        trangThaiLoc = tab.id;
        ve();
      }));
    });
    khung.append(thanhTab);

    if (!d.danhSach.length) {
      const nhanTab = (TAB_TRANG_THAI_NOI_DUNG.find((t) => t.id === trangThaiLoc) || {}).nhan || '';
      khung.append(e('p', 'trong', `Chưa có thông báo nào ở ${nhanTab}.`));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((t) => {
        const m = e('div', 'muc-nhat-ky ' + (t.ghim ? 'nhac_nho' : 'khac') + (t.hien ? '' : ' da-xong'));
        const dong = e('div', 'dong-dau');
        const mucDo = nhanMucDo(t.mucDo);
        if (mucDo) dong.append(e('span', 'nhan ' + mucDo.lop, mucDo.ten));
        if (t.ghim) dong.append(e('span', 'nhan nhan-xam', '📌 Ghim'));
        if (!t.hien) dong.append(e('span', 'nhan nhan-xam', 'Đang ẩn'));
        if (t.hinhKhoa) dong.append(e('span', 'nhan nhan-xam', '🖼 Ảnh'));
        if (t.nhacKhoa) dong.append(e('span', 'nhan nhan-xam', '🎵 Nhạc'));
        if (t.videoKhoa || t.videoUrl) dong.append(e('span', 'nhan nhan-xam', '🎬 Video'));
        dong.append(e('span', 'nhan nhan-xam', t.loai || 'Chủ nhiệm'), e('span', 'ngay', ngayVN(t.ngay)));

        const viec = e('div', 'viec');
        viec.append(
          nut('✎', 'nut-nhe nut-nho', () => soanThongBao(t, ve), 'Sửa thông báo: ' + t.tieuDe),
          nut(t.hien ? '🙈' : '👁', 'nut-nhe nut-nho', async () => {
            try {
              await api('/api/gv/thong-bao', { method: 'PATCH', than: { id: t.id, hien: !t.hien, lopId: PHAM_VI_LOP_ID || undefined } });
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          }, (t.hien ? 'Ẩn thông báo: ' : 'Hiện thông báo: ') + t.tieuDe),
          nut('✕', 'nut-nhe nut-nho', () => {
            moHopThoai('Xoá thông báo?', e('p', null, t.tieuDe), [
              nut('Huỷ', 'nut-nhe', dongHopThoai),
              nut('Xoá', 'nut-xau', async () => {
                try {
                  await api(apiTheoPhamVi('/api/gv/thong-bao?id=' + t.id), { method: 'DELETE' });
                  dongHopThoai();
                  nhac('Đã xoá', 'tot');
                  ve();
                } catch (err) { nhac(err.message, 'xau'); }
              }),
            ]);
          }, 'Xoá thông báo: ' + t.tieuDe)
        );
        dong.append(viec);

        m.append(dong, Object.assign(e('h3', null, t.tieuDe), { style: 'margin:4px 0' }), e('p', null, t.noiDung));
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

export function soanThongBao(tb, taiLai) {
  moHopThoaiSoanThongBao(tb, taiLai, PHAM_VI_LOP_ID || undefined);
}

/* ================= Trang: Thêm (menu phụ trên điện thoại) ================= */

export const MUC_THEM = [
  ['#/diem-danh', '✅', 'Điểm danh', 'Điểm danh chính khoá và linh động, xem/sửa lịch sử.'],
  ['#/thong-ke', '📈', 'Thống kê chuyên cần', 'Biểu đồ theo tuần và cảnh báo em có nguy cơ.'],
  ['#/thong-bao', '◈', 'Thông báo', 'Soạn và đăng thông báo lên trang lớp.'],
  ['#/thoi-khoa-bieu', '▦', 'Thời khoá biểu', 'Sửa thời khoá biểu hiện trên trang lớp.'],
  ['#/bao-cao', '⬇', 'Báo cáo & xuất dữ liệu', 'Tải tệp CSV mở bằng Excel để nộp trường.'],
  ['#/quy', '💰', 'Thủ quỹ', 'Ghi thu, ghi chi, xem tồn quỹ.'],
  ['#/hinh-anh', '🖼', 'Thư viện Ảnh', 'Đăng ảnh của lớp, tự nén nhỏ trước khi tải lên.'],
  ['#/thu-vien-am-thanh', '♪', 'Thư viện Âm thanh', 'Tải bài hát, đặt bài nào phát làm nhạc nền trang chủ.'],
  ['#/thu-vien-video', '🎬', 'Thư viện Video', 'Tải video từ máy/điện thoại lên, dùng lại khi soạn thông báo.'],
  ['#/ma-ca-nhan', '🔑', 'Mã cá nhân & phân quyền', 'Cấp mã, cấp quyền quản lý cho lớp trưởng, thủ quỹ...'],
  ['#/reset-du-lieu', '↻', 'Reset dữ liệu lớp', 'Xoá sạch từng mục theo lựa chọn, hầu hết khôi phục lại được ngay.'],
  ['/', '🏠', 'Trang chủ', 'Xem trang mà học sinh nhìn thấy.'],
  ['/api/logout', '⏻', 'Đăng xuất', 'Thoát khỏi khu quản lý trên thiết bị này.'],
];

export function trangThem() {
  const mucDuocPhep = MUC_THEM.filter(([duong]) => {
    if (!duong.startsWith('#/')) return true;   // "Xem trang lớp", "Đăng xuất" — luôn hiện
    return duocVaoTuyen(duong.slice(1));
  });

  // Trên màn hình rộng, cột trái đã liệt kê sẵn đúng các mục quản lý mà tài khoản này được
  // cấp quyền (xem locMenuTheoQuyen) — lặp lại y hệt bằng thẻ ở đây là thừa. Vào thẳng mục
  // đầu tiên được phép luôn, khỏi phải qua một trang "Thêm" chỉ để bấm tiếp. Trên điện
  // thoại thì cột trái ẩn đi (dùng tab dưới) nên trang Thêm vẫn là lối vào duy nhất — giữ
  // nguyên như cũ.
  if (PHIEN.role !== 'teacher' && matchMedia('(min-width: 900px)').matches) {
    const mucQuanLy = mucDuocPhep.filter(([duong]) => duong.startsWith('#/'));
    if (mucQuanLy.length) {
      location.hash = mucQuanLy[0][0].slice(1);
      return;
    }
  }

  const khung = e('div');
  // Với giáo viên, đây đúng là "còn vài công cụ khác" (đã có sẵn rất nhiều trang chính khác) —
  // nhưng với tài khoản cán sự, đây LÀ toàn bộ khu quản lý của họ (không có trang nào khác ngoài
  // các mục được cấp quyền liệt kê ở đây), gọi là "Thêm" dễ hiểu lầm thành vài mục lặt vặt.
  const tieuDePhu = PHIEN.role === 'teacher'
    ? 'Các công cụ khác của lớp'
    : layNhanTaiKhoan(PHIEN);
  khung.append(tieuDeTrang(PHIEN.role === 'teacher' ? 'Thêm' : 'Khu quản lý', tieuDePhu));

  if (!mucDuocPhep.length) {
    khung.append(e('div', 'the trong', 'Tài khoản này chưa được cấp quyền làm việc nào. Liên hệ giáo viên chủ nhiệm.'));
  }

  const ds = e('div', 'ds-the');
  mucDuocPhep.forEach(([duong, bieuTuong, ten, moTa]) => {
    const a = e('a', 'the-hs');
    a.href = duong;
    a.style.textDecoration = 'none';
    a.append(e('div', 'chu-cai', bieuTuong));
    const noi = e('div', 'noi');
    noi.append(e('b', null, ten), e('small', null, moTa));
    a.append(noi, e('div', 'canh-phai canh-phai-mui-ten', '›'));
    ds.append(a);
  });
  khung.append(ds);

  datNoiDung(KHUNG, khung);
}

/* ================= Trang: Hoạt động lớp ================= */

// Một mục giờ có thể gộp NHIỀU loại nội dung cùng lúc (văn bản + ảnh + video + âm thanh) —
// đọc trực tiếp từ các cột dữ liệu thực tế của mục đó, không còn dựa vào "item.loai" (cột này
// giờ chỉ mang tính mô tả, gộp các loại cách nhau bằng dấu phẩy).
export function nhanCacLoaiHoatDong(item) {
  const cac = [];
  if (item.tieuDe || item.chuThich) cac.push('📝 Văn bản');
  if (item.anhId || item.hinhUrl) cac.push('🖼 Ảnh');
  if (item.videoId || item.videoUrl) cac.push(`🎬 ${item.videoTen || 'Video'}`);
  if (item.amThanhId || item.amThanhUrl) cac.push(`🎵 ${item.amThanhTen || 'Âm thanh'}`);
  return cac.length ? cac.join(' · ') : '📎 (trống)';
}

export async function trangHoatDongLop(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  async function ve() {
    const d = await api('/api/gv/hoat-dong-lop');
    const khung = e('div');
    khung.append(tieuDeTrang('Hoạt động lớp', `${d.danhSach.length} mục đang hiện ở trang chủ`,
      nut('🛡️ Lịch sử & khôi phục', 'nut-vien nut-nho', () => { location.hash = '#/hoat-dong-lop-khoi-phuc'; }),
      nut('+ Thêm hoạt động', '', () => moHopThoaiThemHoatDong(ve))
    ));

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có mục nào — bấm "+ Thêm hoạt động" để đăng bài viết, ảnh, video hoặc âm thanh lên trang chủ.'));
    } else {
      const ds = e('div', 'ds-nhat-ky');
      d.danhSach.forEach((item) => {
        const m = e('div', 'muc-nhat-ky');
        const dong = e('div', 'dong-dau');
        dong.append(
          e('span', 'nhan nhan-xam', nhanCacLoaiHoatDong(item)),
          e('span', 'ngay', ngayVN(item.ngay))
        );
        // Xoá được nếu là giáo viên, hoặc tài khoản đặc biệt có ít nhất 1 trong các quyền liên
        // quan tới Hoạt động lớp — khớp đúng quyền máy chủ đã cho phép.
        const duocXoaHoatDong = PHIEN.role === 'teacher'
          || ['hoat-dong-lop', 'hinh-anh', 'am-thanh', 'video'].some((q) => (PHIEN.quyen || []).includes(q));
        if (duocXoaHoatDong) {
          const thaoTac = e('div');
          thaoTac.style.cssText = 'margin-left:auto;display:inline-flex';
          const nutXoa = nut('🗑 Gỡ', 'nut-nhe nut-nho', async () => {
            if (!confirm('Gỡ mục này khỏi trang chủ?')) return;
            try {
              await api('/api/gv/hoat-dong-lop?id=' + item.id, { method: 'DELETE' });
              nhac('Đã gỡ', 'tot');
              ve();
            } catch (err) { nhac(err.message, 'xau'); }
          });
          dong.append(nutXoa);
        }
        m.append(dong);
        if (item.tieuDe) {
          m.append(Object.assign(e('b', null, item.tieuDe), { style: 'display:block;margin-top:6px;' }));
        }
        if (item.chuThich) {
          const pNd = e('p', null, item.chuThich);
          pNd.style.cssText = 'white-space:pre-wrap;margin-top:4px;line-height:1.5;color:var(--chu);';
          m.append(pNd);
        }
        ds.append(m);
      });
      khung.append(ds);
    }

    datNoiDung(KHUNG, khung);
  }

  await ve();
}

/* ================= Khu Quản Trị: Tiêu Điểm, Hồ Sơ & Phòng Campus ================= */
