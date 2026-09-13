import { KHUNG, gioNgayVN } from '../lib.js';
import { dongDrawerChiTiet, dongDrawerDong, moDrawerChiTiet, taoNutMenuHanhDong } from './nguoi-dung.js';
import { trangThongBao } from './noi-dung.js';
import { api, datNoiDung, e, khoiDangTai, khoiLoi, nhac } from '/assets/js/chung.js';
import { nut, oNhap, tieuDeTrang, truong } from '/assets/js/giao-dien.js';


export async function trangCampusHighlights() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách Tiêu điểm Campus...'));
  try {
    const data = await api('/api/campus-highlights');
    const isCurated = Boolean(data.isCurated);
    const items = isCurated && Array.isArray(data.highlights) && data.highlights.length > 0 ? [...data.highlights] : [];

    const khung = e('div');
    khung.append(tieuDeTrang('✨ Biên Tập Tiêu Điểm Campus (Highlights)', 'Điều phối các thẻ nội dung nổi bật xuất hiện trên cột trái Digital Campus cho toàn trường. Dữ liệu lưu trữ máy chủ (Server-authoritative).'));

    // Status banner
    const banner = e('div');
    banner.style.cssText = 'padding: 10px 16px; border-radius: 12px; margin-bottom: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: space-between; gap: 12px;';
    if (isCurated) {
      banner.style.background = 'rgba(0, 242, 254, 0.1)';
      banner.style.border = '1px solid rgba(0, 242, 254, 0.3)';
      banner.style.color = '#00F2FE';
      banner.textContent = '⚡ Đang hiển thị bản Curation do Giáo viên xuất bản.';
    } else {
      banner.style.background = 'rgba(168, 85, 247, 0.1)';
      banner.style.border = '1px solid rgba(168, 85, 247, 0.3)';
      banner.style.color = '#C084FC';
      banner.textContent = '🤖 Đang dùng nguồn tự động từ dữ liệu hoạt động thực tế của trường.';
    }
    khung.append(banner);

    // Live preview container
    const vungPreview = e('div', 'the');
    vungPreview.style.cssText = 'background: #0B0E14; border: 1px solid rgba(0,242,254,0.3); border-radius: 16px; padding: 18px; margin-bottom: 24px;';

    const previewHeader = e('div');
    previewHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';
    previewHeader.innerHTML = '<span style="font-size: 13px; font-weight: 800; color: #00F2FE;">👁️ Xem trước Live (Giao diện cột trái Campus)</span><span style="font-size: 11px; color: var(--chu-nhat);">Tự động cập nhật khi chỉnh sửa</span>';
    vungPreview.append(previewHeader);

    const danhSachThePreview = e('div');
    danhSachThePreview.id = 'preview-highlights-list';
    danhSachThePreview.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;';
    vungPreview.append(danhSachThePreview);

    function vePreview() {
      danhSachThePreview.innerHTML = '';
      if (items.length === 0) {
        const trong = e('div');
        trong.id = 'preview-empty-text';
        trong.style.cssText = 'grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--chu-nhat); font-size: 13px; font-style: italic;';
        trong.textContent = 'Chưa có tiêu điểm nào. Bấm "+ Thêm Spotlight" hoặc "Dùng nguồn tự động" để khởi tạo.';
        danhSachThePreview.append(trong);
        return;
      }
      items.forEach((it) => {
        const the = e('div');
        the.style.cssText = 'background: #151A23; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; display: flex; align-items: center; gap: 12px;';
        the.innerHTML = `
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(0,242,254,0.15); border: 1px solid rgba(0,242,254,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px; shrink: 0;">${it.icon || it.bieuTuong || '⭐'}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <span style="font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 9999px; background: rgba(0,242,254,0.2); color: #00F2FE; text-transform: uppercase;">${it.badge || 'NỔI BẬT'}</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.title || it.tieuDe || 'Chưa có tiêu đề'}</div>
            <div style="font-size: 11px; color: var(--chu-nhat); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.subtitle || it.sub || it.chiTiet || 'Mô tả'}</div>
          </div>
        `;
        danhSachThePreview.append(the);
      });
    }

    vePreview();
    khung.append(vungPreview);

    // Editor container
    const vungEditor = e('div', 'the');
    vungEditor.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    const editorHeader = e('div');
    editorHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;';
    const tieuDeEditor = e('h3');
    tieuDeEditor.style.cssText = 'font-size: 15px; font-weight: 800; color: #fff; margin: 0;';
    tieuDeEditor.id = 'editor-highlights-title';
    tieuDeEditor.textContent = `Danh sách tiêu điểm (${items.length}/4)`;
    editorHeader.append(tieuDeEditor);

    const nutThem = nut('+ Thêm Spotlight', 'nut-phu', () => {
      if (items.length >= 4) {
        nhac('Tối đa 4 tiêu điểm nổi bật.', 'canh-bao');
        return;
      }
      items.push({
        id: 'spotlight-' + Date.now(),
        badge: 'SPOTLIGHT',
        category: 'Hoạt động',
        title: '',
        subtitle: '',
        icon: '✨',
        actionType: 'spotlight',
        loai: 'spotlight',
        sourceType: 'manual',
        audience: 'school'
      });
      veFormVaPreview();
    });
    nutThem.id = 'btn-them-spotlight';
    editorHeader.append(nutThem);
    vungEditor.append(editorHeader);

    const danhSachForm = e('div');
    danhSachForm.id = 'danh-sach-form-highlights';
    danhSachForm.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

    function veFormVaPreview() {
      tieuDeEditor.textContent = `Danh sách tiêu điểm (${items.length}/4)`;
      danhSachForm.innerHTML = '';

      if (items.length === 0) {
        const emptyBox = e('div');
        emptyBox.id = 'empty-highlights-state';
        emptyBox.style.cssText = 'padding: 32px; text-align: center; background: #0B0E14; border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px;';
        emptyBox.innerHTML = `
          <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
          <p style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px;">Chưa có tiêu điểm</p>
          <p style="font-size: 12px; color: var(--chu-nhat); margin-bottom: 16px;">Bấm nút "+ Thêm Spotlight" để tự biên soạn hoặc dùng nguồn dữ liệu tự động từ hệ thống.</p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="nut nut-chinh" id="btn-empty-them-spotlight">+ Thêm Spotlight</button>
            <button type="button" class="nut nut-phu" id="btn-empty-dung-tu-dong">🔄 Dùng nguồn tự động</button>
          </div>
        `;
        const bThem = emptyBox.querySelector('#btn-empty-them-spotlight');
        if (bThem) bThem.onclick = () => nutThem.click();
        const bTuDong = emptyBox.querySelector('#btn-empty-dung-tu-dong');
        if (bTuDong) bTuDong.onclick = () => nutReset.click();
        danhSachForm.append(emptyBox);
        vePreview();
        return;
      }

      items.forEach((it, idx) => {
        const hang = e('div');
        hang.className = 'item-highlight-card';
        hang.style.cssText = 'background: #151A23; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px;';

        const hangTieuDe = e('div');
        hangTieuDe.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';
        hangTieuDe.innerHTML = `
          <span style="font-size: 12px; font-weight: 800; color: #8B5CF6;">#${idx + 1} • ${it.sourceType === 'manual' ? 'Teacher Spotlight' : 'Tiêu điểm hoạt động'}</span>
        `;
        const nutXoa = nut('Xóa', 'nut-phu', () => {
          items.splice(idx, 1);
          veFormVaPreview();
        });
        nutXoa.style.padding = '4px 10px';
        nutXoa.style.fontSize = '11px';
        hangTieuDe.append(nutXoa);
        hang.append(hangTieuDe);

        const luoi = e('div');
        luoi.style.cssText = 'display: grid; grid-template-columns: 80px 130px 1fr 1fr; gap: 10px;';

        const nhapIcon = oNhap(`icon_${idx}`, 'text', it.icon || it.bieuTuong || '⭐', 'Icon');
        nhapIcon.style.textAlign = 'center';
        nhapIcon.oninput = (ev) => { it.icon = ev.target.value; it.bieuTuong = ev.target.value; vePreview(); };

        const nhapBadge = oNhap(`badge_${idx}`, 'text', it.badge || '', 'Huy hiệu');
        nhapBadge.oninput = (ev) => { it.badge = ev.target.value; vePreview(); };

        const nhapTitle = oNhap(`title_${idx}`, 'text', it.title || it.tieuDe || '', 'Tiêu đề ngắn');
        nhapTitle.oninput = (ev) => { it.title = ev.target.value; it.tieuDe = ev.target.value; vePreview(); };

        const nhapSubtitle = oNhap(`sub_${idx}`, 'text', it.subtitle || it.sub || it.chiTiet || '', 'Mô tả ngắn');
        nhapSubtitle.oninput = (ev) => { it.subtitle = ev.target.value; it.sub = ev.target.value; it.chiTiet = ev.target.value; vePreview(); };

        luoi.append(
          truong('Icon', nhapIcon),
          truong('Badge', nhapBadge),
          truong('Tiêu đề', nhapTitle),
          truong('Mô tả', nhapSubtitle)
        );

        hang.append(luoi);
        danhSachForm.append(hang);
      });

      vePreview();
    }

    veFormVaPreview();
    vungEditor.append(danhSachForm);

    // Actions
    const hangNut = e('div');
    hangNut.style.cssText = 'display: flex; align-items: center; gap: 12px; margin-top: 20px; flex-wrap: wrap;';

    const nutLuu = nut('🚀 Lưu & Xuất bản Server', 'nut-chinh', async () => {
      if (items.length === 0) {
        nhac('Vui lòng thêm tối thiểu 1 tiêu điểm trước khi xuất bản.', 'canh-bao');
        return;
      }
      nutLuu.disabled = true;
      nutLuu.textContent = 'Đang xuất bản...';
      try {
        const kq = await api('/api/campus-highlights', {
          method: 'POST',
          body: JSON.stringify({ action: 'publish', items })
        });
        if (kq.ok) {
          nhac('Đã xuất bản Tiêu điểm Campus thành công lên Server (Nguyên tử)!', 'tot');
          await trangCampusHighlights();
        } else {
          nhac('Không thể lưu: ' + (kq.message || kq.error || kq.loi), 'xau');
        }
      } catch (err) {
        nhac('Lỗi xuất bản: ' + err.message, 'xau');
      } finally {
        nutLuu.disabled = false;
        nutLuu.textContent = '🚀 Lưu & Xuất bản Server';
      }
    });

    const nutReset = nut('🔄 Dùng nguồn tự động (Khôi phục gốc)', 'nut-phu', async () => {
      if (!confirm('Khôi phục danh sách Tiêu điểm về mặc định tự động từ dữ liệu hoạt động thực tế?')) return;
      nutReset.disabled = true;
      nutReset.textContent = 'Đang khôi phục...';
      try {
        const kq = await api('/api/campus-highlights', {
          method: 'POST',
          body: JSON.stringify({ action: 'reset' })
        });
        if (kq.ok) {
          nhac('Đã chuyển sang nguồn dữ liệu tự động thời gian thực!', 'tot');
          await trangCampusHighlights();
        } else {
          nhac('Lỗi khôi phục: ' + (kq.message || kq.error || kq.loi), 'xau');
        }
      } catch (err) {
        nhac('Lỗi: ' + err.message, 'xau');
      } finally {
        nutReset.disabled = false;
        nutReset.textContent = '🔄 Dùng nguồn tự động (Khôi phục gốc)';
      }
    });

    hangNut.append(nutLuu, nutReset);
    vungEditor.append(hangNut);
    khung.append(vungEditor);

    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Không thể tải trang Tiêu điểm Campus: ' + err.message));
  }
}

