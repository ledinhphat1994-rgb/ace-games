// GET /api/lop-cong-khai?lop=<slug> — thông tin lớp CÔNG KHAI, KHÔNG cần đăng nhập.
// Chỉ dùng để hiển thị đúng tên lớp trên màn hình đăng nhập (mỗi lớp một đường link riêng,
// vd /login.html?lop=10a7) — không trả bất kỳ dữ liệu học sinh/điểm/quỹ nào. Slug KHÔNG phải
// cơ chế xác thực, chỉ để hiển thị đẹp trước khi nhập mã.
export async function onRequestGet({ request, env }) {
  const slug = (new URL(request.url).searchParams.get('lop') || '').trim().toLowerCase();
  const tra = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

  if (!slug || !/^[a-z0-9-]{1,32}$/.test(slug)) return tra({ ok: false }, 400);
  if (!env.DB) return tra({ ok: false }, 500);

  const lop = await env.DB.prepare(
    'SELECT ten, nam_hoc AS namHoc, truong FROM lop WHERE slug = ?1 AND dang_hoat_dong = 1'
  ).bind(slug).first();

  if (!lop) return tra({ ok: false }, 404);
  return tra({ ok: true, lop });
}
