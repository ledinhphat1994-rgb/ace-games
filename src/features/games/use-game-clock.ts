import { useCallback, useEffect, useRef, useState } from 'react'
import type { BanOnline } from '@/hooks/use-game'

interface UseGameClockParams {
  isOnline: boolean
  isPlaying: boolean
  isMyTurn?: boolean
  turnKey: string | number // Thay đổi mỗi khi đổi lượt để reset đồng hồ offline
  online?: BanOnline
  onTimeout?: () => void
}

export function useGameClock({
  isOnline,
  isPlaying,
  turnKey,
  online,
  onTimeout,
}: UseGameClockParams) {
  const [localTurnSeconds, setLocalTurnSeconds] = useState<number>(30)
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(30)
  const [opponentProposal, setOpponentProposal] = useState<number | null>(null)
  const [myPendingProposal, setMyPendingProposal] = useState<number | null>(null)

  // Mốc thời gian thực tế: nếu online thì ưu tiên server meta
  const currentTurnSeconds = isOnline && online?.meta.turnTimerSeconds
    ? online.meta.turnTimerSeconds
    : localTurnSeconds

  // Đồng hồ đếm ngược offline (PvE / Chơi 2 người)
  const turnKeyRef = useRef(turnKey)
  useEffect(() => {
    turnKeyRef.current = turnKey
    setLocalTimeRemaining(currentTurnSeconds)
  }, [turnKey, currentTurnSeconds])

  useEffect(() => {
    if (isOnline || !isPlaying) return

    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeout?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOnline, isPlaying, turnKey, onTimeout])

  // Lắng nghe tin nhắn hệ thống bí mật để thương lượng thời gian suy nghĩ ở chế độ Online
  const daXuLyChatIdRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!isOnline || !online?.chat || online.chat.length === 0) return

    for (const msg of online.chat) {
      if (daXuLyChatIdRef.current.has(msg.id)) continue
      daXuLyChatIdRef.current.add(msg.id)

      const text = msg.text.trim()
      const isFromMe = String(msg.accountId) === online.myActorKey?.replace(/^acc:/, '')

      if (text.startsWith('[SYS_TIMER_PROP:')) {
        const match = text.match(/\[SYS_TIMER_PROP:(\d+)\]/)
        if (match && !isFromMe) {
          const sec = Number(match[1])
          if (sec >= 10 && sec <= 180) {
            setOpponentProposal(sec)
          }
        }
      } else if (text.startsWith('[SYS_TIMER_ACCEPT:')) {
        const match = text.match(/\[SYS_TIMER_ACCEPT:(\d+)\]/)
        if (match) {
          const sec = Number(match[1])
          setMyPendingProposal(null)
          setOpponentProposal(null)
          setLocalTurnSeconds(sec)
        }
      } else if (text.startsWith('[SYS_TIMER_REJECT:')) {
        setMyPendingProposal(null)
        setOpponentProposal(null)
      }
    }
  }, [isOnline, online?.chat, online?.myActorKey])

  // Reset proposals khi ván đấu bắt đầu
  useEffect(() => {
    if (isPlaying) {
      setOpponentProposal(null)
      setMyPendingProposal(null)
    }
  }, [isPlaying])

  const proposeTime = useCallback(
    (seconds: number) => {
      if (isPlaying) return

      if (isOnline && online) {
        setMyPendingProposal(seconds)
        online.guiChat(`[SYS_TIMER_PROP:${seconds}]`)
        // Nếu chỉ có 1 người đang ở bàn (chờ đối thủ vào sau), lưu luôn lên server
        if (!online.meta.playerO) {
          online.datThoiGianSuyNghi(seconds)
        }
      } else {
        setLocalTurnSeconds(seconds)
        setLocalTimeRemaining(seconds)
      }
    },
    [isPlaying, isOnline, online],
  )

  const acceptProposal = useCallback(
    (seconds: number) => {
      if (!isOnline || !online) return
      online.guiChat(`[SYS_TIMER_ACCEPT:${seconds}]`)
      online.datThoiGianSuyNghi(seconds)
      setOpponentProposal(null)
      setLocalTurnSeconds(seconds)
    },
    [isOnline, online],
  )

  const rejectProposal = useCallback(() => {
    if (!isOnline || !online) return
    online.guiChat(`[SYS_TIMER_REJECT:${opponentProposal ?? 30}]`)
    setOpponentProposal(null)
  }, [isOnline, online, opponentProposal])

  return {
    turnSeconds: currentTurnSeconds,
    timeRemaining: isOnline && online ? online.turnTimeRemaining : localTimeRemaining,
    opponentProposal,
    myPendingProposal,
    proposeTime,
    acceptProposal,
    rejectProposal,
  }
}
