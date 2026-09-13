import { dieuHuong } from '../app.js';
import { KHUNG, PHAM_VI_LOP_ID, PHIEN, datPhamVi } from '../lib.js';
import { trangHoSoGiaoVien } from './campus.js';
import { trangHocSinh } from './hoc-sinh.js';
import { api, datNoiDung, e, khoiDangTai, khoiLoi, nhac } from '/assets/js/chung.js';
import { nut, tieuDeTrang } from '/assets/js/giao-dien.js';


// Admin IA v1 — School Admin đang ở "Toàn trường" (chưa chọn lớp cụ thể) thì Lớp học không có
// dữ liệu tường minh để hiện (Học sinh/Điểm danh/Quỹ... vốn là dữ liệu riêng từng lớp) — bắt chọn
// 1 lớp trước, dùng chung PHAM_VI_LOP_ID/datPhamVi với bộ chọn "Phạm vi" ở top bar (1 khái niệm
// scope duy nhất toàn khu quản trị, không tách riêng cho từng domain).
export async function trangChonLopHoc() {
  datNoiDung(KHUNG, khoiDangTai());
  let dsLop = [];
  let loiTai = '';
  try {
    const res = await api('/api/gv/lop-can-chu-y');
    dsLop = Array.isArray(res?.danhSach) ? res.danhSach : [];
  } catch (err) {
    loiTai = err.message;
  }

  const khung = e('div');
  khung.append(tieuDeTrang(
    '👥 Quản Trị Lớp Học & Thành Viên',
    'Chọn một lớp để xem học sinh, điểm danh, thủ quỹ lớp, thời khóa biểu và mã truy cập.'
  ));

  if (loiTai) {
    khung.append(khoiLoi(loiTai));
    datNoiDung(KHUNG, khung);
    return;
  }

  const luoi = e('div', 'luoi-qt');
  if (!dsLop.length) {
    luoi.append(e('div', 'the', 'Chưa có lớp nào trong hệ thống.'));
  }
  dsLop.forEach((l) => {
    const the = e('div', 'the the-qt');
    the.style.cssText = 'cursor: pointer;';
    the.style.setProperty('--mau-qt', '#38BDF8');

    const boxChu = e('div');
    boxChu.append(
      e('h3', 'the-qt-ten', l.ten || ('Lớp ' + l.lopId)),
      e('p', 'the-qt-mota', 'Học sinh · Điểm danh · Thủ quỹ · Thời khóa biểu · Mã truy cập')
    );
    const dau = e('div', 'the-qt-dau');
    dau.append(e('span', 'the-qt-icon', '🏫'), boxChu);
    the.append(dau);

    const so = e('div', 'the-qt-so');
    if (l.chuaDiemDanhHomNay) so.append(e('b', null, '⚠️ Chưa điểm danh'), e('span', null, ' hôm nay'));
    else so.append(e('span', null, '✅ Đã điểm danh hôm nay'));
    the.append(so);

    the.onclick = () => {
      datPhamVi(l.lopId);
      const sel = document.getElementById('adminScopeSelect');
      if (sel && Array.from(sel.options).some((o) => o.value === String(l.lopId))) sel.value = String(l.lopId);
      dieuHuong();
    };
    luoi.append(the);
  });
  khung.append(luoi);

  datNoiDung(KHUNG, khung);
}

export async function trangLopThanhVien() {
  if (PHIEN.isSchoolAdmin && !PHAM_VI_LOP_ID) return trangChonLopHoc();

  const khung = e('div');
  khung.append(tieuDeTrang(
    '👥 Quản Trị Lớp Học & Thành Viên',
    'Danh sách học sinh, sổ chuyên cần điểm danh, thủ quỹ lớp, thời khóa biểu và mã truy cập cộng đồng.'
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
    taoNut('👥 Học sinh', '#/hoc-sinh', true),
    taoNut('📋 Điểm danh', '#/diem-danh'),
    taoNut('💰 Thủ quỹ lớp', '#/quy'),
    taoNut('📅 Thời khóa biểu', '#/thoi-khoa-bieu'),
    taoNut('🔑 Mã cộng đồng', '#/ma-cong-dong'),
    taoNut('🔐 Cán sự lớp', '#/ma-ca-nhan')
  );
  khung.append(subtabs);

  datNoiDung(KHUNG, khung);
  await trangHocSinh();
}

export async function trangKiemDuyet() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '🛡️ Trung Tâm Kiểm Duyệt & An Toàn',
    'Xử lý báo cáo vi phạm nội dung Campus / Tin nhắn riêng và phê duyệt tài khoản giáo viên đăng ký.'
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
    taoNut('🚩 Báo cáo vi phạm', '#/bao-cao-vi-pham', true),
    taoNut('🛡️ Duyệt giáo viên', '#/duyet-giao-vien')
  );
  khung.append(subtabs);

  datNoiDung(KHUNG, khung);
  await trangBaoCaoViPham('all');
}

