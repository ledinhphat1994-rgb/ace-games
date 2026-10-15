/**
 * Ace Games Bridge — Cầu nối liên lạc giữa Web Game (Godot) và App Mobile / Web Ace Games
 * Hỗ trợ giao tiếp 2 chiều:
 * 1. Godot -> App: Haptic feedback, lưu điểm, thông báo Toast, thoát game
 * 2. App -> Godot: Đồng bộ profile người chơi, phát hiện mobile, pause/resume
 */

(function () {
  const isReactNativeWebView = typeof window.ReactNativeWebView !== 'undefined';
  const isCapacitor = typeof window.Capacitor !== 'undefined';
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isReactNativeWebView || isCapacitor;

  const bridge = {
    // 1. Kiểm tra có đang chạy trên thiết bị di động hay không
    isMobile: function () {
      return isMobileDevice;
    },

    // 2. Rung phản hồi xúc giác di động (Haptic Feedback)
    triggerHaptic: function (pattern) {
      pattern = pattern || 'medium';

      // Gửi lên React Native WebView (mobile/App.tsx)
      if (isReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'haptic',
          pattern: pattern
        }));
        return;
      }

      // Gửi lên Capacitor (nếu chạy Capacitor Native)
      if (isCapacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        try {
          if (pattern === 'selection') {
            window.Capacitor.Plugins.Haptics.selectionChanged();
          } else if (pattern === 'heavy') {
            window.Capacitor.Plugins.Haptics.impact({ style: 'Heavy' });
          } else if (pattern === 'light') {
            window.Capacitor.Plugins.Haptics.impact({ style: 'Light' });
          } else {
            window.Capacitor.Plugins.Haptics.impact({ style: 'Medium' });
          }
        } catch (e) {
          console.warn('[Bridge] Capacitor Haptic error:', e);
        }
        return;
      }

      // Rung trình duyệt tiêu chuẩn (Android Chrome)
      if (typeof navigator.vibrate === 'function') {
        const durations = {
          light: 15,
          medium: 35,
          heavy: 60,
          success: [20, 40, 30],
          warning: [40, 40, 40],
          error: [60, 40, 60]
        };
        navigator.vibrate(durations[pattern] || 30);
      }
    },

    // 3. Gửi điểm số về hệ thống lớp học
    submitScore: function (score, metadataJson) {
      let meta = {};
      try {
        meta = typeof metadataJson === 'string' ? JSON.parse(metadataJson) : metadataJson;
      } catch (e) {}

      console.log('[Bridge] Nhận điểm từ Godot:', score, meta);

      // Báo lên React Component mẹ qua CustomEvent
      window.dispatchEvent(new CustomEvent('campus:game:score', {
        detail: { score, meta }
      }));

      // Nếu đang trong iframe, postMessage lên parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'campus:game:score',
          score,
          meta
        }, '*');
      }

      // Nếu đang trong React Native WebView
      if (isReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'score',
          score,
          meta
        }));
      }
    },

    // 4. Hiển thị thông báo Toast trong App
    showToast: function (message, variant) {
      variant = variant || 'info';
      window.dispatchEvent(new CustomEvent('campus:game:toast', {
        detail: { message, variant }
      }));

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'campus:game:toast',
          message,
          variant
        }, '*');
      }
    },

    // 5. Yêu cầu thoát game
    closeGame: function () {
      console.log('[Bridge] Yêu cầu đóng game từ Godot');

      window.dispatchEvent(new CustomEvent('campus:game:exit'));

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'campus:game:exit' }, '*');
      }

      if (isReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'exit' }));
      }
    },

    // 6. Lấy thông tin học sinh
    getUserInfo: function () {
      try {
        const stored = localStorage.getItem('c10a7_user') || localStorage.getItem('user_profile');
        if (stored) return stored;
      } catch (e) {}
      return JSON.stringify({
        id: 'player_ace',
        name: 'Người chơi Ace Games',
        role: 'player'
      });
    }
  };

  window.AceGamesBridge = bridge;
  window.DigitalCampusBridge = bridge;

  console.log('[Bridge] AceGamesBridge đã sẵn sàng phục vụ Godot Engine!');
})();
