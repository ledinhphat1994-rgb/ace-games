// GEN TU src/features/games.jsx — KHONG SUA TAY
import { MINI_GAMES, mountMiniGame } from "../lib/minigames.js";
import { Ic } from "../lib/icons.js";
const { useEffect, useRef, useMemo, useState } = React;
export const GAME_TYPE_INFO = {
  co_caro: { ten: "C\u1EDD Caro 15\xD715", icon: "\u2716\uFE0F", moTa: "N\u1ED1i 5 qu\xE2n li\xEAn ti\u1EBFp", mauChu: "X", mauKhach: "O" },
  caro9: { ten: "Caro Nhanh 9\xD79", icon: "\u2B55", moTa: "B\xE0n nh\u1ECF, v\xE1n si\xEAu t\u1ED1c", mauChu: "X", mauKhach: "O" },
  c4: { ten: "Th\u1EA3 Qu\xE2n 4", icon: "\u{1F534}", moTa: "Th\u1EA3 qu\xE2n n\u1ED1i 4", mauChu: "\u{1F535}", mauKhach: "\u{1FA77}" },
  reversi: { ten: "Reversi 8\xD78", icon: "\u26AB", moTa: "L\u1EADt qu\xE2n chi\u1EBFm b\xE0n", mauChu: "\u26AB", mauKhach: "\u26AA" }
};
export const GAME_TYPE_IDS = Object.keys(GAME_TYPE_INFO);
export const gameTen = (loai) => (GAME_TYPE_INFO[loai] || GAME_TYPE_INFO.co_caro).ten;
const ARENA_STYLE_ID = "arena-games-css";
function ensureGameStyles() {
  if (document.getElementById(ARENA_STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = ARENA_STYLE_ID;
  s.textContent = `
  /* v\xF9ng ch\u1EE9a b\xE0n \u2014 h\u1ED7 tr\u1EE3 fullscreen */
  .gwrap { position: relative; display: flex; justify-content: center; width: 100%; }
  .gwrap:fullscreen { background: radial-gradient(900px 500px at 50% -10%, rgba(0,242,254,.1), transparent 60%), #0B0E14;
    align-items: center; padding: 2vmin; overflow: auto; }
  .gfs-btn { position: absolute; top: 6px; right: 6px; z-index: 6; width: 30px; height: 30px; border-radius: 9px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #94a3b8; font-size: 14px;
    display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .gfs-btn:hover { background: rgba(0,242,254,.15); color: #00F2FE; border-color: rgba(0,242,254,.4); }

  /* \u2500\u2500 Th\u1EA3 Qu\xE2n 4 \u2500\u2500 */
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

  /* \u2500\u2500 Reversi \u2500\u2500 */
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

  /* \u2500\u2500 Caro \u2500\u2500 */
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

  /* \u2500\u2500 Mini-game overlay fullscreen \u2500\u2500 */
  .mg-panel:fullscreen { max-width: none !important; width: 100%; height: 100%; border-radius: 0; max-height: none !important; }
  `;
  document.head.appendChild(s);
}
function timDongThang(board, loai) {
  if (!Array.isArray(board) || !board[0]) return null;
  const R = board.length, C = board[0].length;
  const WIN = loai === "c4" ? 4 : 5;
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
const RV_DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
function rvFlips(board, r, c, v) {
  if (board[r][c]) return [];
  const doi = v === 1 ? 2 : 1, all = [];
  for (const [dr, dc] of RV_DIRS) {
    const line = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === doi) {
      line.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (line.length && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === v) all.push(...line);
  }
  return all;
}
function NubFullscreen({ wrapRef }) {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const f = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "gfs-btn",
      "data-testid": "btn-game-fullscreen",
      title: full ? "Tho\xE1t to\xE0n m\xE0n h\xECnh" : "To\xE0n m\xE0n h\xECnh",
      onClick: () => {
        const el = wrapRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else el.requestFullscreen?.();
      }
    },
    full ? "\u2715" : "\u26F6"
  );
}
export function BanCoGame({ phong, nguoiChoiIdCuaToi, onDanh }) {
  ensureGameStyles();
  const loai = phong.loaiGame || "co_caro";
  const board = phong.banCo;
  const dangChoi = phong.trangThai === "dang_choi";
  const luotToi = dangChoi && phong.luotDiId === nguoiChoiIdCuaToi;
  const minh = phong.isHost ? 1 : phong.isGuest ? 2 : 0;
  const wrapRef = useRef(null);
  const [hoverCol, setHoverCol] = useState(null);
  const prevBoard = useRef(null);
  const winInfo = useMemo(
    () => phong.trangThai === "ket_thuc" ? timDongThang(board, loai) : null,
    [board, loai, phong.trangThai]
  );
  const c4MoiRoi = useMemo(() => {
    if (loai !== "c4" || !Array.isArray(board) || !Array.isArray(prevBoard.current)) return -1;
    for (let r = 0; r < board.length; r++) for (let c = 0; c < board[0].length; c++)
      if (!prevBoard.current[r][c] && board[r][c]) return r * board[0].length + c;
    return -1;
  }, [board, loai]);
  useEffect(() => {
    prevBoard.current = board;
  });
  if (!Array.isArray(board) || !Array.isArray(board[0])) return null;
  const R = board.length, C = board[0].length;
  const winSet = winInfo?.set || null;
  if (loai === "c4") {
    let ghostIdx = -1;
    if (luotToi && hoverCol !== null) {
      for (let r = R - 1; r >= 0; r--) if (!board[r][hoverCol]) {
        ghostIdx = r * C + hoverCol;
        break;
      }
    }
    return /* @__PURE__ */ React.createElement("div", { ref: wrapRef, className: "gwrap" }, /* @__PURE__ */ React.createElement(NubFullscreen, { wrapRef }), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "gc4-board",
        style: { gridTemplateColumns: `repeat(${C}, minmax(0,1fr))` },
        "data-testid": "board-c4",
        onMouseLeave: () => setHoverCol(null)
      },
      board.map((row, r) => row.map((v, c) => {
        const idx = r * C + c;
        const cotDay = Boolean(board[0][c]);
        const cls = [
          "gc4-cell",
          v === 1 ? "p1" : v === 2 ? "p2" : "",
          winSet?.has(idx) ? "win" : "",
          idx === c4MoiRoi ? "drop" : "",
          idx === ghostIdx ? `ghost p${minh}` : ""
        ].filter(Boolean).join(" ");
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: idx,
            type: "button",
            onClick: () => onDanh(0, c),
            "data-testid": `c4-${r}-${c}`,
            "data-v": v || void 0,
            disabled: !luotToi || cotDay,
            onMouseEnter: () => luotToi && setHoverCol(c),
            className: cls
          },
          /* @__PURE__ */ React.createElement("span", { className: "gc4-disc", style: idx === c4MoiRoi ? { "--dy": `${-(r * 112 + 120)}%` } : void 0 })
        );
      }))
    ));
  }
  if (loai === "reversi") {
    const hint = /* @__PURE__ */ new Set();
    let b = 0, w = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = board[r][c];
      if (v === 1) b++;
      else if (v === 2) w++;
      else if (luotToi && minh && rvFlips(board, r, c, minh).length) hint.add(r * 8 + c);
    }
    return /* @__PURE__ */ React.createElement("div", { ref: wrapRef, className: "gwrap" }, /* @__PURE__ */ React.createElement(NubFullscreen, { wrapRef }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-3 w-full" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 rounded-full bg-[#0B0E14] border border-white/10 text-[11px] font-black text-slate-300", "data-testid": "rv-score" }, "\u26AB ", b, " \u2014 ", w, " \u26AA"), /* @__PURE__ */ React.createElement("div", { className: "grv-board", style: { gridTemplateColumns: "repeat(8, minmax(0,1fr))" }, "data-testid": "board-reversi" }, board.map((row, r) => row.map((v, c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: `${r}-${c}`,
        type: "button",
        onClick: () => onDanh(r, c),
        "data-testid": `rv-${r}-${c}`,
        disabled: !luotToi || Boolean(v),
        className: `grv-cell ${hint.has(r * 8 + c) ? "hint" : ""}`
      },
      /* @__PURE__ */ React.createElement("span", { className: `grv-disc ${v === 1 ? "b" : v === 2 ? "w" : "hidden"}` }, /* @__PURE__ */ React.createElement("i", { className: "f b" }), /* @__PURE__ */ React.createElement("i", { className: "f w" }))
    )))), /* @__PURE__ */ React.createElement("div", { className: "grv-scorebar", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "seg", style: { flex: `${b} 1 0%`, background: "linear-gradient(90deg,#1e293b,#475569)" } }), /* @__PURE__ */ React.createElement("div", { className: "seg", style: { flex: `${w} 1 0%`, background: "linear-gradient(90deg,#e2e8f0,#f8fafc)" } }))));
  }
  const n = R;
  let lineStyle = null;
  if (winInfo?.line?.length) {
    const [r1, c1] = winInfo.line[0];
    const [r2, c2] = winInfo.line[winInfo.line.length - 1];
    const x1 = (c1 + 0.5) / C, y1 = (r1 + 0.5) / R;
    const x2 = (c2 + 0.5) / C, y2 = (r2 + 0.5) / R;
    const rot = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1) + 1 / C;
    const sx = x1 - 0.5 / C * Math.cos(rot), sy = y1 - 0.5 / C * Math.sin(rot);
    lineStyle = { left: `${sx * 100}%`, top: `${sy * 100}%`, width: `${len * 100}%`, transform: `rotate(${rot}rad) translateY(-50%)` };
  }
  return /* @__PURE__ */ React.createElement("div", { ref: wrapRef, className: "gwrap" }, /* @__PURE__ */ React.createElement(NubFullscreen, { wrapRef }), /* @__PURE__ */ React.createElement("div", { className: `gxo-wrap n${n <= 9 ? 9 : 15}`, "data-testid": `board-caro-${n}` }, /* @__PURE__ */ React.createElement("div", { className: "gxo-grid", style: { gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` } }, board.map((row, r) => row.map((cell, c) => {
    const idx = r * C + c;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: idx,
        type: "button",
        onClick: () => onDanh(r, c),
        "data-testid": `xo-${r}-${c}`,
        disabled: !luotToi || Boolean(cell),
        className: `gxo-cell ${cell === "X" ? "x" : cell === "O" ? "o" : ""} ${winSet?.has(idx) ? "win" : ""}`
      },
      cell ? /* @__PURE__ */ React.createElement("span", { className: "mk" }, cell) : null
    );
  }))), lineStyle && /* @__PURE__ */ React.createElement("div", { className: "gxo-line", style: lineStyle })));
}
export function MiniGameDock({ onChon }) {
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3", "data-testid": "minigame-dock" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F9E9}"), /* @__PURE__ */ React.createElement("span", null, "Ch\u01A1i nhanh m\u1ED9t m\xECnh"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-500 normal-case tracking-normal" }, "\u2014 kh\xF4ng c\u1EA7n \u0111\u1ED1i th\u1EE7")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, MINI_GAMES.map((g) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: g.id,
      type: "button",
      onClick: () => onChon(g.id),
      "data-testid": `mini-${g.id}`,
      className: "p-4 rounded-2xl bg-[#151A23] border border-white/10 hover:border-[#00F2FE]/40 hover:-translate-y-0.5 transition-all flex flex-col items-center gap-1.5 text-center"
    },
    /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, g.icon),
    /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-white" }, g.ten),
    /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 leading-snug" }, g.moTa)
  ))));
}
export function MiniGameOverlay({ gameId, onClose }) {
  const stageRef = useRef(null);
  const hudRef = useRef(null);
  const panelRef = useRef(null);
  const [full, setFull] = useState(false);
  const game = MINI_GAMES.find((g) => g.id === gameId);
  useEffect(() => {
    const f = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  useEffect(() => {
    if (!gameId || !stageRef.current) return void 0;
    const cleanup = mountMiniGame(gameId, stageRef.current, hudRef.current);
    return () => {
      if (cleanup) try {
        cleanup();
      } catch {
      }
    };
  }, [gameId]);
  if (!game) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn",
      "data-testid": "minigame-overlay"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: panelRef,
        className: "mg-panel bg-[#151A23] border border-white/15 rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl animate-scaleIn flex flex-col items-center gap-3 max-h-[94vh]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between w-full shrink-0" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-white flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", null, game.icon), /* @__PURE__ */ React.createElement("span", null, game.ten), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-500" }, "\u2014 ch\u01A1i 1 m\xECnh")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          "data-testid": "minigame-fullscreen",
          "aria-label": "To\xE0n m\xE0n h\xECnh",
          title: full ? "Tho\xE1t to\xE0n m\xE0n h\xECnh" : "To\xE0n m\xE0n h\xECnh",
          onClick: () => {
            const el = panelRef.current;
            if (!el) return;
            if (document.fullscreenElement) document.exitFullscreen?.();
            else el.requestFullscreen?.();
          },
          className: "w-8 h-8 rounded-lg bg-white/5 hover:bg-[#00F2FE]/15 text-slate-400 hover:text-[#00F2FE] transition-all flex items-center justify-center text-sm border border-white/10"
        },
        full ? "\u2715" : "\u26F6"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onClose,
          "data-testid": "minigame-close",
          "aria-label": "\u0110\xF3ng",
          className: "p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        },
        /* @__PURE__ */ React.createElement(Ic, { name: "x", className: "w-4 h-4" })
      ))),
      /* @__PURE__ */ React.createElement("div", { ref: hudRef, className: "flex items-center gap-2 text-xs font-bold shrink-0" }),
      /* @__PURE__ */ React.createElement("div", { ref: stageRef, className: "flex-1 min-h-0 w-full overflow-auto flex flex-col items-center justify-start gap-3 py-1" })
    )
  );
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZmVhdHVyZXMvZ2FtZXMuanN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBcdTI1MDBcdTI1MDBcdTI1MDAgR0FNRSBBUkVOQSBcdTIwMTQgQlx1MDBFMG4gY1x1MUVERCBcdTAxMTFhLWdhbWUgKyBNaW5pIGdhbWUgMSBtXHUwMEVDbmggXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBCYW5Db0dhbWUgcmVuZGVyIGJcdTAwRTBuIGNcdTFFREQgdGhlbyBwaG9uZy5sb2FpR2FtZSAoc3RhdGUgSlNPTiB0aHVcdTFFQTduIHRcdTFFRUIgc2VydmVyKS5cbi8vIE1pbmlHYW1lKiBnXHUxRUFGbiBlbmdpbmUgdmFuaWxsYSB0cm9uZyBzcmMvbGliL21pbmlnYW1lcy5qcyAoc3RhdGUgbG9jYWwgdGFiKS5cbi8vIFZpc3VhbDogZGFyay1uZW9uIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgQ2FtcHVzOyBiXHUwMEUwbiBjXHUxRUREIGNvIGdpXHUwMEUzbiB0aGVvIGNcdTFFRURhIHNcdTFFRDUgKyBoXHUxRUQ3IHRyXHUxRUUzIEZ1bGxzY3JlZW4gQVBJLlxuaW1wb3J0IHsgTUlOSV9HQU1FUywgbW91bnRNaW5pR2FtZSB9IGZyb20gJy4uL2xpYi9taW5pZ2FtZXMuanMnO1xuaW1wb3J0IHsgSWMgfSBmcm9tICcuLi9saWIvaWNvbnMuanMnO1xuXG5jb25zdCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VNZW1vLCB1c2VTdGF0ZSB9ID0gUmVhY3Q7XG5cbmV4cG9ydCBjb25zdCBHQU1FX1RZUEVfSU5GTyA9IHtcbiAgY29fY2FybzogeyB0ZW46ICdDXHUxRUREIENhcm8gMTVcdTAwRDcxNScsIGljb246ICdcdTI3MTZcdUZFMEYnLCBtb1RhOiAnTlx1MUVEMWkgNSBxdVx1MDBFMm4gbGlcdTAwRUFuIHRpXHUxRUJGcCcsIG1hdUNodTogJ1gnLCBtYXVLaGFjaDogJ08nIH0sXG4gIGNhcm85OiAgIHsgdGVuOiAnQ2FybyBOaGFuaCA5XHUwMEQ3OScsIGljb246ICdcdTJCNTUnLCBtb1RhOiAnQlx1MDBFMG4gbmhcdTFFQ0YsIHZcdTAwRTFuIHNpXHUwMEVBdSB0XHUxRUQxYycsIG1hdUNodTogJ1gnLCBtYXVLaGFjaDogJ08nIH0sXG4gIGM0OiAgICAgIHsgdGVuOiAnVGhcdTFFQTMgUXVcdTAwRTJuIDQnLCAgICAgaWNvbjogJ1x1RDgzRFx1REQzNCcsIG1vVGE6ICdUaFx1MUVBMyBxdVx1MDBFMm4gblx1MUVEMWkgNCcsICAgICAgICBtYXVDaHU6ICdcdUQ4M0RcdUREMzUnLCBtYXVLaGFjaDogJ1x1RDgzRVx1REU3NycgfSxcbiAgcmV2ZXJzaTogeyB0ZW46ICdSZXZlcnNpIDhcdTAwRDc4JywgICAgaWNvbjogJ1x1MjZBQicsIG1vVGE6ICdMXHUxRUFEdCBxdVx1MDBFMm4gY2hpXHUxRUJGbSBiXHUwMEUwbicsICAgIG1hdUNodTogJ1x1MjZBQicsIG1hdUtoYWNoOiAnXHUyNkFBJyB9LFxufTtcbmV4cG9ydCBjb25zdCBHQU1FX1RZUEVfSURTID0gT2JqZWN0LmtleXMoR0FNRV9UWVBFX0lORk8pO1xuZXhwb3J0IGNvbnN0IGdhbWVUZW4gPSBsb2FpID0+IChHQU1FX1RZUEVfSU5GT1tsb2FpXSB8fCBHQU1FX1RZUEVfSU5GTy5jb19jYXJvKS50ZW47XG5cbi8qIFx1MjUwMFx1MjUwMCBDU1MgYlx1MDBFMG4gY1x1MUVERCArIGZ1bGxzY3JlZW4gXHUyMDE0IGluamVjdCAxIGxcdTFFQTduIFx1MjUwMFx1MjUwMCAqL1xuY29uc3QgQVJFTkFfU1RZTEVfSUQgPSAnYXJlbmEtZ2FtZXMtY3NzJztcbmZ1bmN0aW9uIGVuc3VyZUdhbWVTdHlsZXMoKSB7XG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChBUkVOQV9TVFlMRV9JRCkpIHJldHVybjtcbiAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHMuaWQgPSBBUkVOQV9TVFlMRV9JRDtcbiAgcy50ZXh0Q29udGVudCA9IGBcbiAgLyogdlx1MDBGOW5nIGNoXHUxRUU5YSBiXHUwMEUwbiBcdTIwMTQgaFx1MUVENyB0clx1MUVFMyBmdWxsc2NyZWVuICovXG4gIC5nd3JhcCB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IHdpZHRoOiAxMDAlOyB9XG4gIC5nd3JhcDpmdWxsc2NyZWVuIHsgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KDkwMHB4IDUwMHB4IGF0IDUwJSAtMTAlLCByZ2JhKDAsMjQyLDI1NCwuMSksIHRyYW5zcGFyZW50IDYwJSksICMwQjBFMTQ7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjsgcGFkZGluZzogMnZtaW47IG92ZXJmbG93OiBhdXRvOyB9XG4gIC5nZnMtYnRuIHsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDZweDsgcmlnaHQ6IDZweDsgei1pbmRleDogNjsgd2lkdGg6IDMwcHg7IGhlaWdodDogMzBweDsgYm9yZGVyLXJhZGl1czogOXB4O1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LDI1NSwyNTUsLjA2KTsgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMTIpOyBjb2xvcjogIzk0YTNiODsgZm9udC1zaXplOiAxNHB4O1xuICAgIGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB0cmFuc2l0aW9uOiBhbGwgLjE1czsgfVxuICAuZ2ZzLWJ0bjpob3ZlciB7IGJhY2tncm91bmQ6IHJnYmEoMCwyNDIsMjU0LC4xNSk7IGNvbG9yOiAjMDBGMkZFOyBib3JkZXItY29sb3I6IHJnYmEoMCwyNDIsMjU0LC40KTsgfVxuXG4gIC8qIFx1MjUwMFx1MjUwMCBUaFx1MUVBMyBRdVx1MDBFMm4gNCBcdTI1MDBcdTI1MDAgKi9cbiAgLmdjNC1ib2FyZCB7IGRpc3BsYXk6IGdyaWQ7IGdhcDogNnB4OyBwYWRkaW5nOiAxMHB4OyBib3JkZXItcmFkaXVzOiAxOHB4O1xuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxNjBkZWcsIzFlMjkzYiwjMGYxNzJhIDYwJSk7IGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjEpO1xuICAgIGJveC1zaGFkb3c6IDAgMTZweCA0MHB4IHJnYmEoMCwwLDAsLjUpLCBpbnNldCAwIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA4KTtcbiAgICB3aWR0aDogbWluKDkydncsIDUydmgsIDQzMHB4KTsgfVxuICAuZ3dyYXA6ZnVsbHNjcmVlbiAuZ2M0LWJvYXJkIHsgd2lkdGg6IG1pbig5MnZ3LCA4MHZoKTsgfVxuICAuZ2M0LWNlbGwgeyBhc3BlY3QtcmF0aW86IDE7IGJvcmRlci1yYWRpdXM6IDk5OTlweDsgcG9zaXRpb246IHJlbGF0aXZlOyBvdmVyZmxvdzogaGlkZGVuOyBwYWRkaW5nOiAwO1xuICAgIGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudChjaXJjbGUgYXQgNTAlIDQyJSwgIzA2MGExMiwgIzBCMEUxNCA3MCUpO1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgM3B4IDhweCByZ2JhKDAsMCwwLC44NSksIGluc2V0IDAgLTFweCAycHggcmdiYSgyNTUsMjU1LDI1NSwuMDUpOyB9XG4gIC5nYzQtZGlzYyB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgaW5zZXQ6IDclOyBib3JkZXItcmFkaXVzOiA5OTk5cHg7IG9wYWNpdHk6IDA7IHRyYW5zaXRpb246IG9wYWNpdHkgLjEyczsgfVxuICAuZ2M0LWNlbGwucDEgLmdjNC1kaXNjLCAuZ2M0LWNlbGwucDIgLmdjNC1kaXNjLCAuZ2M0LWNlbGwuZ2hvc3QgLmdjNC1kaXNjIHsgb3BhY2l0eTogMTsgfVxuICAuZ2M0LWNlbGwucDEgLmdjNC1kaXNjIHsgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCAzNCUgMjglLCAjYTVmM2ZjLCAjMDZiNmQ0IDU1JSwgIzBlNzQ5MCk7XG4gICAgYm94LXNoYWRvdzogMCAwIDE0cHggcmdiYSgwLDI0MiwyNTQsLjU1KSwgaW5zZXQgMCAtM3B4IDZweCByZ2JhKDAsMCwwLC4zNSksIGluc2V0IDAgMnB4IDNweCByZ2JhKDI1NSwyNTUsMjU1LC41KTsgfVxuICAuZ2M0LWNlbGwucDIgLmdjNC1kaXNjIHsgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCAzNCUgMjglLCAjZmJjZmU4LCAjZWM0ODk5IDU1JSwgIzlkMTc0ZCk7XG4gICAgYm94LXNoYWRvdzogMCAwIDE0cHggcmdiYSgyMzYsNzIsMTUzLC41NSksIGluc2V0IDAgLTNweCA2cHggcmdiYSgwLDAsMCwuMzUpLCBpbnNldCAwIDJweCAzcHggcmdiYSgyNTUsMjU1LDI1NSwuNSk7IH1cbiAgLmdjNC1jZWxsLmdob3N0IC5nYzQtZGlzYyB7IG9wYWNpdHk6IC4zOyB9XG4gIC5nYzQtY2VsbC5kcm9wIC5nYzQtZGlzYyB7IGFuaW1hdGlvbjogZ2M0ZHJvcCAuMzJzIGN1YmljLWJlemllciguMzQsMS4yLC41LDEpIGJvdGg7IH1cbiAgQGtleWZyYW1lcyBnYzRkcm9wIHsgMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkodmFyKC0tZHksLTQwMCUpKX0gNzgle3RyYW5zZm9ybTp0cmFuc2xhdGVZKDQlKX0gOTIle3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0zJSl9IDEwMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMCl9IH1cbiAgLmdjNC1jZWxsLndpbiAuZ2M0LWRpc2MgeyBhbmltYXRpb246IGdjNHdpbiAuOHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7IH1cbiAgQGtleWZyYW1lcyBnYzR3aW4geyAwJSwxMDAle2JveC1zaGFkb3c6MCAwIDEycHggcmdiYSgyNTAsMjA0LDIxLC40KX0gNTAle2JveC1zaGFkb3c6MCAwIDI2cHggcmdiYSgyNTAsMjA0LDIxLC45NSksIDAgMCAwIDNweCByZ2JhKDI1MCwyMDQsMjEsLjcpfSB9XG5cbiAgLyogXHUyNTAwXHUyNTAwIFJldmVyc2kgXHUyNTAwXHUyNTAwICovXG4gIC5ncnYtYm9hcmQgeyBkaXNwbGF5OiBncmlkOyBnYXA6IDVweDsgcGFkZGluZzogMTBweDsgYm9yZGVyLXJhZGl1czogMThweDtcbiAgICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoY2lyY2xlIGF0IDMwJSAyMCUsICMxNjY1MzQsICMwNTJlMTYgNzUlKTsgYm9yZGVyOiAycHggc29saWQgcmdiYSgwLDAsMCwuNSk7XG4gICAgYm94LXNoYWRvdzogMCAxNnB4IDQwcHggcmdiYSgwLDAsMCwuNSksIGluc2V0IDAgMCA2MHB4IHJnYmEoMCwwLDAsLjQpO1xuICAgIHdpZHRoOiBtaW4oOTJ2dywgNTJ2aCwgNDMwcHgpOyB9XG4gIC5nd3JhcDpmdWxsc2NyZWVuIC5ncnYtYm9hcmQgeyB3aWR0aDogbWluKDkydncsIDc4dmgpOyB9XG4gIC5ncnYtY2VsbCB7IGFzcGVjdC1yYXRpbzogMTsgYm9yZGVyLXJhZGl1czogNnB4OyBiYWNrZ3JvdW5kOiByZ2JhKDAsMCwwLC4xMik7IGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMCwwLDAsLjI1KTtcbiAgICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgcG9zaXRpb246IHJlbGF0aXZlOyBwYWRkaW5nOiAwOyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIC4xNXM7IH1cbiAgLmdydi1kaXNjIHsgd2lkdGg6IDgyJTsgYXNwZWN0LXJhdGlvOiAxOyBib3JkZXItcmFkaXVzOiA5OTk5cHg7IHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOyB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gLjM4cyBjdWJpYy1iZXppZXIoLjMsLjcsLjQsMS4xKTsgZGlzcGxheTpibG9jazsgfVxuICAuZ3J2LWRpc2MgLmYgeyBwb3NpdGlvbjogYWJzb2x1dGU7IGluc2V0OiAwOyBib3JkZXItcmFkaXVzOiA5OTk5cHg7IGJhY2tmYWNlLXZpc2liaWxpdHk6IGhpZGRlbjsgfVxuICAuZ3J2LWRpc2MgLmYuYiB7IGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudChjaXJjbGUgYXQgMzQlIDI4JSwgIzY0NzQ4YiwgIzFlMjkzYiA1NSUsICMwMjA2MTcpO1xuICAgIGJveC1zaGFkb3c6IDAgM3B4IDZweCByZ2JhKDAsMCwwLC41KSwgaW5zZXQgMCAycHggM3B4IHJnYmEoMjU1LDI1NSwyNTUsLjI1KTsgfVxuICAuZ3J2LWRpc2MgLmYudyB7IHRyYW5zZm9ybTogcm90YXRlWSgxODBkZWcpOyBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoY2lyY2xlIGF0IDM0JSAyOCUsICNmZmYsICNlMmU4ZjAgNTUlLCAjOTRhM2I4KTtcbiAgICBib3gtc2hhZG93OiAwIDNweCA2cHggcmdiYSgwLDAsMCwuNSksIGluc2V0IDAgMnB4IDNweCByZ2JhKDI1NSwyNTUsMjU1LC44KTsgfVxuICAuZ3J2LWRpc2MudyB7IHRyYW5zZm9ybTogcm90YXRlWSgxODBkZWcpOyB9XG4gIC5ncnYtZGlzYy5oaWRkZW4geyBkaXNwbGF5OiBub25lOyB9XG4gIC5ncnYtY2VsbC5oaW50IHsgY3Vyc29yOiBwb2ludGVyOyB9XG4gIC5ncnYtY2VsbC5oaW50OjphZnRlciB7IGNvbnRlbnQ6ICcnOyBwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAyNiU7IGFzcGVjdC1yYXRpbzogMTsgYm9yZGVyLXJhZGl1czogOTk5OXB4O1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LDI1NSwyNTUsLjIyKTsgYm94LXNoYWRvdzogMCAwIDhweCByZ2JhKDI1NSwyNTUsMjU1LC4yNSk7IHRyYW5zaXRpb246IHRyYW5zZm9ybSAuMTVzOyB9XG4gIC5ncnYtY2VsbC5oaW50OmhvdmVyIHsgYmFja2dyb3VuZDogcmdiYSgyNTUsMjU1LDI1NSwuMSk7IH1cbiAgLmdydi1jZWxsLmhpbnQ6aG92ZXI6OmFmdGVyIHsgdHJhbnNmb3JtOiBzY2FsZSgxLjUpOyB9XG4gIC5ncnYtc2NvcmViYXIgeyBoZWlnaHQ6IDdweDsgYm9yZGVyLXJhZGl1czogOTk5OXB4OyBvdmVyZmxvdzogaGlkZGVuOyBkaXNwbGF5OiBmbGV4OyBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwyNTUsMjU1LC4wOCk7IHdpZHRoOiBtaW4oNjB2dywgMjYwcHgpOyB9XG4gIC5ncnYtc2NvcmViYXIgLnNlZyB7IHRyYW5zaXRpb246IGZsZXggLjRzIGVhc2U7IH1cblxuICAvKiBcdTI1MDBcdTI1MDAgQ2FybyBcdTI1MDBcdTI1MDAgKi9cbiAgLmd4by13cmFwIHsgcG9zaXRpb246IHJlbGF0aXZlOyBib3JkZXItcmFkaXVzOiAxOHB4OyBwYWRkaW5nOiA4cHg7XG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDE2MGRlZywjMTExODI3LCMwZDEzMjApOyBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4xKTtcbiAgICBib3gtc2hhZG93OiAwIDE2cHggNDBweCByZ2JhKDAsMCwwLC41KTsgfVxuICAuZ3hvLWdyaWQgeyBkaXNwbGF5OiBncmlkOyBnYXA6IDFweDsgfVxuICAuZ3hvLXdyYXAubjE1IHsgd2lkdGg6IG1pbig5NHZ3LCA2MHZoLCA1NjBweCk7IH1cbiAgLmd4by13cmFwLm45IHsgd2lkdGg6IG1pbig5MHZ3LCA1MnZoLCA0MjBweCk7IH1cbiAgLmd3cmFwOmZ1bGxzY3JlZW4gLmd4by13cmFwLm4xNSB7IHdpZHRoOiBtaW4oOTR2dywgODh2aCk7IH1cbiAgLmd3cmFwOmZ1bGxzY3JlZW4gLmd4by13cmFwLm45IHsgd2lkdGg6IG1pbig5MHZ3LCA4MnZoLCA1NjBweCk7IH1cbiAgLmd4by1jZWxsIHsgYXNwZWN0LXJhdGlvOiAxOyBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4wNSk7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LDI1NSwyNTUsLjAxNSk7IGN1cnNvcjogcG9pbnRlcjsgcG9zaXRpb246IHJlbGF0aXZlOyBwYWRkaW5nOiAwOyBib3JkZXItcmFkaXVzOiAzcHg7IHRyYW5zaXRpb246IGJhY2tncm91bmQgLjEyczsgfVxuICAuZ3hvLWNlbGw6aG92ZXIgeyBiYWNrZ3JvdW5kOiByZ2JhKDAsMjQyLDI1NCwuMDcpOyB9XG4gIC5neG8tY2VsbCAubWsgeyBmb250LXdlaWdodDogOTAwOyBsaW5lLWhlaWdodDogMTsgYW5pbWF0aW9uOiBneHBvcCAuMjJzIGN1YmljLWJlemllciguMywxLjQsLjUsMSkgYm90aDsgfVxuICAuZ3hvLXdyYXAubjE1IC5tayB7IGZvbnQtc2l6ZTogbWluKDIuNHZtaW4sIDE2cHgpOyB9XG4gIC5neG8td3JhcC5uOSAubWsgeyBmb250LXNpemU6IG1pbig0LjR2bWluLCAyMnB4KTsgfVxuICBAa2V5ZnJhbWVzIGd4cG9wIHsgMCV7dHJhbnNmb3JtOnNjYWxlKC4yKSByb3RhdGUoLTE4ZGVnKTsgb3BhY2l0eTowfSAxMDAle3RyYW5zZm9ybTpzY2FsZSgxKSByb3RhdGUoMCk7IG9wYWNpdHk6MX0gfVxuICAuZ3hvLWNlbGwueCAubWsgeyBjb2xvcjogIzIyZDNlZTsgdGV4dC1zaGFkb3c6IDAgMCAxMnB4IHJnYmEoMzQsMjExLDIzOCwuODUpOyB9XG4gIC5neG8tY2VsbC5vIC5tayB7IGNvbG9yOiAjZmJiZjI0OyB0ZXh0LXNoYWRvdzogMCAwIDEycHggcmdiYSgyNTEsMTkxLDM2LC44NSk7IH1cbiAgLmd4by1jZWxsLndpbiB7IGJhY2tncm91bmQ6IHJnYmEoMjUwLDIwNCwyMSwuMTYpOyB9XG4gIC5neG8tY2VsbC53aW4gLm1rIHsgYW5pbWF0aW9uOiBneG1rcHVsc2UgLjdzIGVhc2UtaW4tb3V0IGluZmluaXRlOyB9XG4gIEBrZXlmcmFtZXMgZ3hta3B1bHNlIHsgMCUsMTAwJXt0cmFuc2Zvcm06c2NhbGUoMSl9IDUwJXt0cmFuc2Zvcm06c2NhbGUoMS4yMik7IGZpbHRlcjpicmlnaHRuZXNzKDEuNCl9IH1cbiAgLmd4by1saW5lIHsgcG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDRweDsgYm9yZGVyLXJhZGl1czogOTk5OXB4OyBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoOTBkZWcsI2ZhY2MxNSwjZmRlMDQ3KTtcbiAgICBib3gtc2hhZG93OiAwIDAgMTJweCByZ2JhKDI1MCwyMDQsMjEsLjgpOyB0cmFuc2Zvcm0tb3JpZ2luOiAwIDUwJTsgcG9pbnRlci1ldmVudHM6IG5vbmU7IHotaW5kZXg6IDU7XG4gICAgYW5pbWF0aW9uOiBneGxpbmUgLjM1cyBlYXNlIGJvdGg7IH1cbiAgQGtleWZyYW1lcyBneGxpbmUgeyAwJXtvcGFjaXR5OjB9IDEwMCV7b3BhY2l0eToxfSB9XG5cbiAgLyogXHUyNTAwXHUyNTAwIE1pbmktZ2FtZSBvdmVybGF5IGZ1bGxzY3JlZW4gXHUyNTAwXHUyNTAwICovXG4gIC5tZy1wYW5lbDpmdWxsc2NyZWVuIHsgbWF4LXdpZHRoOiBub25lICFpbXBvcnRhbnQ7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IGJvcmRlci1yYWRpdXM6IDA7IG1heC1oZWlnaHQ6IG5vbmUgIWltcG9ydGFudDsgfVxuICBgO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHMpO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgVFx1MDBFQ20gZFx1MDBGMm5nIHRoXHUxRUFGbmcgdHJcdTAwRUFuIGJcdTAwRTBuIChjYXJvL2M0KSBcdTIwMTQgY2hcdTFFQzkgZFx1MDBGOW5nIFx1MDExMVx1MUVDMyBoaWdobGlnaHQgc2F1IGtldF90aHVjIFx1MjUwMFx1MjUwMFxuICAgVHJcdTFFQTMgdlx1MUVDMSB7IHNldDpTZXQ8aWR4PiwgbGluZTpbW3IsY10sLi4uXSB9IFx1MjAxNCBsaW5lIHRoZW8gdGhcdTFFRTkgdFx1MUVGMSBcdTAxMTFcdTFFQzMgdlx1MUVCRCBvdmVybGF5LiAqL1xuZnVuY3Rpb24gdGltRG9uZ1RoYW5nKGJvYXJkLCBsb2FpKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShib2FyZCkgfHwgIWJvYXJkWzBdKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgUiA9IGJvYXJkLmxlbmd0aCwgQyA9IGJvYXJkWzBdLmxlbmd0aDtcbiAgY29uc3QgV0lOID0gbG9haSA9PT0gJ2M0JyA/IDQgOiA1O1xuICBmb3IgKGxldCByID0gMDsgciA8IFI7IHIrKykgZm9yIChsZXQgYyA9IDA7IGMgPCBDOyBjKyspIHtcbiAgICBjb25zdCB2ID0gYm9hcmRbcl1bY107XG4gICAgaWYgKCF2KSBjb250aW51ZTtcbiAgICBmb3IgKGNvbnN0IFtkciwgZGNdIG9mIFtbMCwgMV0sIFsxLCAwXSwgWzEsIDFdLCBbMSwgLTFdXSkge1xuICAgICAgY29uc3QgbGluZSA9IFtbciwgY11dO1xuICAgICAgZm9yIChsZXQgcyA9IDE7IHMgPCBXSU47IHMrKykge1xuICAgICAgICBjb25zdCBuciA9IHIgKyBkciAqIHMsIG5jID0gYyArIGRjICogcztcbiAgICAgICAgaWYgKG5yIDwgMCB8fCBuciA+PSBSIHx8IG5jIDwgMCB8fCBuYyA+PSBDIHx8IGJvYXJkW25yXVtuY10gIT09IHYpIGJyZWFrO1xuICAgICAgICBsaW5lLnB1c2goW25yLCBuY10pO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmUubGVuZ3RoID49IFdJTikgcmV0dXJuIHsgc2V0OiBuZXcgU2V0KGxpbmUubWFwKChbYSwgYl0pID0+IGEgKiBDICsgYikpLCBsaW5lIH07XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgUmV2ZXJzaSBjbGllbnQgaGVscGVyczogZ1x1MUVFM2kgXHUwMEZEIG5cdTAxQjBcdTFFREJjIFx1MDExMWkgKyBcdTAxMTFcdTFFQkZtIFx1MDExMWlcdTFFQzNtIChjaFx1MUVDOSBoaVx1MUVDM24gdGhcdTFFQ0IpIFx1MjUwMFx1MjUwMCAqL1xuY29uc3QgUlZfRElSUyA9IFtbLTEsIC0xXSwgWy0xLCAwXSwgWy0xLCAxXSwgWzAsIC0xXSwgWzAsIDFdLCBbMSwgLTFdLCBbMSwgMF0sIFsxLCAxXV07XG5mdW5jdGlvbiBydkZsaXBzKGJvYXJkLCByLCBjLCB2KSB7XG4gIGlmIChib2FyZFtyXVtjXSkgcmV0dXJuIFtdO1xuICBjb25zdCBkb2kgPSB2ID09PSAxID8gMiA6IDEsIGFsbCA9IFtdO1xuICBmb3IgKGNvbnN0IFtkciwgZGNdIG9mIFJWX0RJUlMpIHtcbiAgICBjb25zdCBsaW5lID0gW107XG4gICAgbGV0IG5yID0gciArIGRyLCBuYyA9IGMgKyBkYztcbiAgICB3aGlsZSAobnIgPj0gMCAmJiBuciA8IDggJiYgbmMgPj0gMCAmJiBuYyA8IDggJiYgYm9hcmRbbnJdW25jXSA9PT0gZG9pKSB7IGxpbmUucHVzaChbbnIsIG5jXSk7IG5yICs9IGRyOyBuYyArPSBkYzsgfVxuICAgIGlmIChsaW5lLmxlbmd0aCAmJiBuciA+PSAwICYmIG5yIDwgOCAmJiBuYyA+PSAwICYmIG5jIDwgOCAmJiBib2FyZFtucl1bbmNdID09PSB2KSBhbGwucHVzaCguLi5saW5lKTtcbiAgfVxuICByZXR1cm4gYWxsO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgTlx1MDBGQXQgZnVsbHNjcmVlbiBuaFx1MUVDRiBnXHUwMEYzYyBiXHUwMEUwbiBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIE51YkZ1bGxzY3JlZW4oeyB3cmFwUmVmIH0pIHtcbiAgY29uc3QgW2Z1bGwsIHNldEZ1bGxdID0gdXNlU3RhdGUoZmFsc2UpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGYgPSAoKSA9PiBzZXRGdWxsKEJvb2xlYW4oZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZik7XG4gICAgcmV0dXJuICgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmKTtcbiAgfSwgW10pO1xuICByZXR1cm4gKFxuICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImdmcy1idG5cIiBkYXRhLXRlc3RpZD1cImJ0bi1nYW1lLWZ1bGxzY3JlZW5cIlxuICAgICAgdGl0bGU9e2Z1bGwgPyAnVGhvXHUwMEUxdCB0b1x1MDBFMG4gbVx1MDBFMG4gaFx1MDBFQ25oJyA6ICdUb1x1MDBFMG4gbVx1MDBFMG4gaFx1MDBFQ25oJ31cbiAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSB3cmFwUmVmLmN1cnJlbnQ7XG4gICAgICAgIGlmICghZWwpIHJldHVybjtcbiAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50KSBkb2N1bWVudC5leGl0RnVsbHNjcmVlbj8uKCk7XG4gICAgICAgIGVsc2UgZWwucmVxdWVzdEZ1bGxzY3JlZW4/LigpO1xuICAgICAgfX0+XG4gICAgICB7ZnVsbCA/ICdcdTI3MTUnIDogJ1x1MjZGNid9XG4gICAgPC9idXR0b24+XG4gICk7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBCYW5Db0dhbWU6IHJlbmRlciBiXHUwMEUwbiB0aGVvIGxvYWlfZ2FtZSBcdTI1MDBcdTI1MDAgKi9cbmV4cG9ydCBmdW5jdGlvbiBCYW5Db0dhbWUoeyBwaG9uZywgbmd1b2lDaG9pSWRDdWFUb2ksIG9uRGFuaCB9KSB7XG4gIGVuc3VyZUdhbWVTdHlsZXMoKTtcbiAgY29uc3QgbG9haSA9IHBob25nLmxvYWlHYW1lIHx8ICdjb19jYXJvJztcbiAgY29uc3QgYm9hcmQgPSBwaG9uZy5iYW5DbztcbiAgY29uc3QgZGFuZ0Nob2kgPSBwaG9uZy50cmFuZ1RoYWkgPT09ICdkYW5nX2Nob2knO1xuICBjb25zdCBsdW90VG9pID0gZGFuZ0Nob2kgJiYgcGhvbmcubHVvdERpSWQgPT09IG5ndW9pQ2hvaUlkQ3VhVG9pO1xuICBjb25zdCBtaW5oID0gcGhvbmcuaXNIb3N0ID8gMSA6IHBob25nLmlzR3Vlc3QgPyAyIDogMDtcbiAgY29uc3Qgd3JhcFJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2hvdmVyQ29sLCBzZXRIb3ZlckNvbF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgcHJldkJvYXJkID0gdXNlUmVmKG51bGwpO1xuXG4gIGNvbnN0IHdpbkluZm8gPSB1c2VNZW1vKFxuICAgICgpID0+IChwaG9uZy50cmFuZ1RoYWkgPT09ICdrZXRfdGh1YycgPyB0aW1Eb25nVGhhbmcoYm9hcmQsIGxvYWkpIDogbnVsbCksXG4gICAgW2JvYXJkLCBsb2FpLCBwaG9uZy50cmFuZ1RoYWldXG4gICk7XG5cbiAgLy8gYzQ6IFx1MDBGNCB2XHUxRUVCYSByXHUwMUExaSAoMFx1MjE5MnYgZ2lcdTFFRUZhIDIgcmVuZGVyKSBcdTAxMTFcdTFFQzMgZ1x1MUVBRm4gYW5pbWF0aW9uIGRyb3AgKyAtLWR5XG4gIGNvbnN0IGM0TW9pUm9pID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKGxvYWkgIT09ICdjNCcgfHwgIUFycmF5LmlzQXJyYXkoYm9hcmQpIHx8ICFBcnJheS5pc0FycmF5KHByZXZCb2FyZC5jdXJyZW50KSkgcmV0dXJuIC0xO1xuICAgIGZvciAobGV0IHIgPSAwOyByIDwgYm9hcmQubGVuZ3RoOyByKyspIGZvciAobGV0IGMgPSAwOyBjIDwgYm9hcmRbMF0ubGVuZ3RoOyBjKyspXG4gICAgICBpZiAoIXByZXZCb2FyZC5jdXJyZW50W3JdW2NdICYmIGJvYXJkW3JdW2NdKSByZXR1cm4gciAqIGJvYXJkWzBdLmxlbmd0aCArIGM7XG4gICAgcmV0dXJuIC0xO1xuICB9LCBbYm9hcmQsIGxvYWldKTtcbiAgdXNlRWZmZWN0KCgpID0+IHsgcHJldkJvYXJkLmN1cnJlbnQgPSBib2FyZDsgfSk7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGJvYXJkKSB8fCAhQXJyYXkuaXNBcnJheShib2FyZFswXSkpIHJldHVybiBudWxsO1xuICBjb25zdCBSID0gYm9hcmQubGVuZ3RoLCBDID0gYm9hcmRbMF0ubGVuZ3RoO1xuICBjb25zdCB3aW5TZXQgPSB3aW5JbmZvPy5zZXQgfHwgbnVsbDtcblxuICAvLyBcdTI1MDBcdTI1MDAgVGhcdTFFQTMgUXVcdTAwRTJuIDQgXHUyNTAwXHUyNTAwXG4gIGlmIChsb2FpID09PSAnYzQnKSB7XG4gICAgLy8gXHUwMEY0IGdob3N0OiBcdTAwRjQgdHJcdTFFRDFuZyB0aFx1MUVBNXAgbmhcdTFFQTV0IGNcdTFFRTdhIGNcdTFFRDl0IFx1MDExMWFuZyBob3ZlclxuICAgIGxldCBnaG9zdElkeCA9IC0xO1xuICAgIGlmIChsdW90VG9pICYmIGhvdmVyQ29sICE9PSBudWxsKSB7XG4gICAgICBmb3IgKGxldCByID0gUiAtIDE7IHIgPj0gMDsgci0tKSBpZiAoIWJvYXJkW3JdW2hvdmVyQ29sXSkgeyBnaG9zdElkeCA9IHIgKiBDICsgaG92ZXJDb2w7IGJyZWFrOyB9XG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17d3JhcFJlZn0gY2xhc3NOYW1lPVwiZ3dyYXBcIj5cbiAgICAgICAgPE51YkZ1bGxzY3JlZW4gd3JhcFJlZj17d3JhcFJlZn0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnYzQtYm9hcmRcIiBzdHlsZT17eyBncmlkVGVtcGxhdGVDb2x1bW5zOiBgcmVwZWF0KCR7Q30sIG1pbm1heCgwLDFmcikpYCB9fVxuICAgICAgICAgIGRhdGEtdGVzdGlkPVwiYm9hcmQtYzRcIiBvbk1vdXNlTGVhdmU9eygpID0+IHNldEhvdmVyQ29sKG51bGwpfT5cbiAgICAgICAgICB7Ym9hcmQubWFwKChyb3csIHIpID0+IHJvdy5tYXAoKHYsIGMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IHIgKiBDICsgYztcbiAgICAgICAgICAgIGNvbnN0IGNvdERheSA9IEJvb2xlYW4oYm9hcmRbMF1bY10pO1xuICAgICAgICAgICAgY29uc3QgY2xzID0gWydnYzQtY2VsbCcsXG4gICAgICAgICAgICAgIHYgPT09IDEgPyAncDEnIDogdiA9PT0gMiA/ICdwMicgOiAnJyxcbiAgICAgICAgICAgICAgd2luU2V0Py5oYXMoaWR4KSA/ICd3aW4nIDogJycsXG4gICAgICAgICAgICAgIGlkeCA9PT0gYzRNb2lSb2kgPyAnZHJvcCcgOiAnJyxcbiAgICAgICAgICAgICAgaWR4ID09PSBnaG9zdElkeCA/IGBnaG9zdCBwJHttaW5ofWAgOiAnJ10uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxidXR0b24ga2V5PXtpZHh9IHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBvbkRhbmgoMCwgYyl9IGRhdGEtdGVzdGlkPXtgYzQtJHtyfS0ke2N9YH1cbiAgICAgICAgICAgICAgICBkYXRhLXY9e3YgfHwgdW5kZWZpbmVkfVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbHVvdFRvaSB8fCBjb3REYXl9XG4gICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBsdW90VG9pICYmIHNldEhvdmVyQ29sKGMpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xzfT5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJnYzQtZGlzY1wiIHN0eWxlPXtpZHggPT09IGM0TW9pUm9pID8geyAnLS1keSc6IGAkey0ociAqIDExMiArIDEyMCl9JWAgfSA6IHVuZGVmaW5lZH0gLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFJldmVyc2kgXHUyNTAwXHUyNTAwXG4gIGlmIChsb2FpID09PSAncmV2ZXJzaScpIHtcbiAgICBjb25zdCBoaW50ID0gbmV3IFNldCgpO1xuICAgIGxldCBiID0gMCwgdyA9IDA7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCA4OyByKyspIGZvciAobGV0IGMgPSAwOyBjIDwgODsgYysrKSB7XG4gICAgICBjb25zdCB2ID0gYm9hcmRbcl1bY107XG4gICAgICBpZiAodiA9PT0gMSkgYisrOyBlbHNlIGlmICh2ID09PSAyKSB3Kys7XG4gICAgICBlbHNlIGlmIChsdW90VG9pICYmIG1pbmggJiYgcnZGbGlwcyhib2FyZCwgciwgYywgbWluaCkubGVuZ3RoKSBoaW50LmFkZChyICogOCArIGMpO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9e3dyYXBSZWZ9IGNsYXNzTmFtZT1cImd3cmFwXCI+XG4gICAgICAgIDxOdWJGdWxsc2NyZWVuIHdyYXBSZWY9e3dyYXBSZWZ9IC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTMgdy1mdWxsXCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMyBweS0xIHJvdW5kZWQtZnVsbCBiZy1bIzBCMEUxNF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtMzAwXCIgZGF0YS10ZXN0aWQ9XCJydi1zY29yZVwiPlxuICAgICAgICAgICAgXHUyNkFCIHtifSBcdTIwMTQge3d9IFx1MjZBQVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdydi1ib2FyZFwiIHN0eWxlPXt7IGdyaWRUZW1wbGF0ZUNvbHVtbnM6ICdyZXBlYXQoOCwgbWlubWF4KDAsMWZyKSknIH19IGRhdGEtdGVzdGlkPVwiYm9hcmQtcmV2ZXJzaVwiPlxuICAgICAgICAgICAge2JvYXJkLm1hcCgocm93LCByKSA9PiByb3cubWFwKCh2LCBjKSA9PiAoXG4gICAgICAgICAgICAgIDxidXR0b24ga2V5PXtgJHtyfS0ke2N9YH0gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IG9uRGFuaChyLCBjKX0gZGF0YS10ZXN0aWQ9e2Bydi0ke3J9LSR7Y31gfVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbHVvdFRvaSB8fCBCb29sZWFuKHYpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGdydi1jZWxsICR7aGludC5oYXMociAqIDggKyBjKSA/ICdoaW50JyA6ICcnfWB9PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGdydi1kaXNjICR7diA9PT0gMSA/ICdiJyA6IHYgPT09IDIgPyAndycgOiAnaGlkZGVuJ31gfT5cbiAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImYgYlwiIC8+PGkgY2xhc3NOYW1lPVwiZiB3XCIgLz5cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKSkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3J2LXNjb3JlYmFyXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlZ1wiIHN0eWxlPXt7IGZsZXg6IGAke2J9IDEgMCVgLCBiYWNrZ3JvdW5kOiAnbGluZWFyLWdyYWRpZW50KDkwZGVnLCMxZTI5M2IsIzQ3NTU2OSknIH19IC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlZ1wiIHN0eWxlPXt7IGZsZXg6IGAke3d9IDEgMCVgLCBiYWNrZ3JvdW5kOiAnbGluZWFyLWdyYWRpZW50KDkwZGVnLCNlMmU4ZjAsI2Y4ZmFmYyknIH19IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBDYXJvIChjb19jYXJvIDE1XHUwMEQ3MTUgLyBjYXJvOSA5XHUwMEQ3OSkgXHUyNTAwXHUyNTAwXG4gIGNvbnN0IG4gPSBSO1xuICAvLyB0XHUxRUNEYSBcdTAxMTFcdTFFRDkgJSBjaG8gXHUwMTExXHUwMUIwXHUxRUREbmcgdGhcdTFFQUZuZyBvdmVybGF5IChiXHUwMEUwbiB2dVx1MDBGNG5nKVxuICBsZXQgbGluZVN0eWxlID0gbnVsbDtcbiAgaWYgKHdpbkluZm8/LmxpbmU/Lmxlbmd0aCkge1xuICAgIGNvbnN0IFtyMSwgYzFdID0gd2luSW5mby5saW5lWzBdO1xuICAgIGNvbnN0IFtyMiwgYzJdID0gd2luSW5mby5saW5lW3dpbkluZm8ubGluZS5sZW5ndGggLSAxXTtcbiAgICBjb25zdCB4MSA9IChjMSArIDAuNSkgLyBDLCB5MSA9IChyMSArIDAuNSkgLyBSO1xuICAgIGNvbnN0IHgyID0gKGMyICsgMC41KSAvIEMsIHkyID0gKHIyICsgMC41KSAvIFI7XG4gICAgY29uc3Qgcm90ID0gTWF0aC5hdGFuMih5MiAtIHkxLCB4MiAtIHgxKTtcbiAgICBjb25zdCBsZW4gPSBNYXRoLmh5cG90KHgyIC0geDEsIHkyIC0geTEpICsgMSAvIEM7XG4gICAgY29uc3Qgc3ggPSB4MSAtICgwLjUgLyBDKSAqIE1hdGguY29zKHJvdCksIHN5ID0geTEgLSAoMC41IC8gQykgKiBNYXRoLnNpbihyb3QpO1xuICAgIGxpbmVTdHlsZSA9IHsgbGVmdDogYCR7c3ggKiAxMDB9JWAsIHRvcDogYCR7c3kgKiAxMDB9JWAsIHdpZHRoOiBgJHtsZW4gKiAxMDB9JWAsIHRyYW5zZm9ybTogYHJvdGF0ZSgke3JvdH1yYWQpIHRyYW5zbGF0ZVkoLTUwJSlgIH07XG4gIH1cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHJlZj17d3JhcFJlZn0gY2xhc3NOYW1lPVwiZ3dyYXBcIj5cbiAgICAgIDxOdWJGdWxsc2NyZWVuIHdyYXBSZWY9e3dyYXBSZWZ9IC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGd4by13cmFwIG4ke24gPD0gOSA/IDkgOiAxNX1gfSBkYXRhLXRlc3RpZD17YGJvYXJkLWNhcm8tJHtufWB9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImd4by1ncmlkXCIgc3R5bGU9e3sgZ3JpZFRlbXBsYXRlQ29sdW1uczogYHJlcGVhdCgke259LCBtaW5tYXgoMCwxZnIpKWAgfX0+XG4gICAgICAgICAge2JvYXJkLm1hcCgocm93LCByKSA9PiByb3cubWFwKChjZWxsLCBjKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpZHggPSByICogQyArIGM7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8YnV0dG9uIGtleT17aWR4fSB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gb25EYW5oKHIsIGMpfSBkYXRhLXRlc3RpZD17YHhvLSR7cn0tJHtjfWB9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFsdW90VG9pIHx8IEJvb2xlYW4oY2VsbCl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZ3hvLWNlbGwgJHtjZWxsID09PSAnWCcgPyAneCcgOiBjZWxsID09PSAnTycgPyAnbycgOiAnJ30gJHt3aW5TZXQ/LmhhcyhpZHgpID8gJ3dpbicgOiAnJ31gfT5cbiAgICAgICAgICAgICAgICB7Y2VsbCA/IDxzcGFuIGNsYXNzTmFtZT1cIm1rXCI+e2NlbGx9PC9zcGFuPiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGluZVN0eWxlICYmIDxkaXYgY2xhc3NOYW1lPVwiZ3hvLWxpbmVcIiBzdHlsZT17bGluZVN0eWxlfSAvPn1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vKiBcdTI1MDBcdTI1MDAgTWluaUdhbWVEb2NrOiBraHUgY2hcdTAxQTFpIG5oYW5oIDEgbVx1MDBFQ25oIHRyb25nIGxvYmJ5IEdhbWUgXHUyNTAwXHUyNTAwICovXG5leHBvcnQgZnVuY3Rpb24gTWluaUdhbWVEb2NrKHsgb25DaG9uIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgZ2FwLTNcIiBkYXRhLXRlc3RpZD1cIm1pbmlnYW1lLWRvY2tcIj5cbiAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtZXh0cmFib2xkIHRleHQtd2hpdGUgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgIDxzcGFuPlx1RDgzRVx1RERFOTwvc3Bhbj5cbiAgICAgICAgPHNwYW4+Q2hcdTAxQTFpIG5oYW5oIG1cdTFFRDl0IG1cdTAwRUNuaDwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwIG5vcm1hbC1jYXNlIHRyYWNraW5nLW5vcm1hbFwiPlx1MjAxNCBraFx1MDBGNG5nIGNcdTFFQTduIFx1MDExMVx1MUVEMWkgdGhcdTFFRTc8L3NwYW4+XG4gICAgICA8L2gzPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGdhcC0zXCI+XG4gICAgICAgIHtNSU5JX0dBTUVTLm1hcChnID0+IChcbiAgICAgICAgICA8YnV0dG9uIGtleT17Zy5pZH0gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IG9uQ2hvbihnLmlkKX0gZGF0YS10ZXN0aWQ9e2BtaW5pLSR7Zy5pZH1gfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicC00IHJvdW5kZWQtMnhsIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGhvdmVyOmJvcmRlci1bIzAwRjJGRV0vNDAgaG92ZXI6LXRyYW5zbGF0ZS15LTAuNSB0cmFuc2l0aW9uLWFsbCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQtY2VudGVyXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPntnLmljb259PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtd2hpdGVcIj57Zy50ZW59PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgbGVhZGluZy1zbnVnXCI+e2cubW9UYX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICkpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBNaW5pR2FtZU92ZXJsYXk6IG92ZXJsYXkgY2hcdTAxQTFpIDEgbVx1MDBFQ25oIFx1MjAxNCBwYW5lbCBjbyBnaVx1MDBFM24sIGhcdTFFRDcgdHJcdTFFRTMgZnVsbHNjcmVlbiBcdTI1MDBcdTI1MDAgKi9cbmV4cG9ydCBmdW5jdGlvbiBNaW5pR2FtZU92ZXJsYXkoeyBnYW1lSWQsIG9uQ2xvc2UgfSkge1xuICBjb25zdCBzdGFnZVJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgaHVkUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBwYW5lbFJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2Z1bGwsIHNldEZ1bGxdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBnYW1lID0gTUlOSV9HQU1FUy5maW5kKGcgPT4gZy5pZCA9PT0gZ2FtZUlkKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGYgPSAoKSA9PiBzZXRGdWxsKEJvb2xlYW4oZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZik7XG4gICAgcmV0dXJuICgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFnYW1lSWQgfHwgIXN0YWdlUmVmLmN1cnJlbnQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgY29uc3QgY2xlYW51cCA9IG1vdW50TWluaUdhbWUoZ2FtZUlkLCBzdGFnZVJlZi5jdXJyZW50LCBodWRSZWYuY3VycmVudCk7XG4gICAgcmV0dXJuICgpID0+IHsgaWYgKGNsZWFudXApIHRyeSB7IGNsZWFudXAoKTsgfSBjYXRjaCB7IC8qIG5vb3AgKi8gfSB9O1xuICB9LCBbZ2FtZUlkXSk7XG5cbiAgaWYgKCFnYW1lKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgei01MCBiZy1ibGFjay84NSBiYWNrZHJvcC1ibHVyLW1kIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtMyBzbTpwLTQgYW5pbWF0ZS1mYWRlSW5cIlxuICAgICAgZGF0YS10ZXN0aWQ9XCJtaW5pZ2FtZS1vdmVybGF5XCI+XG4gICAgICA8ZGl2IHJlZj17cGFuZWxSZWZ9XG4gICAgICAgIGNsYXNzTmFtZT1cIm1nLXBhbmVsIGJnLVsjMTUxQTIzXSBib3JkZXIgYm9yZGVyLXdoaXRlLzE1IHJvdW5kZWQtM3hsIHAtNCBzbTpwLTYgdy1mdWxsIG1heC13LTJ4bCBzaGFkb3ctMnhsIGFuaW1hdGUtc2NhbGVJbiBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMyBtYXgtaC1bOTR2aF1cIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gdy1mdWxsIHNocmluay0wXCI+XG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8c3Bhbj57Z2FtZS5pY29ufTwvc3Bhbj48c3Bhbj57Z2FtZS50ZW59PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXCI+XHUyMDE0IGNoXHUwMUExaSAxIG1cdTAwRUNuaDwvc3Bhbj5cbiAgICAgICAgICA8L2gzPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNVwiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgZGF0YS10ZXN0aWQ9XCJtaW5pZ2FtZS1mdWxsc2NyZWVuXCIgYXJpYS1sYWJlbD1cIlRvXHUwMEUwbiBtXHUwMEUwbiBoXHUwMEVDbmhcIlxuICAgICAgICAgICAgICB0aXRsZT17ZnVsbCA/ICdUaG9cdTAwRTF0IHRvXHUwMEUwbiBtXHUwMEUwbiBoXHUwMEVDbmgnIDogJ1RvXHUwMEUwbiBtXHUwMEUwbiBoXHUwMEVDbmgnfVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWwgPSBwYW5lbFJlZi5jdXJyZW50O1xuICAgICAgICAgICAgICAgIGlmICghZWwpIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQpIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuPy4oKTtcbiAgICAgICAgICAgICAgICBlbHNlIGVsLnJlcXVlc3RGdWxsc2NyZWVuPy4oKTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy04IGgtOCByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6YmctWyMwMEYyRkVdLzE1IHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtWyMwMEYyRkVdIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtc20gYm9yZGVyIGJvcmRlci13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICB7ZnVsbCA/ICdcdTI3MTUnIDogJ1x1MjZGNid9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9e29uQ2xvc2V9IGRhdGEtdGVzdGlkPVwibWluaWdhbWUtY2xvc2VcIiBhcmlhLWxhYmVsPVwiXHUwMTEwXHUwMEYzbmdcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwLTEuNSByb3VuZGVkLWxnIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICAgICAgICA8SWMgbmFtZT1cInhcIiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiByZWY9e2h1ZFJlZn0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC14cyBmb250LWJvbGQgc2hyaW5rLTBcIiAvPlxuICAgICAgICA8ZGl2IHJlZj17c3RhZ2VSZWZ9IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4taC0wIHctZnVsbCBvdmVyZmxvdy1hdXRvIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktc3RhcnQgZ2FwLTMgcHktMVwiIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQUlBLFNBQVMsWUFBWSxxQkFBcUI7QUFDMUMsU0FBUyxVQUFVO0FBRW5CLE1BQU0sRUFBRSxXQUFXLFFBQVEsU0FBUyxTQUFTLElBQUk7QUFFMUMsYUFBTSxpQkFBaUI7QUFBQSxFQUM1QixTQUFTLEVBQUUsS0FBSyx5QkFBaUIsTUFBTSxnQkFBTSxNQUFNLHdDQUF3QixRQUFRLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDdEcsT0FBUyxFQUFFLEtBQUsscUJBQWtCLE1BQU0sVUFBSyxNQUFNLDRDQUF5QixRQUFRLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDdkcsSUFBUyxFQUFFLEtBQUssc0JBQWtCLE1BQU0sYUFBTSxNQUFNLCtCQUF5QixRQUFRLGFBQU0sVUFBVSxZQUFLO0FBQUEsRUFDMUcsU0FBUyxFQUFFLEtBQUssa0JBQWtCLE1BQU0sVUFBSyxNQUFNLHNDQUF5QixRQUFRLFVBQUssVUFBVSxTQUFJO0FBQ3pHO0FBQ08sYUFB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
