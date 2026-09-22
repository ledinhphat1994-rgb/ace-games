import type { UserAchievementItem } from '../../../shared/protocol/engagement'

export type AchievementViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; items: UserAchievementItem[] }

export function deriveAchievementViewState(params: {
  isLoading: boolean
  isError: boolean
  items?: UserAchievementItem[] | null
  errorMessage?: string
}): AchievementViewState {
  if (params.isLoading) {
    return { status: 'loading' }
  }
  if (params.isError) {
    return {
      status: 'error',
      message: params.errorMessage || 'Không tải được thành tựu',
    }
  }
  const items = params.items || []
  if (items.length === 0) {
    return { status: 'empty' }
  }
  return {
    status: 'success',
    items,
  }
}
