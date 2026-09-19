import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { BanSanh } from '@shared/protocol/game'
import type { GoiLobbySession } from '@shared/protocol/game-sdk'

interface PhanHoiDanhSachBan {
  ok: boolean
  rooms?: BanSanh[]
  loi?: string
}

async function layDanhSachBan(gameType?: string): Promise<BanSanh[]> {
  const url = gameType ? `/api/game/rooms?gameType=${encodeURIComponent(gameType)}` : '/api/game/rooms'
  const res = await fetch(url, { credentials: 'same-origin' })
  const duLieu = (await res.json().catch(() => null)) as PhanHoiDanhSachBan | null
  if (!res.ok || !duLieu?.ok) throw new Error(duLieu?.loi || `Không tải được danh sách bàn (${res.status}).`)
  return duLieu.rooms ?? []
}

/**
 * Hook theo dõi danh sách bàn Đấu Trường Game.
 *
 * Tiêu chuẩn chịu tải (G0 Overload Gate):
 * - Không polling dồn dập mỗi 4 giây.
 * - Ưu tiên kết nối WebSocket tới GameLobbyDO (`/ws/game-lobby/:gameType`),
 *   nhận live events (`room_created`, `player_joined`, `match_started`, `match_ended`, `room_closed`).
 * - Khi WebSocket kết nối thành công: refetchInterval = false (0 polling).
 * - Chỉ fallback polling chậm (15s) khi mất kết nối WebSocket.
 */
export function useGameRooms(gameType?: string) {
  const queryClient = useQueryClient()
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const queryKey = useMemo(() => ['game-rooms', gameType || 'all'], [gameType])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${proto}//${window.location.host}/ws/game-lobby${gameType ? '/' + encodeURIComponent(gameType) : ''}`

    let ws: WebSocket
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = () => {
      if (disposed) return
      try {
        ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (disposed) return
          setWsConnected(true)
        }

        ws.onmessage = (e) => {
          if (disposed) return
          try {
            const data = JSON.parse(e.data) as GoiLobbySession
            if (data.type === 'lobby.snapshot') {
              queryClient.setQueryData(queryKey, data.rooms as BanSanh[])
            } else if (data.type === 'lobby.event') {
              const { event, ban } = data
              queryClient.setQueryData<BanSanh[]>(queryKey, (old = []) => {
                if (event === 'room_closed') {
                  const targetId = (ban as { id: string }).id
                  return old.filter((r) => r.id !== targetId)
                }
                const updatedBan = ban as BanSanh
                const idx = old.findIndex((r) => r.id === updatedBan.id)
                if (idx === -1) {
                  return [updatedBan, ...old]
                }
                const copy = [...old]
                copy[idx] = updatedBan
                return copy
              })
            }
          } catch {
            // Bỏ qua gói tin không hợp lệ
          }
        }

        ws.onclose = () => {
          if (disposed) return
          setWsConnected(false)
          // Thử kết nối lại sau 5 giây nếu bị rớt
          reconnectTimeout = setTimeout(connect, 5000)
        }

        ws.onerror = () => {
          if (disposed) return
          setWsConnected(false)
        }
      } catch {
        setWsConnected(false)
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [gameType, queryClient, queryKey])

  return useQuery({
    queryKey,
    queryFn: () => layDanhSachBan(gameType),
    // Khi WS đang kết nối: tắt hoàn toàn polling (0 request).
    // Chỉ fallback polling chậm 15s khi rớt kết nối WS.
    refetchInterval: wsConnected ? false : 15_000,
    refetchIntervalInBackground: false,
    staleTime: wsConnected ? Infinity : 10_000,
  })
}