export async function trangHoSoGiaoVien() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải thông tin hồ sơ giáo viên...'));
  try {
    const res = await api('/api/gv/ho-so');
    const hoSo = res.hoSo || {};

    const khung = e('div');
    khung.append(tieuDeTrang('👤 Hồ Sơ Giáo Viên', 'Tùy chỉnh thông tin hiển thị của giáo viên trên Campus, Bảng tin lớp và Khu quản trị. (Các quyền hệ thống và vai trò chính thức được bảo vệ máy chủ).'));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 680px;';

    // Preview
    const previewBox = e('div');
    previewBox.style.cssText = 'display: flex; align-items: center; gap: 16px; padding: 16px; background: #0B0E14; border: 1px solid rgba(0,242,254,0.25); border-radius: 14px; margin-bottom: 24px;';

    const previewAvatar = e('img');
    previewAvatar.src = hoSo.avatar || '/assets/hinh-anh/anh-lop-default.svg';
    previewAvatar.style.cssText = 'width: 56px; height: 56px; border-radius: 14px; object-fit: cover; border: 2px solid #00F2FE;';

    const previewInfo = e('div');
    previewInfo.style.cssText = 'flex: 1; min-width: 0;';
    const previewName = e('div', null, hoSo.tenHienThi || hoSo.tenDangNhap || 'Giáo viên');
    previewName.style.cssText = 'font-size: 15px; font-weight: 800; color: #fff;';
    const previewRole = e('div', null, 'Giáo Viên Chủ Nhiệm • ' + (hoSo.tenLop || 'Lớp 10A7'));
    previewRole.style.cssText = 'font-size: 11px; color: #8B5CF6; font-weight: 700; margin-top: 2px;';
    const previewTitle = e('div', null, hoSo.tieuDeHoSo || 'Chưa đặt tiêu đề giới thiệu');
    previewTitle.style.cssText = 'font-size: 11px; color: var(--chu-nhat); margin-top: 2px;';
    previewInfo.append(previewName, previewRole, previewTitle);

    previewBox.append(previewAvatar, previewInfo);
    the.append(previewBox);

    // Form inputs
    const oTen = oNhap('gv_ten_hien_thi', 'text', hoSo.tenHienThi || '', 'Ví dụ: Thầy Lê Đình Phát');
    oTen.oninput = (e) => { previewName.textContent = e.target.value.trim() || 'Giáo viên'; };

    const oAvatar = oNhap('gv_avatar', 'text', hoSo.avatar || '', 'URL ảnh đại diện hoặc /assets/...');
    oAvatar.oninput = (e) => { previewAvatar.src = e.target.value.trim() || '/assets/hinh-anh/anh-lop-default.svg'; };

    const oTieuDe = oNhap('gv_tieu_de', 'text', hoSo.tieuDeHoSo || '', 'Ví dụ: Giáo viên Chủ nhiệm Lớp 10A7 · Cố vấn học tập');
    oTieuDe.oninput = (e) => { previewTitle.textContent = e.target.value.trim() || 'Chưa đặt tiêu đề giới thiệu'; };

    the.append(
      truong('Tên hiển thị công khai', oTen, 'Tên xuất hiện trên bài đăng thông báo, phản hồi và danh sách thành viên'),
      truong('Ảnh đại diện (Avatar)', oAvatar, 'Đường dẫn ảnh đại diện an toàn (HTTPS hoặc nội bộ)'),
      truong('Tiêu đề / Lời giới thiệu ngắn', oTieuDe, 'Dòng giới thiệu chức danh hoặc thông điệp ngắn gọn')
    );

    // Security Info (Read-only)
    const securityBox = e('div');
    securityBox.style.cssText = 'margin-top: 18px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; font-size: 11px; color: var(--chu-nhat);';
    securityBox.innerHTML = `
      <div style="font-weight: 700; color: var(--chu); margin-bottom: 4px;">🔒 Thông tin định danh bảo mật (Bất biến)</div>
      <div>Tài khoản: <b>${hoSo.tenDangNhap || '—'}</b> | Vai trò hệ thống: <b style="color:#00F2FE;">${hoSo.vaiTro || 'teacher'}</b> | Lớp quản lý: <b>${hoSo.tenLop || 'Lớp 10A7'}</b></div>
      <div style="font-size: 10px; margin-top: 4px; color: var(--chu-nhat);">Quyền quản trị và phân bổ lớp chỉ có thể thay đổi qua quy trình điều phối máy chủ.</div>
    `;
    the.append(securityBox);

    // Action button
    const nutLuu = nut('💾 Lưu thông tin hồ sơ', 'nut-chinh', async () => {
      nutLuu.disabled = true;
      nutLuu.textContent = 'Đang lưu...';
      try {
        const kq = await api('/api/gv/ho-so', {
          method: 'POST',
          body: JSON.stringify({
            tenHienThi: oTen.value.trim(),
            avatar: oAvatar.value.trim(),
            tieuDeHoSo: oTieuDe.value.trim()
          })
        });
        if (kq.ok) {
          nhac('Đã cập nhật hồ sơ giáo viên thành công!', 'tot');
          await trangHoSoGiaoVien();
        } else {
          nhac('Không thể lưu hồ sơ: ' + (kq.message || kq.error), 'xau');
        }
      } catch (err) {
        nhac('Lỗi lưu hồ sơ: ' + err.message, 'xau');
      } finally {
        nutLuu.disabled = false;
        nutLuu.textContent = '💾 Lưu thông tin hồ sơ';
      }
    });
    nutLuu.style.marginTop = '20px';
    the.append(nutLuu);

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi khi tải hồ sơ: ' + err.message));
  }
}

