import { useCallback, useEffect, useState } from 'react'
import type {
  GameAudioSettings,
  GameEndReason,
  GameLifecycleEvent,
  GameMode,
  GameQualityLevel,
  GameUserIdentity,
  SoloSessionFinishResponse,
} from '../../../shared/protocol/game-sdk'
import { CampusGameSDK } from './campus-game-sdk'

export interface UseGameSDKOptions {
  containerRef: React.RefObject<HTMLElement | null>
  gameType: string
  mode?: GameMode
  user?: GameUserIdentity | null
  initialAudio?: Partial<GameAudioSettings>
}

export function useGameSDK({ containerRef, gameType, mode = 'solo', user, initialAudio }: UseGameSDKOptions) {
  const [sdk, setSdk] = useState<CampusGameSDK | null>(null)
  const [lifecycle, setLifecycle] = useState<GameLifecycleEvent>('init')
  const [score, setScore] = useState<number>(0)
  const [fps, setFps] = useState<number>(60)
  const [qualityLevel, setQualityLevel] = useState<GameQualityLevel>('high')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const instance = new CampusGameSDK({
      container,
      gameType,
      mode,
      user,
      initialAudio,
      onLifecycleChange: (ev) => setLifecycle(ev),
      onScoreUpdate: (s) => setScore(s),
      onQualityChange: (q) => setQualityLevel(q),
    })

    setSdk(instance)

    const fpsInterval = setInterval(() => {
      setFps(instance.getFps())
    }, 1000)

    return () => {
      clearInterval(fpsInterval)
      instance.destroy()
      setSdk(null)
    }
  }, [containerRef, gameType, mode, user, initialAudio])

  const start = useCallback(async () => {
    if (sdk) {
      await sdk.start()
    }
  }, [sdk])

  const pause = useCallback(() => {
    sdk?.pause()
  }, [sdk])

  const resume = useCallback(() => {
    sdk?.resume()
  }, [sdk])

  const end = useCallback(
    async (reason?: GameEndReason, finalScore?: number): Promise<SoloSessionFinishResponse | null> => {
      if (!sdk) return null
      setIsSubmitting(true)
      try {
        const result = await sdk.end(reason, finalScore)
        return result
      } finally {
        setIsSubmitting(false)
      }
    },
    [sdk],
  )

  const recordInput = useCallback(
    (actionCode: string, payload?: unknown) => {
      sdk?.recordInput(actionCode, payload)
    },
    [sdk],
  )

  const updateScore = useCallback(
    (newScore: number) => {
      sdk?.updateScore(newScore)
    },
    [sdk],
  )

  return {
    sdk,
    lifecycle,
    score,
    fps,
    qualityLevel,
    isSubmitting,
    start,
    pause,
    resume,
    end,
    recordInput,
    updateScore,
  }
}
