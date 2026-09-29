import { useState, useEffect, useCallback, useRef } from 'react'
import { findBestCaroMove, type CaroCell } from '../../../../shared/games/caro/caro-ai'
import type { BanOnline } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import { Swords } from 'lucide-react'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import {
  guiBieuCamOnline,
  moTaPhuOnline,
  nutHanhDongOnline,
  tenNguoiChoi,
  useBongBieuCamDoiThu,
  useCheDoBan,
} from '../ban-online'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameClockWidget } from '../GameClockWidget'
import { useGameClock } from '../use-game-clock'
import { GameQuickEmote, GameOpponentBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'
import { GameHeroicBanner, type HeroicBannerType } from '../GameHeroicBanner'
import { playGameOverSound, playGameStartSound } from '../game-audio'
import { toast } from 'sonner'

const SIZE = 15

// Điểm thiên nguyên và tinh vị chuẩn 15×15
const STAR_POINTS = new Set([
  '3-3', '3-11', '7-7', '11-3', '11-11'
])

// ─ Danh sách biểu cảm chọn nhanh (1 click là gửi ngay, không cần bước chọn nhóm) ───────────────
const QUICK_EMOTES_CARO: QuickEmoteItem[] = [
  { id: 'fire', emoji: '🔥', label: 'Bùng cháy', quote: 'Tới bến luôn nào!' },
  { id: 'laugh', emoji: '😂', label: 'Cười xỉu', quote: 'Haha nước đó hay đó!' },
  { id: 'think', emoji: '🤔', label: 'Suy tính', quote: 'Để ta tính toán chút...' },
  { id: 'shock', emoji: '🤯', label: 'Bất ngờ', quote: 'Pha đó không ngờ tới!' },
  { id: 'skull', emoji: '💀', label: 'Căng thẳng', quote: 'Toang rồi bạn ơi!' },
  { id: 'clap', emoji: '👏', label: 'Tuyệt đỉnh', quote: 'Nước đi hay lắm!' },
  { id: 'cool', emoji: '😎', label: 'Tự tin', quote: 'Đẳng cấp quá bạn ơi!' },
  { id: 'muscle', emoji: '💪', label: 'Quyết tâm', quote: 'Trận này không có hoà!' },
]

function checkWin(board: CaroCell[][], x: number, y: number, side: 'X' | 'O'): [number, number][] | null {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ]

  for (const [dx, dy] of dirs) {
    const line: [number, number][] = [[x, y]]

    // Forward
    let i = 1
    while (true) {
      const nx = x + dx * i
      const ny = y + dy * i
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny][nx] === side) {
        line.push([nx, ny])
        i++
      } else break
    }

    // Backward
    i = 1
    while (true) {
      const nx = x - dx * i
      const ny = y - dy * i
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny][nx] === side) {
        line.push([nx, ny])
        i++
      } else break
    }

    if (line.length >= 5) return line
  }

  return null
}
interface CaroBoardProps {
  onBack?: () => void
  initialMode?: PlayMode
  /** Bàn online (mở từ sảnh): thêm chế độ "Đấu online" — máy chủ làm trọng tài, đối thủ là người thật. */
  online?: BanOnline
}

