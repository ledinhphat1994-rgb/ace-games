// Video YouTube có cho phát trên trang khác (nhúng) không. Nhiều MV / video có bản quyền bị chủ sở hữu tắt nhúng:
// chỉ xem được trên youtube.com, trình phát nhúng báo lỗi 101/150. Hỏi trước qua oEmbed công khai của YouTube:
// 200 = nhúng được, 401/403 = chủ video tắt nhúng, 400/404 = không tồn tại / riêng tư / đã xoá. Lỗi mạng thì không chặn (khong_ro).
// oEmbed không bắt được video bị chặn nhúng vì bản quyền (nhạc…): trình phát nhúng báo lỗi 101/150 thì máy trong phòng
// báo lại (ghiKhongNhung) để lần tìm / dán link sau loại luôn video đó.

export type KetQuaNhung = 'duoc' | 'khong' | 'khong_ro'

export const MA_VIDEO_YOUTUBE = /^[a-zA-Z0-9_-]{11}$/

const NHO_KET_QUA_GIAY = 24 * 60 * 60

const khoaNhung = (videoId: string) => new Request(`https://yt-embed.cache/${videoId}`)

/** Trình phát nhúng đã báo video không phát được trên trang khác: nhớ lại để tìm kiếm / dán link sau bỏ qua. */
export async function ghiKhongNhung(videoId: string, cache?: Cache): Promise<void> {
  if (!cache || !MA_VIDEO_YOUTUBE.test(videoId)) return
  await cache
    .put(khoaNhung(videoId), new Response('khong', { headers: { 'Cache-Control': `public, max-age=${NHO_KET_QUA_GIAY}` } }))
    .catch(() => {})
}

/** Chỉ đọc bộ nhớ (không gọi ra ngoài): video đã biết là không nhúng được. */
export async function daBiChanNhung(videoId: string, cache?: Cache): Promise<boolean> {
  const daNho = await cache?.match(khoaNhung(videoId)).catch(() => undefined)
  return daNho ? (await daNho.text()) === 'khong' : false
}

export async function kiemTraNhung(
  videoId: string,
  { fetcher = fetch, cache }: { fetcher?: typeof fetch; cache?: Cache } = {},
): Promise<KetQuaNhung> {
  if (!MA_VIDEO_YOUTUBE.test(videoId)) return 'khong'
  const khoa = khoaNhung(videoId)
  const daNho = await cache?.match(khoa).catch(() => undefined)
  if (daNho) {
    const giaTri = (await daNho.text()) as KetQuaNhung
    if (giaTri === 'duoc' || giaTri === 'khong') return giaTri
  }
  let ketQua: KetQuaNhung
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    const res = await fetcher(url, { signal: AbortSignal.timeout(4000) })
    await res.body?.cancel()
    ketQua = res.ok ? 'duoc' : [400, 401, 403, 404].includes(res.status) ? 'khong' : 'khong_ro'
  } catch {
    ketQua = 'khong_ro'
  }
  if (cache && ketQua !== 'khong_ro') {
    await cache
      .put(khoa, new Response(ketQua, { headers: { 'Cache-Control': `public, max-age=${NHO_KET_QUA_GIAY}` } }))
      .catch(() => {})
  }
  return ketQua
}
