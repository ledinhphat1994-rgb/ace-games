import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  XiangqiPosition,
  type XiangqiMove,
  type Side,
  RED,
  GENERAL,
  ADVISOR,
  ELEPHANT,
  HORSE,
  CHARIOT,
  CANNON,
  SOLDIER,
  typeOf,
  sideOf,
  type XiangqiEndReason,
} from '../../../../shared/games/xiangqi/xiangqi-engine'
import { findBestXiangqiMove } from '../../../../shared/games/xiangqi/xiangqi-ai'
import { mauQuanCua } from '@shared/protocol/game'
import { dungTheCoTuong } from '../../../../worker/game-engine'
import type { BanOnline } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import {
  guiBieuCamOnline,
  moTaPhuOnline,
  nutHanhDongOnline,
  tenNguoiChoi,
  useBongBieuCamDoiThu,
  useCheDoBan,
} from '../ban-online'
import { GameCapturedTray } from '../GameCapturedTray'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameClockWidget } from '../GameClockWidget'
import { useGameClock } from '../use-game-clock'
import { GameQuickEmote, GameOpponentBubble, GamePlayerBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'
import { GameHeroicBanner, type HeroicBannerType } from '../GameHeroicBanner'
import { playGameOverSound, playGameStartSound } from '../game-audio'
import { toast } from 'sonner'

const INITIAL_XIANGQI_COUNTS: Record<number, number> = {
  [CHARIOT]: 2,
  [HORSE]: 2,
  [ELEPHANT]: 2,
  [ADVISOR]: 2,
  [GENERAL]: 1,
  [CANNON]: 2,
  [SOLDIER]: 5,
}

// Chữ Hán thư pháp trên quân cờ
const TEN_QUAN_RED: Record<number, string> = {
  [GENERAL]: '帥',
  [ADVISOR]: '仕',
  [ELEPHANT]: '相',
  [HORSE]: '傌',
  [CHARIOT]: '俥',
  [CANNON]: '炮',
  [SOLDIER]: '兵',
}

const TEN_QUAN_BLACK: Record<number, string> = {
  [GENERAL]: '將',
  [ADVISOR]: '士',
  [ELEPHANT]: '象',
  [HORSE]: '馬',
  [CHARIOT]: '車',
  [CANNON]: '砲',
  [SOLDIER]: '卒',
}

const DANH_SACH_THAI_DO_XIANGQI: QuickEmoteItem[] = [
  { id: 'fire', emoji: '⚔️', label: 'Quyết chiến', quote: 'Tới bến luôn nào!' },
  { id: 'tea', emoji: '☕', label: 'Thong thả', quote: 'Cứ bình tĩnh uống trà suy tính.' },
  { id: 'cool', emoji: '😎', label: 'Tự tin', quote: 'Nước cờ quá đẳng cấp!' },
  { id: 'clap', emoji: '👏', label: 'Hay quá', quote: 'Nước đi rất tuyệt vời!' },
  { id: 'shocked', emoji: '🤯', label: 'Bất ngờ', quote: 'Nước cờ ngoài dự tính!' },
  { id: 'skull', emoji: '💀', label: 'Căng thẳng', quote: 'Pha này căng thẳng rồi!' },
  { id: 'think', emoji: '🤔', label: 'Tính toán', quote: 'Để ta mưu lược thêm vài nước.' },
  { id: 'shh', emoji: '🤫', label: 'Bình tĩnh', quote: 'Đừng vội mừng, ván cờ còn dài!' },
]

function XiangqiPieceToken({ piece }: { piece: number }) {
  const side = sideOf(piece)
  const type = typeOf(piece)
  const isRed = side === RED
  const text = isRed ? TEN_QUAN_RED[type] : TEN_QUAN_BLACK[type]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full size-[96%] select-none transition-transform duration-150 hover:scale-92 active:scale-85 shadow-xl cursor-pointer',
        isRed
          ? 'bg-gradient-to-b from-[#fdf6e2] to-[#e4ceaa] border-[2.5px] border-red-700 shadow-red-950/50 text-red-600 font-bold'
          : 'bg-gradient-to-b from-[#f0eae1] to-[#cfc4b2] border-[2.5px] border-slate-900 shadow-black/60 text-slate-900 font-bold'
      )}
    >
      {/* Vòng tròn hoa văn bên trong */}
      <div
        className={cn(
          'size-[85%] rounded-full border border-dashed flex items-center justify-center text-xl sm:text-2xl md:text-3xl 2xl:text-4xl font-serif font-black',
          isRed ? 'border-red-400' : 'border-slate-500'
        )}
      >
        {text}
      </div>
    </div>
  )
}

