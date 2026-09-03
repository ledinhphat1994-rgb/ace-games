// GET /api/whoami — cho frontend biết đang đăng nhập là ai, để hiện đúng menu.
import { bocXuLy, json } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ phien }) => {
  return json({
    ok: true,
    role: phien.role,
    ten: phien.ten || '',
    vaiTro: phien.vaiTro || '',
    quyen: phien.quyen || [],
  });
});