export const NHAN_LOAI_PHONG = { chat: '💬 Chat', video: '▶️ Video', nhac: '🎵 Nhạc' };
export const NHAN_VAI_TRO_PHONG = { giao_vien: 'Giáo viên', hoc_sinh: 'Học sinh' };

export async function thucHienDongPhong(p, veLai) {
  if (!confirm(`Đóng phòng "${p.ten}"? Toàn bộ thành viên đang trong phòng sẽ bị đưa ra ngoài.`)) return;
  try {
    await api('/api/gv/phong-quan-tri', { method: 'POST', than: { phongId: p.id } });
    nhac('Đã đóng phòng.', 'tot');
    dongDrawerChiTiet();
    if (veLai) veLai();
  } catch (err) {
    nhac('Không thực hiện được: ' + err.message, 'loi');
  }
}

export async function moChiTietPhong(p, veLai) {
  let d;
  try {
    d = await api('/api/gv/phong-quan-tri?id=' + p.id);
  } catch (err) {
    nhac('Không tải được chi tiết: ' + err.message, 'loi');
    return;
  }
  const ph = d.phong;
  const than = e('div');
  than.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

  const nhomChinh = e('div');
  nhomChinh.append(e('p', 'drawer-qt-nhom-nhan', 'Thông tin'));
  nhomChinh.append(dongDrawerDong('Loại phòng', NHAN_LOAI_PHONG[ph.loai] || ph.loai));
  nhomChinh.append(dongDrawerDong('Phạm vi', ph.phamVi === 'lop' ? ('Lớp ' + (ph.lopTen || ph.lopId || '')) : 'Toàn trường'));
  nhomChinh.append(dongDrawerDong('Chủ phòng', ph.chuPhongTen));
  nhomChinh.append(dongDrawerDong('Chế độ truy cập', ph.accessMode === 'password' ? 'Có mật khẩu' : 'Công khai'));
  nhomChinh.append(dongDrawerDong('Sức chứa', ph.sucChua));
  nhomChinh.append(dongDrawerDong('Tạo lúc', gioNgayVN(ph.taoLuc)));
  than.append(nhomChinh);

  const nhomTv = e('div');
  nhomTv.append(e('p', 'drawer-qt-nhom-nhan', `Thành viên đang trong phòng (${(d.thanhVien || []).length})`));
  if ((d.thanhVien || []).length === 0) {
    nhomTv.append(Object.assign(e('p', null, 'Hiện không có ai trong phòng.'), { style: 'color: var(--chu-nhat); font-size: 12.5px; margin: 0;' }));
  } else {
    d.thanhVien.forEach((tv) => {
      const dong = e('div', 'drawer-qt-dong');
      dong.append(
        e('span', null, tv.ten + (tv.laChuPhong ? ' (chủ phòng)' : '')),
        e('span', null, NHAN_VAI_TRO_PHONG[tv.vaiTro] || tv.vaiTro)
      );
      nhomTv.append(dong);
    });
  }
  than.append(nhomTv);

  const nutDong = e('button', 'nut nut-xau nut-nho', '🚫 Đóng phòng');
  nutDong.type = 'button';
  nutDong.style.cssText = 'width: 100%;';
  nutDong.onclick = () => thucHienDongPhong(ph, veLai);
  than.append(nutDong);

  moDrawerChiTiet(ph.ten, than);
}

