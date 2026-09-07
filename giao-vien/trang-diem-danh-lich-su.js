/* ================= Lịch sử & khôi phục Điểm danh =================
   Y hệt cơ chế "🛡️ Lịch sử & khôi phục" đã có ở Thủ quỹ (xem trang-quy.js) — trước mỗi lần
   lưu điểm danh, toàn bộ bản ghi hiện tại được chụp lại một điểm khôi phục; giáo viên có thể
   xem lại và khôi phục về đúng thời điểm đó nếu ghi nhầm hoặc tài khoản bị chiếm. */
import { e, datNoiDung, api, khoiDangTai, nhac } from '/assets/js/chung.js';
import { tieuDeTrang, nut, moHopThoai, dongHopThoai } from '/assets/js/giao-dien.js';
import { taoLucVN } from './trang-quy.js';

export async function trangDiemDanhLichSu(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  const phienD = await api('/api/whoami').catch(() => ({ role: '' }));
  const laGiaoVien = phienD.role === 'teacher';

  async function ve() {
    datNoiDung(KHUNG, khoiDangTai());
    const khung = e('div');

    // Đi thẳng bằng hash — nút này luôn về đúng một chỗ cố định (trang Điểm danh).
    const nutVeDiemDanh = nut('← Về Điểm danh', 'nut-nhe nut-nho', () => { location.hash = '#/diem-danh'; });
    const cardVeDiemDanh = e('div');
    cardVeDiemDanh.style.cssText = 'display:inline-flex;align-items:center;padding:2px 4px 2px 0;margin-bottom:10px;border-radius:10px;background:var(--nen-chim);border:1px solid var(--vien);';
    cardVeDiemDanh.append(nutVeDiemDanh);
    khung.append(cardVeDiemDanh);
    khung.append(tieuDeTrang('Lịch sử Điểm danh',
      'Mỗi lần lưu điểm danh đều tự lưu lại một điểm khôi phục — xem lại và khôi phục nếu ghi nhầm.'));

    const d = await api('/api/gv/diem-danh-checkpoint');

    if (laGiaoVien) {
      const the = e('div', 'the');
      the.style.borderColor = 'var(--chinh)';
      the.append(
        e('h3', null, 'Nếu ghi nhầm hoặc tài khoản bị lộ'),
        e('p', null, 'Chọn đúng thời điểm trước khi sự cố xảy ra, bấm "Khôi phục về đây". Toàn bộ điểm danh sẽ trở về đúng như lúc đó. Bản thân việc khôi phục cũng được lưu lại một điểm mới, nên nếu chọn nhầm vẫn quay lại được.')
      );
      khung.append(the);
    }

    if (!d.danhSach.length) {
      khung.append(e('p', 'trong', 'Chưa có điểm khôi phục nào — sẽ tự xuất hiện khi có thao tác điểm danh đầu tiên.'));
      datNoiDung(KHUNG, khung);
      return;
    }

    if (laGiaoVien) {
      const nutXoaTatCaCp = e('div');
      nutXoaTatCaCp.style.cssText = 'margin-bottom:10px;text-align:right';
      nutXoaTatCaCp.append(nut('🗑 Xoá tất cả điểm khôi phục', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá TOÀN BỘ lịch sử khôi phục?', [
          e('p', null, `Toàn bộ ${d.danhSach.length} điểm khôi phục sẽ mất vĩnh viễn.`),
          e('p', 'trong', 'Đây là lưới an toàn duy nhất nếu tài khoản bị lộ hay ghi nhầm điểm danh — xoá xong sẽ KHÔNG còn cách nào quay lại các thời điểm cũ nữa. Chỉ xoá khi chắc chắn không cần nữa.'),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả', 'nut-xau', async (ev) => {
            ev.currentTarget.disabled = true;
            try {
              await api('/api/gv/diem-danh-checkpoint?tatCa=1', { method: 'DELETE' });
              dongHopThoai();
              nhac('Đã xoá toàn bộ lịch sử khôi phục', 'tot');
              ve();
            } catch (err) {
              nhac(err.message, 'xau');
              ev.currentTarget.disabled = false;
            }
          }),
        ]);
      }));
      khung.append(nutXoaTatCaCp);
    }

    const ds = e('div', 'ds-nhat-ky');
    d.danhSach.forEach((cp) => {
      const m = e('div', 'muc-nhat-ky khac');
      const dong = e('div', 'dong-dau');
      dong.append(e('span', 'ngay', taoLucVN(cp.taoLuc)), e('span', 'nhan nhan-xam', cp.nguoiThucHien));
      if (laGiaoVien) {
        const viec = e('div', 'viec');
        viec.append(nut('Khôi phục về đây', 'nut-nho nut-xau', () => {
          moHopThoai('Khôi phục Điểm danh về điểm này?', [
            e('p', null, cp.hanhDong),
            Object.assign(e('p', null, `Lúc: ${taoLucVN(cp.taoLuc)}`), { style: 'color:var(--chu-nhat)' }),
            e('p', null, 'Mọi thay đổi điểm danh sau thời điểm này sẽ mất. Chắc chắn chứ?'),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Khôi phục ngay', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api('/api/gv/diem-danh-checkpoint', { method: 'POST', than: { id: cp.id } });
                dongHopThoai();
                nhac('Đã khôi phục Điểm danh', 'tot');
                ve();
              } catch (err) {
                nhac(err.message, 'xau');
                ev.currentTarget.disabled = false;
              }
            }),
          ]);
        }));
        viec.append(nut('🗑 Xoá', 'nut-nho nut-nhe', () => {
          moHopThoai('Xoá điểm khôi phục này?', [
            e('p', null, cp.hanhDong),
            e('p', 'trong', 'Chỉ xoá dòng lịch sử này — không ảnh hưởng điểm danh hiện tại. Không thể hoàn tác.'),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Xoá', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api('/api/gv/diem-danh-checkpoint?id=' + cp.id, { method: 'DELETE' });
                dongHopThoai();
                nhac('Đã xoá điểm khôi phục', 'tot');
                ve();
              } catch (err) {
                nhac(err.message, 'xau');
                ev.currentTarget.disabled = false;
              }
            }),
          ]);
        }));
        dong.append(viec);
      }
      m.append(dong, e('p', null, cp.hanhDong));
      ds.append(m);
    });
    khung.append(ds);
    datNoiDung(KHUNG, khung);
  }

  await ve();
}
