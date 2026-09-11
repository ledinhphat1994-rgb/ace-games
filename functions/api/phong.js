// API Phòng hoạt động động của Digital Campus — mọi học sinh/giáo viên đăng nhập
// đều tạo và vào phòng được. Phòng pham_vi='truong' mở cho học sinh TẤT CẢ các lớp
// (liên lớp); pham_vi='lop' chỉ học sinh cùng lớp chủ phòng (và giáo viên) vào được.
import { bocXuLy, docThan, json, loi, chuoi, chuanUrlMedia } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';

const LOAI_PHONG = ['chat', 'video', 'nhac', 'game'];
const SO_PHONG_TOI_DA = 3;            // mỗi người mở tối đa 3 phòng cùng lúc — chống spam
const NHIP_HIEU_LUC = '-90 seconds';  // thành viên còn "tươi" trong 90 giây = đang trong phòng

// Khoá định danh phiên — dùng cho chủ phòng, thành viên, tin nhắn.
function khoaPhien(phien) {
  if (phien.role === 'teacher') return `gv:${phien.lopId || 1}`;
  if (phien.hocSinhId) return `hs:${phien.hocSinhId}`;
  return `phu:${phien.phuId || 0}`;
}
const vaiTroCua = (phien) => (phien.role === 'teacher' ? 'giao_vien' : 'hoc_sinh');
const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

// Tạo bảng nếu môi trường chưa chạy migration 61 (an toàn, IF NOT EXISTS).
async function damBaoBang(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS phong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loai TEXT NOT NULL DEFAULT 'chat',
    ten TEXT NOT NULL,
    mo_ta TEXT,
    pham_vi TEXT NOT NULL DEFAULT 'truong',
    lop_id INTEGER REFERENCES lop(id),
    chu_phong_khoa TEXT NOT NULL,
    chu_phong_ten TEXT NOT NULL,
    cau_hinh TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    tao_luc TEXT DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => {});
  await db.prepare(`CREATE TABLE IF NOT EXISTS phong_thanh_vien (
    phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
    khoa TEXT NOT NULL,
    hoc_sinh_id INTEGER,
    ten TEXT NOT NULL,
    vai_tro TEXT NOT NULL DEFAULT 'hoc_sinh',
    lop_id INTEGER,
    hoat_dong_luc TEXT NOT NULL,
    vao_luc TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (phong_id, khoa)
  )`).run().catch(() => {});
}

