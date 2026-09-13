// ==============================================================================
// src/lib/minigames.js — Mini game CHƠI MỘT MÌNH, vanilla DOM mount.
// Engine + visual đồng bộ qa/game-lab.html (dark-neon, fluid size, animation).
// Không đụng server, không mock data: state chỉ sống trong tab hiện tại.
//
//   import { MINI_GAMES, mountMiniGame } from '../lib/minigames.js';
//   const cleanup = mountMiniGame('g48', stageEl, hudEl); // → gọi cleanup() khi unmount
// ==============================================================================

export const MINI_GAMES = [
  { id: 'g48', icon: '🔢', ten: '2048',        moTa: 'Trượt gộp số đến 2048' },
  { id: 'mem', icon: '🃏', ten: 'Trí Nhớ 4×4',  moTa: 'Lật thẻ tìm cặp giống nhau' },
  { id: 'snk', icon: '🐍', ten: 'Rắn Săn Mồi',  moTa: 'Ăn mồi, né tường, tăng tốc' },
];

// CSS riêng của mini-game — inject đúng 1 lần. Kích thước dùng vmin → tự co giãn
// theo cửa sổ, và .mg-panel:fullscreen (games.jsx) cho phép chơi full màn hình.
const STYLE_ID = 'minigames-css';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  .mg-glass { background: rgba(18,22,32,.85); border: 1px solid rgba(255,255,255,.08); }
  .mg-status { background: linear-gradient(135deg, rgba(0,242,254,.10), rgba(168,85,247,.10)); border:1px solid rgba(0,242,254,.22); }
  .mg-btn-acc { background: linear-gradient(135deg,#00F2FE,#22d3ee); color:#00181c; font-weight:800; box-shadow:0 4px 18px rgba(0,242,254,.25); }
  .mg-btn-acc:hover { filter: brightness(1.1); }
  .mg-btn-acc:active { transform: scale(.96); }
  .mg-padbtn { transition: all .12s; }
  .mg-padbtn:hover { background: rgba(0,242,254,.15); color:#00F2FE; box-shadow:0 0 12px rgba(0,242,254,.25); }
  .mg-padbtn:active { transform: scale(.92); }

  /* 2048 — grid vuông co giãn, tile gradient theo bậc */
  .g48-board { background: linear-gradient(160deg,#1c2436,#121620); border:1px solid rgba(255,255,255,.1);
    box-shadow: 0 16px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);
    width: min(86vw, 46vh, 380px); display:grid; gap:8px; padding:10px; border-radius:16px;
    grid-template-columns: repeat(4, 1fr); touch-action:none; }
  .mg-panel:fullscreen .g48-board { width: min(80vw, 62vh); }
  .t2048 { width:100%; aspect-ratio:1; border-radius:12px; display:flex; align-items:center; justify-content:center;
    font-weight:900; font-size:clamp(16px, 4.6vmin, 24px); background:rgba(255,255,255,.045);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05); transition: background .15s; }
  .t2048.v2{background:linear-gradient(145deg,#3b4a63,#2e3a4f);color:#cbd5e1}
  .t2048.v4{background:linear-gradient(145deg,#4a5a78,#3b4a63);color:#e2e8f0}
  .t2048.v8{background:linear-gradient(145deg,#0e7490,#155e75);color:#cffafe}
  .t2048.v16{background:linear-gradient(145deg,#0891b2,#0e7490);color:#ecfeff}
  .t2048.v32{background:linear-gradient(145deg,#06b6d4,#0891b2);color:#001318}
  .t2048.v64{background:linear-gradient(145deg,#22d3ee,#06b6d4);color:#001318;box-shadow:0 0 14px rgba(34,211,238,.4)}
  .t2048.v128{background:linear-gradient(145deg,#a78bfa,#8b5cf6);color:#fff;font-size:clamp(14px,4vmin,20px);box-shadow:0 0 14px rgba(139,92,246,.4)}
  .t2048.v256{background:linear-gradient(145deg,#f472b6,#ec4899);color:#fff;font-size:clamp(14px,4vmin,20px);box-shadow:0 0 14px rgba(236,72,153,.4)}
  .t2048.v512{background:linear-gradient(145deg,#fb923c,#f97316);color:#fff;font-size:clamp(14px,4vmin,20px);box-shadow:0 0 16px rgba(249,115,22,.5)}
  .t2048.v1024{background:linear-gradient(145deg,#f87171,#ef4444);color:#fff;font-size:clamp(11px,3.2vmin,16px);box-shadow:0 0 18px rgba(239,68,68,.5)}
  .t2048.v2048{background:linear-gradient(145deg,#fde047,#facc15);color:#3f3000;font-size:clamp(11px,3.2vmin,16px);box-shadow:0 0 28px rgba(250,204,21,.75)}
  @keyframes mg-pop { 0%{transform:scale(.3)} 70%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @keyframes mg-merge { 0%{transform:scale(1)} 45%{transform:scale(1.18); filter:brightness(1.35)} 100%{transform:scale(1)} }
  .t2048.pop { animation: mg-pop .18s cubic-bezier(.3,1.3,.5,1); }
  .t2048.merge { animation: mg-merge .2s ease; }

  /* Memory — thẻ 3D co giãn */
  .mem-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; width:min(86vw, 48vh, 400px); }
  .mg-panel:fullscreen .mem-grid { width:min(74vw, 66vh); }
  .mem-card { width:100%; aspect-ratio:1; perspective:700px; cursor:pointer; }
  .mem-inner { position:relative; width:100%; height:100%; transition:transform .4s cubic-bezier(.35,.9,.4,1.1); transform-style:preserve-3d; }
  .mem-card.open .mem-inner, .mem-card.done .mem-inner { transform:rotateY(180deg); }
  .mem-card:not(.open):not(.done):hover .mem-inner { transform:rotateY(-14deg); }
  .mem-face { position:absolute; inset:0; border-radius:14px; display:flex; align-items:center; justify-content:center;
    font-size:clamp(24px, 7vmin, 36px); backface-visibility:hidden; }
  .mem-front { background:linear-gradient(145deg,#164e63,#0c1220 70%); border:1px solid rgba(0,242,254,.3); color:rgba(0,242,254,.5);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.1), 0 6px 16px rgba(0,0,0,.35); }
  .mem-front::after { content:''; position:absolute; inset:7%; border-radius:9px; border:1px dashed rgba(0,242,254,.22); }
  .mem-back { transform:rotateY(180deg); background:linear-gradient(145deg,#1e293b,#151b2e); border:1px solid rgba(255,255,255,.14);
    box-shadow:0 6px 16px rgba(0,0,0,.35); }
  .mem-card.done .mem-back { border-color:#22d3ee; box-shadow:0 0 18px rgba(34,211,238,.45), 0 6px 16px rgba(0,0,0,.35); animation:mg-memwin .5s cubic-bezier(.3,1.5,.5,1); }
  @keyframes mg-memwin { 0%{transform:rotateY(180deg) scale(1)} 50%{transform:rotateY(180deg) scale(1.12)} 100%{transform:rotateY(180deg) scale(1)} }

  /* Snake — canvas neon, hiển thị co giãn (internal res cố định 600px) */
  .mg-canvas { background:radial-gradient(circle at 50% 40%, #101a2e, #0B0E14 80%); border-radius:16px;
    border:1px solid rgba(255,255,255,.09); box-shadow:0 16px 40px rgba(0,0,0,.5), inset 0 0 40px rgba(0,0,0,.4);
    width:min(86vw, 50vh, 440px); height:auto; touch-action:none; }
  .mg-panel:fullscreen .mg-canvas { width:min(84vw, 66vh); }
  `;
  document.head.appendChild(s);
}

function statusBar(text) {
  const d = document.createElement('div');
  d.className = 'mg-status rounded-xl px-4 py-2 text-sm font-extrabold text-center text-slate-100 max-w-full';
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
  let g, score, over, won, newIdx, mergedSet;

  const status = statusBar('');
  const scoreEl = pill('0');
  scoreEl.dataset.testid = 'g48-score';
  hud.append(scoreEl);
  const grid = document.createElement('div');
  grid.className = 'g48-board';
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
    b.className = 'mg-padbtn mg-glass rounded-lg py-2 font-black text-cyan-300';
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
  // trả về { arr, merged } — merged = index trong arr đã gộp (để gắn hiệu ứng)
  function slide(row) {
    const arr = row.filter(v => v);
    const merged = [];
    for (let i = 0; i < arr.length - 1; i++)
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; if (arr[i] === 2048) won = true; merged.push(i); arr.splice(i + 1, 1); }
    while (arr.length < N) arr.push(0);
    return { arr, merged };
  }
  function move(dir) {
    if (over) return;
    const before = g.join(',');
    newIdx = -1; mergedSet = new Set();
    const get = (r, c) => g[r * N + c];
    const set = (r, c, v) => g[r * N + c] = v;
    for (let i = 0; i < N; i++) {
      const line = [];
      for (let j = 0; j < N; j++) line.push(dir === 'up' || dir === 'down' ? get(j, i) : get(i, j));
      if (dir === 'down' || dir === 'right') line.reverse();
      const { arr: out, merged } = slide(line);
      if (dir === 'down' || dir === 'right') out.reverse();
      for (let j = 0; j < N; j++) {
        const r = dir === 'up' || dir === 'down' ? j : i;
        const c = dir === 'up' || dir === 'down' ? i : j;
        set(r, c, out[j]);
        const wasMerged = dir === 'down' || dir === 'right' ? merged.includes(N - 1 - j) : merged.includes(j);
        if (wasMerged) mergedSet.add(r * N + c);
      }
    }
    if (g.join(',') !== before) newIdx = spawn();
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
      if (i === newIdx) t.classList.add('pop');
      else if (mergedSet && mergedSet.has(i)) t.classList.add('merge');
    });
    scoreEl.textContent = `Điểm: ${score}`;
    status.textContent = won ? '🏆 2048! Tuyệt vời — chơi tiếp được nữa' : over ? '💀 Hết nước — Chơi lại?' : 'Mũi tên / WASD để trượt';
    status.dataset.state = won ? 'won' : over ? 'over' : 'playing';
  }
  function onKey(e) {
    if (KEYMAP[e.key]) { e.preventDefault(); move(KEYMAP[e.key]); }
  }
  window.addEventListener('keydown', onKey);
  // swipe trên mobile
  let tx0 = 0, ty0 = 0;
  const onTS = e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; };
  const onTE = e => {
    const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };
  grid.addEventListener('touchstart', onTS, { passive: true });
  grid.addEventListener('touchend', onTE, { passive: true });
  function reset() { g = Array(N * N).fill(0); score = 0; over = false; won = false; newIdx = -1; mergedSet = new Set(); spawn(); spawn(); render(); }
  reset();
  return () => { window.removeEventListener('keydown', onKey); grid.removeEventListener('touchstart', onTS); grid.removeEventListener('touchend', onTE); };
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
  grid.className = 'mem-grid';
  const cards = [];
  for (let i = 0; i < 16; i++) {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.dataset.testid = `mem-${i}`;
    const inner = document.createElement('div'); inner.className = 'mem-inner';
    const front = document.createElement('div'); front.className = 'mem-face mem-front'; front.textContent = '✦';
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

/* ── Rắn Săn Mồi — canvas neon, chuyển động mượt (nội suy giữa 2 tick) ── */
function gameSnk(stage, hud) {
  const N = 20, CELL = 30; // internal res 600px — CSS scale theo cửa sổ
  let snake, prevSnake, dir, nextDir, food, score, speed, int, alive;
  let tickAt = 0, particles = [], raf = 0;

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
    b.className = 'mg-padbtn mg-glass rounded-lg py-2 font-black text-cyan-300';
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
  function burst(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.4;
      particles.push({ x: x * CELL + CELL / 2, y: y * CELL + CELL / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
    }
  }
  function tick() {
    prevSnake = snake.map(s => ({ x: s.x, y: s.y }));
    tickAt = performance.now();
    dir = nextDir;
    const h = { x: snake[0].x + (dir === 'right') - (dir === 'left'), y: snake[0].y + (dir === 'down') - (dir === 'up') };
    if (h.x < 0 || h.x >= N || h.y < 0 || h.y >= N || snake.some(s => s.x === h.x && s.y === h.y)) {
      alive = false; clearInterval(int);
      ctx.fillStyle = 'rgba(225,29,72,.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      status.textContent = `💀 Thua! Điểm ${score} — Chơi lại?`;
      status.dataset.state = 'over';
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score++;
      scoreEl.textContent = `Điểm: ${score}`;
      burst(h.x, h.y);
      spawnFood();
      if (speed > 70) { clearInterval(int); speed -= 8; int = setInterval(tick, speed); }
    } else snake.pop();
  }
  // vị trí nội suy giữa 2 tick → chuyển động mượt
  function lerpSegs(t) {
    return snake.map((s, i) => {
      const p = prevSnake[i] || prevSnake[prevSnake.length - 1] || s;
      return { x: p.x + (s.x - p.x) * t, y: p.y + (s.y - p.y) * t };
    });
  }
  function frame(now) {
    if (!alive) return;
    const t = Math.min(1, (now - tickAt) / speed);
    draw(t, now);
    raf = requestAnimationFrame(frame);
  }
  function draw(t, now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (let i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }
    // mồi — quả cầu pulse
    const pulse = 1 + Math.sin(now / 260) * 0.12;
    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
    ctx.save();
    ctx.shadowColor = '#f472b6'; ctx.shadowBlur = 18;
    const fr = (CELL / 2 - 4) * pulse;
    const fgrad = ctx.createRadialGradient(fx - 3, fy - 3, 2, fx, fy, fr);
    fgrad.addColorStop(0, '#fda4af'); fgrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = fgrad;
    ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // rắn — một path liền + glow
    const segs = lerpSegs(t);
    ctx.save();
    ctx.shadowColor = '#00F2FE'; ctx.shadowBlur = 16;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.lineWidth = CELL - 7;
    const sgrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    sgrad.addColorStop(0, '#67e8f9'); sgrad.addColorStop(1, '#0e7490');
    ctx.strokeStyle = sgrad;
    ctx.beginPath();
    segs.forEach((s, i) => {
      const px = s.x * CELL + CELL / 2, py = s.y * CELL + CELL / 2;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
    // đầu + mắt
    const hd = segs[0];
    const hx = hd.x * CELL + CELL / 2, hy = hd.y * CELL + CELL / 2;
    ctx.fillStyle = '#a5f3fc';
    ctx.beginPath(); ctx.arc(hx, hy, (CELL - 4) / 2, 0, Math.PI * 2); ctx.fill();
    const ex = dir === 'left' ? -4 : dir === 'right' ? 4 : 0;
    const ey = dir === 'up' ? -4 : dir === 'down' ? 4 : 0;
    const px2 = dir === 'left' || dir === 'right' ? 0 : 6;
    const py2 = dir === 'up' || dir === 'down' ? 0 : 6;
    ctx.fillStyle = '#0B0E14';
    ctx.beginPath(); ctx.arc(hx + ex - px2 * .7, hy + ey - py2 * .7, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + ex + px2 * .7, hy + ey + py2 * .7, 3, 0, Math.PI * 2); ctx.fill();
    // particles ăn mồi
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.life -= 0.04;
      ctx.fillStyle = `rgba(244,114,182,${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.2 * p.life + .8, 0, Math.PI * 2); ctx.fill();
    }
  }
  function onKey(e) {
    if (KEYMAP[e.key]) { e.preventDefault(); setDir(KEYMAP[e.key]); }
  }
  window.addEventListener('keydown', onKey);
  // swipe trên canvas (mobile)
  let sx0 = 0, sy0 = 0;
  const onTS = e => { sx0 = e.touches[0].clientX; sy0 = e.touches[0].clientY; };
  const onTE = e => {
    const dx = e.changedTouches[0].clientX - sx0, dy = e.changedTouches[0].clientY - sy0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };
  canvas.addEventListener('touchstart', onTS, { passive: true });
  canvas.addEventListener('touchend', onTE, { passive: true });

  function reset() {
    snake = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
    prevSnake = snake.map(s => ({ ...s }));
    dir = nextDir = 'right'; score = 0; speed = 180; foodWasFirst = true;
    alive = true; particles = []; tickAt = performance.now();
    spawnFood();
    scoreEl.textContent = 'Điểm: 0';
    status.textContent = 'Mũi tên / WASD — ăn mồi, né tường';
    status.dataset.state = 'playing';
    clearInterval(int); int = setInterval(tick, speed);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  reset();
  return () => { clearInterval(int); cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); canvas.removeEventListener('touchstart', onTS); canvas.removeEventListener('touchend', onTE); };
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
