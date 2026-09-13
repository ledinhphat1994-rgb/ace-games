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
  const d = document.createElement("div");
  d.className = "mg-glass rounded-xl px-4 py-2 text-sm font-extrabold text-center min-w-52";
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
  let g, score, over, won;
  const status = statusBar("");
  const scoreEl = pill("0");
  scoreEl.dataset.testid = "g48-score";
  hud.append(scoreEl);
  const grid = document.createElement("div");
  grid.className = "mg-glass rounded-2xl p-2 grid gap-2";
  grid.style.gridTemplateColumns = `repeat(${N}, 72px)`;
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
    b.className = "mg-glass rounded-lg py-2 font-black text-cyan-300";
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
    for (let i = 0; i < arr.length - 1; i++)
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        if (arr[i] === 2048) won = true;
        arr.splice(i + 1, 1);
      }
    while (arr.length < N) arr.push(0);
    return arr;
  }
  function move(dir) {
    if (over) return;
    const before = g.join(",");
    const get = (r, c) => g[r * N + c];
    const set = (r, c, v) => g[r * N + c] = v;
    for (let i = 0; i < N; i++) {
      const line = [];
      for (let j = 0; j < N; j++) line.push(dir === "up" || dir === "down" ? get(j, i) : get(i, j));
      if (dir === "down" || dir === "right") line.reverse();
      const out = slide(line);
      if (dir === "down" || dir === "right") out.reverse();
      for (let j = 0; j < N; j++) dir === "up" || dir === "down" ? set(j, i, out[j]) : set(i, j, out[j]);
    }
    if (g.join(",") !== before) spawn();
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
  function reset() {
    g = Array(N * N).fill(0);
    score = 0;
    over = false;
    won = false;
    spawn();
    spawn();
    render();
  }
  reset();
  return () => window.removeEventListener("keydown", onKey);
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
  grid.className = "grid grid-cols-4 gap-2.5";
  const cards = [];
  for (let i = 0; i < 16; i++) {
    const card = document.createElement("div");
    card.className = "mem-card";
    card.dataset.testid = `mem-${i}`;
    const inner = document.createElement("div");
    inner.className = "mem-inner";
    const front = document.createElement("div");
    front.className = "mem-face mem-front";
    front.textContent = "\u2753";
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
  const N = 20, CELL = 20;
  let snake, dir, nextDir, food, score, speed, int;
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
    b.className = "mg-glass rounded-lg py-2 font-black text-cyan-300";
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
  function tick() {
    dir = nextDir;
    const h = { x: snake[0].x + (dir === "right") - (dir === "left"), y: snake[0].y + (dir === "down") - (dir === "up") };
    if (h.x < 0 || h.x >= N || h.y < 0 || h.y >= N || snake.some((s) => s.x === h.x && s.y === h.y)) {
      clearInterval(int);
      render();
      status.textContent = `\u{1F480} Thua! \u0110i\u1EC3m ${score} \u2014 Ch\u01A1i l\u1EA1i?`;
      status.dataset.state = "over";
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      score++;
      scoreEl.textContent = `\u0110i\u1EC3m: ${score}`;
      spawnFood();
      if (speed > 70) {
        clearInterval(int);
        speed -= 8;
        int = setInterval(tick, speed);
      }
    } else snake.pop();
    render();
  }
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.04)";
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
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u{1F34E}", food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 1);
    snake.forEach((s, i) => {
      const t = i / snake.length;
      ctx.fillStyle = i === 0 ? "#00F2FE" : `rgba(0,${Math.floor(200 - t * 80)},${Math.floor(220 - t * 60)},.9)`;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, 5);
      ctx.fill();
    });
  }
  function onKey(e) {
    if (KEYMAP[e.key]) {
      e.preventDefault();
      setDir(KEYMAP[e.key]);
    }
  }
  window.addEventListener("keydown", onKey);
  function reset() {
    snake = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
    dir = nextDir = "right";
    score = 0;
    speed = 180;
    foodWasFirst = true;
    spawnFood();
    scoreEl.textContent = "\u0110i\u1EC3m: 0";
    status.textContent = "M\u0169i t\xEAn / WASD \u2014 \u0103n m\u1ED3i, n\xE9 t\u01B0\u1EDDng";
    status.dataset.state = "playing";
    clearInterval(int);
    int = setInterval(tick, speed);
    render();
  }
  reset();
  return () => {
    clearInterval(int);
    window.removeEventListener("keydown", onKey);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibGliL21pbmlnYW1lcy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBzcmMvbGliL21pbmlnYW1lcy5qcyBcdTIwMTQgTWluaSBnYW1lIENIXHUwMUEwSSBNXHUxRUQ4VCBNXHUwMENDTkgsIHZhbmlsbGEgRE9NIG1vdW50LlxuLy8gRW5naW5lIGxcdTFFQTV5IG5ndXlcdTAwRUFuIHRcdTFFRUIgcWEvZ2FtZS1sYWIuaHRtbCAoXHUwMTExXHUwMEUzIHBhc3MgMzEvMCBicm93c2VyIHRlc3QpIFx1MjAxNCBraFx1MDBGNG5nXG4vLyBcdTAxMTFcdTFFRTVuZyBzZXJ2ZXIsIGtoXHUwMEY0bmcgbW9jayBkYXRhOiBzdGF0ZSBjaFx1MUVDOSBzXHUxRUQxbmcgdHJvbmcgdGFiIGhpXHUxRUM3biB0XHUxRUExaS5cbi8vXG4vLyAgIGltcG9ydCB7IE1JTklfR0FNRVMsIG1vdW50TWluaUdhbWUgfSBmcm9tICcuLi9saWIvbWluaWdhbWVzLmpzJztcbi8vICAgY29uc3QgY2xlYW51cCA9IG1vdW50TWluaUdhbWUoJ2c0OCcsIHN0YWdlRWwsIGh1ZEVsKTsgLy8gXHUyMTkyIGdcdTFFQ0RpIGNsZWFudXAoKSBraGkgdW5tb3VudFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBjb25zdCBNSU5JX0dBTUVTID0gW1xuICB7IGlkOiAnZzQ4JywgaWNvbjogJ1x1RDgzRFx1REQyMicsIHRlbjogJzIwNDgnLCAgICAgICAgbW9UYTogJ1RyXHUwMUIwXHUxRUUzdCBnXHUxRUQ5cCBzXHUxRUQxIFx1MDExMVx1MUVCRm4gMjA0OCcgfSxcbiAgeyBpZDogJ21lbScsIGljb246ICdcdUQ4M0NcdURDQ0YnLCB0ZW46ICdUclx1MDBFRCBOaFx1MUVEQiA0XHUwMEQ3NCcsICBtb1RhOiAnTFx1MUVBRHQgdGhcdTFFQkIgdFx1MDBFQ20gY1x1MUVCN3AgZ2lcdTFFRDFuZyBuaGF1JyB9LFxuICB7IGlkOiAnc25rJywgaWNvbjogJ1x1RDgzRFx1REMwRCcsIHRlbjogJ1JcdTFFQUZuIFNcdTAxMDNuIE1cdTFFRDNpJywgIG1vVGE6ICdcdTAxMDJuIG1cdTFFRDNpLCBuXHUwMEU5IHRcdTAxQjBcdTFFRERuZywgdFx1MDEwM25nIHRcdTFFRDFjJyB9LFxuXTtcblxuLy8gQ1NTIHJpXHUwMEVBbmcgY1x1MUVFN2EgbWluaS1nYW1lIChjZWxsIDIwNDgsIHRoXHUxRUJCIDNELCBjYW52YXMpIFx1MjAxNCBpbmplY3QgXHUwMTExXHUwMEZBbmcgMSBsXHUxRUE3blxuY29uc3QgU1RZTEVfSUQgPSAnbWluaWdhbWVzLWNzcyc7XG5mdW5jdGlvbiBlbnN1cmVTdHlsZXMoKSB7XG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChTVFlMRV9JRCkpIHJldHVybjtcbiAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHMuaWQgPSBTVFlMRV9JRDtcbiAgcy50ZXh0Q29udGVudCA9IGBcbiAgLnQyMDQ4IHsgd2lkdGg6IDcycHg7IGhlaWdodDogNzJweDsgYm9yZGVyLXJhZGl1czogMTJweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGZvbnQtd2VpZ2h0OiA5MDA7IGZvbnQtc2l6ZTogMjJweDsgYmFja2dyb3VuZDogcmdiYSgyNTUsMjU1LDI1NSwuMDUpOyB0cmFuc2l0aW9uOiBhbGwgLjEyczsgfVxuICAudDIwNDgudjJ7YmFja2dyb3VuZDojMWUyOTNiO2NvbG9yOiM5NGEzYjh9LnQyMDQ4LnY0e2JhY2tncm91bmQ6IzE2NGU2Mztjb2xvcjojYTVmM2ZjfS50MjA0OC52OHtiYWNrZ3JvdW5kOiMxNTVlNzU7Y29sb3I6I2NmZmFmZX1cbiAgLnQyMDQ4LnYxNntiYWNrZ3JvdW5kOiMwZTc0OTB9LnQyMDQ4LnYzMntiYWNrZ3JvdW5kOiMwODkxYjJ9LnQyMDQ4LnY2NHtiYWNrZ3JvdW5kOiMwNmI2ZDQ7Y29sb3I6IzAwMH1cbiAgLnQyMDQ4LnYxMjh7YmFja2dyb3VuZDojZjU5ZTBiO2NvbG9yOiMwMDB9LnQyMDQ4LnYyNTZ7YmFja2dyb3VuZDojZjk3MzE2fS50MjA0OC52NTEye2JhY2tncm91bmQ6I2VhNTgwY31cbiAgLnQyMDQ4LnYxMDI0e2JhY2tncm91bmQ6I2RjMjYyNn0udDIwNDgudjIwNDh7YmFja2dyb3VuZDojZmFjYzE1O2NvbG9yOiMwMDA7Ym94LXNoYWRvdzowIDAgMjRweCByZ2JhKDI1MCwyMDQsMjEsLjUpfVxuICBAa2V5ZnJhbWVzIG1nLXBvcCB7IDAle3RyYW5zZm9ybTpzY2FsZSguNCl9IDgwJXt0cmFuc2Zvcm06c2NhbGUoMS4xKX0gMTAwJXt0cmFuc2Zvcm06c2NhbGUoMSl9IH1cbiAgLnQyMDQ4Lm5ldyB7IGFuaW1hdGlvbjogbWctcG9wIC4xOHM7IH1cbiAgLm1lbS1jYXJkIHsgd2lkdGg6IDg0cHg7IGhlaWdodDogODRweDsgcGVyc3BlY3RpdmU6IDYwMHB4OyBjdXJzb3I6IHBvaW50ZXI7IH1cbiAgLm1lbS1pbm5lciB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgdHJhbnNpdGlvbjogdHJhbnNmb3JtIC4zNXM7IHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7IH1cbiAgLm1lbS1jYXJkLm9wZW4gLm1lbS1pbm5lciwgLm1lbS1jYXJkLmRvbmUgLm1lbS1pbm5lciB7IHRyYW5zZm9ybTogcm90YXRlWSgxODBkZWcpOyB9XG4gIC5tZW0tZmFjZSB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgaW5zZXQ6IDA7IGJvcmRlci1yYWRpdXM6IDE0cHg7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyBmb250LXNpemU6IDM0cHg7IGJhY2tmYWNlLXZpc2liaWxpdHk6IGhpZGRlbjsgfVxuICAubWVtLWZyb250IHsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywjMTY0ZTYzLCMwZjE3MmEpOyBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDAsMjQyLDI1NCwuMyk7IH1cbiAgLm1lbS1iYWNrIHsgdHJhbnNmb3JtOiByb3RhdGVZKDE4MGRlZyk7IGJhY2tncm91bmQ6ICMxNTFiMmU7IGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjE1KTsgfVxuICAubWVtLWNhcmQuZG9uZSAubWVtLWJhY2sgeyBib3JkZXItY29sb3I6ICMwMEYyRkU7IGJveC1zaGFkb3c6IDAgMCAxMnB4IHJnYmEoMCwyNDIsMjU0LC4zNSk7IH1cbiAgLm1nLWNhbnZhcyB7IGJhY2tncm91bmQ6ICMwZDEzMjA7IGJvcmRlci1yYWRpdXM6IDE0cHg7IGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsLjA4KTsgfVxuICAubWctZ2xhc3MgeyBiYWNrZ3JvdW5kOiAjMTIxNjIwOyBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LC4wOCk7IH1cbiAgLm1nLWJ0bi1hY2MgeyBiYWNrZ3JvdW5kOiAjMDBGMkZFOyBjb2xvcjogIzAwMDsgZm9udC13ZWlnaHQ6IDgwMDsgfVxuICAubWctYnRuLWFjYzpob3ZlciB7IGJhY2tncm91bmQ6ICMwMGUxZWM7IH1cbiAgYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKTtcbn1cblxuZnVuY3Rpb24gc3RhdHVzQmFyKHRleHQpIHtcbiAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkLmNsYXNzTmFtZSA9ICdtZy1nbGFzcyByb3VuZGVkLXhsIHB4LTQgcHktMiB0ZXh0LXNtIGZvbnQtZXh0cmFib2xkIHRleHQtY2VudGVyIG1pbi13LTUyJztcbiAgZC5kYXRhc2V0LnRlc3RpZCA9ICdnYW1lLXN0YXR1cyc7XG4gIGQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZDtcbn1cbmZ1bmN0aW9uIHJlc3RhcnRCdG4oZm4pIHtcbiAgY29uc3QgYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBiLmNsYXNzTmFtZSA9ICdtZy1idG4tYWNjIHB4LTQgcHktMiByb3VuZGVkLXhsIHRleHQteHMnO1xuICBiLmRhdGFzZXQudGVzdGlkID0gJ2J0bi1yZXN0YXJ0JztcbiAgYi50ZXh0Q29udGVudCA9ICdcdTIxQkIgQ2hcdTAxQTFpIGxcdTFFQTFpJztcbiAgYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZuKTtcbiAgcmV0dXJuIGI7XG59XG5mdW5jdGlvbiBwaWxsKHRleHQpIHtcbiAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgcy5jbGFzc05hbWUgPSAnbWctZ2xhc3MgcHgtMyBweS0xIHJvdW5kZWQtZnVsbCB0ZXh0LVsxMXB4XSBmb250LWV4dHJhYm9sZCc7XG4gIHMudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gcztcbn1cbmNvbnN0IEtFWU1BUCA9IHsgQXJyb3dVcDogJ3VwJywgQXJyb3dEb3duOiAnZG93bicsIEFycm93TGVmdDogJ2xlZnQnLCBBcnJvd1JpZ2h0OiAncmlnaHQnLCB3OiAndXAnLCBzOiAnZG93bicsIGE6ICdsZWZ0JywgZDogJ3JpZ2h0JyB9O1xuXG4vKiBcdTI1MDBcdTI1MDAgMjA0OCBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIGdhbWU0OChzdGFnZSwgaHVkKSB7XG4gIGNvbnN0IE4gPSA0O1xuICBsZXQgZywgc2NvcmUsIG92ZXIsIHdvbjtcblxuICBjb25zdCBzdGF0dXMgPSBzdGF0dXNCYXIoJycpO1xuICBjb25zdCBzY29yZUVsID0gcGlsbCgnMCcpO1xuICBzY29yZUVsLmRhdGFzZXQudGVzdGlkID0gJ2c0OC1zY29yZSc7XG4gIGh1ZC5hcHBlbmQoc2NvcmVFbCk7XG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZ3JpZC5jbGFzc05hbWUgPSAnbWctZ2xhc3Mgcm91bmRlZC0yeGwgcC0yIGdyaWQgZ2FwLTInO1xuICBncmlkLnN0eWxlLmdyaWRUZW1wbGF0ZUNvbHVtbnMgPSBgcmVwZWF0KCR7Tn0sIDcycHgpYDtcbiAgY29uc3QgdGlsZXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBOICogTjsgaSsrKSB7XG4gICAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHQuY2xhc3NOYW1lID0gJ3QyMDQ4JztcbiAgICB0LmRhdGFzZXQudGVzdGlkID0gYGc0OC0ke2l9YDtcbiAgICBncmlkLmFwcGVuZENoaWxkKHQpO1xuICAgIHRpbGVzLnB1c2godCk7XG4gIH1cbiAgY29uc3QgcGFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHBhZC5jbGFzc05hbWUgPSAnZ3JpZCBncmlkLWNvbHMtMyBnYXAtMS41IHctNDAnO1xuICBmb3IgKGNvbnN0IFtkaXIsIGxhYmVsXSBvZiBbWyd1cCcsICdcdTI1QjInXSwgWydsZWZ0JywgJ1x1MjVDMCddLCBbJ2Rvd24nLCAnXHUyNUJDJ10sIFsncmlnaHQnLCAnXHUyNUI2J11dKSB7XG4gICAgY29uc3QgYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGIuY2xhc3NOYW1lID0gJ21nLWdsYXNzIHJvdW5kZWQtbGcgcHktMiBmb250LWJsYWNrIHRleHQtY3lhbi0zMDAnO1xuICAgIGIuZGF0YXNldC50ZXN0aWQgPSBgZzQ4LSR7ZGlyfWA7XG4gICAgYi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGlmIChkaXIgPT09ICd1cCcpIGIuc3R5bGUuZ3JpZENvbHVtbiA9ICcyJztcbiAgICBpZiAoZGlyID09PSAnbGVmdCcpIGIuc3R5bGUuZ3JpZENvbHVtbiA9ICcxJztcbiAgICBiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gbW92ZShkaXIpKTtcbiAgICBwYWQuYXBwZW5kQ2hpbGQoYik7XG4gIH1cbiAgc3RhZ2UuYXBwZW5kKHN0YXR1cywgZ3JpZCwgcGFkLCByZXN0YXJ0QnRuKHJlc2V0KSk7XG5cbiAgY29uc3Qgc3Bhd24gPSAoKSA9PiB7XG4gICAgY29uc3QgZW1wdHkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE4gKiBOOyBpKyspIGlmICghZ1tpXSkgZW1wdHkucHVzaChpKTtcbiAgICBpZiAoIWVtcHR5Lmxlbmd0aCkgcmV0dXJuIC0xO1xuICAgIGNvbnN0IGkgPSBlbXB0eVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbXB0eS5sZW5ndGgpXTtcbiAgICBnW2ldID0gTWF0aC5yYW5kb20oKSA8IDAuOSA/IDIgOiA0O1xuICAgIHJldHVybiBpO1xuICB9O1xuICBmdW5jdGlvbiBzbGlkZShyb3cpIHtcbiAgICBjb25zdCBhcnIgPSByb3cuZmlsdGVyKHYgPT4gdik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoIC0gMTsgaSsrKVxuICAgICAgaWYgKGFycltpXSA9PT0gYXJyW2kgKyAxXSkgeyBhcnJbaV0gKj0gMjsgc2NvcmUgKz0gYXJyW2ldOyBpZiAoYXJyW2ldID09PSAyMDQ4KSB3b24gPSB0cnVlOyBhcnIuc3BsaWNlKGkgKyAxLCAxKTsgfVxuICAgIHdoaWxlIChhcnIubGVuZ3RoIDwgTikgYXJyLnB1c2goMCk7XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICBmdW5jdGlvbiBtb3ZlKGRpcikge1xuICAgIGlmIChvdmVyKSByZXR1cm47XG4gICAgY29uc3QgYmVmb3JlID0gZy5qb2luKCcsJyk7XG4gICAgY29uc3QgZ2V0ID0gKHIsIGMpID0+IGdbciAqIE4gKyBjXTtcbiAgICBjb25zdCBzZXQgPSAociwgYywgdikgPT4gZ1tyICogTiArIGNdID0gdjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE47IGkrKykge1xuICAgICAgY29uc3QgbGluZSA9IFtdO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBOOyBqKyspIGxpbmUucHVzaChkaXIgPT09ICd1cCcgfHwgZGlyID09PSAnZG93bicgPyBnZXQoaiwgaSkgOiBnZXQoaSwgaikpO1xuICAgICAgaWYgKGRpciA9PT0gJ2Rvd24nIHx8IGRpciA9PT0gJ3JpZ2h0JykgbGluZS5yZXZlcnNlKCk7XG4gICAgICBjb25zdCBvdXQgPSBzbGlkZShsaW5lKTtcbiAgICAgIGlmIChkaXIgPT09ICdkb3duJyB8fCBkaXIgPT09ICdyaWdodCcpIG91dC5yZXZlcnNlKCk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IE47IGorKykgKGRpciA9PT0gJ3VwJyB8fCBkaXIgPT09ICdkb3duJykgPyBzZXQoaiwgaSwgb3V0W2pdKSA6IHNldChpLCBqLCBvdXRbal0pO1xuICAgIH1cbiAgICBpZiAoZy5qb2luKCcsJykgIT09IGJlZm9yZSkgc3Bhd24oKTtcbiAgICBpZiAoIWNhbk1vdmUoKSkgb3ZlciA9IHRydWU7XG4gICAgcmVuZGVyKCk7XG4gIH1cbiAgZnVuY3Rpb24gY2FuTW92ZSgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE4gKiBOOyBpKyspIHtcbiAgICAgIGlmICghZ1tpXSkgcmV0dXJuIHRydWU7XG4gICAgICBjb25zdCByID0gTWF0aC5mbG9vcihpIC8gTiksIGMgPSBpICUgTjtcbiAgICAgIGlmIChjIDwgTiAtIDEgJiYgZ1tpXSA9PT0gZ1tpICsgMV0pIHJldHVybiB0cnVlO1xuICAgICAgaWYgKHIgPCBOIC0gMSAmJiBnW2ldID09PSBnW2kgKyBOXSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdGlsZXMuZm9yRWFjaCgodCwgaSkgPT4ge1xuICAgICAgY29uc3QgdiA9IGdbaV07XG4gICAgICB0LnRleHRDb250ZW50ID0gdiB8fCAnJztcbiAgICAgIHQuY2xhc3NOYW1lID0gJ3QyMDQ4JyArICh2ID8gYCB2JHtNYXRoLm1pbih2LCAyMDQ4KX1gIDogJycpO1xuICAgIH0pO1xuICAgIHNjb3JlRWwudGV4dENvbnRlbnQgPSBgXHUwMTEwaVx1MUVDM206ICR7c2NvcmV9YDtcbiAgICBzdGF0dXMudGV4dENvbnRlbnQgPSB3b24gPyAnXHVEODNDXHVERkM2IDIwNDghIFR1eVx1MUVDN3Qgdlx1MUVERGkgXHUyMDE0IGNoXHUwMUExaSB0aVx1MUVCRnAgXHUwMTExXHUwMUIwXHUxRUUzYyBuXHUxRUVGYScgOiBvdmVyID8gJ1x1RDgzRFx1REM4MCBIXHUxRUJGdCBuXHUwMUIwXHUxRURCYyBcdTIwMTQgQ2hcdTAxQTFpIGxcdTFFQTFpPycgOiAnTVx1MDE2OWkgdFx1MDBFQW4gLyBXQVNEIFx1MDExMVx1MUVDMyB0clx1MDFCMFx1MUVFM3QnO1xuICAgIHN0YXR1cy5kYXRhc2V0LnN0YXRlID0gd29uID8gJ3dvbicgOiBvdmVyID8gJ292ZXInIDogJ3BsYXlpbmcnO1xuICB9XG4gIGZ1bmN0aW9uIG9uS2V5KGUpIHtcbiAgICBpZiAoS0VZTUFQW2Uua2V5XSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IG1vdmUoS0VZTUFQW2Uua2V5XSk7IH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5KTtcbiAgZnVuY3Rpb24gcmVzZXQoKSB7IGcgPSBBcnJheShOICogTikuZmlsbCgwKTsgc2NvcmUgPSAwOyBvdmVyID0gZmFsc2U7IHdvbiA9IGZhbHNlOyBzcGF3bigpOyBzcGF3bigpOyByZW5kZXIoKTsgfVxuICByZXNldCgpO1xuICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleSk7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBUclx1MDBFRCBOaFx1MUVEQiA0XHUwMEQ3NCBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIGdhbWVNZW0oc3RhZ2UsIGh1ZCkge1xuICBjb25zdCBJQ09OUyA9IFsnXHVEODNDXHVERkFFJywgJ1x1RDgzRFx1REU4MCcsICdcdUQ4M0NcdURGMDgnLCAnXHVEODNDXHVERkI1JywgJ1x1MjZCRCcsICdcdUQ4M0NcdURGNDAnLCAnXHVEODNEXHVERDI1JywgJ1x1RDgzRFx1REM4RSddO1xuICBsZXQgZGVjaywgb3BlbiwgbWF0Y2hlZCwgbW92ZXMsIHQwLCB0aW1lckludDtcblxuICBjb25zdCBzdGF0dXMgPSBzdGF0dXNCYXIoJycpO1xuICBjb25zdCB0aW1lckVsID0gcGlsbCgnXHUyM0YxIDBzJyk7XG4gIHRpbWVyRWwuZGF0YXNldC50ZXN0aWQgPSAnbWVtLXRpbWVyJztcbiAgY29uc3QgbW92ZXNFbCA9IHBpbGwoJzAgbFx1MDFCMFx1MUVFM3QnKTtcbiAgbW92ZXNFbC5kYXRhc2V0LnRlc3RpZCA9ICdtZW0tbW92ZXMnO1xuICBodWQuYXBwZW5kKHRpbWVyRWwsIG1vdmVzRWwpO1xuXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZ3JpZC5jbGFzc05hbWUgPSAnZ3JpZCBncmlkLWNvbHMtNCBnYXAtMi41JztcbiAgY29uc3QgY2FyZHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgY29uc3QgY2FyZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNhcmQuY2xhc3NOYW1lID0gJ21lbS1jYXJkJztcbiAgICBjYXJkLmRhdGFzZXQudGVzdGlkID0gYG1lbS0ke2l9YDtcbiAgICBjb25zdCBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyBpbm5lci5jbGFzc05hbWUgPSAnbWVtLWlubmVyJztcbiAgICBjb25zdCBmcm9udCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyBmcm9udC5jbGFzc05hbWUgPSAnbWVtLWZhY2UgbWVtLWZyb250JzsgZnJvbnQudGV4dENvbnRlbnQgPSAnXHUyNzUzJztcbiAgICBjb25zdCBiYWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7IGJhY2suY2xhc3NOYW1lID0gJ21lbS1mYWNlIG1lbS1iYWNrJztcbiAgICBpbm5lci5hcHBlbmQoZnJvbnQsIGJhY2spOyBjYXJkLmFwcGVuZENoaWxkKGlubmVyKTtcbiAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gZmxpcChpKSk7XG4gICAgZ3JpZC5hcHBlbmRDaGlsZChjYXJkKTtcbiAgICBjYXJkcy5wdXNoKGNhcmQpO1xuICB9XG4gIHN0YWdlLmFwcGVuZChzdGF0dXMsIGdyaWQsIHJlc3RhcnRCdG4ocmVzZXQpKTtcblxuICBmdW5jdGlvbiBmbGlwKGkpIHtcbiAgICBpZiAob3Blbi5sZW5ndGggPT09IDIgfHwgb3Blbi5pbmNsdWRlcyhpKSB8fCBtYXRjaGVkLmhhcyhpKSkgcmV0dXJuO1xuICAgIG9wZW4ucHVzaChpKTtcbiAgICBjYXJkc1tpXS5jbGFzc0xpc3QuYWRkKCdvcGVuJyk7XG4gICAgaWYgKG9wZW4ubGVuZ3RoID09PSAyKSB7XG4gICAgICBtb3ZlcysrO1xuICAgICAgbW92ZXNFbC50ZXh0Q29udGVudCA9IGAke21vdmVzfSBsXHUwMUIwXHUxRUUzdGA7XG4gICAgICBjb25zdCBbYSwgYl0gPSBvcGVuO1xuICAgICAgaWYgKGRlY2tbYV0gPT09IGRlY2tbYl0pIHtcbiAgICAgICAgbWF0Y2hlZC5hZGQoYSk7IG1hdGNoZWQuYWRkKGIpOyBvcGVuID0gW107XG4gICAgICAgIGNhcmRzW2FdLmNsYXNzTGlzdC5hZGQoJ2RvbmUnKTsgY2FyZHNbYl0uY2xhc3NMaXN0LmFkZCgnZG9uZScpO1xuICAgICAgICBpZiAobWF0Y2hlZC5zaXplID09PSAxNikge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXJJbnQpO1xuICAgICAgICAgIHN0YXR1cy50ZXh0Q29udGVudCA9IGBcdUQ4M0NcdURGQzYgWG9uZyEgJHttb3Zlc30gbFx1MDFCMFx1MUVFM3QgXHUyMDE0ICR7TWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHQwKSAvIDEwMDApfXNgO1xuICAgICAgICAgIHN0YXR1cy5kYXRhc2V0LnN0YXRlID0gJ3dvbic7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyBjYXJkc1thXS5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7IGNhcmRzW2JdLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTsgb3BlbiA9IFtdOyB9LCA2NTApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBkZWNrID0gWy4uLklDT05TLCAuLi5JQ09OU10uc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbiAgICBvcGVuID0gW107IG1hdGNoZWQgPSBuZXcgU2V0KCk7IG1vdmVzID0gMDsgdDAgPSBEYXRlLm5vdygpO1xuICAgIGNsZWFySW50ZXJ2YWwodGltZXJJbnQpO1xuICAgIHRpbWVySW50ID0gc2V0SW50ZXJ2YWwoKCkgPT4geyB0aW1lckVsLnRleHRDb250ZW50ID0gYFx1MjNGMSAke01hdGguZmxvb3IoKERhdGUubm93KCkgLSB0MCkgLyAxMDAwKX1zYDsgfSwgMTAwMCk7XG4gICAgbW92ZXNFbC50ZXh0Q29udGVudCA9ICcwIGxcdTAxQjBcdTFFRTN0JztcbiAgICBzdGF0dXMudGV4dENvbnRlbnQgPSAnVFx1MDBFQ20gOCBjXHUxRUI3cCBnaVx1MUVEMW5nIG5oYXUnO1xuICAgIHN0YXR1cy5kYXRhc2V0LnN0YXRlID0gJ3BsYXlpbmcnO1xuICAgIGNhcmRzLmZvckVhY2goKGMsIGkpID0+IHsgYy5jbGFzc05hbWUgPSAnbWVtLWNhcmQnOyBjLmxhc3RDaGlsZC5sYXN0Q2hpbGQudGV4dENvbnRlbnQgPSBkZWNrW2ldOyB9KTtcbiAgfVxuICByZXNldCgpO1xuICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aW1lckludCk7XG59XG5cbi8qIFx1MjUwMFx1MjUwMCBSXHUxRUFGbiBTXHUwMTAzbiBNXHUxRUQzaSBcdTI1MDBcdTI1MDAgKi9cbmZ1bmN0aW9uIGdhbWVTbmsoc3RhZ2UsIGh1ZCkge1xuICBjb25zdCBOID0gMjAsIENFTEwgPSAyMDtcbiAgbGV0IHNuYWtlLCBkaXIsIG5leHREaXIsIGZvb2QsIHNjb3JlLCBzcGVlZCwgaW50O1xuXG4gIGNvbnN0IHN0YXR1cyA9IHN0YXR1c0JhcignJyk7XG4gIGNvbnN0IHNjb3JlRWwgPSBwaWxsKCcwJyk7XG4gIHNjb3JlRWwuZGF0YXNldC50ZXN0aWQgPSAnc25rLXNjb3JlJztcbiAgaHVkLmFwcGVuZChzY29yZUVsKTtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy5jbGFzc05hbWUgPSAnbWctY2FudmFzJztcbiAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IE4gKiBDRUxMO1xuICBjYW52YXMuZGF0YXNldC50ZXN0aWQgPSAnc25rLWNhbnZhcyc7XG4gIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIGNvbnN0IHBhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwYWQuY2xhc3NOYW1lID0gJ2dyaWQgZ3JpZC1jb2xzLTMgZ2FwLTEuNSB3LTQwJztcbiAgZm9yIChjb25zdCBbZCwgbGFiZWxdIG9mIFtbJ3VwJywgJ1x1MjVCMiddLCBbJ2xlZnQnLCAnXHUyNUMwJ10sIFsnZG93bicsICdcdTI1QkMnXSwgWydyaWdodCcsICdcdTI1QjYnXV0pIHtcbiAgICBjb25zdCBiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYi5jbGFzc05hbWUgPSAnbWctZ2xhc3Mgcm91bmRlZC1sZyBweS0yIGZvbnQtYmxhY2sgdGV4dC1jeWFuLTMwMCc7XG4gICAgYi5kYXRhc2V0LnRlc3RpZCA9IGBzbmstJHtkfWA7XG4gICAgYi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIGlmIChkID09PSAndXAnKSBiLnN0eWxlLmdyaWRDb2x1bW4gPSAnMic7XG4gICAgaWYgKGQgPT09ICdsZWZ0JykgYi5zdHlsZS5ncmlkQ29sdW1uID0gJzEnO1xuICAgIGIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBzZXREaXIoZCkpO1xuICAgIHBhZC5hcHBlbmRDaGlsZChiKTtcbiAgfVxuICBzdGFnZS5hcHBlbmQoc3RhdHVzLCBjYW52YXMsIHBhZCwgcmVzdGFydEJ0bihyZXNldCkpO1xuXG4gIGNvbnN0IE9QUCA9IHsgdXA6ICdkb3duJywgZG93bjogJ3VwJywgbGVmdDogJ3JpZ2h0JywgcmlnaHQ6ICdsZWZ0JyB9O1xuICBmdW5jdGlvbiBzZXREaXIoZCkgeyBpZiAoT1BQW2RdICE9PSBkaXIpIG5leHREaXIgPSBkOyB9XG5cbiAgbGV0IGZvb2RXYXNGaXJzdCA9IHRydWU7XG4gIGZ1bmN0aW9uIHNwYXduRm9vZCgpIHtcbiAgICBpZiAoZm9vZFdhc0ZpcnN0KSB7IGZvb2RXYXNGaXJzdCA9IGZhbHNlOyBmb29kID0geyB4OiBzbmFrZVswXS54ICsgMywgeTogc25ha2VbMF0ueSB9OyByZXR1cm47IH1cbiAgICBkbyB7IGZvb2QgPSB7IHg6IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE4pLCB5OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOKSB9OyB9XG4gICAgd2hpbGUgKHNuYWtlLnNvbWUocyA9PiBzLnggPT09IGZvb2QueCAmJiBzLnkgPT09IGZvb2QueSkpO1xuICB9XG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgZGlyID0gbmV4dERpcjtcbiAgICBjb25zdCBoID0geyB4OiBzbmFrZVswXS54ICsgKGRpciA9PT0gJ3JpZ2h0JykgLSAoZGlyID09PSAnbGVmdCcpLCB5OiBzbmFrZVswXS55ICsgKGRpciA9PT0gJ2Rvd24nKSAtIChkaXIgPT09ICd1cCcpIH07XG4gICAgaWYgKGgueCA8IDAgfHwgaC54ID49IE4gfHwgaC55IDwgMCB8fCBoLnkgPj0gTiB8fCBzbmFrZS5zb21lKHMgPT4gcy54ID09PSBoLnggJiYgcy55ID09PSBoLnkpKSB7XG4gICAgICBjbGVhckludGVydmFsKGludCk7IHJlbmRlcigpO1xuICAgICAgc3RhdHVzLnRleHRDb250ZW50ID0gYFx1RDgzRFx1REM4MCBUaHVhISBcdTAxMTBpXHUxRUMzbSAke3Njb3JlfSBcdTIwMTQgQ2hcdTAxQTFpIGxcdTFFQTFpP2A7XG4gICAgICBzdGF0dXMuZGF0YXNldC5zdGF0ZSA9ICdvdmVyJztcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc25ha2UudW5zaGlmdChoKTtcbiAgICBpZiAoaC54ID09PSBmb29kLnggJiYgaC55ID09PSBmb29kLnkpIHtcbiAgICAgIHNjb3JlKys7XG4gICAgICBzY29yZUVsLnRleHRDb250ZW50ID0gYFx1MDExMGlcdTFFQzNtOiAke3Njb3JlfWA7XG4gICAgICBzcGF3bkZvb2QoKTtcbiAgICAgIGlmIChzcGVlZCA+IDcwKSB7IGNsZWFySW50ZXJ2YWwoaW50KTsgc3BlZWQgLT0gODsgaW50ID0gc2V0SW50ZXJ2YWwodGljaywgc3BlZWQpOyB9XG4gICAgfSBlbHNlIHNuYWtlLnBvcCgpO1xuICAgIHJlbmRlcigpO1xuICB9XG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gJ3JnYmEoMjU1LDI1NSwyNTUsLjA0KSc7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBOOyBpKyspIHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTsgY3R4Lm1vdmVUbyhpICogQ0VMTCwgMCk7IGN0eC5saW5lVG8oaSAqIENFTEwsIGNhbnZhcy5oZWlnaHQpOyBjdHguc3Ryb2tlKCk7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7IGN0eC5tb3ZlVG8oMCwgaSAqIENFTEwpOyBjdHgubGluZVRvKGNhbnZhcy53aWR0aCwgaSAqIENFTEwpOyBjdHguc3Ryb2tlKCk7XG4gICAgfVxuICAgIGN0eC5mb250ID0gJzE2cHggc2VyaWYnOyBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7IGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICBjdHguZmlsbFRleHQoJ1x1RDgzQ1x1REY0RScsIGZvb2QueCAqIENFTEwgKyBDRUxMIC8gMiwgZm9vZC55ICogQ0VMTCArIENFTEwgLyAyICsgMSk7XG4gICAgc25ha2UuZm9yRWFjaCgocywgaSkgPT4ge1xuICAgICAgY29uc3QgdCA9IGkgLyBzbmFrZS5sZW5ndGg7XG4gICAgICBjdHguZmlsbFN0eWxlID0gaSA9PT0gMCA/ICcjMDBGMkZFJyA6IGByZ2JhKDAsJHtNYXRoLmZsb29yKDIwMCAtIHQgKiA4MCl9LCR7TWF0aC5mbG9vcigyMjAgLSB0ICogNjApfSwuOSlgO1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LnJvdW5kUmVjdChzLnggKiBDRUxMICsgMS41LCBzLnkgKiBDRUxMICsgMS41LCBDRUxMIC0gMywgQ0VMTCAtIDMsIDUpO1xuICAgICAgY3R4LmZpbGwoKTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBvbktleShlKSB7XG4gICAgaWYgKEtFWU1BUFtlLmtleV0pIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBzZXREaXIoS0VZTUFQW2Uua2V5XSk7IH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5KTtcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgc25ha2UgPSBbeyB4OiA0LCB5OiAxMCB9LCB7IHg6IDMsIHk6IDEwIH0sIHsgeDogMiwgeTogMTAgfV07XG4gICAgZGlyID0gbmV4dERpciA9ICdyaWdodCc7IHNjb3JlID0gMDsgc3BlZWQgPSAxODA7IGZvb2RXYXNGaXJzdCA9IHRydWU7XG4gICAgc3Bhd25Gb29kKCk7XG4gICAgc2NvcmVFbC50ZXh0Q29udGVudCA9ICdcdTAxMTBpXHUxRUMzbTogMCc7XG4gICAgc3RhdHVzLnRleHRDb250ZW50ID0gJ01cdTAxNjlpIHRcdTAwRUFuIC8gV0FTRCBcdTIwMTQgXHUwMTAzbiBtXHUxRUQzaSwgblx1MDBFOSB0XHUwMUIwXHUxRUREbmcnO1xuICAgIHN0YXR1cy5kYXRhc2V0LnN0YXRlID0gJ3BsYXlpbmcnO1xuICAgIGNsZWFySW50ZXJ2YWwoaW50KTsgaW50ID0gc2V0SW50ZXJ2YWwodGljaywgc3BlZWQpO1xuICAgIHJlbmRlcigpO1xuICB9XG4gIHJlc2V0KCk7XG4gIHJldHVybiAoKSA9PiB7IGNsZWFySW50ZXJ2YWwoaW50KTsgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleSk7IH07XG59XG5cbmNvbnN0IElNUEwgPSB7IGc0ODogZ2FtZTQ4LCBtZW06IGdhbWVNZW0sIHNuazogZ2FtZVNuayB9O1xuXG4vLyBNb3VudCAxIG1pbmkgZ2FtZSB2XHUwMEUwbyBzdGFnZUVsIChodWRFbCBuaFx1MUVBRG4gcGlsbCBcdTAxMTFpXHUxRUMzbS90aW1lcikuIFRyXHUxRUEzIHZcdTFFQzEgY2xlYW51cCBmbi5cbmV4cG9ydCBmdW5jdGlvbiBtb3VudE1pbmlHYW1lKGlkLCBzdGFnZUVsLCBodWRFbCkge1xuICBlbnN1cmVTdHlsZXMoKTtcbiAgc3RhZ2VFbC5pbm5lckhUTUwgPSAnJztcbiAgaWYgKGh1ZEVsKSBodWRFbC5pbm5lckhUTUwgPSAnJztcbiAgY29uc3QgaW1wbCA9IElNUExbaWRdO1xuICByZXR1cm4gaW1wbCA/IChpbXBsKHN0YWdlRWwsIGh1ZEVsIHx8IHN0YWdlRWwpIHx8IG51bGwpIDogbnVsbDtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICJBQVNPLGFBQU0sYUFBYTtBQUFBLEVBQ3hCLEVBQUUsSUFBSSxPQUFPLE1BQU0sYUFBTSxLQUFLLFFBQWUsTUFBTSxzREFBd0I7QUFBQSxFQUMzRSxFQUFFLElBQUksT0FBTyxNQUFNLGFBQU0sS0FBSywwQkFBZ0IsTUFBTSxvREFBNkI7QUFBQSxFQUNqRixFQUFFLElBQUksT0FBTyxNQUFNLGFBQU0sS0FBSyw4QkFBZ0IsTUFBTSw4REFBNkI7QUFDbkY7QUFHQSxNQUFN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
