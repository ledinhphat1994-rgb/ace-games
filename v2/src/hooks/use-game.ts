import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BoardCell, GameMetaState, GameType, GoiGame, LenhGame, PlayerSide } from '@shared/protocol/game'
import { MA_DONG_SOCKET } from '@shared/protocol/common'
import { taoBanMoi } from '../../worker/game-engine'

export type TrangThaiKetNoiGame = 'dang_ket_noi' | 'da_ket_noi' | 'mat_ket_noi' | 'phien_bi_thay'

const BACKOFF_KHOI_DAU_MS = 1000
const BACKOFF_TOI_DA_MS = 10000

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
}

export function useGame(gameId: string, myActorKey?: string) {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiGame>('dang_ket_noi')
  const [meta, setMeta] = useState<GameMetaState>(DEFAULT_META)
  const [board, setBoard] = useState<BoardCell[][]>(() => taoBanMoi('caro_15'))
  const [spectators, setSpectators] = useState<number>(0)
  const [lastMove, setLastMove] = useState<{ player: PlayerSide; x: number; y: number } | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [incomingEmote, setIncomingEmote] = useState<{ sender: string; emote: string; id: number } | null>(null)
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(0)

  const wsRef = useRef<WebSocket | null>(null)
  const lucGuiPingRef = useRef<number | null>(null)
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

  // Countdown timer cho lượt đi
  useEffect(() => {
    if (meta.status !== 'playing' || meta.turnTimerEndsAt <= 0) {
      return
    }

    const capNhat = () => {
      const conLai = Math.max(0, Math.ceil((meta.turnTimerEndsAt - Date.now()) / 1000))
      setTurnTimeRemaining(conLai)
    }
    capNhat()
    const timer = setInterval(capNhat, 500)
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
          setMeta(goi.meta)
          setBoard(goi.board)
          setSpectators(goi.spectators)
          break
        }
        case 'game.sync': {
          setMeta(goi.meta)
          setBoard(goi.board)
          if (goi.lastMove) {
            setLastMove(goi.lastMove)
          }
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
          if (lucGuiPingRef.current != null) {
            setLatencyMs(Math.max(0, Date.now() - lucGuiPingRef.current))
            lucGuiPingRef.current = null
          }
          break
        }
        case 'error': {
          console.warn('[Game] Server error:', goi.message)
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
  }, [gameId])

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

  const initGame = useCallback(
    (gameType: GameType, turnSeconds = 30) => {
      gui({ type: 'game.init', gameType, turnSeconds })
    },
    [gui],
  )

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

  const rematch = useCallback(() => {
    gui({ type: 'game.rematch' })
  }, [gui])

  const sendEmote = useCallback(
    (emote: string) => {
      gui({ type: 'game.emote', emote })
    },
    [gui],
  )

  return {
    trangThai,
    meta,
    board,
    spectators,
    mySide,
    isMyTurn,
    turnTimeRemaining,
    lastMove,
    latencyMs,
    incomingEmote,
    initGame,
    joinGame,
    makeMove,
    surrender,
    rematch,
    sendEmote,
  }
}
