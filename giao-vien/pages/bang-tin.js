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
  dau.append(tieuDe, taoNut('+ Tạo nhóm mới', 'nut-chinh', () => moTaoNhomModal()));

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

  async function quanLyThanhVien(lopItem) {
    const dialog = e('dialog', 'tk-dialog');
    dialog.style.width = 'min(640px, calc(100vw - 32px))';
    dialog.setAttribute('aria-labelledby', 'tkQLTVTitle');

    const title = e('h2', null, `Quản lý: ${lopItem.ten}`);
    title.id = 'tkQLTVTitle';
    const dong = taoNut('Đóng', 'nut-vien', () => dialog.close());
    const header = e('div', 'tk-dialog-header');
    header.append(title, dong);

    const contentBox = e('div');
    contentBox.append(e('p', 'tk-muted', 'Đang tải thông tin thành viên…'));
    dialog.append(header, contentBox);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();

    async function loadData() {
      try {
        const res = await api(`/api/gv/bang-tin?lopId=${lopItem.id}`);
        contentBox.replaceChildren();

        // 1. Danh sách học sinh trong nhóm
        const subTitle1 = e('h3', null, `Thành viên trong nhóm (${res.thanhVien.length})`);
        subTitle1.style.fontSize = '14px'; subTitle1.style.color = '#fff'; subTitle1.style.margin = '16px 0 10px';
        contentBox.append(subTitle1);

        if (!res.thanhVien.length) {
          contentBox.append(e('p', 'tk-muted', 'Nhóm này hiện chưa có học sinh nào. Hãy cấp quyền bên dưới.'));
        } else {
          const mList = e('div', 'tk-member-list');
          res.thanhVien.forEach(tv => {
            const item = e('div', 'tk-member-item');
            const info = e('div', 'tk-member-info');
            info.append(
              e('strong', null, tv.ten),
              e('span', null, `@${tv.tenDangNhap}`)
            );
            const nutGo = taoNut('Gỡ khỏi nhóm', 'tk-danger nut-vien', async () => {
              if (!confirm(`Gỡ học sinh “${tv.ten}” khỏi nhóm ${lopItem.ten}?`)) return;
              nutGo.disabled = true;
              try {
                await api('/api/gv/bang-tin', { method: 'POST', than: { action: 'go_quyen', lopId: lopItem.id, id: tv.id } });
                nhac(`Đã gỡ ${tv.ten} khỏi nhóm.`, 'tot');
                await loadData();
                await tai();
              } catch (err) {
                nhac(err.message, 'loi');
                nutGo.disabled = false;
              }
            });
            item.append(info, nutGo);
            mList.append(item);
          });
          contentBox.append(mList);
        }

        // 2. Cấp quyền học sinh mới vào nhóm
        const grantBox = e('div', 'tk-grant-box');
        grantBox.append(
          e('h3', null, '+ Cấp quyền học sinh vào nhóm (Không cần nhập mã)'),
          e('p', 'tk-muted', 'Chọn tài khoản học sinh đã đăng ký trên Digital Campus để cấp quyền trực tiếp.')
        );

        const searchInp = e('input');
        searchInp.placeholder = 'Tìm học sinh theo tên hoặc @username...';
        searchInp.style.width = '100%';
        searchInp.style.marginBottom = '12px';
        searchInp.style.boxSizing = 'border-box';
        grantBox.append(searchInp);

        const candidateList = e('div', 'tk-member-list');
        candidateList.style.maxHeight = '200px';

        function renderCandidates(filterText = '') {
          candidateList.replaceChildren();
          const q = filterText.toLowerCase();
          const filtered = (res.hocSinhKhaDung || []).filter(c =>
            !q || `${c.ten} ${c.tenDangNhap}`.toLowerCase().includes(q)
          );

          if (!filtered.length) {
            candidateList.append(e('p', 'tk-muted', 'Không có tài khoản học sinh phù hợp.'));
            return;
          }

          filtered.forEach(cand => {
            const item = e('div', 'tk-member-item');
            const info = e('div', 'tk-member-info');
            info.append(
              e('strong', null, cand.ten),
              e('span', null, `@${cand.tenDangNhap}${cand.lopTen ? ` (Đang ở: ${cand.lopTen})` : ' (Chưa có lớp)'}`)
            );
            const nutCap = taoNut('Cấp quyền', 'nut-chinh', async () => {
              nutCap.disabled = true;
              try {
                await api('/api/gv/bang-tin', {
                  method: 'POST',
                  than: { action: 'cap_quyen', lopId: lopItem.id, id: cand.id }
                });
                nhac(`Đã cấp quyền cho ${cand.ten} vào nhóm ${lopItem.ten}!`, 'tot');
                await loadData();
                await tai();
              } catch (err) {
                nhac(err.message, 'loi');
                nutCap.disabled = false;
              }
            });
            item.append(info, nutCap);
            candidateList.append(item);
          });
        }

        searchInp.oninput = () => renderCandidates(searchInp.value);
        renderCandidates();
        grantBox.append(candidateList);
        contentBox.append(grantBox);

      } catch (err) {
        contentBox.replaceChildren(e('p', 'tk-muted', 'Lỗi: ' + err.message));
      }
    }

    await loadData();
  }

  async function tai() {
    ketQua.setAttribute('aria-busy', 'true');
    try {
      const d = await api('/api/gv/bang-tin');
      ketQua.replaceChildren();

      if (!d.dsLop || !d.dsLop.length) {
        ketQua.append(e('div', 'tk-empty', 'Chưa có nhóm bảng tin nào trong phạm vi quản lý. Hãy bấm "+ Tạo nhóm mới".'));
        return;
      }

      const grid = e('div', 'tk-grid-groups');
      d.dsLop.forEach(lopItem => {
        const card = e('div', 'tk-card-group');
        const cardHeader = e('div', 'tk-card-header');
        const titleBox = e('div');
        titleBox.append(
          e('h3', 'tk-card-title', lopItem.ten),
          e('p', 'tk-muted', lopItem.namHoc ? `Niên khóa: ${lopItem.namHoc}` : '')
        );
        const badge = e('span', 'tk-badge-members', `👥 ${lopItem.soThanhVien || 0} học sinh`);
        cardHeader.append(titleBox, badge);

        const desc = e('p', 'tk-card-desc', lopItem.gioiThieu || lopItem.truong || 'Nhóm bảng tin lớp học.');

        const cardFooter = e('div', 'tk-card-footer');
        const nutQL = taoNut('Quản lý thành viên & Cấp quyền', 'nut-vien', () => quanLyThanhVien(lopItem));
        nutQL.style.width = '100%';
        cardFooter.append(nutQL);

        card.append(cardHeader, desc, cardFooter);
        grid.append(card);
      });

      ketQua.append(grid);
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
