import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BieuCam, BoardCell, GameMetaState, GameType, GoiGame, LenhGame, PlayerSide } from '@shared/protocol/game'
import type { ThanhVienPhong } from '@shared/protocol/room'
import { EMOTE_BURST_MAX, EMOTE_COOLDOWN_MS } from '@shared/protocol/game-sdk'
import { MA_DONG_SOCKET } from '@shared/protocol/common'
import { taoBanMoi } from '../../worker/game-engine'
import { toast } from 'sonner'
import { nenKhoiTaoBan } from '@/features/games/game-ids'

export type TrangThaiKetNoiGame = 'dang_ket_noi' | 'da_ket_noi' | 'mat_ket_noi' | 'phien_bi_thay'

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
) {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiGame>('dang_ket_noi')
  const [meta, setMeta] = useState<GameMetaState>(DEFAULT_META)
  const [board, setBoard] = useState<BoardCell[][]>(() => taoBanMoi('caro_15'))
  // Ai đang ở bàn (RoomDO phát `presence` mỗi khi có người vào/rời); null khi chưa nhận lần nào.
  const [thanhVien, setThanhVien] = useState<ThanhVienPhong[] | null>(null)
  const [lastMove, setLastMove] = useState<{ player: PlayerSide; x: number; y: number } | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [incomingEmote, setIncomingEmote] = useState<{ sender: string; emote: string; id: number } | null>(null)
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
    if (daHuyRef.current || !gameId) return
    if (henGioKetNoiLaiRef.current) {
      clearTimeout(henGioKetNoiLaiRef.current)
      henGioKetNoiLaiRef.current = null
    }

    setTrangThai('dang_ket_noi')
    const giaoThuc = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = typeof location !== 'undefined' ? location.host : 'localhost'
    const ws = new WebSocket(`${giaoThuc}//${host}/ws/game/${encodeURIComponent(gameId)}`)
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
          setLastMove(null)
          // Bàn vừa tạo, chưa ai nhận X/O: người tạo gửi init để ngồi ghế X, áp trò chơi/thời gian lượt đã chọn ở
          // sảnh và đăng bàn lên sảnh (người vào bàn có sẵn không kèm intendedGameType nên không đụng tới).
          if (intendedGameType && nenKhoiTaoBan(goi.meta, intendedGameType)) {
            ws.send(
              JSON.stringify({
                type: 'game.init',
                gameType: intendedGameType,
                turnSeconds: intendedTurnSeconds ?? 30,
              }),
            )
          }
          break
        }
        case 'game.sync': {
          lechDongHoRef.current = goi.serverNow - Date.now()
          setMeta(goi.meta)
          setBoard(goi.board)
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
            emote: goi.emote,
            id: Date.now(),
          })
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
  }, [gameId, intendedGameType, intendedTurnSeconds])

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

  const gui = useCallback((lenh: LenhGame) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(lenh))
    }
  }, [])

  const joinGame = useCallback(
    (side?: 'X' | 'O') => {
      gui({ type: 'game.join', side })
    },
    [gui],
  )

  const makeMove = useCallback(
    (x: number, y: number) => {
      gui({ type: 'game.move', x, y })
    },
    [gui],
  )

  const surrender = useCallback(() => {
    gui({ type: 'game.surrender' })
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

  return {
    trangThai,
    meta,
    board,
    spectators,
    coMat,
    mySide,
    isMyTurn,
    turnTimeRemaining,
    lastMove,
    latencyMs,
    incomingEmote,
    joinGame,
    makeMove,
    surrender,
    rematch,
    sendEmote,
  }
}
