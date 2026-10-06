import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  BieuCam,
  BoardCell,
  GameMetaState,
  GameType,
  GoiGame,
  LenhGameGui,
  NuocCo,
  NuocVuaDi,
  PlayerSide,
} from '@shared/protocol/game'
import type { RoomChatMessage, ThanhVienPhong } from '@shared/protocol/room'
import { EMOTE_BURST_MAX, EMOTE_COOLDOWN_MS } from '@shared/protocol/game-sdk'
import { MA_DONG_SOCKET } from '@shared/protocol/common'
import { taoBanMoi } from '../../worker/game-engine'
import { toast } from 'sonner'
import { nenKhoiTaoBan, nenTuVaoBan } from '@/features/games/game-ids'

export type TrangThaiKetNoiGame = 'dang_ket_noi' | 'da_ket_noi' | 'mat_ket_noi' | 'phien_bi_thay'

/** Lệnh gửi qua kết nối bàn: lệnh game, hoặc tin nhắn chat phòng game (RoomDO xử lý như chat phòng học). */
type LenhBan = LenhGameGui | { type: 'chat.send'; reqId: string; text: string }

/** Giới hạn độ dài một tin nhắn chat phòng game (máy chủ nhận tối đa 1000 ký tự). */
export const DO_DAI_TIN_BAN_TOI_DA = 300
/** Số tin nhắn chat phòng game giữ trên máy khách. */
const SO_TIN_BAN_TOI_DA = 100

const BACKOFF_KHOI_DAU_MS = 1000
const BACKOFF_TOI_DA_MS = 10000
/** Khoảng nghỉ giữa hai biểu cảm, khớp giới hạn của máy chủ (EMOTE_BURST_MAX lần mỗi EMOTE_COOLDOWN_MS). */
export const NGHI_GIUA_BIEU_CAM_MS = EMOTE_COOLDOWN_MS / EMOTE_BURST_MAX

const DEFAULT_META: GameMetaState = {
  gameType: 'caro_15',
  playerX: null,
  playerXName: null,
  playerO: null,
  playerOName: null,
  currentTurn: 'X',
  status: 'waiting',
  winner: null,
  winLine: null,
  turnTimerSeconds: 30,
  turnTimerEndsAt: 0,
  scoreX: 0,
  scoreO: 0,
  endReason: null,
  rematchBy: null,
  firstTurn: 'X',
}

