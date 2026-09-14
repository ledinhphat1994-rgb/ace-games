// ─── GAME ARENA — Bàn cờ đa-game + Mini game 1 mình ───────────────────────────
// BanCoGame render bàn cờ theo phong.loaiGame (state JSON thuần từ server).
// MiniGame* gắn engine vanilla trong src/lib/minigames.js (state local tab).
// Visual: dark-neon đồng bộ Campus; bàn cờ co giãn theo cửa sổ + hỗ trợ Fullscreen API.
import { MINI_GAMES, mountMiniGame } from '../lib/minigames.js';
import { Ic } from '../lib/icons.js';

const { useEffect, useRef, useMemo, useState } = React;

export const GAME_TYPE_INFO = {
  co_caro: { ten: 'Cờ Caro 15×15', icon: '✖️', moTa: 'Nối 5 quân liên tiếp', mauChu: 'X', mauKhach: 'O' },
  caro9:   { ten: 'Caro Nhanh 9×9', icon: '⭕', moTa: 'Bàn nhỏ, ván siêu tốc', mauChu: 'X', mauKhach: 'O' },
  c4:      { ten: 'Thả Quân 4',     icon: '🔴', moTa: 'Thả quân nối 4',        mauChu: '🔵', mauKhach: '🩷' },
  reversi: { ten: 'Reversi 8×8',    icon: '⚫', moTa: 'Lật quân chiếm bàn',    mauChu: '⚫', mauKhach: '⚪' },
};
export const GAME_TYPE_IDS = Object.keys(GAME_TYPE_INFO);
export const gameTen = loai => {
  if (GAME_TYPE_INFO[loai]) return GAME_TYPE_INFO[loai].ten;
  const solo = MINI_GAMES.find(g => g.id === loai);
  if (solo) return solo.ten;
  return GAME_TYPE_INFO.co_caro.ten;
};

