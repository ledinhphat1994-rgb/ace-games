import { KHUNG } from '../lib.js';
import { api, e, nhac } from '/assets/js/chung.js';

function taoNut(nhan, lop, xuLy) {
  const n = e('button', 'nut ' + lop, nhan);
  n.type = 'button'; n.onclick = xuLy; return n;
}

export async function trangBangTin() {
  const dau = e('div', 'tk-title'), tieuDe = e('div');
  tieuDe.append(
    e('h1', null, 'Danh sách bảng tin & Nhóm lớp'),
    e('p', 'tk-muted', 'Quản lý các nhóm lớp, tạo bảng tin và cấp quyền trực tiếp cho học sinh tham gia không cần nhập mã.')
  );
  const nutTaoNhom = taoNut('+ Tạo nhóm mới', 'nut-chinh', () => moTaoNhomModal());
  dau.append(tieuDe, nutTaoNhom);

  const ketQua = e('div', 'tk-results');
  KHUNG.replaceChildren(dau, ketQua);

  function moTaoNhomModal() {
    const dialog = e('dialog', 'tk-dialog');
    dialog.setAttribute('aria-labelledby', 'tkTaoNhomTitle');
    const title = e('h2', null, 'Tạo nhóm bảng tin mới');
    title.id = 'tkTaoNhomTitle';
    const dong = taoNut('Đóng', 'nut-vien', () => dialog.close());
    const header = e('div', 'tk-dialog-header');
    header.append(title, dong);

    const form = e('form', 'tk-form');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = '14px';
    form.style.marginTop = '18px';

    const lblTen = e('label', null, 'Tên nhóm / Lớp (bắt buộc):');
    lblTen.style.fontSize = '12px'; lblTen.style.fontWeight = '600';
    const inputTen = e('input');
    inputTen.placeholder = 'Ví dụ: Lớp 10A7, Nhóm Ôn Thi Toán...';
    inputTen.required = true;
    lblTen.append(inputTen);

    const lblNamHoc = e('label', null, 'Niên khóa:');
    lblNamHoc.style.fontSize = '12px'; lblNamHoc.style.fontWeight = '600';
    const inputNamHoc = e('input');
    inputNamHoc.value = '2026 – 2027';
    lblNamHoc.append(inputNamHoc);

    const lblMoTa = e('label', null, 'Giới thiệu / Mô tả:');
    lblMoTa.style.fontSize = '12px'; lblMoTa.style.fontWeight = '600';
    const inputMoTa = e('textarea');
    inputMoTa.placeholder = 'Mô tả ngắn về nhóm bảng tin này...';
    inputMoTa.rows = 3;
    lblMoTa.append(inputMoTa);

    const actions = e('div', 'tk-actions');
    actions.style.marginTop = '10px';
    const btnTao = taoNut('Tạo nhóm ngay', 'nut-chinh', async () => {
      const ten = inputTen.value.trim();
      if (!ten) { nhac('Vui lòng nhập tên nhóm.', 'loi'); return; }
      btnTao.disabled = true;
      try {
        const res = await api('/api/gv/bang-tin', {
          method: 'POST',
          than: { action: 'tao_nhom', ten, namHoc: inputNamHoc.value.trim(), gioiThieu: inputMoTa.value.trim() }
        });
        dialog.close();
        nhac(res.message || 'Đã tạo nhóm thành công.', 'tot');
        await tai();
      } catch (err) {
        nhac(err.message, 'loi');
        btnTao.disabled = false;
      }
    });
    actions.append(btnTao);

    form.append(lblTen, lblNamHoc, lblMoTa, actions);
    dialog.append(header, form);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }

  // Quản lý thành viên & Cấp quyền: KHÔNG DÙNG POPUP, DÙNG BẢNG DẠNG EXCEL TRỰC TIẾP TRÊN TRANG (VÙNG 2)
  async function quanLyThanhVien(lopItem) {
    nutTaoNhom.style.display = 'none';

    const btnBack = taoNut('← Quay lại danh sách nhóm lớp', 'nut-vien tk-btn-back', () => {
      nutTaoNhom.style.display = '';
      tieuDe.replaceChildren(
        e('h1', null, 'Danh sách bảng tin & Nhóm lớp'),
        e('p', 'tk-muted', 'Quản lý các nhóm lớp, tạo bảng tin và cấp quyền trực tiếp cho học sinh tham gia không cần nhập mã.')
      );
      tai();
    });

    tieuDe.replaceChildren(
      btnBack,
      e('h1', null, `Quản lý thành viên: ${lopItem.ten}`),
      e('p', 'tk-muted', `${lopItem.namHoc ? 'Niên khóa: ' + lopItem.namHoc + ' · ' : ''}${lopItem.gioiThieu || 'Nhóm bảng tin lớp học.'}`)
    );

    ketQua.setAttribute('aria-busy', 'true');
    ketQua.replaceChildren(e('p', 'tk-muted', 'Đang tải dữ liệu thành viên…'));

    async function loadData() {
      try {
        const res = await api(`/api/gv/bang-tin?lopId=${lopItem.id}`);
        ketQua.replaceChildren();

        // 1. DANH SÁCH THÀNH VIÊN HIỆN TẠI (DẠNG BẢNG EXCEL)
        const sec1 = e('section', 'tk-excel-section');
        const sec1Head = e('div', 'tk-excel-header');
        sec1Head.append(
          e('h2', 'tk-excel-title', `1. Danh sách thành viên trong nhóm (${res.thanhVien.length} học sinh)`),
          e('span', 'tk-badge-members', `👥 Sĩ số: ${res.thanhVien.length}`)
        );
        sec1.append(sec1Head);

        const wrap1 = e('div', 'tk-table-wrap tk-excel-wrap');
        const tbl1 = e('table', 'tk-table tk-excel-table');
        const thead1 = e('thead'), tr1 = e('tr');
        ['STT', 'Họ và tên', 'Tên đăng nhập', 'Vai trò', 'Thao tác'].forEach((col, idx) => {
          const th = e('th', null, col);
          if (idx === 0) th.style.width = '55px';
          if (idx === 0) th.style.textAlign = 'center';
          tr1.append(th);
        });
        thead1.append(tr1);

        const tbody1 = e('tbody');
        if (!res.thanhVien.length) {
          const emptyRow = e('tr');
          const td = e('td', 'tk-muted');
          td.colSpan = 5;
          td.style.textAlign = 'center';
          td.style.padding = '24px';
          td.textContent = 'Nhóm này hiện chưa có học sinh nào. Hãy cấp quyền cho học sinh ở bảng bên dưới.';
          emptyRow.append(td);
          tbody1.append(emptyRow);
        } else {
          res.thanhVien.forEach((tv, idx) => {
            const row = e('tr');
            const tdSTT = e('td', 'tk-excel-stt', String(idx + 1));
            tdSTT.style.textAlign = 'center';
            tdSTT.style.fontWeight = '600';

            const tdTen = e('td');
            tdTen.append(e('strong', null, tv.ten));

            const tdUsername = e('td', null, `@${tv.tenDangNhap}`);

            const tdRole = e('td');
            tdRole.append(e('span', 'tk-status', 'Học sinh'));

            const tdAction = e('td');
            const nutGo = taoNut('Gỡ khỏi nhóm', 'tk-danger nut-vien', async () => {
              if (!confirm(`Gỡ học sinh “${tv.ten}” khỏi nhóm ${lopItem.ten}?`)) return;
              nutGo.disabled = true;
              try {
                await api('/api/gv/bang-tin', { method: 'POST', than: { action: 'go_quyen', lopId: lopItem.id, id: tv.id } });
                nhac(`Đã gỡ ${tv.ten} khỏi nhóm.`, 'tot');
                await loadData();
              } catch (err) {
                nhac(err.message, 'loi');
                nutGo.disabled = false;
              }
            });
            tdAction.append(nutGo);

            row.append(tdSTT, tdTen, tdUsername, tdRole, tdAction);
            tbody1.append(row);
          });
        }
        tbl1.append(thead1, tbody1);
        wrap1.append(tbl1);
        sec1.append(wrap1);

        // 2. CẤP QUYỀN HỌC SINH VÀO NHÓM (DẠNG BẢNG EXCEL)
        const sec2 = e('section', 'tk-excel-section');
        sec2.style.marginTop = '36px';

        const sec2Head = e('div', 'tk-excel-header');
        const titBox2 = e('div');
        titBox2.append(
          e('h2', 'tk-excel-title', '+ Cấp quyền học sinh vào nhóm (Không cần nhập mã)'),
          e('p', 'tk-muted', 'Chọn tài khoản học sinh đã đăng ký trên Digital Campus để cấp quyền trực tiếp.')
        );
        sec2Head.append(titBox2);
        sec2.append(sec2Head);

        const filterBox = e('div', 'tk-excel-toolbar');
        const searchInp = e('input');
        searchInp.type = 'search';
        searchInp.placeholder = '🔍 Tìm kiếm theo tên hoặc @username học sinh để cấp quyền...';
        searchInp.className = 'tk-excel-search';
        filterBox.append(searchInp);
        sec2.append(filterBox);

        const wrap2 = e('div', 'tk-table-wrap tk-excel-wrap');
        const tbl2 = e('table', 'tk-table tk-excel-table');
        const thead2 = e('thead'), tr2 = e('tr');
        ['STT', 'Họ và tên', 'Tên đăng nhập', 'Lớp hiện tại', 'Thao tác'].forEach((col, idx) => {
          const th = e('th', null, col);
          if (idx === 0) th.style.width = '55px';
          if (idx === 0) th.style.textAlign = 'center';
          tr2.append(th);
        });
        thead2.append(tr2);

        const tbody2 = e('tbody');
        tbl2.append(thead2, tbody2);
        wrap2.append(tbl2);
        sec2.append(wrap2);

        function renderCandidates(filterText = '') {
          tbody2.replaceChildren();
          const q = filterText.toLowerCase().trim();
          const filtered = (res.hocSinhKhaDung || []).filter(c =>
            !q || `${c.ten} ${c.tenDangNhap}`.toLowerCase().includes(q)
          );

          if (!filtered.length) {
            const emptyRow = e('tr');
            const td = e('td', 'tk-muted');
            td.colSpan = 5;
            td.style.textAlign = 'center';
            td.style.padding = '24px';
            td.textContent = q ? 'Không tìm thấy tài khoản học sinh phù hợp.' : 'Hiện không có tài khoản học sinh khả dụng cần cấp quyền.';
            emptyRow.append(td);
            tbody2.append(emptyRow);
            return;
          }

          filtered.forEach((cand, idx) => {
            const row = e('tr');
            const tdSTT = e('td', 'tk-excel-stt', String(idx + 1));
            tdSTT.style.textAlign = 'center';
            tdSTT.style.fontWeight = '600';

            const tdTen = e('td');
            tdTen.append(e('strong', null, cand.ten));

            const tdUsername = e('td', null, `@${cand.tenDangNhap}`);

            const tdLop = e('td');
            tdLop.append(e('span', 'tk-muted', cand.lopTen ? `Đang ở: ${cand.lopTen}` : 'Chưa có lớp'));

            const tdAction = e('td');
            const nutCap = taoNut('+ Cấp quyền', 'nut-chinh', async () => {
              nutCap.disabled = true;
              try {
                await api('/api/gv/bang-tin', {
                  method: 'POST',
                  than: { action: 'cap_quyen', lopId: lopItem.id, id: cand.id }
                });
                nhac(`Đã cấp quyền cho ${cand.ten} vào nhóm ${lopItem.ten}!`, 'tot');
                await loadData();
              } catch (err) {
                nhac(err.message, 'loi');
                nutCap.disabled = false;
              }
            });
            tdAction.append(nutCap);

            row.append(tdSTT, tdTen, tdUsername, tdLop, tdAction);
            tbody2.append(row);
          });
        }

        searchInp.oninput = () => renderCandidates(searchInp.value);
        renderCandidates();

        ketQua.append(sec1, sec2);
      } catch (err) {
        ketQua.replaceChildren(e('p', 'tk-muted', 'Lỗi: ' + err.message));
      } finally {
        ketQua.removeAttribute('aria-busy');
      }
    }

    await loadData();
  }

  // TẢI DANH SÁCH NHÓM LỚP (VÙNG 3) - DẠNG BẢNG EXCEL
  async function tai() {
    ketQua.setAttribute('aria-busy', 'true');
    try {
      const d = await api('/api/gv/bang-tin');
      ketQua.replaceChildren();

      if (!d.dsLop || !d.dsLop.length) {
        ketQua.append(e('div', 'tk-empty', 'Chưa có nhóm bảng tin nào trong phạm vi quản lý. Hãy bấm "+ Tạo nhóm mới".'));
        return;
      }

      const wrap = e('div', 'tk-table-wrap tk-excel-wrap');
      const bang = e('table', 'tk-table tk-excel-table');
      const thead = e('thead'), hr = e('tr');
      ['STT', 'Tên nhóm / Lớp', 'Niên khóa', 'Thông tin & Giới thiệu', 'Sĩ số', 'Thao tác'].forEach((t, idx) => {
        const th = e('th', null, t);
        th.scope = 'col';
        if (idx === 0) th.style.width = '55px';
        if (idx === 0) th.style.textAlign = 'center';
        hr.append(th);
      });
      thead.append(hr);

      const tbody = e('tbody');
      d.dsLop.forEach((lopItem, idx) => {
        const row = e('tr');

        const tdSTT = e('td', 'tk-excel-stt', String(idx + 1));
        tdSTT.style.textAlign = 'center';
        tdSTT.style.fontWeight = '600';

        const tdTen = e('td');
        tdTen.append(e('strong', null, lopItem.ten));

        const tdNam = e('td', null, lopItem.namHoc || '—');

        const tdMota = e('td', 'tk-muted', lopItem.gioiThieu || lopItem.truong || 'Nhóm bảng tin lớp học');

        const tdSiso = e('td');
        tdSiso.append(e('span', 'tk-badge-members', `👥 ${lopItem.soThanhVien || 0} học sinh`));

        const tdThaoTac = e('td');
        const nutQL = taoNut('Quản lý thành viên & Cấp quyền', 'nut-vien', () => quanLyThanhVien(lopItem));
        tdThaoTac.append(nutQL);

        row.append(tdSTT, tdTen, tdNam, tdMota, tdSiso, tdThaoTac);
        tbody.append(row);
      });

      bang.append(thead, tbody);
      wrap.append(bang);
      ketQua.append(wrap);
    } catch (err) {
      const loi = e('div', 'tk-empty');
      loi.append(e('p', null, 'Không tải được danh sách bảng tin: ' + err.message), taoNut('Thử lại', 'nut-chinh', tai));
      ketQua.replaceChildren(loi);
    } finally {
      ketQua.removeAttribute('aria-busy');
    }
  }

  await tai();
}
