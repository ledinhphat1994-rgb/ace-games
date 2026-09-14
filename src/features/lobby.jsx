import { idYoutube } from '../lib/helpers.js';
import { Ic } from '../lib/icons.js';
import { GAME_TYPE_INFO, MiniGameDock, gameTen } from './games.js';


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

  const [ytQuery, setYtQuery] = React.useState('');
  const [ytResults, setYtResults] = React.useState([]);
  const [ytLoading, setYtLoading] = React.useState(false);
  const [ytConfigured, setYtConfigured] = React.useState(true);
  const [ytError, setYtError] = React.useState('');
  const searchSeqRef = React.useRef(0);
  const abortCtrlRef = React.useRef(null);

  React.useEffect(() => {
    fetch('/api/youtube-search')
      .then(r => r.json())
      .then(d => { if (d && d.configured === false) setYtConfigured(false); })
      .catch(() => {});
  }, []);

  // Tìm kiếm YouTube tức thì hoặc qua debounce
  const thucHienTimKiem = (tuKhoa) => {
    const trimmed = (tuKhoa !== undefined ? tuKhoa : ytQuery).trim();
    if (trimmed.length < 2) { setYtResults([]); setYtLoading(false); return; }
    if (abortCtrlRef.current) abortCtrlRef.current.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;
    searchSeqRef.current += 1;
    const curSeq = searchSeqRef.current;
    setYtLoading(true);
    setYtError('');
    fetch('/api/youtube-search?q=' + encodeURIComponent(trimmed), { signal: ctrl.signal })
      .then(r => r.json().catch(() => ({})))
      .then(data => {
        if (curSeq !== searchSeqRef.current) return;
        if (data && data.ok) {
          setYtConfigured(true);
          setYtResults(Array.isArray(data.items) ? data.items : []);
          if (Array.isArray(data.items) && data.items.length === 0) {
            setYtError('Không tìm thấy video nào phù hợp với từ khóa.');
          }
        } else {
          setYtError(data.message || data.error || 'Lỗi tìm kiếm YouTube');
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (curSeq !== searchSeqRef.current) return;
        setYtError('Lỗi kết nối mạng khi tìm kiếm.');
      })
      .finally(() => {
        if (curSeq === searchSeqRef.current) setYtLoading(false);
      });
  };

  React.useEffect(() => {
    const trimmed = ytQuery.trim();
    if (trimmed.length < 2) { setYtResults([]); setYtLoading(false); return; }
    const timer = setTimeout(() => {
      thucHienTimKiem(trimmed);
    }, 450);
    return () => clearTimeout(timer);
  }, [ytQuery]);

  // Chọn video xong thì gán THẲNG vào form đang mở
  const chonVideo = (url, title) => {
    dat({ videoUrl: url, ten: f.ten.trim() ? f.ten : (title || f.ten) });
    setYtQuery('');
    setYtResults([]);
  };

  const danLink = () => {
    const url = prompt('Dán liên kết video YouTube (ví dụ: https://www.youtube.com/watch?v=...):');
    if (url && url.trim()) chonVideo(url.trim(), 'Phòng học YouTube');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Vùng 3 đã xóa: không còn nút đóng X theo yêu cầu */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><span>🍿</span> Tạo phòng học tập</h3>
      </div>

      <input type="text" value={f.ten} onChange={e => dat({ ten: e.target.value })}
        placeholder="Tên phòng (VD: Góc ôn thi Toán)" maxLength={80}
        className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500" />

      {f.videoUrl ? (
        <div className="p-3 rounded-xl bg-[#0B0E14] border border-red-500/30 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-red-400 mb-0.5">Video đã chọn</p>
            <p className="text-xs text-slate-300 truncate">{f.videoUrl}</p>
          </div>
          <button type="button" onClick={() => dat({ videoUrl: '' })}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all shrink-0">
            Đổi video
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={ytQuery}
                onChange={e => { setYtQuery(e.target.value); setYtError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); thucHienTimKiem(ytQuery); } }}
                placeholder="🔍 Tìm video, bài giảng, nhạc học tập trên YouTube..."
                className="w-full bg-[#0B0E14] border border-white/15 focus:border-red-500 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all" />
              {ytQuery && (
                <button type="button" onClick={() => { setYtQuery(''); setYtResults([]); setYtError(''); }}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white">✕</button>
              )}
            </div>
            <button type="button" onClick={danLink}
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all shrink-0">
              🔗 Dán link
            </button>
          </div>

          {!ytConfigured && (
            <p className="text-[11px] text-slate-400">ℹ️ Tìm kiếm YouTube hiện chưa khả dụng — dùng "Dán link" ở trên.</p>
          )}
          {ytLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          )}
          {ytError && <p className="text-[11px] text-rose-400">{ytError}</p>}
          {!ytLoading && ytResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-0.5">
              {ytResults.map(v => (
                <button key={v.videoId} type="button"
                  onClick={() => chonVideo('https://www.youtube.com/watch?v=' + v.videoId, v.title)}
                  className="p-1.5 rounded-lg bg-[#0B0E14] border border-white/10 hover:border-red-500/50 flex flex-col gap-1 transition-all text-left group">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-black/40">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight group-hover:text-red-300 transition-colors">{v.title}</p>
                  {v.channelTitle && <p className="text-[9px] text-slate-400 truncate">{v.channelTitle}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vùng 4 sửa lại: Chế độ Công khai & Riêng tư (có mật khẩu) + Số lượng người tham gia */}
      <div className="flex flex-col gap-2.5 pt-1">
        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Chế độ truy cập</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => dat({ access_mode: 'public', matKhau: '', phamVi: 'truong' })}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${(!f.access_mode || f.access_mode === 'public') ? 'bg-cyan-500/15 text-[#00F2FE] border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.15)]' : 'bg-[#0B0E14] text-slate-400 border-white/10 hover:border-white/25'}`}>
            <span>🌐</span>
            <span>Công khai</span>
          </button>
          <button
            type="button"
            onClick={() => dat({ access_mode: 'password', phamVi: 'truong' })}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${f.access_mode === 'password' ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-[#0B0E14] text-slate-400 border-white/10 hover:border-white/25'}`}>
            <span>🔒</span>
            <span>Riêng tư</span>
          </button>
        </div>

        {/* Mật khẩu phòng khi ở chế độ Riêng tư */}
        {f.access_mode === 'password' && (
          <div className="flex flex-col gap-1 animate-fadeIn">
            <label className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Mật khẩu phòng *</label>
            <input
              type="password"
              value={f.matKhau || ''}
              onChange={e => dat({ matKhau: e.target.value })}
              placeholder="Nhập mật khẩu để vào phòng"
              maxLength={100}
              className="w-full bg-[#0B0E14] border border-amber-500/40 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        )}

        {/* Số lượng người tham gia — áp dụng cho cả Công khai & Riêng tư */}
        <div className="flex items-center justify-between gap-3 bg-[#0B0E14] border border-white/10 rounded-xl px-3.5 py-2.5">
          <div>
            <label className="text-xs font-bold text-slate-200 block">Số lượng người tham gia</label>
            <span className="text-[10px] text-slate-400">Phòng học tối đa từ 2 đến 12 người</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="2"
              max="12"
              value={f.sucChua !== undefined && f.sucChua !== null ? f.sucChua : 8}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                dat({ sucChua: isNaN(v) ? 8 : Math.max(2, Math.min(12, v)) });
              }}
              className="w-16 bg-white/5 border border-white/20 focus:border-[#00F2FE] rounded-lg px-2 py-1.5 text-xs text-center text-white font-black focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-medium">người</span>
          </div>
        </div>
      </div>

      {ctl.loi && <p className="text-[11px] text-rose-400">{ctl.loi}</p>}

      <button type="button" onClick={ctl.submit} disabled={ctl.dangTao || f.ten.trim().length < 2 || !f.videoUrl?.trim()}
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
        <h3 className="text-sm font-black text-white flex items-center gap-2"><span>⚔️</span> Tạo bàn đấu — {gameTen(ctl.loai)}</h3>
        <button type="button" onClick={() => ctl.setShow(false)} aria-label="Đóng"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <Ic name="x" className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="tao-ban-loai">
        {Object.entries(GAME_TYPE_INFO).map(([id, g]) => (
          <button key={id} type="button" onClick={() => ctl.setLoai(id)}
            className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${ctl.loai === id ? 'bg-amber-400/15 text-amber-300 border-amber-400/50' : 'bg-[#0B0E14] text-slate-300 border-white/10 hover:border-white/25'}`}>
            <span>{g.icon}</span><span className="truncate">{g.ten}</span>
          </button>
        ))}
      </div>

      <input type="text" value={ctl.ten} onChange={e => ctl.setTen(e.target.value)}
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
  taoBanCtl,
  onMiniGame
}) {
  const [roomFilter, setRoomFilter] = React.useState('ALL'); // 'ALL' | 'public' | 'private'

  const meta = {
    CINEMA: { id: 'lobby-watch', title: 'Học tập / YouTube', icon: '🎓', loai: 'video', desc: 'Không gian học tập, xem video bài giảng và thảo luận cùng bạn bè' },
    GAME: { id: 'lobby-game', title: 'Đấu Trường Game', icon: '🎮', loai: 'game', desc: 'Đấu trường trí tuệ đối kháng + mini game 1 mình' }
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
          <button
            id="btn-back-to-campus"
            type="button"
            onClick={onBack}
            className="h-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/10 shrink-0">
            <span>‹</span>
            <span>Campus</span>
          </button>
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

      {/* ─── KHUNG 1: TẠO PHÒNG — chỉ hiện khi đang tạo, giữ sảnh Học tập gọn khi rảnh
           (giống hệt lobby Game) — tìm/chọn YouTube giờ nằm NGAY trong form, không còn ô tìm
           kiếm thường trực tách rời khỏi việc tạo phòng. ─── */}
      {lobbyId === 'CINEMA' && taoPhongCtl?.show && (
        <div className="p-4 sm:p-6 rounded-3xl bg-[#121620] border border-white/10 shadow-xl">
          <QuickTaoPhongForm ctl={taoPhongCtl} />
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
                      <div className="text-[10px] font-bold text-amber-300/90 mb-1">
                        {(GAME_TYPE_INFO[b.loaiGame] || GAME_TYPE_INFO.co_caro).icon} {(GAME_TYPE_INFO[b.loaiGame] || GAME_TYPE_INFO.co_caro).ten}
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
                        onClick={async () => {
                          if (onVaoPhong) {
                            const err = await onVaoPhong(p);
                            if (err) alert(err);
                          }
                        }}
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

      {/* ─── MINI GAME 1 MÌNH — chỉ ở lobby Game, engine chạy local trong overlay ─── */}
      {lobbyId === 'GAME' && onMiniGame && (
        <MiniGameDock onChon={onMiniGame} />
      )}
    </div>
  );
}
