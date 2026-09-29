import { useQuery } from '@tanstack/react-query'
import type { GameType } from '@shared/protocol/game'
import type { ThongKeGame, ThongKeHocTap } from '@shared/protocol/thong-ke-sanh'
import { usePhien } from '@/app/phien'

async function layThongKe<T>(duongDan: string): Promise<T> {
  const res = await fetch(duongDan, { credentials: 'same-origin' })
  const duLieu = (await res.json().catch(() => null)) as { ok?: boolean; thongKe?: T; loi?: string } | null
  if (!res.ok || !duLieu?.ok || !duLieu.thongKe) throw new Error(duLieu?.loi || `Không tải được số liệu (${res.status}).`)
  return duLieu.thongKe
}

/** Chỉ Quản trị trường mới gọi; người khác không gửi yêu cầu nào (máy chủ vẫn tự chặn 403). */
function useLaQuanTriTruong() {
  const { nguoiDung } = usePhien()
  return Boolean(nguoiDung?.isSchoolAdmin)
}

/** Lịch sử 7 ngày của sảnh Học tập (phần đang diễn ra lấy từ sảnh thời gian thực). */
export function useThongKeHocTap() {
  const laQuanTri = useLaQuanTriTruong()
  const query = useQuery({
    queryKey: ['thong-ke-sanh', 'hoc_tap'],
    queryFn: () => layThongKe<ThongKeHocTap>('/api/admin/thong-ke-sanh?loai=hoc_tap'),
    enabled: laQuanTri,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
  return { laQuanTri, ...query }
}

/** Lịch sử 7 ngày của sảnh Game; có gameType thì chỉ trò đó. */
export function useThongKeGame(gameType?: GameType) {
  const laQuanTri = useLaQuanTriTruong()
  const query = useQuery({
    queryKey: ['thong-ke-sanh', 'game', gameType ?? 'tat_ca'],
    queryFn: () =>
      layThongKe<ThongKeGame>(`/api/admin/thong-ke-sanh?loai=game${gameType ? `&gameType=${encodeURIComponent(gameType)}` : ''}`),
    enabled: laQuanTri,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
  return { laQuanTri, ...query }
}
