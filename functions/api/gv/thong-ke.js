// GET /api/gv/thong-ke?tuNgay=&denNgay=&buoi=
// Thống kê chuyên cần theo tuần và cảnh báo học sinh có nguy cơ.
// buoi = '' (mặc định, gộp mọi buổi) | 'sang' | 'chieu' | 'hoat_dong'
import { bocXuLy, json, ngayHopLe } from '../../_lib/api.js';

// Ngưỡng cảnh báo — theo quy chế, nghỉ quá 45 buổi/năm là không được lên lớp.
const NGUONG = { cao: 10, vua: 5 };
const BUOI_HOP_LE = new Set(['', 'sang', 'chieu', 'hoat_dong']);

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const q = new URL(request.url).searchParams;

  const denNgay = ngayHopLe(q.get('denNgay')) ? q.get('denNgay') : new Date().toISOString().slice(0, 10);
  let tuNgay = q.get('tuNgay');
  if (!ngayHopLe(tuNgay)) {
    const d = new Date(denNgay + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 84);   // 12 tuần gần nhất
    tuNgay = d.toISOString().slice(0, 10);
  }
  const buoi = BUOI_HOP_LE.has(q.get('buoi')) ? q.get('buoi') : '';
  const dieuKienBuoi = buoi ? 'AND buoi = ?3' : "AND buoi NOT LIKE '%_phu'";
  const dieuKienBuoiJoin = buoi ? 'AND d.buoi = ?3' : "AND d.buoi NOT LIKE '%_phu'";
  const thamSo = buoi ? [tuNgay, denNgay, buoi] : [tuNgay, denNgay];


  const [theoNgay, theoHs, tongTheoMuc, siSo] = await Promise.all([
    db.prepare(
      `SELECT ngay,
              SUM(CASE WHEN trang_thai = 'co_mat' THEN 1 ELSE 0 END) AS coMat,
              SUM(CASE WHEN trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre,
              SUM(CASE WHEN trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vangPhep,
              SUM(CASE WHEN trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vangKhongPhep
         FROM diem_danh WHERE ngay BETWEEN ?1 AND ?2 ${dieuKienBuoi}
        GROUP BY ngay ORDER BY ngay`
    ).bind(...thamSo).all(),

    db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen, h.lop_nghe AS lopNghe, h.hoan_canh AS hoanCanh,
              COUNT(d.ngay) AS tongBuoi,
              SUM(CASE WHEN d.trang_thai = 'co_mat' THEN 1 ELSE 0 END) AS coMat,
              SUM(CASE WHEN d.trang_thai = 'tre' THEN 1 ELSE 0 END) AS tre,
              SUM(CASE WHEN d.trang_thai = 'vang_phep' THEN 1 ELSE 0 END) AS vangPhep,
              SUM(CASE WHEN d.trang_thai = 'vang_khong_phep' THEN 1 ELSE 0 END) AS vangKhongPhep
         FROM hoc_sinh h LEFT JOIN diem_danh d
           ON d.hoc_sinh_id = h.id AND d.ngay BETWEEN ?1 AND ?2 ${dieuKienBuoiJoin}
        WHERE h.dang_hoc = 1
        GROUP BY h.id ORDER BY vangKhongPhep DESC, vangPhep DESC, h.id`
    ).bind(...thamSo).all(),

    db.prepare(
      `SELECT trang_thai AS trangThai, COUNT(*) AS n FROM diem_danh
        WHERE ngay BETWEEN ?1 AND ?2 ${dieuKienBuoi} GROUP BY trang_thai`
    ).bind(...thamSo).all(),

    db.prepare('SELECT COUNT(*) AS n FROM hoc_sinh WHERE dang_hoc = 1').first(),
  ]);

  // Gom theo tuần để vẽ biểu đồ.
  const tuan = new Map();
  theoNgay.results.forEach((r) => {
    const d = new Date(r.ngay + 'T00:00:00Z');
    const thu = (d.getUTCDay() + 6) % 7;                 // thứ hai = 0
    d.setUTCDate(d.getUTCDate() - thu);
    const dauTuan = d.toISOString().slice(0, 10);

    const t = tuan.get(dauTuan) || { dauTuan, coMat: 0, tre: 0, vangPhep: 0, vangKhongPhep: 0, soNgay: 0 };
    t.coMat += r.coMat; t.tre += r.tre; t.vangPhep += r.vangPhep; t.vangKhongPhep += r.vangKhongPhep;
    t.soNgay++;
    tuan.set(dauTuan, t);
  });

  const canhBao = theoHs.results
    .map((h) => {
      const vangTong = h.vangPhep + h.vangKhongPhep;
      const tiLe = h.tongBuoi ? Math.round((h.coMat / h.tongBuoi) * 100) : null;
      let muc = null;
      if (h.vangKhongPhep >= NGUONG.cao) muc = 'cao';
      else if (h.vangKhongPhep >= NGUONG.vua || vangTong >= NGUONG.cao) muc = 'vua';
      else if (h.vangKhongPhep > 0 || h.tre >= 3) muc = 'nhe';
      return { ...h, vangTong, tiLeChuyenCan: tiLe, mucCanhBao: muc };
    })
    .filter((h) => h.mucCanhBao);

  return json({
    ok: true,
    tuNgay, denNgay, buoi,
    siSo: siSo?.n ?? 0,
    tongTheoMuc: Object.fromEntries(tongTheoMuc.results.map((r) => [r.trangThai, r.n])),
    theoTuan: [...tuan.values()].sort((a, b) => a.dauTuan.localeCompare(b.dauTuan)),
    theoHocSinh: theoHs.results,
    canhBao,
  });
}, { canGiaoVien: true });
