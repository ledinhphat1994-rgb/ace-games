// ─── GAME ARENA — Bàn cờ đa-game + Mini game 1 mình ───────────────────────────
// BanCoGame render bàn cờ theo phong.loaiGame (state JSON thuần từ server).
// MiniGame* gắn engine vanilla trong src/lib/minigames.js (state local tab).
import { MINI_GAMES, mountMiniGame } from '../lib/minigames.js';
import { Ic } from '../lib/icons.js';

const { useEffect, useRef, useMemo } = React;

export const GAME_TYPE_INFO = {
  co_caro: { ten: 'Cờ Caro 15×15', icon: '✖️', moTa: 'Nối 5 quân liên tiếp', mauChu: 'X', mauKhach: 'O' },
  caro9:   { ten: 'Caro Nhanh 9×9', icon: '⭕', moTa: 'Bàn nhỏ, ván siêu tốc', mauChu: 'X', mauKhach: 'O' },
  c4:      { ten: 'Thả Quân 4',     icon: '🔴', moTa: 'Thả quân nối 4',        mauChu: '🔵', mauKhach: '🩷' },
  reversi: { ten: 'Reversi 8×8',    icon: '⚫', moTa: 'Lật quân chiếm bàn',    mauChu: '⚫', mauKhach: '⚪' },
};
export const GAME_TYPE_IDS = Object.keys(GAME_TYPE_INFO);
export const gameTen = loai => (GAME_TYPE_INFO[loai] || GAME_TYPE_INFO.co_caro).ten;

/* ── Tìm dòng thắng trên bàn (caro/c4) — chỉ dùng để highlight sau ket_thuc ── */
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
      if (line.length >= WIN) return new Set(line.map(([a, b]) => a * C + b));
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
  const loai = phong.loaiGame || 'co_caro';
  const board = phong.banCo;
  const dangChoi = phong.trangThai === 'dang_choi';
  const luotToi = dangChoi && phong.luotDiId === nguoiChoiIdCuaToi;

  const winSet = useMemo(
    () => (phong.trangThai === 'ket_thuc' ? timDongThang(board, loai) : null),
    [board, loai, phong.trangThai]
  );

  if (!Array.isArray(board) || !Array.isArray(board[0])) return null;
  const R = board.length, C = board[0].length;

  // ── Thả Quân 4 ──
  if (loai === 'c4') {
    return (
      <div className="p-3 bg-[#0B0E14] border border-white/15 rounded-2xl shadow-inner inline-grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${C}, minmax(0,1fr))` }} data-testid="board-c4">
        {board.map((row, r) => row.map((v, c) => {
          const cotDay = Boolean(board[0][c]);
          const thang = winSet?.has(r * C + c);
          return (
            <button key={`${r}-${c}`} onClick={() => onDanh(0, c)} data-testid={`c4-${r}-${c}`}
              disabled={!luotToi || cotDay}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all ${thang ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-[#0B0E14]' : ''} ${
                v === 1 ? 'bg-cyan-400 shadow-[0_0_12px_rgba(0,242,254,.5)]'
                : v === 2 ? 'bg-rose-400 shadow-[0_0_12px_rgba(244,114,182,.5)]'
                : `bg-[#151A23] shadow-inner ${luotToi && !cotDay ? 'hover:bg-[#1E2A3A] cursor-pointer' : ''}`}`} />
          );
        }))}
      </div>
    );
  }

  // ── Reversi ──
  if (loai === 'reversi') {
    const minh = phong.isHost ? 1 : phong.isGuest ? 2 : 0;
    const hint = new Set();
    let b = 0, w = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = board[r][c];
      if (v === 1) b++; else if (v === 2) w++;
      else if (luotToi && minh && rvFlips(board, r, c, minh).length) hint.add(r * 8 + c);
    }
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="px-3 py-1 rounded-full bg-[#0B0E14] border border-white/10 text-[11px] font-black text-slate-300" data-testid="rv-score">
          ⚫ {b} — {w} ⚪
        </span>
        <div className="p-2 rounded-2xl border border-emerald-900/60 shadow-inner inline-grid gap-1 bg-[#052e16]"
          style={{ gridTemplateColumns: `repeat(8, minmax(0,1fr))` }} data-testid="board-reversi">
          {board.map((row, r) => row.map((v, c) => (
            <button key={`${r}-${c}`} onClick={() => onDanh(r, c)} data-testid={`rv-${r}-${c}`}
              disabled={!luotToi || Boolean(v)}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-md bg-[#14532d] relative flex items-center justify-center transition-colors ${hint.has(r * 8 + c) ? 'hover:bg-[#166534] cursor-pointer' : ''}`}>
              {v ? (
                <span className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${v === 1 ? 'bg-gradient-to-br from-slate-500 to-slate-950' : 'bg-gradient-to-br from-white to-slate-300'}`} />
              ) : hint.has(r * 8 + c) ? (
                <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
              ) : null}
            </button>
          )))}
        </div>
      </div>
    );
  }

  // ── Caro (co_caro 15×15 / caro9 9×9) ──
  const n = R;
  const cellCls = n <= 9 ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs';
  return (
    <div className="grid gap-0.5 p-2 bg-[#0B0E14] border border-white/15 rounded-2xl shadow-inner max-w-[520px] w-full aspect-square"
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} data-testid={`board-caro-${n}`}>
      {board.map((row, r) => row.map((cell, c) => {
        const thang = winSet?.has(r * C + c);
        return (
          <button key={`${r}-${c}`} onClick={() => onDanh(r, c)} data-testid={`xo-${r}-${c}`}
            disabled={!luotToi || Boolean(cell)}
            className={`aspect-square rounded-[3px] flex items-center justify-center font-black ${cellCls} transition-colors ${thang ? 'bg-amber-400/25 outline outline-1 outline-amber-300' : !cell ? 'bg-[#151A23]/60 hover:bg-white/10' : cell === 'X' ? 'bg-[#00F2FE]/20 text-[#00F2FE]' : 'bg-[#FFB800]/20 text-[#FFB800]'}`}>
            {cell}
          </button>
        );
      }))}
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

/* ── MiniGameOverlay: overlay chơi 1 mình, mount engine vanilla vào stage ── */
export function MiniGameOverlay({ gameId, onClose }) {
  const stageRef = useRef(null);
  const hudRef = useRef(null);
  const game = MINI_GAMES.find(g => g.id === gameId);

  useEffect(() => {
    if (!gameId || !stageRef.current) return undefined;
    const cleanup = mountMiniGame(gameId, stageRef.current, hudRef.current);
    return () => { if (cleanup) try { cleanup(); } catch { /* noop */ } };
  }, [gameId]);

  if (!game) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      data-testid="minigame-overlay">
      <div className="bg-[#151A23] border border-white/15 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl animate-scaleIn flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span>{game.icon}</span><span>{game.ten}</span>
            <span className="text-[10px] font-bold text-slate-500">— chơi 1 mình</span>
          </h3>
          <button type="button" onClick={onClose} data-testid="minigame-close" aria-label="Đóng"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <Ic name="x" className="w-4 h-4" />
          </button>
        </div>
        <div ref={hudRef} className="flex items-center gap-2 text-xs font-bold" />
        <div ref={stageRef} className="flex flex-col items-center gap-4 max-w-full overflow-auto" />
      </div>
    </div>
  );
}
