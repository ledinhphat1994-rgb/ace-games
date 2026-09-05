// POST /api/ca-nhan { ma } hoặc GET /api/ca-nhan
// Học sinh nhập mã cá nhân hoặc tự động nhận diện từ phiên đăng nhập.
// Chỉ trả về dữ liệu của đúng em đó — không bao giờ trả danh sách cả lớp.
import { bocXuLy, json, loi, docThan } from '../_lib/api.js';
import { gomBangDiem, xepLoaiHocTap } from '../_lib/tt22.js';
import { chuanHoaMaTuyChinh } from '../_lib/ma.js';

const TOI_DA_THU = 12;      // số lần nhập sai cho phép
const CUA_SO = 900;         // trong 15 phút

async function quaNhieuLan(env, ip) {
  if (!env.RATE_LIMIT) return false;
  const khoa = `ca-nhan:${ip}`;
  const n = parseInt((await env.RATE_LIMIT.get(khoa)) || '0', 10);
  if (n >= TOI_DA_THU) return true;
  await env.RATE_LIMIT.put(khoa, String(n + 1), { expirationTtl: CUA_SO });
  return false;
}

async function layDuLieuCaNhan(db, { ma, hocSinhId }) {
  let hs = null;
  if (hocSinhId) {
    hs = await db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
              h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo,
              m.an_muc AS anMucChuoi
         FROM hoc_sinh h LEFT JOIN ma_ca_nhan m ON m.hoc_sinh_id = h.id
        WHERE h.id = ?1 AND h.dang_hoc = 1`
    ).bind(hocSinhId).first();
  } else if (ma) {
    const maSach = chuanHoaMaTuyChinh(ma);
    if (!maSach) return null;
    hs = await db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
              h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo,
              m.an_muc AS anMucChuoi
         FROM ma_ca_nhan m JOIN hoc_sinh h ON h.id = m.hoc_sinh_id
        WHERE m.ma = ?1 AND h.dang_hoc = 1`
    ).bind(maSach).first();
  }

  if (!hs) return null;

  // Giáo viên có thể ẩn riêng một vài mục với mã này — mặc định xem hết (chuỗi rỗng).
  const anMuc = hs.anMucChuoi ? hs.anMucChuoi.split(',') : [];
  delete hs.anMucChuoi;

  const [diemDanh, cacMon, diem, nhatKy, renLuyen] = await Promise.all([
    db.prepare(
      `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
         FROM diem_danh WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC LIMIT 90`
    ).bind(hs.id).all(),
    db.prepare('SELECT ma, ten, cach_danh_gia, so_dgtx FROM mon_hoc WHERE dang_hoc = 1 ORDER BY thu_tu').all(),
    db.prepare('SELECT mon, hoc_ki, loai, so_thu_tu, gia_tri, nhan_xet FROM diem WHERE hoc_sinh_id = ?1').bind(hs.id).all(),
    db.prepare(
      `SELECT ngay, loai, noi_dung AS noiDung FROM nhat_ky
        WHERE hoc_sinh_id = ?1 AND loai IN ('khen', 'nhac_nho') ORDER BY ngay DESC LIMIT 20`
    ).bind(hs.id).all(),
    db.prepare('SELECT hoc_ki AS hocKi, muc, nhan_xet AS nhanXet FROM ren_luyen WHERE hoc_sinh_id = ?1').bind(hs.id).all(),
  ]);

  const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  diemDanh.results.forEach((d) => { if (dem[d.trangThai] !== undefined) dem[d.trangThai]++; });

  const soDiem = [1, 2].map((hk) => {
    const cua = diem.results.filter((d) => d.hoc_ki === hk)
      .map((d) => ({ ...d, hoc_sinh_id: hs.id }));
    const bang = gomBangDiem(cua, cacMon.results);
    const mon = cacMon.results.map((m) => ({
      ma: m.ma, ten: m.ten, cachDanhGia: m.cach_danh_gia,
      tx: bang[m.ma].tx, gk: bang[m.ma].gk, ck: bang[m.ma].ck,
      dtb: bang[m.ma].dtb, nhanXet: bang[m.ma].nhanXet,
    }));
    const xepLoai = xepLoaiHocTap(mon.map((m) => ({
      cachDanhGia: m.cachDanhGia, dtb: m.dtb, nhanXet: m.nhanXet,
    })));
    const coDiem = mon.filter((m) => m.cachDanhGia === 'diem' && m.dtb !== null);
    const tbChung = coDiem.length
      ? Math.round((coDiem.reduce((a, m) => a + m.dtb, 0) / coDiem.length) * 10) / 10 : null;
    const rl = renLuyen.results.find((r) => r.hocKi === hk) || {};
    return { hocKi: hk, mon, xepLoai, tbChung, renLuyen: rl.muc || '', nhanXetRenLuyen: rl.nhanXet || '' };
  });

  return {
    ok: true,
    hocSinh: hs,
    anMuc,
    chuyenCan: anMuc.includes('diem-danh')
      ? null : { ...dem, tong: diemDanh.results.length, chiTiet: diemDanh.results },
    soDiem: anMuc.includes('thong-ke') ? [] : soDiem,
    nhatKy: nhatKy.results,
  };
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const maUrl = url.searchParams.get('ma') || '';
  const hocSinhId = phien?.hocSinhId || null;
  const ma = maUrl || phien?.ma || '';

  if (!hocSinhId && !ma) {
    return loi('Chưa có thông tin học sinh.', 400);
  }

  const ketQua = await layDuLieuCaNhan(env.DB, { ma, hocSinhId });
  if (!ketQua) return loi('Không tìm thấy học sinh.', 404);
  return json(ketQua);
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  if (await quaNhieuLan(env, ip)) {
    return loi('Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429);
  }

  const { ma: maGui } = await docThan(request).catch(() => ({}));
  const ma = maGui || phien?.ma || '';
  const hocSinhId = !ma ? (phien?.hocSinhId || null) : null;

  if (!ma && !hocSinhId) return loi('Chưa nhập mã cá nhân.');

  // Làm chậm nhẹ để hạn chế dò mã.
  await new Promise((r) => setTimeout(r, 350));

  const ketQua = await layDuLieuCaNhan(db, { ma, hocSinhId });
  if (!ketQua) return loi('Mã cá nhân không đúng. Hỏi lại giáo viên chủ nhiệm.', 404);

  return json(ketQua);
});
