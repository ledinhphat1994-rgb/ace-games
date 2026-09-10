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

  const EMOJI_POPULAR = ['😊', '😂', '👍', '❤️', '👏', '🔥', '🎉', '📚', '✍️', '⚽', '🏆', '🐱', '💡', '💯', '🌸', '✨'];

  function khoiTaoGiaoDien() {
    // 1. Tạo nút bong bóng nổi
    const bubble = document.createElement('div');
    bubble.className = 'chat-widget-bubble';
    bubble.id = 'chatWidgetBubble';
    bubble.title = 'Phòng tán gẫu lớp học';
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
          <button class="chat-header-btn" id="chatCloseBtn" title="Thu nhỏ">✕</button>
        </div>
      </div>

      <div class="chat-pinned-banner" id="chatPinnedBanner" style="display: none;"></div>
      <div class="chat-lock-banner" id="chatLockBanner" style="display: none;">⚠️ Giáo viên đang tạm khóa chat</div>

      <div class="chat-messages-container" id="chatMessagesContainer">
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">Đang tải tin nhắn...</div>
      </div>

      <div class="chat-emoji-drawer" id="chatEmojiDrawer" style="display: none;"></div>

      <div class="chat-window-footer" id="chatWindowFooter">
        <div class="chat-input-row">
          <button class="chat-emoji-toggle" id="chatEmojiToggleBtn" title="Chọn biểu tượng cảm xúc">😊</button>
          <input type="text" class="chat-input-field" id="chatInputField" placeholder="Nhập tin nhắn..." maxlength="300" autocomplete="off" />
          <button class="chat-send-btn" id="chatSendBtn">Gửi</button>
        </div>
        <div class="chat-rate-hint" id="chatRateHint">Chỉ gửi chữ & icon • Giãn cách 5s</div>
      </div>

      <div class="chat-teacher-modal" id="chatTeacherModal" style="display: none;"></div>
    `;
    document.body.appendChild(windowEl);

    // 3. Đổ danh sách Emoji nhanh
    const emojiDrawer = document.getElementById('chatEmojiDrawer');
    EMOJI_POPULAR.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.className = 'chat-emoji-btn';
      btn.textContent = emoji;
      btn.type = 'button';
      btn.onclick = () => {
        const input = document.getElementById('chatInputField');
        input.value += emoji;
        input.focus();
      };
      emojiDrawer.appendChild(btn);
    });

    // 4. Bắt sự kiện mở/đóng khung chat nhạy và chống double-tap
    let lastToggleTime = 0;
    function xuLyMoChat(e) {
      if (e) {
        if (e.cancelable && e.type === 'touchend') {
          e.preventDefault();
        }
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastToggleTime < 350) return; // Chống double-fire giữa touchend và synthetic click
      lastToggleTime = now;

      toggleKhungChat();
    }

    bubble.addEventListener('click', xuLyMoChat);
    bubble.addEventListener('touchend', xuLyMoChat, { passive: false });
    document.getElementById('chatCloseBtn').addEventListener('click', xuLyMoChat);
    document.getElementById('chatCloseBtn').addEventListener('touchend', xuLyMoChat, { passive: false });

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

    // Tự động co giãn theo bàn phím ảo trên điện thoại (Visual Viewport)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (dangMoKhungChat && window.innerWidth <= 600) {
          const vh = window.visualViewport.height;
          windowEl.style.height = `${vh}px`;
          cuonXuongDuoi();
        }
      });
    }

    // Tạm dừng polling khi tab bị ẩn để tiết kiệm pin & mạng
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        dungPolling();
      } else {
        khoiDongPolling();
      }
    });

    // Lần tải đầu tiên
    taiTinNhan(true);
    khoiDongPolling();
  }

  function toggleKhungChat() {
    const win = document.getElementById('chatWidgetWindow');
    const bubble = document.getElementById('chatWidgetBubble');
    dangMoKhungChat = !dangMoKhungChat;

    if (dangMoKhungChat) {
      win.classList.remove('chat-hidden');
      if (bubble) bubble.style.display = 'none'; // Ẩn nút tròn khi khung chat đang mở
      tinChuaDoc = 0;
      capNhatBadge();
      cuonXuongDuoi();

      // Kích hoạt bàn phím ảo ngay lập tức trên cả Mobile & Desktop
      const input = document.getElementById('chatInputField');
      if (input) {
        input.focus();
        setTimeout(() => { input.focus(); }, 60);
      }
      taiTinNhan(false);
    } else {
      win.classList.add('chat-hidden');
      win.style.height = ''; // Khôi phục chiều cao mặc định
      if (bubble) bubble.style.display = 'flex'; // Hiện lại nút tròn khi đóng khung chat
      document.getElementById('chatEmojiDrawer').style.display = 'none';
      document.getElementById('chatTeacherModal').style.display = 'none';
    }
  }

  function capNhatBadge() {
    const badge = document.getElementById('chatUnreadBadge');
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
      setTimeout(() => { c.scrollTop = c.scrollHeight; }, 50);
    }
  }

  async function taiTinNhan(laLanDau = false) {
    try {
      const res = await fetch(`/api/chat?sauId=${tinNhanCuoiId}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.status === 401) {
        // Chưa đăng nhập -> ẩn widget
        const b = document.getElementById('chatWidgetBubble');
        if (b) b.style.display = 'none';
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

      // Cập nhật giao diện theo quyền giáo viên
      if (laGiaoVien) {
        document.getElementById('chatTeacherSettingBtn').style.display = 'flex';
        document.getElementById('chatRateBadge').textContent = `⏱ ${gianCachGiay}s (GV)`;
      } else {
        document.getElementById('chatRateBadge').textContent = `⏱ ${gianCachGiay}s`;
      }
      document.getElementById('chatRateHint').textContent = `Chỉ gửi chữ & icon • Giãn cách ${gianCachGiay}s`;

      // Cập nhật thông báo ghim & khoá chat
      const banner = document.getElementById('chatPinnedBanner');
      if (caiDatHienTai.thongBaoGhim) {
        banner.textContent = `📌 ${caiDatHienTai.thongBaoGhim}`;
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }

      const lockBanner = document.getElementById('chatLockBanner');
      const footer = document.getElementById('chatWindowFooter');
      if (!laGiaoVien && !caiDatHienTai.dangMo) {
        lockBanner.style.display = 'block';
        footer.style.opacity = '0.5';
        footer.style.pointerEvents = 'none';
      } else if (data.biCamChat) {
        lockBanner.textContent = `⚠️ Bạn đang bị cấm chat: ${data.lyDoCam || 'Vi phạm nội quy'}`;
        lockBanner.style.display = 'block';
        footer.style.opacity = '0.5';
        footer.style.pointerEvents = 'none';
      } else {
        lockBanner.style.display = 'none';
        footer.style.opacity = '1';
        footer.style.pointerEvents = 'auto';
      }

      // Xử lý tin nhắn mới
      const tinMoi = data.tinNhan || [];
      const container = document.getElementById('chatMessagesContainer');

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
        container.innerHTML = '<div id="chatEmptyPlaceholder" style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 30px;">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên! 👋</div>';
      }
    } catch (e) {
      console.warn('Lỗi tải chat:', e);
    }
  }

  function themTinNhanVaoDom(t, container) {
    const emptyEl = document.getElementById('chatEmptyPlaceholder');
    if (emptyEl) emptyEl.remove();

    const row = document.createElement('div');
    const laTinCuaToi = (!laGiaoVien && hocSinhIdHienTai && t.hocSinhId === hocSinhIdHienTai) || (laGiaoVien && t.vaiTro === 'giao_vien');
    const laHeThong = t.vaiTro === 'he_thong';
    const laGvcn = t.vaiTro === 'giao_vien';

    if (laHeThong) {
      row.className = 'chat-msg-row msg-system';
      row.innerHTML = `<div class="chat-msg-bubble">${escapeHtml(t.noiDung)}</div>`;
    } else {
      row.className = `chat-msg-row ${laTinCuaToi ? 'msg-mine' : 'msg-other'} ${laGvcn ? 'msg-gv' : ''}`;

      let modBtn = '';
      if (laGiaoVien && !t.daXoa) {
        modBtn = `<button class="chat-msg-mod-btn" title="Xoá tin này" onclick="window.chatWidgetXoaTin(${t.id})">✕ Xoá</button>`;
      }

      let authorHtml = '';
      if (!laTinCuaToi) {
        authorHtml = `
          <div class="chat-msg-author" style="display: flex; align-items: center; justify-content: space-between;">
            <span ${laGiaoVien && t.hocSinhId ? `style="cursor: pointer; text-decoration: underline;" title="Bấm để cấm chat" onclick="window.chatWidgetCamHs(${t.hocSinhId}, '${escapeHtml(t.tenNguoiGui)}')"` : ''}>
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

      row.innerHTML = `
        ${authorHtml}
        <div class="chat-msg-bubble ${t.daXoa ? 'chat-msg-deleted' : ''}">
          ${escapeHtml(t.noiDung)}
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
    } catch (e) {
      alert('Lỗi kết nối khi gửi tin nhắn.');
    } finally {
      dangGui = false;
      if (demNguocGiay <= 0) sendBtn.disabled = false;
    }
  }

  function batDauDemNguoc(giay) {
    demNguocGiay = giay;
    const sendBtn = document.getElementById('chatSendBtn');
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
    // Khi đang mở khung chat: thăm dò mỗi 2.5s; khi đóng: thăm dò mỗi 25s
    const chuKy = dangMoKhungChat ? 2500 : 25000;
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

  async function moCaiDatGiaoVien() {
    const modal = document.getElementById('chatTeacherModal');
    modal.style.display = 'flex';
    modal.innerHTML = '<div style="text-align: center; margin-top: 30px;">Đang tải cài đặt...</div>';

    try {
      const res = await fetch('/api/gv/chat-quan-ly');
      const data = await res.json();
      if (!data.ok) {
        modal.innerHTML = `<div style="color: red; padding: 10px;">${data.loi}</div>`;
        return;
      }

      const cd = data.caiDat;
      const danhSachCam = data.danhSachCam || [];

      let camRows = '<div style="color: #64748b; font-size: 12px; margin-top: 4px;">Hiện không có học sinh nào bị cấm chat.</div>';
      if (danhSachCam.length > 0) {
        camRows = danhSachCam.map((hs) => `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 8px 10px; border-radius: 8px; margin-bottom: 6px; border: 1px solid #e2e8f0; font-size: 12px;">
            <div>
              <strong>${escapeHtml(hs.hoTen)}</strong> (STT ${hs.stt})<br/>
              <span style="color: #ef4444;">${escapeHtml(hs.lyDo || 'Bị cấm')}</span>
            </div>
            <button onclick="window.chatWidgetMoCamHs(${hs.hocSinhId})" style="background: #10b981; color: #ffffff; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 11px;">Mở cấm</button>
          </div>
        `).join('');
      }

      modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <h4 style="margin: 0; font-size: 15px;">⚙️ Quản lý phòng tán gẫu</h4>
          <button id="chatTeacherModalCloseBtn" style="border: none; background: #f1f5f9; width: 28px; height: 28px; border-radius: 6px; cursor: pointer;">✕</button>
        </div>

        <div class="chat-setting-group">
          <label>Trạng thái phòng chat:</label>
          <select id="chatSettingDangMo" class="chat-setting-select">
            <option value="1" ${cd.dangMo ? 'selected' : ''}>🟢 Đang mở (Cả lớp được chat)</option>
            <option value="0" ${!cd.dangMo ? 'selected' : ''}>🔴 Tạm khóa (Chỉ giáo viên nói được)</option>
          </select>
        </div>

        <div class="chat-setting-group">
          <label>Giãn cách gửi tin (Rate limit chống spam):</label>
          <select id="chatSettingGianCach" class="chat-setting-select">
            <option value="1" ${cd.gianCachGiay === 1 ? 'selected' : ''}>1 giây (Nhanh)</option>
            <option value="3" ${cd.gianCachGiay === 3 ? 'selected' : ''}>3 giây</option>
            <option value="5" ${cd.gianCachGiay === 5 ? 'selected' : ''}>5 giây (Khuyên dùng)</option>
            <option value="10" ${cd.gianCachGiay === 10 ? 'selected' : ''}>10 giây</option>
            <option value="30" ${cd.gianCachGiay === 30 ? 'selected' : ''}>30 giây</option>
          </select>
        </div>

        <div class="chat-setting-group">
          <label>Thông báo ghim đầu khung chat:</label>
          <input type="text" id="chatSettingGhim" class="chat-setting-input" value="${escapeHtml(cd.thongBaoGhim || '')}" placeholder="Ví dụ: Giữ trật tự trong giờ học..." maxlength="200" />
        </div>

        <button id="chatSaveSettingsBtn" style="background: #2563eb; color: #ffffff; border: none; padding: 8px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 16px;">💾 Lưu cài đặt</button>

        <h4 style="margin: 10px 0 8px 0; font-size: 13.5px;">🚫 Học sinh đang bị cấm chat:</h4>
        <div style="flex: 1; overflow-y: auto; max-height: 140px; margin-bottom: 10px;">
          ${camRows}
        </div>

        <button onclick="window.chatWidgetXoaLichSu()" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 6px; border-radius: 6px; font-size: 11.5px; cursor: pointer;">🗑 Xoá toàn bộ lịch sử chat lớp</button>
      `;

      document.getElementById('chatTeacherModalCloseBtn').onclick = () => {
        modal.style.display = 'none';
      };

      document.getElementById('chatSaveSettingsBtn').onclick = async () => {
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
            alert('Đã lưu cài đặt phòng chat thành công!');
            modal.style.display = 'none';
            taiTinNhan(false);
          } else {
            alert(saveData.loi || 'Không lưu được.');
          }
        } catch {
          alert('Lỗi kết nối khi lưu cài đặt.');
        }
      };
    } catch {
      modal.innerHTML = '<div style="color: red; padding: 10px;">Lỗi tải dữ liệu quản trị.</div>';
    }
  }

  // Gắn các hàm quản trị vào window để gọi từ inline HTML
  window.chatWidgetXoaTin = async function (tinId) {
    if (!confirm('Bạn có chắc muốn xoá tin nhắn này?')) return;
    try {
      const res = await fetch('/api/gv/chat-quan-ly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'xoa_tin', tinId }),
      });
      const data = await res.json();
      if (data.ok) {
        taiTinNhan(true);
      } else {
        alert(data.loi || 'Không xoá được tin.');
      }
    } catch {
      alert('Lỗi khi xoá tin.');
    }
  };

  window.chatWidgetCamHs = async function (hocSinhId, tenHs) {
    const lyDo = prompt(`Nhập lý do cấm chat em ${tenHs}:`, 'Vi phạm quy định tán gẫu');
    if (lyDo === null) return;

    const phutStr = prompt(`Thời gian cấm em ${tenHs} (nhập số phút, vd: 15, 60. Nhập 0 = cấm vĩnh viễn):`, '15');
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
        alert(`Đã cấm chat em ${tenHs}.`);
        taiTinNhan(true);
      } else {
        alert(data.loi || 'Lỗi khi cấm chat.');
      }
    } catch {
      alert('Lỗi kết nối.');
    }
  };

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
      } else {
        alert(data.loi || 'Lỗi khi mở cấm.');
      }
    } catch {
      alert('Lỗi kết nối.');
    }
  };

  window.chatWidgetXoaLichSu = async function () {
    if (!confirm('Hành động này sẽ xoá TOÀN BỘ tin nhắn trong phòng chat của lớp. Bạn có chắc không?')) return;
    try {
      const res = await fetch('/api/gv/chat-quan-ly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanhDong: 'xoa_lich_su' }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('Đã dọn sạch lịch sử phòng chat.');
        document.getElementById('chatTeacherModal').style.display = 'none';
        taiTinNhan(true);
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

  // Tự động khởi tạo sau khi trang tải xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTaoGiaoDien);
  } else {
    khoiTaoGiaoDien();
  }
})();
