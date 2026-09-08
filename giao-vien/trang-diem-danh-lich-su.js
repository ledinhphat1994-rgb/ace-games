/* ================= Lịch sử & khôi phục Điểm danh =================
   Y hệt cơ chế "🛡️ Lịch sử & khôi phục" đã có ở Thủ quỹ (xem trang-quy.js) — trước mỗi lần
   lưu điểm danh, toàn bộ bản ghi hiện tại được chụp lại một điểm khôi phục; giáo viên có thể
   xem lại (chi tiết từng học sinh đã đổi gì, lý do nếu có, kể cả bị xoá hẳn) và khôi phục về
   đúng thời điểm đó nếu ghi nhầm hoặc tài khoản bị chiếm. */
import { e, datNoiDung, api, khoiDangTai, nhac, giuViTriCuonKhiVe } from '/assets/js/chung.js';
import { tieuDeTrang, nut, moHopThoai, dongHopThoai } from '/assets/js/giao-dien.js';
import { taoLucVNNgayTruoc } from './trang-quy.js';

const TEN_TRANG_THAI = {
  co_mat: 'Có mặt',
  vang_phep: 'Vắng có phép',
  vang_khong_phep: 'Vắng không phép',
  tre: 'Đi trễ',
};
// "Chưa ghi" dễ gây khó hiểu ("chưa ghi" gì?) — nói rõ là CHƯA ĐIỂM DANH (chưa có bản ghi nào
// trước lần thay đổi này), đúng thuật ngữ dùng xuyên suốt trang.
const tenTt = (ma) => (ma ? (TEN_TRANG_THAI[ma] || ma) : 'Chưa điểm danh');

const TABS = [['', 'Tất cả'], ['chinh', '📋 Điểm danh chính'], ['phu', '⚡ Điểm danh linh động']];

