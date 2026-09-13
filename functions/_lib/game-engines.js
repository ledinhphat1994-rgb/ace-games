// ==============================================================================
// functions/_lib/game-engines.js — Engine game đối kháng dùng chung phía server.
// State là JSON thuần lưu trong game_phong.du_lieu_ban_co.
//
// Quân cờ: quanIdx 0 = chủ bàn, 1 = khách.
//   - co_caro / caro9 : ô 'X' (chủ) | 'O' (khách) — tương thích ngược dữ liệu cũ
//   - c4 / reversi    : ô 1 (chủ) | 2 (khách)
//
// apDungNuocDi(loai, board, {r, c}, quanIdx) →
//   { ok:true, board, ketThuc:null|'thang'|'hoa', luotLai:bool, winLine? }
//   { ok:false, loi }
//   luotLai=true: đối thủ hết nước (Reversi) → người vừa đánh đi tiếp.
// ==============================================================================

export const GAME_TYPES = {
  co_caro: { n: 15, win: 5, ten: 'Cờ Caro 15×15', quan: ['X', 'O'], kieuNuoc: 'o' },
  caro9:   { n: 9,  win: 5, ten: 'Caro Nhanh 9×9', quan: ['X', 'O'], kieuNuoc: 'o' },
  c4:      { r: 6, c: 7,    ten: 'Thả Quân 4',     quan: [1, 2],    kieuNuoc: 'cot' },
  reversi: { n: 8,          ten: 'Reversi 8×8',    quan: [1, 2],    kieuNuoc: 'o' },
};

export const LOAI_GAME_HOP_LE = Object.keys(GAME_TYPES);

export function banCoKhoiTao(loai) {
  const t = GAME_TYPES[loai] || GAME_TYPES.co_caro;
  if (loai === 'c4') {
    return Array.from({ length: t.r }, () => Array(t.c).fill(0));
  }
  if (loai === 'reversi') {
    const b = Array.from({ length: t.n }, () => Array(t.n).fill(0));
    b[3][3] = 2; b[3][4] = 1; b[4][3] = 1; b[4][4] = 2;
    return b;
  }
  return Array.from({ length: t.n }, () => Array(t.n).fill(null));
}

// Đếm N quân liên tiếp qua (r, c) — trả về mảng toạ độ thắng hoặc null
function dongThang(board, r, c, v, n, R, C) {
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const line = [[r, c]];
    for (const s of [1, -1]) {
      let nr = r + dr * s, nc = c + dc * s;
      while (nr >= 0 && nr < R && nc >= 0 && nc < C && board[nr][nc] === v) {
        line.push([nr, nc]); nr += dr * s; nc += dc * s;
      }
    }
    if (line.length >= n) return line;
  }
  return null;
}

const banDay = board => board.every(row => row.every(v => v !== null && v !== 0));

// ── Reversi ──────────────────────────────────────────────────────────────
const RV_DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function rvFlips(board, r, c, v) {
  const N = 8, doi = v === 1 ? 2 : 1;
  if (board[r][c]) return [];
  const all = [];
  for (const [dr, dc] of RV_DIRS) {
    const line = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === doi) {
      line.push([nr, nc]); nr += dr; nc += dc;
    }
    if (line.length && nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === v) all.push(...line);
  }
  return all;
}

function rvCoNuoc(board, v) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if (rvFlips(board, r, c, v).length) return true;
  return false;
}

function rvDem(board) {
  let b = 0, w = 0;
  for (const row of board) for (const v of row) { if (v === 1) b++; else if (v === 2) w++; }
  return { b, w };
}

// ── Entry chính ──────────────────────────────────────────────────────────
export function apDungNuocDi(loai, board, nuoc, quanIdx) {
  const t = GAME_TYPES[loai] || GAME_TYPES.co_caro;
  const quan = t.quan[quanIdx];
  const r = Math.trunc(Number(nuoc?.r));
  const c = Math.trunc(Number(nuoc?.c));

  // ── Thả Quân 4: chỉ cần cột c ──
  if (loai === 'c4') {
    if (!Number.isInteger(c) || c < 0 || c >= t.c) return { ok: false, loi: 'Cột không hợp lệ.' };
    let row = -1;
    for (let i = t.r - 1; i >= 0; i--) if (!board[i][c]) { row = i; break; }
    if (row < 0) return { ok: false, loi: 'Cột này đã đầy.' };
    board[row][c] = quan;
    const winLine = dongThang(board, row, c, quan, 4, t.r, t.c);
    const hoa = !winLine && banDay(board);
    return { ok: true, board, ketThuc: winLine ? 'thang' : hoa ? 'hoa' : null, luotLai: false, winLine, o: [row, c] };
  }

  // ── Reversi: ô (r, c) phải lật được ít nhất 1 quân ──
  if (loai === 'reversi') {
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= 8 || c < 0 || c >= 8) {
      return { ok: false, loi: 'Ô không hợp lệ.' };
    }
    const flips = rvFlips(board, r, c, quan);
    if (!flips.length) return { ok: false, loi: 'Ô này không lật được quân nào.' };
    board[r][c] = quan;
    flips.forEach(([fr, fc]) => board[fr][fc] = quan);

    const doiThu = quanIdx === 0 ? 2 : 1;   // giá trị ô của đối thủ
    const doiThuConNuoc = rvCoNuoc(board, doiThu);
    const minhConNuoc = rvCoNuoc(board, quan);
    const { b, w } = rvDem(board);
    const diemSo = { chu: b, khach: w };
    if (!doiThuConNuoc && !minhConNuoc) {
      // b=1(chủ) w=2(khách): hoà khi bằng nhau
      return { ok: true, board, ketThuc: b === w ? 'hoa' : 'thang', luotLai: false, nguoiThangIdx: b > w ? 0 : 1, diemSo };
    }
    return { ok: true, board, ketThuc: null, luotLai: !doiThuConNuoc, diemSo };
  }

  // ── Caro (co_caro 15×15 / caro9 9×9): ô trống ──
  const n = t.n;
  if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= n || c < 0 || c >= n) {
    return { ok: false, loi: 'Nước đi không hợp lệ.' };
  }
  if (board[r][c] !== null) return { ok: false, loi: 'Ô này đã được đánh.' };
  board[r][c] = quan;
  const winLine = dongThang(board, r, c, quan, t.win, n, n);
  const hoa = !winLine && banDay(board);
  return { ok: true, board, ketThuc: winLine ? 'thang' : hoa ? 'hoa' : null, luotLai: false, winLine };
}
