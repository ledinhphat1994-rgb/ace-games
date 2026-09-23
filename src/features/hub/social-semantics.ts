/**
 * src/features/hub/social-semantics.ts
 *
 * Authoritative social semantics, presence classification, search lifecycle controller,
 * and mutation locks for Digital Campus v2 Community Hub.
 */

import type { FriendItem, FriendPresence, SearchResultItem } from '@shared/protocol/social'

export type SocialStatus = 'loading' | 'ready' | 'error'

export interface ClassifiedFriends {
  /** Friends currently in a study or game room that can be joined */
  inRoom: Array<{ friend: FriendItem; presence: FriendPresence; roomId: number; roomTitle?: string }>
  /** Friends online or away at lobby */
  online: Array<{ friend: FriendItem; presence: FriendPresence; isAway: boolean }>
  /** Friends offline */
  offline: Array<{ friend: FriendItem; presence?: FriendPresence }>
}

/**
 * Classifies friends into authoritative presence buckets based on realtime snapshot.
 */
export function classifyFriendsPresence(
  friends: FriendItem[],
  presenceMap: Record<number, FriendPresence>,
): ClassifiedFriends {
  const inRoom: ClassifiedFriends['inRoom'] = []
  const online: ClassifiedFriends['online'] = []
  const offline: ClassifiedFriends['offline'] = []

  for (const friend of friends) {
    const presence = presenceMap[friend.id]
    if (presence && (presence.state === 'online' || presence.state === 'away')) {
      if (presence.activity?.type === 'room' && presence.activity.roomId) {
        inRoom.push({
          friend,
          presence,
          roomId: presence.activity.roomId,
          roomTitle: presence.activity.roomTitle,
        })
      } else {
        online.push({
          friend,
          presence,
          isAway: presence.state === 'away',
        })
      }
    } else {
      offline.push({
        friend,
        presence,
      })
    }
  }

  return { inRoom, online, offline }
}

/**
 * Format relative last seen timestamp.
 */
export function formatLastSeen(ts: number | null | undefined): string {
  if (!ts) return 'Ngoại tuyến'
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Vừa mới đây'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return 'Lâu rồi chưa online'
}

/**
 * Search lifecycle states.
 * Guarantees that network errors never collapse into fake empty results ("Không tìm thấy").
 */
export type SearchState =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'success'; query: string; results: SearchResultItem[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; error: string }

/**
 * UserSearchController
 * Manages search request lifecycle, cancels stale in-flight responses,
 * and maintains truthful search state.
 */
export class UserSearchController {
  private currentSeq = 0
  private state: SearchState = { status: 'idle' }
  private listeners = new Set<(state: SearchState) => void>()

  public getState(): SearchState {
    return this.state
  }

  public subscribe(listener: (state: SearchState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private setState(next: SearchState): void {
    this.state = next
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }

  public reset(): void {
    this.currentSeq++
    this.setState({ status: 'idle' })
  }

  /**
   * Executes search with sequence ordering.
   * If a newer search begins, any prior slower response is discarded automatically.
   */
  public async executeSearch(
    query: string,
    fetchFn: (q: string) => Promise<SearchResultItem[]>,
  ): Promise<SearchState> {
    const trimmed = query.trim()
    if (!trimmed) {
      this.reset()
      return this.state
    }

    const seq = ++this.currentSeq
    this.setState({ status: 'searching', query: trimmed })

    try {
      const results = await fetchFn(trimmed)
      // Check if another search started while this was pending
      if (seq !== this.currentSeq) {
        return this.state
      }

      if (!results || results.length === 0) {
        this.setState({ status: 'empty', query: trimmed })
      } else {
        this.setState({ status: 'success', query: trimmed, results })
      }
      return this.state
    } catch (err) {
      // Discard stale error
      if (seq !== this.currentSeq) {
        return this.state
      }
      const message = err instanceof Error ? err.message : 'Lỗi kết nối khi tìm kiếm người dùng.'
      this.setState({ status: 'error', query: trimmed, error: message })
      return this.state
    }
  }

  /**
   * Updates an item's relationship status locally (e.g. after sending request)
   */
  public updateItemStatus(targetId: number, status: SearchResultItem['relationshipStatus']): void {
    if (this.state.status === 'success') {
      const updated = this.state.results.map((r) =>
        r.id === targetId ? { ...r, relationshipStatus: status } : r,
      )
      this.setState({ ...this.state, results: updated })
    }
  }
}

/**
 * MutationLockManager
 * Prevents concurrent double-clicks on friend mutations (send, accept, reject, unfriend, block).
 */
export class SocialMutationLockManager {
  private activeLocks = new Set<string>()

  public isLocked(actionKey: string): boolean {
    return this.activeLocks.has(actionKey)
  }

  public acquire(actionKey: string): boolean {
    if (this.activeLocks.has(actionKey)) return false
    this.activeLocks.add(actionKey)
    return true
  }

  public release(actionKey: string): void {
    this.activeLocks.delete(actionKey)
  }

  public async runWithLock<T>(
    actionKey: string,
    action: () => Promise<T>,
  ): Promise<{ executed: boolean; result?: T }> {
    if (!this.acquire(actionKey)) {
      return { executed: false }
    }
    try {
      const result = await action()
      return { executed: true, result }
    } finally {
      this.release(actionKey)
    }
  }
}