const LY_DO_KET_THUC: Record<XiangqiEndReason, string> = {
  checkmate: 'Chiếu bí',
  stalemate: 'Hết nước đi',
  repetition: 'Lặp lại thế cờ 3 lần — hoà',
  no_capture: '60 nước không ăn quân — hoà',
}

interface XiangqiBoardProps {
  onBack?: () => void
  initialMode?: PlayMode
  /** Bàn online (mở từ sảnh): PvP chuyển sang Online — máy chủ làm trọng tài, đối thủ là người thật. */
  online?: BanOnline
}

export function XiangqiBoard({ onBack, initialMode, online }: XiangqiBoardProps) {
  const [posTaiCho, setPos] = useState<XiangqiPosition>(() => XiangqiPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
  } | null>(null)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerSide] = useState<Side>(RED)
  // Bàn online: thế cờ dựng lại từ chuỗi nước máy chủ đã xét; bên đi trước của ván cầm quân Đỏ.
  const nuocOnline = online?.moves
  const posOnline = useMemo(() => (nuocOnline ? dungTheCoTuong(nuocOnline) : null), [nuocOnline])
  const pos = laOnline && posOnline ? posOnline : posTaiCho
  const benOnline: Side | null = online?.mySide ? (mauQuanCua(online.meta.firstTurn, online.mySide) as Side) : null
  // Góc nhìn của màn hình: quân của mình ở dưới (người xem bàn online nhìn từ phía Đỏ).
  const benCuaToi: Side = laOnline ? (benOnline ?? RED) : playerSide
  const latBan = benCuaToi !== RED
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null)
  const nuocCuoi = laOnline ? (nuocOnline?.at(-1) ?? null) : lastMove
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)
  const [customGameOver, setCustomGameOver] = useState<{
    over: boolean
    winner: Side | null
    reason: string
  } | null>(null)

  const legalMoves = useMemo(() => pos.legalMoves(), [pos])
  const outcome = useMemo(() => pos.outcome(), [pos])
  const inCheck = useMemo(() => pos.inCheck(), [pos])
  const isOver = laOnline ? online?.meta.status === 'ended' : outcome.over || Boolean(customGameOver?.over)
  const toiDenLuotOnline = laOnline && Boolean(online?.isMyTurn) && pos.turn === benOnline
  const isPlaying = laOnline
    ? online?.meta.status === 'playing'
    : !isOver && (lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnline,
    isPlaying,
    isMyTurn: laOnline ? toiDenLuotOnline : pos.turn === playerSide,
    turnKey: `${pos.turn}-${lastMove?.from ?? ''}-${lastMove?.to ?? ''}`,
    online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = pos.turn
      const benThang = (benThua === RED ? (1 as Side) : RED)
      setCustomGameOver({
        over: true,
        winner: benThang,
        reason: `${pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen'} hết giờ`,
      })
      toast.error(`${pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen'} đã hết giờ suy nghĩ!`)
    }, [isOver, pos.turn]),
  })

  // Tính toán số quân ăn được của 2 bên
  const captured = useMemo(() => {
    const redCounts: Record<number, number> = {
      [CHARIOT]: 0, [HORSE]: 0, [ELEPHANT]: 0, [ADVISOR]: 0, [GENERAL]: 0, [CANNON]: 0, [SOLDIER]: 0,
    }
    const blackCounts: Record<number, number> = {
      [CHARIOT]: 0, [HORSE]: 0, [ELEPHANT]: 0, [ADVISOR]: 0, [GENERAL]: 0, [CANNON]: 0, [SOLDIER]: 0,
    }

    for (let sq = 0; sq < 90; sq++) {
      const p = pos.board[sq]
      if (p > 0) {
        const s = sideOf(p)
        const t = typeOf(p)
        if (s === RED) redCounts[t] = (redCounts[t] || 0) + 1
        else blackCounts[t] = (blackCounts[t] || 0) + 1
      }
    }

    const order = [CHARIOT, CANNON, HORSE, ELEPHANT, ADVISOR, SOLDIER]
    const enemyCaptured: number[] = []
    for (const t of order) {
      const diff = (INITIAL_XIANGQI_COUNTS[t] || 0) - (blackCounts[t] || 0)
      for (let i = 0; i < diff; i++) enemyCaptured.push(t)
    }

    const friendlyLost: number[] = []
    for (const t of order) {
      const diff = (INITIAL_XIANGQI_COUNTS[t] || 0) - (redCounts[t] || 0)
      for (let i = 0; i < diff; i++) friendlyLost.push(t)
    }

    return { enemyCaptured, friendlyLost }
  }, [pos])

  const renderCapturedXiangqiPiece = (type: number, isEnemy: boolean, rotation: number) => {
    // Khay quân: nửa trên là quân của mình bị ăn, nửa dưới là quân đối phương mình ăn được.
    const isRed = benCuaToi === RED ? !isEnemy : isEnemy
    const text = isRed ? TEN_QUAN_RED[type] : TEN_QUAN_BLACK[type]
    return (
      <div
        style={{ transform: `rotate(${rotation}deg)` }}
        className={cn(
          'relative flex items-center justify-center rounded-full size-9 sm:size-10 xl:size-11 select-none shadow-lg shadow-black/70 transition-transform duration-150 hover:scale-90 active:scale-85 shrink-0 cursor-pointer',
          isRed
            ? 'bg-gradient-to-b from-[#fdf6e2] to-[#e4ceaa] border-[2px] border-red-700 text-red-600'
            : 'bg-gradient-to-b from-[#f0eae1] to-[#cfc4b2] border-[2px] border-slate-900 text-slate-900'
        )}
        title={isRed ? `Quân Đỏ: ${text}` : `Quân Đen: ${text}`}
      >
        <div
          className={cn(
            'size-[82%] rounded-full border border-dashed flex items-center justify-center text-sm sm:text-base xl:text-lg font-serif font-black',
            isRed ? 'border-red-400' : 'border-slate-500'
          )}
        >
          {text}
        </div>
      </div>
    )
  }

  // Nước đi hợp lệ từ ô đang chọn
  const validTargets = useMemo(() => {
    if (selectedSq === null) return []
    return legalMoves.filter((m) => m.from === selectedSq).map((m) => m.to)
  }, [selectedSq, legalMoves])

  // Bàn online: gửi máy chủ xét, thế cờ chỉ đổi khi máy chủ phát lại
  const executeMove = useCallback(
    (move: XiangqiMove) => {
      if (laOnline) {
        online?.diCo(move)
        setSelectedSq(null)
        return
      }
      posTaiCho.makeMove(move)
      setPos(posTaiCho.clone())
      setLastMove(move)
      setSelectedSq(null)
    },
    [laOnline, online, posTaiCho]
  )

  // AI phản hồi
  useEffect(() => {
    if (mode === 'ai' && pos.turn !== playerSide && !isOver) {
      setIsAiThinking(true)
      const timer = setTimeout(() => {
        const best = findBestXiangqiMove(pos, aiLevel)
        if (best) {
          executeMove(best)
        }
        setIsAiThinking(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [pos, mode, playerSide, aiLevel, isOver, executeMove])

  const handleSquareClick = (sq: number) => {
    if (isOver || isAiThinking) return
    if (mode === 'ai' && pos.turn !== playerSide) return
    if (laOnline && !toiDenLuotOnline) return

    const piece = pos.board[sq]

    if (selectedSq !== null) {
      if (validTargets.includes(sq)) {
        executeMove({ from: selectedSq, to: sq })
        return
      }
      if (piece && sideOf(piece) === pos.turn) {
        setSelectedSq(sq)
        return
      }
      setSelectedSq(null)
      return
    }

    if (piece && sideOf(piece) === pos.turn) {
      setSelectedSq(sq)
    }
  }

  // ─ Biểu cảm & tin nhắn (Vùng 1: Ta ở dưới | Vùng 1+: Địch ở trên) ─
  const [playerBubble, setPlayerBubble] = useState<ActiveEmoteBubble | null>(null)
  const [opponentBubble, setOpponentBubble] = useState<ActiveEmoteBubble | null>(null)
  const playerBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opponentBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bongDoiThuOnline = useBongBieuCamDoiThu(online, DANH_SACH_THAI_DO_XIANGQI)
  const bongDoiThu = laOnline ? bongDoiThuOnline : opponentBubble

  const handleQuickEmote = (att: QuickEmoteItem) => {
    if (laOnline && online) guiBieuCamOnline(online, att.emoji)
    setPlayerBubble({ emoji: att.emoji, quote: att.quote, sender: 'player' })
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    playerBubbleTimerRef.current = setTimeout(() => {
      setPlayerBubble(null)
    }, 3800)

    if (mode === 'ai') {
      setTimeout(() => {
        const aiQuotes = [
          { id: 'ai1', emoji: '🤖', label: 'Máy tính', quote: 'Ta đã tính trước 10 nước đi tiếp theo!' },
          { id: 'ai2', emoji: '☕', label: 'Máy thong thả', quote: 'Hãy xem nước cờ tiếp theo của ta nhé.' },
          { id: 'ai3', emoji: '⚡', label: 'Phản đòn', quote: 'Một nước đi rất thú vị đấy!' },
          { id: 'ai4', emoji: '🧠', label: 'Mưu lược', quote: 'Cẩn thận với đòn mai phục trung lộ!' },
        ]
        const aiReaction = aiQuotes[Math.floor(Math.random() * aiQuotes.length)]
        setOpponentBubble({ emoji: aiReaction.emoji, quote: aiReaction.quote, sender: 'ai' })
        if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
        opponentBubbleTimerRef.current = setTimeout(() => {
          setOpponentBubble(null)
        }, 3800)
      }, 1500)
    }
  }

  const resetGame = useCallback(() => {
    setPos(XiangqiPosition.fromFen())
    setSelectedSq(null)
    setLastMove(null)
    setPlayerBubble(null)
    setOpponentBubble(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
    setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
    playGameStartSound()
  }, [])

  // Tự động kích hoạt banner xuất quân khi ván online bắt đầu
  useEffect(() => {
    if (vanVuaBatDau) {
      setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
      playGameStartSound()
      xoaVanVuaBatDau()
    }
  }, [vanVuaBatDau, xoaVanVuaBatDau])

  const handleModeChange = (newMode: PlayMode) => {
    if (!doiCheDo(newMode)) return
    setSelectedSq(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
  }

  const handleResetOrSurrender = () => {
    if (isOver) {
      resetGame()
      return
    }
    if (surrenderAttempts >= 3) {
      toast.warning('Bạn đã hết số lần xin thua cho ván này (tối đa 3 lần)!')
      return
    }
    // Mở modal xác nhận xin thua cho người chơi
    setIsSurrenderModalOpen(true)
  }

  const winnerOnline: Side | null =
    online && (online.meta.winner === 'X' || online.meta.winner === 'O')
      ? (mauQuanCua(online.meta.firstTurn, online.meta.winner) as Side)
      : null
  const winnerSide = laOnline ? winnerOnline : outcome.over ? outcome.winner : customGameOver?.winner
  const winnerTitle = !isOver
    ? undefined
    : laOnline && benOnline === null
      ? winnerSide === RED
        ? 'BÊN ĐỎ THẮNG'
        : winnerSide !== null && winnerSide !== undefined
          ? 'BÊN ĐEN THẮNG'
          : 'HOÀ CỜ'
      : winnerSide === (mode === 'pass_and_play' ? RED : benCuaToi)
        ? 'BẠN THẮNG'
        : winnerSide !== null && winnerSide !== undefined
          ? 'BẠN THUA'
          : 'HOÀ CỜ'

  // Lý do kết thúc bằng tiếng Việt (ván online: đầu hàng / hết giờ do máy chủ chốt, còn lại theo luật trên bàn).
  const tenBen = (b: Side) => (b === RED ? 'Bên Đỏ' : 'Bên Đen')
  const lyDoKetThuc = (() => {
    if (!isOver) return undefined
    if (laOnline && online) {
      const benThua = winnerOnline === null ? null : ((winnerOnline ^ 1) as Side)
      if (online.meta.endReason === 'surrender' && benThua !== null) return `${tenBen(benThua)} đã xin thua`
      if (online.meta.endReason === 'timeout' && benThua !== null) return `${tenBen(benThua)} hết giờ`
    }
    return outcome.reason ? LY_DO_KET_THUC[outcome.reason] : customGameOver?.reason || 'Ván đấu kết thúc'
  })()

  // Thanh công cụ ở chế độ online: nút hành động theo ghế và trạng thái ván.
  const nutOnline = laOnline && online ? nutHanhDongOnline(online, () => setIsSurrenderModalOpen(true)) : null
  const tenBenLuot = online ? tenNguoiChoi(online, online.meta.currentTurn) : ''
  const nhanTrangThai = isOver
    ? (winnerTitle || 'VÁN ĐẤU KẾT THÚC')
    : laOnline && online?.meta.status !== 'playing'
      ? 'CHỜ ĐỐI THỦ'
      : inCheck
        ? 'CHIẾU TƯỚNG!'
        : laOnline
          ? (benOnline === null ? (pos.turn === RED ? 'BÊN ĐỎ' : 'BÊN ĐEN') : toiDenLuotOnline ? 'LƯỢT BẠN' : 'LƯỢT ĐỐI THỦ')
          : (mode === 'ai' ? (pos.turn === playerSide ? 'LƯỢT BẠN' : 'MÁY (AI)') : (pos.turn === RED ? 'BÊN ĐỎ' : 'BÊN ĐEN'))
  const phuTrangThai = isOver
    ? lyDoKetThuc
    : laOnline && online
      ? moTaPhuOnline(online, tenBenLuot)
      : inCheck
        ? 'Tướng đang bị đe dọa!'
        : isAiThinking
          ? undefined
          : (pos.turn === RED ? 'Lượt đi: Bên Đỏ xuất quân' : 'Lượt đi: Bên Đen xuất quân')
  const laNguoiThang = isOver && winnerSide !== null && winnerSide !== undefined ? winnerSide === benCuaToi : null

  const mauTrangThai = isOver
    ? laNguoiThang === true
      ? '#10b981'
      : laNguoiThang === false
        ? '#f43f5e'
        : '#eab308'
    : inCheck
      ? '#ef4444'
      : isAiThinking
        ? '#06b6d4'
        : '#ef4444'

  const emojiTrangThai = isOver
    ? laNguoiThang === true
      ? '🏆'
      : laNguoiThang === false
        ? '💀'
        : '🤝'
    : isAiThinking
      ? '🤖'
      : inCheck
        ? '⚡'
        : '⚔️'

  // Banner khi bị chiếu tướng
  const prevInCheckRef = useRef(inCheck)
  useEffect(() => {
    if (!prevInCheckRef.current && inCheck && !isOver) {
      setHeroicBanner({ type: 'check', title: 'CHIẾU TƯỚNG' })
    }
    prevInCheckRef.current = inCheck
  }, [inCheck, isOver])

  // Âm thanh & Banner hào hùng khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      if (laNguoiThang === true) {
        playGameOverSound('win')
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
      } else if (laNguoiThang === false) {
        playGameOverSound('lose')
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
      } else {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
      }
    }
    wasOverRef.current = isOver
  }, [isOver, laNguoiThang])

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl mx-auto">
      {/* Thanh điều khiển cân đối & trạng thái ván đấu */}
      <GamePlayToolbar
        onBack={onBack}
        title="Cờ Tướng"
        icon={<Shield className="size-4 text-red-400" />}
        mode={mode}
        onModeChange={handleModeChange}
        onlineAvailable={Boolean(online)}
        aiLevel={aiLevel}
        onAiLevelChange={setAiLevel}
        onReset={nutOnline ? nutOnline.onClick : handleResetOrSurrender}
        resetLabel={nutOnline ? nutOnline.label : isOver ? 'Ván mới' : 'Xin thua'}
        resetIcon={nutOnline?.icon}
        resetDisabled={nutOnline?.disabled}
        surrenderAttempts={nutOnline ? undefined : surrenderAttempts}
        activeSide={isOver ? (winnerSide === RED ? 'red' : 'black') : (pos.turn === RED ? 'red' : 'black')}
        turnLabel={`Lượt: ${pos.turn === RED ? 'Bên Đỏ (Đi trước)' : 'Bên Đen'}`}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
        rightSlot={
          <GameQuickEmote
            emotes={DANH_SACH_THAI_DO_XIANGQI}
            onSend={handleQuickEmote}
            theme="red"
            compact={true}
          />
        }
      />

      {/* Trạng thái ván gọn khi màn chưa đủ rộng cho hai cột bên bàn cờ (< 1920px): cột trạng thái bên trái chỉ vừa từ đó */}
      <div className="flex min-[1920px]:hidden items-center justify-center gap-2 h-8 px-3.5 mt-1 rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold shrink-0 max-w-full">
        <span className="text-base leading-none">{emojiTrangThai}</span>
        <span style={{ color: mauTrangThai }} className="font-black uppercase tracking-wider whitespace-nowrap">{nhanTrangThai}</span>
        {phuTrangThai && <span className="text-slate-400 font-medium truncate">{phuTrangThai}</span>}
      </div>

      {/* Khung chơi trung tâm: Cụm bên trái (Vùng 1) + Bàn cờ trung tâm + Cụm bên phải (Vùng 2 & Khay quân) */}
      <div className="relative flex items-center justify-center gap-3.5 xl:gap-5 2xl:gap-6 w-full flex-1 my-auto">
        {/* ── CỘT TRÁI: ĐỒNG HỒ SUY NGHĨ (VÙNG 3, KHÔNG CỐ ĐỊNH CHIỀU CAO) ── */}
        <div className="hidden min-[1920px]:flex flex-col items-center justify-center shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] select-none text-center my-auto">
          <GameClockWidget
            timeRemaining={clock.timeRemaining}
            turnSeconds={clock.turnSeconds}
            isPlaying={isPlaying}
            isMyTurn={laOnline ? toiDenLuotOnline : pos.turn === playerSide}
            playerLabel={laOnline ? (benOnline === RED ? 'Bạn (Đỏ)' : 'Bạn (Đen)') : (playerSide === RED ? 'Bạn (Đỏ)' : 'Bạn (Đen)')}
            opponentLabel={laOnline ? (benOnline === RED ? 'Đối thủ (Đen)' : 'Đối thủ (Đỏ)') : (mode === 'ai' ? 'Máy AI' : 'Bên Đen')}
            isOnline={laOnline}
            opponentProposal={clock.opponentProposal}
            myPendingProposal={clock.myPendingProposal}
            onProposeTime={clock.proposeTime}
            onAcceptProposal={clock.acceptProposal}
            onRejectProposal={clock.rejectProposal}
          />
        </div>

        {/* Bàn cờ Cờ Tướng truyền thống Á Đông (9 cột × 10 hàng) - 100% hiển thị đầy đủ, không bị che */}
        <div className="relative p-2.5 sm:p-3 rounded-2xl bg-[#caa472] border-4 border-[#82542a] shadow-2xl shadow-black/60 select-none shrink-0 flex flex-col items-center">
          {/* Lưới và Sông */}
          <div className="relative grid grid-cols-9 grid-rows-10 w-[324px] h-[360px] sm:w-[396px] sm:h-[440px] md:w-[450px] md:h-[500px] lg:w-[486px] lg:h-[540px] xl:w-[513px] xl:h-[570px] 2xl:w-[540px] 2xl:h-[600px]">
            {/* Đường vẽ sông Sở Hà Hán Giới ở giữa hàng 4 và 5 */}
            <div className="absolute inset-x-2 top-[45%] h-[10%] flex items-center justify-around pointer-events-none text-xs sm:text-sm md:text-base font-serif font-black text-[#6d441f]/75 tracking-widest border-y border-[#6d441f]/60 bg-[#d8b586]/40">
              <span>楚 河 (Sở Hà)</span>
              <span>漢 界 (Hán Giới)</span>
            </div>

            {Array.from({ length: 90 }, (_, idx) => {
              // Hàng 9 xuống 0 (Đỏ ở dưới: hàng 0..4, Đen ở trên: hàng 5..9); cầm quân Đen thì xoay bàn cho quân mình ở dưới
              const r = latBan ? Math.floor(idx / 9) : 9 - Math.floor(idx / 9)
              const f = latBan ? 8 - (idx % 9) : idx % 9
              const sq = r * 9 + f

              const piece = pos.board[sq]
              const isSelected = selectedSq === sq
              const isValidTarget = validTargets.includes(sq)
              const isLastMoveSq = nuocCuoi && (nuocCuoi.from === sq || nuocCuoi.to === sq)

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={cn(
                    'relative flex items-center justify-center cursor-pointer',
                    // Đường kẻ bàn cờ cờ tướng
                    'border-r border-b border-[#6d441f]/50',
                    f === (latBan ? 8 : 0) && 'border-l',
                    r === (latBan ? 0 : 9) && 'border-t'
                  )}
                >
                  {/* Quân cờ */}
                  {piece > 0 && <XiangqiPieceToken piece={piece} />}

                  {/* Điểm gợi ý nước đi */}
                  {isValidTarget && (
                    <span
                      className={cn(
                        'absolute rounded-full pointer-events-none z-20',
                        piece > 0
                          ? 'size-full ring-4 ring-inset ring-emerald-500/80'
                          : 'size-3.5 bg-emerald-500/80 shadow-md ring-2 ring-emerald-300'
                      )}
                    />
                  )}

                  {/* Ô được chọn */}
                  {isSelected && (
                    <span className="absolute inset-0 ring-4 ring-inset ring-cyan-400 rounded-lg pointer-events-none z-10" />
                  )}

                  {/* Nước đi vừa thực hiện */}
                  {isLastMoveSq && !isSelected && (
                    <span className="absolute inset-0 bg-amber-400/25 pointer-events-none" />
                  )}
                </div>
              )
            })}
          </div>

          {/* VÙNG 1+: Banner hào hùng xuất quân & kết thúc ván đấu phủ lên bàn cờ */}
          <GameHeroicBanner
            type={heroicBanner?.type ?? null}
            title={heroicBanner?.title}
            visible={Boolean(heroicBanner)}
            onClose={() => setHeroicBanner(null)}
          />

          {/* Bong bóng biểu cảm khi màn hình nhỏ (< 1920px) không có hai cột hai bên */}
          <div className="min-[1920px]:hidden absolute top-2 right-2 z-30 pointer-events-none">
            <GameOpponentBubble bubble={bongDoiThu} theme="red" />
          </div>
          <div className="min-[1920px]:hidden absolute bottom-2 right-2 z-30 pointer-events-none">
            <GamePlayerBubble bubble={playerBubble} theme="red" />
          </div>
        </div>

        {/* ── CỘT PHẢI: VÙNG 2 (Địch ở trên) | VÙNG 1+ (Ta ở dưới) ── */}
        <div className="hidden min-[1920px]:flex flex-col items-center justify-between shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[540px] xl:h-[570px] 2xl:h-[600px] select-none py-1">
          <GameCapturedTray
            enemyCaptured={benCuaToi === RED ? captured.friendlyLost : captured.enemyCaptured}
            friendlyCaptured={benCuaToi === RED ? captured.enemyCaptured : captured.friendlyLost}
            pawnType={SOLDIER}
            renderPiece={renderCapturedXiangqiPiece}
            topSlot={<GameOpponentBubble bubble={bongDoiThu} theme="red" />}
            bottomSlot={<GamePlayerBubble bubble={playerBubble} theme="red" />}
          />
        </div>
      </div>

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          laOnline
            ? `${tenBen(benCuaToi)} (Bạn)`
            : mode === 'ai'
              ? (playerSide === RED ? 'Bên Đỏ (Bạn)' : 'Bên Đen (Bạn)')
              : (pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen')
        }
        opponentSideName={
          laOnline && online?.mySide
            ? tenNguoiChoi(online, online.mySide === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân Đen (Máy AI)'
              : (pos.turn === RED ? 'người chơi quân Đen' : 'người chơi quân Đỏ')
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          if (laOnline) {
            // Máy chủ chốt ván và báo cho cả bàn.
            online?.surrender()
            setIsSurrenderModalOpen(false)
            return
          }
          const losingSide = mode === 'ai' ? playerSide : pos.turn
          const winningSide = losingSide === RED ? (1 as Side) : (RED as Side)
          setCustomGameOver({
            over: true,
            winner: winningSide,
            reason: `${mode === 'ai' ? 'Bạn' : losingSide === RED ? 'Bên Đỏ' : 'Bên Đen'} đã xin thua`,
          })
          setIsSurrenderModalOpen(false)
        }}
        onSurrenderRejected={() => {
          setSurrenderAttempts((prev) => Math.min(prev + 1, 3))
          setIsSurrenderModalOpen(false)
        }}
      />
    </div>
  )
}
