/* Service worker — giúp ứng dụng mở được cả khi mạng chập chờn.
 *
 * Nguyên tắc an toàn: CHỈ lưu tạm phần giao diện (HTML, CSS, JS, biểu tượng).
 * Tuyệt đối KHÔNG lưu tạm dữ liệu học sinh (/api/...), vì đó là dữ liệu riêng tư
 * và phải luôn lấy bản mới nhất từ máy chủ.
 */

const PHIEN_BAN = 'lop10a7-v3';
const VO_UNG_DUNG = [
  '/giao-vien/',
  '/giao-vien/app.js',
  '/assets/css/style.css',
  '/assets/css/quan-ly.css',
  '/assets/js/chung.js',
  '/assets/img/bieu-tuong-192.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (sk) => {
  sk.waitUntil(
    caches.open(PHIEN_BAN)
      .then((kho) => kho.addAll(VO_UNG_DUNG).catch(() => { /* thiếu tệp nào cũng không chặn cài đặt */ }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (sk) => {
  sk.waitUntil(
    caches.keys()
      .then((ten) => Promise.all(ten.filter((t) => t !== PHIEN_BAN).map((t) => caches.delete(t))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (sk) => {
  const yeuCau = sk.request;
  if (yeuCau.method !== 'GET') return;

  const url = new URL(yeuCau.url);
  if (url.origin !== self.location.origin) return;

  // Dữ liệu và đăng nhập: luôn hỏi thẳng máy chủ, không bao giờ lưu tạm.
  if (url.pathname.startsWith('/api/') || url.pathname === '/login.html') return;

  // Giao diện: lấy từ mạng trước cho luôn mới, hỏng mạng thì dùng bản đã lưu.
  sk.respondWith(
    fetch(yeuCau)
      .then((traLoi) => {
        if (traLoi.ok && traLoi.type === 'basic') {
          const ban_sao = traLoi.clone();
          caches.open(PHIEN_BAN).then((kho) => kho.put(yeuCau, ban_sao)).catch(() => {});
        }
        return traLoi;
      })
      .catch(async () => {
        const daLuu = await caches.match(yeuCau);
        if (daLuu) return daLuu;
        if (yeuCau.mode === 'navigate') {
          const vo = await caches.match('/giao-vien/');
          if (vo) return vo;
        }
        return new Response('Đang ngoại tuyến và chưa có bản lưu tạm.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
