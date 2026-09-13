// API Sự kiện Digital Campus — sự kiện TOÀN TRƯỜNG do giáo viên tạo.
// GET là công khai (khách vãng lai xem được): chỉ trả các trường an toàn,
// không lộ danh tính học sinh, lớp hay dữ liệu riêng của lớp.
// Khu quản trị hiện chỉ có quản lý tài khoản; endpoint này chỉ đọc.
import { json, loi, ngayVNHomNay } from '../_lib/api.js';

const GIO_KET_THUC_CON_HIEN = '-2 hours'; // sự kiện vừa kết thúc vẫn hiện một lát

// Chỉ SELECT các trường an toàn cho public — không có khoá phiên, không có lop_id.
const SELECT_AN_TOAN = `
  SELECT id, tieu_de AS tieuDe, mo_ta AS moTa, loai, bat_dau AS batDau,
         ket_thuc AS ketThuc, phong_id AS phongId, noi_bat AS noiBat,
         tao_boi_ten AS taoBoiTen, tao_luc AS taoLuc
    FROM su_kien_campus`;

async function damBaoBang(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS su_kien_campus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tieu_de TEXT NOT NULL,
    mo_ta TEXT,
    loai TEXT NOT NULL DEFAULT 'chung',
    bat_dau TEXT NOT NULL,
    ket_thuc TEXT NOT NULL,
    phong_id INTEGER REFERENCES phong(id),
    noi_bat INTEGER NOT NULL DEFAULT 0,
    tao_boi TEXT NOT NULL,
    tao_boi_ten TEXT NOT NULL,
    trang_thai TEXT NOT NULL DEFAULT 'hoat_dong',
    tao_luc TEXT DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => {});
}

// Trạng thái suy ra từ mốc giờ — không lưu thừa trong DB.
function trangThaiSuKien(batDau, ketThuc, bayGio) {
  const bd = Date.parse(batDau), kt = Date.parse(ketThuc);
  if (bayGio >= bd && bayGio <= kt) return 'dang_dien_ra';
  if (bayGio < bd) return 'sap_dien_ra';
  return 'da_ket_thuc';
}

function themTrangThai(rows) {
  const bayGio = Date.now();
  const homNayVN = ngayVNHomNay();
  return rows.map(r => {
    const bd = new Date(r.batDau);
    const vnDate = new Date(bd.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      ...r,
      noiBat: !!r.noiBat,
      trangThai: trangThaiSuKien(r.batDau, r.ketThuc, bayGio),
      conLaiPhut: Math.max(0, Math.round((bd.getTime() - bayGio) / 60000)),
      homNay: vnDate === homNayVN
    };
  });
}

// Công khai — khách cũng xem được sự kiện campus (dữ liệu đã an toàn).
export async function onRequestGet({ env }) {
  try {
    const db = env.DB;
    await damBaoBang(db);
    const rs = await db.prepare(
      `${SELECT_AN_TOAN}
        WHERE trang_thai = 'hoat_dong' AND datetime(ket_thuc) > datetime('now', ?1)
        ORDER BY noi_bat DESC, bat_dau ASC LIMIT 20`
    ).bind(GIO_KET_THUC_CON_HIEN).all();
    return json({ ok: true, suKien: themTrangThai(rs.results || []) });
  } catch (e) {
    console.error('su-kien GET:', e);
    return loi('Không đọc được sự kiện.', 500);
  }
}
