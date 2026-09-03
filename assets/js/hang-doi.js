/* Hàng đợi gửi lại khi mất mạng.
 *
 * Dùng cho điểm danh: lớp học nhiều khi sóng yếu, giáo viên vẫn bấm được và
 * dữ liệu nằm chờ trong máy, tự gửi lên khi có mạng trở lại.
 *
 * An toàn: mỗi lần gửi là một phép "ghi đè theo ngày + buổi + học sinh", nên gửi lại
 * nhiều lần cũng ra đúng một kết quả, không sợ nhân đôi dữ liệu.
 * Chỉ xoá khỏi hàng đợi SAU KHI máy chủ xác nhận đã lưu.
 */

const KHOA = 'c10a7-hang-doi';
const TOI_DA = 60;   // giữ tối đa 60 lần điểm danh chờ gửi

function doc() {
  try {
    const t = localStorage.getItem(KHOA);
    return t ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}

function ghi(ds) {
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds.slice(-TOI_DA)));
  } catch {
    /* hết chỗ lưu thì đành chịu, phần gọi sẽ báo cho người dùng */
  }
}

export function soChoGui() {
  return doc().length;
}

/** Đưa một lần điểm danh vào hàng đợi. Nếu đã có bản ghi cùng ngày+buổi thì gộp vào. */
export function themVaoHangDoi(muc) {
  const ds = doc();
  const cu = ds.find((x) => x.ngay === muc.ngay && x.buoi === muc.buoi);

  if (cu) {
    // Bản mới đè lên bản cũ cho từng học sinh.
    const theoHs = new Map(cu.ghiNhan.map((g) => [g.hocSinhId, g]));
    muc.ghiNhan.forEach((g) => theoHs.set(g.hocSinhId, g));
    cu.ghiNhan = [...theoHs.values()];
    cu.luc = Date.now();
  } else {
    ds.push({ ...muc, luc: Date.now() });
  }

  ghi(ds);
  return ds.length;
}

/**
 * Thử gửi lại toàn bộ hàng đợi.
 * @returns {Promise<{daGui:number, conLai:number}>}
 */
export async function dongBo() {
  const ds = doc();
  if (!ds.length) return { daGui: 0, conLai: 0 };

  const conLai = [];
  let daGui = 0;

  for (const muc of ds) {
    try {
      const res = await fetch('/api/gv/diem-danh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngay: muc.ngay, buoi: muc.buoi, ghiNhan: muc.ghiNhan }),
      });

      if (res.ok) { daGui++; continue; }

      // Máy chủ từ chối vì dữ liệu sai — giữ lại cũng vô ích, bỏ đi để khỏi kẹt hàng đợi.
      if (res.status >= 400 && res.status < 500 && res.status !== 401) {
        console.warn('Bản ghi điểm danh bị máy chủ từ chối, đã bỏ:', muc, res.status);
        continue;
      }

      conLai.push(muc);   // lỗi máy chủ hoặc chưa đăng nhập: giữ lại, thử sau
    } catch {
      conLai.push(muc);   // mất mạng: giữ lại
    }
  }

  ghi(conLai);
  return { daGui, conLai: conLai.length };
}

export function xoaHangDoi() {
  try { localStorage.removeItem(KHOA); } catch { /* bỏ qua */ }
}

/** Gọi khiCoThayDoi mỗi khi hàng đợi được gửi đi (dùng để vẽ lại giao diện). */
export function tuDongBoKhiCoMang(khiCoThayDoi) {
  const thu = async () => {
    if (!soChoGui()) return;
    const kq = await dongBo();
    if (kq.daGui) khiCoThayDoi(kq);
  };

  addEventListener('online', thu);
  // Thử một lần khi mở trang, phòng khi lần trước đóng máy giữa chừng.
  if (navigator.onLine) setTimeout(thu, 1200);
}
