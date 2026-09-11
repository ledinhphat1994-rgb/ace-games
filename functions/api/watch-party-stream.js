// Watch Party Real-time Sync Stream using SSE
// Sync playback state, participants, and chat for watch parties
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) return loi('Thiếu mã phòng.');

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
      let lastSyncTime = Date.now();
      let keepAliveInterval;
      let checkInterval;

      // Function to send SSE message
      const sendEvent = (data, event = 'message') => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Function to check for sync updates
      const checkForSyncUpdates = async () => {
        try {
          // Lấy trạng thái phòng hiện tại
          const roomState = await env.DB.prepare(
            'SELECT id, dang_phat AS dangPhat, thoi_gian_hien_tai AS thoiGianHienTai, so_nguoi AS soNguoi, cap_nhat_luc AS capNhatLuc FROM watch_party WHERE id = ?1'
          ).bind(roomId).first();

          if (roomState) {
            const updateTime = roomState.capNhatLuc ? new Date(roomState.capNhatLuc).getTime() : 0;
            
            // Chỉ gửi update nếu có thay đổi
            if (updateTime > lastSyncTime) {
              sendEvent({
                roomId: roomState.id,
                isPlaying: roomState.dangPhat === 1,
                currentTime: roomState.thoiGianHienTai,
                participantCount: roomState.soNguoi,
                timestamp: updateTime
              }, 'sync');
              
              lastSyncTime = updateTime;
            }
          }

          // Send participant count every 5 seconds
          sendEvent({
            participantCount: roomState?.soNguoi || 0,
            timestamp: Date.now()
          }, 'participants');

        } catch (error) {
          console.error('Error checking watch party sync:', error);
          sendEvent({ error: 'Lỗi đồng bộ' }, 'error');
        }
      };

      // Send initial connection message
      const initialState = await env.DB.prepare(
        'SELECT id, dang_phat AS dangPhat, thoi_gian_hien_tai AS thoiGianHienTai, so_nguoi AS soNguoi FROM watch_party WHERE id = ?1'
      ).bind(roomId).first();

      sendEvent({ 
        connected: true, 
        roomId, 
        initialState: initialState ? {
          isPlaying: initialState.dangPhat === 1,
          currentTime: initialState.thoiGianHienTai,
          participantCount: initialState.soNguoi
        } : null
      }, 'connected');

      // Check for sync updates every 1 second for real-time feel
      checkInterval = setInterval(checkForSyncUpdates, 1000);

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