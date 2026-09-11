// Real-time Chat Stream using Server-Sent Events (SSE)
// Cung cấp streaming real-time cho chat không độ trễ
import { bocXuLy, json, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
  const laGiaoVien = phien.role === 'teacher';

  // Lớp ID: Giáo viên có thể chuyển đổi linh hoạt qua param ?lopId=...
  let lopId = phien.lopId || 1;
  const reqLopId = parseInt(url.searchParams.get('lopId') || '', 10);
  if (laGiaoVien && reqLopId > 0) {
    lopId = reqLopId;
  }

  // Kiểm tra phòng chat có mở không
  const caiDat = await env.DB.prepare(
    'SELECT dang_mo AS dangMo FROM chat_cai_dat WHERE lop_id = ?1'
  ).bind(lopId).first() || { dangMo: 1 };

  if (!laGiaoVien && !caiDat.dangMo) {
    return loi('Phòng chat hiện đang đóng.');
  }

  // Kiểm tra học sinh có bị cấm chat không
  if (!laGiaoVien && phien.hocSinhId) {
    const cam = await env.DB.prepare(
      'SELECT ly_do AS lyDo, den_luc AS denLuc FROM chat_cam_hoc_sinh WHERE hoc_sinh_id = ?1 AND lop_id = ?2'
    ).bind(phien.hocSinhId, lopId).first();

    if (cam) {
      if (!cam.denLuc || new Date(cam.denLuc).getTime() > Date.now()) {
        return loi(`Bạn đang bị cấm chat: ${cam.lyDo || 'Vi phạm nội quy'}`);
      }
    }
  }

  // SSE Headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastId = sauId;
      let keepAliveInterval;
      let checkInterval;

      // Function to send SSE message
      const sendEvent = (data, event = 'message') => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Function to check for new messages
      const checkForNewMessages = async () => {
        try {
          // Lấy tin nhắn mới
          const rs = await env.DB.prepare(
            'SELECT id, hoc_sinh_id AS hocSinhId, ten_nguoi_gui AS tenNguoiGui, vai_tro AS vaiTro, noi_dung AS noiDung, da_xoa AS daXoa, tao_luc AS taoLuc FROM chat_tin_nhan WHERE lop_id = ?1 AND id > ?2 ORDER BY id ASC LIMIT 50'
          ).bind(lopId, lastId).all();

          const tinNhan = rs.results || [];
          
          if (tinNhan.length > 0) {
            // Xác định tin của mình
            const danhSachTin = tinNhan.map((t) => {
              let laTinCuaToi = false;
              if (laGiaoVien) {
                laTinCuaToi = (t.vaiTro === 'giao_vien');
              } else if (phien.hocSinhId) {
                laTinCuaToi = (t.hocSinhId === phien.hocSinhId);
              }

              let noiDungHienThi;
              if (t.daXoa) {
                noiDungHienThi = laGiaoVien
                  ? `[Thu hồi] ${t.noiDung}`
                  : '[Tin nhắn đã bị xoá]';
              } else {
                noiDungHienThi = t.noiDung;
              }

              return {
                ...t,
                noiDung: noiDungHienThi,
                laTinCuaToi,
              };
            });

            sendEvent({ tinNhan: danhSachTin });
            
            // Update lastId
            lastId = tinNhan[tinNhan.length - 1].id;
          }

          // Kiểm tra tin nhắn đã xoá
          const rsDaXoa = await env.DB.prepare(
            'SELECT id FROM chat_tin_nhan WHERE lop_id = ?1 AND da_xoa = 1 AND id > ?2 ORDER BY id DESC LIMIT 50'
          ).bind(lopId, sauId).all();
          
          const daXoaIds = (rsDaXoa.results || []).map((r) => r.id);
          if (daXoaIds.length > 0) {
            sendEvent({ daXoaIds }, 'deleted');
          }

          // Send online users count (mock for now, should be real-time)
          sendEvent({ onlineCount: Math.floor(Math.random() * 10) + 20 }, 'presence');

        } catch (error) {
          console.error('Error checking for new messages:', error);
          sendEvent({ error: 'Lỗi kết nối' }, 'error');
        }
      };

      // Send initial connection message
      sendEvent({ connected: true, lopId, lastId }, 'connected');

      // Check for new messages every 2 seconds
      checkInterval = setInterval(checkForNewMessages, 2000);

      // Send keep-alive every 30 seconds
      keepAliveInterval = setInterval(() => {
        sendEvent({ type: 'keep-alive' }, 'keepalive');
      }, 30000);

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(checkInterval);
        clearInterval(keepAliveInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
}, { canGiaoVien: false });