export async function trangHeThong() {
  const khung = e('div');
  khung.append(tieuDeTrang(
    '⚙️ Quản Trị Hệ Thống',
    'Cập nhật hồ sơ cá nhân giáo viên, xuất file báo cáo tổng hợp, kiểm tra nhật ký đăng nhập và reset dữ liệu.'
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
    taoNut('👤 Hồ sơ giáo viên', '#/ho-so-gv', true),
    taoNut('📑 Báo cáo & Xuất file', '#/bao-cao'),
    taoNut('📋 Nhật ký đăng nhập', '#/nhat-ky-dang-nhap'),
    taoNut('⚠️ Reset dữ liệu', '#/reset-du-lieu')
  );
  khung.append(subtabs);

  datNoiDung(KHUNG, khung);
  await trangHoSoGiaoVien();
}


export async function trangBaoCaoViPham(trangThaiLoc = 'all') {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách báo cáo vi phạm...'));
  try {
    const url = trangThaiLoc === 'all' ? '/api/gv/bao-cao' : ('/api/gv/bao-cao?status=' + trangThaiLoc);
    const res = await api(url);
    const reports = Array.isArray(res.reports) ? res.reports : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🚩 Hàng Đợi Kiểm Duyệt Báo Cáo Vi Phạm',
      'Xem xét và xử lý các báo cáo vi phạm tin nhắn, hành vi từ học sinh trên Campus.'
    ));

    const thanhLoc = e('div');
    thanhLoc.style.cssText = 'display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap;';
    [
      { id: 'all', label: 'Tất cả' },
      { id: 'pending', label: 'Đang chờ' },
      { id: 'resolved', label: 'Đã xử lý' },
      { id: 'dismissed', label: 'Đã bỏ qua' }
    ].forEach((f) => {
      const b = nut(f.label, f.id === trangThaiLoc ? 'nut-chinh nut-nho' : 'nut-vien nut-nho', () => {
        trangBaoCaoViPham(f.id);
      });
      thanhLoc.append(b);
    });
    khung.append(thanhLoc);

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (reports.length === 0) {
      the.append(Object.assign(e('p', null, 'Không có báo cáo nào trong mục này.'), {
        style: 'text-align: center; color: var(--chu-nhat); padding: 32px 0;'
      }));
    } else {
      const danhSach = e('div');
      danhSach.style.cssText = 'display: flex; flex-direction: column; gap: 14px;';

      reports.forEach((r) => {
        const item = e('div');
        item.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;';

        const headerDong = e('div');
        headerDong.style.cssText = 'display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;';

        const cotTrai = e('div');
        cotTrai.style.cssText = 'font-size: 13px;';
        const bReporter = e('b', null, r.reporterName || 'Học sinh');
        bReporter.style.color = '#FFFFFF';
        const spanDaBaoCao = e('span', null, ' đã báo cáo ');
        spanDaBaoCao.style.color = 'var(--chu-nhat)';
        const bTarget = e('b', null, r.targetName || 'Thành viên');
        bTarget.style.color = '#FFB800';
        cotTrai.append(bReporter, ' (@' + (r.reporterUsername || '') + ')', spanDaBaoCao, bTarget, ' (@' + (r.targetUsername || '') + ')');

        const cotPhai = e('div');
        cotPhai.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        const nhanTrangThai = e(
          'span',
          r.status === 'resolved' ? 'nhan-tot' : r.status === 'dismissed' ? 'nhan-xam' : 'nhan-canh-bao',
          r.status === 'resolved' ? 'Đã xử lý' : r.status === 'dismissed' ? 'Đã bỏ qua' : 'Đang chờ'
        );
        const spanTime = e('span', null, r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '');
        spanTime.style.cssText = 'font-size: 11px; color: var(--chu-nhat);';
        cotPhai.append(nhanTrangThai, spanTime);

        headerDong.append(cotTrai, cotPhai);
        item.append(headerDong);

        const lyDoBox = e('div');
        lyDoBox.style.cssText = 'font-size: 12px; color: var(--chu); background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);';
        lyDoBox.append(Object.assign(e('b', null, 'Lý do báo cáo: '), { style: 'color: var(--chu-nhat);' }), r.reason || '—');
        item.append(lyDoBox);

        if (r.reportedMessageContent) {
          const msgBox = e('div');
          msgBox.style.cssText = 'font-size: 12px; color: #FDE68A; background: rgba(245,158,11,0.08); padding: 10px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.2);';
          msgBox.append(Object.assign(e('b', null, 'Nội dung tin nhắn bị báo cáo: '), { style: 'display: block; margin-bottom: 2px;' }), '"' + r.reportedMessageContent + '"');
          item.append(msgBox);
        }

        if (r.status === 'pending') {
          const nutDong = e('div');
          nutDong.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;';

          const nutBoQua = nut('Bỏ qua', 'nut-vien nut-nho', async () => {
            try {
              const resAct = await api('/api/gv/bao-cao', {
                method: 'POST',
                body: JSON.stringify({ reportId: r.id, action: 'dismiss' })
              });
              if (resAct.ok) {
                nhac('Đã bỏ qua báo cáo', 'tot');
                await trangBaoCaoViPham(trangThaiLoc);
              } else {
                nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
              }
            } catch (err) {
              nhac('Lỗi: ' + err.message, 'xau');
            }
          });

          const nutXuLy = nut('Xử lý vi phạm', 'nut-chinh nut-nho', async () => {
            try {
              const resAct = await api('/api/gv/bao-cao', {
                method: 'POST',
                body: JSON.stringify({ reportId: r.id, action: 'resolve' })
              });
              if (resAct.ok) {
                nhac('Đã đánh dấu xử lý vi phạm', 'tot');
                await trangBaoCaoViPham(trangThaiLoc);
              } else {
                nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
              }
            } catch (err) {
              nhac('Lỗi: ' + err.message, 'xau');
            }
          });

          nutDong.append(nutBoQua, nutXuLy);
          item.append(nutDong);
        }

        danhSach.append(item);
      });

      the.append(danhSach);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải báo cáo vi phạm: ' + err.message));
  }
}

