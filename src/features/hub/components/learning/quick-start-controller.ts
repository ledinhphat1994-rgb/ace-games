import { useSyncExternalStore } from 'react'

/**
 * QuickStartSubmissionLock
 *
 * Production lock and state controller for Quick Start Study Room creation.
 *
 * Invariants:
 * 1. FROM the moment a QuickStart POST begins UNTIL that exact request settles:
 *    there may be AT MOST ONE POST /api/rooms.
 * 2. Closing or reopening the modal MUST NOT reset this lock.
 * 3. While in-flight, modal dismissal (X, ESC, overlay, Cancel button) is prevented.
 * 4. The lock is ONLY released after the request settles (in finally block).
 * 5. On failure, lock releases so retry is permitted.
 * 6. On success, navigation/callbacks occur exactly once before modal closes.
 */
export class QuickStartSubmissionLock {
  private inFlight = false
  private listeners = new Set<() => void>()

  public isInFlight(): boolean {
    return this.inFlight
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  /**
   * Evaluates if dismiss actions (X button, ESC key, overlay click, Cancel button)
   * are allowed.
   * Invariant: while a room creation request is in-flight, dismissal is forbidden.
   */
  public canDismiss(): boolean {
    return !this.inFlight
  }

  /**
   * Attempts to acquire the submission lock.
   * Returns true if lock was successfully acquired for this request;
   * returns false if a request is already in-flight (duplicate request dropped).
   */
  public acquire(): boolean {
    if (this.inFlight) {
      return false
    }
    this.inFlight = true
    this.notify()
    return true
  }

  /**
   * Releases the submission lock once the request has settled.
   * Can ONLY be called after the promise settles (success or failure).
   */
  public release(): void {
    if (this.inFlight) {
      this.inFlight = false
      this.notify()
    }
  }

  /**
   * Handles modal open state changes safely.
   * If an in-flight request is pending and an attempt is made to close the modal,
   * dismiss is prevented (returns false) and the lock is NEVER cleared.
   */
  public handleOpenChange(
    newOpen: boolean,
    onOpenChange: (open: boolean) => void
  ): boolean {
    if (!newOpen && this.inFlight) {
      // Prevent dismissing modal while request is pending.
      // Invariant: closing the dialog MUST NOT reset this lock.
      return false
    }
    onOpenChange(newOpen)
    return true
  }

  /**
   * High-level executor that guarantees:
   * 1. At most one action is in-flight at any time.
   * 2. Lock is preserved across open/close attempts.
   * 3. Lock is ONLY released after the action settles.
   * 4. Failure allows subsequent retries.
   * 5. Success triggers navigation/success callback exactly once.
   */
  public async execute<T>(
    action: () => Promise<T>,
    callbacks: {
      onSuccess: (data: T) => void
      onError: (err: unknown) => void
    }
  ): Promise<{ executed: boolean; data?: T; error?: unknown }> {
    if (!this.acquire()) {
      return { executed: false }
    }

    try {
      const data = await action()
      callbacks.onSuccess(data)
      return { executed: true, data }
    } catch (err) {
      callbacks.onError(err)
      return { executed: true, error: err }
    } finally {
      this.release()
    }
  }
}

// Module-level singleton instance ensuring the lock survives modal unmount/remount
export const quickStartLock = new QuickStartSubmissionLock()

/**
 * React hook to bind QuickStartSubmissionLock with component re-renders.
 */
export function useQuickStartLock(lock: QuickStartSubmissionLock = quickStartLock) {
  const isInFlight = useSyncExternalStore(
    (cb) => lock.subscribe(cb),
    () => lock.isInFlight(),
    () => false
  )

  return {
    isInFlight,
    canDismiss: !isInFlight,
    acquire: () => lock.acquire(),
    release: () => lock.release(),
    handleOpenChange: (newOpen: boolean, onOpenChange: (open: boolean) => void) =>
      lock.handleOpenChange(newOpen, onOpenChange),
    execute: <T>(
      action: () => Promise<T>,
      callbacks: { onSuccess: (data: T) => void; onError: (err: unknown) => void }
    ) => lock.execute(action, callbacks),
  }
}
