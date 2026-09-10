/* Service worker — giúp ứng dụng mở được cả khi mạng chập chờn.
 *
 * Nguyên tắc an toàn: CHỈ lưu tạm phần giao diện (HTML, CSS, JS, biểu tượng).
 * Tuyệt đối KHÔNG lưu tạm dữ liệu học sinh (/api/...), vì đó là dữ liệu riêng tư
 * và phải luôn lấy bản mới nhất từ máy chủ.
 */

const PHIEN_BAN = 'lop10a7-v136';
const VO_UNG_DUNG = [
  '/giao-vien/',
  '/giao-vien/index.html?v=20260909_94',
  '/giao-vien/app.js?v=20260909_94',
  '/assets/css/style.css?v=20260909_94',
  '/assets/css/quan-ly.css?v=20260909_96',
  '/assets/js/chung.js?v=20260909_90',
  '/assets/js/trang-lop.js?v=20260909_94',
  '/assets/img/bieu-tuong-192.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (sk) => {
  sk.waitUntil(
    caches.open(PHIEN_BAN)
      .then((kho) => Promise.all(VO_UNG_DUNG.map((duong) =>
        // Tự fetch với no-store thay vì addAll(), vì addAll() có thể lấy nhầm
        // bản cũ từ bộ nhớ đệm HTTP của trình duyệt.
        fetch(duong, { cache: 'no-store' }).then((res) => (res.ok ? kho.put(duong, res) : null)).catch(() => {})
      )))
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
  // "cache: no-cache" (KHÔNG phải "no-store") — bắt buộc trình duyệt luôn HỎI LẠI máy chủ
  // trước khi dùng bản đã lưu (nên sửa mã nguồn xong người dùng vẫn thấy bản mới ngay, không
  // cần đợi), nhưng vẫn cho phép trình duyệt gửi kèm ETag để máy chủ trả "304 Not Modified"
  // (rất nhỏ, rất nhanh) khi file chưa đổi gì — khớp đúng "_headers" (Cache-Control: no-cache)
  // đã cấu hình sẵn cho các đường dẫn này. Trước đây dùng "no-store" ép tải lại TOÀN BỘ nội
  // dung mỗi lần dù không đổi gì — hàng chục tệp CSS/JS phải tải lại y hệt mỗi khi chuyển
  // trang/mở lại khu quản lý, gây khựng/giật rõ rệt, nhất là mạng di động của học sinh.
  sk.respondWith(
    fetch(yeuCau, { cache: 'no-cache' })
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
