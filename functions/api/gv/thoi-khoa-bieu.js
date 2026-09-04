// Thời khoá biểu — có phiên bản, có buổi sáng + chiều.
//
// Mỗi lần đổi lịch thật sự tạo MỘT PHIÊN BẢN MỚI với ngày áp dụng riêng.
// Phiên bản cũ không bị xoá — vẫn tra cứu lại được. Phiên bản "đang áp dụng"
// là phiên bản có ngay_bat_dau gần nhất mà không lớn hơn hôm nay.
//
//   GET  /api/gv/thoi-khoa-bieu                 -> phiên bản đang áp dụng
//   GET  /api/gv/thoi-khoa-bieu?phienBanId=5     -> xem một phiên bản cụ thể (kể cả cũ)
//   GET  /api/gv/thoi-khoa-bieu?ds=1             -> danh sách mọi phiên bản
//   POST /api/gv/thoi-khoa-bieu  { ten, ngayBatDau, ghiChu, o:[{buoi,thu,tiet,mon}] }
//        -> tạo phiên bản mới, tự đóng phiên bản đang áp dụng lại đúng trước ngày này
//   PATCH /api/gv/thoi-khoa-bieu { phienBanId, o:[{buoi,thu,tiet,mon}] }
//        -> SỬA NHANH đúng phiên bản đó tại chỗ (thay hết các ô), KHÔNG tạo phiên bản mới.
//           Dùng khi gõ nhầm tên môn/tiết — đổi lịch thật sự vẫn nên dùng POST (tạo phiên bản mới).
//   DELETE /api/gv/thoi-khoa-bieu?phienBanId=5   -> xoá một phiên bản (không phải bản đang áp dụng)
import { bocXuLy, json, loi, docThan, ngayHopLe } from '../../_lib/api.js';

async function layPhienBanApDung(db, homNay) {
  return db.prepare(
    `SELECT id, ten, ngay_bat_dau AS ngayBatDau, ngay_ket_thuc AS ngayKetThuc, ghi_chu AS ghiChu
       FROM tkb_phien_ban
      WHERE ngay_bat_dau <= ?1
      ORDER BY ngay_bat_dau DESC, id DESC LIMIT 1`
  ).bind(homNay).first();
}

