// Video YouTube bị chủ sở hữu chặn phát trên trang khác (nhúng): tìm kiếm bỏ chúng ra, dán link thì báo trước khi chèn.
import { exports } from 'cloudflare:workers'
import { afterEach, describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { kiemTraNhung } from '../worker/lib/youtube-nhung'

const traLoi = (status: number) => (async () => new Response(status === 200 ? '{}' : 'x', { status })) as unknown as typeof fetch

describe('kiemTraNhung (oEmbed của YouTube)', () => {
  it('200 = nhúng được; 400 / 401 / 403 / 404 = không; lỗi máy chủ / mạng = không rõ (không chặn nhầm)', async () => {
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: traLoi(200) })).toBe('duoc')
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: traLoi(400) })).toBe('khong')
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: traLoi(401) })).toBe('khong')
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: traLoi(403) })).toBe('khong')
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: traLoi(404) })).toBe('khong')
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: traLoi(500) })).toBe('khong_ro')
    const hong = (async () => {
      throw new Error('mất mạng')
    }) as unknown as typeof fetch
    expect(await kiemTraNhung('aaaaaaaaaaa', { fetcher: hong })).toBe('khong_ro')
  })

  it('mã video sai thì không gọi ra ngoài; kết quả chắc chắn được nhớ lại', async () => {
    let soLanGoi = 0
    const dem = (async () => {
      soLanGoi++
      return new Response('x', { status: 401 })
    }) as unknown as typeof fetch
    expect(await kiemTraNhung('ngan', { fetcher: dem })).toBe('khong')
    expect(soLanGoi).toBe(0)
    const cache = await caches.open(`thu-nhung-${Date.now()}`)
    expect(await kiemTraNhung('bbbbbbbbbbb', { fetcher: dem, cache })).toBe('khong')
    expect(await kiemTraNhung('bbbbbbbbbbb', { fetcher: dem, cache })).toBe('khong')
    expect(soLanGoi).toBe(1)
  })
})

describe('API: /api/yt-check và /api/yt-search', () => {
  const fetchGoc = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = fetchGoc
  })

  it('/api/yt-check: phải đăng nhập, mã video phải hợp lệ', async () => {
    const khach = await exports.default.fetch(`${GOC}/api/yt-check?id=dQw4w9WgXcQ`)
    expect(khach.status).toBe(401)
    await khach.body?.cancel()
    const sai = await exports.default.fetch(`${GOC}/api/yt-check?id=khong-hop-le`, {
      headers: { Cookie: await dangNhapLayCookie('qa.v2.thu1') },
    })
    expect(sai.status).toBe(400)
    await sai.body?.cancel()
  })

  it('trình phát báo bị chặn nhúng (POST) → máy chủ nhớ: kiểm tra sau trả "khong" mà không cần hỏi YouTube', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const khach = await exports.default.fetch(`${GOC}/api/yt-check`, { method: 'POST', headers: { Origin: GOC, 'Content-Type': 'application/json' }, body: '{"id":"dQw4w9WgXcQ"}' })
    expect(khach.status).toBe(401)
    await khach.body?.cancel()
    const idChan = ('bao' + Date.now().toString(36) + '________').slice(0, 11)
    const bao = await exports.default.fetch(`${GOC}/api/yt-check`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: GOC, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idChan }),
    })
    expect(bao.status).toBe(200)
    await bao.body?.cancel()
    globalThis.fetch = (async () => {
      throw new Error('không được gọi ra ngoài')
    }) as unknown as typeof fetch
    const hoi = await exports.default.fetch(`${GOC}/api/yt-check?id=${idChan}`, { headers: { Cookie: cookie } })
    expect(await hoi.json()).toEqual({ nhung: 'khong' })
  })

  it('tìm kiếm bỏ video bị chặn nhúng, giữ video nhúng được và video chưa rõ (lỗi mạng)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const hau = Date.now().toString(36).slice(-5).padStart(5, '0')
    const id = (dau: string) => (dau + hau + '______').slice(0, 11)
    const [duoc, chan, khongRo] = [id('duoc-'), id('chan-'), id('khor-')]
    const ytInitialData = {
      contents: {
        twoColumnSearchResultsRenderer: {
          primaryContents: {
            sectionListRenderer: {
              contents: [
                {
                  itemSectionRenderer: {
                    contents: [duoc, chan, khongRo].map((videoId) => ({
                      videoRenderer: { videoId, title: { runs: [{ text: `Video ${videoId}` }] }, ownerText: { runs: [{ text: 'Kênh' }] } },
                    })),
                  },
                },
              ],
            },
          },
        },
      },
    }
    globalThis.fetch = (async (dauVao: string | URL | Request) => {
      const url = typeof dauVao === 'string' ? dauVao : dauVao instanceof URL ? dauVao.href : dauVao.url
      if (url.startsWith('https://www.youtube.com/results')) {
        return new Response(`<script>var ytInitialData = ${JSON.stringify(ytInitialData)};</script>`)
      }
      if (url.startsWith('https://www.youtube.com/oembed')) {
        if (url.includes(chan)) return new Response('Unauthorized', { status: 401 })
        if (url.includes(khongRo)) throw new Error('mất mạng')
        return new Response('{}')
      }
      return fetchGoc(dauVao as RequestInfo)
    }) as typeof fetch

    const res = await exports.default.fetch(`${GOC}/api/yt-search?q=${encodeURIComponent(`thu nhung ${hau}`)}`, { headers: { Cookie: cookie } })
    expect(res.status).toBe(200)
    const kq = (await res.json()) as { videoId: string }[]
    expect(kq.map((v) => v.videoId)).toEqual([duoc, khongRo])
  })
})
