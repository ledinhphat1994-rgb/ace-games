export type NguonVideo = 'YOUTUBE' | 'GOOGLE_DRIVE' | 'NATIVE_HTML5' | 'UNSUPPORTED'

const URL_TOI_DA = 1000
const MIEN_YOUTUBE = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])
const ID_YOUTUBE = /^[\w-]{11}$/
const ID_DRIVE = /^[\w-]{10,}$/

function docUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

// Như chuanUrlMedia của bản cũ nhưng phòng học chỉ nhận https:// (không có đường dẫn nội bộ) và link quá dài
// bị từ chối thay vì bị cắt ngắn. Trả về: URL | null nếu rỗng | false nếu không hợp lệ.
export function chuanUrlVideo(v: unknown): string | null | false {
  const s = String(v ?? '').trim()
  if (!s) return null
  if (s.length > URL_TOI_DA) return false
  return docUrl(s)?.protocol === 'https:' ? s : false
}

export function layIdYoutube(url: string): string | null {
  const u = docUrl(url)
  if (!u) return null
  const host = u.hostname.toLowerCase()
  let id: string | null = null
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null
  } else if (MIEN_YOUTUBE.has(host)) {
    id = u.pathname === '/watch' ? u.searchParams.get('v') : (u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null)
  }
  return id && ID_YOUTUBE.test(id) ? id : null
}

export function layIdDrive(url: string): string | null {
  const u = docUrl(url)
  if (!u || u.hostname.toLowerCase() !== 'drive.google.com') return null
  const id = u.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] ?? u.searchParams.get('id')
  return id && ID_DRIVE.test(id) ? id : null
}

// Như phanLoaiProvider của phong-watch.js: chỉ YouTube và file mp4/webm/ogg đồng bộ được; Drive chỉ nhúng.
export function phanLoaiNguon(url: string): NguonVideo {
  if (layIdYoutube(url)) return 'YOUTUBE'
  if (layIdDrive(url)) return 'GOOGLE_DRIVE'
  const u = docUrl(url)
  if (u && /\.(mp4|webm|ogg)$/i.test(u.pathname)) return 'NATIVE_HTML5'
  return 'UNSUPPORTED'
}
