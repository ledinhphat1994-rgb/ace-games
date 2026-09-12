// API Tìm kiếm YouTube qua server proxy bảo mật (Phase 4F - Campus Media Studio)
// API key YOUTUBE_DATA_API_KEY chỉ lưu tại biến môi trường máy chủ (Cloudflare secret).
// Tuyệt đối không để lộ key ra client hoặc repo.
import { json, loi } from '../_lib/api.js';
import { checkRateLimit } from '../_lib/social.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  if (!q || q.length < 2) {
    return json({ ok: true, configured: Boolean(env.YOUTUBE_DATA_API_KEY), items: [], message: 'Vui lòng nhập tối thiểu 2 ký tự để tìm kiếm.' });
  }

  const apiKey = (env.YOUTUBE_DATA_API_KEY || '').trim();
  if (!apiKey) {
    return json({
      ok: true,
      configured: false,
      items: [],
      message: 'Tìm kiếm YouTube chưa được cấu hình.'
    });
  }

  // Rate limit theo IP hoặc client: tối đa 20 request / phút
  const clientIp = request.headers.get('cf-connecting-ip') || 'anon';
  const allowed = await checkRateLimit(env, `yt-search:${clientIp}`, 20, 60000);
  if (!allowed) {
    return json({ ok: false, loi: 'Bạn đang tìm kiếm quá nhanh. Vui lòng chờ giây lát.', code: 'rate_limited' }, 429);
  }

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&safeSearch=strict&maxResults=10&q=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('YouTube API search error status:', response.status);
      return json({
        ok: true,
        configured: true,
        items: [],
        message: 'Không thể tải kết quả tìm kiếm từ YouTube.'
      });
    }

    const data = await response.json();
    const rawItems = Array.isArray(data.items) ? data.items : [];

    // Chỉ trích xuất các trường an toàn tối thiểu theo yêu cầu UI
    const items = rawItems
      .filter((it) => it && it.id && it.id.videoId)
      .map((it) => ({
        videoId: it.id.videoId,
        title: String(it.snippet?.title || 'Video YouTube'),
        channelTitle: String(it.snippet?.channelTitle || ''),
        thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || '',
        publishedAt: it.snippet?.publishedAt || ''
      }));

    return json({
      ok: true,
      configured: true,
      items
    });
  } catch (err) {
    console.error('YouTube search exception:', err);
    return loi('Lỗi khi tìm kiếm video YouTube.', 500);
  }
}
