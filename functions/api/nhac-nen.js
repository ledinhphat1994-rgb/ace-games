// GET /api/nhac-nen — CHUYỂN HƯỚNG (302) sang bài nhạc ĐANG ĐƯỢC ĐẶT làm nhạc nền trang chủ
// (dang_phat=1 trong thư viện Âm thanh — xem functions/api/gv/thu-vien-am-thanh.js).
//
// Trước đây phát THẲNG nội dung file ngay ở URL này với Cache-Control 7 ngày (qua phucVuTepR2) —
// nhưng URL "/api/nhac-nen" là một CON TRỎ có thể trỏ sang bài khác bất cứ lúc nào, trong khi
// Cache-Control public lại bảo trình duyệt/CDN được lưu NGUYÊN VĂN bài cũ tại đúng URL này tới
// 7 ngày. Kết quả: giáo viên đổi nhạc nền, nhưng máy học sinh đã từng nghe nhạc nền trước đó vẫn
// phát lại bài CŨ từ cache, tưởng như "chọn nhạc nền mới không có tác dụng gì".
// Sửa bằng cách tách rời: endpoint này CHỈ tra bài nào đang là nhạc nền rồi 302 sang URL RIÊNG
// theo từng id (/api/thu-vien-tep?...&id=), nơi mỗi id ứng với đúng một file bất biến nên cache
// dài hạn ở đó mới an toàn — còn bản thân "/api/nhac-nen" luôn được yêu cầu lại (no-store), nên
// đổi bài là đổi ngay URL đích, không còn phát nhầm bài cũ đã cache.
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const bai = await env.DB.prepare('SELECT id FROM am_thanh WHERE dang_phat = 1 AND lop_id = ?1 LIMIT 1').bind(phien.lopId).first();
  if (!bai) return loi('Chưa có nhạc nền.', 404);

  const dich = new URL('/api/thu-vien-tep', request.url);
  dich.searchParams.set('loai', 'am-thanh');
  dich.searchParams.set('id', String(bai.id));
  return new Response(null, {
    status: 302,
    headers: { Location: dich.toString(), 'Cache-Control': 'no-store' },
  });
}, { canGiaoVien: false });
