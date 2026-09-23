import type { EngagementProfile } from '../../../shared/protocol/engagement'

export interface ProgressDataResponse {
  ok: boolean
  profile?: EngagementProfile
  loi?: string
  message?: string
}

export type ProgressDerivedState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | {
      type: 'success'
      profile: EngagementProfile
      todayXp: number
      totalXp: number
      currentStreak: number
    }

export function deriveProgressState({
  isLoading,
  isError,
  data,
  error,
}: {
  isLoading: boolean
  isError: boolean
  data?: ProgressDataResponse | null
  error?: unknown
}): ProgressDerivedState {
  if (isLoading) {
    return { type: 'loading' }
  }

  if (isError || !data || data.ok === false || !data.profile) {
    const message =
      (error instanceof Error && error.message) ||
      data?.loi ||
      data?.message ||
      'Không tải được tiến trình.'
    return { type: 'error', message }
  }

  return {
    type: 'success',
    profile: data.profile,
    todayXp: data.profile.todayXp ?? 0,
    totalXp: data.profile.totalXp ?? 0,
    currentStreak: data.profile.currentStreak ?? 0,
  }
}
