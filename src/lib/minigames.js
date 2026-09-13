// ==============================================================================
// src/lib/minigames.js — Mini game CHƠI MỘT MÌNH, vanilla DOM mount.
// Engine lấy nguyên từ qa/game-lab.html (đã pass 31/0 browser test) — không
// đụng server, không mock data: state chỉ sống trong tab hiện tại.
//
//   import { MINI_GAMES, mountMiniGame } from '../lib/minigames.js';
//   const cleanup = mountMiniGame('g48', stageEl, hudEl); // → gọi cleanup() khi unmount
// ==============================================================================

export const MINI_GAMES = [
  { id: 'g48', icon: '🔢', ten: '2048',        moTa: 'Trượt gộp số đến 2048' },
  { id: 'mem', icon: '🃏', ten: 'Trí Nhớ 4×4',  moTa: 'Lật thẻ tìm cặp giống nhau' },
  { id: 'snk', icon: '🐍', ten: 'Rắn Săn Mồi',  moTa: 'Ăn mồi, né tường, tăng tốc' },
];

// CSS riêng của mini-game (cell 2048, thẻ 3D, canvas) — inject đúng 1 lần
const STYLE_ID = 'minigames-css';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  .t2048 { width: 72px; height: 72px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; background: rgba(255,255,255,.05); transition: all .12s; }
  .t2048.v2{background:#1e293b;color:#94a3b8}.t2048.v4{background:#164e63;color:#a5f3fc}.t2048.v8{background:#155e75;color:#cffafe}
  .t2048.v16{background:#0e7490}.t2048.v32{background:#0891b2}.t2048.v64{background:#06b6d4;color:#000}
  .t2048.v128{background:#f59e0b;color:#000}.t2048.v256{background:#f97316}.t2048.v512{background:#ea580c}
  .t2048.v1024{background:#dc2626}.t2048.v2048{background:#facc15;color:#000;box-shadow:0 0 24px rgba(250,204,21,.5)}
  @keyframes mg-pop { 0%{transform:scale(.4)} 80%{transform:scale(1.1)} 100%{transform:scale(1)} }
  .t2048.new { animation: mg-pop .18s; }
  .mem-card { width: 84px; height: 84px; perspective: 600px; cursor: pointer; }
  .mem-inner { position: relative; width: 100%; height: 100%; transition: transform .35s; transform-style: preserve-3d; }
  .mem-card.open .mem-inner, .mem-card.done .mem-inner { transform: rotateY(180deg); }
  .mem-face { position: absolute; inset: 0; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 34px; backface-visibility: hidden; }
  .mem-front { background: linear-gradient(135deg,#164e63,#0f172a); border: 1px solid rgba(0,242,254,.3); }
  .mem-back { transform: rotateY(180deg); background: #151b2e; border: 1px solid rgba(255,255,255,.15); }
  .mem-card.done .mem-back { border-color: #00F2FE; box-shadow: 0 0 12px rgba(0,242,254,.35); }
  .mg-canvas { background: #0d1320; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); }
  .mg-glass { background: #121620; border: 1px solid rgba(255,255,255,.08); }
  .mg-btn-acc { background: #00F2FE; color: #000; font-weight: 800; }
  .mg-btn-acc:hover { background: #00e1ec; }
  `;
  document.head.appendChild(s);
}

function statusBar(text) {
  const d = document.createElement('div');
  d.className = 'mg-glass rounded-xl px-4 py-2 text-sm font-extrabold text-center min-w-52';
  d.dataset.testid = 'game-status';
  d.textContent = text;
  return d;
}
function restartBtn(fn) {
  const b = document.createElement('button');
  b.className = 'mg-btn-acc px-4 py-2 rounded-xl text-xs';
  b.dataset.testid = 'btn-restart';
  b.textContent = '↻ Chơi lại';
  b.addEventListener('click', fn);
  return b;
}
function pill(text) {
  const s = document.createElement('span');
  s.className = 'mg-glass px-3 py-1 rounded-full text-[11px] font-extrabold';
  s.textContent = text;
  return s;
}
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };

/* ── 2048 ── */
function game48(stage, hud) {
  const N = 4;
  let g, score, over, won;

  const status = statusBar('');
  const scoreEl = pill('0');
  scoreEl.dataset.testid = 'g48-score';
  hud.append(scoreEl);
  const grid = document.createElement('div');
  grid.className = 'mg-glass rounded-2xl p-2 grid gap-2';
  grid.style.gridTemplateColumns = `repeat(${N}, 72px)`;
  const tiles = [];
  for (let i = 0; i < N * N; i++) {
    const t = document.createElement('div');
    t.className = 't2048';
    t.dataset.testid = `g48-${i}`;
    grid.appendChild(t);
    tiles.push(t);
  }
  const pad = document.createElement('div');
  pad.className = 'grid grid-cols-3 gap-1.5 w-40';
  for (const [dir, label] of [['up', '▲'], ['left', '◀'], ['down', '▼'], ['right', '▶']]) {
    const b = document.createElement('button');
    b.className = 'mg-glass rounded-lg py-2 font-black text-cyan-300';
    b.dataset.testid = `g48-${dir}`;
    b.textContent = label;
    if (dir === 'up') b.style.gridColumn = '2';
    if (dir === 'left') b.style.gridColumn = '1';
    b.addEventListener('click', () => move(dir));
    pad.appendChild(b);
  }
  stage.append(status, grid, pad, restartBtn(reset));

  const spawn = () => {
    const empty = [];
    for (let i = 0; i < N * N; i++) if (!g[i]) empty.push(i);
    if (!empty.length) return -1;
    const i = empty[Math.floor(Math.random() * empty.length)];
    g[i] = Math.random() < 0.9 ? 2 : 4;
    return i;
  };
  function slide(row) {
    const arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++)
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; if (arr[i] === 2048) won = true; arr.splice(i + 1, 1); }
    while (arr.length < N) arr.push(0);
    return arr;
  }
  function move(dir) {
    if (over) return;
    const before = g.join(',');
    const get = (r, c) => g[r * N + c];
    const set = (r, c, v) => g[r * N + c] = v;
    for (let i = 0; i < N; i++) {
      const line = [];
      for (let j = 0; j < N; j++) line.push(dir === 'up' || dir === 'down' ? get(j, i) : get(i, j));
      if (dir === 'down' || dir === 'right') line.reverse();
      const out = slide(line);
      if (dir === 'down' || dir === 'right') out.reverse();
      for (let j = 0; j < N; j++) (dir === 'up' || dir === 'down') ? set(j, i, out[j]) : set(i, j, out[j]);
    }
    if (g.join(',') !== before) spawn();
    if (!canMove()) over = true;
    render();
  }
  function canMove() {
    for (let i = 0; i < N * N; i++) {
      if (!g[i]) return true;
      const r = Math.floor(i / N), c = i % N;
      if (c < N - 1 && g[i] === g[i + 1]) return true;
      if (r < N - 1 && g[i] === g[i + N]) return true;
    }
    return false;
  }
  function render() {
    tiles.forEach((t, i) => {
      const v = g[i];
      t.textContent = v || '';
      t.className = 't2048' + (v ? ` v${Math.min(v, 2048)}` : '');
    });
    scoreEl.textContent = `Điểm: ${score}`;
    status.textContent = won ? '🏆 2048! Tuyệt vời — chơi tiếp được nữa' : over ? '💀 Hết nước — Chơi lại?' : 'Mũi tên / WASD để trượt';
    status.dataset.state = won ? 'won' : over ? 'over' : 'playing';
  }
  function onKey(e) {
    if (KEYMAP[e.key]) { e.preventDefault(); move(KEYMAP[e.key]); }
  }
  window.addEventListener('keydown', onKey);
  function reset() { g = Array(N * N).fill(0); score = 0; over = false; won = false; spawn(); spawn(); render(); }
  reset();
  return () => window.removeEventListener('keydown', onKey);
}

/* ── Trí Nhớ 4×4 ── */
function gameMem(stage, hud) {
  const ICONS = ['🎮', '🚀', '🌈', '🎵', '⚽', '🍀', '🔥', '💎'];
  let deck, open, matched, moves, t0, timerInt;

  const status = statusBar('');
  const timerEl = pill('⏱ 0s');
  timerEl.dataset.testid = 'mem-timer';
  const movesEl = pill('0 lượt');
  movesEl.dataset.testid = 'mem-moves';
  hud.append(timerEl, movesEl);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-4 gap-2.5';
  const cards = [];
  for (let i = 0; i < 16; i++) {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.dataset.testid = `mem-${i}`;
    const inner = document.createElement('div'); inner.className = 'mem-inner';
    const front = document.createElement('div'); front.className = 'mem-face mem-front'; front.textContent = '❓';
    const back = document.createElement('div'); back.className = 'mem-face mem-back';
    inner.append(front, back); card.appendChild(inner);
    card.addEventListener('click', () => flip(i));
    grid.appendChild(card);
    cards.push(card);
  }
  stage.append(status, grid, restartBtn(reset));

  function flip(i) {
    if (open.length === 2 || open.includes(i) || matched.has(i)) return;
    open.push(i);
    cards[i].classList.add('open');
    if (open.length === 2) {
      moves++;
      movesEl.textContent = `${moves} lượt`;
      const [a, b] = open;
      if (deck[a] === deck[b]) {
        matched.add(a); matched.add(b); open = [];
        cards[a].classList.add('done'); cards[b].classList.add('done');
        if (matched.size === 16) {
          clearInterval(timerInt);
          status.textContent = `🏆 Xong! ${moves} lượt — ${Math.floor((Date.now() - t0) / 1000)}s`;
          status.dataset.state = 'won';
        }
      } else {
        setTimeout(() => { cards[a].classList.remove('open'); cards[b].classList.remove('open'); open = []; }, 650);
      }
    }
  }
  function reset() {
    deck = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
    open = []; matched = new Set(); moves = 0; t0 = Date.now();
    clearInterval(timerInt);
    timerInt = setInterval(() => { timerEl.textContent = `⏱ ${Math.floor((Date.now() - t0) / 1000)}s`; }, 1000);
    movesEl.textContent = '0 lượt';
    status.textContent = 'Tìm 8 cặp giống nhau';
    status.dataset.state = 'playing';
    cards.forEach((c, i) => { c.className = 'mem-card'; c.lastChild.lastChild.textContent = deck[i]; });
  }
  reset();
  return () => clearInterval(timerInt);
}

/* ── Rắn Săn Mồi ── */
function gameSnk(stage, hud) {
  const N = 20, CELL = 20;
  let snake, dir, nextDir, food, score, speed, int;

  const status = statusBar('');
  const scoreEl = pill('0');
  scoreEl.dataset.testid = 'snk-score';
  hud.append(scoreEl);
  const canvas = document.createElement('canvas');
  canvas.className = 'mg-canvas';
  canvas.width = canvas.height = N * CELL;
  canvas.dataset.testid = 'snk-canvas';
  const ctx = canvas.getContext('2d');

  const pad = document.createElement('div');
  pad.className = 'grid grid-cols-3 gap-1.5 w-40';
  for (const [d, label] of [['up', '▲'], ['left', '◀'], ['down', '▼'], ['right', '▶']]) {
    const b = document.createElement('button');
    b.className = 'mg-glass rounded-lg py-2 font-black text-cyan-300';
    b.dataset.testid = `snk-${d}`;
    b.textContent = label;
    if (d === 'up') b.style.gridColumn = '2';
    if (d === 'left') b.style.gridColumn = '1';
    b.addEventListener('click', () => setDir(d));
    pad.appendChild(b);
  }
  stage.append(status, canvas, pad, restartBtn(reset));

  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  function setDir(d) { if (OPP[d] !== dir) nextDir = d; }

  let foodWasFirst = true;
  function spawnFood() {
    if (foodWasFirst) { foodWasFirst = false; food = { x: snake[0].x + 3, y: snake[0].y }; return; }
    do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
    while (snake.some(s => s.x === food.x && s.y === food.y));
  }
  function tick() {
    dir = nextDir;
    const h = { x: snake[0].x + (dir === 'right') - (dir === 'left'), y: snake[0].y + (dir === 'down') - (dir === 'up') };
    if (h.x < 0 || h.x >= N || h.y < 0 || h.y >= N || snake.some(s => s.x === h.x && s.y === h.y)) {
      clearInterval(int); render();
      status.textContent = `💀 Thua! Điểm ${score} — Chơi lại?`;
      status.dataset.state = 'over';
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score++;
      scoreEl.textContent = `Điểm: ${score}`;
      spawnFood();
      if (speed > 70) { clearInterval(int); speed -= 8; int = setInterval(tick, speed); }
    } else snake.pop();
    render();
  }
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    for (let i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }
    ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 1);
    snake.forEach((s, i) => {
      const t = i / snake.length;
      ctx.fillStyle = i === 0 ? '#00F2FE' : `rgba(0,${Math.floor(200 - t * 80)},${Math.floor(220 - t * 60)},.9)`;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, 5);
      ctx.fill();
    });
  }
  function onKey(e) {
    if (KEYMAP[e.key]) { e.preventDefault(); setDir(KEYMAP[e.key]); }
  }
  window.addEventListener('keydown', onKey);
  function reset() {
    snake = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
    dir = nextDir = 'right'; score = 0; speed = 180; foodWasFirst = true;
    spawnFood();
    scoreEl.textContent = 'Điểm: 0';
    status.textContent = 'Mũi tên / WASD — ăn mồi, né tường';
    status.dataset.state = 'playing';
    clearInterval(int); int = setInterval(tick, speed);
    render();
  }
  reset();
  return () => { clearInterval(int); window.removeEventListener('keydown', onKey); };
}

const IMPL = { g48: game48, mem: gameMem, snk: gameSnk };

// Mount 1 mini game vào stageEl (hudEl nhận pill điểm/timer). Trả về cleanup fn.
export function mountMiniGame(id, stageEl, hudEl) {
  ensureStyles();
  stageEl.innerHTML = '';
  if (hudEl) hudEl.innerHTML = '';
  const impl = IMPL[id];
  return impl ? (impl(stageEl, hudEl || stageEl) || null) : null;
}