export async function trangPhongCampus() {
  let loaiLoc = 'tat-ca';
  const BO_LOC = [
    { id: 'tat-ca', nhan: 'Tất cả' },
    { id: 'chat', nhan: '💬 Chat' },
    { id: 'video', nhan: '▶️ Video' },
    { id: 'nhac', nhan: '🎵 Nhạc' },
  ];

  function ve(danhSach) {
    const khung = e('div');
    khung.append(tieuDeTrang('🏛️ Giám Sát Phòng Campus', 'Phòng đang mở trong phạm vi quản trị — xem thành viên hoặc đóng phòng vi phạm.'));

    const thanhLoc = e('div');
    thanhLoc.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;';
    BO_LOC.forEach((f) => {
      thanhLoc.append(nut(f.nhan, f.id === loaiLoc ? 'nut-chinh nut-nho' : 'nut-vien nut-nho', () => {
        loaiLoc = f.id;
        taiVaVe();
      }));
    });
    khung.append(thanhLoc);

    if (danhSach.length === 0) {
      const rong = e('div', 'the', 'Không có phòng nào đang mở khớp bộ lọc hiện tại.');
      rong.style.cssText = 'padding: 28px; text-align:center; color: var(--chu-nhat); font-size: 13px;';
      khung.append(rong);
      datNoiDung(KHUNG, khung);
      return;
    }

    const bocBang = e('div', 'bang-qt-boc');
    const bang = e('table', 'bang-qt');
    const trHead = e('tr');
    ['Tên phòng', 'Loại', 'Phạm vi', 'Chủ phòng', 'Thành viên', ''].forEach((c) => trHead.append(e('th', null, c)));
    const thead = e('thead');
    thead.append(trHead);
    const tbody = e('tbody');

    danhSach.forEach((p) => {
      const tr = e('tr');
      tr.append(
        e('td', null, p.ten || 'Phòng không tên'),
        e('td', null, NHAN_LOAI_PHONG[p.loai] || p.loai),
        e('td', null, p.phamVi === 'lop' ? ('Lớp ' + (p.lopTen || p.lopId || '')) : 'Toàn trường'),
        e('td', null, p.chuPhongTen || '—'),
        e('td', null, String(p.soNguoi || 0))
      );
      const tdHd = e('td');
      tdHd.append(taoNutMenuHanhDong([
        { nhan: 'Xem chi tiết', onClick: () => moChiTietPhong(p, taiVaVe) },
        { nhan: 'Đóng phòng', onClick: () => thucHienDongPhong(p, taiVaVe), nguyHiem: true },
      ]));
      tr.append(tdHd);
      tr.onclick = () => moChiTietPhong(p, taiVaVe);
      tbody.append(tr);
    });

    bang.append(thead, tbody);
    bocBang.append(bang);
    khung.append(bocBang);
    datNoiDung(KHUNG, khung);
  }

  async function taiVaVe() {
    datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách phòng Campus...'));
    try {
      const qs = loaiLoc !== 'tat-ca' ? ('?loai=' + loaiLoc) : '';
      const d = await api('/api/gv/phong-quan-tri' + qs);
      ve(d.danhSach || []);
    } catch (err) {
      datNoiDung(KHUNG, khoiLoi('Không tải được danh sách phòng: ' + err.message));
    }
  }

  await taiVaVe();
}



