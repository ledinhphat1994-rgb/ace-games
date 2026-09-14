
// ─── Format Helpers ─────────────────────────────────────────────────────────
export function formatVND(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function formatTimeOnly(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

// ─── Preset Avatars: SVG gradient nội bộ (không phụ thuộc ảnh ngoài, tải tức thì) ──
export function taoAvatarSvg(bieuTuong, mauA, mauB) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mauA}"/><stop offset="1" stop-color="${mauB}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><text x="60" y="86" font-size="60" text-anchor="middle">${bieuTuong}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
export const PRESET_AVATARS = [
  { id: 'av-1', name: 'Cú đêm chăm học', url: taoAvatarSvg('🦉', '#0ea5e9', '#8B5CF6') },
  { id: 'av-2', name: 'Chiến thần ôn thi', url: taoAvatarSvg('⚡', '#f59e0b', '#ef4444') },
  { id: 'av-3', name: 'Kỹ sư tương lai', url: taoAvatarSvg('🤖', '#10b981', '#0ea5e9') },
  { id: 'av-4', name: 'Họa sĩ trẻ', url: taoAvatarSvg('🎨', '#ec4899', '#8B5CF6') },
  { id: 'av-5', name: 'Nhà toán học', url: taoAvatarSvg('📐', '#6366f1', '#00F2FE') },
  { id: 'av-6', name: 'Vận động viên', url: taoAvatarSvg('🏅', '#f97316', '#eab308') },
  { id: 'av-7', name: 'Mọt sách', url: taoAvatarSvg('📚', '#14b8a6', '#84cc16') },
  { id: 'av-8', name: 'Ngôi sao lớp', url: taoAvatarSvg('🌟', '#8B5CF6', '#00F2FE') }
];

// ─── Media Helpers (client) ─────────────────────────────────────────────────
export function idYoutube(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  let m = s.match(/[?&]v=([\w-]{11})/i);
  if (m) return m[1];
  m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:shorts|live|embed|v)\/)([\w-]{11})/i);
  if (m) return m[1];
  return null;
}
export function idGoogleDrive(url) {
  const m = String(url || '').match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
  return m ? m[1] : null;
}
// Link hình: khoa R2 → /api/anh?khoa= ; link Drive → lh3.googleusercontent.com ; https khác → giữ nguyên
export function xuLyLinkHinhFe(khoa) {
  if (!khoa) return '';
  if (/^https?:\/\//i.test(khoa)) {
    const m = khoa.match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1];
    return urlMediaFe(khoa);
  }
  return '/api/anh?khoa=' + encodeURIComponent(khoa);
}
// Link nhạc ngoài: Drive → uc download ; https khác → giữ nguyên
export function xuLyLinkNhacFe(url) {
  if (!url) return '';
  const m = String(url).match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?id=)([\w-]+)/i);
  if (m) return 'https://drive.google.com/uc?export=download&id=' + m[1];
  return urlMediaFe(url);
}
export function laVideoNhungFe(url) {
  return /facebook\.com|fb\.watch|tiktok\.com/i.test(String(url || ''));
}
// Chỉ cho phép https:// hoặc đường dẫn nội bộ "/" — chặn javascript:/data:/http://
export function urlMediaFe(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try { const u = new URL(s); if (u.protocol === 'https:') return s; } catch { }
  return '';
}
export function laVideoTrucTiepFe(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(String(url || ''));
}
export function thoiGianTruoc(iso) {
  if (!iso) return '';
  try {
    const d = new Date(String(iso).replace(' ', 'T') + (String(iso).includes('T') ? '' : 'Z'));
    const diff = (Date.now() - d.getTime()) / 1000;
    if (isNaN(diff) || diff < 0) return formatDateVN(String(iso).slice(0, 10));
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  } catch { return ''; }
}

export const EMOJI_CAM_XUC = { thich: '👍', tim: '❤️', haha: '😂', wow: '😮', buon: '😢', phan_no: '😠' };

// ─── Hệ thống thẻ hoạt động Campus (reusable) ────────────────────────────────
// Một loại phòng = một "identity" (icon, màu chủ đạo, nhãn). Trạng thái phòng
// suy ra từ dữ liệu thật (soNguoi = heartbeat trong 90 giây qua /api/phong).
export const PHONG_LOAI_UI = {
  chat:  { icon: 'community', mau: '#00F2FE', nhan: 'Trò chuyện' },
  video: { icon: 'tv',        mau: '#F43F5E', nhan: 'Xem chung' },
  nhac:  { icon: 'phones',    mau: '#8B5CF6', nhan: 'Âm nhạc' },
  game:  { icon: 'game',      mau: '#FFB800', nhan: 'Trò chơi' }
};
export const PHONG_LOAI_SANG_CAT = { chat: 'CHAT', video: 'CINEMA', game: 'GAME', nhac: 'LOFI' };

