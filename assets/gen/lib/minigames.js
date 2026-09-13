// GEN TU src/lib/minigames.js — KHONG SUA TAY
export const MINI_GAMES = [
  { id: "g48", icon: "\u{1F522}", ten: "2048", moTa: "Tr\u01B0\u1EE3t g\u1ED9p s\u1ED1 \u0111\u1EBFn 2048" },
  { id: "mem", icon: "\u{1F0CF}", ten: "Tr\xED Nh\u1EDB 4\xD74", moTa: "L\u1EADt th\u1EBB t\xECm c\u1EB7p gi\u1ED1ng nhau" },
  { id: "snk", icon: "\u{1F40D}", ten: "R\u1EAFn S\u0103n M\u1ED3i", moTa: "\u0102n m\u1ED3i, n\xE9 t\u01B0\u1EDDng, t\u0103ng t\u1ED1c" }
];
const STYLE_ID = "minigames-css";
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
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

  /* 2048 \u2014 grid vu\xF4ng co gi\xE3n, tile gradient theo b\u1EADc */
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

  /* Memory \u2014 th\u1EBB 3D co gi\xE3n */
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

  /* Snake \u2014 canvas neon, hi\u1EC3n th\u1ECB co gi\xE3n (internal res c\u1ED1 \u0111\u1ECBnh 600px) */
  .mg-canvas { background:radial-gradient(circle at 50% 40%, #101a2e, #0B0E14 80%); border-radius:16px;
    border:1px solid rgba(255,255,255,.09); box-shadow:0 16px 40px rgba(0,0,0,.5), inset 0 0 40px rgba(0,0,0,.4);
    width:min(86vw, 50vh, 440px); height:auto; touch-action:none; }
  .mg-panel:fullscreen .mg-canvas { width:min(84vw, 66vh); }
  `;
  document.head.appendChild(s);
}
function statusBar(text) {
  const d = document.createElement("div");
  d.className = "mg-status rounded-xl px-4 py-2 text-sm font-extrabold text-center text-slate-100 max-w-full";
  d.dataset.testid = "game-status";
  d.textContent = text;
  return d;
}
function restartBtn(fn) {
  const b = document.createElement("button");
  b.className = "mg-btn-acc px-4 py-2 rounded-xl text-xs";
  b.dataset.testid = "btn-restart";
  b.textContent = "\u21BB Ch\u01A1i l\u1EA1i";
  b.addEventListener("click", fn);
  return b;
}
function pill(text) {
  const s = document.createElement("span");
  s.className = "mg-glass px-3 py-1 rounded-full text-[11px] font-extrabold";
  s.textContent = text;
  return s;
}
const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
function game48(stage, hud) {
  const N = 4;
  let g, score, over, won, newIdx, mergedSet;
  const status = statusBar("");
  const scoreEl = pill("0");
  scoreEl.dataset.testid = "g48-score";
  hud.append(scoreEl);
  const grid = document.createElement("div");
  grid.className = "g48-board";
  const tiles = [];
  for (let i = 0; i < N * N; i++) {
    const t = document.createElement("div");
    t.className = "t2048";
    t.dataset.testid = `g48-${i}`;
    grid.appendChild(t);
    tiles.push(t);
  }
  const pad = document.createElement("div");
  pad.className = "grid grid-cols-3 gap-1.5 w-40";
  for (const [dir, label] of [["up", "\u25B2"], ["left", "\u25C0"], ["down", "\u25BC"], ["right", "\u25B6"]]) {
    const b = document.createElement("button");
    b.className = "mg-padbtn mg-glass rounded-lg py-2 font-black text-cyan-300";
    b.dataset.testid = `g48-${dir}`;
    b.textContent = label;
    if (dir === "up") b.style.gridColumn = "2";
    if (dir === "left") b.style.gridColumn = "1";
    b.addEventListener("click", () => move(dir));
    pad.appendChild(b);
  }
  stage.append(status, grid, pad, restartBtn(reset));
  const spawn = () => {
    const empty = [];
    for (let i2 = 0; i2 < N * N; i2++) if (!g[i2]) empty.push(i2);
    if (!empty.length) return -1;
    const i = empty[Math.floor(Math.random() * empty.length)];
    g[i] = Math.random() < 0.9 ? 2 : 4;
    return i;
  };
  function slide(row) {
    const arr = row.filter((v) => v);
    const merged = [];
    for (let i = 0; i < arr.length - 1; i++)
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        if (arr[i] === 2048) won = true;
        merged.push(i);
        arr.splice(i + 1, 1);
      }
    while (arr.length < N) arr.push(0);
    return { arr, merged };
  }
  function move(dir) {
    if (over) return;
    const before = g.join(",");
    newIdx = -1;
    mergedSet = /* @__PURE__ */ new Set();
    const get = (r, c) => g[r * N + c];
    const set = (r, c, v) => g[r * N + c] = v;
    for (let i = 0; i < N; i++) {
      const line = [];
      for (let j = 0; j < N; j++) line.push(dir === "up" || dir === "down" ? get(j, i) : get(i, j));
      if (dir === "down" || dir === "right") line.reverse();
      const { arr: out, merged } = slide(line);
      if (dir === "down" || dir === "right") out.reverse();
      for (let j = 0; j < N; j++) {
        const r = dir === "up" || dir === "down" ? j : i;
        const c = dir === "up" || dir === "down" ? i : j;
        set(r, c, out[j]);
        const wasMerged = dir === "down" || dir === "right" ? merged.includes(N - 1 - j) : merged.includes(j);
        if (wasMerged) mergedSet.add(r * N + c);
      }
    }
    if (g.join(",") !== before) newIdx = spawn();
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
      t.textContent = v || "";
      t.className = "t2048" + (v ? ` v${Math.min(v, 2048)}` : "");
      if (i === newIdx) t.classList.add("pop");
      else if (mergedSet && mergedSet.has(i)) t.classList.add("merge");
    });
    scoreEl.textContent = `\u0110i\u1EC3m: ${score}`;
    status.textContent = won ? "\u{1F3C6} 2048! Tuy\u1EC7t v\u1EDDi \u2014 ch\u01A1i ti\u1EBFp \u0111\u01B0\u1EE3c n\u1EEFa" : over ? "\u{1F480} H\u1EBFt n\u01B0\u1EDBc \u2014 Ch\u01A1i l\u1EA1i?" : "M\u0169i t\xEAn / WASD \u0111\u1EC3 tr\u01B0\u1EE3t";
    status.dataset.state = won ? "won" : over ? "over" : "playing";
  }
  function onKey(e) {
    if (KEYMAP[e.key]) {
      e.preventDefault();
      move(KEYMAP[e.key]);
    }
  }
  window.addEventListener("keydown", onKey);
  let tx0 = 0, ty0 = 0;
  const onTS = (e) => {
    tx0 = e.touches[0].clientX;
    ty0 = e.touches[0].clientY;
  };
  const onTE = (e) => {
    const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
  };
  grid.addEventListener("touchstart", onTS, { passive: true });
  grid.addEventListener("touchend", onTE, { passive: true });
  function reset() {
    g = Array(N * N).fill(0);
    score = 0;
    over = false;
    won = false;
    newIdx = -1;
    mergedSet = /* @__PURE__ */ new Set();
    spawn();
    spawn();
    render();
  }
  reset();
  return () => {
    window.removeEventListener("keydown", onKey);
    grid.removeEventListener("touchstart", onTS);
    grid.removeEventListener("touchend", onTE);
  };
}
function gameMem(stage, hud) {
  const ICONS = ["\u{1F3AE}", "\u{1F680}", "\u{1F308}", "\u{1F3B5}", "\u26BD", "\u{1F340}", "\u{1F525}", "\u{1F48E}"];
  let deck, open, matched, moves, t0, timerInt;
  const status = statusBar("");
  const timerEl = pill("\u23F1 0s");
  timerEl.dataset.testid = "mem-timer";
  const movesEl = pill("0 l\u01B0\u1EE3t");
  movesEl.dataset.testid = "mem-moves";
  hud.append(timerEl, movesEl);
  const grid = document.createElement("div");
  grid.className = "mem-grid";
  const cards = [];
  for (let i = 0; i < 16; i++) {
    const card = document.createElement("div");
    card.className = "mem-card";
    card.dataset.testid = `mem-${i}`;
    const inner = document.createElement("div");
    inner.className = "mem-inner";
    const front = document.createElement("div");
    front.className = "mem-face mem-front";
    front.textContent = "\u2726";
    const back = document.createElement("div");
    back.className = "mem-face mem-back";
    inner.append(front, back);
    card.appendChild(inner);
    card.addEventListener("click", () => flip(i));
    grid.appendChild(card);
    cards.push(card);
  }
  stage.append(status, grid, restartBtn(reset));
  function flip(i) {
    if (open.length === 2 || open.includes(i) || matched.has(i)) return;
    open.push(i);
    cards[i].classList.add("open");
    if (open.length === 2) {
      moves++;
      movesEl.textContent = `${moves} l\u01B0\u1EE3t`;
      const [a, b] = open;
      if (deck[a] === deck[b]) {
        matched.add(a);
        matched.add(b);
        open = [];
        cards[a].classList.add("done");
        cards[b].classList.add("done");
        if (matched.size === 16) {
          clearInterval(timerInt);
          status.textContent = `\u{1F3C6} Xong! ${moves} l\u01B0\u1EE3t \u2014 ${Math.floor((Date.now() - t0) / 1e3)}s`;
          status.dataset.state = "won";
        }
      } else {
        setTimeout(() => {
          cards[a].classList.remove("open");
          cards[b].classList.remove("open");
          open = [];
        }, 650);
      }
    }
  }
  function reset() {
    deck = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
    open = [];
    matched = /* @__PURE__ */ new Set();
    moves = 0;
    t0 = Date.now();
    clearInterval(timerInt);
    timerInt = setInterval(() => {
      timerEl.textContent = `\u23F1 ${Math.floor((Date.now() - t0) / 1e3)}s`;
    }, 1e3);
    movesEl.textContent = "0 l\u01B0\u1EE3t";
    status.textContent = "T\xECm 8 c\u1EB7p gi\u1ED1ng nhau";
    status.dataset.state = "playing";
    cards.forEach((c, i) => {
      c.className = "mem-card";
      c.lastChild.lastChild.textContent = deck[i];
    });
  }
  reset();
  return () => clearInterval(timerInt);
}
function gameSnk(stage, hud) {
  const N = 20, CELL = 30;
  let snake, prevSnake, dir, nextDir, food, score, speed, int, alive;
  let tickAt = 0, particles = [], raf = 0;
  const status = statusBar("");
  const scoreEl = pill("0");
  scoreEl.dataset.testid = "snk-score";
  hud.append(scoreEl);
  const canvas = document.createElement("canvas");
  canvas.className = "mg-canvas";
  canvas.width = canvas.height = N * CELL;
  canvas.dataset.testid = "snk-canvas";
  const ctx = canvas.getContext("2d");
  const pad = document.createElement("div");
  pad.className = "grid grid-cols-3 gap-1.5 w-40";
  for (const [d, label] of [["up", "\u25B2"], ["left", "\u25C0"], ["down", "\u25BC"], ["right", "\u25B6"]]) {
    const b = document.createElement("button");
    b.className = "mg-padbtn mg-glass rounded-lg py-2 font-black text-cyan-300";
    b.dataset.testid = `snk-${d}`;
    b.textContent = label;
    if (d === "up") b.style.gridColumn = "2";
    if (d === "left") b.style.gridColumn = "1";
    b.addEventListener("click", () => setDir(d));
    pad.appendChild(b);
  }
  stage.append(status, canvas, pad, restartBtn(reset));
  const OPP = { up: "down", down: "up", left: "right", right: "left" };
  function setDir(d) {
    if (OPP[d] !== dir) nextDir = d;
  }
  let foodWasFirst = true;
  function spawnFood() {
    if (foodWasFirst) {
      foodWasFirst = false;
      food = { x: snake[0].x + 3, y: snake[0].y };
      return;
    }
    do {
      food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }
  function burst(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.4;
      particles.push({ x: x * CELL + CELL / 2, y: y * CELL + CELL / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
    }
  }
  function tick() {
    prevSnake = snake.map((s) => ({ x: s.x, y: s.y }));
    tickAt = performance.now();
    dir = nextDir;
    const h = { x: snake[0].x + (dir === "right") - (dir === "left"), y: snake[0].y + (dir === "down") - (dir === "up") };
    if (h.x < 0 || h.x >= N || h.y < 0 || h.y >= N || snake.some((s) => s.x === h.x && s.y === h.y)) {
      alive = false;
      clearInterval(int);
      ctx.fillStyle = "rgba(225,29,72,.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      status.textContent = `\u{1F480} Thua! \u0110i\u1EC3m ${score} \u2014 Ch\u01A1i l\u1EA1i?`;
      status.dataset.state = "over";
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score++;
      scoreEl.textContent = `\u0110i\u1EC3m: ${score}`;
      burst(h.x, h.y);
      spawnFood();
      if (speed > 70) {
        clearInterval(int);
        speed -= 8;
        int = setInterval(tick, speed);
      }
    } else snake.pop();
  }
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
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    for (let i = 1; i < N; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(canvas.width, i * CELL);
      ctx.stroke();
    }
    const pulse = 1 + Math.sin(now / 260) * 0.12;
    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
    ctx.save();
    ctx.shadowColor = "#f472b6";
    ctx.shadowBlur = 18;
    const fr = (CELL / 2 - 4) * pulse;
    const fgrad = ctx.createRadialGradient(fx - 3, fy - 3, 2, fx, fy, fr);
    fgrad.addColorStop(0, "#fda4af");
    fgrad.addColorStop(1, "#e11d48");
    ctx.fillStyle = fgrad;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const segs = lerpSegs(t);
    ctx.save();
    ctx.shadowColor = "#00F2FE";
    ctx.shadowBlur = 16;
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.lineWidth = CELL - 7;
    const sgrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    sgrad.addColorStop(0, "#67e8f9");
    sgrad.addColorStop(1, "#0e7490");
    ctx.strokeStyle = sgrad;
    ctx.beginPath();
    segs.forEach((s, i) => {
      const px = s.x * CELL + CELL / 2, py = s.y * CELL + CELL / 2;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
    const hd = segs[0];
    const hx = hd.x * CELL + CELL / 2, hy = hd.y * CELL + CELL / 2;
    ctx.fillStyle = "#a5f3fc";
    ctx.beginPath();
    ctx.arc(hx, hy, (CELL - 4) / 2, 0, Math.PI * 2);
    ctx.fill();
    const ex = dir === "left" ? -4 : dir === "right" ? 4 : 0;
    const ey = dir === "up" ? -4 : dir === "down" ? 4 : 0;
    const px2 = dir === "left" || dir === "right" ? 0 : 6;
    const py2 = dir === "up" || dir === "down" ? 0 : 6;
    ctx.fillStyle = "#0B0E14";
    ctx.beginPath();
    ctx.arc(hx + ex - px2 * 0.7, hy + ey - py2 * 0.7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + ex + px2 * 0.7, hy + ey + py2 * 0.7, 3, 0, Math.PI * 2);
    ctx.fill();
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      ctx.fillStyle = `rgba(244,114,182,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2 * p.life + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function onKey(e) {
    if (KEYMAP[e.key]) {
      e.preventDefault();
      setDir(KEYMAP[e.key]);
    }
  }
  window.addEventListener("keydown", onKey);
  let sx0 = 0, sy0 = 0;
  const onTS = (e) => {
    sx0 = e.touches[0].clientX;
    sy0 = e.touches[0].clientY;
  };
  const onTE = (e) => {
    const dx = e.changedTouches[0].clientX - sx0, dy = e.changedTouches[0].clientY - sy0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    setDir(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
  };
  canvas.addEventListener("touchstart", onTS, { passive: true });
  canvas.addEventListener("touchend", onTE, { passive: true });
  function reset() {
    snake = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
    prevSnake = snake.map((s) => ({ ...s }));
    dir = nextDir = "right";
    score = 0;
    speed = 180;
    foodWasFirst = true;
    alive = true;
    particles = [];
    tickAt = performance.now();
    spawnFood();
    scoreEl.textContent = "\u0110i\u1EC3m: 0";
    status.textContent = "M\u0169i t\xEAn / WASD \u2014 \u0103n m\u1ED3i, n\xE9 t\u01B0\u1EDDng";
    status.dataset.state = "playing";
    clearInterval(int);
    int = setInterval(tick, speed);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  reset();
  return () => {
    clearInterval(int);
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("touchstart", onTS);
    canvas.removeEventListener("touchend", onTE);
  };
}
const IMPL = { g48: game48, mem: gameMem, snk: gameSnk };
export function mountMiniGame(id, stageEl, hudEl) {
  ensureStyles();
  stageEl.innerHTML = "";
  if (hudEl) hudEl.innerHTML = "";
  const impl = IMPL[id];
  return impl ? impl(stageEl, hudEl || stageEl) || null : null;
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibGliL21pbmlnYW1lcy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBzcmMvbGliL21pbmlnYW1lcy5qcyBcdTIwMTQgTWluaSBnYW1lIENIXHUwMUEwSSBNXHUxRUQ4VCBNXHUwMENDTkgsIHZhbmlsbGEgRE9NIG1vdW50LlxuLy8gRW5naW5lICsgdmlzdWFsIFx1MDExMVx1MUVEM25nIGJcdTFFRDkgcWEvZ2FtZS1sYWIuaHRtbCAoZGFyay1uZW9uLCBmbHVpZCBzaXplLCBhbmltYXRpb24pLlxuLy8gS2hcdTAwRjRuZyBcdTAxMTFcdTFFRTVuZyBzZXJ2ZXIsIGtoXHUwMEY0bmcgbW9jayBkYXRhOiBzdGF0ZSBjaFx1MUVDOSBzXHUxRUQxbmcgdHJvbmcgdGFiIGhpXHUxRUM3biB0XHUxRUExaS5cbi8vXG4vLyAgIGltcG9ydCB7IE1JTklfR0FNRVMsIG1vdW50TWluaUdhbWUgfSBmcm9tICcuLi9saWIvbWluaWdhbWVzLmpzJztcbi8vICAgY29uc3QgY2xlYW51cCA9IG1vdW50TWluaUdhbWUoJ2c0OCcsIHN0YWdlRWwsIGh1ZEVsKTsgLy8gXHUyMTkyIGdcdTFFQ0RpIGNsZWFudXAoKSBraGkgdW5tb3VudFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBjb25zdCBNSU5JX0dBTUVTID0gW1xuICB7IGlkOiAnZzQ4JywgaWNvbjogJ1x1RDgzRFx1REQyMicsIHRlbjogJzIwNDgnLCAgICAgICAgbW9UYTogJ1RyXHUwMUIwXHUxRUUzdCBnXHUxRUQ5cCBzXHUxRUQxIFx1MDExMVx1MUVCRm4gMjA0OCcgfSxcbiAgeyBpZDogJ21lbScsIGljb246ICdcdUQ4M0NcdURDQ0YnLCB0ZW46ICdUclx1MDBFRCBOaFx1MUVEQiA0XHUwMEQ3NCcsICBtb1RhOiAnTFx1MUVBRHQgdGhcdTFFQkIgdFx1MDBFQ20gY1x1MUVCN3AgZ2lcdTFFRDFuZyBuaGF1JyB9LFxuICB7IGlkOiAnc25rJywgaWNvbjogJ1x1RDgzRFx1REMwRCcsIHRlbjogJ1JcdTFFQUZuIFNcdTAxMDNuIE1cdTFFRDNpJywgIG1vVGE6ICdcdTAxMDJuIG1cdTFFRDNpLCBuXHUwMEU5IHRcdTAxQjBcdTFFRERuZywgdFx1MDEwM25nIHRcdTFFRDFjJyB9LFxuXTtcblxuLy8gQ1NTIHJpXHUwMEVBbmcgY1x1MUVFN2EgbWluaS1nYW1lIFx1MjAxNCBpbmplY3QgXHUwMTExXHUwMEZBbmcgMSBsXHUxRUE3bi4gS1x1MDBFRGNoIHRoXHUwMUIwXHUxRURCYyBkXHUwMEY5bmcgdm1pbiBcdTIxOTIgdFx1MUVGMSBjbyBnaVx1MDBFM25cbi8vIHRoZW8gY1x1MUVFRGEgc1x1MUVENSwgdlx1MDBFMCAubWctcGFuZWw6ZnVsbHNjcmVlbiAoZ2FtZXMuanN4KSBjaG8gcGhcdTAwRTlwIGNoXHUwMUExaSBmdWxsIG1cdTAwRTBuIGhcdTAwRUNuaC5cbmNvbnN0IFNUWUxFX0lEID0gJ21pbmlnYW1lcy1jc3MnO1xuZnVuY3Rpb24gZW5zdXJlU3R5bGVzKCkge1xuICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoU1RZTEVfSUQpKSByZXR1cm47XG4gIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzLmlkID0gU1RZTEVfSUQ7XG4gIHMudGV4dENvbnRlbnQgPSBgXG4gIC5tZy1nbGFzcyB7IGJhY2tncm91bmQ6IHJnYmEoMTgsMjIsMzIsLjg1KTsgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsMjU1LDI1NSwuMDgpOyB9XG4gIC5tZy1zdGF0dXMgeyBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCByZ2JhKDAsMjQyLDI1NCwuMTApLCByZ2JhKDE2OCw4NSwyNDcsLjEwKSk7IGJvcmRlcjoxcHggc29saWQgcmdiYSgwLDI0MiwyNTQsLjIyKTsgfVxuICAubWctYnRuLWFjYyB7IGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcsIzAwRjJGRSwjMjJkM2VlKTsgY29sb3I6IzAwMTgxYzsgZm9udC13ZWlnaHQ6ODAwOyBib3gtc2hhZG93OjAgNHB4IDE4cHggcmdiYSgwLDI0MiwyNTQsLjI1KTsgfVxuICAubWctYnRuLWFjYzpob3ZlciB7IGZpbHRlcjogYnJpZ2h0bmVzcygxLjEpOyB9XG4gIC5tZy1idG4tYWNjOmFjdGl2ZSB7IHRyYW5zZm9ybTogc2NhbGUoLjk2KTsgfVxuICAubWctcGFkYnRuIHsgdHJhbnNpdGlvbjogYWxsIC4xMnM7IH1cbiAgLm1nLXBhZGJ0bjpob3ZlciB7IGJhY2tncm91bmQ6IHJnYmEoMCwyNDIsMjU0LC4xNSk7IGNvbG9yOiMwMEYyRkU7IGJveC1zaGFkb3c6MCAwIDEycHggcmdiYSgwLDI0MiwyNTQsLjI1KTsgfVxuICAubWctcGFkYnRuOmFjdGl2ZSB7IHRyYW5zZm9ybTogc2NhbGUoLjkyKTsgfVxuXG4gIC8qIDIwNDggXHUyMDE0IGdyaWQgdnVcdTAwRjRuZyBjbyBnaVx1MDBFM24sIHRpbGUgZ3JhZGllbnQgdGhlbyBiXHUxRUFEYyAqL1xuICAuZzQ4LWJvYXJkIHsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDE2MGRlZywjMWMyNDM2LCMxMjE2MjApOyBib3JkZXI6MXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjEpO1xuICAgIGJveC1zaGFkb3c6IDAgMTZweCA0MHB4IHJnYmEoMCwwLDAsLjUpLCBpbnNldCAwIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA4KTtcbiAgICB3aWR0aDogbWluKDg2dncsIDQ2dmgsIDM4MHB4KTsgZGlzcGxheTpncmlkOyBnYXA6OHB4OyBwYWRkaW5nOjEwcHg7IGJvcmRlci1yYWRpdXM6MTZweDtcbiAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCg0LCAxZnIpOyB0b3VjaC1hY3Rpb246bm9uZTsgfVxuICAubWctcGFuZWw6ZnVsbHNjcmVlbiAuZzQ4LWJvYXJkIHsgd2lkdGg6IG1pbig4MHZ3LCA2MnZoKTsgfVxuICAudDIwNDggeyB3aWR0aDoxMDAlOyBhc3BlY3QtcmF0aW86MTsgYm9yZGVyLXJhZGl1czoxMnB4OyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1jb250ZW50OmNlbnRlcjtcbiAgICBmb250LXdlaWdodDo5MDA7IGZvbnQtc2l6ZTpjbGFtcCgxNnB4LCA0LjZ2bWluLCAyNHB4KTsgYmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LC4wNDUpO1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpOyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIC4xNXM7IH1cbiAgLnQyMDQ4LnYye2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE0NWRlZywjM2I0YTYzLCMyZTNhNGYpO2NvbG9yOiNjYmQ1ZTF9XG4gIC50MjA0OC52NHtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNDVkZWcsIzRhNWE3OCwjM2I0YTYzKTtjb2xvcjojZTJlOGYwfVxuICAudDIwNDgudjh7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTQ1ZGVnLCMwZTc0OTAsIzE1NWU3NSk7Y29sb3I6I2NmZmFmZX1cbiAgLnQyMDQ4LnYxNntiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNDVkZWcsIzA4OTFiMiwjMGU3NDkwKTtjb2xvcjojZWNmZWZmfVxuICAudDIwNDgudjMye2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE0NWRlZywjMDZiNmQ0LCMwODkxYjIpO2NvbG9yOiMwMDEzMTh9XG4gIC50MjA0OC52NjR7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTQ1ZGVnLCMyMmQzZWUsIzA2YjZkNCk7Y29sb3I6IzAwMTMxODtib3gtc2hhZG93OjAgMCAxNHB4IHJnYmEoMzQsMjExLDIzOCwuNCl9XG4gIC50MjA0OC52MTI4e2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE0NWRlZywjYTc4YmZhLCM4YjVjZjYpO2NvbG9yOiNmZmY7Zm9udC1zaXplOmNsYW1wKDE0cHgsNHZtaW4sMjBweCk7Ym94LXNoYWRvdzowIDAgMTRweCByZ2JhKDEzOSw5MiwyNDYsLjQpfVxuICAudDIwNDgudjI1NntiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNDVkZWcsI2Y0NzJiNiwjZWM0ODk5KTtjb2xvcjojZmZmO2ZvbnQtc2l6ZTpjbGFtcCgxNHB4LDR2bWluLDIwcHgpO2JveC1zaGFkb3c6MCAwIDE0cHggcmdiYSgyMzYsNzIsMTUzLC40KX1cbiAgLnQyMDQ4LnY1MTJ7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoMTQ1ZGVnLCNmYjkyM2MsI2Y5NzMxNik7Y29sb3I6I2ZmZjtmb250LXNpemU6Y2xhbXAoMTRweCw0dm1pbiwyMHB4KTtib3gtc2hhZG93OjAgMCAxNnB4IHJnYmEoMjQ5LDExNSwyMiwuNSl9XG4gIC50MjA0OC52MTAyNHtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNDVkZWcsI2Y4NzE3MSwjZWY0NDQ0KTtjb2xvcjojZmZmO2ZvbnQtc2l6ZTpjbGFtcCgxMXB4LDMuMnZtaW4sMTZweCk7Ym94LXNoYWRvdzowIDAgMThweCByZ2JhKDIzOSw2OCw2OCwuNSl9XG4gIC50MjA0OC52MjA0OHtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNDVkZWcsI2ZkZTA0NywjZmFjYzE1KTtjb2xvcjojM2YzMDAwO2ZvbnQtc2l6ZTpjbGFtcCgxMXB4LDMuMnZtaW4sMTZweCk7Ym94LXNoYWRvdzowIDAgMjhweCByZ2JhKDI1MCwyMDQsMjEsLjc1KX1cbiAgQGtleWZyYW1lcyBtZy1wb3AgeyAwJXt0cmFuc2Zvcm06c2NhbGUoLjMpfSA3MCV7dHJhbnNmb3JtOnNjYWxlKDEuMTIpfSAxMDAle3RyYW5zZm9ybTpzY2FsZSgxKX0gfVxuICBAa2V5ZnJhbWVzIG1nLW1lcmdlIHsgMCV7dHJhbnNmb3JtOnNjYWxlKDEpfSA0NSV7dHJhbnNmb3JtOnNjYWxlKDEuMTgpOyBmaWx0ZXI6YnJpZ2h0bmVzcygxLjM1KX0gMTAwJXt0cmFuc2Zvcm06c2NhbGUoMSl9IH1cbiAgLnQyMDQ4LnBvcCB7IGFuaW1hdGlvbjogbWctcG9wIC4xOHMgY3ViaWMtYmV6aWVyKC4zLDEuMywuNSwxKTsgfVxuICAudDIwNDgubWVyZ2UgeyBhbmltYXRpb246IG1nLW1lcmdlIC4ycyBlYXNlOyB9XG5cbiAgLyogTWVtb3J5IFx1MjAxNCB0aFx1MUVCQiAzRCBjbyBnaVx1MDBFM24gKi9cbiAgLm1lbS1ncmlkIHsgZGlzcGxheTpncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDQsMWZyKTsgZ2FwOjEwcHg7IHdpZHRoOm1pbig4NnZ3LCA0OHZoLCA0MDBweCk7IH1cbiAgLm1nLXBhbmVsOmZ1bGxzY3JlZW4gLm1lbS1ncmlkIHsgd2lkdGg6bWluKDc0dncsIDY2dmgpOyB9XG4gIC5tZW0tY2FyZCB7IHdpZHRoOjEwMCU7IGFzcGVjdC1yYXRpbzoxOyBwZXJzcGVjdGl2ZTo3MDBweDsgY3Vyc29yOnBvaW50ZXI7IH1cbiAgLm1lbS1pbm5lciB7IHBvc2l0aW9uOnJlbGF0aXZlOyB3aWR0aDoxMDAlOyBoZWlnaHQ6MTAwJTsgdHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjRzIGN1YmljLWJlemllciguMzUsLjksLjQsMS4xKTsgdHJhbnNmb3JtLXN0eWxlOnByZXNlcnZlLTNkOyB9XG4gIC5tZW0tY2FyZC5vcGVuIC5tZW0taW5uZXIsIC5tZW0tY2FyZC5kb25lIC5tZW0taW5uZXIgeyB0cmFuc2Zvcm06cm90YXRlWSgxODBkZWcpOyB9XG4gIC5tZW0tY2FyZDpub3QoLm9wZW4pOm5vdCguZG9uZSk6aG92ZXIgLm1lbS1pbm5lciB7IHRyYW5zZm9ybTpyb3RhdGVZKC0xNGRlZyk7IH1cbiAgLm1lbS1mYWNlIHsgcG9zaXRpb246YWJzb2x1dGU7IGluc2V0OjA7IGJvcmRlci1yYWRpdXM6MTRweDsgZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7XG4gICAgZm9udC1zaXplOmNsYW1wKDI0cHgsIDd2bWluLCAzNnB4KTsgYmFja2ZhY2UtdmlzaWJpbGl0eTpoaWRkZW47IH1cbiAgLm1lbS1mcm9udCB7IGJhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDE0NWRlZywjMTY0ZTYzLCMwYzEyMjAgNzAlKTsgYm9yZGVyOjFweCBzb2xpZCByZ2JhKDAsMjQyLDI1NCwuMyk7IGNvbG9yOnJnYmEoMCwyNDIsMjU0LC41KTtcbiAgICBib3gtc2hhZG93Omluc2V0IDAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMSksIDAgNnB4IDE2cHggcmdiYSgwLDAsMCwuMzUpOyB9XG4gIC5tZW0tZnJvbnQ6OmFmdGVyIHsgY29udGVudDonJzsgcG9zaXRpb246YWJzb2x1dGU7IGluc2V0OjclOyBib3JkZXItcmFkaXVzOjlweDsgYm9yZGVyOjFweCBkYXNoZWQgcmdiYSgwLDI0MiwyNTQsLjIyKTsgfVxuICAubWVtLWJhY2sgeyB0cmFuc2Zvcm06cm90YXRlWSgxODBkZWcpOyBiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCgxNDVkZWcsIzFlMjkzYiwjMTUxYjJlKTsgYm9yZGVyOjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4xNCk7XG4gICAgYm94LXNoYWRvdzowIDZweCAxNnB4IHJnYmEoMCwwLDAsLjM1KTsgfVxuICAubWVtLWNhcmQuZG9uZSAubWVtLWJhY2sgeyBib3JkZXItY29sb3I6IzIyZDNlZTsgYm94LXNoYWRvdzowIDAgMThweCByZ2JhKDM0LDIxMSwyMzgsLjQ1KSwgMCA2cHggMTZweCByZ2JhKDAsMCwwLC4zNSk7IGFuaW1hdGlvbjptZy1tZW13aW4gLjVzIGN1YmljLWJlemllciguMywxLjUsLjUsMSk7IH1cbiAgQGtleWZyYW1lcyBtZy1tZW13aW4geyAwJXt0cmFuc2Zvcm06cm90YXRlWSgxODBkZWcpIHNjYWxlKDEpfSA1MCV7dHJhbnNmb3JtOnJvdGF0ZVkoMTgwZGVnKSBzY2FsZSgxLjEyKX0gMTAwJXt0cmFuc2Zvcm06cm90YXRlWSgxODBkZWcpIHNjYWxlKDEpfSB9XG5cbiAgLyogU25ha2UgXHUyMDE0IGNhbnZhcyBuZW9uLCBoaVx1MUVDM24gdGhcdTFFQ0IgY28gZ2lcdTAwRTNuIChpbnRlcm5hbCByZXMgY1x1MUVEMSBcdTAxMTFcdTFFQ0JuaCA2MDBweCkgKi9cbiAgLm1nLWNhbnZhcyB7IGJhY2tncm91bmQ6cmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCA1MCUgNDAlLCAjMTAxYTJlLCAjMEIwRTE0IDgwJSk7IGJvcmRlci1yYWRpdXM6MTZweDtcbiAgICBib3JkZXI6MXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjA5KTsgYm94LXNoYWRvdzowIDE2cHggNDBweCByZ2JhKDAsMCwwLC41KSwgaW5zZXQgMCAwIDQwcHggcmdiYSgwLDAsMCwuNCk7XG4gICAgd2lkdGg6bWluKDg2dncsIDUwdmgsIDQ0MHB4KTsgaGVpZ2h0OmF1dG87IHRvdWNoLWFjdGlvbjpub25lOyB9XG4gIC5tZy1wYW5lbDpmdWxsc2NyZWVuIC5tZy1jYW52YXMgeyB3aWR0aDptaW4oODR2dywgNjZ2aCk7IH1cbiAgYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKTtcbn1cblxuZnVuY3Rpb24gc3RhdHVzQmFyKHRleHQpIHtcbiAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkLmNsYXNzTmFtZSA9ICdtZy1zdGF0dXMgcm91bmRlZC14bCBweC00IHB5LTIgdGV4dC1zbSBmb250LWV4dHJhYm9sZCB0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTEwMCBtYXgtdy1mdWxsJztcbiAgZC5kYXRhc2V0LnRlc3RpZCA9ICdnYW1lLXN0YXR1cyc7XG4gIGQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZDtcbn1cbmZ1bmN0aW9uIHJlc3RhcnRCdG4oZm4pIHtcbiAgY29uc3QgYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBiLmNsYXNzTmFtZSA9ICdtZy1idG4tYWNjIHB4LTQgcHktMiByb3VuZGVkLXhsIHRleHQteHMnO1xuICBiLmRhdGFzZXQudGVzdGlkID0gJ2J0bi1yZXN0YXJ0JztcbiAgYi50ZXh0Q29udGVudCA9ICdcdTIxQkIgQ2hcdTAxQTFpIGxcdTFFQTFpJztcbiAgYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZuKTtcbiAgcmV0dXJuIGI7XG59XG5mdW5jdGlvbiBwaWxsKHRleHQpIHtcbiAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgcy5jbGFzc05hbWUgPSAnbWctZ2xhc3MgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMXB4XSBmb250LWV4dHJhYm9sZCc7XG4gIHMudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gcztcbn1cbmNvbnN0IEtFWU1BUCA9IHsgQXJyb3dVcDogJ3VwJywgQXJyb3dEb3duOiAnZG93bicsIEFycm93TGVmdDogJ2xlZnQnLCBBcnJvd1JpZ2h0OiAncmlnaHQnLCB3OiAndXAnLCBzOiAnZG93bicsIGE6ICdsZWZ0JywgZDogJ3JpZ2h0JyB9O1xuXG4vKiBcdTI1MDBcdTI1MDAgMjA0OCBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIGdhbWU0OChzdGFnZSwgaHVkKSB7XG4gIGNvbnN0IE4gPSA0O1xuICBsZXQgZywgc2NvcmUsIG92ZXIsIHdvbiwgbmV3SWR4LCBtZXJnZWRTZXQ7XG5cbiAgY29uc3Qgc3RhdHVzID0gc3RhdHVzQmFyKCcnKTtcbiAgY29uc3Qgc2NvcmVFbCA9IHBpbGwoJzAnKTtcbiAgc2NvcmVFbC5kYXRhc2V0LnRlc3RpZCA9ICdnNDgtc2NvcmUnO1xuICBodWQuYXBwZW5kKHNjb3JlRWwpO1xuICBjb25zdCBncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGdyaWQuY2xhc3NOYW1lID0gJ2c0OC1ib2FyZCc7XG4gIGNvbnN0IHRpbGVzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgTiAqIE47IGkrKykge1xuICAgIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0LmNsYXNzTmFtZSA9ICd0MjA0OCc7XG4gICAgdC5kYXRhc2V0LnRlc3RpZCA9IGBnNDgtJHtpfWA7XG4gICAgZ3JpZC5hcHBlbmRDaGlsZCh0KTtcbiAgICB0aWxlcy5wdXNoKHQpO1xuICB9XG4gIGNvbnN0IHBhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwYWQuY2xhc3NOYW1lID0gJ2dyaWQgZ3JpZC1jb2xzLTMgZ2FwLTEuNSB3LTQwJztcbiAgZm9yIChjb25zdCBbZGlyLCBsYWJlbF0gb2YgW1sndXAnLCAnXHUyNUIyJ10sIFsnbGVmdCcsICdcdTI1QzAnXSwgWydkb3duJywgJ1x1MjVCQyddLCBbJ3JpZ2h0JywgJ1x1MjVCNiddXSkge1xuICAgIGNvbnN0IGIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBiLmNsYXNzTmFtZSA9ICdtZy1wYWRidG4gbWctZ2xhc3Mgcm91bmRlZC1sZyBweS0yIGZvbnQtYmxhY2sgdGV4dC1jeWFuLTMwMCc7XG4gICAgYi5kYXRhc2V0LnRlc3RpZCA9IGBnNDgtJHtkaXJ9YDtcbiAgICBiLnRleHRDb250ZW50ID0gbGFiZWw7XG4gICAgaWYgKGRpciA9PT0gJ3VwJykgYi5zdHlsZS5ncmlkQ29sdW1uID0gJzInO1xuICAgIGlmIChkaXIgPT09ICdsZWZ0JykgYi5zdHlsZS5ncmlkQ29sdW1uID0gJzEnO1xuICAgIGIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBtb3ZlKGRpcikpO1xuICAgIHBhZC5hcHBlbmRDaGlsZChiKTtcbiAgfVxuICBzdGFnZS5hcHBlbmQoc3RhdHVzLCBncmlkLCBwYWQsIHJlc3RhcnRCdG4ocmVzZXQpKTtcblxuICBjb25zdCBzcGF3biA9ICgpID0+IHtcbiAgICBjb25zdCBlbXB0eSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTiAqIE47IGkrKykgaWYgKCFnW2ldKSBlbXB0eS5wdXNoKGkpO1xuICAgIGlmICghZW1wdHkubGVuZ3RoKSByZXR1cm4gLTE7XG4gICAgY29uc3QgaSA9IGVtcHR5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVtcHR5Lmxlbmd0aCldO1xuICAgIGdbaV0gPSBNYXRoLnJhbmRvbSgpIDwgMC45ID8gMiA6IDQ7XG4gICAgcmV0dXJuIGk7XG4gIH07XG4gIC8vIHRyXHUxRUEzIHZcdTFFQzEgeyBhcnIsIG1lcmdlZCB9IFx1MjAxNCBtZXJnZWQgPSBpbmRleCB0cm9uZyBhcnIgXHUwMTExXHUwMEUzIGdcdTFFRDlwIChcdTAxMTFcdTFFQzMgZ1x1MUVBRm4gaGlcdTFFQzd1IFx1MUVFOW5nKVxuICBmdW5jdGlvbiBzbGlkZShyb3cpIHtcbiAgICBjb25zdCBhcnIgPSByb3cuZmlsdGVyKHYgPT4gdik7XG4gICAgY29uc3QgbWVyZ2VkID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoIC0gMTsgaSsrKVxuICAgICAgaWYgKGFycltpXSA9PT0gYXJyW2kgKyAxXSkgeyBhcnJbaV0gKj0gMjsgc2NvcmUgKz0gYXJyW2ldOyBpZiAoYXJyW2ldID09PSAyMDQ4KSB3b24gPSB0cnVlOyBtZXJnZWQucHVzaChpKTsgYXJyLnNwbGljZShpICsgMSwgMSk7IH1cbiAgICB3aGlsZSAoYXJyLmxlbmd0aCA8IE4pIGFyci5wdXNoKDApO1xuICAgIHJldHVybiB7IGFyciwgbWVyZ2VkIH07XG4gIH1cbiAgZnVuY3Rpb24gbW92ZShkaXIpIHtcbiAgICBpZiAob3ZlcikgcmV0dXJuO1xuICAgIGNvbnN0IGJlZm9yZSA9IGcuam9pbignLCcpO1xuICAgIG5ld0lkeCA9IC0xOyBtZXJnZWRTZXQgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgZ2V0ID0gKHIsIGMpID0+IGdbciAqIE4gKyBjXTtcbiAgICBjb25zdCBzZXQgPSAociwgYywgdikgPT4gZ1tyICogTiArIGNdID0gdjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE47IGkrKykge1xuICAgICAgY29uc3QgbGluZSA9IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBOOyBqKyspIGxpbmUucHVzaChkaXIgPT09ICd1cCcgfHwgZGlyID09PSAnZG93bicgPyBnZXQoaiwgaSkgOiBnZXQoaSwgaikpO1xuICAgICAgaWYgKGRpciA9PT0gJ2Rvd24nIHx8IGRpciA9PT0gJ3JpZ2h0JykgbGluZS5yZXZlcnNlKCk7XG4gICAgICBjb25zdCB7IGFycjogb3V0LCBtZXJnZWQgfSA9IHNsaWRlKGxpbmUpO1xuICAgICAgaWYgKGRpciA9PT0gJ2Rvd24nIHx8IGRpciA9PT0gJ3JpZ2h0Jykgb3V0LnJldmVyc2UoKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgTjsgaisrKSB7XG4gICAgICAgIGNvbnN0IHIgPSBkaXIgPT09ICd1cCcgfHwgZGlyID09PSAnZG93bicgPyBqIDogaTtcbiAgICAgICAgY29uc3QgYyA9IGRpciA9PT0gJ3VwJyB8fCBkaXIgPT09ICdkb3duJyA/IGkgOiBqO1xuICAgICAgICBzZXQociwgYywgb3V0W2pdKTtcbiAgICAgICAgY29uc3Qgd2FzTWVyZ2VkID0gZGlyID09PSAnZG93bicgfHwgZGlyID09PSAncmlnaHQnID8gbWVyZ2VkLmluY2x1ZGVzKE4gLSAxIC0gaikgOiBtZXJnZWQuaW5jbHVkZXMoaik7XG4gICAgICAgIGlmICh3YXNNZXJnZWQpIG1lcmdlZFNldC5hZGQociAqIE4gKyBjKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGcuam9pbignLCcpICE9PSBiZWZvcmUpIG5ld0lkeCA9IHNwYXduKCk7XG4gICAgaWYgKCFjYW5Nb3ZlKCkpIG92ZXIgPSB0cnVlO1xuICAgIHJlbmRlcigpO1xuICB9XG4gIGZ1bmN0aW9uIGNhbk1vdmUoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOICogTjsgaSsrKSB7XG4gICAgICBpZiAoIWdbaV0pIHJldHVybiB0cnVlO1xuICAgICAgY29uc3QgciA9IE1hdGguZmxvb3IoaSAvIE4pLCBjID0gaSAlIE47XG4gICAgICBpZiAoYyA8IE4gLSAxICYmIGdbaV0gPT09IGdbaSArIDFdKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmIChyIDwgTiAtIDEgJiYgZ1tpXSA9PT0gZ1tpICsgTl0pIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHRpbGVzLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICAgIGNvbnN0IHYgPSBnW2ldO1xuICAgICAgdC50ZXh0Q29udGVudCA9IHYgfHwgJyc7XG4gICAgICB0LmNsYXNzTmFtZSA9ICd0MjA0OCcgKyAodiA/IGAgdiR7TWF0aC5taW4odiwgMjA0OCl9YCA6ICcnKTtcbiAgICAgIGlmIChpID09PSBuZXdJZHgpIHQuY2xhc3NMaXN0LmFkZCgncG9wJyk7XG4gICAgICBlbHNlIGlmIChtZXJnZWRTZXQgJiYgbWVyZ2VkU2V0LmhhcyhpKSkgdC5jbGFzc0xpc3QuYWRkKCdtZXJnZScpO1xuICAgIH0pO1xuICAgIHNjb3JlRWwudGV4dENvbnRlbnQgPSBgXHUwMTEwaVx1MUVDM206ICR7c2NvcmV9YDtcbiAgICBzdGF0dXMudGV4dENvbnRlbnQgPSB3b24gPyAnXHVEODNDXHVERkM2IDIwNDghIFR1eVx1MUVDN3Qgdlx1MUVERGkgXHUyMDE0IGNoXHUwMUExaSB0aVx1MUVCRnAgXHUwMTExXHUwMUIwXHUxRUUzYyBuXHUxRUVGYScgOiBvdmVyID8gJ1x1RDgzRFx1REM4MCBIXHUxRUJGdCBuXHUwMUIwXHUxRURCYyBcdTIwMTQgQ2hcdTAxQTFpIGxcdTFFQTFpPycgOiAnTVx1MDE2OWkgdFx1MDBFQW4gLyBXQVNEIFx1MDExMVx1MUVDMyB0clx1MDFCMFx1MUVFM3QnO1xuICAgIHN0YXR1cy5kYXRhc2V0LnN0YXRlID0gd29uID8gJ3dvbicgOiBvdmVyID8gJ292ZXInIDogJ3BsYXlpbmcnO1xuICB9XG4gIGZ1bmN0aW9uIG9uS2V5KGUpIHtcbiAgICBpZiAoS0VZTUFQW2Uua2V5XSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IG1vdmUoS0VZTUFQW2Uua2V5XSk7IH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5KTtcbiAgLy8gc3dpcGUgdHJcdTAwRUFuIG1vYmlsZVxuICBsZXQgdHgwID0gMCwgdHkwID0gMDtcbiAgY29uc3Qgb25UUyA9IGUgPT4geyB0eDAgPSBlLnRvdWNoZXNbMF0uY2xpZW50WDsgdHkwID0gZS50b3VjaGVzWzBdLmNsaWVudFk7IH07XG4gIGNvbnN0IG9uVEUgPSBlID0+IHtcbiAgICBjb25zdCBkeCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WCAtIHR4MCwgZHkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFkgLSB0eTA7XG4gICAgaWYgKE1hdGgubWF4KE1hdGguYWJzKGR4KSwgTWF0aC5hYnMoZHkpKSA8IDI0KSByZXR1cm47XG4gICAgbW92ZShNYXRoLmFicyhkeCkgPiBNYXRoLmFicyhkeSkgPyAoZHggPiAwID8gJ3JpZ2h0JyA6ICdsZWZ0JykgOiAoZHkgPiAwID8gJ2Rvd24nIDogJ3VwJykpO1xuICB9O1xuICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRTLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRFLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gIGZ1bmN0aW9uIHJlc2V0KCkgeyBnID0gQXJyYXkoTiAqIE4pLmZpbGwoMCk7IHNjb3JlID0gMDsgb3ZlciA9IGZhbHNlOyB3b24gPSBmYWxzZTsgbmV3SWR4ID0gLTE7IG1lcmdlZFNldCA9IG5ldyBTZXQoKTsgc3Bhd24oKTsgc3Bhd24oKTsgcmVuZGVyKCk7IH1cbiAgcmVzZXQoKTtcbiAgcmV0dXJuICgpID0+IHsgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleSk7IGdyaWQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVFMpOyBncmlkLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25URSk7IH07XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBUclx1MDBFRCBOaFx1MUVEQiA0XHUwMEQ3NCBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIGdhbWVNZW0oc3RhZ2UsIGh1ZCkge1xuICBjb25zdCBJQ09OUyA9IFsnXHVEODNDXHVERkFFJywgJ1x1RDgzRFx1REU4MCcsICdcdUQ4M0NcdURGMDgnLCAnXHVEODNDXHVERkI1JywgJ1x1MjZCRCcsICdcdUQ4M0NcdURGNDAnLCAnXHVEODNEXHVERDI1JywgJ1x1RDgzRFx1REM4RSddO1xuICBsZXQgZGVjaywgb3BlbiwgbWF0Y2hlZCwgbW92ZXMsIHQwLCB0aW1lckludDtcblxuICBjb25zdCBzdGF0dXMgPSBzdGF0dXNCYXIoJycpO1xuICBjb25zdCB0aW1lckVsID0gcGlsbCgnXHUyM0YxIDBzJyk7XG4gIHRpbWVyRWwuZGF0YXNldC50ZXN0aWQgPSAnbWVtLXRpbWVyJztcbiAgY29uc3QgbW92ZXNFbCA9IHBpbGwoJzAgbFx1MDFCMFx1MUVFM3QnKTtcbiAgbW92ZXNFbC5kYXRhc2V0LnRlc3RpZCA9ICdtZW0tbW92ZXMnO1xuICBodWQuYXBwZW5kKHRpbWVyRWwsIG1vdmVzRWwpO1xuXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZ3JpZC5jbGFzc05hbWUgPSAnbWVtLWdyaWQnO1xuICBjb25zdCBjYXJkcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY2FyZC5jbGFzc05hbWUgPSAnbWVtLWNhcmQnO1xuICAgIGNhcmQuZGF0YXNldC50ZXN0aWQgPSBgbWVtLSR7aX1gO1xuICAgIGNvbnN0IGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IGlubmVyLmNsYXNzTmFtZSA9ICdtZW0taW5uZXInO1xuICAgIGNvbnN0IGZyb250ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IGZyb250LmNsYXNzTmFtZSA9ICdtZW0tZmFjZSBtZW0tZnJvbnQnOyBmcm9udC50ZXh0Q29udGVudCA9ICdcdTI3MjYnO1xuICAgIGNvbnN0IGJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsgYmFjay5jbGFzc05hbWUgPSAnbWVtLWZhY2UgbWVtLWJhY2snO1xuICAgIGlubmVyLmFwcGVuZChmcm9udCwgYmFjayk7IGNhcmQuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBmbGlwKGkpKTtcbiAgICBncmlkLmFwcGVuZENoaWxkKGNhcmQpO1xuICAgIGNhcmRzLnB1c2goY2FyZCk7XG4gIH1cbiAgc3RhZ2UuYXBwZW5kKHN0YXR1cywgZ3JpZCwgcmVzdGFydEJ0bihyZXNldCkpO1xuXG4gIGZ1bmN0aW9uIGZsaXAoaSkge1xuICAgIGlmIChvcGVuLmxlbmd0aCA9PT0gMiB8fCBvcGVuLmluY2x1ZGVzKGkpIHx8IG1hdGNoZWQuaGFzKGkpKSByZXR1cm47XG4gICAgb3Blbi5wdXNoKGkpO1xuICAgIGNhcmRzW2ldLmNsYXNzTGlzdC5hZGQoJ29wZW4nKTtcbiAgICBpZiAob3Blbi5sZW5ndGggPT09IDIpIHtcbiAgICAgIG1vdmVzKys7XG4gICAgICBtb3Zlc0VsLnRleHRDb250ZW50ID0gYCR7bW92ZXN9IGxcdTAxQjBcdTFFRTN0YDtcbiAgICAgIGNvbnN0IFthLCBiXSA9IG9wZW47XG4gICAgICBpZiAoZGVja1thXSA9PT0gZGVja1tiXSkge1xuICAgICAgICBtYXRjaGVkLmFkZChhKTsgbWF0Y2hlZC5hZGQoYik7IG9wZW4gPSBbXTtcbiAgICAgICAgY2FyZHNbYV0uY2xhc3NMaXN0LmFkZCgnZG9uZScpOyBjYXJkc1tiXS5jbGFzc0xpc3QuYWRkKCdkb25lJyk7XG4gICAgICAgIGlmIChtYXRjaGVkLnNpemUgPT09IDE2KSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lckludCk7XG4gICAgICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gYFx1RDgzQ1x1REZDNiBYb25nISAke21vdmVzfSBsXHUwMUIwXHUxRUUzdCBcdTIwMTQgJHtNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gdDApIC8gMTAwMCl9c2A7XG4gICAgICAgICAgc3RhdHVzLmRhdGFzZXQuc3RhdGUgPSAnd29uJztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IGNhcmRzW2FdLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTsgY2FyZHNbYl0uY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpOyBvcGVuID0gW107IH0sIDY1MCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGRlY2sgPSBbLi4uSUNPTlMsIC4uLklDT05TXS5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xuICAgIG9wZW4gPSBbXTsgbWF0Y2hlZCA9IG5ldyBTZXQoKTsgbW92ZXMgPSAwOyB0MCA9IERhdGUubm93KCk7XG4gICAgY2xlYXJJbnRlcnZhbCh0aW1lckludCk7XG4gICAgdGltZXJJbnQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7IHRpbWVyRWwudGV4dENvbnRlbnQgPSBgXHUyM0YxICR7TWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHQwKSAvIDEwMDApfXNgOyB9LCAxMDAwKTtcbiAgICBtb3Zlc0VsLnRleHRDb250ZW50ID0gJzAgbFx1MDFCMFx1MUVFM3QnO1xuICAgIHN0YXR1cy50ZXh0Q29udGVudCA9ICdUXHUwMEVDbSA4IGNcdTFFQjdwIGdpXHUxRUQxbmcgbmhhdSc7XG4gICAgc3RhdHVzLmRhdGFzZXQuc3RhdGUgPSAncGxheWluZyc7XG4gICAgY2FyZHMuZm9yRWFjaCgoYywgaSkgPT4geyBjLmNsYXNzTmFtZSA9ICdtZW0tY2FyZCc7IGMubGFzdENoaWxkLmxhc3RDaGlsZC50ZXh0Q29udGVudCA9IGRlY2tbaV07IH0pO1xuICB9XG4gIHJlc2V0KCk7XG4gIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVySW50KTtcbn1cblxuLyogXHUyNTAwXHUyNTAwIFJcdTFFQUZuIFNcdTAxMDNuIE1cdTFFRDNpIFx1MjAxNCBjYW52YXMgbmVvbiwgY2h1eVx1MUVDM24gXHUwMTExXHUxRUQ5bmcgbVx1MDFCMFx1MUVFM3QgKG5cdTFFRDlpIHN1eSBnaVx1MUVFRmEgMiB0aWNrKSBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIGdhbWVTbmsoc3RhZ2UsIGh1ZCkge1xuICBjb25zdCBOID0gMjAsIENFTEwgPSAzMDsgLy8gaW50ZXJuYWwgcmVzIDYwMHB4IFx1MjAxNCBDU1Mgc2NhbGUgdGhlbyBjXHUxRUVEYSBzXHUxRUQ1XG4gIGxldCBzbmFrZSwgcHJldlNuYWtlLCBkaXIsIG5leHREaXIsIGZvb2QsIHNjb3JlLCBzcGVlZCwgaW50LCBhbGl2ZTtcbiAgbGV0IHRpY2tBdCA9IDAsIHBhcnRpY2xlcyA9IFtdLCByYWYgPSAwO1xuXG4gIGNvbnN0IHN0YXR1cyA9IHN0YXR1c0JhcignJyk7XG4gIGNvbnN0IHNjb3JlRWwgPSBwaWxsKCcwJyk7XG4gIHNjb3JlRWwuZGF0YXNldC50ZXN0aWQgPSAnc25rLXNjb3JlJztcbiAgaHVkLmFwcGVuZChzY29yZUVsKTtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy5jbGFzc05hbWUgPSAnbWctY2FudmFzJztcbiAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IE4gKiBDRUxMO1xuICBjYW52YXMuZGF0YXNldC50ZXN0aWQgPSAnc25rLWNhbnZhcyc7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIGNvbnN0IHBhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwYWQuY2xhc3NOYW1lID0gJ2dyaWQgZ3JpZC1jb2xzLTMgZ2FwLTEuNSB3LTQwJztcbiAgZm9yIChjb25zdCBbZCwgbGFiZWxdIG9mIFtbJ3VwJywgJ1x1MjVCMiddLCBbJ2xlZnQnLCAnXHUyNUMwJ10sIFsnZG93bicsICdcdTI1QkMnXSwgWydyaWdodCcsICdcdTI1QjYnXV0pIHtcbiAgICBjb25zdCBiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYi5jbGFzc05hbWUgPSAnbWctcGFkYnRuIG1nLWdsYXNzIHJvdW5kZWQtbGcgcHktMiBmb250LWJsYWNrIHRleHQtY3lhbi0zMDAnO1xuICAgIGIuZGF0YXNldC50ZXN0aWQgPSBgc25rLSR7ZH1gO1xuICAgIGIudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBpZiAoZCA9PT0gJ3VwJykgYi5zdHlsZS5ncmlkQ29sdW1uID0gJzInO1xuICAgIGlmIChkID09PSAnbGVmdCcpIGIuc3R5bGUuZ3JpZENvbHVtbiA9ICcxJztcbiAgICBiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gc2V0RGlyKGQpKTtcbiAgICBwYWQuYXBwZW5kQ2hpbGQoYik7XG4gIH1cbiAgc3RhZ2UuYXBwZW5kKHN0YXR1cywgY2FudmFzLCBwYWQsIHJlc3RhcnRCdG4ocmVzZXQpKTtcblxuICBjb25zdCBPUFAgPSB7IHVwOiAnZG93bicsIGRvd246ICd1cCcsIGxlZnQ6ICdyaWdodCcsIHJpZ2h0OiAnbGVmdCcgfTtcbiAgZnVuY3Rpb24gc2V0RGlyKGQpIHsgaWYgKE9QUFtkXSAhPT0gZGlyKSBuZXh0RGlyID0gZDsgfVxuXG4gIGxldCBmb29kV2FzRmlyc3QgPSB0cnVlO1xuICBmdW5jdGlvbiBzcGF3bkZvb2QoKSB7XG4gICAgaWYgKGZvb2RXYXNGaXJzdCkgeyBmb29kV2FzRmlyc3QgPSBmYWxzZTsgZm9vZCA9IHsgeDogc25ha2VbMF0ueCArIDMsIHk6IHNuYWtlWzBdLnkgfTsgcmV0dXJuOyB9XG4gICAgZG8geyBmb29kID0geyB4OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOKSwgeTogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTikgfTsgfVxuICAgIHdoaWxlIChzbmFrZS5zb21lKHMgPT4gcy54ID09PSBmb29kLnggJiYgcy55ID09PSBmb29kLnkpKTtcbiAgfVxuICBmdW5jdGlvbiBidXJzdCh4LCB5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBjb25zdCBhID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyLCBzcCA9IDEuNSArIE1hdGgucmFuZG9tKCkgKiAzLjQ7XG4gICAgICBwYXJ0aWNsZXMucHVzaCh7IHg6IHggKiBDRUxMICsgQ0VMTCAvIDIsIHk6IHkgKiBDRUxMICsgQ0VMTCAvIDIsIHZ4OiBNYXRoLmNvcyhhKSAqIHNwLCB2eTogTWF0aC5zaW4oYSkgKiBzcCwgbGlmZTogMSB9KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdGljaygpIHtcbiAgICBwcmV2U25ha2UgPSBzbmFrZS5tYXAocyA9PiAoeyB4OiBzLngsIHk6IHMueSB9KSk7XG4gICAgdGlja0F0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgZGlyID0gbmV4dERpcjtcbiAgICBjb25zdCBoID0geyB4OiBzbmFrZVswXS54ICsgKGRpciA9PT0gJ3JpZ2h0JykgLSAoZGlyID09PSAnbGVmdCcpLCB5OiBzbmFrZVswXS55ICsgKGRpciA9PT0gJ2Rvd24nKSAtIChkaXIgPT09ICd1cCcpIH07XG4gICAgaWYgKGgueCA8IDAgfHwgaC54ID49IE4gfHwgaC55IDwgMCB8fCBoLnkgPj0gTiB8fCBzbmFrZS5zb21lKHMgPT4gcy54ID09PSBoLnggJiYgcy55ID09PSBoLnkpKSB7XG4gICAgICBhbGl2ZSA9IGZhbHNlOyBjbGVhckludGVydmFsKGludCk7XG4gICAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMjI1LDI5LDcyLC4wOCknO1xuICAgICAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICBzdGF0dXMudGV4dENvbnRlbnQgPSBgXHVEODNEXHVEQzgwIFRodWEhIFx1MDExMGlcdTFFQzNtICR7c2NvcmV9IFx1MjAxNCBDaFx1MDFBMWkgbFx1MUVBMWk/YDtcbiAgICAgIHN0YXR1cy5kYXRhc2V0LnN0YXRlID0gJ292ZXInO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzbmFrZS51bnNoaWZ0KGgpO1xuICAgIGlmIChoLnggPT09IGZvb2QueCAmJiBoLnkgPT09IGZvb2QueSkge1xuICAgICAgc2NvcmUrKztcbiAgICAgIHNjb3JlRWwudGV4dENvbnRlbnQgPSBgXHUwMTEwaVx1MUVDM206ICR7c2NvcmV9YDtcbiAgICAgIGJ1cnN0KGgueCwgaC55KTtcbiAgICAgIHNwYXduRm9vZCgpO1xuICAgICAgaWYgKHNwZWVkID4gNzApIHsgY2xlYXJJbnRlcnZhbChpbnQpOyBzcGVlZCAtPSA4OyBpbnQgPSBzZXRJbnRlcnZhbCh0aWNrLCBzcGVlZCk7IH1cbiAgICB9IGVsc2Ugc25ha2UucG9wKCk7XG4gIH1cbiAgLy8gdlx1MUVDQiB0clx1MDBFRCBuXHUxRUQ5aSBzdXkgZ2lcdTFFRUZhIDIgdGljayBcdTIxOTIgY2h1eVx1MUVDM24gXHUwMTExXHUxRUQ5bmcgbVx1MDFCMFx1MUVFM3RcbiAgZnVuY3Rpb24gbGVycFNlZ3ModCkge1xuICAgIHJldHVybiBzbmFrZS5tYXAoKHMsIGkpID0+IHtcbiAgICAgIGNvbnN0IHAgPSBwcmV2U25ha2VbaV0gfHwgcHJldlNuYWtlW3ByZXZTbmFrZS5sZW5ndGggLSAxXSB8fCBzO1xuICAgICAgcmV0dXJuIHsgeDogcC54ICsgKHMueCAtIHAueCkgKiB0LCB5OiBwLnkgKyAocy55IC0gcC55KSAqIHQgfTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBmcmFtZShub3cpIHtcbiAgICBpZiAoIWFsaXZlKSByZXR1cm47XG4gICAgY29uc3QgdCA9IE1hdGgubWluKDEsIChub3cgLSB0aWNrQXQpIC8gc3BlZWQpO1xuICAgIGRyYXcodCwgbm93KTtcbiAgICByYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICB9XG4gIGZ1bmN0aW9uIGRyYXcodCwgbm93KSB7XG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwyNTUsMjU1LC4wMzUpJztcbiAgICBjdHgubGluZVdpZHRoID0gMTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IE47IGkrKykge1xuICAgICAgY3R4LmJlZ2luUGF0aCgpOyBjdHgubW92ZVRvKGkgKiBDRUxMLCAwKTsgY3R4LmxpbmVUbyhpICogQ0VMTCwgY2FudmFzLmhlaWdodCk7IGN0eC5zdHJva2UoKTtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbygwLCBpICogQ0VMTCk7IGN0eC5saW5lVG8oY2FudmFzLndpZHRoLCBpICogQ0VMTCk7IGN0eC5zdHJva2UoKTtcbiAgICB9XG4gICAgLy8gbVx1MUVEM2kgXHUyMDE0IHF1XHUxRUEzIGNcdTFFQTd1IHB1bHNlXG4gICAgY29uc3QgcHVsc2UgPSAxICsgTWF0aC5zaW4obm93IC8gMjYwKSAqIDAuMTI7XG4gICAgY29uc3QgZnggPSBmb29kLnggKiBDRUxMICsgQ0VMTCAvIDIsIGZ5ID0gZm9vZC55ICogQ0VMTCArIENFTEwgLyAyO1xuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LnNoYWRvd0NvbG9yID0gJyNmNDcyYjYnOyBjdHguc2hhZG93Qmx1ciA9IDE4O1xuICAgIGNvbnN0IGZyID0gKENFTEwgLyAyIC0gNCkgKiBwdWxzZTtcbiAgICBjb25zdCBmZ3JhZCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChmeCAtIDMsIGZ5IC0gMywgMiwgZngsIGZ5LCBmcik7XG4gICAgZmdyYWQuYWRkQ29sb3JTdG9wKDAsICcjZmRhNGFmJyk7IGZncmFkLmFkZENvbG9yU3RvcCgxLCAnI2UxMWQ0OCcpO1xuICAgIGN0eC5maWxsU3R5bGUgPSBmZ3JhZDtcbiAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5hcmMoZngsIGZ5LCBmciwgMCwgTWF0aC5QSSAqIDIpOyBjdHguZmlsbCgpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgLy8gclx1MUVBRm4gXHUyMDE0IG1cdTFFRDl0IHBhdGggbGlcdTFFQzFuICsgZ2xvd1xuICAgIGNvbnN0IHNlZ3MgPSBsZXJwU2Vncyh0KTtcbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC5zaGFkb3dDb2xvciA9ICcjMDBGMkZFJzsgY3R4LnNoYWRvd0JsdXIgPSAxNjtcbiAgICBjdHgubGluZUpvaW4gPSBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgY3R4LmxpbmVXaWR0aCA9IENFTEwgLSA3O1xuICAgIGNvbnN0IHNncmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgc2dyYWQuYWRkQ29sb3JTdG9wKDAsICcjNjdlOGY5Jyk7IHNncmFkLmFkZENvbG9yU3RvcCgxLCAnIzBlNzQ5MCcpO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IHNncmFkO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBzZWdzLmZvckVhY2goKHMsIGkpID0+IHtcbiAgICAgIGNvbnN0IHB4ID0gcy54ICogQ0VMTCArIENFTEwgLyAyLCBweSA9IHMueSAqIENFTEwgKyBDRUxMIC8gMjtcbiAgICAgIGkgPT09IDAgPyBjdHgubW92ZVRvKHB4LCBweSkgOiBjdHgubGluZVRvKHB4LCBweSk7XG4gICAgfSk7XG4gICAgY3R4LnN0cm9rZSgpO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gICAgLy8gXHUwMTExXHUxRUE3dSArIG1cdTFFQUZ0XG4gICAgY29uc3QgaGQgPSBzZWdzWzBdO1xuICAgIGNvbnN0IGh4ID0gaGQueCAqIENFTEwgKyBDRUxMIC8gMiwgaHkgPSBoZC55ICogQ0VMTCArIENFTEwgLyAyO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnI2E1ZjNmYyc7XG4gICAgY3R4LmJlZ2luUGF0aCgpOyBjdHguYXJjKGh4LCBoeSwgKENFTEwgLSA0KSAvIDIsIDAsIE1hdGguUEkgKiAyKTsgY3R4LmZpbGwoKTtcbiAgICBjb25zdCBleCA9IGRpciA9PT0gJ2xlZnQnID8gLTQgOiBkaXIgPT09ICdyaWdodCcgPyA0IDogMDtcbiAgICBjb25zdCBleSA9IGRpciA9PT0gJ3VwJyA/IC00IDogZGlyID09PSAnZG93bicgPyA0IDogMDtcbiAgICBjb25zdCBweDIgPSBkaXIgPT09ICdsZWZ0JyB8fCBkaXIgPT09ICdyaWdodCcgPyAwIDogNjtcbiAgICBjb25zdCBweTIgPSBkaXIgPT09ICd1cCcgfHwgZGlyID09PSAnZG93bicgPyAwIDogNjtcbiAgICBjdHguZmlsbFN0eWxlID0gJyMwQjBFMTQnO1xuICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4LmFyYyhoeCArIGV4IC0gcHgyICogLjcsIGh5ICsgZXkgLSBweTIgKiAuNywgMywgMCwgTWF0aC5QSSAqIDIpOyBjdHguZmlsbCgpO1xuICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4LmFyYyhoeCArIGV4ICsgcHgyICogLjcsIGh5ICsgZXkgKyBweTIgKiAuNywgMywgMCwgTWF0aC5QSSAqIDIpOyBjdHguZmlsbCgpO1xuICAgIC8vIHBhcnRpY2xlcyBcdTAxMDNuIG1cdTFFRDNpXG4gICAgcGFydGljbGVzID0gcGFydGljbGVzLmZpbHRlcihwID0+IHAubGlmZSA+IDApO1xuICAgIGZvciAoY29uc3QgcCBvZiBwYXJ0aWNsZXMpIHtcbiAgICAgIHAueCArPSBwLnZ4OyBwLnkgKz0gcC52eTsgcC5saWZlIC09IDAuMDQ7XG4gICAgICBjdHguZmlsbFN0eWxlID0gYHJnYmEoMjQ0LDExNCwxODIsJHtwLmxpZmV9KWA7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5hcmMocC54LCBwLnksIDMuMiAqIHAubGlmZSArIC44LCAwLCBNYXRoLlBJICogMik7IGN0eC5maWxsKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG9uS2V5KGUpIHtcbiAgICBpZiAoS0VZTUFQW2Uua2V5XSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IHNldERpcihLRVlNQVBbZS5rZXldKTsgfVxuICB9XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXkpO1xuICAvLyBzd2lwZSB0clx1MDBFQW4gY2FudmFzIChtb2JpbGUpXG4gIGxldCBzeDAgPSAwLCBzeTAgPSAwO1xuICBjb25zdCBvblRTID0gZSA9PiB7IHN4MCA9IGUudG91Y2hlc1swXS5jbGllbnRYOyBzeTAgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTsgfTtcbiAgY29uc3Qgb25URSA9IGUgPT4ge1xuICAgIGNvbnN0IGR4ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYIC0gc3gwLCBkeSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WSAtIHN5MDtcbiAgICBpZiAoTWF0aC5tYXgoTWF0aC5hYnMoZHgpLCBNYXRoLmFicyhkeSkpIDwgMjApIHJldHVybjtcbiAgICBzZXREaXIoTWF0aC5hYnMoZHgpID4gTWF0aC5hYnMoZHkpID8gKGR4ID4gMCA/ICdyaWdodCcgOiAnbGVmdCcpIDogKGR5ID4gMCA/ICdkb3duJyA6ICd1cCcpKTtcbiAgfTtcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRTLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVEUsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBzbmFrZSA9IFt7IHg6IDQsIHk6IDEwIH0sIHsgeDogMywgeTogMTAgfSwgeyB4OiAyLCB5OiAxMCB9XTtcbiAgICBwcmV2U25ha2UgPSBzbmFrZS5tYXAocyA9PiAoeyAuLi5zIH0pKTtcbiAgICBkaXIgPSBuZXh0RGlyID0gJ3JpZ2h0Jzsgc2NvcmUgPSAwOyBzcGVlZCA9IDE4MDsgZm9vZFdhc0ZpcnN0ID0gdHJ1ZTtcbiAgICBhbGl2ZSA9IHRydWU7IHBhcnRpY2xlcyA9IFtdOyB0aWNrQXQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICBzcGF3bkZvb2QoKTtcbiAgICBzY29yZUVsLnRleHRDb250ZW50ID0gJ1x1MDExMGlcdTFFQzNtOiAwJztcbiAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnTVx1MDE2OWkgdFx1MDBFQW4gLyBXQVNEIFx1MjAxNCBcdTAxMDNuIG1cdTFFRDNpLCBuXHUwMEU5IHRcdTAxQjBcdTFFRERuZyc7XG4gICAgc3RhdHVzLmRhdGFzZXQuc3RhdGUgPSAncGxheWluZyc7XG4gICAgY2xlYXJJbnRlcnZhbChpbnQpOyBpbnQgPSBzZXRJbnRlcnZhbCh0aWNrLCBzcGVlZCk7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUocmFmKTsgcmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZyYW1lKTtcbiAgfVxuICByZXNldCgpO1xuICByZXR1cm4gKCkgPT4geyBjbGVhckludGVydmFsKGludCk7IGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJhZik7IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXkpOyBjYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVFMpOyBjYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRFKTsgfTtcbn1cblxuY29uc3QgSU1QTCA9IHsgZzQ4OiBnYW1lNDgsIG1lbTogZ2FtZU1lbSwgc25rOiBnYW1lU25rIH07XG5cbi8vIE1vdW50IDEgbWluaSBnYW1lIHZcdTAwRTBvIHN0YWdlRWwgKGh1ZEVsIG5oXHUxRUFEbiBwaWxsIFx1MDExMWlcdTFFQzNtL3RpbWVyKS4gVHJcdTFFQTMgdlx1MUVDMSBjbGVhbnVwIGZuLlxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50TWluaUdhbWUoaWQsIHN0YWdlRWwsIGh1ZEVsKSB7XG4gIGVuc3VyZVN0eWxlcygpO1xuICBzdGFnZUVsLmlubmVySFRNTCA9ICcnO1xuICBpZiAoaHVkRWwpIGh1ZEVsLmlubmVySFRNTCA9ICcnO1xuICBjb25zdCBpbXBsID0gSU1QTFtpZF07XG4gIHJldHVybiBpbXBsID8gKGltcGwoc3RhZ2VFbCwgaHVkRWwgfHwgc3RhZ2VFbCkgfHwgbnVsbCkgOiBudWxsO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIkFBU08sYUFBTSxhQUFhO0FBQUEsRUFDeEIsRUFBRSxJQUFJLE9BQU8sTUFBTSxhQUFNLEtBQUssUUFBZSxNQUFNLHNEQUF3QjtBQUFBLEVBQzNFLEVBQUUsSUFBSSxPQUFPLE1BQU0sYUFBTSxLQUFLLDBCQUFnQixNQUFNLG9EQUE2QjtBQUFBLEVBQ2pGLEVBQUUsSUFBSSxPQUFPLE1BQU0sYUFBTSxLQUFLLDhCQUFnQixNQUFNLDhEQUE2QjtBQUNuRjtBQUlBLE1BQU0sV0FBVztBQUNqQixTQUFTLGVBQWU7QUFDdEIsTUFBSSxTQUFTLGVBQWUsUUFBUSxFQUFHO0FBQ3ZDLFFBQU0sSUFBSSxTQUFTLGNBQWMsT0FBTztBQUN4QyxJQUFFLEtBQUs7QUFDUCxJQUFFLGNBQWM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUEwRGhCLFdBQVMsS0FBSyxZQUFZLENBQUM7QUFDN0I7QUFFQSxTQUFTLFVBQVUsTUFBTTtBQUN2QixRQUFNLElBQUksU0FBUyxjQUFjLEtBQUs7QUFDdEMsSUFBRSxZ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