/* ================= Khu Quản Trị: Tổng Quan, Báo Cáo, Duyệt Giáo Viên, Mã & Ban Biên Tập ================= */

export async function trangCampus() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải dữ liệu hoạt động Campus...'));
  try {
    const [resPhong, resGame, resHl] = await Promise.allSettled([
      api('/api/phong?phamVi=truong'),
      api('/api/game?action=danh_sach'),
      api('/api/campus-highlights')
    ]);
    const dsPhong = resPhong.status === 'fulfilled' && Array.isArray(resPhong.value?.phong) ? resPhong.value.phong : [];
    const dsGame = resGame.status === 'fulfilled' && Array.isArray(resGame.value?.danhSach) ? resGame.value.danhSach : [];
    const dsHl = resHl.status === 'fulfilled' && Array.isArray(resHl.value?.highlights) ? resHl.value.highlights : [];
    const dsYt = dsPhong.filter(p => p.loai === 'video');

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🏛️ Quản Trị Hoạt Động Campus',
      'Giám sát phòng trực tuyến, không gian học tập YouTube, đấu trường Game Caro và Tiêu điểm trường học.'
    ));

    // Nav Subtabs (Hoạt động, YouTube, Game, Tiêu điểm)
    const subtabs = e('div');
    subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
    const taoNutSubtab = (nhan, href, laChinh = false) => {
      const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
      a.href = href;
      a.style.cssText = 'border-radius: 12px; font-weight: 700;';
      return a;
    };
    subtabs.append(
      taoNutSubtab('🏠 Giám sát phòng', '#/phong-campus', true),
      taoNutSubtab('✨ Tiêu điểm Campus', '#/campus-highlights')
    );
    khung.append(subtabs);

    // Cards Grid
    const luoi = e('div');
    luoi.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;';

    // Helper to build room item
    const taoMucPhong = (p) => {
      const item = e('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--nen); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--vien);';
      const trai = e('div');
      const ten = Object.assign(e('div', null, p.ten || 'Phòng học'), { style: 'color: var(--chu); font-size: 12px; font-weight: 700;' });
      const phu = Object.assign(e('div', null, 'Chủ phòng: ' + (p.chuPhongTen || 'Học sinh') + ' · ' + (p.soNguoi || 0) + ' người'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 10px;' });
      trai.append(ten, phu);

      const aGiamSat = e('a', 'nut nut-phu nut-nho', 'Giám sát');
      aGiamSat.href = '#/phong-campus';
      aGiamSat.style.cssText = 'font-size: 10px;';
      item.append(trai, aGiamSat);
      return item;
    };

    // Đầu thẻ dùng chung: icon trong khối glow màu + tiêu đề + huy hiệu số — cùng ngôn ngữ
    // hình ảnh với .the-qt ở Tổng quan, thay vì mảng màu phẳng #121620 lạc tông trước đây.
    const dauThe = (icon, ten, mau, huyHieu) => {
      const dau = e('div');
      dau.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px;';
      const trai = e('div');
      trai.style.cssText = 'display: flex; align-items: center; gap: 10px;';
      trai.append(
        Object.assign(e('span', 'the-qt-icon', icon), { style: `width: 38px; height: 38px; font-size: 18px; --mau-qt: ${mau};` }),
        Object.assign(e('b', null, ten), { style: 'color: var(--chu); font-size: 15px;' })
      );
      dau.append(trai, Object.assign(e('span', null, huyHieu), {
        style: `background: color-mix(in srgb, ${mau} 16%, transparent); color: ${mau}; padding: 2px 9px; border-radius: 10px; font-size: 11px; font-weight: 700; white-space: nowrap;`
      }));
      return dau;
    };

    // 1. Card YouTube
    const cardYt = e('div', 'the');
    cardYt.style.cssText = 'border-color: color-mix(in srgb, #EF4444 30%, var(--vien)); padding: 20px;';
    const moTaYt = Object.assign(e('p', null, 'Phòng chiếu video học tập và thảo luận nhóm đang trực tuyến.'), { style: 'color: var(--chu-nhat); font-size: 12px; margin-bottom: 14px;' });
    const dsYtDiv = e('div');
    dsYtDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    if (dsYt.length === 0) {
      dsYtDiv.append(Object.assign(e('div', null, 'Chưa có phòng YouTube nào đang mở.'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 12px; text-align: center; padding: 12px;' }));
    } else {
      dsYt.forEach(p => dsYtDiv.append(taoMucPhong(p)));
    }
    cardYt.append(dauThe('▶️', 'Học Tập / YouTube Study', '#EF4444', dsYt.length + ' phòng'), moTaYt, dsYtDiv);

    // 2. Card Game Caro
    const cardGame = e('div', 'the');
    cardGame.style.cssText = 'border-color: color-mix(in srgb, #F59E0B 30%, var(--vien)); padding: 20px;';
    const activeCaro = dsGame.filter(b => b.trangThai === 'dang_choi').length;
    const waitingCaro = dsGame.filter(b => b.trangThai === 'cho_nguoi').length;

    const moTaGame = Object.assign(e('p', null, 'Trận đấu cờ Caro 15x15 thời gian thực giữa học sinh.'), { style: 'color: var(--chu-nhat); font-size: 12px; margin-bottom: 14px;' });
    const luoiGameStats = e('div');
    luoiGameStats.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;';
    const oStat1 = e('div');
    oStat1.style.cssText = 'background: var(--nen); padding: 10px; border-radius: 10px; text-align: center;';
    oStat1.append(Object.assign(e('div', null, String(activeCaro)), { style: 'color: #F59E0B; font-size: 18px; font-weight: 900;' }), Object.assign(e('div', null, 'Đang thi đấu'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' }));

    const oStat2 = e('div');
    oStat2.style.cssText = 'background: var(--nen); padding: 10px; border-radius: 10px; text-align: center;';
    oStat2.append(Object.assign(e('div', null, String(waitingCaro)), { style: 'color: #10B981; font-size: 18px; font-weight: 900;' }), Object.assign(e('div', null, 'Đang chờ đối thủ'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 11px;' }));
    luoiGameStats.append(oStat1, oStat2);

    const linkCampusGame = e('a', 'nut nut-vien nut-nho', 'Xem trực tiếp trên Campus →');
    linkCampusGame.href = '/';
    linkCampusGame.target = '_blank';
    linkCampusGame.style.cssText = 'width: 100%; text-align: center; display: block;';
    cardGame.append(dauThe('🎮', 'Đấu Trường Caro', '#F59E0B', (activeCaro + waitingCaro) + ' bàn'), moTaGame, luoiGameStats, linkCampusGame);

    // 3. Card Tiêu Điểm Campus
    const cardHl = e('div', 'the');
    cardHl.style.cssText = 'border-color: color-mix(in srgb, #00F2FE 30%, var(--vien)); padding: 20px;';
    const moTaHl = Object.assign(e('p', null, 'Điều phối nội dung nổi bật xuất hiện tại cột trái Digital Campus.'), { style: 'color: var(--chu-nhat); font-size: 12px; margin-bottom: 14px;' });
    const dsHlDiv = e('div');
    dsHlDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    if (dsHl.length === 0) {
      dsHlDiv.append(Object.assign(e('div', null, 'Chưa có thẻ tiêu điểm nào.'), { style: 'color: var(--chu-mo, var(--chu-nhat)); font-size: 12px; text-align: center; padding: 12px;' }));
    } else {
      dsHl.slice(0, 4).forEach(h => {
        const row = e('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; background: var(--nen); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--vien);';
        row.append(
          Object.assign(e('span', null, h.icon || '⭐'), { style: 'font-size: 16px;' }),
          Object.assign(e('span', null, h.title || h.tieuDe || 'Tiêu điểm'), { style: 'color: var(--chu); font-size: 12px; font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' })
        );
        dsHlDiv.append(row);
      });
    }
    const linkBienTapHl = e('a', 'nut nut-chinh nut-nho', 'Chỉnh sửa Tiêu điểm →');
    linkBienTapHl.href = '#/campus-highlights';
    linkBienTapHl.style.cssText = 'width: 100%; text-align: center; display: block; margin-top: 12px;';
    cardHl.append(dauThe('✨', 'Tiêu Điểm Campus', '#00F2FE', dsHl.length + '/4 thẻ'), moTaHl, dsHlDiv, linkBienTapHl);

    luoi.append(cardYt, cardGame, cardHl);
    khung.append(luoi);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi khi tải quản trị Campus: ' + err.message));
  }
}

export async function trangBangTin() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '📢 Quản Trị Nội Dung',
    'Soạn thảo thông báo trường học, tin tức bảng tin lớp, phân quyền ban biên tập và quản lý thư viện media.'
  ));

  const subtabs = e('div');
  subtabs.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;';
  const taoNut = (nhan, href, laChinh = false) => {
    const a = e('a', laChinh ? 'nut nut-chinh nut-nho' : 'nut nut-vien nut-nho', nhan);
    a.href = href;
    a.style.cssText = 'border-radius: 12px; font-weight: 700;';
    return a;
  };
  subtabs.append(
    taoNut('📢 Thông báo', '#/thong-bao', true),
    taoNut('✍️ Ban biên tập', '#/bien-tap-vien'),
    taoNut('🖼️ Thư viện Ảnh', '#/hinh-anh'),
    taoNut('🎵 Thư viện Âm thanh', '#/thu-vien-am-thanh'),
    taoNut('🎬 Thư viện Video', '#/thu-vien-video')
  );
  khung.append(subtabs);

  // Directly load announcements
  const vungNoiDung = e('div');
  khung.append(vungNoiDung);
  datNoiDung(KHUNG, khung);
  await trangThongBao();
}
