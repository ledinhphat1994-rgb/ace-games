// test/u2-data-truth.test.ts
// Digital Campus v2: Milestone U2 — Data-Truth Invariants & Anti-Fabrication Regression Suite

import { describe, expect, it } from 'vitest'
import {
  deriveWebcamParticipants,
  getInitials,
  type ClassroomMember,
  type DerivedWebcamParticipant,
} from '../src/features/study/classroom-webcam-state'
import {
  deriveStageState,
} from '../src/features/study/classroom-stage-state'
import { HOME_DESTINATION_CONFIGS } from '../src/features/hub/home-destinations'
import { CAMPUS_HERO_BANNER_CONTRACT } from '../src/components/campus/campus-hero-contract'
import { LEARNING_OCCUPANCY_METRIC_CONFIG } from '../src/features/hub/learning-semantics'
import type { SlideState } from '../shared/protocol/room'

describe('U2 Data-Truth & Anti-Fabrication Invariants', () => {
  const FICTIONAL_DEFAULT_NAMES = [
    'Thầy Lê Đình Phát',
    'Nguyễn Văn Minh',
    'Trần Thị Thảo',
    'Lê Hoàng Long',
    'Phạm Quỳnh Anh',
  ]

  const GENERATED_HUMAN_WEBCAM_FILES = [
    'user_teacher.webp',
    'user_student_minh.webp',
    'user_student_thao.webp',
    'user_student_long.webp',
    'user_student_anh.webp',
  ]

  // ── 1. Zero Room Members => Zero Fictional Webcam Users ────────────────────
  it('1. Zero room members => zero fictional webcam users', () => {
    const participants = deriveWebcamParticipants([], 'host-1', 'me-1', [])

    expect(participants).toHaveLength(0)
    for (const fictionalName of FICTIONAL_DEFAULT_NAMES) {
      expect(participants.some((p: DerivedWebcamParticipant) => p.name === fictionalName)).toBe(false)
    }
  })

  // ── 2. One Room Member => Exactly One Rendered Participant ─────────────────
  it('2. One room member => exactly one rendered participant representation', () => {
    const singleMember: ClassroomMember[] = [
      { key: 'user-1', ten: 'Trần Văn Thực', isHost: true },
    ]
    const participants = deriveWebcamParticipants(singleMember, 'user-1', 'user-1', [])

    expect(participants).toHaveLength(1)
    expect(participants[0].key).toBe('user-1')
    expect(participants[0].name).toBe('Trần Văn Thực')
    expect(participants[0].role).toBe('Chủ phòng')
    expect(participants[0].isHost).toBe(true)
    expect(participants[0].isMe).toBe(true)
    expect(participants[0].initials).toBe('TT')

    // Must NOT contain any fictional default names
    for (const fictionalName of FICTIONAL_DEFAULT_NAMES) {
      expect(participants.some((p: DerivedWebcamParticipant) => p.name === fictionalName)).toBe(false)
    }
  })

  // ── 3. Multiple Room Members => Count Equals Real Member Count ─────────────
  it('3. Multiple room members => rendered participant count strictly equals real room member count', () => {
    const realMembers: ClassroomMember[] = [
      { key: 'u-1', ten: 'Học sinh An', isHost: true },
      { key: 'u-2', ten: 'Học sinh Bình', isHost: false },
      { key: 'u-3', ten: 'Học sinh Cường', isHost: false, canModerate: true },
    ]
    const participants = deriveWebcamParticipants(realMembers, 'u-1', 'u-1', ['u-2'])

    expect(participants).toHaveLength(3)
    expect(participants.map((p: DerivedWebcamParticipant) => p.name)).toEqual([
      'Học sinh An',
      'Học sinh Bình',
      'Học sinh Cường',
    ])
    expect(participants[0].role).toBe('Chủ phòng')
    expect(participants[1].role).toBe('Thành viên')
    expect(participants[1].isSpeaking).toBe(true)
    expect(participants[2].role).toBe('Quản trị')
  })

  // ── 4. No DEFAULT_PARTICIPANTS Fallback Exists ─────────────────────────────
  it('4. No DEFAULT_PARTICIPANTS fallback exists: empty input returns empty array without synthetic padding', () => {
    const fromNull = deriveWebcamParticipants(null as unknown as ClassroomMember[])
    const fromUndefined = deriveWebcamParticipants(undefined)
    const fromEmpty = deriveWebcamParticipants([])

    expect(fromNull).toEqual([])
    expect(fromUndefined).toEqual([])
    expect(fromEmpty).toEqual([])

    // Verify getInitials produces safe fallback without inventing names
    expect(getInitials('')).toBe('HS')
    expect(getInitials('Nguyễn')).toBe('NG')
    expect(getInitials('Lê Hoàng Long')).toBe('LL')
  })

  // ── 5. No Generated Human Webcam Assigned To Real User's Identity ──────────
  it('5. No generated human webcam is assigned to a real user identity without custom avatar', () => {
    const realUser: ClassroomMember[] = [
      { key: 'u-real', ten: 'Lê Thật', isHost: false },
    ]
    const participants = deriveWebcamParticipants(realUser)

    expect(participants[0].avatar).toBeUndefined()
    expect(participants[0].initials).toBe('LT')

    // Ensure none of the generated face assets are ever assigned
    for (const generatedAsset of GENERATED_HUMAN_WEBCAM_FILES) {
      expect(participants[0].avatar).not.toBe(generatedAsset)
      expect(participants[0].avatar).not.toBe(`/assets/users/${generatedAsset}`)
    }
  })

  // ── 6. Empty Room Has No Default Fake Lesson ───────────────────────────────
  it('6. Empty room has no default fake lesson', () => {
    const idleStage = deriveStageState(null)

    expect(idleStage.hasActivePresentation).toBe(false)
    expect(idleStage.docName).toBeNull()
    expect(idleStage.docUrl).toBeNull()
    expect(idleStage.fileType).toBeNull()

    // Truthful empty-state title
    expect(idleStage.emptyState.title).toBe('Màn Chiếu Phòng Học Trực Tuyến')
    expect(idleStage.emptyState.description).toContain('Chưa có bài giảng hoặc tài liệu nào đang được trình chiếu')

    // Must NOT contain fictional lesson titles
    expect(idleStage.docName).not.toBe('Toán học 10 · Khảo sát hàm số bậc hai')
    expect(idleStage.docName).not.toBe('Bài giảng số hóa')
  })

  // ── 7. Empty Room Has No Fake 1/12 Counter ──────────────────────────────────
  it('7. Empty room has no fake 1/12 counter', () => {
    const idleStage = deriveStageState(null)

    expect(idleStage.currentPage).toBeNull()
    expect(idleStage.totalPages).toBeNull()
    expect(idleStage.currentPage).not.toBe(1)
    expect(idleStage.totalPages).not.toBe(12)
  })

  // ── 8. Actual Presentation State Required Before Presentation Appears ──────
  it('8. Actual presentation state is required before presentation metadata appears', () => {
    const activeSlide: SlideState = {
      docId: 88,
      docUrl: 'https://storage.campus.edu.vn/slides/vat-ly-10.png',
      docName: 'Vật Lý 10 - Định luật Newton',
      fileType: 'image',
      currentPage: 4,
      totalPages: 10,
    }

    const liveStage = deriveStageState(activeSlide)

    expect(liveStage.hasActivePresentation).toBe(true)
    expect(liveStage.docName).toBe('Vật Lý 10 - Định luật Newton')
    expect(liveStage.currentPage).toBe(4)
    expect(liveStage.totalPages).toBe(10)
    expect(liveStage.docUrl).toBe('https://storage.campus.edu.vn/slides/vat-ly-10.png')
    expect(liveStage.fileType).toBe('image')
  })

  // ── 9. Home Does Not Advertise Unsupported Cờ Vua ──────────────────────────
  it('9. Home does not advertise unsupported Cờ vua in destination cards', () => {
    const arena = HOME_DESTINATION_CONFIGS.find((d) => d.id === 'arena')
    expect(arena).toBeDefined()
    const arenaTags = arena!.tags

    expect(arenaTags).not.toContain('Cờ vua')
    expect(arenaTags).toContain('Caro')
    expect(arenaTags).toContain('2048')
    expect(arenaTags).toContain('Rắn')
  })

  // ── 10. Community Does Not Advertise Unsupported Sự Kiện ───────────────────
  it('10. Community destination card does not advertise unsupported Sự kiện', () => {
    const community = HOME_DESTINATION_CONFIGS.find((d) => d.id === 'community')
    expect(community).toBeDefined()
    const communityTags = community!.tags

    expect(communityTags).not.toContain('Sự kiện')
  })

  // ── 11. Community Does Not Advertise Unsupported Thảo Luận ─────────────────
  it('11. Community destination card does not advertise unsupported Thảo luận', () => {
    const community = HOME_DESTINATION_CONFIGS.find((d) => d.id === 'community')
    expect(community).toBeDefined()
    const communityTags = community!.tags

    expect(communityTags).not.toContain('Thảo luận')
    expect(communityTags).toContain('Bạn bè')
    expect(communityTags).toContain('Trực tuyến')
    expect(communityTags).toContain('Kết nối')
  })

  // ── 12. Hero Contains No Inert Previous/Next Carousel Controls ─────────────
  it('12. Hero contains no inert Previous/Next carousel controls or fake multi-slide dots', () => {
    expect(CAMPUS_HERO_BANNER_CONTRACT.supportsCarousel).toBe(false)
    expect(CAMPUS_HERO_BANNER_CONTRACT.hasPreviousNextControls).toBe(false)
    expect(CAMPUS_HERO_BANNER_CONTRACT.hasMultiSlideIndicators).toBe(false)
  })

  // ── 13. Occupancy Wording Reflects Actual Semantics ─────────────────────────
  it('13. Occupancy wording reflects actual semantics (Lượt trong phòng / Đang tham gia, not unique Học sinh online)', () => {
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.headerLabel).toBe('Đang tham gia')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.subLabel).toBe('Lượt trong phòng')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.headerLabel).not.toBe('Học sinh online')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.subLabel).not.toBe('Học sinh online')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.prohibitedLabel).toBe('Học sinh online')
  })
})
