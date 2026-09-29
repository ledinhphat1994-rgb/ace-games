import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Eye, Flag, Link2, RotateCcw, Swords } from 'lucide-react'
import { toast } from 'sonner'
import { CAC_BIEU_CAM, type BieuCam, type PlayerSide } from '@shared/protocol/game'
import type { BanOnline } from '@/hooks/use-game'
import type { PlayMode } from './GamePlayToolbar'
import type { ActiveEmoteBubble, QuickEmoteItem } from './GameQuickEmote'

// Phần dùng chung của ba bàn cờ (Caro, Cờ vua, Cờ tướng) khi mở từ sảnh: chế độ "Đấu online" do máy chủ làm trọng
// tài, bên cạnh hai chế độ chơi tại chỗ (với máy, hai người một máy).

/**
 * Chế độ chơi của bàn cờ. Mở từ sảnh (có bàn online) thì mặc định "Đấu online". Người đang ngồi ghế trong ván online
 * đang diễn ra không được đổi sang chế độ khác (đồng hồ lượt vẫn chạy trên máy chủ); nếu đang tập với máy mà đối thủ
 * vào bàn thì tự quay về bàn online.
 */
export function useCheDoBan(online: BanOnline | undefined, initialMode?: PlayMode) {
  const [mode, setMode] = useState<PlayMode>(initialMode ?? (online ? 'online' : 'ai'))
  const trangThai = online?.meta.status
  const [trangThaiTruoc, setTrangThaiTruoc] = useState(trangThai)
  if (online && trangThai !== trangThaiTruoc) {
    setTrangThaiTruoc(trangThai)
    if (trangThai === 'playing' && online.mySide && mode !== 'online') setMode('online')
  }

  // Báo khi ván online của mình vừa bắt đầu (đối thủ vào bàn hoặc cả hai đồng ý đấu lại) — không báo khi vừa mở
  // lại trang giữa ván (trạng thái trước đó chỉ là giá trị mặc định, chưa phải dữ liệu thật của bàn).
  const daDongBo = Boolean(online?.daDongBo)
  const truocRef = useRef({ trangThai, daDongBo })
  const coGhe = Boolean(online?.mySide)
  const [vanVuaBatDau, setVanVuaBatDau] = useState(false)

  useEffect(() => {
    const truoc = truocRef.current
    truocRef.current = { trangThai, daDongBo }
    if (coGhe && truoc.daDongBo && truoc.trangThai !== 'playing' && trangThai === 'playing') {
      setVanVuaBatDau(true)
    }
  }, [trangThai, daDongBo, coGhe])

  const dangCoVanOnline = coGhe && trangThai === 'playing'
  /** Đổi chế độ; trả về false nếu bị chặn (đang có ván online). */
  const doiCheDo = (moi: PlayMode): boolean => {
    if (mode === 'online' && moi !== 'online' && dangCoVanOnline) {
      toast.warning('Bạn đang có ván online — hãy đi tiếp hoặc xin thua trước khi đổi chế độ.', {
        id: 'ban-online-doi-che-do',
      })
      return false
    }
    setMode(moi)
    return true
  }

  return {
    mode,
    doiCheDo,
    laOnline: mode === 'online' && Boolean(online),
    vanVuaBatDau,
    xoaVanVuaBatDau: () => setVanVuaBatDau(false),
  }
}

/** Tên hiển thị của người ngồi ghế `side` (hoặc nhãn ghế khi chưa có người). */
export function tenNguoiChoi(online: BanOnline, side: PlayerSide): string {
  const ten = side === 'X' ? online.meta.playerXName : online.meta.playerOName
  const coNguoi = side === 'X' ? online.meta.playerX : online.meta.playerO
  return ten || (coNguoi ? 'Người chơi' : 'Ghế trống')
}

/** Biểu cảm đối thủ gửi qua máy chủ, hiện ở bong bóng phía đối thủ (tự ẩn sau vài giây). */
export function useBongBieuCamDoiThu(
  online: BanOnline | undefined,
  danhSach: readonly QuickEmoteItem[],
): ActiveEmoteBubble | null {
  const moi = online?.incomingEmote ?? null
  const [daXuLy, setDaXuLy] = useState<number | null>(moi?.id ?? null)
  const [bong, setBong] = useState<ActiveEmoteBubble | null>(null)
  if (online && moi && moi.id !== daXuLy) {
    setDaXuLy(moi.id)
    const cuaNguoiChoi = moi.senderKey === online.meta.playerX || moi.senderKey === online.meta.playerO
    if (moi.senderKey !== online.myActorKey && cuaNguoiChoi) {
      const muc = danhSach.find((m) => m.emoji === moi.emote)
      setBong({ emoji: muc?.emoji ?? moi.emote, quote: muc?.quote ?? moi.sender, sender: 'opponent' })
    }
  }
  useEffect(() => {
    if (!bong) return
    const t = setTimeout(() => setBong(null), 3800)
    return () => clearTimeout(t)
  }, [bong])
  return bong
}

const laBieuCamHopLe = (v: string): v is BieuCam => (CAC_BIEU_CAM as readonly string[]).includes(v)

/** Gửi biểu cảm lên bàn online (chỉ người chơi; máy chủ chỉ nhận danh sách cho phép và giới hạn nhịp gửi). */
export function guiBieuCamOnline(online: BanOnline, emoji: string): void {
  if (online.mySide && laBieuCamHopLe(emoji)) online.sendEmote(emoji)
}

export async function saoChepLinkBan(gameId: string): Promise<void> {
  const url = `${window.location.origin}/game/${encodeURIComponent(gameId)}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Đã sao chép link bàn — gửi cho bạn để vào đấu.')
  } catch {
    toast.error('Không sao chép được. Link bàn: ' + url)
  }
}

export interface NutHanhDongBan {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
}

/** Nút hành động trên thanh công cụ ở chế độ online, theo ghế và trạng thái ván. */
export function nutHanhDongOnline(online: BanOnline, moXinThua: () => void): NutHanhDongBan {
  const { meta, mySide } = online
  if (!mySide) {
    if (meta.status === 'waiting') {
      return { label: 'Vào chơi', icon: <Swords className="size-3.5" />, onClick: () => online.joinGame() }
    }
    return { label: 'Đang xem', icon: <Eye className="size-3.5" />, onClick: () => {}, disabled: true }
  }
  if (meta.status === 'playing') {
    return { label: 'Xin thua', icon: <Flag className="size-3.5 text-rose-400" />, onClick: moXinThua }
  }
  if (meta.status === 'ended') {
    if (meta.rematchBy === mySide) {
      return { label: 'Đã mời đấu lại', icon: <RotateCcw className="size-3.5" />, onClick: () => {}, disabled: true }
    }
    return {
      label: meta.rematchBy ? 'Nhận đấu lại' : 'Đấu lại',
      icon: <RotateCcw className="size-3.5" />,
      onClick: () => online.rematch(),
    }
  }
  return { label: 'Mời bạn', icon: <Link2 className="size-3.5" />, onClick: () => void saoChepLinkBan(online.gameId) }
}

/** Dòng phụ của trạng thái online: mất kết nối, hoặc người tới lượt và đồng hồ lượt. */
export function moTaPhuOnline(online: BanOnline, tenLuot: string): string {
  if (online.trangThai === 'phien_bi_thay') return 'Phiên đã mở ở nơi khác'
  if (online.trangThai !== 'da_ket_noi') return 'Đang kết nối lại…'
  if (online.meta.status === 'playing') return `${tenLuot} · còn ${online.turnTimeRemaining}s`
  return ''
}
