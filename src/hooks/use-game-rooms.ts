import { useQuery } from '@tanstack/react-query'
import type { BanSanh } from '@shared/protocol/game'

const NHIP_LAM_MOI_MS = 4000

interface PhanHoiDanhSachBan {
  ok: boolean
  rooms?: BanSanh[]
  loi?: string
}

async function layDanhSachBan(): Promise<BanSanh[]> {
  const res = await fetch('/api/game/rooms', { credentials: 'same-origin' })
  const duLieu = (await res.json().catch(() => null)) as PhanHoiDanhSachBan | null
  if (!res.ok || !duLieu?.ok) throw new Error(duLieu?.loi || `Không tải được danh sách bàn (${res.status}).`)
  return duLieu.rooms ?? []
}

/** Sảnh bàn đối kháng đang mở — làm mới mỗi 4 giây, đủ "sống" cho một lớp ~40 người mà không cần WebSocket riêng. */
export function useGameRooms() {
  return useQuery({
    queryKey: ['game-rooms'],
    queryFn: layDanhSachBan,
    refetchInterval: NHIP_LAM_MOI_MS,
    refetchIntervalInBackground: false,
    staleTime: NHIP_LAM_MOI_MS,
  })
}
