// API Tìm kiếm YouTube qua server proxy bảo mật (Phase 4G - Campus Media Studio)
// Hỗ trợ cả Google Data API v3 (khi có YOUTUBE_DATA_API_KEY) lẫn fallback tìm kiếm công khai trực tiếp.
// Tuyệt đối không để lộ key ra client hoặc repo.
import { json, loi } from '../_lib/api.js';
import { checkRateLimit } from '../_lib/social.js';

// Fallback: Tìm kiếm video YouTube qua InnerTube API (không cần API key, tương thích Cloudflare Workers)
async function searchYoutubePublic(q) {
  // 1. Thử InnerTube API chính thức của YouTube Web Client
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20231201.00.00'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231201.00.00',
            hl: 'vi',
            gl: 'VN'
          }
        },
        query: q
      })
    });

    if (res.ok) {
      const data = await res.json();
      const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      const items = [];
      for (const s of sections) {
        const list = s?.itemSectionRenderer?.contents || [];
        for (const it of list) {
          const vr = it?.videoRenderer;
          if (vr && vr.videoId) {
            items.push({
              videoId: vr.videoId,
              title: vr.title?.runs?.map(r => r.text).join('') || vr.title?.simpleText || 'Video YouTube',
              channelTitle: vr.ownerText?.runs?.map(r => r.text).join('') || '',
              thumbnail: vr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
              publishedAt: vr.publishedTimeText?.simpleText || ''
            });
            if (items.length >= 12) break;
          }
        }
        if (items.length >= 12) break;
      }
      if (items.length > 0) return items;
    }
  } catch {
    // Thử cách 2 bên dưới
  }

  // 2. Thử tìm kiếm qua HTML với cookie chấp thuận SOCS
  try {
    const endpoint = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        'Cookie': 'SOCS=CAESEwgDEgk2MTQ5MDUzMjQaAnZpIAEaBgiA_LyaBg; CONSENT=YES+cb.20230531-04-p0.en+FX+999; PREF=hl=vi&gl=VN'
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    let jsonText = '';
    const idx = html.indexOf('ytInitialData = ');
    if (idx !== -1) {
      const start = idx + 'ytInitialData = '.length;
      const end = html.indexOf(';</script>', start);
      if (end !== -1) jsonText = html.slice(start, end);
    }
    if (!jsonText) {
      const m = html.match(/ytInitialData\s*=\s*({.+?});/s);
      if (m) jsonText = m[1];
    }
    if (!jsonText) return [];

    const data = JSON.parse(jsonText);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const items = [];

    for (const section of contents) {
      const list = section?.itemSectionRenderer?.contents || [];
      for (const item of list) {
        const vr = item?.videoRenderer;
        if (vr && vr.videoId) {
          const title = vr.title?.runs?.map(r => r.text).join('') || vr.title?.simpleText || 'Video YouTube';
          const channelTitle = vr.ownerText?.runs?.map(r => r.text).join('') || '';
          const thumbnail = vr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
          const publishedAt = vr.publishedTimeText?.simpleText || '';
          items.push({
            videoId: vr.videoId,
            title,
            channelTitle,
            thumbnail,
            publishedAt
          });
          if (items.length >= 12) break;
        }
      }
      if (items.length >= 12) break;
    }

    return items;
  } catch {
    return [];
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  const apiKey = (env.YOUTUBE_DATA_API_KEY || '').trim();

  // Kiểm tra cấu hình: hệ thống luôn khả dụng qua Google API hoặc public fallback
  if (!q || q.length < 2) {
    return json({
      ok: true,
      configured: true,
      items: [],
      message: 'Vui lòng nhập tối thiểu 2 ký tự để tìm kiếm.'
    });
  }

  // Rate limit theo IP: tối đa 30 request / phút
  const clientIp = request.headers.get('cf-connecting-ip') || 'anon';
  const allowed = await checkRateLimit(env, `yt-search:${clientIp}`, 30, 60000);
  if (!allowed) {
    return json({ ok: false, loi: 'Bạn đang tìm kiếm quá nhanh. Vui lòng chờ giây lát.', code: 'rate_limited' }, 429);
  }

  try {
    let items = [];

    // 1. Thử dùng Google Data API nếu có API key
    if (apiKey) {
      try {
        const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&safeSearch=strict&maxResults=12&q=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const rawItems = Array.isArray(data.items) ? data.items : [];
          items = rawItems
            .filter((it) => it && it.id && it.id.videoId)
            .map((it) => ({
              videoId: it.id.videoId,
              title: String(it.snippet?.title || 'Video YouTube'),
              channelTitle: String(it.snippet?.channelTitle || ''),
              thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.default?.url || '',
              publishedAt: it.snippet?.publishedAt || ''
            }));
        }
      } catch {
        // Tiếp tục thử fallback công khai bên dưới
      }
    }

    // 2. Nếu chưa có API key hoặc Google API không trả về kết quả, dùng fallback công khai
    if (items.length === 0) {
      items = await searchYoutubePublic(q);
    }

    return json({
      ok: true,
      configured: true,
      items
    });
  } catch {
    return loi('Lỗi khi tìm kiếm video YouTube.', 500);
  }
}