/* ── CSS bàn cờ + fullscreen — inject 1 lần ── */
const ARENA_STYLE_ID = 'arena-games-css';
function ensureGameStyles() {
  if (document.getElementById(ARENA_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = ARENA_STYLE_ID;
  s.textContent = `
  /* vùng chứa bàn — hỗ trợ fullscreen */
  .gwrap { position: relative; display: flex; justify-content: center; width: 100%; }
  .gwrap:fullscreen { background: radial-gradient(900px 500px at 50% -10%, rgba(0,242,254,.1), transparent 60%), #0B0E14;
    align-items: center; padding: 2vmin; overflow: auto; }
  .gfs-btn { position: absolute; top: 6px; right: 6px; z-index: 6; width: 30px; height: 30px; border-radius: 9px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #94a3b8; font-size: 14px;
    display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .gfs-btn:hover { background: rgba(0,242,254,.15); color: #00F2FE; border-color: rgba(0,242,254,.4); }

  /* ── Thả Quân 4 ── */
  .gc4-board { display: grid; gap: 6px; padding: 10px; border-radius: 18px;
    background: linear-gradient(160deg,#1e293b,#0f172a 60%); border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 16px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);
    width: min(92vw, 52vh, 430px); }
  .gwrap:fullscreen .gc4-board { width: min(92vw, 80vh); }
  .gc4-cell { aspect-ratio: 1; border-radius: 9999px; position: relative; overflow: hidden; padding: 0;
    background: radial-gradient(circle at 50% 42%, #060a12, #0B0E14 70%);
    box-shadow: inset 0 3px 8px rgba(0,0,0,.85), inset 0 -1px 2px rgba(255,255,255,.05); }
  .gc4-disc { position: absolute; inset: 7%; border-radius: 9999px; opacity: 0; transition: opacity .12s; }
  .gc4-cell.p1 .gc4-disc, .gc4-cell.p2 .gc4-disc, .gc4-cell.ghost .gc4-disc { opacity: 1; }
  .gc4-cell.p1 .gc4-disc { background: radial-gradient(circle at 34% 28%, #a5f3fc, #06b6d4 55%, #0e7490);
    box-shadow: 0 0 14px rgba(0,242,254,.55), inset 0 -3px 6px rgba(0,0,0,.35), inset 0 2px 3px rgba(255,255,255,.5); }
  .gc4-cell.p2 .gc4-disc { background: radial-gradient(circle at 34% 28%, #fbcfe8, #ec4899 55%, #9d174d);
    box-shadow: 0 0 14px rgba(236,72,153,.55), inset 0 -3px 6px rgba(0,0,0,.35), inset 0 2px 3px rgba(255,255,255,.5); }
  .gc4-cell.ghost .gc4-disc { opacity: .3; }
  .gc4-cell.drop .gc4-disc { animation: gc4drop .32s cubic-bezier(.34,1.2,.5,1) both; }
  @keyframes gc4drop { 0%{transform:translateY(var(--dy,-400%))} 78%{transform:translateY(4%)} 92%{transform:translateY(-3%)} 100%{transform:translateY(0)} }
  .gc4-cell.win .gc4-disc { animation: gc4win .8s ease-in-out infinite; }
  @keyframes gc4win { 0%,100%{box-shadow:0 0 12px rgba(250,204,21,.4)} 50%{box-shadow:0 0 26px rgba(250,204,21,.95), 0 0 0 3px rgba(250,204,21,.7)} }

  /* ── Reversi ── */
  .grv-board { display: grid; gap: 5px; padding: 10px; border-radius: 18px;
    background: radial-gradient(circle at 30% 20%, #166534, #052e16 75%); border: 2px solid rgba(0,0,0,.5);
    box-shadow: 0 16px 40px rgba(0,0,0,.5), inset 0 0 60px rgba(0,0,0,.4);
    width: min(92vw, 52vh, 430px); }
  .gwrap:fullscreen .grv-board { width: min(92vw, 78vh); }
  .grv-cell { aspect-ratio: 1; border-radius: 6px; background: rgba(0,0,0,.12); border: 1px solid rgba(0,0,0,.25);
    display: flex; align-items: center; justify-content: center; position: relative; padding: 0; transition: background .15s; }
  .grv-disc { width: 82%; aspect-ratio: 1; border-radius: 9999px; position: relative;
    transform-style: preserve-3d; transition: transform .38s cubic-bezier(.3,.7,.4,1.1); display:block; }
  .grv-disc .f { position: absolute; inset: 0; border-radius: 9999px; backface-visibility: hidden; }
  .grv-disc .f.b { background: radial-gradient(circle at 34% 28%, #64748b, #1e293b 55%, #020617);
    box-shadow: 0 3px 6px rgba(0,0,0,.5), inset 0 2px 3px rgba(255,255,255,.25); }
  .grv-disc .f.w { transform: rotateY(180deg); background: radial-gradient(circle at 34% 28%, #fff, #e2e8f0 55%, #94a3b8);
    box-shadow: 0 3px 6px rgba(0,0,0,.5), inset 0 2px 3px rgba(255,255,255,.8); }
  .grv-disc.w { transform: rotateY(180deg); }
  .grv-disc.hidden { display: none; }
  .grv-cell.hint { cursor: pointer; }
  .grv-cell.hint::after { content: ''; position: absolute; width: 26%; aspect-ratio: 1; border-radius: 9999px;
    background: rgba(255,255,255,.22); box-shadow: 0 0 8px rgba(255,255,255,.25); transition: transform .15s; }
  .grv-cell.hint:hover { background: rgba(255,255,255,.1); }
  .grv-cell.hint:hover::after { transform: scale(1.5); }
  .grv-scorebar { height: 7px; border-radius: 9999px; overflow: hidden; display: flex; background: rgba(255,255,255,.08); width: min(60vw, 260px); }
  .grv-scorebar .seg { transition: flex .4s ease; }

  /* ── Caro ── */
  .gxo-wrap { position: relative; border-radius: 18px; padding: 8px;
    background: linear-gradient(160deg,#111827,#0d1320); border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 16px 40px rgba(0,0,0,.5); }
  .gxo-grid { display: grid; gap: 1px; }
  .gxo-wrap.n15 { width: min(94vw, 60vh, 560px); }
  .gxo-wrap.n9 { width: min(90vw, 52vh, 420px); }
  .gwrap:fullscreen .gxo-wrap.n15 { width: min(94vw, 88vh); }
  .gwrap:fullscreen .gxo-wrap.n9 { width: min(90vw, 82vh, 560px); }
  .gxo-cell { aspect-ratio: 1; border: 1px solid rgba(255,255,255,.05); display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.015); cursor: pointer; position: relative; padding: 0; border-radius: 3px; transition: background .12s; }
  .gxo-cell:hover { background: rgba(0,242,254,.07); }
  .gxo-cell .mk { font-weight: 900; line-height: 1; animation: gxpop .22s cubic-bezier(.3,1.4,.5,1) both; }
  .gxo-wrap.n15 .mk { font-size: min(2.4vmin, 16px); }
  .gxo-wrap.n9 .mk { font-size: min(4.4vmin, 22px); }
  @keyframes gxpop { 0%{transform:scale(.2) rotate(-18deg); opacity:0} 100%{transform:scale(1) rotate(0); opacity:1} }
  .gxo-cell.x .mk { color: #22d3ee; text-shadow: 0 0 12px rgba(34,211,238,.85); }
  .gxo-cell.o .mk { color: #fbbf24; text-shadow: 0 0 12px rgba(251,191,36,.85); }
  .gxo-cell.win { background: rgba(250,204,21,.16); }
  .gxo-cell.win .mk { animation: gxmkpulse .7s ease-in-out infinite; }
  @keyframes gxmkpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.22); filter:brightness(1.4)} }
  .gxo-line { position: absolute; height: 4px; border-radius: 9999px; background: linear-gradient(90deg,#facc15,#fde047);
    box-shadow: 0 0 12px rgba(250,204,21,.8); transform-origin: 0 50%; pointer-events: none; z-index: 5;
    animation: gxline .35s ease both; }
  @keyframes gxline { 0%{opacity:0} 100%{opacity:1} }

  /* ── Mini-game overlay fullscreen ── */
  .mg-panel:fullscreen { max-width: none !important; width: 100%; height: 100%; border-radius: 0; max-height: none !important; }
  `;
  document.head.appendChild(s);
}

/* ── Tìm dòng thắng trên bàn (caro/c4) — chỉ dùng để highlight sau ket_thuc ──
   Trả về { set:Set<idx>, line:[[r,c],...] } — line theo thứ tự để vẽ overlay. */
function timDongThang(board, loai) {
  if (!Array.isArray(board) || !board[0]) return null;
  const R = board.length, C = board[0].length;
  const WIN = loai === 'c4' ? 4 : 5;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const v = board[r][c];
    if (!v) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const line = [[r, c]];
      for (let s = 1; s < WIN; s++) {
        const nr = r + dr * s, nc = c + dc * s;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C || board[nr][nc] !== v) break;
        line.push([nr, nc]);
      }
      if (line.length >= WIN) return { set: new Set(line.map(([a, b]) => a * C + b)), line };
    }
  }
  return null;
}