export async function trangDuyetGiaoVien() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách giáo viên chờ duyệt...'));
  try {
    const res = await api('/api/gv/duyet-giao-vien');
    const pendingTeachers = Array.isArray(res.pendingTeachers) ? res.pendingTeachers : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🛡️ Phê Duyệt Tài Khoản Giáo Viên',
      'Xem xét và phê duyệt các yêu cầu cấp quyền giáo viên từ tài khoản Campus.'
    ));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (pendingTeachers.length === 0) {
      the.append(Object.assign(e('p', null, 'Không có tài khoản giáo viên nào đang chờ phê duyệt.'), {
        style: 'text-align: center; color: var(--chu-nhat); padding: 32px 0;'
      }));
    } else {
      const bang = e('table', 'khung-bang');
      const thead = e('thead');
      const trHead = e('tr');
      trHead.append(
        e('th', null, 'Họ và tên'),
        e('th', null, 'Tên đăng nhập'),
        e('th', null, 'Thời gian đăng ký'),
        Object.assign(e('th', null, 'Thao tác'), { style: 'text-align: right;' })
      );
      thead.append(trHead);
      bang.append(thead);

      const tbody = e('tbody');
      pendingTeachers.forEach((t) => {
        const tr = e('tr');
        const tdTen = e('td');
        tdTen.append(e('b', null, t.tenHienThi || '—'));

        const tdAcc = e('td');
        const codeAcc = e('span', null, '@' + (t.tenDangNhap || ''));
        codeAcc.style.cssText = 'color: #00F2FE; font-family: monospace;';
        tdAcc.append(codeAcc);

        const tdTime = e('td', null, t.taoLuc ? new Date(t.taoLuc).toLocaleString('vi-VN') : '—');

        const tdAct = e('td');
        tdAct.style.cssText = 'text-align: right;';

        const btnApprove = nut('✓ Phê duyệt', 'nut-chinh nut-nho', async () => {
          if (!confirm('Phê duyệt tài khoản giáo viên ' + t.tenHienThi + '?')) return;
          try {
            const resAct = await api('/api/gv/duyet-giao-vien', {
              method: 'POST',
              body: JSON.stringify({ accountId: t.id, action: 'approve' })
            });
            if (resAct.ok) {
              nhac('Đã phê duyệt tài khoản giáo viên!', 'tot');
              await trangDuyetGiaoVien();
            } else {
              nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
            }
          } catch (err) {
            nhac('Lỗi: ' + err.message, 'xau');
          }
        });

        const btnReject = nut('✕ Từ chối', 'nut-phu nut-nho', async () => {
          if (!confirm('Từ chối tài khoản giáo viên ' + t.tenHienThi + '?')) return;
          try {
            const resAct = await api('/api/gv/duyet-giao-vien', {
              method: 'POST',
              body: JSON.stringify({ accountId: t.id, action: 'reject' })
            });
            if (resAct.ok) {
              nhac('Đã từ chối tài khoản', 'tot');
              await trangDuyetGiaoVien();
            } else {
              nhac('Lỗi: ' + (resAct.loi || resAct.error), 'xau');
            }
          } catch (err) {
            nhac('Lỗi: ' + err.message, 'xau');
          }
        });
        btnReject.style.marginLeft = '6px';

        tdAct.append(btnApprove, btnReject);
        tr.append(tdTen, tdAcc, tdTime, tdAct);
        tbody.append(tr);
      });

      bang.append(tbody);
      the.append(bang);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi duyệt giáo viên: ' + err.message));
  }
}