// Trạng thái phòng — domain model nhẹ, UI không tự quyết định nhãn.
// Có người trong phòng = "ĐANG HOẠT ĐỘNG" (presence), KHÔNG phải "TRỰC TIẾP" —
// nhãn TRỰC TIẾP chỉ dành cho sự kiện campus đang diễn ra.
export function trangThaiPhong(p) {
  return (p.soNguoi || 0) > 0
    ? { nhan: 'ĐANG HOẠT ĐỘNG', lopMau: 'bg-amber-500/15 text-amber-400 border-amber-500/30', cham: 'bg-amber-400 animate-pulse' }
    : { nhan: 'ĐANG MỞ',       lopMau: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', cham: 'bg-emerald-400' };
}

// Trạng thái sự kiện — suy từ field trangThai mà /api/su-kien tính sẵn.
export const SK_LOAI_UI = {
  chung: { icon: '📣', nhan: 'Chung' }, chat: { icon: '💬', nhan: 'Trò chuyện' },
  video: { icon: '🎬', nhan: 'Xem chung' }, nhac: { icon: '🎧', nhan: 'Âm nhạc' },
  game: { icon: '🎮', nhan: 'Trò chơi' }, 'hoc-tap': { icon: '📚', nhan: 'Học tập' },
  'cuoc-thi': { icon: '🏆', nhan: 'Cuộc thi' }
};
export function trangThaiSuKienUI(sk) {
  if (sk.trangThai === 'dang_dien_ra') return { nhan: 'TRỰC TIẾP', lopMau: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
  if (sk.trangThai === 'sap_dien_ra') return { nhan: 'SẮP DIỄN RA', lopMau: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  return { nhan: 'ĐÃ KẾT THÚC', lopMau: 'bg-white/5 text-slate-500 border-white/10' };
}

// Giờ VN (Asia/Ho_Chi_Minh) — máy chủ trả UTC ISO, trình duyệt hiển thị giờ VN.
export function dinhDangGioVN(iso) {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); }
  catch { return ''; }
}
export function dinhDangNgayGioVN(iso) {
  try { return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); }
  catch { return ''; }
}
// Đếm ngược ngắn gọn cho sự kiện sắp diễn ra.
export function demNguocSuKien(sk) {
  if (sk.trangThai === 'dang_dien_ra') return 'Đang diễn ra';
  if (sk.trangThai === 'da_ket_thuc') return 'Đã kết thúc';
  const p = sk.conLaiPhut || 0;
  if (p <= 0) return 'Sắp bắt đầu';
  if (p < 60) return `Bắt đầu sau ${p} phút`;
  if (sk.homNay) return `Hôm nay ${dinhDangGioVN(sk.batDau)}`;
  return dinhDangNgayGioVN(sk.batDau);
}

// Quyền quản trị sự kiện chính thức Campus — khớp đúng điều kiện canGiaoVien của backend.
export const canManageCampusEvents = (auth) => Boolean(auth?.user?.role === 'teacher');

// Chuẩn hoá phòng campus: phòng công khai từ /api/campus mặc định là 'truong', không suy diễn là private.
export function normalizeCampusRoom(r, isGuest) {
  if (!r) return r;
  const phamVi = r.phamVi || (isGuest ? 'truong' : (r.lopId ? 'lop' : 'truong'));
  return {
    ...r,
    phamVi,
    laToanTruong: phamVi === 'truong',
  };
}

export const CAMPUS_GAMES = [
  {
    id: 'caro',
    title: 'Caro 15×15',
    moTa: 'Đấu trường cờ Caro 15×15 đối kháng trực tiếp',
    icon: '⚔️',
    type: 'GAME_CARO'
  }
];

// ─── Phase 3C.1: Watch Together Component (Campus Cinema) ───────────────────
export function napYouTubeIframeApi(cb) {
  if (typeof window === 'undefined') return;
  if (window.YT && window.YT.Player) {
    if (cb) cb();
    return;
  }
  if (!window._ytCallbacks) window._ytCallbacks = [];
  if (cb) window._ytCallbacks.push(cb);

  // Nếu script đã hoặc đang được nạp: chạy interval kiểm tra để đảm bảo callback không bao giờ bị bỏ rơi
  if (window._ytLoading || window._ytReady || document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const checkTimer = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkTimer);
        while (window._ytCallbacks && window._ytCallbacks.length) {
          const fn = window._ytCallbacks.shift();
          try { fn(); } catch { }
        }
      }
    }, 50);
    setTimeout(() => clearInterval(checkTimer), 10000);
    return;
  }

  window._ytLoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  tag.async = true;
  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    window._ytReady = true;
    if (typeof prevReady === 'function') {
      try { prevReady(); } catch { }
    }
    if (window._ytCallbacks) {
      while (window._ytCallbacks.length) {
        const fn = window._ytCallbacks.shift();
        try { fn(); } catch { }
      }
    }
  };
  document.head.appendChild(tag);
}

export function dinhDangGiayPhut(s) {
  const t = Math.max(0, Math.floor(Number(s) || 0));
  const m = Math.floor(t / 60);
  const sec = t % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
