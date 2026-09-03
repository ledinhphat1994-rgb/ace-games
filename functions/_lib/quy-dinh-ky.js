// Tự động sinh từng kỳ thu (tuần/tháng) thành một khoản thu (quy_khoan) riêng,
// khi tới hạn — chạy mỗi khi giáo viên mở trang Thủ quỹ (không cần lịch chạy nền).
const TOI_DA_KY_TU_SINH = 30;   // chặn sinh quá nhiều kỳ một lúc nếu ngày bắt đầu đã lâu

function soNgay(a, b) {
  const A = new Date(a + 'T00:00:00Z');
  const B = new Date(b + 'T00:00:00Z');
  return Math.floor((B - A) / 86400000);
}

function soThangCach(a, b) {
  const A = new Date(a + 'T00:00:00Z');
  const B = new Date(b + 'T00:00:00Z');
  return (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + (B.getUTCMonth() - A.getUTCMonth());
}

function soNamCach(a, b) {
  const A = new Date(a + 'T00:00:00Z');
  const B = new Date(b + 'T00:00:00Z');
  return B.getUTCFullYear() - A.getUTCFullYear();
}

function tenKy(dk, kySo) {
  const bd = new Date(dk.ngay_bat_dau + 'T00:00:00Z');
  const dinhDangNgan = (d) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

  if (dk.chu_ky === 'tuan') {
    const dauKy = new Date(bd); dauKy.setUTCDate(dauKy.getUTCDate() + (kySo - 1) * 7);
    const cuoiKy = new Date(dauKy); cuoiKy.setUTCDate(cuoiKy.getUTCDate() + 6);
    return `${dk.ten} — Tuần ${kySo} (${dinhDangNgan(dauKy)}–${dinhDangNgan(cuoiKy)})`;
  }
  if (dk.chu_ky === 'nam') {
    const namKy = bd.getUTCFullYear() + (kySo - 1);
    return `${dk.ten} — Năm ${namKy}`;
  }
  const dauKy = new Date(Date.UTC(bd.getUTCFullYear(), bd.getUTCMonth() + (kySo - 1), 1));
  return `${dk.ten} — Tháng ${dauKy.getUTCMonth() + 1}/${dauKy.getUTCFullYear()}`;
}

/** Sinh các kỳ còn thiếu (tính tới hôm nay) cho mọi mẫu định kỳ đang hoạt động. */
export async function sinhKyConThieu(db) {
  const { results: dsDinhKy } = await db.prepare(
    'SELECT * FROM quy_dinh_ky WHERE dang_hoat_dong = 1'
  ).all();
  if (!dsDinhKy.length) return;

  const homNay = new Date().toISOString().slice(0, 10);
  const cauLenh = [];

  for (const dk of dsDinhKy) {
    if (dk.ngay_bat_dau > homNay) continue;   // chưa tới ngày bắt đầu

    const soKyDaQua = dk.chu_ky === 'tuan'
      ? Math.floor(soNgay(dk.ngay_bat_dau, homNay) / 7) + 1
      : dk.chu_ky === 'nam'
        ? soNamCach(dk.ngay_bat_dau, homNay) + 1
        : soThangCach(dk.ngay_bat_dau, homNay) + 1;

    const kyToiDa = Math.min(soKyDaQua, TOI_DA_KY_TU_SINH);

    const { results: daCo } = await db.prepare(
      'SELECT ky_so FROM quy_khoan WHERE dinh_ky_id = ?1'
    ).bind(dk.id).all();
    const tapDaCo = new Set(daCo.map((r) => r.ky_so));

    for (let ky = 1; ky <= kyToiDa; ky++) {
      if (tapDaCo.has(ky)) continue;
      cauLenh.push(
        db.prepare(
          'INSERT INTO quy_khoan (ten, hoc_ky, so_tien_moi_em, dinh_ky_id, ky_so) VALUES (?1, 1, ?2, ?3, ?4)'
        ).bind(tenKy(dk, ky), dk.so_tien_moi_ky, dk.id, ky)
      );
    }
  }

  if (cauLenh.length) await db.batch(cauLenh);
}