export async function trangMaCongDong() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách mã truy cập cộng đồng...'));
  try {
    const res = await api('/api/gv/ma-cong-dong');
    const danhSachMa = Array.isArray(res.danhSachMa) ? res.danhSachMa : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '🔑 Quản Lý Mã Truy Cập Bảng Tin Cộng Đồng',
      'Cấp mã mời và giám sát học sinh tham gia Bảng tin cộng đồng của lớp.'
    ));

    const thanhTacVu = e('div');
    thanhTacVu.style.cssText = 'display: flex; justify-content: flex-end; margin-bottom: 16px;';
    const nutTaoMa = nut('+ Tạo mã mời mới', 'nut-chinh', async () => {
      const tenGoi = prompt('Nhập ghi chú cho mã mời (ví dụ: Mã tuần 1, Mã tổ 1...):', 'Mã mời học sinh');
      if (!tenGoi) return;
      try {
        const resTao = await api('/api/gv/ma-cong-dong', {
          method: 'POST',
          body: JSON.stringify({ hanhDong: 'tao_ma_nhanh', tenGoi })
        });
        if (resTao.ok) {
          alert('Mã mời mới tạo thành công: ' + (resTao.maHienThi || resTao.ma));
          await trangMaCongDong();
        } else {
          nhac('Lỗi: ' + (resTao.loi || resTao.error), 'xau');
        }
      } catch (err) {
        nhac('Lỗi: ' + err.message, 'xau');
      }
    });
    thanhTacVu.append(nutTaoMa);
    khung.append(thanhTacVu);

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    if (danhSachMa.length === 0) {
      the.append(Object.assign(e('p', null, 'Chưa có mã truy cập nào được tạo. Bấm "+ Tạo mã mời mới" phía trên.'), {
        style: 'text-align: center; color: var(--chu-nhat); padding: 32px 0;'
      }));
    } else {
      const bang = e('table', 'khung-bang');
      const thead = e('thead');
      const trHead = e('tr');
      trHead.append(
        e('th', null, 'Ghi chú'),
        e('th', null, 'Mã hiển thị'),
        e('th', null, 'Học sinh sử dụng'),
        e('th', null, 'Thời gian dùng'),
        e('th', null, 'Trạng thái')
      );
      thead.append(trHead);
      bang.append(thead);

      const tbody = e('tbody');
      danhSachMa.forEach((m) => {
        const tr = e('tr');
        const tdGhiChu = e('td');
        tdGhiChu.append(e('b', null, m.tenGoi || 'Mã mời'));

        const tdMa = e('td');
        const codeElem = e('code', null, m.maHienThi || '••••••••');
        codeElem.style.cssText = 'color: #00F2FE; font-weight: 700;';
        tdMa.append(codeElem);

        const tdHs = e('td');
        if (m.daDungBoiHocSinhTen || m.hocSinhTen) {
          tdHs.textContent = m.daDungBoiHocSinhTen || m.hocSinhTen;
        } else {
          const spanChuaDung = e('span', null, 'Chưa dùng');
          spanChuaDung.style.color = 'var(--chu-nhat)';
          tdHs.append(spanChuaDung);
        }

        const tdTime = e('td', null, m.daDungLuc ? new Date(m.daDungLuc).toLocaleString('vi-VN') : '—');
        const tdTrangThai = e('td');
        tdTrangThai.append(e('span', m.dangHoatDong ? 'nhan-tot' : 'nhan-xam', m.dangHoatDong ? 'Hoạt động' : 'Hết hạn'));

        tr.append(tdGhiChu, tdMa, tdHs, tdTime, tdTrangThai);
        tbody.append(tr);
      });

      bang.append(tbody);
      the.append(bang);
    }

    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải mã cộng đồng: ' + err.message));
  }
}

