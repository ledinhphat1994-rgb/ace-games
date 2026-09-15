import { exports } from 'cloudflare:workers'
import { expect } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'

const cho = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function dangNhapLayCookie(username: string): Promise<string> {
  const res = await exports.default.fetch(`${GOC}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: MAT_KHAU }),
  })
  expect(res.status).toBe(200)
  await res.body?.cancel()
  return (res.headers.get('Set-Cookie') ?? '').split(';')[0]
}

type Loai<G, K> = Extract<G, { type: K }>

export interface KetNoiThu<G extends { type: string }> {
  status: number
  ws: WebSocket | null
  goi: G[]
  gui(duLieu: unknown): void
  /** Chờ gói chưa dùng tới có đúng loại (và điều kiện); mỗi gói chỉ khớp một lần. */
  cho<K extends G['type']>(type: K, dieuKien?: (g: Loai<G, K>) => boolean, thoiGianMs?: number): Promise<Loai<G, K>>
  /** Chắc chắn KHÔNG nhận gói loại này trong khoảng thời gian cho trước. */
  khongNhan<K extends G['type']>(type: K, dieuKien?: (g: Loai<G, K>) => boolean, thoiGianMs?: number): Promise<void>
  choDong(thoiGianMs?: number): Promise<{ code: number; reason: string }>
  dong(): void
}

export async function moKetNoi<G extends { type: string }>(
  duongDan: string,
  cookie: string,
  origin = GOC,
): Promise<KetNoiThu<G>> {
  const res = await exports.default.fetch(`${GOC}${duongDan}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: origin },
  })
  const goi: G[] = []
  const daDung = new Set<number>()
  let daDong: { code: number; reason: string } | null = null
  const ws = res.webSocket
  if (ws) {
    ws.accept()
    ws.addEventListener('message', (e) => {
      try {
        goi.push(JSON.parse(String(e.data)) as G)
      } catch {
        // Chuỗi "pong" giữ kết nối, không phải JSON.
      }
    })
    ws.addEventListener('close', (e) => {
      daDong = { code: e.code, reason: e.reason }
    })
  } else {
    await res.body?.cancel()
  }

  const timGoi = <K extends G['type']>(type: K, dieuKien: (g: Loai<G, K>) => boolean) =>
    goi.findIndex((g, i) => !daDung.has(i) && g.type === type && dieuKien(g as Loai<G, K>))

  return {
    status: res.status,
    ws,
    goi,
    gui: (duLieu) => ws?.send(typeof duLieu === 'string' ? duLieu : JSON.stringify(duLieu)),
    async cho(type, dieuKien = () => true, thoiGianMs = 3000) {
      for (let i = 0; i <= thoiGianMs / 10; i++) {
        const viTri = timGoi(type, dieuKien)
        if (viTri >= 0) {
          daDung.add(viTri)
          return goi[viTri] as Loai<G, typeof type>
        }
        await cho(10)
      }
      throw new Error(`Không nhận được gói "${type}". Đã nhận: ${JSON.stringify(goi)}`)
    },
    async khongNhan(type, dieuKien = () => true, thoiGianMs = 300) {
      await cho(thoiGianMs)
      expect(timGoi(type, dieuKien), `Không được nhận gói "${type}"`).toBe(-1)
    },
    async choDong(thoiGianMs = 3000) {
      for (let i = 0; i <= thoiGianMs / 10; i++) {
        if (daDong) return daDong
        await cho(10)
      }
      throw new Error('Kết nối không bị đóng như mong đợi.')
    },
    dong: () => {
      try {
        ws?.close(1000, 'xong')
      } catch {
        // Đã đóng.
      }
    },
  }
}
