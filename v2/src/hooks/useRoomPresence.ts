import { useCallback, useEffect, useRef, useState } from 'react'

export interface ThanhVienPhong {
  key: string
  ten: string
  soKetNoi: number
}

export type TrangThaiKetNoi = 'dang_ket_noi' | 'da_ket_noi' | 'mat_ket_noi'

interface GoiTin {
  type?: string
  members?: ThanhVienPhong[]
}

// Không tự kết nối lại và không ping định kỳ: mỗi tin gửi lên đều đánh thức Durable Object.
export function useRoomPresence(maPhong: string) {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoi>('dang_ket_noi')
  const [thanhVien, setThanhVien] = useState<ThanhVienPhong[]>([])
  const [doTreMs, setDoTreMs] = useState<number | null>(null)
  const [lanKetNoi, setLanKetNoi] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const lucGuiPingRef = useRef<number | null>(null)

  useEffect(() => {
    const giaoThuc = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${giaoThuc}//${location.host}/ws/room/${encodeURIComponent(maPhong)}`)
    wsRef.current = ws

    ws.onopen = () => setTrangThai('da_ket_noi')
    ws.onmessage = (e) => {
      let goi: GoiTin
      try {
        goi = JSON.parse(String(e.data)) as GoiTin
      } catch {
        return
      }
      if (goi.type === 'presence' && Array.isArray(goi.members)) setThanhVien(goi.members)
      if (goi.type === 'pong' && lucGuiPingRef.current !== null) {
        setDoTreMs(Math.round(performance.now() - lucGuiPingRef.current))
        lucGuiPingRef.current = null
      }
    }
    ws.onclose = () => {
      setTrangThai('mat_ket_noi')
      setThanhVien([])
    }

    return () => {
      ws.onclose = null
      ws.close(1000, 'roi_trang')
      wsRef.current = null
    }
  }, [maPhong, lanKetNoi])

  const doDoTre = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    lucGuiPingRef.current = performance.now()
    ws.send(JSON.stringify({ type: 'ping' }))
  }, [])

  const ketNoiLai = useCallback(() => {
    setTrangThai('dang_ket_noi')
    setLanKetNoi((n) => n + 1)
  }, [])

  return { trangThai, thanhVien, doTreMs, doDoTre, ketNoiLai }
}