export async function trangDiemDanhLichSu(KHUNG) {
  datNoiDung(KHUNG, khoiDangTai());

  const phienD = await api('/api/whoami').catch(() => ({ role: '' }));
  const laGiaoVien = phienD.role === 'teacher';
  let tab = '';   // '' | 'chinh' | 'phu'

  /** Mỗi dòng chi tiết: "Họ tên: Trước → Sau" (+ lý do nếu có) — "Sau" là "(đã xoá)" nếu bị bỏ chọn. */
  function veChiTiet(chiTiet) {
    if (!chiTiet || !chiTiet.length) return null;
    const ds = e('div', 'ds-chi-tiet-diem-danh');
    ds.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:5px;';
    chiTiet.forEach((c) => {
      const dong = e('div');
      dong.style.cssText = 'font-size:13px;color:var(--chu-nhat);display:flex;flex-wrap:wrap;gap:5px;align-items:center;';
      dong.append(e('b', null, c.hoTen), document.createTextNode(':'));
      if (c.sau === null) {
        dong.append(e('span', 'nhan nhan-xam', `Xoá (trước đó: ${tenTt(c.truoc)})`));
      } else {
        dong.append(
          e('span', null, tenTt(c.truoc)),
          e('span', null, '→'),
          e('span', 'nhan ' + (c.sau === 'co_mat' ? 'nhan-tot' : c.sau === 'vang_khong_phep' ? 'nhan-xau' : c.sau === 'tre' ? 'nhan-luuy' : 'nhan'), tenTt(c.sau))
        );
      }
      if (c.lyDo) dong.append(e('small', null, `Lý do: ${c.lyDo}`));
      ds.append(dong);
    });
    return ds;
  }

  async function ve() {
    datNoiDung(KHUNG, khoiDangTai());
    const khung = e('div');

    // Đi thẳng bằng hash — nút này luôn về đúng một chỗ cố định (trang Điểm danh). ".nut-vien"
    // (viền rõ) chứ không phải ".nut-nhe" (gần như trong suốt) — trên nền tối, chữ nút quay lại
    // trước đây gần như chìm mất vào nền, khó nhận ra là một nút bấm được.
    const nutVeDiemDanh = nut('← Về Điểm danh', 'nut-vien nut-nho', () => { location.hash = '#/diem-danh'; });
    nutVeDiemDanh.style.marginBottom = '10px';
    khung.append(nutVeDiemDanh);
    khung.append(tieuDeTrang('Lịch sử Điểm danh',
      'Mỗi lần lưu điểm danh đều tự lưu lại một điểm khôi phục, kèm chi tiết từng học sinh đã đổi gì.'));

    const hopTab = e('div', 'day-loc day-loc-deu');
    hopTab.id = 'diem-danh-lich-su-tab';
    hopTab.style.margin = '4px 0 16px';
    hopTab.style.setProperty('--the-nho-nhat', '100px');
    TABS.forEach(([ma, ten]) => {
      const b = e('button', 'vien-loc', ten);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(tab === ma));
      b.addEventListener('click', () => {
        if (tab === ma) return;
        tab = ma;
        giuViTriCuonKhiVe('diem-danh-lich-su-tab', ve);
      });
      hopTab.append(b);
    });
    khung.append(hopTab);

    const d = await api('/api/gv/diem-danh-checkpoint' + (tab ? '?loai=' + tab : ''));

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
      khung.append(e('p', 'trong', 'Chưa có điểm khôi phục nào phù hợp.'));
      datNoiDung(KHUNG, khung);
      return;
    }

    if (laGiaoVien) {
      const nutXoaTatCaCp = e('div');
      nutXoaTatCaCp.style.cssText = 'margin-bottom:10px;text-align:right';
      nutXoaTatCaCp.append(nut('🗑 Xoá tất cả điểm khôi phục', 'nut-nhe nut-nho', () => {
        moHopThoai('Xoá TOÀN BỘ lịch sử khôi phục?', [
          e('p', null, `Toàn bộ ${d.danhSach.length} điểm khôi phục đang hiện sẽ mất vĩnh viễn.`),
          e('p', 'trong', 'Đây là lưới an toàn duy nhất nếu tài khoản bị lộ hay ghi nhầm điểm danh — xoá xong sẽ KHÔNG còn cách nào quay lại các thời điểm cũ nữa. Chỉ xoá khi chắc chắn không cần nữa.'),
        ], [
          nut('Huỷ', 'nut-nhe', dongHopThoai),
          nut('Xoá tất cả', 'nut-xau', async (ev) => {
            ev.currentTarget.disabled = true;
            try {
              await api('/api/gv/rieng/diem-danh-checkpoint?tatCa=1' + (tab ? '&loai=' + tab : ''), { method: 'DELETE' });
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
      dong.append(e('span', 'ngay', taoLucVNNgayTruoc(cp.taoLuc)), e('span', 'nhan nhan-xam', cp.nguoiThucHien));
      if (laGiaoVien) {
        const viec = e('div', 'viec');
        viec.append(nut('Khôi phục về đây', 'nut-nho nut-xau', () => {
          moHopThoai('Khôi phục Điểm danh về điểm này?', [
            e('p', null, cp.hanhDong),
            Object.assign(e('p', null, taoLucVNNgayTruoc(cp.taoLuc)), { style: 'color:var(--chu-nhat)' }),
            e('p', null, 'Mọi thay đổi điểm danh sau thời điểm này sẽ mất. Chắc chắn chứ?'),
          ], [
            nut('Huỷ', 'nut-nhe', dongHopThoai),
            nut('Khôi phục ngay', 'nut-xau', async (ev) => {
              ev.currentTarget.disabled = true;
              try {
                await api('/api/gv/rieng/diem-danh-checkpoint', { method: 'POST', than: { id: cp.id } });
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
                await api('/api/gv/rieng/diem-danh-checkpoint?id=' + cp.id, { method: 'DELETE' });
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
      const khoiChiTiet = veChiTiet(cp.chiTiet);
      if (khoiChiTiet) m.append(khoiChiTiet);
      ds.append(m);
    });
    khung.append(ds);
    datNoiDung(KHUNG, khung);
  }

  await ve();
}
