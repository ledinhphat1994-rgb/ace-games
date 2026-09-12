// API Tìm kiếm YouTube qua server proxy bảo mật (Phase 4G - Campus Media Studio)
// API key YOUTUBE_DATA_API_KEY chỉ lưu tại biến môi trường máy chủ (Cloudflare secret).
// Tuyệt đối không để lộ key ra client hoặc repo.
import { json, loi } from '../_lib/api.js';
import { checkRateLimit } from '../_lib/social.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  const apiKey = (env.YOUTUBE_DATA_API_KEY || '').trim();
  const isConfigured = Boolean(apiKey);

  if (!q || q.length < 2) {
    return json({
      ok: true,
      configured: isConfigured,
      items: [],
      message: 'Vui lòng nhập tối thiểu 2 ký tự để tìm kiếm.'
    });
  }

  if (!isConfigured) {
    return json({
      ok: true,
      configured: false,
      code: 'youtube_unconfigured',
      items: [],
      message: 'Tìm kiếm YouTube hiện chưa khả dụng. Bạn vẫn có thể dán liên kết.'
    });
  }

  // Rate limit theo IP: tối đa 30 request / phút
  const clientIp = request.headers.get('cf-connecting-ip') || 'anon';
  const allowed = await checkRateLimit(env, `yt-search:${clientIp}`, 30, 60000);
  if (!allowed) {
    return json({ ok: false, loi: 'Bạn đang tìm kiếm quá nhanh. Vui lòng chờ giây lát.', code: 'rate_limited' }, 429);
  }

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&safeSearch=strict&maxResults=12&q=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let safeCode = 'youtube_upstream_error';
      let safeMsg = 'Không thể tải kết quả tìm kiếm từ YouTube.';

      try {
        const errJson = await response.json();
        const errReason = errJson?.error?.errors?.[0]?.reason || errJson?.error?.status || '';
        if (errReason === 'quotaExceeded' || errReason === 'rateLimitExceeded') {
          safeCode = 'youtube_quota_exceeded';
          safeMsg = 'Hạn mức tìm kiếm YouTube tạm thời đạt giới hạn.';
        } else if (errReason === 'keyInvalid' || errReason === 'API_KEY_INVALID') {
          safeCode = 'youtube_invalid_key';
          safeMsg = 'Khóa API YouTube không hợp lệ.';
        } else if (errReason === 'accessNotConfigured' || errReason === 'SERVICE_DISABLED') {
          safeCode = 'youtube_api_disabled';
          safeMsg = 'Dịch vụ YouTube API chưa được kích hoạt.';
        }
      } catch {
        // Ignore json parse error on upstream failure
      }

      return json({
        ok: false,
        configured: true,
        code: safeCode,
        items: [],
        message: safeMsg
      }, 502);
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
        thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.default?.url || '',
        publishedAt: it.snippet?.publishedAt || ''
      }));

    return json({
      ok: true,
      configured: true,
      items
    });
  } catch {
    return loi('Lỗi khi tìm kiếm video YouTube.', 500);
  }
}