export function useGame(
  gameId: string,
  myActorKey?: string,
  intendedGameType?: GameType,
  intendedTurnSeconds?: number,
  intendedIsPrivate?: boolean,
  intendedPassword?: string,
) {
  const loaiBanDau: GameType =
    intendedGameType ??
    (gameId.startsWith('chess-')
      ? 'chess'
      : gameId.startsWith('xiangqi-')
        ? 'xiangqi'
        : 'caro_15')

  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiGame>('dang_ket_noi')
  const [meta, setMeta] = useState<GameMetaState>(() => ({
    ...DEFAULT_META,
    gameType: loaiBanDau,
  }))
  const [board, setBoard] = useState<BoardCell[][]>(() => taoBanMoi(loaiBanDau))
  // Ai đang ở bàn (RoomDO phát `presence` mỗi khi có người vào/rời); null khi chưa nhận lần nào.
  const [thanhVien, setThanhVien] = useState<ThanhVienPhong[] | null>(null)
  // Cờ vua / cờ tướng: toàn bộ nước đã đi của ván (máy chủ là trọng tài, máy khách chỉ dựng lại thế cờ để vẽ).
  const [moves, setMoves] = useState<NuocCo[]>([])
  // Đã nhận trạng thái thật của bàn từ máy chủ (trước đó `meta` chỉ là giá trị mặc định).
  const [daDongBo, setDaDongBo] = useState(false)
  const [chat, setChat] = useState<RoomChatMessage[]>([])
  const [lastMove, setLastMove] = useState<NuocVuaDi | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [incomingEmote, setIncomingEmote] = useState<{ sender: string; senderKey: string; emote: string; id: number } | null>(
    null,
  )
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(0)

  const wsRef = useRef<WebSocket | null>(null)
  const lucGuiPingRef = useRef<number | null>(null)
  // Đồng hồ máy chủ − đồng hồ máy này: hạn chót lượt là giờ máy chủ, máy học sinh có thể lệch vài chục giây.
  const lechDongHoRef = useRef<number>(0)
  const soLanThuRef = useRef<number>(0)
  const henGioKetNoiLaiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const daHuyRef = useRef<boolean>(false)
  const ketNoiRef = useRef<() => void>(() => {})

  const mySide: PlayerSide | null = useMemo(() => {
    if (!myActorKey) return null
    if (meta.playerX === myActorKey) return 'X'
    if (meta.playerO === myActorKey) return 'O'
    return null
  }, [myActorKey, meta.playerX, meta.playerO])

  const isMyTurn = useMemo(() => {
    return mySide !== null && meta.status === 'playing' && meta.currentTurn === mySide
  }, [mySide, meta.status, meta.currentTurn])

  /** Người ngồi ghế này có đang ở bàn không (chưa có dữ liệu hiện diện thì coi như có). */
  const coMat = useCallback(
    (side: PlayerSide) => {
      const key = side === 'X' ? meta.playerX : meta.playerO
      if (!key) return false
      return thanhVien ? thanhVien.some((m) => m.key === key) : true
    },
    [meta.playerX, meta.playerO, thanhVien],
  )

  const spectators = useMemo(
    () => (thanhVien ?? []).filter((m) => m.key !== meta.playerX && m.key !== meta.playerO).length,
    [thanhVien, meta.playerX, meta.playerO],
  )

  // Đếm ngược lượt đi theo đồng hồ máy chủ.
  useEffect(() => {
    if (meta.status !== 'playing' || meta.turnTimerEndsAt <= 0) {
      return
    }

    const capNhat = () => {
      const bayGioMayChu = Date.now() + lechDongHoRef.current
      setTurnTimeRemaining(Math.max(0, Math.ceil((meta.turnTimerEndsAt - bayGioMayChu) / 1000)))
    }
    capNhat()
    const timer = setInterval(capNhat, 250)
    return () => clearInterval(timer)
  }, [meta.status, meta.turnTimerEndsAt])

  const ketNoi = useCallback(() => {
    // Chưa đăng nhập thì máy chủ từ chối kết nối bàn (401): không thử kết nối lại vô ích.
    if (daHuyRef.current || !gameId || !myActorKey) return
    if (henGioKetNoiLaiRef.current) {
      clearTimeout(henGioKetNoiLaiRef.current)
      henGioKetNoiLaiRef.current = null
    }

    setTrangThai('dang_ket_noi')
    const giaoThuc = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = typeof location !== 'undefined' ? location.host : 'localhost'
    const passParam = intendedPassword || (
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('pass') ||
          sessionStorage.getItem(`dc_game_pw_${gameId}`) ||
          localStorage.getItem(`dc_game_pw_${gameId}`) ||
          ''
        : ''
    )
    const passQuery = passParam ? `?pass=${encodeURIComponent(passParam)}` : ''
    const ws = new WebSocket(`${giaoThuc}//${host}/ws/game/${encodeURIComponent(gameId)}${passQuery}`)
    wsRef.current = ws

    ws.onopen = () => {
      if (wsRef.current !== ws) return
      setTrangThai('da_ket_noi')
      soLanThuRef.current = 0
    }

    ws.onmessage = (e) => {
      if (wsRef.current !== ws) return
      let goi: GoiGame
      try {
        const raw = JSON.parse(String(e.data)) as unknown
        if (!raw || typeof raw !== 'object' || !('type' in raw)) return
        goi = raw as GoiGame
      } catch {
        return
      }

      switch (goi.type) {
        case 'game.snapshot': {
          lechDongHoRef.current = goi.serverNow - Date.now()
          setMeta(goi.meta)
          setBoard(goi.board)
          setMoves(goi.moves ?? [])
          setChat(goi.chat ?? [])
          setDaDongBo(true)
          setLastMove(null)
          // Bàn vừa tạo, chưa ai nhận X/O: người tạo gửi init để ngồi ghế X, áp trò chơi/thời gian lượt đã chọn ở
          // sảnh và đăng bàn lên sảnh (người vào bàn có sẵn không kèm intendedGameType nên không đụng tới).
          if (intendedGameType && nenKhoiTaoBan(goi.meta, intendedGameType)) {
            const isPrivateInit = Boolean(
              intendedIsPrivate ||
              gameId.includes('rieng-tu') ||
              (typeof window !== 'undefined' && (
                new URLSearchParams(window.location.search).get('accessMode') === 'password' ||
                Boolean(sessionStorage.getItem(`dc_game_pw_${gameId}`) || localStorage.getItem(`dc_game_pw_${gameId}`))
              ))
            )
            const passwordInit = intendedPassword || (
              typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('pass') ||
                  sessionStorage.getItem(`dc_game_pw_${gameId}`) ||
                  localStorage.getItem(`dc_game_pw_${gameId}`) ||
                  undefined
                : undefined
            )
            ws.send(
              JSON.stringify({
                type: 'game.init',
                gameType: intendedGameType,
                turnSeconds: intendedTurnSeconds ?? 30,
                isPrivate: isPrivateInit,
                password: passwordInit,
              }),
            )
          } else if (nenTuVaoBan(goi.meta, myActorKey)) {
            // Bàn đang chờ đối thủ mà mình chưa có ghế: tự động vào ghế nhưng chưa bắt đầu ván (chờ 2 bên sẵn sàng).
            ws.send(JSON.stringify({ type: 'game.join', password: passParam || undefined, autoStart: false }))
          }
          break
        }
        case 'game.sync': {
          lechDongHoRef.current = goi.serverNow - Date.now()
          setMeta(goi.meta)
          setBoard(goi.board)
          setMoves(goi.moves ?? [])
          // Giữ dấu nước cuối trên bàn đã kết thúc (đầu hàng, hết giờ, mời đấu lại); bàn mới thì xoá dấu cũ.
          if (goi.lastMove) setLastMove(goi.lastMove)
          else if (goi.meta.status !== 'ended') setLastMove(null)
          break
        }
        case 'presence': {
          setThanhVien(goi.members)
          break
        }
        case 'game.emote': {
          setIncomingEmote({
            sender: goi.sender,
            senderKey: goi.senderKey,
            emote: goi.emote,
            id: Date.now(),
          })
          break
        }
        case 'room.chat': {
          const tin = goi.message
          setChat((truoc) =>
            truoc.some((m) => m.id === tin.id) ? truoc : [...truoc, tin].slice(-SO_TIN_BAN_TOI_DA),
          )
          break
        }
        case 'pong': {
          lechDongHoRef.current = goi.serverNow - Date.now()
          if (lucGuiPingRef.current != null) {
            setLatencyMs(Math.max(0, Date.now() - lucGuiPingRef.current))
            lucGuiPingRef.current = null
          }
          break
        }
        case 'error': {
          console.warn('[Game] Server error:', goi.message)
          // Máy chủ từ chối lệnh (nước đi sai luật, chưa tới lượt…): báo cho người chơi thay vì im lặng.
          if (goi.message) toast.error(goi.message, { id: 'game-server-error' })
          break
        }
      }
    }

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return
      wsRef.current = null

      if (e.code === MA_DONG_SOCKET.PHIEN_BI_THAY) {
        setTrangThai('phien_bi_thay')
        return
      }

      setTrangThai('mat_ket_noi')
      if (daHuyRef.current) return

      const delay = Math.min(
        BACKOFF_TOI_DA_MS,
        BACKOFF_KHOI_DAU_MS * Math.pow(1.5, soLanThuRef.current) + Math.random() * 500,
      )
      soLanThuRef.current++
      henGioKetNoiLaiRef.current = setTimeout(() => {
        if (!daHuyRef.current) ketNoiRef.current()
      }, delay)
    }

    ws.onerror = () => {
      // ws.onclose sẽ kích hoạt và xử lý backoff
    }
  }, [gameId, myActorKey, intendedGameType, intendedTurnSeconds])

  useEffect(() => {
    ketNoiRef.current = ketNoi
  }, [ketNoi])

  useEffect(() => {
    daHuyRef.current = false
    ketNoi()
    return () => {
      daHuyRef.current = true
      if (henGioKetNoiLaiRef.current) clearTimeout(henGioKetNoiLaiRef.current)
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {}
        wsRef.current = null
      }
    }
  }, [ketNoi])

  // Keep-alive ping
  useEffect(() => {
    if (trangThai !== 'da_ket_noi') return
    const timer = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        lucGuiPingRef.current = Date.now()
        wsRef.current.send(JSON.stringify({ type: 'ping', t: lucGuiPingRef.current }))
      }
    }, 15000)
    return () => clearInterval(timer)
  }, [trangThai])

  /** Gửi lệnh nếu đang kết nối; trả về false khi chưa gửi được (đang kết nối lại). */
  const gui = useCallback((lenh: LenhBan): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(lenh))
      return true
    }
    return false
  }, [])

  const joinGame = useCallback(
    (side?: 'X' | 'O') => {
      const passParam =
        intendedPassword ||
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('pass') ||
            sessionStorage.getItem(`dc_game_pw_${gameId}`) ||
            localStorage.getItem(`dc_game_pw_${gameId}`) ||
            ''
          : '')
      gui({ type: 'game.join', side, password: passParam || undefined, autoStart: false })
    },
    [gui, intendedPassword, gameId],
  )

  const makeMove = useCallback(
    (x: number, y: number) => {
      gui({ type: 'game.move', x, y })
    },
    [gui],
  )

  /** Cờ vua / cờ tướng: gửi nước đi (ô đi, ô đến, quân phong cấp) để máy chủ xét và phát lại cho cả bàn. */
  const diCo = useCallback(
    (nuoc: NuocCo) => {
      gui({ type: 'game.move', from: nuoc.from, to: nuoc.to, ...(nuoc.promo ? { promo: nuoc.promo } : {}) })
    },
    [gui],
  )

  /** Chat phòng game: máy chủ lưu và phát cho mọi người đang ở bàn (người chơi lẫn người xem). */
  const guiChat = useCallback(
    (text: string): boolean => {
      const noiDung = text.trim().slice(0, DO_DAI_TIN_BAN_TOI_DA)
      if (!noiDung) return false
      const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
      return gui({ type: 'chat.send', reqId: reqId.slice(0, 50), text: noiDung })
    },
    [gui],
  )

  const surrender = useCallback(() => {
    gui({ type: 'game.surrender' })
  }, [gui])

  /** Bắt đầu ván đấu (ván mới hoặc đấu lại) */
  const startGame = useCallback(() => {
    gui({ type: 'game.start' })
  }, [gui])

  /** Mời đấu lại, hoặc đồng ý khi đối thủ đã mời — máy chủ chỉ mở ván mới khi cả hai cùng muốn. */
  const rematch = useCallback(() => {
    gui({ type: 'game.rematch' })
  }, [gui])

  const sendEmote = useCallback(
    (emote: BieuCam) => {
      gui({ type: 'game.emote', emote })
    },
    [gui],
  )

  const datThoiGianSuyNghi = useCallback(
    (turnSeconds: number) => {
      gui({ type: 'game.set_timer', turnSeconds })
    },
    [gui],
  )

  const datPve = useCallback(
    (isPve: boolean) => {
      gui({ type: 'game.set_pve', isPve })
    },
    [gui],
  )

  return {
    gameId,
    myActorKey,
    trangThai,
    daDongBo,
    meta,
    board,
    thanhVien: thanhVien ?? [],
    spectators,
    coMat,
    mySide,
    isMyTurn,
    turnTimeRemaining,
    moves,
    chat,
    lastMove,
    latencyMs,
    incomingEmote,
    joinGame,
    makeMove,
    diCo,
    guiChat,
    surrender,
    startGame,
    rematch,
    sendEmote,
    datThoiGianSuyNghi,
    datPve,
  }
}

/** Bàn đối kháng online mà một bàn cờ (Caro / Cờ vua / Cờ tướng) hiển thị — trạng thái và lệnh từ `useGame`. */
export type BanOnline = ReturnType<typeof useGame>
