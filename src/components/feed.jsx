const { useState } = React;
import { EMOJI_CAM_XUC, PRESET_AVATARS, formatDateVN, idGoogleDrive, idYoutube, laVideoNhungFe, laVideoTrucTiepFe, thoiGianTruoc, urlMediaFe, xuLyLinkHinhFe, xuLyLinkNhacFe } from '../lib/helpers.js';
import { Ic } from '../lib/icons.js';


// ─── Thẻ bài đăng THẬT trên Bảng Tin (cảm xúc + bình luận qua /api/bai-dang/tuong-tac) ──
export function TheBaiDang({ bai, thietBiId, auth, onCanDangNhap }) {
  const [camXuc, setCamXuc] = useState({ tong: bai.tongCamXuc || 0, daChon: bai.camXucCuaToi || null });
  const [moBinhLuan, setMoBinhLuan] = useState(false);
  const [binhLuan, setBinhLuan] = useState(null);
  const [nhapBl, setNhapBl] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loiTt, setLoiTt] = useState('');

  const anhSrc = xuLyLinkHinhFe(bai.anhKhoa || bai.hinhKhoa || bai.hinhUrl);
  const maYt = idYoutube(bai.videoUrl);
  const maDrive = idGoogleDrive(bai.videoUrl);
  const videoNhung = !maYt && !maDrive && laVideoNhungFe(bai.videoUrl) ? urlMediaFe(bai.videoUrl) : '';
  const videoTrucTiep = !maYt && !maDrive && !videoNhung && laVideoTrucTiepFe(bai.videoUrl) ? urlMediaFe(bai.videoUrl) : '';
  // Video thư viện: hoatDongLop có videoId → thu-vien-tep ; thongBao có videoKhoa → thong-bao-video
  const videoNoiBo = bai.videoId
    ? `/api/thu-vien-tep?loai=video&id=${bai.videoId}`
    : (bai.videoKhoa ? `/api/thong-bao-video?id=${bai.id}` : '');
  // Âm thanh: hoatDongLop amThanhId → thu-vien-tep ; thongBao nhacKhoa → thong-bao-nhac ; còn lại URL ngoài
  const audioSrc = bai.amThanhId
    ? `/api/thu-vien-tep?loai=am-thanh&id=${bai.amThanhId}`
    : (bai.nhacKhoa && !/^https?:\/\//i.test(bai.nhacKhoa)
        ? `/api/thong-bao-nhac?id=${bai.id}`
        : xuLyLinkNhacFe(bai.amThanhUrl || (/^https?:\/\//i.test(bai.nhacKhoa || '') ? bai.nhacKhoa : '')));

  const thaCamXuc = async (loai) => {
    if (auth?.isGuest) { onCanDangNhap(); return; }
    try {
      const res = await fetch('/api/bai-dang/tuong-tac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baiDangId: bai.id, loaiCamXuc: camXuc.daChon === loai ? 'none' : loai, thietBiId })
      });
      const d = await res.json();
      if (d.ok && d.camXuc) setCamXuc({ tong: d.camXuc.tong || 0, daChon: d.camXuc.daChon || null });
      else setLoiTt(d.loi || 'Không gửi được cảm xúc.');
    } catch { setLoiTt('Mất kết nối máy chủ.'); }
  };

  const taiBinhLuan = async () => {
    try {
      const res = await fetch(`/api/bai-dang/tuong-tac?baiDangId=${bai.id}&thietBiId=${encodeURIComponent(thietBiId)}`);
      const d = await res.json();
      if (d.ok) {
        setBinhLuan(d.binhLuan || []);
        if (d.camXuc) setCamXuc({ tong: d.camXuc.tong || 0, daChon: d.camXuc.daChon || null });
      }
    } catch { /* giữ nguyên */ }
  };

  const batBinhLuan = () => {
    const mo = !moBinhLuan;
    setMoBinhLuan(mo);
    if (mo && binhLuan === null) taiBinhLuan();
  };

  const guiBinhLuan = async (e) => {
    e.preventDefault();
    const text = nhapBl.trim();
    if (!text || dangGui) return;
    if (auth?.isGuest) { onCanDangNhap(); return; }
    setDangGui(true);
    setLoiTt('');
    try {
      const res = await fetch('/api/bai-dang/tuong-tac', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baiDangId: bai.id, noiDung: text, thietBiId })
      });
      const d = await res.json();
      if (d.ok) { setNhapBl(''); taiBinhLuan(); }
      else setLoiTt(d.loi || 'Không gửi được bình luận.');
    } catch { setLoiTt('Mất kết nối máy chủ.'); }
    finally { setDangGui(false); }
  };

  return (
    <div className="bg-[#151A23] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
            <img src={PRESET_AVATARS[7].url} alt="10A7" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Bảng Tin 10A7</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30 font-bold">Hoạt động lớp</span>
            </div>
            <p className="text-[11px] text-slate-400">{thoiGianTruoc(bai.taoLuc || bai.ngay)}{bai.luotXem ? ` • ${bai.luotXem} lượt xem` : ''}</p>
          </div>
        </div>
      </div>

      {bai.tieuDe && <h3 className="text-sm font-extrabold text-white mb-2 leading-relaxed">{bai.tieuDe}</h3>}
      {bai.noiDungHtml
        ? <div className="text-xs text-slate-300 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: bai.noiDungHtml }} />
        : (bai.chuThich || bai.noiDung) && <p className="text-xs text-slate-300 leading-relaxed mb-3 whitespace-pre-line">{bai.chuThich || bai.noiDung}</p>}

      {anhSrc && (
        <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black">
          <img src={anhSrc} alt={bai.tieuDe || 'Ảnh hoạt động lớp'} loading="lazy" className="w-full max-h-[420px] object-cover" />
        </div>
      )}

      {videoNoiBo && (
        <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black">
          <video src={videoNoiBo} controls preload="metadata" className="w-full max-h-[420px]" />
        </div>
      )}
      {!videoNoiBo && maYt && (
        <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black aspect-video">
          <iframe src={`https://www.youtube.com/embed/${maYt}`} title={bai.tieuDe || 'Video YouTube'} loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            className="w-full h-full" />
        </div>
      )}
      {!videoNoiBo && !maYt && maDrive && (
        <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black aspect-video">
          <iframe src={`https://drive.google.com/file/d/${maDrive}/preview`} title={bai.tieuDe || 'Video Drive'} loading="lazy"
            allow="autoplay; fullscreen" allowFullScreen className="w-full h-full" />
        </div>
      )}
      {!videoNoiBo && !maYt && !maDrive && videoNhung && (
        <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black aspect-video">
          <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoNhung)}&show_text=0`} title={bai.tieuDe || 'Video'} loading="lazy"
            allow="autoplay; fullscreen" allowFullScreen className="w-full h-full" />
        </div>
      )}
      {!videoNoiBo && !maYt && !maDrive && !videoNhung && videoTrucTiep && (
        <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black">
          <video src={videoTrucTiep} controls preload="metadata" className="w-full max-h-[420px]" />
        </div>
      )}

      {audioSrc && (
        <div className="rounded-xl border border-white/10 mb-3 bg-[#0B0E14] p-3">
          <audio src={audioSrc} controls preload="none" className="w-full h-9" />
          {bai.amThanhTen && <p className="text-[10px] text-slate-400 mt-1">🎵 {bai.amThanhTen}</p>}
        </div>
      )}

      {/* Thanh cảm xúc & bình luận — số liệu THẬT từ bai_dang_cam_xuc/binh_luan */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <button onClick={() => thaCamXuc('tim')}
            className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all ${camXuc.daChon ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}>
            <span>{camXuc.daChon ? (EMOJI_CAM_XUC[camXuc.daChon] || '❤️') : '❤️'}</span>
            <span>{camXuc.tong}</span>
          </button>
          <button onClick={() => thaCamXuc('thich')} title="Thích"
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all">
            👍
          </button>
          <button onClick={() => thaCamXuc('haha')} title="Haha"
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all">
            😂
          </button>
        </div>
        <button onClick={batBinhLuan} className="text-xs text-[#00F2FE] hover:underline font-bold">
          {(bai.tongBinhLuan || 0) + (binhLuan ? Math.max(0, binhLuan.length - (bai.tongBinhLuan || 0)) : 0)} phản hồi {moBinhLuan ? '▲' : '▼'}
        </button>
      </div>

      {loiTt && <p className="text-[11px] text-rose-400 mt-2">{loiTt}</p>}

      {moBinhLuan && (
        <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
          {binhLuan === null ? (
            <p className="text-[11px] text-slate-500">Đang tải bình luận…</p>
          ) : binhLuan.length === 0 ? (
            <p className="text-[11px] text-slate-500">Chưa có bình luận nào — hãy là người đầu tiên!</p>
          ) : (
            binhLuan.map(c => (
              <div key={c.id} className="bg-[#0B0E14]/60 p-3 rounded-xl text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">{c.nguoiDungTen}</span>
                  {c.vaiTro === 'giao_vien' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-[#FFB800] font-bold">Giáo viên</span>
                  )}
                  {c.vaiTro === 'can_bo' && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-[#00F2FE] font-bold">Cán sự</span>
                  )}
                  <span className="text-[10px] text-slate-500">• {thoiGianTruoc(c.taoLuc)}</span>
                </div>
                <p className="text-slate-300 whitespace-pre-line">{c.noiDung}</p>
              </div>
            ))
          )}
          <form onSubmit={guiBinhLuan} className="flex items-center gap-2">
            <input type="text" value={nhapBl} onChange={e => setNhapBl(e.target.value)}
              placeholder="Viết bình luận…" maxLength={1000}
              className="flex-1 bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />
            <button type="submit" disabled={dangGui}
              className="p-2.5 rounded-xl bg-[#00F2FE] text-black hover:bg-[#00e1ec] transition-all disabled:opacity-50">
              <Ic name="send" className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── ANNOUNCEMENT TICKER (REGION 5 - PHASE 4B) ──────────────────────────────
export function AnnouncementTicker({ announcements = [], onSelectAnnouncement }) {
  const [isPaused, setIsPaused] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [mobileIndex, setMobileIndex] = React.useState(0);

  React.useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const handler = (e) => setPrefersReducedMotion(e.matches);
      if (mq.addEventListener) mq.addEventListener('change', handler);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', handler);
      };
    } catch {}
  }, []);

  const published = (announcements || []).filter(tb => tb.trangThai === 'published' || !tb.trangThai);
  if (published.length === 0) return null;

  return (
    <div
      id="campus-announcement-ticker"
      className="w-full bg-[#121620] border border-cyan-500/25 hover:border-cyan-500/45 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-md flex items-center gap-3 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#00F2FE]/40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={0}
      role="region"
      aria-label="Thông báo giáo viên"
      aria-live="off"
    >
      <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#00F2FE] text-xs font-black">
        <span>📢</span>
        <span className="hidden sm:inline">THÔNG BÁO</span>
      </div>

      {prefersReducedMotion ? (
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectAnnouncement && onSelectAnnouncement(published[mobileIndex])}
            className="flex-1 min-w-0 text-left text-xs font-bold text-slate-200 hover:text-[#00F2FE] truncate transition-colors flex items-center gap-2">
            {published[mobileIndex]?.ghim === 1 && <span className="text-amber-400">📌</span>}
            {published[mobileIndex]?.loai === 'tin_khan' && <span className="text-rose-400">🚨</span>}
            <span className="truncate">{published[mobileIndex]?.tieuDe}</span>
          </button>
          {published.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMobileIndex(prev => (prev - 1 + published.length) % published.length); }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-[10px]"
                aria-label="Thông báo trước">
                ‹
              </button>
              <span className="text-[10px] text-slate-400 font-mono px-1">{mobileIndex + 1}/{published.length}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMobileIndex(prev => (prev + 1) % published.length); }}
                className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-[10px]"
                aria-label="Thông báo kế tiếp">
                ›
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <div
            className="ticker-track flex items-center gap-8 text-xs text-slate-200 font-medium"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {[...published, ...published].map((tb, idx) => (
              <button
                key={`ticker-${tb.id}-${idx}`}
                type="button"
                onClick={() => onSelectAnnouncement && onSelectAnnouncement(tb)}
                className="flex items-center gap-2 hover:text-[#00F2FE] transition-colors focus:outline-none focus:text-[#00F2FE] shrink-0"
              >
                {tb.ghim === 1 && <span className="text-amber-400">📌</span>}
                {tb.loai === 'tin_khan' && <span className="text-rose-400">🚨</span>}
                {tb.loai === 'lich_thi' && <span className="text-blue-400">📅</span>}
                <span className="font-bold">{tb.tieuDe}</span>
                <span className="text-slate-500 font-normal">•</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ANNOUNCEMENT DETAIL MODAL ────────────────────────────────────────────────
export function AnnouncementDetailModal({ announcement, onClose }) {
  if (!announcement) return null;

  return (
    <div id="modal-announcement-detail" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-white/20 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {announcement.anhBia && (
          <div className="w-full max-h-56 overflow-hidden border-b border-white/10 shrink-0">
            <img src={announcement.anhBia} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {announcement.ghim === 1 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                📌 GHIM
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
              {announcement.loai === 'tin_khan' ? '🚨 TIN KHẨN' : (announcement.loai === 'lich_hoc' ? '📅 LỊCH HỌC' : '📢 THÔNG BÁO')}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white leading-snug mb-3">
            {announcement.tieuDe}
          </h3>

          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>{announcement.nguoiTaoVaiTro === 'teacher' ? '👨‍🏫' : '✍️'}</span>
              <span className="font-semibold text-slate-200">{announcement.nguoiTaoTen}</span>
            </span>
            <span className="font-mono text-[11px]">
              {announcement.xuatBanLuc ? formatDateVN(announcement.xuatBanLuc.slice(0, 10)) : (announcement.taoLuc ? formatDateVN(announcement.taoLuc.slice(0, 10)) : '')}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {announcement.noiDung}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#181F2C] flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