export async function trangBienTapVien() {
  datNoiDung(KHUNG, khoiDangTai('Đang tải danh sách Ban biên tập...'));
  try {
    const [resBtv, resHs] = await Promise.all([
      api('/api/gv/bien-tap-vien'),
      api('/api/gv/hoc-sinh')
    ]);
    const btvList = Array.isArray(resBtv.bienTapVien) ? resBtv.bienTapVien : [];
    const dsHs = Array.isArray(resHs.danhSach) ? resHs.danhSach : [];

    const khung = e('div');
    khung.append(tieuDeTrang(
      '✍️ Quản Lý Ban Biên Tập Học Sinh',
      'Phân quyền cho các học sinh cán sự được phép đăng và duyệt bài trên Bảng tin Campus.'
    ));

    const the = e('div', 'the');
    the.style.cssText = 'background: #121620; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px;';

    const btvMap = new Map(btvList.map((b) => [b.hocSinhId, b.duocPhepDang]));

    const bang = e('table', 'khung-bang');
    const thead = e('thead');
    const trHead = e('tr');
    trHead.append(
      e('th', null, 'STT'),
      e('th', null, 'Họ và tên'),
      e('th', null, 'Quyền biên tập'),
      Object.assign(e('th', null, 'Thao tác'), { style: 'text-align: right;' })
    );
    thead.append(trHead);
    bang.append(thead);

    const tbody = e('tbody');
    dsHs.forEach((h) => {
      const laBtv = btvMap.get(h.id) === 1;
      const tr = e('tr');
      tr.append(
        e('td', null, String(h.soThuTu || '—')),
        Object.assign(e('td'), { children: [e('b', null, h.hoTen || '')] }),
        Object.assign(e('td'), { children: [e('span', laBtv ? 'nhan-tot' : 'nhan-xam', laBtv ? '✓ Biên tập viên' : 'Học sinh thường')] })
      );
      const tdAct = e('td');
      tdAct.style.cssText = 'text-align: right;';
      const btnToggle = nut(laBtv ? 'Hủy quyền' : 'Cấp quyền BTV', (laBtv ? 'nut-phu' : 'nut-chinh') + ' nut-nho', async () => {
        try {
          const resCap = await api('/api/gv/bien-tap-vien', {
            method: 'POST',
            body: JSON.stringify({ hocSinhId: h.id, duocPhepDang: laBtv ? 0 : 1 })
          });
          if (resCap.ok) {
            nhac(laBtv ? 'Đã hủy quyền biên tập viên' : 'Đã cấp quyền biên tập viên!', 'tot');
            await trangBienTapVien();
          } else {
            nhac('Lỗi: ' + (resCap.loi || resCap.error), 'xau');
          }
        } catch (err) {
          nhac('Lỗi: ' + err.message, 'xau');
        }
      });
      tdAct.append(btnToggle);
      tr.append(tdAct);
      tbody.append(tr);
    });

    bang.append(tbody);
    the.append(bang);
    khung.append(the);
    datNoiDung(KHUNG, khung);
  } catch (err) {
    datNoiDung(KHUNG, khoiLoi('Lỗi tải ban biên tập: ' + err.message));
  }
}

/* ================= Điều hướng ================= */
