// POST /api/ca-nhan { ma } hoặc GET /api/ca-nhan
// Học sinh nhập mã cá nhân hoặc tự động nhận diện từ phiên đăng nhập.
// Chỉ trả về dữ liệu của đúng em đó — không bao giờ trả danh sách cả lớp.
import { bocXuLy, json, loi, docThan } from '../_lib/api.js';
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

async function layDuLieuCaNhan(db, { ma, hocSinhId, lopId }) {
  let hs = null;
  if (hocSinhId) {
    hs = await db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
              h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo,
              m.an_muc AS anMucChuoi
         FROM hoc_sinh h LEFT JOIN ma_ca_nhan m ON m.hoc_sinh_id = h.id
        WHERE h.id = ?1 AND h.dang_hoc = 1 AND h.lop_id = ?2`
    ).bind(hocSinhId, lopId).first();
  } else if (ma) {
    const maSach = chuanHoaMaTuyChinh(ma);
    if (!maSach) return null;
    // Dù "ma" vốn duy nhất toàn hệ thống (không cần biết lớp mới tra ra đúng 1 học sinh), vẫn
    // chặn thêm lop_id khớp với phiên đang đăng nhập — một phiên của lớp này không có lý do
    // hợp lệ để tra cứu học sinh của lớp khác dù có biết đúng mã.
    hs = await db.prepare(
      `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
              h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo,
              m.an_muc AS anMucChuoi
         FROM ma_ca_nhan m JOIN hoc_sinh h ON h.id = m.hoc_sinh_id
        WHERE m.ma = ?1 AND h.dang_hoc = 1 AND h.lop_id = ?2`
    ).bind(maSach, lopId).first();
  }

  if (!hs) return null;

  // Giáo viên có thể ẩn riêng một vài mục với mã này — mặc định xem hết (chuỗi rỗng).
  const anMuc = hs.anMucChuoi ? hs.anMucChuoi.split(',') : [];
  delete hs.anMucChuoi;

  // Trang web là kỷ niệm đẹp của lớp, không phải chỗ để học sinh soi điểm số của chính mình —
  // Sổ điểm đã bỏ HẲN khỏi mục tra cứu cá nhân này, không truy vấn/trả về nữa. Giáo viên vẫn
  // quản lý đầy đủ ở khu Quản lý (functions/api/gv/so-diem.js) — không đổi gì ở đó.
  const [diemDanh] = await Promise.all([
    db.prepare(
      `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
         FROM diem_danh WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC, buoi DESC LIMIT 120`
    ).bind(hs.id).all(),
  ]);

  const dsChinh = diemDanh.results.filter((d) => !d.buoi.endsWith('_phu'));
  const dsPhu = diemDanh.results.filter((d) => d.buoi.endsWith('_phu')).map((d) => ({
    ...d,
    buoiGoc: d.buoi.replace(/_phu$/, ''),
  }));

  const dem = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  dsChinh.forEach((d) => { if (dem[d.trangThai] !== undefined) dem[d.trangThai]++; });

  const demPhu = { co_mat: 0, tre: 0, vang_phep: 0, vang_khong_phep: 0 };
  dsPhu.forEach((d) => { if (demPhu[d.trangThai] !== undefined) demPhu[d.trangThai]++; });

  return {
    ok: true,
    hocSinh: hs,
    anMuc,
    chuyenCan: anMuc.includes('diem-danh')
      ? null : {
        ...dem,
        tong: dsChinh.length,
        chiTiet: dsChinh,
        phu: {
          ...demPhu,
          tong: dsPhu.length,
          chiTiet: dsPhu,
        },
      },
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

  const ketQua = await layDuLieuCaNhan(env.DB, { ma, hocSinhId, lopId: phien.lopId });
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

  const ketQua = await layDuLieuCaNhan(db, { ma, hocSinhId, lopId: phien.lopId });
  if (!ketQua) return loi('Mã cá nhân không đúng. Hỏi lại giáo viên chủ nhiệm.', 404);

  return json(ketQua);
});
