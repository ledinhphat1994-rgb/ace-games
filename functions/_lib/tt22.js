// Tính điểm trung bình và xếp loại theo Thông tư 22/2021/TT-BGDĐT.
//
// LƯU Ý CHO GIÁO VIÊN: công thức và ngưỡng xếp loại được viết đúng theo Thông tư 22,
// nhưng thầy/cô nên đối chiếu lại với hướng dẫn hiện hành của Sở/Trung tâm trước khi
// dùng kết quả để vào học bạ.

/**
 * Điểm trung bình môn học kì:
 *   ĐTBmhk = (tổng ĐĐGtx + 2 × ĐĐGgk + 3 × ĐĐGck) / (số ĐĐGtx + 5)
 * Trả về null nếu thiếu điểm giữa kì hoặc cuối kì.
 */
export function dtbMonHocKi(cacDiem) {
  const tx = cacDiem.filter((d) => d.loai === 'tx' && d.gia_tri !== null && d.gia_tri !== undefined);
  const gk = cacDiem.find((d) => d.loai === 'gk' && d.gia_tri !== null && d.gia_tri !== undefined);
  const ck = cacDiem.find((d) => d.loai === 'ck' && d.gia_tri !== null && d.gia_tri !== undefined);

  if (!gk || !ck || !tx.length) return null;

  const tong = tx.reduce((a, d) => a + d.gia_tri, 0) + 2 * gk.gia_tri + 3 * ck.gia_tri;
  return lamTron(tong / (tx.length + 5));
}

/** Điểm trung bình môn cả năm: (ĐTBmhkI + 2 × ĐTBmhkII) / 3 */
export function dtbMonCaNam(hk1, hk2) {
  if (hk1 === null || hk2 === null) return null;
  return lamTron((hk1 + 2 * hk2) / 3);
}

/** Làm tròn đến 1 chữ số thập phân, theo quy định của Thông tư 22. */
export function lamTron(x) {
  if (x === null || x === undefined || Number.isNaN(x)) return null;
  return Math.round(x * 10) / 10;
}

/**
 * Xếp loại kết quả học tập theo Điều 9 Thông tư 22.
 * @param {Array<{cachDanhGia:'diem'|'nhan_xet', dtb:number|null, nhanXet:string}>} cacMon
 */
export function xepLoaiHocTap(cacMon) {
  const monDiem = cacMon.filter((m) => m.cachDanhGia === 'diem');
  const monNhanXet = cacMon.filter((m) => m.cachDanhGia === 'nhan_xet');

  // Thiếu điểm thì chưa xếp loại được.
  if (!monDiem.length || monDiem.some((m) => m.dtb === null)) return null;

  const diem = monDiem.map((m) => m.dtb);
  const soNhanXetChuaDat = monNhanXet.filter((m) => m.nhanXet === 'CD').length;
  const tatCaNhanXetDat = soNhanXetChuaDat === 0;

  const demTu = (nguong) => diem.filter((d) => d >= nguong).length;

  if (tatCaNhanXetDat && diem.every((d) => d >= 6.5) && demTu(8.0) >= 6) return 'Tốt';
  if (tatCaNhanXetDat && diem.every((d) => d >= 5.0) && demTu(6.5) >= 6) return 'Khá';
  if (soNhanXetChuaDat <= 1 && demTu(5.0) >= 6 && diem.every((d) => d >= 3.5)) return 'Đạt';
  return 'Chưa đạt';
}

/** Bốn mức đánh giá, dùng chung cho học tập và rèn luyện. */
export const CAC_MUC = ['Tốt', 'Khá', 'Đạt', 'Chưa đạt'];

/**
 * Gom các con điểm rời rạc thành bảng điểm của một học sinh trong một học kì.
 * @returns {{[maMon: string]: {tx: number[], gk: number|null, ck: number|null, dtb: number|null}}}
 */
export function gomBangDiem(cacDiem, danhSachMon) {
  const bang = {};
  danhSachMon.forEach((m) => {
    bang[m.ma] = { tx: new Array(m.so_dgtx).fill(null), gk: null, ck: null, dtb: null, nhanXet: '' };
  });

  cacDiem.forEach((d) => {
    const o = bang[d.mon];
    if (!o) return;
    if (d.loai === 'tx') {
      const i = d.so_thu_tu - 1;
      if (i >= 0 && i < o.tx.length) o.tx[i] = d.gia_tri;
    } else if (d.loai === 'gk') {
      o.gk = d.gia_tri;
      if (d.nhan_xet) o.nhanXet = d.nhan_xet;
    } else if (d.loai === 'ck') {
      o.ck = d.gia_tri;
      if (d.nhan_xet) o.nhanXet = d.nhan_xet;
    }
  });

  danhSachMon.forEach((m) => {
    if (m.cach_danh_gia !== 'diem') return;
    const o = bang[m.ma];
    const gia = [
      ...o.tx.filter((v) => v !== null).map((v) => ({ loai: 'tx', gia_tri: v })),
      ...(o.gk !== null ? [{ loai: 'gk', gia_tri: o.gk }] : []),
      ...(o.ck !== null ? [{ loai: 'ck', gia_tri: o.ck }] : []),
    ];
    o.dtb = dtbMonHocKi(gia);
  });

  return bang;
}