async function layPhong(db, id) {
  return db.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
            p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen,
            p.cau_hinh AS cauHinh, p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
            l.ten AS lopTen,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?2)) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE p.id = ?1`
  ).bind(id, NHIP_HIEU_LUC).first();
}

// Học sinh chỉ vào được phòng 'truong' hoặc phòng 'lop' của đúng lớp mình.
// Giáo viên vào được mọi phòng (giám sát).
function duocVao(phong, phien) {
  if (!phong || phong.trangThai !== 'mo') return false;
  if (phong.phamVi === 'truong') return true;
  if (phien.role === 'teacher') return true;
  return phong.lopId === phien.lopId;
}

async function ghiNhanVao(db, phongId, phien) {
  const khoa = khoaPhien(phien);
  await db.prepare(
    `INSERT INTO phong_thanh_vien (phong_id, khoa, hoc_sinh_id, ten, vai_tro, lop_id, hoat_dong_luc)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
     ON CONFLICT(phong_id, khoa) DO UPDATE SET hoat_dong_luc = datetime('now'), ten = ?4`
  ).bind(phongId, khoa, phien.hocSinhId || null, tenCua(phien), vaiTroCua(phien), phien.lopId || null).run();
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  // Dọn thành viên đã "chết" heartbeat (rời phòng không bấm nút / đóng tab).
  await db.prepare(
    `DELETE FROM phong_thanh_vien WHERE datetime(hoat_dong_luc) < datetime('now', '-15 minutes')`
  ).run().catch(() => {});

  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('id') || '', 10);

  // Chi tiết 1 phòng + danh sách thành viên đang trong phòng.
  if (phongId > 0) {
    const p = await layPhong(db, phongId);
    if (!p || p.trangThai !== 'mo') return loi('Phòng không tồn tại hoặc đã đóng.', 404);
    if (!duocVao(p, phien)) return loi('Phòng này chỉ dành cho lớp ' + (p.lopTen || 'khác') + '.', 403);
    const tv = await db.prepare(
      `SELECT v.khoa, v.ten, v.vai_tro AS vaiTro, v.lop_id AS lopId, l.ten AS lopTen,
              (v.khoa = ?2) AS laChuPhong
         FROM phong_thanh_vien v LEFT JOIN lop l ON l.id = v.lop_id
        WHERE v.phong_id = ?1 AND datetime(v.hoat_dong_luc) > datetime('now', ?3)
        ORDER BY v.vao_luc ASC LIMIT 60`
    ).bind(phongId, p.chuPhongKhoa, NHIP_HIEU_LUC).all();
    return json({ ok: true, phong: p, thanhVien: tv.results || [], minhKhoa: khoaPhien(phien) });
  }

  // Danh sách phòng đang mở: toàn bộ phòng 'truong' + phòng 'lop' của lớp mình.
  const rs = await db.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
            p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen,
            p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
            l.ten AS lopTen,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?3)) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE p.trang_thai = 'mo'
        AND (p.pham_vi = 'truong' OR p.lop_id = ?1 OR ?2 = 1)
      ORDER BY (p.chu_phong_khoa = 'he-thong') DESC, soNguoi DESC, p.tao_luc DESC
      LIMIT 50`
  ).bind(phien.lopId || 0, phien.role === 'teacher' ? 1 : 0, NHIP_HIEU_LUC).all();

  return json({ ok: true, phongs: rs.results || [] });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const than = await docThan(request);
  const hanhDong = chuoi(than.hanhDong, 20);
  const khoa = khoaPhien(phien);

  // ── TẠO PHÒNG — mọi học sinh/GV đăng nhập đều được ──
  if (hanhDong === 'tao') {
    const ten = chuoi(than.ten, 80);
    const moTa = chuoi(than.moTa, 300);
    const loai = LOAI_PHONG.includes(than.loai) ? than.loai : 'chat';
    const phamVi = than.phamVi === 'lop' ? 'lop' : 'truong';
    if (ten.length < 2) return loi('Đặt tên phòng ít nhất 2 ký tự.');

    const cauHinh = {};
    if (loai === 'video') {
      const u = chuanUrlMedia(than.videoUrl);
      if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https:// (YouTube, Drive, mp4...).');
      if (!u) return loi('Phòng xem video cần dán link video (YouTube / Google Drive / mp4).');
      cauHinh.videoUrl = u;
    }

    const dangMo = await db.prepare(
      `SELECT COUNT(*) AS n FROM phong WHERE chu_phong_khoa = ?1 AND trang_thai = 'mo'`
    ).bind(khoa).first();
    if ((dangMo?.n || 0) >= SO_PHONG_TOI_DA) {
      return loi(`Mỗi người chỉ mở tối đa ${SO_PHONG_TOI_DA} phòng cùng lúc — đóng bớt phòng cũ rồi tạo lại.`, 429);
    }

    const kq = await db.prepare(
      `INSERT INTO phong (loai, ten, mo_ta, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, cau_hinh)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    ).bind(loai, ten, moTa || null, phamVi, phien.lopId || null, khoa, tenCua(phien),
           Object.keys(cauHinh).length ? JSON.stringify(cauHinh) : null).run();
    const phongId = kq.meta?.last_row_id;
    await ghiNhanVao(db, phongId, phien);
    if (phien.hocSinhId) {
      await ghiNhanHoatDong(env, { hocSinhId: phien.hocSinhId, lopId: phien.lopId, loaiHoatDong: 'chat', moTa: `Tạo phòng "${ten}"` }).catch(() => {});
    }
    return json({ ok: true, phong: await layPhong(db, phongId) });
  }

  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);
  const p = await layPhong(db, phongId);

  // ── VÀO PHÒNG / NHỊP heartbeat (giữ chỗ trong phòng) ──
  if (hanhDong === 'vao' || hanhDong === 'nhip') {
    if (!duocVao(p, phien)) {
      return loi(!p || p.trangThai !== 'mo' ? 'Phòng đã đóng.' : `Phòng này chỉ dành cho ${p.lopTen || 'lớp khác'}.`, 403);
    }
    await ghiNhanVao(db, phongId, phien);
    return json({ ok: true, phong: await layPhong(db, phongId) });
  }

  // ── RỜI PHÒNG ──
  if (hanhDong === 'roi') {
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2').bind(phongId, khoa).run();
    return json({ ok: true });
  }

  // ── ĐÓNG PHÒNG — chỉ chủ phòng hoặc giáo viên ──
  if (hanhDong === 'dong') {
    if (!p) return loi('Phòng không tồn tại.', 404);
    if (p.chuPhongKhoa !== khoa && phien.role !== 'teacher') {
      return loi('Chỉ chủ phòng hoặc giáo viên mới đóng được phòng.', 403);
    }
    await db.prepare(`UPDATE phong SET trang_thai = 'dong', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1`).bind(phongId).run();
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1').bind(phongId).run();
    return json({ ok: true });
  }

  return loi('Hành động không hợp lệ.', 400);
});