/* ── Reversi client helpers: gợi ý nước đi + đếm điểm (chỉ hiển thị) ── */
const RV_DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
function rvFlips(board, r, c, v) {
  if (board[r][c]) return [];
  const doi = v === 1 ? 2 : 1, all = [];
  for (const [dr, dc] of RV_DIRS) {
    const line = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === doi) { line.push([nr, nc]); nr += dr; nc += dc; }
    if (line.length && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === v) all.push(...line);
  }
  return all;
}


/* ── BanCoGame: render bàn theo loai_game ── */
export function BanCoGame({ phong, nguoiChoiIdCuaToi, onDanh }) {
  ensureGameStyles();
  const loai = phong.loaiGame || 'co_caro';
  const board = phong.banCo;
  const dangChoi = phong.trangThai === 'dang_choi';
  const luotToi = dangChoi && phong.luotDiId === nguoiChoiIdCuaToi;
  const minh = phong.isHost ? 1 : phong.isGuest ? 2 : 0;
  const wrapRef = useRef(null);
  const [hoverCol, setHoverCol] = useState(null);
  const prevBoard = useRef(null);

  const winInfo = useMemo(
    () => (phong.trangThai === 'ket_thuc' ? timDongThang(board, loai) : null),
    [board, loai, phong.trangThai]
  );

  // c4: ô vừa rơi (0→v giữa 2 render) để gắn animation drop + --dy
  const c4MoiRoi = useMemo(() => {
    if (loai !== 'c4' || !Array.isArray(board) || !Array.isArray(prevBoard.current)) return -1;
    for (let r = 0; r < board.length; r++) for (let c = 0; c < board[0].length; c++)
      if (!prevBoard.current[r][c] && board[r][c]) return r * board[0].length + c;
    return -1;
  }, [board, loai]);
  useEffect(() => { prevBoard.current = board; });

  if (!Array.isArray(board) || !Array.isArray(board[0])) return null;
  const R = board.length, C = board[0].length;
  const winSet = winInfo?.set || null;

  // ── Thả Quân 4 ──
  if (loai === 'c4') {
    // ô ghost: ô trống thấp nhất của cột đang hover
    let ghostIdx = -1;
    if (luotToi && hoverCol !== null) {
      for (let r = R - 1; r >= 0; r--) if (!board[r][hoverCol]) { ghostIdx = r * C + hoverCol; break; }
    }
    return (
      <div ref={wrapRef} className="gwrap">
        <div className="gc4-board" style={{ gridTemplateColumns: `repeat(${C}, minmax(0,1fr))` }}
          data-testid="board-c4" onMouseLeave={() => setHoverCol(null)}>
          {board.map((row, r) => row.map((v, c) => {
            const idx = r * C + c;
            const cotDay = Boolean(board[0][c]);
            const cls = ['gc4-cell',
              v === 1 ? 'p1' : v === 2 ? 'p2' : '',
              winSet?.has(idx) ? 'win' : '',
              idx === c4MoiRoi ? 'drop' : '',
              idx === ghostIdx ? `ghost p${minh}` : ''].filter(Boolean).join(' ');
            return (
              <button key={idx} type="button" onClick={() => onDanh(0, c)} data-testid={`c4-${r}-${c}`}
                data-v={v || undefined}
                disabled={!luotToi || cotDay}
                onMouseEnter={() => luotToi && setHoverCol(c)}
                className={cls}>
                <span className="gc4-disc" style={idx === c4MoiRoi ? { '--dy': `${-(r * 112 + 120)}%` } : undefined} />
              </button>
            );
          }))}
        </div>
      </div>
    );
  }

  // ── Reversi ──
  if (loai === 'reversi') {
    const hint = new Set();
    let b = 0, w = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = board[r][c];
      if (v === 1) b++; else if (v === 2) w++;
      else if (luotToi && minh && rvFlips(board, r, c, minh).length) hint.add(r * 8 + c);
    }
    return (
      <div ref={wrapRef} className="gwrap">
        <div className="flex flex-col items-center gap-3 w-full">
          <span className="px-3 py-1 rounded-full bg-[#0B0E14] border border-white/10 text-[11px] font-black text-slate-300" data-testid="rv-score">
            ⚫ {b} — {w} ⚪
          </span>
          <div className="grv-board" style={{ gridTemplateColumns: 'repeat(8, minmax(0,1fr))' }} data-testid="board-reversi">
            {board.map((row, r) => row.map((v, c) => (
              <button key={`${r}-${c}`} type="button" onClick={() => onDanh(r, c)} data-testid={`rv-${r}-${c}`}
                disabled={!luotToi || Boolean(v)}
                className={`grv-cell ${hint.has(r * 8 + c) ? 'hint' : ''}`}>
                <span className={`grv-disc ${v === 1 ? 'b' : v === 2 ? 'w' : 'hidden'}`}>
                  <i className="f b" /><i className="f w" />
                </span>
              </button>
            )))}
          </div>
          <div className="grv-scorebar" aria-hidden="true">
            <div className="seg" style={{ flex: `${b} 1 0%`, background: 'linear-gradient(90deg,#1e293b,#475569)' }} />
            <div className="seg" style={{ flex: `${w} 1 0%`, background: 'linear-gradient(90deg,#e2e8f0,#f8fafc)' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Caro (co_caro 15×15 / caro9 9×9) ──
  const n = R;
  // tọa độ % cho đường thắng overlay (bàn vuông)
  let lineStyle = null;
  if (winInfo?.line?.length) {
    const [r1, c1] = winInfo.line[0];
    const [r2, c2] = winInfo.line[winInfo.line.length - 1];
    const x1 = (c1 + 0.5) / C, y1 = (r1 + 0.5) / R;
    const x2 = (c2 + 0.5) / C, y2 = (r2 + 0.5) / R;
    const rot = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1) + 1 / C;
    const sx = x1 - (0.5 / C) * Math.cos(rot), sy = y1 - (0.5 / C) * Math.sin(rot);
    lineStyle = { left: `${sx * 100}%`, top: `${sy * 100}%`, width: `${len * 100}%`, transform: `rotate(${rot}rad) translateY(-50%)` };
  }
  return (
    <div ref={wrapRef} className="gwrap">
      <div className={`gxo-wrap n${n <= 9 ? 9 : 15}`} data-testid={`board-caro-${n}`}>
        <div className="gxo-grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
          {board.map((row, r) => row.map((cell, c) => {
            const idx = r * C + c;
            return (
              <button key={idx} type="button" onClick={() => onDanh(r, c)} data-testid={`xo-${r}-${c}`}
                disabled={!luotToi || Boolean(cell)}
                className={`gxo-cell ${cell === 'X' ? 'x' : cell === 'O' ? 'o' : ''} ${winSet?.has(idx) ? 'win' : ''}`}>
                {cell ? <span className="mk">{cell}</span> : null}
              </button>
            );
          }))}
        </div>
        {lineStyle && <div className="gxo-line" style={lineStyle} />}
      </div>
    </div>
  );
}

/* ── MiniGameDock: khu chơi nhanh 1 mình trong lobby Game ── */
export function MiniGameDock({ onChon }) {
  return (
    <div className="flex flex-col gap-3" data-testid="minigame-dock">
      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
        <span>🧩</span>
        <span>Chơi nhanh một mình</span>
        <span className="text-[10px] font-bold text-slate-500 normal-case tracking-normal">— không cần đối thủ</span>
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {MINI_GAMES.map(g => (
          <button key={g.id} type="button" onClick={() => onChon(g.id)} data-testid={`mini-${g.id}`}
            className="p-4 rounded-2xl bg-[#151A23] border border-white/10 hover:border-[#00F2FE]/40 hover:-translate-y-0.5 transition-all flex flex-col items-center gap-1.5 text-center">
            <span className="text-2xl">{g.icon}</span>
            <span className="text-xs font-black text-white">{g.ten}</span>
            <span className="text-[10px] text-slate-500 leading-snug">{g.moTa}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── MiniGameOverlay: overlay chơi 1 mình — panel co giãn, hỗ trợ fullscreen ── */
export function MiniGameOverlay({ gameId, onClose }) {
  const stageRef = useRef(null);
  const hudRef = useRef(null);
  const panelRef = useRef(null);
  const [full, setFull] = useState(false);
  const game = MINI_GAMES.find(g => g.id === gameId);

  useEffect(() => {
    const f = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  useEffect(() => {
    if (!gameId || !stageRef.current) return undefined;
    const cleanup = mountMiniGame(gameId, stageRef.current, hudRef.current);
    return () => { if (cleanup) try { cleanup(); } catch { /* noop */ } };
  }, [gameId]);

  if (!game) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      data-testid="minigame-overlay">
      <div ref={panelRef}
        className="mg-panel bg-[#151A23] border border-white/15 rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl animate-scaleIn flex flex-col items-center gap-3 max-h-[94vh]">
        <div className="flex items-center justify-between w-full shrink-0">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>{game.icon}</span><span>{game.ten}</span>
            <span className="text-[10px] font-bold text-slate-500">— chơi 1 mình</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <button type="button" data-testid="minigame-fullscreen" aria-label="Toàn màn hình"
              title={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
              onClick={() => {
                const el = panelRef.current;
                if (!el) return;
                if (document.fullscreenElement) document.exitFullscreen?.();
                else el.requestFullscreen?.();
              }}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#00F2FE]/15 text-slate-400 hover:text-[#00F2FE] transition-all flex items-center justify-center text-sm border border-white/10">
              {full ? '✕' : '⛶'}
            </button>
            <button type="button" onClick={onClose} data-testid="minigame-close" aria-label="Đóng"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <Ic name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={hudRef} className="flex items-center gap-2 text-xs font-bold shrink-0" />
        <div ref={stageRef} className="flex-1 min-h-0 w-full overflow-auto flex flex-col items-center justify-start gap-3 py-1" />
      </div>
    </div>
  );
}