async function layO(db, phienBanId) {
  const { results } = await db.prepare(
    'SELECT id, buoi, thu, tiet, mon, phong FROM tkb_o WHERE phien_ban_id = ?1 ORDER BY buoi, tiet, thu'
  ).bind(phienBanId).all();
  return results;
}

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const q = new URL(request.url).searchParams;

  if (q.get('ds')) {
    const { results } = await db.prepare(
      `SELECT id, ten, ngay_bat_dau AS ngayBatDau, ngay_ket_thuc AS ngayKetThuc, ghi_chu AS ghiChu
         FROM tkb_phien_ban ORDER BY ngay_bat_dau DESC, id DESC`
    ).all();
    return json({ ok: true, danhSach: results });
  }

  const phienBanId = Number(q.get('phienBanId'));
  if (Number.isInteger(phienBanId) && phienBanId > 0) {
    const pb = await db.prepare(
      `SELECT id, ten, ngay_bat_dau AS ngayBatDau, ngay_ket_thuc AS ngayKetThuc, ghi_chu AS ghiChu
         FROM tkb_phien_ban WHERE id = ?1`
    ).bind(phienBanId).first();
    if (!pb) return loi('Không tìm thấy phiên bản này.', 404);
    return json({ ok: true, phienBan: pb, o: await layO(db, phienBanId) });
  }

  const homNay = new Date().toISOString().slice(0, 10);
  const pb = await layPhienBanApDung(db, homNay);
  if (!pb) return json({ ok: true, phienBan: null, o: [] });
  return json({ ok: true, phienBan: pb, o: await layO(db, pb.id) });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const { ten, ngayBatDau, ghiChu, o } = await docThan(request);

  if (!ngayHopLe(ngayBatDau)) return loi('Ngày áp dụng không hợp lệ.');
  const tenSach = String(ten || '').trim().slice(0, 200) || `Thời khoá biểu từ ${ngayBatDau}`;
  if (!Array.isArray(o)) return loi('Dữ liệu ô không hợp lệ.');
  if (o.length > 140) return loi('Quá nhiều ô trong một lần gửi.'); // 2 buổi × 6 thứ × ~12 tiết tối đa

  const hopLe = [];
  for (const x of o) {
    const buoi = x.buoi === 'chieu' ? 'chieu' : 'sang';
    const thu = Number(x.thu);
    const tiet = Number(x.tiet);
    if (!Number.isInteger(thu) || thu < 2 || thu > 7) return loi('Thứ không hợp lệ.');
    if (!Number.isInteger(tiet) || tiet < 1 || tiet > 12) return loi('Tiết không hợp lệ.');
    const mon = String(x.mon || '').trim().slice(0, 60);
    if (mon) hopLe.push({ buoi, thu, tiet, mon });
  }

  // Phiên bản đang áp dụng (nếu có, và có ngày bắt đầu SỚM HƠN phiên bản mới) sẽ được
  // đóng lại đúng một ngày trước ngày áp dụng của phiên bản mới.
  const homNay = new Date().toISOString().slice(0, 10);
  const dangApDung = await layPhienBanApDung(db, homNay);

  const cauLenh = [];
  if (dangApDung && dangApDung.ngayBatDau < ngayBatDau) {
    const homTruoc = new Date(ngayBatDau + 'T00:00:00Z');
    homTruoc.setUTCDate(homTruoc.getUTCDate() - 1);
    cauLenh.push(
      db.prepare('UPDATE tkb_phien_ban SET ngay_ket_thuc = ?1 WHERE id = ?2')
        .bind(homTruoc.toISOString().slice(0, 10), dangApDung.id)
    );
  }

  const kqTao = await db.prepare(
    'INSERT INTO tkb_phien_ban (ten, ngay_bat_dau, ghi_chu) VALUES (?1, ?2, ?3)'
  ).bind(tenSach, ngayBatDau, String(ghiChu || '').slice(0, 500)).run();
  const phienBanMoiId = kqTao.meta.last_row_id;

  hopLe.forEach((x) => {
    cauLenh.push(
      db.prepare('INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon) VALUES (?1, ?2, ?3, ?4, ?5)')
        .bind(phienBanMoiId, x.buoi, x.thu, x.tiet, x.mon)
    );
  });

  if (cauLenh.length) await db.batch(cauLenh);

  return json({ ok: true, phienBanId: phienBanMoiId, daLuu: hopLe.length });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const { phienBanId, o } = await docThan(request);

  const idSo = Number(phienBanId);
  if (!Number.isInteger(idSo) || idSo <= 0) return loi('Thiếu mã phiên bản.');
  if (!Array.isArray(o)) return loi('Dữ liệu ô không hợp lệ.');
  if (o.length > 140) return loi('Quá nhiều ô trong một lần gửi.');

  const pb = await db.prepare('SELECT id FROM tkb_phien_ban WHERE id = ?1').bind(idSo).first();
  if (!pb) return loi('Không tìm thấy phiên bản này.', 404);

  const hopLe = [];
  for (const x of o) {
    const buoi = x.buoi === 'chieu' ? 'chieu' : 'sang';
    const thu = Number(x.thu);
    const tiet = Number(x.tiet);
    if (!Number.isInteger(thu) || thu < 2 || thu > 7) return loi('Thứ không hợp lệ.');
    if (!Number.isInteger(tiet) || tiet < 1 || tiet > 12) return loi('Tiết không hợp lệ.');
    const mon = String(x.mon || '').trim().slice(0, 60);
    if (mon) hopLe.push({ buoi, thu, tiet, mon });
  }

  const cauLenh = [db.prepare('DELETE FROM tkb_o WHERE phien_ban_id = ?1').bind(idSo)];
  hopLe.forEach((x) => {
    cauLenh.push(
      db.prepare('INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon) VALUES (?1, ?2, ?3, ?4, ?5)')
        .bind(idSo, x.buoi, x.thu, x.tiet, x.mon)
    );
  });
  await db.batch(cauLenh);

  return json({ ok: true, daLuu: hopLe.length });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const db = env.DB;
  const phienBanId = Number(new URL(request.url).searchParams.get('phienBanId'));
  if (!Number.isInteger(phienBanId) || phienBanId <= 0) return loi('Thiếu mã phiên bản.');

  const homNay = new Date().toISOString().slice(0, 10);
  const dangApDung = await layPhienBanApDung(db, homNay);
  if (dangApDung && dangApDung.id === phienBanId) {
    return loi('Không thể xoá phiên bản đang áp dụng. Tạo phiên bản mới để thay thế thay vì xoá.');
  }

  await db.batch([
    db.prepare('DELETE FROM tkb_o WHERE phien_ban_id = ?1').bind(phienBanId),
    db.prepare('DELETE FROM tkb_phien_ban WHERE id = ?1').bind(phienBanId),
  ]);
  return json({ ok: true });
}, { canGiaoVien: true });
