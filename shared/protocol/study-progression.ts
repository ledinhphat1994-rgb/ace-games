import { z } from 'zod'

/**
 * Digital Campus v2 — Progression Event Contracts for Study Collaboration
 *
 * NOTE: Server-emitted authoritative events ONLY — no XP calculations, no leveling formulas, no score tables.
 * Every rewardable event relies strictly on server-verifiable evidence signals and includes durable idempotency keys,
 * completely avoiding raw chat spam, button clicks, client claims, or idle room farming.
 */

export const StudySessionCompletedEvent = z.object({
  type: z.literal('study.session.completed'),
  eventId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  policyVersion: z.string().default('1.0'),
  roomId: z.string().min(1),
  accountId: z.number().int().positive(),
  joinedAt: z.number().int().positive(),
  leftAt: z.number().int().positive(),
  /** Active duration in seconds (idle time deducted by server activity tracking) */
  activeDurationSeconds: z.number().int().nonnegative(),
  completedAt: z.number().int().positive(),
})
export type StudySessionCompletedEvent = z.infer<typeof StudySessionCompletedEvent>

export const StudyPomodoroCompletedEvent = z.object({
  type: z.literal('study.pomodoro.completed'),
  eventId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  policyVersion: z.string().default('1.0'),
  roomId: z.string().min(1),
  accountId: z.number().int().positive(),
  round: z.number().int().positive(),
  mode: z.literal('focus'),
  /** Server-verified focus duration in seconds */
  durationSeconds: z.number().int().positive(),
  completedAt: z.number().int().positive(),
})
export type StudyPomodoroCompletedEvent = z.infer<typeof StudyPomodoroCompletedEvent>

export const StudyCollaborationMeaningfulEvent = z.object({
  type: z.literal('study.collaboration.meaningful'),
  eventId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  policyVersion: z.string().default('1.0'),
  roomId: z.string().min(1),
  accountId: z.number().int().positive(),
  /** Number of concurrent active participants during collaboration */
  participantCount: z.number().int().min(2),
  /** Subsystems actively collaborated in (e.g. users engaged in whiteboard + notes) */
  activeSubsystems: z.array(z.enum(['whiteboard', 'notes', 'chat', 'slides'])).min(1),
  durationSeconds: z.number().int().positive(),
  completedAt: z.number().int().positive(),
})
export type StudyCollaborationMeaningfulEvent = z.infer<typeof StudyCollaborationMeaningfulEvent>

export const StudyProgressionEvent = z.discriminatedUnion('type', [
  StudySessionCompletedEvent,
  StudyPomodoroCompletedEvent,
  StudyCollaborationMeaningfulEvent,
])
export type StudyProgressionEvent = z.infer<typeof StudyProgressionEvent>
