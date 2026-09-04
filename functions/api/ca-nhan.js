// POST /api/ca-nhan { ma }
// Học sinh (đã vào bằng mã lớp) nhập mã cá nhân để xem kết quả CỦA CHÍNH MÌNH.
// Chỉ trả về dữ liệu của đúng em đó — không bao giờ trả danh sách cả lớp,
// không trả hoàn cảnh gia đình hay số điện thoại phụ huynh.
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

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  if (await quaNhieuLan(env, ip)) {
    return loi('Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429);
  }

  const { ma } = await docThan(request);
  // KHÔNG ép chữ hoa và KHÔNG giới hạn 20 ký tự ở đây — phải khớp đúng cách chuẩn hoá
  // dùng lúc giáo viên ĐẶT mã (chuanHoaMaTuyChinh, tối đa 32 ký tự, giữ nguyên hoa/thường).
  // Trước đây hai bên lệch nhau nên mã có chữ thường hoặc dài hơn 20 ký tự tra cứu không ra.
  const maSach = chuanHoaMaTuyChinh(ma);
  if (!maSach) return loi('Chưa nhập mã cá nhân.');

  // Làm chậm nhẹ để hạn chế dò mã.
  await new Promise((r) => setTimeout(r, 350));

  const hs = await db.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, h.gioi_tinh AS gioiTinh, h.ngay_sinh AS ngaySinh,
            h.lop_nghe AS lopNghe, h.to_hop AS toHop, h.chuc_vu AS chucVu, h.to_so AS toSo
       FROM ma_ca_nhan m JOIN hoc_sinh h ON h.id = m.hoc_sinh_id
      WHERE m.ma = ?1 AND h.dang_hoc = 1`
  ).bind(maSach).first();

  if (!hs) return loi('Mã cá nhân không đúng. Hỏi lại giáo viên chủ nhiệm.', 404);

  const [diemDanh, cacMon, diem, nhatKy, renLuyen] = await Promise.all([
    db.prepare(
      `SELECT ngay, buoi, trang_thai AS trangThai, ly_do AS lyDo
         FROM diem_danh WHERE hoc_sinh_id = ?1 ORDER BY ngay DESC LIMIT 90`
    ).bind(hs.id).all(),
    db.prepare('SELECT ma, ten, cach_danh_gia, so_dgtx FROM mon_hoc WHERE dang_hoc = 1 ORDER BY thu_tu').all(),
    db.prepare('SELECT mon, hoc_ki, loai, so_thu_tu, gia_tri, nhan_xet FROM diem WHERE hoc_sinh_id = ?1').bind(hs.id).all(),
    // Chỉ cho xem khen thưởng và nhắc nhở đã xử lý — không phơi bày ghi chú nội bộ.
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

  return json({
    ok: true,
    hocSinh: hs,
    chuyenCan: { ...dem, tong: diemDanh.results.length, chiTiet: diemDanh.results },
    soDiem,
    nhatKy: nhatKy.results,
  });
});
