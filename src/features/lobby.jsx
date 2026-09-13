import { idYoutube } from '../lib/helpers.js';
import { Ic } from '../lib/icons.js';


// ─── CAMPUS ACTIVITY UNIVERSE (PHASE 4G: TWO LIVING ACTIVITY WORLDS) ───────────────────
export function CampusActivityUniverse({
  onVaoHocTap,
  onVaoGame,
  soPhongHocTap = 0,
  soBanGame = 0
}) {
  return (
    <div
      id="campus-activity-universe"
      data-id="campus-activity-universe"
      className="relative w-full min-h-[540px] sm:min-h-[580px] lg:min-h-[620px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#090D15] via-[#0D121F] to-[#090D15] border border-white/10 shadow-2xl flex items-center justify-center select-none"
    >
      {/* Cosmic ambient stars & deep nebula glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Ambient Cyan glow (left / Học tập) */}
        <div className="absolute -top-12 -left-12 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px]" />
        {/* Ambient Amber glow (right / Game) */}
        <div className="absolute -bottom-12 -right-12 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px]" />
        {/* Ambient Violet accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-purple-500/5 blur-[120px]" />

        {/* Orbit track guides (subtle dashed ellipses) */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50%" cy="50%" rx="380" ry="160" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="6 8" />
          <ellipse cx="50%" cy="50%" rx="240" ry="100" fill="none" stroke="rgba(0,242,254,0.15)" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      {/* Universe Stage: Two large moving worlds */}
      <div className="relative w-full max-w-5xl h-full min-h-[520px] flex items-center justify-center">

        {/* ═══ WORLD 1: HỌC TẬP ═══ */}
        <div className="absolute world-orbit-container universe-orbit-hoctap z-20">
          <button
            type="button"
            id="world-hoc-tap"
            data-id="world-hoc-tap"
            onClick={onVaoHocTap}
            aria-label={`Học tập, YouTube Study. ${soPhongHocTap > 0 ? soPhongHocTap + ' phòng đang mở' : 'Khám phá ngay'}`}
            className="group relative w-60 h-60 sm:w-68 sm:h-68 lg:w-72 lg:h-72 rounded-full cursor-pointer flex flex-col items-center justify-center p-6 transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 shadow-[0_0_60px_rgba(0,242,254,0.25)]"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(6, 182, 212, 0.35) 0%, rgba(15, 23, 42, 0.92) 65%, #080c14 100%)',
              border: '2px solid rgba(0, 242, 254, 0.55)',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), inset 0 2px 14px rgba(0,242,254,0.35), 0 0 32px rgba(6,182,212,0.3)'
            }}
          >
            {/* Orbiting dashed ring */}
            <svg className="absolute inset-[-14px] w-[calc(100%+28px)] h-[calc(100%+28px)] portal-orbit-slow pointer-events-none" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="94" stroke="#00F2FE" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="8 6" />
              <circle cx="100" cy="6" r="4.5" fill="#00F2FE" className="drop-shadow-[0_0_8px_#00F2FE]" />
            </svg>

            {/* Satellite visual nodes */}
            <div className="absolute -top-3 -right-2 w-9 h-9 rounded-full bg-red-600/30 border border-red-400/60 flex items-center justify-center text-xs text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)] group-hover:scale-110 transition-transform" title="YouTube Media">
              ▶
            </div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.4)] group-hover:scale-110 transition-transform" title="Tìm kiếm">
              🔍
            </div>
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-xs text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform" title="Ghi chú & Voice">
              🎙️
            </div>

            {/* Central Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-red-500/20 to-purple-500/20 border border-cyan-400/50 flex items-center justify-center text-xl text-white mb-2 shadow-inner group-hover:scale-105 transition-transform">
              🎓
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase group-hover:text-cyan-300 transition-colors">
              HỌC TẬP
            </h3>

            <p className="text-[11px] font-bold text-cyan-300 mt-1 uppercase tracking-wider font-mono">
              YouTube Study
            </p>

            <span className="mt-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-cyan-400/15 text-cyan-200 border border-cyan-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{soPhongHocTap > 0 ? `${soPhongHocTap} phòng mở` : 'Khám phá'}</span>
            </span>
          </button>
        </div>

        {/* ═══ WORLD 2: GAME ═══ */}
        <div className="absolute world-orbit-container universe-orbit-game z-20">
          <button
            type="button"
            id="world-game"
            data-id="world-game"
            onClick={onVaoGame}
            aria-label={`Game, Đấu trường Caro 15x15. ${soBanGame > 0 ? soBanGame + ' bàn đang đấu' : 'Tham gia ngay'}`}
            className="group relative w-60 h-60 sm:w-68 sm:h-68 lg:w-72 lg:h-72 rounded-full cursor-pointer flex flex-col items-center justify-center p-6 transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400/50 shadow-[0_0_60px_rgba(245,158,11,0.25)]"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(245, 158, 11, 0.35) 0%, rgba(26, 18, 7, 0.92) 65%, #0d0a04 100%)',
              border: '2px solid rgba(251, 191, 36, 0.55)',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), inset 0 2px 14px rgba(251,191,36,0.35), 0 0 32px rgba(245,158,11,0.3)'
            }}
          >
            {/* Reverse orbiting dashed ring */}
            <svg className="absolute inset-[-14px] w-[calc(100%+28px)] h-[calc(100%+28px)] portal-orbit-rev pointer-events-none" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="94" stroke="#FFB800" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="8 6" />
              <circle cx="100" cy="6" r="4.5" fill="#FFB800" className="drop-shadow-[0_0_8px_#FFB800]" />
            </svg>

            {/* Orbiting X & O satellites */}
            <div className="absolute -top-2 -left-2 w-9 h-9 rounded-full bg-cyan-500/25 border border-cyan-400/60 flex items-center justify-center text-sm font-black text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.5)] group-hover:scale-110 transition-transform">
              X
            </div>
            <div className="absolute -bottom-3 -right-2 w-9 h-9 rounded-full bg-amber-500/25 border border-amber-400/60 flex items-center justify-center text-sm font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform">
              O
            </div>
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400/50 flex items-center justify-center text-xs text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.4)] group-hover:scale-110 transition-transform" title="Ghép nhanh">
              ⚡
            </div>

            {/* Central Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400/25 via-orange-500/20 to-rose-500/20 border border-amber-400/50 flex items-center justify-center text-xl text-white mb-2 shadow-inner group-hover:scale-105 transition-transform">
              ⚔️
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase group-hover:text-amber-300 transition-colors">
              GAME
            </h3>

            <p className="text-[11px] font-bold text-amber-300 mt-1 uppercase tracking-wider font-mono">
              Caro 15×15
            </p>

            <span className="mt-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-400/15 text-amber-200 border border-amber-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>{soBanGame > 0 ? `${soBanGame} bàn đấu` : 'Vào đấu trường'}</span>
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── ROOM PASSWORD MODAL (PHASE 4B) ─────────────────────────────────────────
export function RoomPasswordModal({ room, isOpen, onClose, onJoin }) {
  const [password, setPassword] = React.useState('');
  const [loi, setLoi] = React.useState('');
  const [dangVao, setDangVao] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setLoi('');
    }
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || dangVao) return;
    setDangVao(true);
    setLoi('');
    try {
      const err = await onJoin(room, password.trim());
      if (err) setLoi(err);
    } catch {
      setLoi('Lỗi khi vào phòng. Thử lại sau.');
    } finally {
      setDangVao(false);
    }
  };

  return (
    <div id="modal-room-password" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#151A23] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <h3 className="text-sm font-black text-white">Phòng Có Mật Khẩu</h3>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-all">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Phòng <strong className="text-white">"{room.ten}"</strong> được bảo vệ bằng mật khẩu. Vui lòng nhập mật khẩu để tham gia.
        </p>

        {loi && (
          <div className="p-3 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
            {loi}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Mật khẩu phòng:</label>
            <input
              type="password"
              id="input-room-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0B0E14] border border-white/15 focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all">
              Hủy
            </button>
            <button
              type="submit"
              id="btn-submit-room-password"
              disabled={dangVao || !password.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
              {dangVao ? 'Đang kiểm tra...' : 'Vào phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Form tạo phòng học tập rút gọn — hiện NGAY trong khung tìm YouTube (khung 1) của lobby Học
   tập, thay vì mở modal phủ kín màn hình. Không có ô "Loại phòng" vì lobby này luôn tạo phòng
   video; không có ô "Sức chứa" vì mặc định 8 người đã đủ dùng, giống bàn Caro không cho chỉnh. */
export function QuickTaoPhongForm({ ctl }) {
  const f = ctl.form;
  const dat = (patch) => ctl.setForm(truoc => ({ ...truoc, ...patch }));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><span>🍿</span> Tạo phòng học tập</h3>
        <button type="button" onClick={() => ctl.setShow(false)} aria-label="Đóng"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <Ic name="x" className="w-4 h-4" />
        </button>
      </div>

      <input type="text" value={f.ten} onChange={e => dat({ ten: e.target.value })} autoFocus
        placeholder="Tên phòng (VD: Góc ôn thi Toán)" maxLength={80}
        className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500" />

      <input type="text" value={f.videoUrl} onChange={e => dat({ videoUrl: e.target.value })}
        placeholder="Link video YouTube, Drive..." maxLength={1000}
        className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500" />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => dat({ phamVi: 'truong' })}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${f.phamVi === 'truong' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
          🌐 Toàn trường
        </button>
        <button type="button" onClick={() => dat({ phamVi: 'lop' })}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${f.phamVi === 'lop' ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
          🔒 Lớp tôi
        </button>
        <button type="button" onClick={() => dat({ access_mode: 'public', matKhau: '' })}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${(!f.access_mode || f.access_mode === 'public') ? 'bg-cyan-500/15 text-[#00F2FE] border-cyan-500/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
          🌐 Công khai
        </button>
        <button type="button" onClick={() => dat({ access_mode: 'password' })}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${f.access_mode === 'password' ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
          🔒 Có mật khẩu
        </button>
      </div>

      {f.access_mode === 'password' && (
        <input type="password" value={f.matKhau || ''} onChange={e => dat({ matKhau: e.target.value })}
          placeholder="Mật khẩu phòng" maxLength={100}
          className="w-full bg-[#0B0E14] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
      )}

      {ctl.loi && <p className="text-[11px] text-rose-400">{ctl.loi}</p>}

      <button onClick={ctl.submit} disabled={ctl.dangTao || f.ten.trim().length < 2 || !f.videoUrl?.trim()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs shadow-lg hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {ctl.dangTao ? 'Đang tạo…' : '🚀 Mở phòng ngay'}
      </button>
    </div>
  );
}

/* Form tạo bàn Caro rút gọn — hiện NGAY trong khung 1 của lobby Game (khung này vốn không tồn
   tại lúc rảnh, chỉ xuất hiện khi bấm "+ Tạo bàn"), thay modal phủ kín màn hình cũ. */
export function QuickTaoBanForm({ ctl }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><span>⚔️</span> Tạo bàn đấu Caro 15×15</h3>
        <button type="button" onClick={() => ctl.setShow(false)} aria-label="Đóng"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <Ic name="x" className="w-4 h-4" />
        </button>
      </div>

      <input type="text" value={ctl.ten} onChange={e => ctl.setTen(e.target.value)} autoFocus
        placeholder="Tên bàn đấu (tuỳ chọn)" maxLength={60}
        className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F2FE]" />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => ctl.setScope('truong')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${ctl.scope === 'truong' ? 'bg-purple-500/15 text-purple-300 border-purple-500/50' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
          🌐 Toàn trường
        </button>
        <button type="button" onClick={() => ctl.setScope('lop')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${ctl.scope === 'lop' ? 'bg-[#00F2FE]/15 text-[#00F2FE] border-[#00F2FE]/50' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
          🔒 Lớp tôi
        </button>
      </div>

      {ctl.loi && <p className="text-[11px] text-rose-400">{ctl.loi}</p>}

      <button onClick={ctl.submit} disabled={ctl.dangTao}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#8B5CF6] text-black font-extrabold text-xs shadow-lg hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {ctl.dangTao ? 'Đang tạo…' : '🚀 Tạo bàn ngay'}
      </button>
    </div>
  );
}

/* Khối tìm YouTube + xem trước video đã chọn — nội dung MẶC ĐỊNH của khung 1 lobby Học tập khi
   không có form tạo phòng nào đang mở. Tách riêng component để khung 1 chỉ còn 1 ternary đơn
   giản (form tạo phòng HOẶC khối này), không lồng nhiều JSX phức tạp ngay trong ActivityLobby. */
export function YoutubeSearchPanel({
  ytQuery, setYtQuery, ytResults, setYtResults, selectedYtVideo, setSelectedYtVideo,
  ytLoading, ytConfigured, ytError, onOpenTaoPhong
}) {
  return (
    <React.Fragment>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            id="yt-search-input"
            type="text"
            value={ytQuery}
            onChange={e => setYtQuery(e.target.value)}
            placeholder="🔍 Tìm video, bài giảng, nhạc học tập trên YouTube..."
            className="w-full bg-[#0B0E14] border border-white/15 focus:border-red-500 rounded-2xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
          <span className="absolute left-3.5 top-3.5 text-xs text-red-500">▶</span>
          {ytQuery && (
            <button
              type="button"
              onClick={() => { setYtQuery(''); setYtResults([]); setSelectedYtVideo(null); }}
              className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white">
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          id="btn-paste-youtube-url"
          onClick={() => {
            const url = prompt('Dán liên kết video YouTube (ví dụ: https://www.youtube.com/watch?v=...):');
            if (url && url.trim()) {
              if (onOpenTaoPhong) onOpenTaoPhong('video', url.trim(), 'Phòng học YouTube');
            }
          }}
          className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 shrink-0">
          <span>🔗</span>
          <span>Dán link</span>
        </button>
      </div>

      {!ytConfigured && (
        <div id="yt-search-not-configured" className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-slate-300 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">ℹ️</span>
            <span>Tìm kiếm YouTube hiện chưa khả dụng. Bạn vẫn có thể dán liên kết.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const url = prompt('Dán liên kết video YouTube (ví dụ: https://www.youtube.com/watch?v=...):');
              if (url && url.trim() && onOpenTaoPhong) {
                onOpenTaoPhong('video', url.trim(), 'Phòng học YouTube');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all">
            Dán link
          </button>
        </div>
      )}

      {ytLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-2xl bg-[#0B0E14] border border-white/5 flex flex-col gap-2.5 animate-pulse">
              <div className="w-full aspect-video bg-white/5 rounded-xl" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
              <div className="h-2.5 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {ytError && <div className="text-xs text-rose-400 py-1">{ytError}</div>}

      {selectedYtVideo && (
        <div id="yt-selected-preview" className="p-4 rounded-2xl bg-gradient-to-r from-red-950/30 via-[#0B0E14] to-purple-950/20 border border-red-500/40 flex flex-col sm:flex-row items-center gap-4 animate-scaleIn">
          <img src={selectedYtVideo.thumbnail} alt={selectedYtVideo.title} className="w-full sm:w-48 aspect-video object-cover rounded-xl border border-white/10 shrink-0" />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
              Video đã chọn
            </span>
            <h4 className="text-sm font-black text-white mt-1 line-clamp-2 leading-snug">
              {selectedYtVideo.title}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{selectedYtVideo.channelTitle}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-3">
              <button
                type="button"
                id="btn-create-room-with-video"
                data-id="btn-create-room-with-video"
                onClick={() => {
                  if (onOpenTaoPhong) {
                    onOpenTaoPhong('video', 'https://www.youtube.com/watch?v=' + selectedYtVideo.videoId, selectedYtVideo.title);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5">
                <span>+</span>
                <span>Tạo phòng với video này</span>
              </button>
              <button
                type="button"
                id="btn-change-video"
                data-id="btn-change-video"
                onClick={() => setSelectedYtVideo(null)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all">
                Đổi video
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedYtVideo && ytResults.length > 0 && (
        <div id="yt-search-results" className="flex flex-col gap-3 pt-2 border-t border-white/5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Kết quả tìm kiếm ({ytResults.length})</span>
            <span className="text-[10px] text-slate-500">Bấm "Chọn video" để xem trước và tạo phòng</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ytResults.map(v => (
              <div key={v.videoId} className="yt-result-card p-3 rounded-2xl bg-[#0B0E14] border border-white/10 hover:border-red-500/50 flex flex-col gap-2.5 transition-all group shadow-sm">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white">YouTube</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-300 transition-colors" title={v.title}>{v.title}</h5>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{v.channelTitle}</p>
                  </div>
                  <button
                    type="button"
                    id={`btn-choose-video-${v.videoId}`}
                    data-id="btn-choose-video"
                    onClick={() => setSelectedYtVideo(v)}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                    <span>Chọn video</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

export function ActivityLobby({
  lobbyId,
  onBack,
  onOpenTaoPhong,
  dsPhong = [],
  caroRooms = [],
  onVaoPhong,
  onVaoBanCaro,
  onTaoBanCaro,
  onQuickMatch,
  auth = {},
  taoPhongCtl,
  taoBanCtl
}) {
  const [roomFilter, setRoomFilter] = React.useState('ALL'); // 'ALL' | 'public' | 'private'
  const [ytQuery, setYtQuery] = React.useState('');
  const [ytResults, setYtResults] = React.useState([]);
  const [selectedYtVideo, setSelectedYtVideo] = React.useState(null);
  const [ytLoading, setYtLoading] = React.useState(false);
  const [ytConfigured, setYtConfigured] = React.useState(true);
  const [ytError, setYtError] = React.useState('');

  const searchSeqRef = React.useRef(0);
  const abortCtrlRef = React.useRef(null);

  React.useEffect(() => {
    if (lobbyId !== 'CINEMA') return;
    fetch('/api/youtube-search')
      .then(r => r.json())
      .then(d => {
        if (d && d.configured === false) setYtConfigured(false);
      })
      .catch(() => {});
  }, [lobbyId]);

  React.useEffect(() => {
    if (lobbyId !== 'CINEMA') return;
    const trimmed = ytQuery.trim();
    if (trimmed.length < 2) {
      setYtResults([]);
      setYtLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
      const ctrl = new AbortController();
      abortCtrlRef.current = ctrl;
      searchSeqRef.current += 1;
      const curSeq = searchSeqRef.current;

      setYtLoading(true);
      setYtError('');
      try {
        const res = await fetch('/api/youtube-search?q=' + encodeURIComponent(trimmed), { signal: ctrl.signal });
        const data = await res.json().catch(() => ({}));
        if (curSeq !== searchSeqRef.current) return;
        if (res.ok) {
          if (data.configured === false) {
            setYtConfigured(false);
            setYtResults([]);
          } else {
            setYtConfigured(true);
            setYtResults(Array.isArray(data.items) ? data.items : []);
          }
        } else {
          if (data.configured === false) {
            setYtConfigured(false);
            setYtResults([]);
          } else {
            setYtError(data.message || data.error || 'Lỗi tìm kiếm YouTube');
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (curSeq !== searchSeqRef.current) return;
        setYtError('Lỗi kết nối mạng');
      } finally {
        if (curSeq === searchSeqRef.current) {
          setYtLoading(false);
        }
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [ytQuery, lobbyId]);

  const meta = {
    CINEMA: { id: 'lobby-watch', title: 'Học tập / YouTube', icon: '🎓', loai: 'video', desc: 'Không gian học tập, xem video bài giảng và thảo luận cùng bạn bè' },
    GAME: { id: 'lobby-game', title: 'Đấu Trường Game', icon: '🎮', loai: 'game', desc: 'Đấu trường trí tuệ Caro 15×15 thời gian thực' }
  }[lobbyId] || { id: 'lobby-activity', title: 'Hoạt động', icon: '✨', loai: 'chat', desc: '' };

  const roomsForCat = (dsPhong || []).filter(p => {
    if (p.chuPhongKhoa === 'he-thong') return false;
    if (lobbyId === 'CINEMA' && p.loai !== 'video') return false;
    if (lobbyId === 'GAME' && p.loai !== 'game') return false;

    const isPrivate = p.access_mode === 'password' || p.phamVi === 'lop';
    if (roomFilter === 'public' && isPrivate) return false;
    if (roomFilter === 'private' && !isPrivate) return false;
    return true;
  });

  const filteredCaroRooms = (caroRooms || []).filter(b => {
    const isPrivate = b.phamVi === 'lop' || Boolean(b.has_password);
    if (roomFilter === 'public' && isPrivate) return false;
    if (roomFilter === 'private' && !isPrivate) return false;
    return true;
  });

  const activeRoomsCount = lobbyId === 'GAME' ? filteredCaroRooms.length : roomsForCat.length;
  const activeParticipants = lobbyId === 'GAME'
    ? filteredCaroRooms.reduce((acc, b) => acc + (b.trangThai === 'dang_choi' ? 2 : 1), 0)
    : roomsForCat.reduce((acc, r) => acc + (r.soNguoi || 0), 0);

  return (
    <div id={meta.id} className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* ─── LOBBY HEADER: SINGLE CREATE CTA ─── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-campus"
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/10">
            <span>‹</span>
            <span>Campus</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">{meta.title}</h2>
              <p className="text-[11px] text-slate-400">{activeRoomsCount} phòng · {activeParticipants} người</p>
            </div>
          </div>
        </div>

        {/* SINGLE Header CTA */}
        <div className="flex items-center gap-2">
          {lobbyId === 'CINEMA' && (
            <button
              type="button"
              id="btn-create-youtube-room"
              data-id="btn-create-youtube-room"
              onClick={() => onOpenTaoPhong && onOpenTaoPhong('video')}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-[0_0_16px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
              <span>+</span>
              <span>Tạo phòng</span>
            </button>
          )}
          {lobbyId === 'GAME' && (
            <>
              <button
                type="button"
                id="btn-game-quick-match"
                onClick={() => {
                  if (onQuickMatch) {
                    onQuickMatch();
                  } else {
                    const waiting = (caroRooms || []).find(b => b.trangThai === 'cho_nguoi');
                    if (waiting) onVaoBanCaro(waiting.id);
                    else if (onTaoBanCaro) onTaoBanCaro('truong');
                  }
                }}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
                <span className="text-sm animate-pulse">⚡</span>
                <span>Ghép Nhanh</span>
              </button>
              <button
                type="button"
                id="btn-game-create-table"
                onClick={() => onTaoBanCaro && onTaoBanCaro('truong')}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shrink-0">
                <span className="text-[#00F2FE] font-black">+</span>
                <span>Tạo bàn</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── KHUNG 1: TẠO PHÒNG (khi đang tạo) hoặc TÌM YOUTUBE (mặc định) ─── */}
      {lobbyId === 'CINEMA' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[#121620] border border-white/10 shadow-xl flex flex-col gap-4">
          {(taoPhongCtl && taoPhongCtl.show) ? (
            <QuickTaoPhongForm ctl={taoPhongCtl} />
          ) : (
            <YoutubeSearchPanel
              ytQuery={ytQuery} setYtQuery={setYtQuery}
              ytResults={ytResults} setYtResults={setYtResults}
              selectedYtVideo={selectedYtVideo} setSelectedYtVideo={setSelectedYtVideo}
              ytLoading={ytLoading} ytConfigured={ytConfigured} ytError={ytError}
              onOpenTaoPhong={onOpenTaoPhong}
            />
          )}
        </div>
      )}


      {/* ─── KHUNG 1: TẠO BÀN — chỉ hiện khi đang tạo, giữ sảnh Game gọn khi rảnh ─── */}
      {lobbyId === 'GAME' && taoBanCtl?.show && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[#121620] border border-white/10 shadow-xl">
          <QuickTaoBanForm ctl={taoBanCtl} />
        </div>
      )}

      {/* ─── PHÒNG ĐANG HOẠT ĐỘNG SECTION ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <span>📺</span>
            <span>Phòng đang hoạt động</span>
          </h3>

          {/* Room Filter Chips */}
          <div className="flex items-center rounded-xl bg-[#151A23] p-1 border border-white/10 shadow-sm text-xs">
            <button
              type="button"
              id="filter-room-all"
              onClick={() => setRoomFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${roomFilter === 'ALL' ? 'bg-[#00F2FE]/20 text-[#00F2FE] shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Tất cả
            </button>
            <button
              type="button"
              id="filter-room-public"
              onClick={() => setRoomFilter('public')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${roomFilter === 'public' ? 'bg-[#00F2FE]/20 text-[#00F2FE] shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Công khai
            </button>
            <button
              type="button"
              id="filter-room-private"
              onClick={() => setRoomFilter('private')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${roomFilter === 'private' ? 'bg-[#00F2FE]/20 text-[#00F2FE] shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              Riêng tư
            </button>
          </div>
        </div>

        {/* Room List or Compact Empty State */}
        {lobbyId === 'GAME' ? (
          filteredCaroRooms.length === 0 ? (
            <div className="py-12 text-center bg-[#121620] border border-white/5 rounded-2xl p-6">
              <p className="text-2xl mb-2">⚔️</p>
              <h4 className="text-xs font-bold text-white">Chưa có bàn nào đang mở.</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaroRooms.map(b => {
                const isDangChoi = b.trangThai === 'dang_choi';
                const isFull = isDangChoi;
                const isPrivate = b.phamVi === 'lop' || Boolean(b.has_password);
                const tenBan = b.tenBan || (b.chuPhongTen ? `Bàn của ${b.chuPhongTen}` : 'Bàn thi đấu');
                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-[#151A23] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between gap-3 shadow-lg">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-white truncate">{tenBan}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isDangChoi ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {isDangChoi ? 'Đang đấu' : 'Chờ người'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {b.nguoiChoi1Ten || 'Kỳ thủ 1'} {b.nguoiChoi2Ten ? `vs ${b.nguoiChoi2Ten}` : '• chờ đối thủ'}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <span>{isPrivate ? '🔒 Riêng tư' : '🌐 Công khai'}</span>
                        <span>•</span>
                        <span>{isDangChoi ? '2/2' : '1/2'}</span>
                        {b.lopTen && <span className="ml-auto font-bold text-slate-500">{b.lopTen}</span>}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {isDangChoi ? '2/2' : '1/2'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onVaoBanCaro && onVaoBanCaro(b.id)}
                        disabled={isFull}
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${isFull ? 'bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-[#00F2FE] hover:bg-[#00e1ec] text-black shadow-sm'}`}>
                        {isFull ? 'Đầy' : 'Vào bàn'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          roomsForCat.length === 0 ? (
            <div className="py-12 text-center bg-[#121620] border border-white/5 rounded-2xl p-6">
              <p className="text-2xl mb-2">📺</p>
              <h4 className="text-xs font-bold text-white">Chưa có phòng đang mở.</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="study-room-list">
              {roomsForCat.map(p => {
                const count = p.soNguoi || 0;
                const cap = p.sucChua || 20;
                const isFull = count >= cap;
                const isWaiting = count <= 1;
                const isPrivate = p.access_mode === 'password' || p.phamVi === 'lop';

                let cauHinh = {};
                try { cauHinh = p.cauHinh ? JSON.parse(p.cauHinh) : {}; } catch {}
                const ytId = cauHinh.videoUrl ? idYoutube(cauHinh.videoUrl) : null;
                const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

                return (
                  <div key={p.id} className="p-4 rounded-2xl bg-[#151A23] border border-white/10 hover:border-red-500/30 transition-all flex flex-col justify-between gap-3 shadow-lg">
                    <div>
                      {ytThumb && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 bg-black/40">
                          <img src={ytThumb} alt={p.ten} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPrivate ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                            {isPrivate ? '🔒 Riêng tư' : '🌐 Công khai'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isFull ? 'bg-rose-500/20 text-rose-300' : (isWaiting ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300')}`}>
                          {isFull ? 'ĐẦY' : (isWaiting ? 'ĐANG CHỜ' : 'ĐANG HOẠT ĐỘNG')}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white truncate">{p.ten}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cauHinh.videoTieuDe || p.moTa || 'YouTube Study Room'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Chủ phòng: <strong className="text-slate-400">{p.chuPhongTen || 'Học sinh'}</strong></p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-mono font-bold">
                        {count} / {cap}
                      </span>
                      <button
                        type="button"
                        data-testid="study-room-enter"
                        data-phong-id={p.id}
                        onClick={() => onVaoPhong && onVaoPhong(p)}
                        disabled={isFull}
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${isFull ? 'bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-[#00F2FE] hover:bg-[#00e1ec] text-black shadow-sm active:scale-95'}`}>
                        {isFull ? 'Đầy' : (p.access_mode === 'password' ? 'Nhập pass' : 'Vào phòng')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
