// ==============================================================================
// PHÒNG TÁN GẪU LỚP HỌC (FLOATING CHAT WIDGET)
// Quản lý tin nhắn, Smart Polling, Rate limit đếm ngược, và Quản trị Giáo viên
// ==============================================================================

(function () {
  let tinNhanCuoiId = 0;
  let dangMoKhungChat = false;
  let laGiaoVien = false;
  let hocSinhIdHienTai = null;
  let gianCachGiay = 5;
  let demNguocGiay = 0;
  let demNguocTimer = null;
  let pollingTimer = null;
  let caiDatHienTai = { dangMo: 1, gianCachGiay: 5, thongBaoGhim: '' };
  let lopIdHienTai = 1;
  let cuonTrangY = 0;
  let dangGui = false;
  let tinChuaDoc = 0;
  let tabHienTai = 'chat'; // 'chat' | 'music' | 'game'

  // Kho icon chat phong phú (130+ emoji được phân loại khoa học)
  const EMOJI_CATEGORIES = [
    {
      id: 'faces',
      ten: '😀 Mặt cười',
      icons: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '😎', '🥳', '😏', '🤔', '🤫', '🤭', '🤐', '😴', '😷', '🤒', '🤕', '🥺', '😢', '😭', '😱', '😤', '😡', '🤯', '🤠', '🤡', '👻']
    },
    {
      id: 'hands',
      ten: '👍 Cử chỉ',
      icons: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '👊', '✊', '🤛', '🤜', '🙏', '💪', '💖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗']
    },
    {
      id: 'school',
      ten: '📚 Học tập',
      icons: ['📚', '📖', '📕', '📗', '📘', '📙', '📝', '✍️', '✏️', '✒️', '📐', '📏', '📎', '📌', '🎨', '🎓', '🎒', '🏫', '💡', '🔔', '📢', '⏰', '⏱️', '📅', '💯', '🎯', '🏆', '🥇', '🥈', '🥉']
    },
    {
      id: 'fun',
      ten: '🎉 Hoạt động',
      icons: ['🎉', '🎊', '🎈', '✨', '🔥', '⭐', '🌟', '💥', '🍀', '🌸', '🌹', '🌻', '🐱', '🐶', '🐰', '🐼', '🦊', '🐻', '🐯', '⚽', '🏀', '🏐', '🏸', '🎮', '☕', '🍵', '🧋', '🍦', '🍰', '🍕', '🍔']
    }
  ];

  // ==============================================================================
  // KÉO THẢ TỰ DO VÀ LƯU VỊ TRÍ BONG BÓNG ĐA NĂNG
  // ==============================================================================
  function khoiTaoKeoThaBongBong(bubble) {
    const STORAGE_KEY = 'lop10a7_bubble_coords';
    let dangKeo = false;
    let daDiChuyen = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    function khoiPhucViTri() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const pos = JSON.parse(saved);
          if (typeof pos.x === 'number' && typeof pos.y === 'number') {
            const maxX = Math.max(10, window.innerWidth - 68);
            const maxY = Math.max(10, window.innerHeight - 68);
            const x = Math.min(Math.max(10, pos.x), maxX);
            const y = Math.min(Math.max(10, pos.y), maxY);
            bubble.style.left = `${x}px`;
            bubble.style.top = `${y}px`;
            bubble.style.right = 'auto';
            bubble.style.bottom = 'auto';
            return;
          }
        }
      } catch {}
      // Mặc định: góc phải dưới
      bubble.style.right = '20px';
      bubble.style.bottom = '24px';
      bubble.style.left = 'auto';
      bubble.style.top = 'auto';
    }

    khoiPhucViTri();

    function batDau(clientX, clientY) {
      if (dangMoKhungChat) return;
      dangKeo = true;
      daDiChuyen = false;
      startX = clientX;
      startY = clientY;

      const rect = bubble.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      bubble.style.transition = 'none';
      bubble.classList.add('chat-bubble-dragging');
    }

    function diChuyen(clientX, clientY, e) {
      if (!dangKeo) return;
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.hypot(dx, dy) > 5) {
        daDiChuyen = true;
        if (e && e.cancelable) e.preventDefault();
      }

      if (daDiChuyen) {
        const maxX = Math.max(10, window.innerWidth - bubble.offsetWidth - 10);
        const maxY = Math.max(10, window.innerHeight - bubble.offsetHeight - 10);
        const newX = Math.min(Math.max(10, initialX + dx), maxX);
        const newY = Math.min(Math.max(10, initialY + dy), maxY);

        bubble.style.left = `${newX}px`;
        bubble.style.top = `${newY}px`;
        bubble.style.right = 'auto';
        bubble.style.bottom = 'auto';
      }
    }

    function ketThuc() {
      if (!dangKeo) return;
      dangKeo = false;
      bubble.classList.remove('chat-bubble-dragging');
      bubble.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease';

      if (daDiChuyen) {
        const rect = bubble.getBoundingClientRect();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            x: Math.round(rect.left),
            y: Math.round(rect.top),
          }));
        } catch {}
      } else {
        moKhungChat();
      }
    }

    // Chuột PC
    bubble.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      batDau(e.clientX, e.clientY);

      const onMouseMove = (ev) => diChuyen(ev.clientX, ev.clientY, ev);
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        ketThuc();
      };
      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
    });

    // Cảm ứng Mobile
    bubble.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      batDau(touch.clientX, touch.clientY);
    }, { passive: true });

    bubble.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      diChuyen(touch.clientX, touch.clientY, e);
    }, { passive: false });

    bubble.addEventListener('touchend', ketThuc, { passive: true });
    bubble.addEventListener('touchcancel', ketThuc, { passive: true });

    // Đảm bảo không văng ra ngoài khi xoay ngang/đổi kích thước màn hình
    window.addEventListener('resize', () => {
      const rect = bubble.getBoundingClientRect();
      const maxX = Math.max(10, window.innerWidth - bubble.offsetWidth - 10);
      const maxY = Math.max(10, window.innerHeight - bubble.offsetHeight - 10);
      if (rect.left > maxX || rect.top > maxY) {
        const x = Math.min(Math.max(10, rect.left), maxX);
        const y = Math.min(Math.max(10, rect.top), maxY);
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
        } catch {}
      }
    });
  }

  // ==============================================================================
  // MODULE NHẠC YOUTUBE MINI
  // ==============================================================================
  function khoiTaoNhacYouTube() {
    const presetContainer = document.getElementById('musicPresetChips');
    const iframe = document.getElementById('musicIframe');
    const customInput = document.getElementById('musicCustomInput');
    const playBtn = document.getElementById('musicPlayCustomBtn');
    const trackTitle = document.getElementById('musicTrackTitle');

    if (!iframe) return;

    function phatVideo(videoId, titleText) {
      if (!videoId) return;
      iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&origin=${encodeURIComponent(window.location.origin)}`;
      if (trackTitle && titleText) {
        trackTitle.textContent = `Đang phát: ${titleText}`;
      }
    }

    if (presetContainer) {
      presetContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-yt-id]');
        if (!chip) return;
        presetContainer.querySelectorAll('.music-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        phatVideo(chip.dataset.ytId, chip.dataset.ytTitle);
      });
    }

    function trichXuatYtId(urlOrId) {
      if (!urlOrId) return '';
      const str = urlOrId.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
      const m1 = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (m1) return m1[1];
      const m2 = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (m2) return m2[1];
      const m3 = str.match(/embed\/([a-zA-Z0-9_-]{11})/);
      if (m3) return m3[1];
      return '';
    }

    if (playBtn && customInput) {
      const handleCustomPlay = () => {
        const id = trichXuatYtId(customInput.value);
        if (!id) {
          alert('Vui lòng nhập link hoặc ID video YouTube hợp lệ (ví dụ: jfKfPfyJRdk hoặc https://youtu.be/...)');
          return;
        }
        if (presetContainer) {
          presetContainer.querySelectorAll('.music-chip').forEach((c) => c.classList.remove('active'));
        }
        phatVideo(id, `YouTube (${id})`);
      };

      playBtn.onclick = handleCustomPlay;
      customInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCustomPlay();
        }
      };
    }
  }

  // ==============================================================================
  // MODULE GAME HUB (CỜ CARO 15x15 & 2048)
  // ==============================================================================
  function khoiTaoGameHub() {
    const selector = document.getElementById('gameSelectorGrid');
    const caroArena = document.getElementById('caroArena');
    const arena2048 = document.getElementById('arena2048');
    const backBtn = document.getElementById('gameBackToMenuBtn');
    const hubTitle = document.getElementById('gameHubTitle');
    const hubDesc = document.getElementById('gameHubDesc');

    function moMenuChinh() {
      if (selector) selector.style.display = 'flex';
      if (caroArena) caroArena.style.display = 'none';
      if (arena2048) arena2048.style.display = 'none';
      if (backBtn) backBtn.style.display = 'none';
      if (hubTitle) hubTitle.textContent = '🎮 Trò chơi giải trí Lớp 10A7';
      if (hubDesc) hubDesc.textContent = 'Giải trí lành mạnh, thư giãn thông minh cùng bạn bè';
    }

    if (backBtn) backBtn.onclick = moMenuChinh;

    const cardCaro = document.getElementById('cardStartCaro');
    if (cardCaro) {
      cardCaro.onclick = () => {
        if (selector) selector.style.display = 'none';
        if (caroArena) caroArena.style.display = 'flex';
        if (arena2048) arena2048.style.display = 'none';
        if (backBtn) backBtn.style.display = 'inline-block';
        if (hubTitle) hubTitle.textContent = '⭕❌ Cờ Caro (Gomoku) 15x15';
        if (hubDesc) hubDesc.textContent = 'Tạo thành 5 quân liên tiếp hàng ngang, dọc hoặc chéo để chiến thắng';
        khoiTaoCaro();
      };
    }

    const card2048 = document.getElementById('cardStart2048');
    if (card2048) {
      card2048.onclick = () => {
        if (selector) selector.style.display = 'none';
        if (caroArena) caroArena.style.display = 'none';
        if (arena2048) arena2048.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'inline-block';
        if (hubTitle) hubTitle.textContent = '🔢 2048 Siêu Trí Tuệ';
        if (hubDesc) hubDesc.textContent = 'Vuốt màn hình hoặc dùng phím mũi tên để ghép các ô số';
        khoiTao2048();
      };
    }

    // ----- LOGIC CỜ CARO (15x15) -----
    const SIZE = 15;
    let board = [];
    let luotNguoi = 1; // 1 = X (người/X), 2 = O (máy/O)
    let daKetThuc = false;
    let cheDo = 'ai'; // 'ai' hoặc 'pvp'
    let lastMove = null;

    function khoiTaoCaro() {
      board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
      luotNguoi = 1;
      daKetThuc = false;
      lastMove = null;
      renderCaroGrid();
      capNhatTrangThaiCaro();
    }

    const modeBtn = document.getElementById('caroModeBtn');
    // Chế độ: 'ai' | 'pvp' | 'online'
    const MODES = ['ai', 'pvp', 'online'];
    const MODE_LABELS = { ai: 'Đấu với Máy', pvp: '2 Người chơi', online: 'Online (cùng bạn)' };
    if (modeBtn) {
      modeBtn.onclick = () => {
        const idx = MODES.indexOf(cheDo);
        cheDo = MODES[(idx + 1) % MODES.length];
        modeBtn.textContent = `Chế độ: ${MODE_LABELS[cheDo]}`;
        if (cheDo === 'online') {
          const lobby = document.getElementById('caroOnlineLobby');
          const vsBar = document.getElementById('caroVsBar');
          const boardWrapper = document.getElementById('caroBoardWrapper');
          if (lobby) lobby.style.display = 'flex';
          if (vsBar) vsBar.style.display = 'none';
          if (boardWrapper) boardWrapper.style.display = 'none';
          taiPhongOnline();
        } else {
          const lobby = document.getElementById('caroOnlineLobby');
          const vsBar = document.getElementById('caroVsBar');
          const boardWrapper = document.getElementById('caroBoardWrapper');
          if (lobby) lobby.style.display = 'none';
          if (vsBar) vsBar.style.display = 'none';
          if (boardWrapper) boardWrapper.style.display = '';
          roiPhongOnline();
          khoiTaoCaro();
        }
      };
    }

    const resetBtn = document.getElementById('caroResetBtn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (cheDo === 'online') {
          if (typeof vanMoiOnline === 'function') vanMoiOnline();
        } else {
          khoiTaoCaro();
        }
      };
    }

    function capNhatTrangThaiCaro() {
      const st = document.getElementById('caroStatus');
      if (!st || daKetThuc) return;
      if (cheDo === 'ai') {
        st.textContent = luotNguoi === 1 ? 'Lượt: 🔵 X (Bạn)' : 'Lượt: 🔴 O (Máy đang nghĩ...)';
      } else {
        st.textContent = luotNguoi === 1 ? 'Lượt: 🔵 Quân X' : 'Lượt: 🔴 Quân O';
      }
    }

    function renderCaroGrid() {
      const grid = document.getElementById('caroGrid');
      if (!grid) return;
      grid.textContent = '';

      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const cell = document.createElement('div');
          cell.className = 'caro-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;

          const val = board[r][c];
          if (val === 1) {
            cell.textContent = '✕';
            cell.classList.add('cell-x');
          } else if (val === 2) {
            cell.textContent = '◯';
            cell.classList.add('cell-o');
          }

          if (lastMove && lastMove.r === r && lastMove.c === c) {
            cell.classList.add('cell-last');
          }

          cell.onclick = () => {
            if (cheDo === 'online' && _onlinePhongId) {
              nuocDiOnline(r, c);
            } else {
              nuocDiNguoiChoi(r, c);
            }
          };
          grid.appendChild(cell);
        }
      }
    }

    function nuocDiNguoiChoi(r, c) {
      if (daKetThuc || board[r][c] !== 0) return;
      if (cheDo === 'ai' && luotNguoi !== 1) return;

      board[r][c] = luotNguoi;
      lastMove = { r, c };
      renderCaroGrid();

      const winLine = kiemTraThang(r, c, luotNguoi);
      if (winLine) {
        xuLyThang(luotNguoi, winLine);
        return;
      }

      if (cheDo === 'ai') {
        luotNguoi = 2;
        capNhatTrangThaiCaro();
        setTimeout(nuocDiMayAI, 200);
      } else {
        luotNguoi = luotNguoi === 1 ? 2 : 1;
        capNhatTrangThaiCaro();
      }
    }

    function nuocDiMayAI() {
      if (daKetThuc) return;
      const bestMove = tinhNuocDiAI();
      if (!bestMove) return;

      board[bestMove.r][bestMove.c] = 2;
      lastMove = bestMove;
      renderCaroGrid();

      const winLine = kiemTraThang(bestMove.r, bestMove.c, 2);
      if (winLine) {
        xuLyThang(2, winLine);
        return;
      }

      luotNguoi = 1;
      capNhatTrangThaiCaro();
    }

    function kiemTraThang(r, c, player) {
      const directions = [
        [[0, 1], [0, -1]],
        [[1, 0], [-1, 0]],
        [[1, 1], [-1, -1]],
        [[1, -1], [-1, 1]]
      ];

      for (const dir of directions) {
        const line = [{ r, c }];
        for (const [dr, dc] of dir) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
            line.push({ r: nr, c: nc });
            nr += dr;
            nc += dc;
          }
        }
        if (line.length >= 5) return line;
      }
      return null;
    }

    function xuLyThang(player, winLine) {
      daKetThuc = true;
      const st = document.getElementById('caroStatus');
      if (st) {
        if (cheDo === 'ai') {
          st.textContent = player === 1 ? '🎉 BẠN ĐÃ THẮNG MÁY AI!' : '🤖 MÁY AI ĐÃ THẮNG!';
        } else {
          st.textContent = player === 1 ? '🎉 QUÂN X THẮNG!' : '🎉 QUÂN O THẮNG!';
        }
      }

      winLine.forEach((p) => {
        const cell = document.querySelector(`.caro-cell[data-r="${p.r}"][data-c="${p.c}"]`);
        if (cell) cell.classList.add('cell-win');
      });
    }

    function tinhNuocDiAI() {
      let maxScore = -1;
      let candidates = [];

      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (board[r][c] === 0) {
            let coHangXom = false;
            for (let dr = -2; dr <= 2 && !coHangXom; dr++) {
              for (let dc = -2; dc <= 2; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] !== 0) {
                  coHangXom = true;
                  break;
                }
              }
            }
            if (!coHangXom && (r !== 7 || c !== 7)) continue;

            const scoreAttack = danhGiaNuocDi(r, c, 2);
            const scoreDefend = danhGiaNuocDi(r, c, 1);
            const totalScore = scoreAttack + scoreDefend * 1.15;

            if (totalScore > maxScore) {
              maxScore = totalScore;
              candidates = [{ r, c }];
            } else if (totalScore === maxScore) {
              candidates.push({ r, c });
            }
          }
        }
      }

      if (candidates.length === 0) return { r: 7, c: 7 };
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function danhGiaNuocDi(r, c, player) {
      let score = 0;
      const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];

      for (const [dr, dc] of dirs) {
        let count = 1;
        let block = 0;

        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
          count++; nr += dr; nc += dc;
        }
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== 0) {
          block++;
        }

        nr = r - dr;
        nc = c - dc;
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
          count++; nr -= dr; nc -= dc;
        }
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== 0) {
          block++;
        }

        if (count >= 5) score += 100000;
        else if (count === 4 && block === 0) score += 10000;
        else if (count === 4 && block === 1) score += 2000;
        else if (count === 3 && block === 0) score += 1000;
        else if (count === 3 && block === 1) score += 200;
        else if (count === 2 && block === 0) score += 100;
      }
      return score;
    }

    // ----- LOGIC GAME 2048 (4x4) -----
    let grid2048 = [];
    let score2048 = 0;
    let best2048 = parseInt(localStorage.getItem('lop10a7_2048_best') || '0', 10);

    function khoiTao2048() {
      grid2048 = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      score2048 = 0;
      sinhO2048();
      sinhO2048();
      render2048();
    }

    const btnNew2048 = document.getElementById('btn2048New');
    if (btnNew2048) btnNew2048.onclick = khoiTao2048;

    function sinhO2048() {
      const trong = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (grid2048[r][c] === 0) trong.push({ r, c });
        }
      }
      if (trong.length > 0) {
        const rand = trong[Math.floor(Math.random() * trong.length)];
        grid2048[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
      }
    }

    function render2048() {
      const boardEl = document.getElementById('board2048');
      const scoreEl = document.getElementById('score2048Val');
      const bestEl = document.getElementById('best2048Val');
      if (!boardEl) return;

      if (scoreEl) scoreEl.textContent = String(score2048);
      if (bestEl) {
        if (score2048 > best2048) {
          best2048 = score2048;
          try { localStorage.setItem('lop10a7_2048_best', String(best2048)); } catch {}
        }
        bestEl.textContent = String(best2048);
      }

      boardEl.textContent = '';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const val = grid2048[r][c];
          const tile = document.createElement('div');
          tile.className = `tile-2048 ${val ? `tile-${val}` : ''}`;
          tile.textContent = val ? String(val) : '';
          boardEl.appendChild(tile);
        }
      }
    }

    function truot2048(row) {
      let arr = row.filter((val) => val);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          score2048 += arr[i];
          arr[i + 1] = 0;
        }
      }
      arr = arr.filter((val) => val);
      while (arr.length < 4) arr.push(0);
      return arr;
    }

    function diChuyen2048(huong) {
      let daThayDoi = false;
      const cu = JSON.stringify(grid2048);

      if (huong === 'left') {
        for (let r = 0; r < 4; r++) {
          grid2048[r] = truot2048(grid2048[r]);
        }
      } else if (huong === 'right') {
        for (let r = 0; r < 4; r++) {
          grid2048[r] = truot2048(grid2048[r].slice().reverse()).reverse();
        }
      } else if (huong === 'up') {
        for (let c = 0; c < 4; c++) {
          let col = [grid2048[0][c], grid2048[1][c], grid2048[2][c], grid2048[3][c]];
          col = truot2048(col);
          for (let r = 0; r < 4; r++) grid2048[r][c] = col[r];
        }
      } else if (huong === 'down') {
        for (let c = 0; c < 4; c++) {
          let col = [grid2048[3][c], grid2048[2][c], grid2048[1][c], grid2048[0][c]];
          col = truot2048(col);
          for (let r = 0; r < 4; r++) grid2048[3 - r][c] = col[r];
        }
      }

      if (JSON.stringify(grid2048) !== cu) {
        daThayDoi = true;
        sinhO2048();
        render2048();
      }
      return daThayDoi;
    }

    window.addEventListener('keydown', (e) => {
      const arena = document.getElementById('arena2048');
      if (!arena || arena.style.display === 'none' || !dangMoKhungChat) return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') diChuyen2048('left');
        if (e.key === 'ArrowRight') diChuyen2048('right');
        if (e.key === 'ArrowUp') diChuyen2048('up');
        if (e.key === 'ArrowDown') diChuyen2048('down');
      }
    });

    const board2048El = document.getElementById('board2048');
    if (board2048El) {
      let touchStartX = 0, touchStartY = 0;
      board2048El.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      board2048El.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.hypot(dx, dy) < 25) return;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) diChuyen2048('right');
          else diChuyen2048('left');
        } else {
          if (dy > 0) diChuyen2048('down');
          else diChuyen2048('up');
        }
      }, { passive: true });
    }

    // ==============================================================================
    // GAME ONLINE CỜ CARO — POLLING REALTIME QUA /api/game
    // ==============================================================================
    let _onlinePhongId = null;
    let _onlineMyId = null;
    let _onlinePollTimer = null;
    let _onlineMyTen = null;

    async function taiPhongOnline() {
      const roomList = document.getElementById('caroRoomList');
      if (roomList) roomList.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:12px;padding:16px;">Đang tải...</div>';
      try {
        const res = await fetch('/api/game?loai=co_caro');
        const data = await res.json();
        if (!data.ok) return;
        const ds = data.danhSachBan || [];
        if (roomList) {
          if (ds.length === 0) {
            roomList.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:12px;padding:12px;">Chưa có bàn nào. Hãy tạo bàn mới!</div>';
          } else {
            roomList.innerHTML = ds.map((p) => `
              <div class="caro-room-card">
                <div>
                  <div class="caro-room-name">${escapeHtml(p.tenBan)}</div>
                  <div style="font-size:10.5px;color:#64748b;margin-top:2px;">${escapeHtml(p.chuPhongTen)}${p.khachTen ? ` vs ${escapeHtml(p.khachTen)}` : ''}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                  <span class="caro-room-status">${p.trangThai === 'cho_nguoi' ? '⏳ Chờ' : '🟢 Đang chơi'}</span>
                  ${p.trangThai === 'cho_nguoi' ? `<button class="caro-join-btn" data-join-phong="${p.id}" type="button">▶ Vào chơi</button>` : ''}
                </div>
              </div>
            `).join('');
            roomList.querySelectorAll('[data-join-phong]').forEach((btn) => {
              btn.onclick = () => vaoPhong(Number(btn.dataset.joinPhong));
            });
          }
        }
      } catch { /* bỏ qua lỗi mạng */ }
    }

    async function taoPhongMoi() {
      const btn = document.getElementById('caroCreateRoomBtn');
      if (btn) btn.disabled = true;
      try {
        const res = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanhDong: 'tao_ban', loaiGame: 'co_caro' }),
        });
        const data = await res.json();
        if (!data.ok) { alert(data.loi || 'Không tạo được bàn.'); return; }
        const phong = data.phong;
        _onlinePhongId = phong.id;
        _onlineMyId = phong.chuPhongId;
        _onlineMyTen = phong.chuPhongTen;
        batDauPhienOnline(phong);
      } catch { alert('Lỗi kết nối khi tạo bàn.'); }
      finally { if (btn) btn.disabled = false; }
    }

    async function vaoPhong(phongId) {
      try {
        const res = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanhDong: 'vao_ban', phongId }),
        });
        const data = await res.json();
        if (!data.ok) { alert(data.loi || 'Không vào được bàn.'); return; }
        _onlinePhongId = phongId;
        // Lấy thông tin phòng để biết vai trò
        const infoRes = await fetch(`/api/game?phongId=${phongId}`);
        const infoData = await infoRes.json();
        if (!infoData.ok) return;
        const phong = infoData.phong;
        _onlineMyId = phong.khachId;
        _onlineMyTen = phong.khachTen;
        batDauPhienOnline(phong);
      } catch { alert('Lỗi kết nối khi vào bàn.'); }
    }

    function batDauPhienOnline(phong) {
      const lobby = document.getElementById('caroOnlineLobby');
      const vsBar = document.getElementById('caroVsBar');
      const boardWrapper = document.getElementById('caroBoardWrapper');
      if (lobby) lobby.style.display = 'none';
      if (vsBar) vsBar.style.display = 'flex';
      if (boardWrapper) boardWrapper.style.display = '';
      capNhatVsBar(phong);
      if (phong.banCo) {
        board = phong.banCo.map((row) => row.map((v) => v === 'X' ? 1 : (v === 'O' ? 2 : 0)));
      } else {
        board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
      }
      daKetThuc = phong.trangThai === 'ket_thuc' || phong.trangThai === 'hoa';
      renderCaroGrid();
      batDauPollOnline();
    }

    function capNhatVsBar(phong) {
      const p1El = document.getElementById('caroVsPlayer1');
      const p2El = document.getElementById('caroVsPlayer2');
      if (p1El) p1El.textContent = `🔴 ${escapeHtml(phong.chuPhongTen)} (X)`;
      if (p2El) p2El.textContent = phong.khachTen ? `⭕ ${escapeHtml(phong.khachTen)} (O)` : '⭕ Chờ đối thủ...';
      const st = document.getElementById('caroStatus');
      if (st) {
        if (phong.trangThai === 'cho_nguoi') {
          st.textContent = '⏳ Đang chờ đối thủ vào bàn...';
        } else if (phong.trangThai === 'ket_thuc') {
          st.textContent = phong.nguoiThangId === _onlineMyId ? '🎉 Bạn đã THẮNG!' : '😢 Bạn đã thua!';
        } else if (phong.trangThai === 'hoa') {
          st.textContent = '🤝 Hòa! Không ai thắng!';
        } else {
          const laLuotToi = phong.luotDiId === _onlineMyId;
          st.textContent = laLuotToi ? '⇐ Lượt của bạn!' : '⏳ Chờ bạn kia đánh...';
        }
      }
    }

    function batDauPollOnline() {
      dungPollOnline();
      _onlinePollTimer = setInterval(pollPhongOnline, 1200);
    }

    function dungPollOnline() {
      if (_onlinePollTimer) { clearInterval(_onlinePollTimer); _onlinePollTimer = null; }
    }

    async function pollPhongOnline() {
      if (!_onlinePhongId) return;
      try {
        const res = await fetch(`/api/game?phongId=${_onlinePhongId}`);
        const data = await res.json();
        if (!data.ok) return;
        const phong = data.phong;
        if (phong.banCo) {
          board = phong.banCo.map((row) => row.map((v) => v === 'X' ? 1 : (v === 'O' ? 2 : 0)));
          daKetThuc = phong.trangThai === 'ket_thuc' || phong.trangThai === 'hoa';
          renderCaroGrid();
        }
        capNhatVsBar(phong);
        if (phong.trangThai === 'huy') {
          dungPollOnline();
          alert('❌ Đối thủ đã rời bàn!');
          roiPhongOnline();
        }
        if (daKetThuc) dungPollOnline();
      } catch { /* bỏ qua lỗi mạng */ }
    }

    async function roiPhongOnline() {
      dungPollOnline();
      if (_onlinePhongId) {
        fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanhDong: 'roi_ban', phongId: _onlinePhongId }),
        }).catch(() => {});
      }
      _onlinePhongId = null;
      _onlineMyId = null;
      const lobby = document.getElementById('caroOnlineLobby');
      const vsBar = document.getElementById('caroVsBar');
      const boardWrapper = document.getElementById('caroBoardWrapper');
      if (lobby) { lobby.style.display = 'flex'; taiPhongOnline(); }
      if (vsBar) vsBar.style.display = 'none';
      if (boardWrapper) boardWrapper.style.display = 'none';
    }

    async function nuocDiOnline(r, c) {
      if (daKetThuc || !_onlinePhongId) return;
      if (board[r][c] !== 0) return;
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanhDong: 'danh_co', phongId: _onlinePhongId, r, c }),
        });
        await pollPhongOnline();
      } catch { /* bỏ qua */ }
    }

    async function vanMoiOnline() {
      if (!_onlinePhongId) return;
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanhDong: 'van_moi', phongId: _onlinePhongId }),
        });
        await pollPhongOnline();
      } catch { /* bỏ qua */ }
    }

    // Gắn sự kiện nút tạo/rời phòng
    const createRoomBtn = document.getElementById('caroCreateRoomBtn');
    if (createRoomBtn) createRoomBtn.onclick = taoPhongMoi;

    const leaveRoomBtn = document.getElementById('caroLeaveRoomBtn');
    if (leaveRoomBtn) leaveRoomBtn.onclick = roiPhongOnline;


    // Tạm dừng poll khi ẩn tab
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) dungPollOnline();
      else if (_onlinePhongId && cheDo === 'online') batDauPollOnline();
    });
  }

  function khoiTaoGiaoDien() {
    // 0. Lớp phủ nền (Backdrop) chặn toàn bộ tương tác của trang bên dưới khi chat mở
    const backdrop = document.createElement('div');
    backdrop.id = 'chatBackdrop';
    backdrop.className = 'chat-widget-backdrop';
    backdrop.addEventListener('click', (e) => {
      e.stopPropagation();
      dongKhungChat();
    });
    backdrop.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dongKhungChat();
    }, { passive: false });
    document.body.appendChild(backdrop);

    // 1. Nút bong bóng chat nổi đa năng
    const bubble = document.createElement('button');
    bubble.className = 'chat-widget-bubble';
    bubble.id = 'chatWidgetBubble';
    bubble.type = 'button';
    bubble.title = 'Bong bóng đa năng (Tán gẫu · Nhạc · Game)';
    bubble.setAttribute('aria-label', 'Mở bong bóng đa năng');
    bubble.innerHTML = `
      <span class="chat-bubble-icon">
        <svg class="chat-bubble-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Gamepad body -->
          <rect x="6" y="17" width="32" height="17" rx="8" fill="rgba(255,255,255,0.92)"/>
          <!-- D-pad left -->
          <rect x="11" y="22" width="6" height="2" rx="1" fill="#7c3aed"/>
          <rect x="13" y="20" width="2" height="6" rx="1" fill="#7c3aed"/>
          <!-- Buttons right -->
          <circle cx="29" cy="22" r="1.5" fill="#ec4899"/>
          <circle cx="33" cy="24" r="1.5" fill="#4f46e5"/>
          <circle cx="31" cy="27" r="1.5" fill="#10b981"/>
          <!-- Music note top -->
          <path d="M20 10 L27 8 L27 14 L24 14" stroke="rgba(255,255,255,0.9)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <circle cx="20" cy="13" r="2" fill="rgba(255,255,255,0.9)"/>
          <circle cx="24" cy="15" r="2" fill="rgba(255,255,255,0.9)"/>
          <!-- Chat bubble outline -->
          <path d="M14 7 Q8 7 8 12 Q8 17 14 17 L16 17 L15 20 L20 17 Q26 17 26 12 Q26 7 14 7 Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
        </svg>
      </span>
      <span class="chat-bubble-badge" id="chatUnreadBadge" style="display: none;">0</span>
    `;
    document.body.appendChild(bubble);

    // 2. Tạo cửa sổ khung đa năng (Tán gẫu, Nhạc YouTube, Chơi game)
    const windowEl = document.createElement('div');
    windowEl.className = 'chat-widget-window chat-hidden';
    windowEl.id = 'chatWidgetWindow';
    windowEl.innerHTML = `
      <div class="chat-window-header">
        <div class="chat-header-info">
          <div class="chat-header-top-row">
            <div class="chat-header-title" id="chatHeaderTitle">💬 Tán gẫu · Lớp học</div>
            <span class="chat-header-badge" id="chatRateBadge">⏱ 5s</span>
          </div>
          <div class="chat-header-sub" id="chatHeaderSub">
            <span class="chat-header-user-tag" id="chatHeaderUserTag">👤 Đang kết nối...</span>
            <span class="chat-header-class-switch" id="chatHeaderClassSwitch" style="display: none;"></span>
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-header-btn" id="chatTeacherSettingBtn" title="Cài đặt phòng chat" style="display: none;">⚙️</button>
          <button class="chat-header-btn chat-minimize-btn" id="chatCloseBtn" title="Thu nhỏ về bong bóng nổi" aria-label="Thu nhỏ về bong bóng">
            <span style="font-size: 16px; line-height: 1;">🫧</span>
          </button>
        </div>
      </div>

      <!-- THANH ĐIỀU HƯỚNG BONG BÓNG ĐA NĂNG (TÁN GẪU | NHẠC YOUTUBE | CHƠI GAME) -->
      <div class="chat-hub-nav" id="chatHubNav">
        <button class="chat-hub-tab-btn active" data-hub-tab="chat" type="button">
          <span class="hub-tab-icon">💬</span>
          <span class="hub-tab-label">Tán gẫu</span>
        </button>
        <button class="chat-hub-tab-btn" data-hub-tab="music" type="button">
          <span class="hub-tab-icon">🎵</span>
          <span class="hub-tab-label">Nhạc YouTube</span>
        </button>
        <button class="chat-hub-tab-btn" data-hub-tab="game" type="button">
          <span class="hub-tab-icon">🎮</span>
          <span class="hub-tab-label">Chơi game</span>
        </button>
      </div>

      <div class="chat-hub-panels-wrap">
        <!-- 1. TAB TÁN GẪU -->
        <div class="chat-hub-panel" id="chatHubChatPanel">
          <div class="chat-pinned-banner" id="chatPinnedBanner" style="display: none;"></div>
          <div class="chat-lock-banner" id="chatLockBanner" style="display: none;">⚠️ Giáo viên đang tạm khóa chat</div>

          <div class="chat-messages-container" id="chatMessagesContainer">
            <div style="text-align: center; color: #94a3b8; font-size: 12.5px; margin-top: 24px;">Đang tải tin nhắn...</div>
          </div>

          <div class="chat-emoji-drawer" id="chatEmojiDrawer" style="display: none;"></div>

          <div class="chat-window-footer" id="chatWindowFooter">
            <div class="chat-input-row">
              <button class="chat-emoji-toggle" id="chatEmojiToggleBtn" title="Chọn biểu tượng cảm xúc" type="button">😊</button>
              <input type="text" class="chat-input-field" id="chatInputField" placeholder="Nhập tin nhắn..." maxlength="300" autocomplete="off" />
              <button class="chat-send-btn" id="chatSendBtn" type="button">Gửi</button>
            </div>
            <div class="chat-rate-hint" id="chatRateHint">Chỉ gửi chữ & icon • Giãn cách 5s</div>
          </div>
        </div>

        <!-- 2. TAB NHẠC YOUTUBE MINI -->
        <div class="chat-hub-panel hub-panel-music panel-hidden" id="chatHubMusicPanel">
          <div class="music-hub-header">
            <div class="music-hub-title">🎵 Phòng nghe nhạc Lớp 10A7</div>
            <div class="music-hub-desc">Nhạc lofi, chill, acoustic & video YouTube tự chọn</div>
          </div>

          <div class="music-preset-chips" id="musicPresetChips">
            <button class="music-chip active" type="button" data-yt-id="jfKfPfyJRdk" data-yt-title="Lofi Hip Hop Chill Học Bài">
              ☕ Lofi Học Bài
            </button>
            <button class="music-chip" type="button" data-yt-id="4xDzrJKXOOY" data-yt-title="Acoustic Guitar Thư Giãn">
              🎸 Acoustic Guitar
            </button>
            <button class="music-chip" type="button" data-yt-id="WPni755-Krg" data-yt-title="Tiếng Mưa Rơi & Piano">
              🌧️ Mưa & Piano
            </button>
            <button class="music-chip" type="button" data-yt-id="mIYzp5rcTvU" data-yt-title="Không Lời Nâng Cao Tập Trung">
              📚 Nhạc Focus
            </button>
          </div>

          <div class="music-custom-row">
            <input type="text" class="music-input" id="musicCustomInput" placeholder="Dán link hoặc ID video YouTube (vd: jfKfPfyJRdk)..." />
            <button class="music-play-btn" id="musicPlayCustomBtn" type="button">▶ Phát</button>
          </div>

          <div class="music-player-wrapper">
            <iframe id="musicIframe"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1&origin=https://gdtxdinhquan.pages.dev"
              title="YouTube Music Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>

          <div class="music-now-playing" id="musicNowPlaying">
            <div class="music-eq-bars"><span></span><span></span><span></span></div>
            <span id="musicTrackTitle">Đang sẵn sàng: Lofi Hip Hop Chill Học Bài</span>
          </div>

          <div class="music-bg-notice">
            💡 <strong>Mẹo hay:</strong> Bạn có thể chuyển sang tab <strong>Tán gẫu</strong> hoặc <strong>Chơi game</strong>, âm nhạc vẫn tiếp tục phát nền mượt mà!
          </div>
        </div>

        <!-- 3. TAB CHƠI GAME GIẢI TRÍ -->
        <div class="chat-hub-panel hub-panel-game panel-hidden" id="chatHubGamePanel">
          <div class="game-hub-header">
            <div class="game-hub-top-row">
              <div class="game-hub-title" id="gameHubTitle">🎮 Trò chơi giải trí Lớp 10A7</div>
              <button class="game-back-btn" id="gameBackToMenuBtn" type="button" style="display: none;">← Đổi game khác</button>
            </div>
            <div class="game-hub-desc" id="gameHubDesc">Giải trí lành mạnh, thư giãn thông minh cùng bạn bè</div>
          </div>

          <!-- Sảnh chọn game -->
          <div class="game-selector-grid" id="gameSelectorGrid">
            <div class="game-card" id="cardStartCaro">
              <div class="game-card-icon">⭕❌</div>
              <div class="game-card-info">
                <div class="game-card-name">Cờ Caro (Gomoku) 15x15</div>
                <div class="game-card-desc">Đấu trí 5 quân cờ liên tiếp với Máy AI thông minh hoặc 2 bạn bè cùng chơi</div>
                <span class="game-card-badge">Đấu trí 1v1 & AI</span>
              </div>
              <button class="game-card-play-btn" type="button">Chơi ngay</button>
            </div>

            <div class="game-card" id="cardStart2048">
              <div class="game-card-icon">🔢</div>
              <div class="game-card-info">
                <div class="game-card-name">2048 Siêu Trí Tuệ</div>
                <div class="game-card-desc">Ghép các ô số đạt mốc 2048 kỷ lục. Vuốt mượt trên mobile & phím mũi tên PC</div>
                <span class="game-card-badge">Thư giãn tư duy</span>
              </div>
              <button class="game-card-play-btn" type="button">Chơi ngay</button>
            </div>
          </div>

          <!-- Khu vực Cờ Caro -->
          <div class="game-arena caro-arena" id="caroArena" style="display: none;">
            <div class="caro-controls">
              <div class="caro-status" id="caroStatus">Lượt: 🔵 X (Bạn)</div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button class="caro-mode-btn" id="caroModeBtn" type="button">Chế độ: Đấu với Máy</button>
                <button class="caro-reset-btn" id="caroResetBtn" type="button">Ván mới</button>
              </div>
            </div>
            <!-- Sảnh đấu Online (hiện khi chọn chế độ Online) -->
            <div class="caro-online-lobby" id="caroOnlineLobby" style="display: none;">
              <div class="caro-lobby-header">
                <span class="caro-lobby-title">🌐 Sảnh đấu Online · Lớp 10A7</span>
                <button class="caro-create-room-btn" id="caroCreateRoomBtn" type="button">➕ Tạo bàn mới</button>
              </div>
              <div class="caro-room-list" id="caroRoomList">
                <div style="text-align:center;color:#94a3b8;font-size:12px;padding:16px;">Đang tải danh sách bàn...</div>
              </div>
            </div>
            <!-- Thanh trạng thái vs khi đang trong phòng online -->
            <div class="caro-vs-bar" id="caroVsBar" style="display: none;">
              <span id="caroVsPlayer1">🔴 ...</span>
              <span style="color:#94a3b8">VS</span>
              <span id="caroVsPlayer2">⭕ Chờ đối thủ...</span>
              <button class="game-back-btn" id="caroLeaveRoomBtn" type="button" style="font-size:10.5px;padding:3px 8px;">↩ Rời bàn</button>
            </div>
            <div class="caro-board-wrapper" id="caroBoardWrapper">
              <div class="caro-grid" id="caroGrid"></div>
            </div>
          </div>

          <!-- Khu vực Game 2048 -->
          <div class="game-arena arena-2048" id="arena2048" style="display: none;">
            <div class="game-2048-top">
              <div class="score-boxes">
                <div class="score-box">
                  <div class="score-box-title">ĐIỂM</div>
                  <div class="score-box-val" id="score2048Val">0</div>
                </div>
                <div class="score-box">
                  <div class="score-box-title">KỶ LỤC</div>
                  <div class="score-box-val" id="best2048Val">0</div>
                </div>
              </div>
              <button class="btn-2048-new" id="btn2048New" type="button">Chơi lại</button>
            </div>
            <div class="board-2048" id="board2048"></div>
          </div>
        </div>
      </div>

      <div class="chat-teacher-modal" id="chatTeacherModal" style="display: none;"></div>
    `;
    document.body.appendChild(windowEl);

    // 3. Khởi tạo khay Emoji nâng cao với nhiều chủ đề
    const emojiDrawer = document.getElementById('chatEmojiDrawer');
    emojiDrawer.innerHTML = `
      <div class="chat-emoji-tabs" id="chatEmojiTabs"></div>
      <div class="chat-emoji-grid" id="chatEmojiGrid"></div>
    `;

    const tabsContainer = document.getElementById('chatEmojiTabs');
    const gridContainer = document.getElementById('chatEmojiGrid');

    function renderEmojiGrid(catId) {
      const cat = EMOJI_CATEGORIES.find((c) => c.id === catId) || EMOJI_CATEGORIES[0];
      gridContainer.innerHTML = '';
      cat.icons.forEach((emoji) => {
        const btn = document.createElement('button');
        btn.className = 'chat-emoji-btn';
        btn.textContent = emoji;
        btn.type = 'button';
        btn.title = emoji;

        // Desktop: ngăn button cướp focus/selection của ô nhập
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); });

        // Click / Tap: chọn emoji nhạy bén trên cả di động và máy tính
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const input = document.getElementById('chatInputField');
          if (input) {
            // Chèn icon vào cuối ô nhập mà không focus để không kích hoạt bàn phím ảo
            input.value += emoji;
            try { input.blur(); } catch {}
          }
        });
        gridContainer.appendChild(btn);
      });

      tabsContainer.querySelectorAll('.chat-emoji-tab-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.cat === cat.id);
      });
    }

    EMOJI_CATEGORIES.forEach((cat, idx) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `chat-emoji-tab-btn ${idx === 0 ? 'active' : ''}`;
      tabBtn.dataset.cat = cat.id;
      tabBtn.textContent = cat.ten;
      tabBtn.type = 'button';
      tabBtn.addEventListener('mousedown', (e) => { e.preventDefault(); });
      tabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('chatInputField');
        if (input) { try { input.blur(); } catch {} }
        renderEmojiGrid(cat.id);
      });
      tabsContainer.appendChild(tabBtn);
    });

    renderEmojiGrid(EMOJI_CATEGORIES[0].id);

    // 4. Event delegation cho Xoá tin & Cấm HS & Nút xóa phía tôi (PC) trong danh sách tin nhắn
    const msgContainer = document.getElementById('chatMessagesContainer');
    msgContainer.addEventListener('click', (e) => {
      // Giáo viên: xoá tin khỏi DB
      const xoaBtn = e.target.closest('[data-xoa-tin]');
      if (xoaBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.chatWidgetXoaTin(Number(xoaBtn.dataset.xoaTin));
        return;
      }
      // Giáo viên: cấm học sinh chat
      const camBtn = e.target.closest('[data-cam-hs]');
      if (camBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.chatWidgetCamHs(Number(camBtn.dataset.camHs), camBtn.dataset.ten || '');
        return;
      }
      // Học sinh (PC): nút X nhỏ xóa phía tôi
      const ownDelBtn = e.target.closest('[data-xoa-phia-toi]');
      if (ownDelBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.chatWidgetXoaPhiaToi(Number(ownDelBtn.dataset.xoaPhiaToi));
        return;
      }
    });

    // Mobile: Chạm 1 lần (tap nhanh, không cuộn) để mở menu hành động cho tin nhắn của học sinh
    let _tapStartY = 0;
    let _tapStartX = 0;
    let _tapMoved = false;
    msgContainer.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      _tapStartX = touch.clientX;
      _tapStartY = touch.clientY;
      _tapMoved = false;
    }, { passive: true });

    msgContainer.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - _tapStartX;
      const dy = touch.clientY - _tapStartY;
      if (Math.hypot(dx, dy) > 8) _tapMoved = true;
    }, { passive: true });

    msgContainer.addEventListener('touchend', (e) => {
      if (_tapMoved) return; // bỏ qua nếu học sinh đang cuộn
      const row = e.target.closest('[data-own-msg]');
      if (!row || laGiaoVien) return;
      // Không chặn nút corner-del xử lý riêng qua click delegation
      if (e.target.closest('.chat-bubble-corner-del')) return;
      e.preventDefault();
      const tinId = Number(row.dataset.ownMsg);
      const touch = e.changedTouches[0];
      window.chatWidgetHienThiMenuTin(tinId, touch.clientX, touch.clientY);
    }, { passive: false });

    // Bấm ra ngoài để đóng context menu
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('chatMsgContextMenu');
      if (menu && !menu.contains(e.target)) window.chatWidgetAnMenuTin();
    }, { passive: true });

    // 5. Kích hoạt kéo thả tự do & lưu vị trí cho bong bóng nổi
    khoiTaoKeoThaBongBong(bubble);

    // Thu nhỏ về bong bóng nổi (thay cho dấu X)
    const closeBtn = document.getElementById('chatCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dongKhungChat();
      });
    }

    // Chuyển đổi giữa các tab đa năng: Tán gẫu | Nhạc YouTube | Chơi game
    function chuyenTab(tabKey) {
      tabHienTai = tabKey;
      const tabs = document.querySelectorAll('.chat-hub-tab-btn');
      tabs.forEach((b) => b.classList.toggle('active', b.dataset.hubTab === tabKey));

      const chatPanel = document.getElementById('chatHubChatPanel');
      const musicPanel = document.getElementById('chatHubMusicPanel');
      const gamePanel = document.getElementById('chatHubGamePanel');

      if (chatPanel) chatPanel.classList.toggle('panel-hidden', tabKey !== 'chat');
      if (musicPanel) musicPanel.classList.toggle('panel-hidden', tabKey !== 'music');
      if (gamePanel) gamePanel.classList.toggle('panel-hidden', tabKey !== 'game');

      if (tabKey === 'chat') {
        cuonXuongDuoi();
      }
    }

    const hubNav = document.getElementById('chatHubNav');
    if (hubNav) {
      hubNav.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('[data-hub-tab]');
        if (!tabBtn) return;
        e.preventDefault();
        e.stopPropagation();
        chuyenTab(tabBtn.dataset.hubTab);
      });
    }

    // Khởi tạo các tiện ích Nhạc và Game Hub
    khoiTaoNhacYouTube();
    khoiTaoGameHub();

    const emojiToggleBtn = document.getElementById('chatEmojiToggleBtn');
    emojiToggleBtn.addEventListener('mousedown', (e) => { e.preventDefault(); });
    emojiToggleBtn.addEventListener('click', (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const input = document.getElementById('chatInputField');
      if (input) { try { input.blur(); } catch {} }
      const d = document.getElementById('chatEmojiDrawer');
      if (!d) return;
      const seHienThi = d.style.display === 'none' || !d.style.display;
      d.style.display = seHienThi ? 'flex' : 'none';
      if (seHienThi) cuonXuongDuoi();
    });

    const inputField = document.getElementById('chatInputField');
    // Khi người dùng bấm trực tiếp vào ô nhập để gõ chữ: ẩn khay emoji để nhường chỗ cho bàn phím ảo
    inputField.addEventListener('focus', () => {
      const d = document.getElementById('chatEmojiDrawer');
      if (d) d.style.display = 'none';
    });
    inputField.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        guiTinNhan();
      }
    };

    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) {
      sendBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        guiTinNhan();
      };
      sendBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        guiTinNhan();
      }, { passive: false });
    }

    const teacherSettingBtn = document.getElementById('chatTeacherSettingBtn');
    if (teacherSettingBtn) {
      teacherSettingBtn.onclick = moCaiDatGiaoVien;
    }

    // Tự động co giãn theo bàn phím ảo trên điện thoại (Visual Viewport API) một cách an toàn
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (dangMoKhungChat && window.innerWidth <= 600) {
          const vh = window.visualViewport.height;
          const fullH = window.innerHeight;
          // Chỉ điều chỉnh chiều cao khi bàn phím ảo thực sự bật lên (chiều cao giảm đáng kể > 150px)
          if (vh < fullH - 150) {
            windowEl.style.height = `${vh}px`;
          } else {
            windowEl.style.height = '';
          }
          cuonXuongDuoi();
        }
      });
    }

    // Tạm dừng polling khi chuyển tab để tiết kiệm pin & mạng
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        dungPolling();
      } else {
        khoiDongPolling();
      }
    });

    // Tải tin nhắn lần đầu
    taiTinNhan(true);
    khoiDongPolling();
  }

  function moKhungChat() {
    const win = document.getElementById('chatWidgetWindow');
    const bubble = document.getElementById('chatWidgetBubble');
    const backdrop = document.getElementById('chatBackdrop');

    dangMoKhungChat = true;
    cuonTrangY = window.scrollY || document.documentElement.scrollTop || 0;

    win.classList.remove('chat-hidden');

    // Ẩn nút bong bóng khi đang mở khung chat
    if (bubble) bubble.style.display = 'none';

    // Bật backdrop và khoá cuộn trang web bên dưới
    if (backdrop) backdrop.classList.add('chat-backdrop-active');
    document.body.classList.add('chat-modal-open');

    tinChuaDoc = 0;
    capNhatBadge();
    if (tabHienTai === 'chat') {
      cuonXuongDuoi();
    }

    // Ẩn khay emoji và đảm bảo KHÔNG tự động bật bàn phím ảo
    const d = document.getElementById('chatEmojiDrawer');
    if (d) d.style.display = 'none';

    const input = document.getElementById('chatInputField');
    if (input) {
      try { input.blur(); } catch {}
    }

    taiTinNhan(false);
    khoiDongPolling();
  }

  function dongKhungChat() {
    const win = document.getElementById('chatWidgetWindow');
    const bubble = document.getElementById('chatWidgetBubble');
    const backdrop = document.getElementById('chatBackdrop');

    dangMoKhungChat = false;
    win.classList.add('chat-hidden');
    win.style.height = '';

    // Hiện lại nút bong bóng chat
    if (bubble) bubble.style.display = 'flex';

    // Tắt backdrop và giải phóng khoá cuộn trang web
    if (backdrop) backdrop.classList.remove('chat-backdrop-active');
    document.body.classList.remove('chat-modal-open');

    // Khôi phục vị trí cuộn trang trước đó
    if (cuonTrangY) {
      window.scrollTo(0, cuonTrangY);
    }

    const d = document.getElementById('chatEmojiDrawer');
    if (d) d.style.display = 'none';
    const tm = document.getElementById('chatTeacherModal');
    if (tm) tm.style.display = 'none';

    const input = document.getElementById('chatInputField');
    if (input) {
      try { input.blur(); } catch {}
    }

    khoiDongPolling();
  }

  function capNhatBadge() {
    const badge = document.getElementById('chatUnreadBadge');
    if (!badge) return;
    if (tinChuaDoc > 0 && !dangMoKhungChat) {
      badge.textContent = tinChuaDoc > 99 ? '99+' : tinChuaDoc;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function cuonXuongDuoi() {
    const c = document.getElementById('chatMessagesContainer');
    if (c) {
      setTimeout(() => { c.scrollTop = c.scrollHeight; }, 60);
    }
  }

  // Cập nhật giao diện tin nhắn đã xoá trong DOM tức thì
  function capNhatTinDaXoaTrongDom(tinId) {
    const row = document.getElementById(`chatMsg_${tinId}`);
    if (!row) return;

    const wrap = row.querySelector('.chat-msg-bubble-wrap');
    const bubbleEl = wrap ? wrap.querySelector('.chat-msg-bubble') : row.querySelector('.chat-msg-bubble');
    if (bubbleEl) {
      bubbleEl.textContent = '[Tin nhắn đã bị xoá]';
      bubbleEl.classList.add('chat-msg-deleted');
    }

    // Xoá nút ✕ góc khỏi DOM
    const cornerBtn = row.querySelector('.chat-bubble-corner-del');
    if (cornerBtn) cornerBtn.remove();
    // Xóa data-own-msg để không hiện menu nữa
    delete row.dataset.ownMsg;
  }

  // Chuyển đổi định dạng chữ cho thông báo ghim (**đậm**, *nghiêng*, <u>gạch chân</u>, [do], [vang], [xanh])
  function formatThongBaoGhim(str) {
    if (!str) return '';
    let html = escapeHtml(str);
    // In đậm: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // In nghiêng: *text*
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Gạch chân: <u>text</u>
    html = html.replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/gi, '<span style="text-decoration: underline;">$1</span>');
    // Màu sắc: [do], [vang], [xanh]
    html = html.replace(/\[(?:red|do)\](.+?)\[\/(?:red|do)\]/gi, '<span style="color:#dc2626;font-weight:700;">$1</span>');
    html = html.replace(/\[(?:yellow|vang)\](.+?)\[\/(?:yellow|vang)\]/gi, '<span style="color:#d97706;font-weight:700;">$1</span>');
    html = html.replace(/\[(?:green|xanh)\](.+?)\[\/(?:green|xanh)\]/gi, '<span style="color:#16a34a;font-weight:700;">$1</span>');
    return html;
  }

  async function taiTinNhan(laLanDau = false) {
    try {
      // Khi tải lại từ đầu (làm mới / chuyển lớp / sau khi xoá), reset về 0 để lấy đủ danh sách mới nhất
      if (laLanDau) {
        tinNhanCuoiId = 0;
      }

      const res = await fetch(`/api/chat?sauId=${tinNhanCuoiId}&lopId=${lopIdHienTai}&_t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (res.status === 401) {
        const bubble = document.getElementById('chatWidgetBubble');
        if (bubble) bubble.style.display = 'none';
        dungPolling();
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      if (!data.ok) return;

      laGiaoVien = !!data.laGiaoVien;
      hocSinhIdHienTai = data.hocSinhIdHienTai;
      caiDatHienTai = data.caiDat || caiDatHienTai;
      gianCachGiay = caiDatHienTai.gianCachGiay || 5;
      if (data.lopId) lopIdHienTai = data.lopId;

      // Cập nhật tên lớp trên tiêu đề khung chat
      const titleEl = document.getElementById('chatHeaderTitle') || document.querySelector('.chat-header-title');
      if (titleEl && data.tenLop) {
        titleEl.textContent = `💬 Tán gẫu · ${data.tenLop}`;
      }

      // Cập nhật thông tin người dùng đang chat
      const userTagEl = document.getElementById('chatHeaderUserTag');
      if (userTagEl && data.tenHienTai) {
        userTagEl.textContent = `👤 Bạn: ${data.tenHienTai}`;
        userTagEl.title = `Đang tham gia với tên: ${data.tenHienTai}`;
      }

      // Cập nhật bộ chuyển đổi lớp học nhanh cho Giáo viên
      const switchContainer = document.getElementById('chatHeaderClassSwitch');
      if (switchContainer) {
        if (laGiaoVien && Array.isArray(data.cacLop) && data.cacLop.length > 1) {
          switchContainer.style.display = 'inline-flex';
          switchContainer.innerHTML = '';
          data.cacLop.forEach((lop) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `chat-class-btn ${lop.id === lopIdHienTai ? 'active' : ''}`;
            btn.textContent = lop.ten.replace('Lớp ', '');
            btn.title = `Chuyển xem phòng chat ${lop.ten}`;
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (lopIdHienTai !== lop.id) {
                lopIdHienTai = lop.id;
                const container = document.getElementById('chatMessagesContainer');
                if (container) container.innerHTML = '<div style="text-align: center; color: #94a3b8; font-size: 12.5px; margin-top: 24px;">Đang tải tin nhắn...</div>';
                taiTinNhan(true);
              }
            };
            switchContainer.appendChild(btn);
          });
        } else {
          switchContainer.style.display = 'none';
        }
      }

      // Đồng bộ các tin đã bị xoá tức thì qua danh sách daXoaIds
      if (Array.isArray(data.daXoaIds) && data.daXoaIds.length > 0) {
        data.daXoaIds.forEach((id) => capNhatTinDaXoaTrongDom(id));
      }

      // Cập nhật quyền giáo viên trên header
      const settingBtn = document.getElementById('chatTeacherSettingBtn');
      const rateBadge = document.getElementById('chatRateBadge');
      if (laGiaoVien) {
        if (settingBtn) settingBtn.style.display = 'flex';
        if (rateBadge) rateBadge.textContent = `⏱ ${gianCachGiay}s (GV)`;
      } else {
        if (settingBtn) settingBtn.style.display = 'none';
        if (rateBadge) rateBadge.textContent = `⏱ ${gianCachGiay}s`;
      }
      const rateHint = document.getElementById('chatRateHint');
      if (rateHint) rateHint.textContent = `Chỉ gửi chữ & icon • Giãn cách ${gianCachGiay}s`;

      // Cập nhật thông báo ghim & khoá chat
      const banner = document.getElementById('chatPinnedBanner');
      if (banner) {
        if (caiDatHienTai.thongBaoGhim) {
          banner.innerHTML = `<span style="flex-shrink: 0; font-size: 13.5px;">📌</span><span style="flex: 1;">${formatThongBaoGhim(caiDatHienTai.thongBaoGhim)}</span>`;
          banner.style.display = 'flex';
        } else {
          banner.style.display = 'none';
        }
      }

      const lockBanner = document.getElementById('chatLockBanner');
      const footer = document.getElementById('chatWindowFooter');
      if (!laGiaoVien && !caiDatHienTai.dangMo) {
        if (lockBanner) {
          lockBanner.textContent = '⚠️ Giáo viên đang tạm khóa chat';
          lockBanner.style.display = 'block';
        }
        if (footer) {
          footer.style.opacity = '0.5';
          footer.style.pointerEvents = 'none';
        }
      } else if (data.biCamChat) {
        if (lockBanner) {
          lockBanner.textContent = `⚠️ Bạn đang bị cấm chat: ${data.lyDoCam || 'Vi phạm nội quy'}`;
          lockBanner.style.display = 'block';
        }
        if (footer) {
          footer.style.opacity = '0.5';
          footer.style.pointerEvents = 'none';
        }
      } else {
        if (lockBanner) lockBanner.style.display = 'none';
        if (footer) {
          footer.style.opacity = '1';
          footer.style.pointerEvents = 'auto';
        }
      }

      // Đổ tin nhắn mới vào danh sách
      const tinMoi = data.tinNhan || [];
      const container = document.getElementById('chatMessagesContainer');
      if (!container) return;

      if (tinMoi.length > 0) {
        const emptyEl = document.getElementById('chatEmptyPlaceholder');
        if (emptyEl) emptyEl.remove();

        if (laLanDau) {
          container.innerHTML = '';
        }

        let coTinMoiThat = false;
        tinMoi.forEach((t) => {
          if (t.id > tinNhanCuoiId) {
            tinNhanCuoiId = t.id;
            coTinMoiThat = true;
            themTinNhanVaoDom(t, container);
          }
        });

        if (coTinMoiThat) {
          if (dangMoKhungChat) {
            cuonXuongDuoi();
          } else if (!laLanDau) {
            tinChuaDoc += tinMoi.length;
            capNhatBadge();
          }
        }
      } else if (laLanDau && container.children.length === 0) {
        container.innerHTML = '<div id="chatEmptyPlaceholder" style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 32px;">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên! 👋</div>';
      }
    } catch (e) {
      console.warn('Lỗi tải chat:', e);
    }
  }

  function themTinNhanVaoDom(t, container) {
    const emptyEl = document.getElementById('chatEmptyPlaceholder');
    if (emptyEl) emptyEl.remove();

    const row = document.createElement('div');
    row.id = `chatMsg_${t.id}`;
    row.dataset.msgId = t.id;

    const laTinCuaToi = (typeof t.laTinCuaToi === 'boolean')
      ? t.laTinCuaToi
      : ((!laGiaoVien && hocSinhIdHienTai && t.hocSinhId === hocSinhIdHienTai) || (laGiaoVien && t.vaiTro === 'giao_vien'));
    const laHeThong = t.vaiTro === 'he_thong';
    const laGvcn = t.vaiTro === 'giao_vien';
    const daBiXoa = !!t.daXoa;

    if (laHeThong) {
      row.className = 'chat-msg-row msg-system';
      row.innerHTML = `<div class="chat-msg-bubble">${escapeHtml(t.noiDung)}</div>`;
    } else {
      row.className = `chat-msg-row ${laTinCuaToi ? 'msg-mine' : 'msg-other'} ${laGvcn ? 'msg-gv' : ''}`;

      // Nút ✕ góc trên bên phải của BUBBLE (giáo viên xoá mọi tin; học sinh xoá tin mình)
      // Thiết kế: nhỏ 16x16, mờ, chỉ nổi lên khi hover vào hàng tin — đẹp và thẩm mỹ
      let cornerDelBtn = '';
      if (laGiaoVien && !daBiXoa) {
        cornerDelBtn = `<button class="chat-bubble-corner-del" data-xoa-tin="${t.id}" title="Xoá tin nhắn này" aria-label="Xoá tin nhắn">✕</button>`;
      } else if (!laGiaoVien && laTinCuaToi && !daBiXoa) {
        cornerDelBtn = `<button class="chat-bubble-corner-del chat-bubble-own-del" data-xoa-phia-toi="${t.id}" title="Tuỳ chọn tin nhắn" aria-label="Xoá/Thu hồi">✕</button>`;
        row.dataset.ownMsg = t.id; // đánh dấu để single-tap mobile nhận diện
      }

      let authorHtml = '';
      if (!laTinCuaToi) {
        const camAttr = (laGiaoVien && t.hocSinhId)
          ? `data-cam-hs="${t.hocSinhId}" data-ten="${escapeAttr(t.tenNguoiGui)}" style="cursor:pointer;text-decoration:underline;" title="Bấm để cấm chat"`
          : '';
        authorHtml = `
          <div class="chat-msg-author">
            <span ${camAttr}>
              ${escapeHtml(t.tenNguoiGui)}
              ${laGvcn ? '<span class="badge-gv">GVCN</span>' : ''}
            </span>
          </div>
        `;
      }

      let thoiGianStr = '';
      if (t.taoLuc) {
        const d = new Date(t.taoLuc.replace(' ', 'T') + 'Z');
        if (!Number.isNaN(d.getTime())) {
          thoiGianStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }

      const footerHtml = thoiGianStr ? `<div class="chat-msg-time">${thoiGianStr}</div>` : '';

      // Giáo viên xem tin đã thu hồi: thấy nội dung gốc với nhãn "Thu hồi"
      // Học sinh: thấy bong bóng mờ [Tin nhắn đã bị xoá]
      const bubbleClass = daBiXoa
        ? (laGiaoVien ? 'chat-msg-recalled-gv' : 'chat-msg-deleted')
        : '';

      // Bọc bubble trong wrapper có position:relative để nút ✕ anchor đúng góc
      row.innerHTML = `
        ${authorHtml}
        <div class="chat-msg-bubble-wrap" style="position:relative;display:inline-block;max-width:100%;">
          ${cornerDelBtn}
          <div class="chat-msg-bubble ${bubbleClass}">${escapeHtml(t.noiDung)}</div>
        </div>
        ${footerHtml}
      `;
    }

    container.appendChild(row);
  }

  async function guiTinNhan() {
    if (dangGui || demNguocGiay > 0) return;

    const input = document.getElementById('chatInputField');
    if (!input) return;
    const noiDung = input.value.trim();
    if (!noiDung) return;

    dangGui = true;
    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '...';
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noiDung, lopId: lopIdHienTai }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.loi || 'Không gửi được tin nhắn.');
        return;
      }

      input.value = '';
      const d = document.getElementById('chatEmojiDrawer');
      if (d) d.style.display = 'none';

      // Kích hoạt Rate Limit Countdown cho học sinh
      if (!laGiaoVien) {
        batDauDemNguoc(gianCachGiay);
      }

      // Đưa ngay tin nhắn vừa gửi vào DOM nếu có để người gửi thấy tức thì (0ms latency)
      if (data.tinNhan) {
        if (data.tinNhan.id > tinNhanCuoiId) {
          tinNhanCuoiId = data.tinNhan.id;
        }
        themTinNhanVaoDom(data.tinNhan, document.getElementById('chatMessagesContainer'));
        cuonXuongDuoi();
      }

      // Tải ngay tin mới từ server
      await taiTinNhan(false);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      alert('Lỗi kết nối khi gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      dangGui = false;
      if (sendBtn && demNguocGiay <= 0) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Gửi';
      }
    }
  }

  function batDauDemNguoc(giay) {
    demNguocGiay = giay;
    const sendBtn = document.getElementById('chatSendBtn');
    if (!sendBtn) return;
    sendBtn.disabled = true;

    if (demNguocTimer) clearInterval(demNguocTimer);
    sendBtn.textContent = `${demNguocGiay}s`;

    demNguocTimer = setInterval(() => {
      demNguocGiay--;
      if (demNguocGiay <= 0) {
        clearInterval(demNguocTimer);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Gửi';
      } else {
        sendBtn.textContent = `${demNguocGiay}s`;
      }
    }, 1000);
  }

  function khoiDongPolling() {
    dungPolling();
    // Khi đang mở khung chat: thăm dò mỗi 1s để gần real-time; khi đóng: mỗi 4s để cập nhật badge nhanh
    const chuKy = dangMoKhungChat ? 1000 : 4000;
    pollingTimer = setInterval(() => {
      taiTinNhan(false);
    }, chuKy);
  }

  function dungPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  // ================= CÔNG CỤ QUẢN TRỊ CHO GIÁO VIÊN =================

  // Thao tác chèn định dạng chữ vào ô textarea thông báo ghim
  function chenDinhDangVaoTextarea(ta, tool) {
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const val = ta.value;
    const sel = val.substring(start, end);
    let before = '', after = '', insert = '';

    switch (tool) {
      case 'bold':
        before = '**'; after = '**'; insert = sel || 'chữ đậm';
        break;
      case 'italic':
        before = '*'; after = '*'; insert = sel || 'chữ nghiêng';
        break;
      case 'underline':
        before = '<u>'; after = '</u>'; insert = sel || 'gạch chân';
        break;
      case 'color-red':
        before = '[do]'; after = '[/do]'; insert = sel || 'chữ đỏ';
        break;
      case 'color-yellow':
        before = '[vang]'; after = '[/vang]'; insert = sel || 'chữ vàng';
        break;
      case 'color-green':
        before = '[xanh]'; after = '[/xanh]'; insert = sel || 'chữ xanh';
        break;
      case 'icon-warning': insert = '⚠️ '; break;
      case 'icon-bell': insert = '📢 '; break;
      case 'icon-clock': insert = '⏰ '; break;
      case 'icon-task': insert = '📝 '; break;
      case 'icon-star': insert = '⭐ '; break;
      default: return;
    }

    const replacement = before + insert + after;
    ta.value = val.substring(0, start) + replacement + val.substring(end);
    ta.focus();
    if (sel.length > 0) {
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    } else {
      const newCursor = start + before.length + insert.length;
      ta.setSelectionRange(newCursor, newCursor);
    }
  }

  async function moCaiDatGiaoVien() {
    const modal = document.getElementById('chatTeacherModal');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #64748b;">
        <div style="width: 28px; height: 28px; border: 3px solid #2563eb; border-top-color: transparent; border-radius: 50%; animation: chatSpin 0.7s linear infinite;"></div>
        <span style="font-size: 13.5px; font-weight: 500;">Đang tải dữ liệu quản trị...</span>
      </div>
    `;

    try {
      const res = await fetch('/api/gv/chat-quan-ly');
      const data = await res.json();
      if (!data.ok) {
        modal.innerHTML = `<div style="color: #dc2626; padding: 20px; font-size: 13.5px; text-align: center;">⚠️ ${escapeHtml(data.loi)}</div>`;
        return;
      }

      const cd = data.caiDat;
      const danhSachCam = data.danhSachCam || [];

      let camRows = `<p style="color: #94a3b8; font-size: 12.5px; margin: 8px 0; text-align: center;">Hiện không có học sinh nào bị cấm chat.</p>`;
      if (danhSachCam.length > 0) {
        camRows = danhSachCam.map((hs) => `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 9px 12px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #fecaca; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${escapeHtml(hs.hoTen)}</div>
              <div style="font-size: 11.5px; color: #dc2626; margin-top: 2px;">Lý do: ${escapeHtml(hs.lyDo || 'Vi phạm nội quy')}</div>
            </div>
            <button data-mo-cam-hs="${hs.hocSinhId}" type="button" style="background: #10b981; color: #ffffff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0; transition: background 0.15s ease;">Mở cấm</button>
          </div>
        `).join('');
      }

      modal.innerHTML = `
        <div class="chat-modal-inner">
          <div class="chat-modal-topbar">
            <div class="chat-modal-topbar-title">
              <span style="font-size: 18px;">⚙️</span>
              <span>Quản lý phòng tán gẫu</span>
              <span class="chat-modal-topbar-badge">GVCN</span>
            </div>
            <button id="chatTeacherModalCloseBtn" class="chat-modal-close-btn" title="Đóng bảng quản lý" aria-label="Đóng">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 1.5l11 11M12.5 1.5L1.5 12.5" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="chat-modal-body">
            <div class="chat-setting-group">
              <label>🟢 Trạng thái phòng chat</label>
              <select id="chatSettingDangMo" class="chat-setting-select">
                <option value="1" ${cd.dangMo ? 'selected' : ''}>🟢 Đang mở (Cả lớp được trò chuyện)</option>
                <option value="0" ${!cd.dangMo ? 'selected' : ''}>🔴 Tạm khóa (Chỉ giáo viên được gửi tin)</option>
              </select>
            </div>

            <div class="chat-setting-group">
              <label>⏱ Giãn cách gửi tin (Rate limit chống spam)</label>
              <select id="chatSettingGianCach" class="chat-setting-select">
                <option value="1" ${cd.gianCachGiay === 1 ? 'selected' : ''}>1 giây (Rất nhanh)</option>
                <option value="3" ${cd.gianCachGiay === 3 ? 'selected' : ''}>3 giây</option>
                <option value="5" ${cd.gianCachGiay === 5 ? 'selected' : ''}>5 giây (Khuyên dùng)</option>
                <option value="10" ${cd.gianCachGiay === 10 ? 'selected' : ''}>10 giây</option>
                <option value="30" ${cd.gianCachGiay === 30 ? 'selected' : ''}>30 giây</option>
              </select>
            </div>

            <!-- VÙNG 2: THÊM BỘ CÔNG CỤ CHỈNH CHỮ CHO THÔNG BÁO GHIM -->
            <div class="chat-setting-group">
              <label>📌 Thông báo ghim đầu khung chat</label>

              <div class="chat-text-toolbar" id="chatTextToolbar">
                <button type="button" class="chat-tool-btn" data-tool="bold" title="In đậm (bôi đen chữ rồi bấm)"><b>B</b></button>
                <button type="button" class="chat-tool-btn" data-tool="italic" title="In nghiêng"><i>I</i></button>
                <button type="button" class="chat-tool-btn" data-tool="underline" title="Gạch chân"><u>U</u></button>
                <span class="chat-tool-sep"></span>
                <button type="button" class="chat-tool-btn" data-tool="color-red" title="Chữ đỏ" style="color: #dc2626;">🔴 Đỏ</button>
                <button type="button" class="chat-tool-btn" data-tool="color-yellow" title="Chữ vàng" style="color: #d97706;">🟡 Vàng</button>
                <button type="button" class="chat-tool-btn" data-tool="color-green" title="Chữ xanh" style="color: #16a34a;">🟢 Xanh</button>
                <span class="chat-tool-sep"></span>
                <button type="button" class="chat-tool-btn" data-tool="icon-warning" title="Icon cảnh báo">⚠️</button>
                <button type="button" class="chat-tool-btn" data-tool="icon-bell" title="Icon thông báo">📢</button>
                <button type="button" class="chat-tool-btn" data-tool="icon-clock" title="Icon thời gian">⏰</button>
                <button type="button" class="chat-tool-btn" data-tool="icon-task" title="Icon nhiệm vụ">📝</button>
                <button type="button" class="chat-tool-btn" data-tool="icon-star" title="Icon quan trọng">⭐</button>
              </div>

              <textarea id="chatSettingGhim" class="chat-setting-input chat-setting-textarea" rows="3"
                placeholder="Ví dụ: 📢 **Lưu ý**: Nhớ chuẩn bị bài học trước khi đến lớp..." maxlength="500">${escapeHtml(cd.thongBaoGhim || '')}</textarea>
            </div>

            <button id="chatSaveSettingsBtn" class="chat-save-btn" type="button">💾 Lưu cài đặt</button>

            <div style="border-top: 1px solid #e2e8f0; margin: 2px 0 0;"></div>

            <div style="font-size: 13px; font-weight: 700; color: #dc2626;">🚫 Học sinh đang bị cấm chat:</div>
            <div id="chatCamList" style="max-height: 120px; overflow-y: auto;">${camRows}</div>

            <!-- VÙNG 1: ĐƯA SÁT XUỐNG MÉP DƯỚI -->
            <div class="chat-modal-footer-danger">
              <button id="chatXoaLichSuBtn" class="chat-danger-btn" type="button">🗑 Xoá toàn bộ lịch sử chat lớp</button>
            </div>
          </div>
        </div>
      `;

      // Bắt sự kiện bộ công cụ chỉnh chữ (Toolbar)
      const toolbar = document.getElementById('chatTextToolbar');
      const ghimTextarea = document.getElementById('chatSettingGhim');
      if (toolbar && ghimTextarea) {
        toolbar.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-tool]');
          if (!btn) return;
          e.preventDefault();
          chenDinhDangVaoTextarea(ghimTextarea, btn.dataset.tool);
        });
      }

      // Bắt sự kiện nút Mở cấm bên trong modal
      modal.addEventListener('click', async (e) => {
        const moCamBtn = e.target.closest('[data-mo-cam-hs]');
        if (moCamBtn) {
          e.preventDefault();
          e.stopPropagation();
          await window.chatWidgetMoCamHs(Number(moCamBtn.dataset.moCamHs));
        }
      });

      // Bắt sự kiện nút X đóng modal
      const modalCloseBtn = document.getElementById('chatTeacherModalCloseBtn');
      if (modalCloseBtn) {
        modalCloseBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          modal.style.display = 'none';
        };
      }

      // Bắt sự kiện nút Lưu cài đặt
      const saveBtn = document.getElementById('chatSaveSettingsBtn');
      if (saveBtn) {
        saveBtn.onclick = async () => {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Đang lưu...';
          const dangMo = document.getElementById('chatSettingDangMo').value === '1';
          const gianCachGiayMoi = parseInt(document.getElementById('chatSettingGianCach').value, 10);
          const thongBaoGhimMoi = document.getElementById('chatSettingGhim').value.trim();
          try {
            const saveRes = await fetch('/api/gv/chat-quan-ly', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dangMo, gianCachGiay: gianCachGiayMoi, thongBaoGhim: thongBaoGhimMoi }),
            });
            const saveData = await saveRes.json();
            if (saveData.ok) {
              saveBtn.textContent = '✓ Đã lưu cài đặt!';
              saveBtn.style.background = '#10b981';
              setTimeout(() => {
                modal.style.display = 'none';
              }, 900);
              taiTinNhan(false);
            } else {
              alert(saveData.loi || 'Không lưu được.');
              saveBtn.disabled = false;
              saveBtn.textContent = '💾 Lưu cài đặt';
            }
          } catch {
            alert('Lỗi kết nối khi lưu cài đặt.');
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Lưu cài đặt';
          }
        };
      }

      // Bắt sự kiện nút Xoá toàn bộ lịch sử
      const xoaLsBtn = document.getElementById('chatXoaLichSuBtn');
      if (xoaLsBtn) {
        xoaLsBtn.onclick = () => window.chatWidgetXoaLichSu();
      }

    } catch {
      modal.innerHTML = '<div style="color: #dc2626; padding: 20px; font-size: 13.5px; text-align: center;">⚠️ Lỗi tải dữ liệu quản trị.</div>';
    }
  }

  // ================= GLOBAL ACTIONS =================

  // Xoá tin nhắn: cập nhật DOM tức thì + gửi yêu cầu lên máy chủ
  window.chatWidgetXoaTin = async function (tinId) {
    if (!confirm('Bạn có chắc muốn xoá tin nhắn này khỏi phòng chat của lớp?')) return;

    // Phản hồi giao diện tức thì: Đánh dấu đã xoá ngay lập tức trên màn hình
    capNhatTinDaXoaTrongDom(tinId);

    try {
      const res = await fetch('/api/gv/chat-quan-ly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'xoa_tin', tinId }),
      });
      const data = await res.json();
      if (data.ok) {
        // Tải lại toàn bộ danh sách để đảm bảo đồng bộ hoàn hảo
        await taiTinNhan(true);
      } else {
        alert(data.loi || 'Không xoá được tin nhắn.');
        await taiTinNhan(true);
      }
    } catch {
      alert('Lỗi kết nối khi xoá tin nhắn.');
      await taiTinNhan(true);
    }
  };

  // Cấm học sinh chat
  window.chatWidgetCamHs = async function (hocSinhId, tenHs) {
    const lyDo = prompt(`Nhập lý do tạm dừng quyền chat của em ${tenHs}:`, 'Vi phạm quy định tán gẫu');
    if (lyDo === null) return;

    const phutStr = prompt(`Thời gian cấm em ${tenHs} (nhập số phút, vd: 15, 60. Nhập 0 = cấm đến khi giáo viên mở lại):`, '15');
    if (phutStr === null) return;
    const thoiGianPhut = parseInt(phutStr, 10) || 0;

    try {
      const res = await fetch('/api/gv/chat-quan-ly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'cam_chat', hocSinhId, lyDo, thoiGianPhut }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Đã tạm dừng quyền chat của em ${tenHs}.`);
        await taiTinNhan(true);
      } else {
        alert(data.loi || 'Lỗi khi cấm chat.');
      }
    } catch {
      alert('Lỗi kết nối khi cấm chat.');
    }
  };

  // Mở cấm học sinh
  window.chatWidgetMoCamHs = async function (hocSinhId) {
    try {
      const res = await fetch('/api/gv/chat-quan-ly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'mo_cam_chat', hocSinhId }),
      });
      const data = await res.json();
      if (data.ok) {
        moCaiDatGiaoVien();
        await taiTinNhan(false);
      } else {
        alert(data.loi || 'Lỗi khi mở cấm.');
      }
    } catch {
      alert('Lỗi kết nối.');
    }
  };

  // Xoá sạch toàn bộ lịch sử chat lớp
  window.chatWidgetXoaLichSu = async function () {
    if (!confirm('Hành động này sẽ xoá TOÀN BỘ tin nhắn trong phòng chat của lớp. Bạn có chắc chắn muốn dọn sạch không?')) return;
    try {
      const res = await fetch('/api/gv/chat-quan-ly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'xoa_lich_su' }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('Đã dọn sạch toàn bộ lịch sử phòng chat.');
        const modal = document.getElementById('chatTeacherModal');
        if (modal) modal.style.display = 'none';
        await taiTinNhan(true);
      } else {
        alert(data.loi || 'Lỗi khi dọn lịch sử.');
      }
    } catch {
      alert('Lỗi kết nối.');
    }
  };

  // ===== XỬ LÝ TIN NHẮN CỦA HỌC SINH =====

  // Thu hồi tin nhắn (học sinh): cập nhật DB, tất cả thấy [Tin nhắn đã bị xoá]; giáo viên vẫn thấy gốc
  window.chatWidgetThuHoi = async function (tinId) {
    if (!confirm('Thu hồi tin nhắn này? Mọi người sẽ thấy "Tin nhắn đã bị xoá".')) return;
    capNhatTinDaXoaTrongDom(tinId);
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tinId }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.loi || 'Không thu hồi được.');
        await taiTinNhan(true);
      }
    } catch {
      alert('Lỗi kết nối khi thu hồi.');
      await taiTinNhan(true);
    }
  };

  // Xóa phía tôi: chỉ ẩn khỏi DOM của người gửi, không thay đổi DB
  window.chatWidgetXoaPhiaToi = function (tinId) {
    const row = document.getElementById(`chatMsg_${tinId}`);
    if (row) {
      row.style.transition = 'opacity 0.25s ease';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 250);
    }
  };

  // Hiện context menu tại vị trí touch (mobile long-press)
  window.chatWidgetHienThiMenuTin = function (tinId, clientX, clientY) {
    window.chatWidgetAnMenuTin();
    const menu = document.createElement('div');
    menu.id = 'chatMsgContextMenu';
    menu.className = 'chat-context-menu';

    const menuW = 210;
    const menuH = 150;
    const x = Math.max(8, Math.min(clientX - menuW / 2, window.innerWidth - menuW - 8));
    const y = Math.max(8, Math.min(clientY - menuH - 12, window.innerHeight - menuH - 8));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    menu.innerHTML = `
      <div class="chat-ctx-title">Tin nhắn của bạn</div>
      <button class="chat-ctx-btn chat-ctx-recall" type="button" data-ctx-thu-hoi="${tinId}">↩️ Thu hồi tin nhắn</button>
      <button class="chat-ctx-btn chat-ctx-local" type="button" data-ctx-xoa-phia-toi="${tinId}">🗑 Xóa phía tôi</button>
      <button class="chat-ctx-btn chat-ctx-cancel" type="button" data-ctx-huy>✕ Hủy</button>
    `;

    document.body.appendChild(menu);

    menu.querySelector('[data-ctx-thu-hoi]').addEventListener('click', async (e) => {
      e.stopPropagation();
      window.chatWidgetAnMenuTin();
      await window.chatWidgetThuHoi(tinId);
    });
    menu.querySelector('[data-ctx-xoa-phia-toi]').addEventListener('click', (e) => {
      e.stopPropagation();
      window.chatWidgetAnMenuTin();
      window.chatWidgetXoaPhiaToi(tinId);
    });
    menu.querySelector('[data-ctx-huy]').addEventListener('click', (e) => {
      e.stopPropagation();
      window.chatWidgetAnMenuTin();
    });
  };

  // Ẩn / xoá context menu
  window.chatWidgetAnMenuTin = function () {
    const menu = document.getElementById('chatMsgContextMenu');
    if (menu) menu.remove();
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Tự động khởi tạo sau khi trang tải xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTaoGiaoDien);
  } else {
    khoiTaoGiaoDien();
  }
})();
