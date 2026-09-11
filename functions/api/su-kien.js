// API Sự kiện Digital Campus — sự kiện TOÀN TRƯỜNG do giáo viên tạo.
// GET là công khai (khách vãng lai xem được): chỉ trả các trường an toàn,
// không lộ danh tính học sinh, lớp hay dữ liệu riêng của lớp.
// POST/PUT/DELETE chỉ giáo viên (canGiaoVien).
import { bocXuLy, docThan, json, loi, chuoi, ngayVNHomNay } from '../_lib/api.js';

const LOAI_SU_KIEN = ['chung', 'chat', 'video', 'nhac', 'game', 'hoc-tap', 'cuoc-thi'];
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

// Kiểm tra + chuẩn hoá dữ liệu sự kiện từ body. Trả {loi} hoặc {dl}.
async function kiemTraSuKien(db, than) {
  const tieuDe = chuoi(than.tieuDe, 120);
  const moTa = chuoi(than.moTa, 500);
  const loai = LOAI_SU_KIEN.includes(than.loai) ? than.loai : 'chung';
  if (tieuDe.length < 3) return { loi: 'Tên sự kiện ít nhất 3 ký tự.' };

  const bd = Date.parse(than.batDau);
  const kt = Date.parse(than.ketThuc);
  if (isNaN(bd) || isNaN(kt)) return { loi: 'Giờ bắt đầu / kết thúc không hợp lệ.' };
  if (kt <= bd) return { loi: 'Giờ kết thúc phải sau giờ bắt đầu.' };

  let phongId = null;
  if (than.phongId) {
    const pid = parseInt(than.phongId, 10);
    const p = await db.prepare(
      `SELECT id FROM phong WHERE id = ?1 AND trang_thai = 'mo' AND pham_vi = 'truong'`
    ).bind(pid).first();
    if (!p) return { loi: 'Phòng gắn với sự kiện phải là phòng toàn trường đang mở.' };
    phongId = pid;
  }

  return {
    dl: {
      tieuDe, moTa: moTa || null, loai,
      batDau: new Date(bd).toISOString(), ketThuc: new Date(kt).toISOString(),
      phongId, noiBat: than.noiBat ? 1 : 0
    }
  };
}

// Chỉ giáo viên tạo sự kiện campus.
export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const k = await kiemTraSuKien(db, await docThan(request));
  if (k.loi) return loi(k.loi);
  const d = k.dl;
  const kq = await db.prepare(
    `INSERT INTO su_kien_campus (tieu_de, mo_ta, loai, bat_dau, ket_thuc, phong_id, noi_bat, tao_boi, tao_boi_ten)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
  ).bind(d.tieuDe, d.moTa, d.loai, d.batDau, d.ketThuc, d.phongId, d.noiBat,
         `gv:${phien.lopId || 1}`, phien.ten || phien.vaiTro || 'Giáo viên').run();
  return json({ ok: true, id: kq.meta?.last_row_id });
}, { canGiaoVien: true });

// Chỉ giáo viên sửa sự kiện.
export const onRequestPut = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const than = await docThan(request);
  const id = parseInt(than.id || '', 10);
  if (!(id > 0)) return loi('Thiếu sự kiện.', 400);
  const k = await kiemTraSuKien(db, than);
  if (k.loi) return loi(k.loi);
  const d = k.dl;
  await db.prepare(
    `UPDATE su_kien_campus
        SET tieu_de = ?1, mo_ta = ?2, loai = ?3, bat_dau = ?4, ket_thuc = ?5,
            phong_id = ?6, noi_bat = ?7, cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?8`
  ).bind(d.tieuDe, d.moTa, d.loai, d.batDau, d.ketThuc, d.phongId, d.noiBat, id).run();
  return json({ ok: true });
}, { canGiaoVien: true });

// Chỉ giáo viên huỷ sự kiện (xoá mềm).
export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = parseInt(than.id || '', 10);
  if (!(id > 0)) return loi('Thiếu sự kiện.', 400);
  await env.DB.prepare(
    `UPDATE su_kien_campus SET trang_thai = 'huy', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1`
  ).bind(id).run();
  return json({ ok: true });
}, { canGiaoVien: true });
