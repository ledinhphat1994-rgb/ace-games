// GET /api/lop-cong-khai?lop=<slug> — thông tin MỘT lớp CÔNG KHAI theo slug, KHÔNG cần đăng
// nhập. Dùng để hiển thị đúng tên lớp trên màn hình đăng nhập khi mở đường link riêng của lớp
// đó (vd /login.html?lop=10a7).
// GET /api/lop-cong-khai (không kèm ?lop=) — danh sách MỌI lớp đang hoạt động (chỉ slug + tên),
// dùng cho màn hình "Chọn lớp" khi học sinh vào thẳng trang chủ mà chưa biết đường link riêng.
// Cả hai đều KHÔNG trả bất kỳ dữ liệu học sinh/điểm/quỹ nào — slug/danh sách này KHÔNG phải cơ
// chế xác thực, chỉ để hiển thị đẹp trước khi nhập mã.
export async function onRequestGet({ request, env }) {
  const slug = (new URL(request.url).searchParams.get('lop') || '').trim().toLowerCase();
  const tra = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

  if (!env.DB) return tra({ ok: false }, 500);

  if (!slug) {
    const { results } = await env.DB.prepare(
      'SELECT slug, ten, truong FROM lop WHERE dang_hoat_dong = 1 AND slug IS NOT NULL ORDER BY id'
    ).all();
    return tra({ ok: true, danhSach: results });
  }

  if (!/^[a-z0-9-]{1,32}$/.test(slug)) return tra({ ok: false }, 400);

  const lop = await env.DB.prepare(
    'SELECT ten, nam_hoc AS namHoc, truong FROM lop WHERE slug = ?1 AND dang_hoat_dong = 1'
  ).bind(slug).first();

  if (!lop) return tra({ ok: false }, 404);
  return tra({ ok: true, lop });
}
