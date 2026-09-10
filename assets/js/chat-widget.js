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
  let tinChuaDoc = 0;
  let dangGui = false;
  let caiDatHienTai = { dangMo: 1, gianCachGiay: 5, thongBaoGhim: '' };

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

    // 1. Nút bong bóng chat nổi
    const bubble = document.createElement('button');
    bubble.className = 'chat-widget-bubble';
    bubble.id = 'chatWidgetBubble';
    bubble.type = 'button';
    bubble.title = 'Phòng tán gẫu lớp học';
    bubble.setAttribute('aria-label', 'Mở phòng tán gẫu');
    bubble.innerHTML = `
      <span class="chat-bubble-icon">💬</span>
      <span class="chat-bubble-badge" id="chatUnreadBadge" style="display: none;">0</span>
    `;
    document.body.appendChild(bubble);

    // 2. Tạo cửa sổ khung chat
    const windowEl = document.createElement('div');
    windowEl.className = 'chat-widget-window chat-hidden';
    windowEl.id = 'chatWidgetWindow';
    windowEl.innerHTML = `
      <div class="chat-window-header">
        <div class="chat-header-info">
          <div class="chat-header-title">💬 Tán gẫu lớp</div>
          <span class="chat-header-badge" id="chatRateBadge">⏱ 5s</span>
        </div>
        <div class="chat-header-actions">
          <button class="chat-header-btn" id="chatTeacherSettingBtn" title="Cài đặt phòng chat" style="display: none;">⚙️</button>
          <button class="chat-header-btn chat-close-btn" id="chatCloseBtn" title="Thu nhỏ khung chat" aria-label="Đóng chat">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

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
        btn.onclick = () => {
          const input = document.getElementById('chatInputField');
          input.value += emoji;
          input.focus();
        };
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
      tabBtn.onclick = () => renderEmojiGrid(cat.id);
      tabsContainer.appendChild(tabBtn);
    });

    renderEmojiGrid(EMOJI_CATEGORIES[0].id);

    // 4. Event delegation cho Xoá tin & Cấm HS trong danh sách tin nhắn
    const msgContainer = document.getElementById('chatMessagesContainer');
    msgContainer.addEventListener('click', (e) => {
      const xoaBtn = e.target.closest('[data-xoa-tin]');
      if (xoaBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.chatWidgetXoaTin(Number(xoaBtn.dataset.xoaTin));
        return;
      }
      const camBtn = e.target.closest('[data-cam-hs]');
      if (camBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.chatWidgetCamHs(Number(camBtn.dataset.camHs), camBtn.dataset.ten || '');
      }
    });

    // 5. Bắt sự kiện bấm vào bong bóng để mở chat — không tự bật bàn phím
    function xuLyMoChat(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      moKhungChat();
    }

    bubble.addEventListener('click', xuLyMoChat);

    const closeBtn = document.getElementById('chatCloseBtn');
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dongKhungChat();
    });

    document.getElementById('chatEmojiToggleBtn').onclick = () => {
      const d = document.getElementById('chatEmojiDrawer');
      d.style.display = d.style.display === 'none' ? 'flex' : 'none';
    };

    const inputField = document.getElementById('chatInputField');
    inputField.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        guiTinNhan();
      }
    };
    document.getElementById('chatSendBtn').onclick = guiTinNhan;
    document.getElementById('chatTeacherSettingBtn').onclick = moCaiDatGiaoVien;

    // Tự động co giãn theo bàn phím ảo trên điện thoại (Visual Viewport API)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (dangMoKhungChat && window.innerWidth <= 600) {
          const vh = window.visualViewport.height;
          windowEl.style.height = `${vh}px`;
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
    win.classList.remove('chat-hidden');

    // Ẩn nút bong bóng khi đang mở khung chat
    if (bubble) bubble.style.display = 'none';

    // Bật backdrop và khoá cuộn trang web bên dưới
    if (backdrop) backdrop.classList.add('chat-backdrop-active');
    document.body.classList.add('chat-modal-open');

    tinChuaDoc = 0;
    capNhatBadge();
    cuonXuongDuoi();

    // Không tự động bật bàn phím ảo (chỉ hiện khi người dùng chủ động chạm vào ô nhập)
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

    document.getElementById('chatEmojiDrawer').style.display = 'none';
    document.getElementById('chatTeacherModal').style.display = 'none';

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

    const bubbleEl = row.querySelector('.chat-msg-bubble');
    if (bubbleEl) {
      bubbleEl.textContent = '[Tin nhắn đã bị xoá]';
      bubbleEl.classList.add('chat-msg-deleted');
    }

    // Xoá nút "✕ Xoá" khỏi DOM
    const modBtn = row.querySelector('.chat-msg-mod-btn');
    if (modBtn) modBtn.remove();
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
      // Khi tải lại từ đầu (làm mới / sau khi xoá), reset về 0 để lấy đủ danh sách mới nhất
      if (laLanDau) {
        tinNhanCuoiId = 0;
      }

      const res = await fetch(`/api/chat?sauId=${tinNhanCuoiId}`, {
        headers: { 'Accept': 'application/json' },
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

    const laTinCuaToi = (!laGiaoVien && hocSinhIdHienTai && t.hocSinhId === hocSinhIdHienTai) || (laGiaoVien && t.vaiTro === 'giao_vien');
    const laHeThong = t.vaiTro === 'he_thong';
    const laGvcn = t.vaiTro === 'giao_vien';
    const daBiXoa = !!t.daXoa;

    if (laHeThong) {
      row.className = 'chat-msg-row msg-system';
      row.innerHTML = `<div class="chat-msg-bubble">${escapeHtml(t.noiDung)}</div>`;
    } else {
      row.className = `chat-msg-row ${laTinCuaToi ? 'msg-mine' : 'msg-other'} ${laGvcn ? 'msg-gv' : ''}`;

      // Nút xoá chỉ hiện cho giáo viên đối với các tin CHƯA bị xoá
      let modBtn = '';
      if (laGiaoVien && !daBiXoa) {
        modBtn = `<button class="chat-msg-mod-btn" data-xoa-tin="${t.id}" title="Xoá tin nhắn này">✕ Xoá</button>`;
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
            ${modBtn}
          </div>
        `;
      }

      let thoiGianStr = '';
      if (t.taoLuc) {
        const d = new Date(t.taoLuc + 'Z');
        thoiGianStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      let footerHtml = '';
      if (laTinCuaToi) {
        footerHtml = `
          <div style="display: flex; align-items: center; gap: 6px; justify-content: flex-end; margin-top: 3px;">
            ${modBtn}
            ${thoiGianStr ? `<span class="chat-msg-time">${thoiGianStr}</span>` : ''}
          </div>
        `;
      } else {
        footerHtml = thoiGianStr ? `<div class="chat-msg-time">${thoiGianStr}</div>` : '';
      }

      const noiDungHienThi = daBiXoa ? '[Tin nhắn đã bị xoá]' : t.noiDung;

      row.innerHTML = `
        ${authorHtml}
        <div class="chat-msg-bubble ${daBiXoa ? 'chat-msg-deleted' : ''}">
          ${escapeHtml(noiDungHienThi)}
        </div>
        ${footerHtml}
      `;
    }

    container.appendChild(row);
  }

  async function guiTinNhan() {
    if (dangGui || demNguocGiay > 0) return;

    const input = document.getElementById('chatInputField');
    const noiDung = input.value.trim();
    if (!noiDung) return;

    dangGui = true;
    const sendBtn = document.getElementById('chatSendBtn');
    sendBtn.disabled = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noiDung }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.loi || 'Không gửi được tin nhắn.');
        return;
      }

      input.value = '';
      document.getElementById('chatEmojiDrawer').style.display = 'none';

      // Kích hoạt Rate Limit Countdown cho học sinh
      if (!laGiaoVien) {
        batDauDemNguoc(gianCachGiay);
      }

      // Tải ngay tin mới
      await taiTinNhan(false);
    } catch {
      alert('Lỗi kết nối khi gửi tin nhắn.');
    } finally {
      dangGui = false;
      if (demNguocGiay <= 0) sendBtn.disabled = false;
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
    // Khi đang mở khung chat: thăm dò mỗi 2.5s; khi đóng: thăm dò mỗi 20s
    const chuKy = dangMoKhungChat ? 2500 : 20000;
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