export function CaroBoard({ onBack, initialMode, online }: CaroBoardProps) {
  const [boardTaiCho, setBoard] = useState<CaroCell[][]>(() =>
    Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  )
  const [currentTurnTaiCho, setCurrentTurn] = useState<'X' | 'O'>('X')
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
  } | null>(null)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  // Ván đơn: người chơi luôn cầm quân X và đi trước, máy cầm quân O
  const playerSide: 'X' | 'O' = 'X'
  const [winnerTaiCho, setWinner] = useState<'X' | 'O' | 'draw' | null>(null)
  const [winLineTaiCho, setWinLine] = useState<[number, number][] | null>(null)
  const [lastMoveTaiCho, setLastMove] = useState<{ x: number; y: number } | null>(null)
  // Bàn online: bàn cờ, lượt, kết quả đều theo máy chủ; ghế của mình quyết định quân X hay O.
  const banOnline = laOnline ? online : undefined
  const board: CaroCell[][] = banOnline ? banOnline.board : boardTaiCho
  const currentTurn = banOnline ? banOnline.meta.currentTurn : currentTurnTaiCho
  const winner = banOnline ? banOnline.meta.winner : winnerTaiCho
  const winLine = banOnline ? banOnline.meta.winLine : winLineTaiCho
  const nuocOnline = banOnline?.lastMove
  const lastMove = banOnline
    ? nuocOnline && nuocOnline.x !== undefined && nuocOnline.y !== undefined
      ? { x: nuocOnline.x, y: nuocOnline.y }
      : null
    : lastMoveTaiCho
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [surrenderReason, setSurrenderReason] = useState<string | null>(null)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)

  // ─ Biểu cảm & tin nhắn (Vùng 1: Ta ở dưới | Vùng 1+: Địch ở trên) ─
  const [playerBubble, setPlayerBubble] = useState<ActiveEmoteBubble | null>(null)
  const [opponentBubble, setOpponentBubble] = useState<ActiveEmoteBubble | null>(null)
  const playerBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opponentBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bongDoiThuOnline = useBongBieuCamDoiThu(online, QUICK_EMOTES_CARO)
  const bongDoiThu = laOnline ? bongDoiThuOnline : opponentBubble

  const handleQuickEmote = (em: QuickEmoteItem) => {
    if (laOnline && online) guiBieuCamOnline(online, em.emoji)
    setPlayerBubble({
      emoji: em.emoji,
      quote: em.quote,
      sender: 'player',
    })
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    playerBubbleTimerRef.current = setTimeout(() => setPlayerBubble(null), 3800)

    if (mode === 'ai') {
      if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
      opponentBubbleTimerRef.current = setTimeout(() => {
        opponentBubbleTimerRef.current = null
        const reply = QUICK_EMOTES_CARO[Math.floor(Math.random() * QUICK_EMOTES_CARO.length)]
        setOpponentBubble({
          emoji: reply.emoji,
          quote: reply.quote,
          sender: 'ai',
        })
        if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
        opponentBubbleTimerRef.current = setTimeout(() => setOpponentBubble(null), 3800)
      }, 1500)
    }
  }

  // Dọn mọi hẹn giờ khi rời trang — tránh cập nhật state sau khi component đã tháo
  useEffect(
    () => () => {
      if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
      if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
    },
    []
  )

  const makeMove = useCallback(
(x: number, y: number, side: 'X' | 'O') => {
      if (board[y][x] !== null || winner) return

      const next = board.map((row, r) =>
        row.map((cell, c) => (r === y && c === x ? side : cell))
      )
      setBoard(next)
      setLastMove({ x, y })

      const win = checkWin(next, x, y, side)
      if (win) {
        setWinner(side)
        setWinLine(win)
        return
      }

      // Kiểm tra kín bàn
      if (next.every((row) => row.every((c) => c !== null))) {
        setWinner('draw')
        return
      }

      setCurrentTurn(side === 'X' ? 'O' : 'X')
    },
    [board, winner]
  )

  // AI phản hồi — chờ một nhịp để người chơi kịp nhìn thấy nước đi của mình trước khi máy đáp
  useEffect(() => {
    if (mode !== 'ai' || currentTurn === playerSide || winner) return
    setIsAiThinking(true)
    const timer = setTimeout(() => {
      const best = findBestCaroMove(board, currentTurn, aiLevel)
      setIsAiThinking(false)
      if (!best) {
        // Không còn ô nào đi được nữa thì chốt hoà, không để ván treo
        setWinner('draw')
        return
      }
      makeMove(best.x, best.y, currentTurn)
    }, 650)
    return () => clearTimeout(timer)
  }, [board, currentTurn, mode, playerSide, aiLevel, winner, makeMove])

  const handleClick = (x: number, y: number) => {
    if (banOnline) {
      // Máy chủ xét nước đi và phát lại cho cả bàn; chỉ gửi khi tới lượt mình và ô còn trống.
      if (!banOnline.isMyTurn || board[y][x] !== null) return
      banOnline.makeMove(x, y)
      return
    }
    if (winner || isAiThinking) return
    if (mode === 'ai' && currentTurn !== playerSide) return
    makeMove(x, y, currentTurn)
  }

  const resetGame = () => {
    setBoard(Array.from({ length: SIZE }, () => Array(SIZE).fill(null)))
    setCurrentTurn('X')
    setWinner(null)
    setWinLine(null)
    setLastMove(null)
    setPlayerBubble(null)
    setOpponentBubble(null)
    setSurrenderReason(null)
    setIsSurrenderModalOpen(false)
    // Phải tắt cờ "máy đang tính" và huỷ hẹn giờ, nếu không bàn mới sẽ bị khoá ô chờ máy đi mãi
    setIsAiThinking(false)
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
    setHeroicBanner({ type: 'start', title: 'TRẬN ĐẤU BẮT ĐẦU!' })
    playGameStartSound()
  }

  // Tự động kích hoạt banner xuất quân khi ván online bắt đầu
  useEffect(() => {
    if (vanVuaBatDau) {
      setHeroicBanner({ type: 'start', title: 'TRẬN ĐẤU BẮT ĐẦU!' })
      playGameStartSound()
      xoaVanVuaBatDau()
    }
  }, [vanVuaBatDau, xoaVanVuaBatDau])

  const handleModeChange = (newMode: PlayMode) => {
    if (!doiCheDo(newMode)) return
    resetGame()
  }

  const handleResetOrSurrender = () => {
    if (winner) {
      resetGame()
      return
    }
    setIsSurrenderModalOpen(true)
  }

  const isWinningCell = (x: number, y: number) =>
    winLine?.some(([wx, wy]) => wx === x && wy === y)

  const isOver = !!winner

  const isMyTurn = banOnline ? banOnline.isMyTurn : mode === 'ai' ? currentTurn === playerSide : currentTurn === 'X'
  const isPlaying = laOnline
    ? online?.meta.status === 'playing'
    : !isOver && (lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnline,
    isPlaying,
    isMyTurn,
    turnKey: `${currentTurn}-${lastMove?.x ?? ''}-${lastMove?.y ?? ''}`,
    online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = currentTurn
      const benThang = benThua === 'X' ? 'O' : 'X'
      setWinner(benThang)
      setSurrenderReason(`Quân ${benThua} hết giờ suy nghĩ`)
      toast.error(`Quân ${benThua} đã hết giờ suy nghĩ!`)
    }, [isOver, currentTurn]),
  })

  // Ô bàn cờ không bấm được: ván online chưa tới lượt mình (hoặc đang xem), ván tại chỗ đã xong / máy đang tính.
  const khoaBan = banOnline ? !banOnline.isMyTurn : !!winner || isAiThinking
  const benToiOnline = banOnline?.mySide ?? null
  const benThuaOnline = winner === 'X' ? 'O' : winner === 'O' ? 'X' : null
  const turnColor = isMyTurn ? '#06b6d4' : '#f43f5e'
  const turnGlow = isMyTurn ? 'rgba(6,182,212,0.4)' : 'rgba(244,63,94,0.4)'
  const turnBg = isMyTurn ? 'rgba(6,182,212,0.12)' : 'rgba(244,63,94,0.12)'



  // ─ Trạng thái ván đấu: dùng chung cho cột bên trái (màn rộng) và hàng gọn trên bàn (màn vừa) ─
  // Chế độ 2 người thì không có "bạn" — báo theo quân để cả hai bên cùng đọc đúng.
  // Thắng ở chế độ 2 người luôn là chiến thắng của một người chơi nên hiện xanh + cúp,
  // chỉ chế độ đánh với máy mới phân biệt BẠN THẮNG (xanh) / BẠN THUA (đỏ).
  const pheThang = banOnline ? (benToiOnline ?? winner) : mode === 'ai' ? playerSide : winner
  const mauTrangThai = isOver
    ? winner === 'draw'
      ? '#eab308'
      : winner === pheThang
        ? '#10b981'
        : '#f43f5e'
    : isAiThinking
      ? '#06b6d4'
      : turnColor
  const nenTrangThai = isOver || isAiThinking
    ? `radial-gradient(circle, ${mauTrangThai}40 0%, transparent 70%)`
    : turnBg
  const vienTrangThai = isOver
    ? `${mauTrangThai}80`
    : isAiThinking
      ? 'rgba(6,182,212,0.4)'
      : turnColor
  const quangTrangThai = isOver || isAiThinking ? `${mauTrangThai}4D` : turnGlow
  const nhanTrangThai = isOver
    ? winner === 'draw'
      ? 'HOÀ CỜ'
      : banOnline
        ? benToiOnline
          ? winner === benToiOnline
            ? 'BẠN THẮNG'
            : 'BẠN THUA'
          : `QUÂN ${winner} THẮNG`
        : mode === 'ai'
          ? winner === playerSide
            ? 'BẠN THẮNG'
            : 'BẠN THUA'
          : `QUÂN ${winner} THẮNG`
    : banOnline
      ? banOnline.meta.status !== 'playing'
        ? 'CHỜ ĐỐI THỦ'
        : benToiOnline
          ? isMyTurn
            ? 'LƯỢT BẠN'
            : 'LƯỢT ĐỐI THỦ'
          : `LƯỢT QUÂN ${currentTurn}`
    : isAiThinking
      ? 'MÁY ĐANG TÍNH'
      : mode === 'ai'
        ? isMyTurn
          ? 'LƯỢT BẠN'
          : 'CHỜ ĐỐI THỦ'
        : `LƯỢT QUÂN ${currentTurn}`
  const phuTrangThai = isOver
    ? winner === 'draw'
      ? 'Kín bàn hoà cờ'
      : banOnline
        ? banOnline.meta.endReason === 'surrender'
          ? `Quân ${benThuaOnline} đã xin thua`
          : banOnline.meta.endReason === 'timeout'
            ? `Quân ${benThuaOnline} hết giờ`
            : `Quân ${winner} xếp đủ 5 hàng`
        : surrenderReason ?? `Quân ${winner} xếp đủ 5 hàng`
    : banOnline
      ? moTaPhuOnline(banOnline, tenNguoiChoi(banOnline, currentTurn))
    : mode === 'ai'
      ? isMyTurn
        ? 'Đặt quân X để tấn công'
        : 'Đối thủ đang suy nghĩ'
      : currentTurn === 'X'
        ? 'Đặt quân X để tấn công'
        : 'Đến lượt quân O'
  const emojiTrangThai = isOver
    ? winner === 'draw'
      ? '🤝'
      : winner === pheThang
        ? '🏆'
        : '💀'
    : isAiThinking
      ? '🤖'
      : banOnline && banOnline.meta.status !== 'playing'
        ? '⏳'
        : isMyTurn
          ? '⚔️'
          : banOnline
            ? '🌐'
            : mode === 'ai'
              ? '🤖'
              : '🎲'

  // Âm thanh & Banner hào hùng khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      if (winner === 'draw') {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'BẮT TAY HOÀ CỜ!' })
      } else if (winner === pheThang) {
        playGameOverSound('win')
        setHeroicBanner({ type: 'win', title: 'CHIẾN THẮNG HUY HOÀNG!' })
      } else {
        playGameOverSound('lose')
        setHeroicBanner({ type: 'lose', title: 'QUÂN TA BẠI TRẬN!' })
      }
    }
    wasOverRef.current = isOver
  }, [isOver, winner, pheThang])

  // Thanh công cụ ở chế độ online: nút hành động theo ghế và trạng thái ván.
  const nutOnline = banOnline ? nutHanhDongOnline(banOnline, () => setIsSurrenderModalOpen(true)) : null

  return (
    <div className="flex flex-col items-center justify-between w-full h-full relative select-none">
      {/* ── 1 & 1+: THANH TOOLBAR ĐẦY ĐỦ CHIỀU NGANG (W-FULL) ── */}
      {/* Căn giữa hoàn toàn so với Bảng lớn 2, với cụm Mode ở chính giữa 50% */}
      <GamePlayToolbar
        onBack={onBack}
        title="Cờ Caro"
        icon={<Swords className="size-4 text-cyan-400" />}
        mode={mode}
        onModeChange={handleModeChange}
        onlineAvailable={Boolean(online)}
        aiLevel={aiLevel}
        onAiLevelChange={setAiLevel}
        onReset={nutOnline ? nutOnline.onClick : handleResetOrSurrender}
        resetLabel={nutOnline ? nutOnline.label : isOver ? 'Ván mới' : 'Xin thua'}
        resetIcon={nutOnline?.icon}
        resetDisabled={nutOnline?.disabled}
        activeSide={winner ? (winner === 'X' ? 'red' : 'black') : (currentTurn === 'X' ? 'red' : 'black')}
        turnLabel={`Lượt: ${currentTurn === 'X' ? 'Quân X (Đi trước)' : 'Quân O'}`}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
        className="w-full shrink-0"
      />

      {/* ── KHUNG CHƠI TRUNG TÂM: 3 CỘT ĐỒNG BỘ CÙNG CẤP (CỘT TRÁI - BÀN CỜ - CỘT PHẢI) ── */}
      <div className="relative flex items-center justify-center gap-3.5 xl:gap-5 2xl:gap-6 w-full flex-1 my-auto">
        {/* ── CỘT TRÁI (VÙNG 1 + VÙNG 2): Trạng thái ván đấu & Đồng hồ suy nghĩ ── */}
        <div
          role="status"
          aria-live="polite"
          className="hidden min-[1920px]:flex flex-col items-center justify-between shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[540px] xl:h-[580px] 2xl:h-[620px] text-center select-none"
        >
          <div
            className={cn(
              'flex flex-col items-center gap-2.5 animate-in duration-200',
              isOver ? 'zoom-in-95' : 'fade-in-50'
            )}
          >
            <div className="relative flex shrink-0 items-center justify-center size-16">
              {isOver && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-25"
                  style={{ border: `2px solid ${mauTrangThai}` }}
                />
              )}
              {isAiThinking && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-1.5 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                </>
              )}
              {!isOver && !isAiThinking && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ border: `1.5px solid ${turnColor}` }}
                />
              )}
              <div
                className={cn(
                  'rounded-full flex items-center justify-center',
                  isOver ? 'size-14 shadow-lg' : 'size-12'
                )}
                style={{
                  background: nenTrangThai,
                  border: `1.5px solid ${vienTrangThai}`,
                  boxShadow: isOver || isAiThinking
                    ? `0 0 18px ${quangTrangThai}`
                    : `0 0 18px ${turnGlow}, inset 0 0 12px ${turnBg}`,
                }}
              >
                <span className={cn('leading-none', isOver ? 'text-3xl' : 'text-2xl')}>
                  {emojiTrangThai}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5 min-w-0">
              <span
                className={cn(
                  'font-black tracking-widest uppercase leading-none truncate max-w-[170px]',
                  isOver ? 'text-base' : 'text-sm'
                )}
                style={{ color: mauTrangThai, textShadow: `0 0 20px ${quangTrangThai}` }}
              >
                {nhanTrangThai}
              </span>
              <div className="h-5 flex items-center justify-center">
                {isAiThinking ? (
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map((delay, i) => (
                      <span
                        key={i}
                        className="size-1.5 rounded-full bg-cyan-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium leading-tight max-w-[170px] truncate">
                    {phuTrangThai}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* VÙNG 2: ĐỒNG HỒ SUY NGHĨ ESPORTS (THIẾT LẬP TRƯỚC TRẬN, KHÓA KHI BẮT ĐẦU) */}
          <GameClockWidget
            timeRemaining={clock.timeRemaining}
            turnSeconds={clock.turnSeconds}
            isPlaying={isPlaying}
            isMyTurn={isMyTurn}
            playerLabel={banOnline ? (benToiOnline === 'X' ? 'Bạn (Quân X)' : 'Bạn (Quân O)') : (playerSide === 'X' ? 'Bạn (Quân X)' : 'Bạn (Quân O)')}
            opponentLabel={banOnline ? (benToiOnline === 'X' ? 'Đối thủ (Quân O)' : 'Đối thủ (Quân X)') : (mode === 'ai' ? 'Máy AI' : 'Quân O')}
            isOnline={laOnline}
            opponentProposal={clock.opponentProposal}
            myPendingProposal={clock.myPendingProposal}
            onProposeTime={clock.proposeTime}
            onAcceptProposal={clock.acceptProposal}
            onRejectProposal={clock.rejectProposal}
            theme="cyan"
          />
        </div>

        {/* ── CỘT GIỮA: BÀN CỜ CARO 15×15 (TO HƠN, Ô CỜ TO RÕ RÀNG) ── */}
        <div className="relative shrink-0 select-none z-10 flex flex-col items-center">
          {/* Thanh trạng thái phụ nhỏ gọn khi hai cột bên bàn cờ bị ẩn (< 1920px), chiều cao cố định */}
          <div className="flex min-[1920px]:hidden items-center justify-center gap-2 h-8 px-3.5 mb-2 rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold shrink-0">
            <span className="text-base leading-none">{emojiTrangThai}</span>
            <span style={{ color: mauTrangThai }} className="font-black uppercase tracking-wider">{nhanTrangThai}</span>
            {isAiThinking && (
              <span className="flex gap-1 items-center ml-1">
                {[0, 150, 300].map((delay, i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            )}
          </div>

          {/* Khung bàn cờ phẳng to hơn */}
          <div
            className="relative rounded-2xl overflow-hidden shrink-0"
            style={{
              boxShadow: [
                '0 18px 40px rgba(0,0,0,0.7)',
                '0 0 0 1px rgba(255,255,255,0.06)',
                'inset 0 1px 0 rgba(255,255,255,0.08)',
                '0 0 24px rgba(6,182,212,0.12)',
              ].join(', '),
            }}
          >
            {/* Lớp bề mặt bàn cờ - padding tối ưu để ô cờ đạt kích thước lớn nhất */}
            <div
              className="p-2 sm:p-2.5 2xl:p-3"
              style={{
                background: 'linear-gradient(160deg, #0d1829 0%, #091220 50%, #060e1a 100%)',
              }}
            >
              {/* Viền neon sáng trên */}
              <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6) 30%, rgba(99,102,241,0.6) 70%, transparent)',
                  boxShadow: '0 0 12px rgba(6,182,212,0.5)',
                }}
              />

              {/* Định nghĩa gradient dùng chung một lần */}
              <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="caroXWin" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="caroX" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                  <linearGradient id="caroO" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Grid bàn cờ 15x15 kích thước mở rộng: ô cờ to hơn rõ rệt (lên đến 41.3px/ô trên 2xl) */}
              <div
                role="grid"
                aria-label="Bàn cờ Caro 15 nhân 15"
                aria-rowcount={SIZE}
                aria-colcount={SIZE}
                className="grid border border-cyan-500/20 rounded-lg overflow-hidden w-[330px] h-[330px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] lg:w-[540px] lg:h-[540px] xl:w-[580px] xl:h-[580px] 2xl:w-[620px] 2xl:h-[620px] shrink-0"
                style={{
                  gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${SIZE}, minmax(0, 1fr))`,
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.03) 0%, transparent 50%, rgba(99,102,241,0.03) 100%)',
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
                }}
              >
                {Array.from({ length: SIZE * SIZE }, (_, idx) => {
                  const y = Math.floor(idx / SIZE)
                  const x = idx % SIZE
                  const val = board[y][x]
                  const isStar = STAR_POINTS.has(`${x}-${y}`)
                  const isLast = lastMove?.x === x && lastMove?.y === y
                  const isWin = isWinningCell(x, y)
                  const isRightEdge = x === SIZE - 1
                  const isBottomEdge = y === SIZE - 1

                  return (
                    <div
                      key={`${x}-${y}`}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault()
                        handleClick(x, y)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClick(x, y)
                        }
                      }}
                      aria-disabled={!!val || khoaBan || undefined}
                      aria-label={`Ô hàng ${y + 1} cột ${x + 1}${val ? `, quân ${val}` : ', còn trống'}`}
                      className={cn(
                        'relative flex items-center justify-center group',
                        'transition-colors duration-100 ease-out select-none',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70',
                        !isRightEdge && 'border-r',
                        !isBottomEdge && 'border-b',
                        isWin
                          ? 'border-emerald-500/40'
                          : isLast
                            ? 'border-cyan-500/25'
                            : 'border-white/[0.07]',
                        !val && !khoaBan && 'cursor-pointer hover:z-10',
                        val && 'cursor-default',
                        khoaBan && 'cursor-not-allowed',
                      )}
                      style={{
                        backgroundColor: isWin
                          ? 'rgba(16,185,129,0.18)'
                          : isLast
                            ? 'rgba(6,182,212,0.12)'
                            : undefined,
                        boxShadow: isWin
                          ? 'inset 0 0 12px rgba(16,185,129,0.25)'
                          : undefined,
                      }}
                    >
                      {/* Hover glow - chỉ khi ô trống */}
                      {!val && !khoaBan && (
                        <span
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                          style={{
                            background: currentTurn === 'X'
                              ? 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)'
                              : 'radial-gradient(circle, rgba(244,63,94,0.22) 0%, transparent 70%)',
                          }}
                        />
                      )}

                      {/* Star point to hơn, sáng rõ hơn */}
                      {isStar && !val && (
                        <span
                          className="size-2 rounded-full pointer-events-none"
                          style={{
                            background: 'rgba(99,102,241,0.75)',
                            boxShadow: '0 0 8px rgba(99,102,241,0.9)',
                          }}
                        />
                      )}

                      {/* Quân X nét to rõ ràng (64%) */}
                      {val === 'X' && (
                        <svg
                          viewBox="0 0 24 24"
                          className={cn(
                            'w-[64%] h-[64%] transition-transform duration-200 pointer-events-none',
                            isWin && 'scale-110'
                          )}
                          aria-hidden="true"
                          focusable="false"
                        >
                          <line x1="5.5" y1="5.5" x2="19.5" y2="19.5" stroke="rgba(0,0,0,0.55)" strokeWidth="3.6" strokeLinecap="round" transform="translate(0.5,0.5)" />
                          <line x1="19.5" y1="5.5" x2="5.5" y2="19.5" stroke="rgba(0,0,0,0.55)" strokeWidth="3.6" strokeLinecap="round" transform="translate(0.5,0.5)" />
                          <line x1="5.5" y1="5.5" x2="19.5" y2="19.5" stroke={isWin ? 'url(#caroXWin)' : 'url(#caroX)'} strokeWidth="3.2" strokeLinecap="round" />
                          <line x1="19.5" y1="5.5" x2="5.5" y2="19.5" stroke={isWin ? 'url(#caroXWin)' : 'url(#caroX)'} strokeWidth="3.2" strokeLinecap="round" />
                        </svg>
                      )}

                      {/* Quân O vòng tròn to rõ ràng (64%) */}
                      {val === 'O' && (
                        <svg
                          viewBox="0 0 24 24"
                          className={cn(
                            'w-[64%] h-[64%] transition-transform duration-200 pointer-events-none',
                            isWin && 'scale-110'
                          )}
                          aria-hidden="true"
                          focusable="false"
                        >
                          <circle cx="12.5" cy="12.5" r="6.5" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3.6" />
                          <circle cx="12" cy="12" r="6.5" fill="none" stroke={isWin ? 'url(#caroXWin)' : 'url(#caroO)'} strokeWidth="3.2" />
                          <path d="M 7.5 9 A 6.5 6.5 0 0 1 16.5 9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Viền neon sáng dưới */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4) 30%, rgba(6,182,212,0.4) 70%, transparent)',
                }}
              />
            </div>

            {/* Đế bàn cờ phẳng */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl"
              style={{
                background: 'linear-gradient(to bottom, #030610, #020409)',
                borderTop: '1px solid rgba(6,182,212,0.15)',
              }}
            />
          </div>

          {/* Nút cảm xúc phụ khi hai cột bên bàn cờ bị ẩn (< 1920px) */}
          <div className="flex min-[1920px]:hidden items-center justify-center mt-2.5">
            <GameQuickEmote
              emotes={QUICK_EMOTES_CARO}
              onSend={handleQuickEmote}
              activeBubble={playerBubble || bongDoiThu}
              theme="cyan"
              align="center"
            />
          </div>

          {/* VÙNG 1+: Banner hào hùng xuất quân & kết thúc ván đấu phủ lên bàn cờ */}
          <GameHeroicBanner
            type={heroicBanner?.type ?? null}
            title={heroicBanner?.title}
            visible={Boolean(heroicBanner)}
            onClose={() => setHeroicBanner(null)}
          />
        </div>

        {/* ── CỘT PHẢI: VÙNG 1+ (Địch ở trên) | VÙNG 1 (Ta ở dưới) ── */}
        <div className="hidden min-[1920px]:flex flex-col items-center justify-between shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[540px] xl:h-[580px] 2xl:h-[620px] select-none py-2">
          {/* VÙNG 1+: Tin nhắn đối thủ (Địch / AI) ở góc trên */}
          <div className="w-full flex justify-center">
            <GameOpponentBubble bubble={bongDoiThu} theme="cyan" />
          </div>

          {/* VÙNG 1: Nút cảm xúc & tin nhắn của ta ở góc dưới */}
          <div className="w-full flex justify-center">
            <GameQuickEmote
              emotes={QUICK_EMOTES_CARO}
              onSend={handleQuickEmote}
              activeBubble={playerBubble}
              theme="cyan"
              align="end"
            />
          </div>
        </div>
      </div>

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          banOnline && benToiOnline
            ? `Quân ${benToiOnline} (Bạn)`
            : mode === 'ai'
              ? 'Quân X (Bạn)'
              : (currentTurn === 'X' ? 'Quân X' : 'Quân O')
        }
        opponentSideName={
          banOnline && benToiOnline
            ? tenNguoiChoi(banOnline, benToiOnline === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân O (Máy AI)'
              : (currentTurn === 'X' ? 'người chơi quân O' : 'người chơi quân X')
        }
        attemptNumber={1}
        onSurrenderSuccess={() => {
          if (banOnline) {
            // Máy chủ chốt ván và báo cho cả bàn.
            banOnline.surrender()
            setIsSurrenderModalOpen(false)
            return
          }
          const losingSide = mode === 'ai' ? playerSide : currentTurn
          const winningSide = losingSide === 'X' ? 'O' : 'X'
          setWinner(winningSide)
          setSurrenderReason(`${mode === 'ai' ? 'Bạn' : `Quân ${losingSide}`} đã xin thua`)
          setIsSurrenderModalOpen(false)
          setIsAiThinking(false)
        }}
      />
    </div>
  )
}
