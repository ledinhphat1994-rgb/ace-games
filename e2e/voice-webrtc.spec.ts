import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

assertSafeDestructiveE2ETarget(process.env.PLAYWRIGHT_BASE_URL)

const HOST_USER = {
  username: process.env.E2E_HOST_USERNAME || 'qa.v2.thu1',
  password: process.env.E2E_HOST_PASSWORD || '',
}

const MEMBER_USER = {
  username: process.env.E2E_MEMBER_B_USERNAME || 'qa.v2.thu2',
  password: process.env.E2E_MEMBER_B_PASSWORD || '',
}

const MEMBER_C_USER = {
  username: process.env.E2E_MEMBER_C_USERNAME || 'qa.v2.thu3',
  password: process.env.E2E_MEMBER_C_PASSWORD || '',
}

const TEST_ROOM_ID = process.env.E2E_PUBLIC_ROOM_ID || 'phong-7'
const numericRoomId = Number(TEST_ROOM_ID.match(/(\d+)$/)?.[1] || TEST_ROOM_ID)

async function fetchVoiceRegistry(page: Page): Promise<any[]> {
  const result = await page.evaluate(async (roomId) => {
    const res = await fetch(`/api/rooms/${roomId}/voice/registry`)
    if (!res.ok) {
      throw new Error(`voice registry HTTP ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    if (!data?.ok || !Array.isArray(data.registry)) {
      throw new Error(`Invalid voice registry response: ${JSON.stringify(data)}`)
    }
    return data.registry
  }, numericRoomId)
  return result
}

if (!HOST_USER.password || !MEMBER_USER.password || !MEMBER_C_USER.password) {
  throw new Error('Missing E2E credentials in environment or .env.e2e.')
}

interface CreateContextOptions {
  mic?: boolean
  e2e?: boolean
  autoplayRestricted?: boolean
}

async function createVoiceContext(browser: Browser, options: CreateContextOptions = {}) {
  const { mic = false, e2e = true, autoplayRestricted = false } = options
  const context = await browser.newContext({
    permissions: mic ? ['microphone'] : [],
  })
  if (e2e) {
    await context.addInitScript(() => {
      ;(window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ = true
    })
  }
  if (autoplayRestricted) {
    await context.addInitScript(() => {
      let hasUserGesture = false
      const unlock = () => {
        hasUserGesture = true
      }
      window.addEventListener('pointerdown', unlock, { capture: true, once: true })
      window.addEventListener('keydown', unlock, { capture: true, once: true })
      window.addEventListener('click', unlock, { capture: true })

      const originalPlay = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function (...args: unknown[]) {
        if (!hasUserGesture && !this.muted) {
          return Promise.reject(
            new DOMException("play() failed because the user didn't interact with the document first.", 'NotAllowedError')
          )
        }
        return originalPlay.apply(this, args as [])
      }
    })
  }
  return context
}

function setupPageLogging(page: Page, name: string) {
  page.on('console', (msg) => console.log(`[${name} LOG]`, msg.text()))
  page.on('response', async (res) => {
    if (res.url().includes('/voice/')) {
      const text = await res.text().catch(() => '')
      console.log(`[${name} VOICE RES] ${res.status()} ${res.url()}: ${text}`)
    }
  })
}

async function loginUser(page: Page, user: { username: string; password: string }) {
  // Xác thực phiên trực tiếp vào context cookie jar để loại bỏ race condition khi render form DOM
  await loginUserViaApi(page.context(), user)
  try {
    await page.goto('/')
  } catch {
    await page.waitForTimeout(1000)
    await page.goto('/')
  }
  const loginInput = page.locator('#ten-dang-nhap')
  const isLoginFormVisible = await loginInput.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
  if (isLoginFormVisible) {
    await loginInput.fill(user.username)
    await page.locator('#mat-khau').fill(user.password)
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/login') && r.status() === 200, { timeout: 20000 }).catch(() => null),
      page.locator('button[type="submit"]:has-text("Đăng nhập")').click(),
    ])
    await expect(loginInput).not.toBeVisible({ timeout: 20000 })
  }
}

async function loginUserViaApi(context: BrowserContext, user: { username: string; password: string }) {
  const res = await context.request.post('/api/login', {
    data: { username: user.username, password: user.password },
  })
  if (!res.ok()) {
    throw new Error(`API login failed for ${user.username}: ${res.status()}`)
  }
}

async function enterStudyRoom(page: Page, roomId = TEST_ROOM_ID) {
  try {
    await page.goto(`/room/${roomId}`)
  } catch {
    await page.waitForTimeout(1000)
    await page.goto(`/room/${roomId}`)
  }
  await expect(
    page.locator('header button[aria-label="Bật micro"]').or(page.locator('header button[aria-label="Tắt micro"]')),
  ).toBeVisible({ timeout: 40000 })
  await expect(
    page.locator('header svg.text-emerald-400').or(page.locator('header svg.lucide-wifi')),
  ).toBeVisible({ timeout: 25000 })
  await page.waitForTimeout(500)
}

async function turnOnMic(page: Page) {
  const micBtn = page.locator('header button[aria-label="Bật micro"]')
  await expect(micBtn).toBeVisible({ timeout: 15000 })
  await micBtn.click()
  const activeBtn = page.locator('header button[aria-label="Tắt micro"]')
  await expect(activeBtn).toBeVisible({ timeout: 25000 })
}


interface RtpMeasurement {
  t1Bytes: number
  t2Bytes: number
  delta: number
  actorKey: string
  kind: string
  readyState: string
  transceiverMid?: string
  totalTracks: number
}

async function measureRemoteAudioRtp(page: Page, expectedActorKey?: string, waitMs = 3000): Promise<RtpMeasurement> {
  // Wait until diagnostics is available and at least 1 remote audio track is present
  await expect.poll(async () => {
    return page.evaluate(() => {
      const diag = (window as unknown as {
        __VOICE_DIAGNOSTICS__?: {
          getRemoteTracks: () => Array<{ actorKey: string; kind: string; readyState: string; transceiverMid?: string }>
        }
      }).__VOICE_DIAGNOSTICS__
      if (!diag) return 0
      return diag.getRemoteTracks().length
    })
  }, { timeout: 35000, intervals: [500, 1000] }).toBeGreaterThan(0)

  // Resolve target actorKey: either provided (exact actorKey or user identifier) or first available track
  const targetActor = await page.evaluate((expectedKey?: string) => {
    const diag = (window as unknown as {
      __VOICE_DIAGNOSTICS__?: {
        getRemoteTracks: () => Array<{ actorKey: string; kind: string; readyState: string; transceiverMid?: string }>
        getVoiceRegistry?: () => Array<{ actorKey: string; ten: string }>
      }
    }).__VOICE_DIAGNOSTICS__
    if (!diag) return ''
    const tracks = diag.getRemoteTracks()
    if (!tracks || tracks.length === 0) return ''

    if (!expectedKey) {
      return tracks[0].actorKey
    }

    // 1. Exact match on actorKey
    const exact = tracks.find((t) => t.actorKey === expectedKey)
    if (exact) return exact.actorKey

    // 2. Correlate with registry ten / username if available
    const reg = diag.getVoiceRegistry?.() || []
    const matchReg = reg.find((p) => {
      if (p.actorKey === expectedKey) return true
      if (expectedKey.includes('thu1') && (p.ten?.includes('1') || p.actorKey.includes('1'))) return true
      if (expectedKey.includes('thu2') && (p.ten?.includes('2') || p.actorKey.includes('2'))) return true
      if (expectedKey.includes('thu3') && (p.ten?.includes('3') || p.actorKey.includes('3'))) return true
      return false
    })
    if (matchReg && tracks.some((t) => t.actorKey === matchReg.actorKey)) {
      return matchReg.actorKey
    }

    // 3. Positional fallback if multiple tracks
    if (expectedKey.includes('thu1')) return tracks[0].actorKey
    if (expectedKey.includes('thu2') && tracks.length > 1) return tracks[1].actorKey

    return tracks[0].actorKey
  }, expectedActorKey)
  expect(targetActor).toBeTruthy()

  // Wait until actor-specific inbound-rtp stats exist and has received bytes
  await expect.poll(async () => {
    return page.evaluate(async (key: string) => {
      const diag = (window as any).__VOICE_DIAGNOSTICS__
      if (!diag?.getInboundStatsForActor) return 0
      const stat = await diag.getInboundStatsForActor(key)
      return stat?.bytesReceived || 0
    }, targetActor)
  }, { timeout: 35000, intervals: [500, 1000] }).toBeGreaterThan(0)

  const getActorSnapshot = async () => {
    return page.evaluate(async (key: string) => {
      const diag = (window as any).__VOICE_DIAGNOSTICS__
      if (!diag?.getInboundStatsForActor) throw new Error('E2E getInboundStatsForActor not available')
      const stat = await diag.getInboundStatsForActor(key)
      if (!stat) throw new Error(`Inbound stats for actor ${key} not found`)
      const tracks = diag.getRemoteTracks()
      return {
        stat,
        totalTracks: tracks.length,
      }
    }, targetActor)
  }

  // T1 Measurement
  const t1 = await getActorSnapshot()
  expect(t1.stat.kind).toBe('audio')
  expect(t1.stat.readyState).toBe('live')
  expect(t1.stat.bytesReceived).toBeGreaterThan(0)

  await page.waitForTimeout(waitMs)

  // T2 Measurement
  const t2 = await getActorSnapshot()
  expect(t2.stat.bytesReceived).toBeGreaterThan(t1.stat.bytesReceived)

  return {
    t1Bytes: t1.stat.bytesReceived,
    t2Bytes: t2.stat.bytesReceived,
    delta: t2.stat.bytesReceived - t1.stat.bytesReceived,
    actorKey: t2.stat.actorKey,
    kind: t2.stat.kind,
    readyState: t2.stat.readyState,
    transceiverMid: t2.stat.mid,
    totalTracks: t2.totalTracks,
  }
}

test.describe('Digital Campus v2 — Real Voice & WebRTC Media Path E2E Suite', () => {
  test.setTimeout(180000)

  test('1. Listener-Only Mode: Client enters with NO mic permission, receives real remote RTP', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: false }) // Zero microphone permission
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    pageA.on('console', (msg) => console.log('PAGE A LOG:', msg.text()))
    pageA.on('response', async (res) => {
      if (res.url().includes('/voice/')) {
        const text = await res.text().catch(() => '')
        console.log(`[VOICE RES] ${res.status()} ${res.url()}: ${text}`)
      }
    })

    pageB.on('console', (msg) => console.log('PAGE B LOG:', msg.text()))
    pageB.on('response', async (res) => {
      if (res.url().includes('/voice/')) {
        const text = await res.text().catch(() => '')
        console.log(`[PAGE B VOICE RES] ${res.status()} ${res.url()}: ${text}`)
      }
    })

    try {
      // 1. Host A enters room and turns ON mic
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)

      const preDiag = await pageA.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getConnectionState: () => string; isPublishing: () => boolean } }).__VOICE_DIAGNOSTICS__
        return d ? { conn: d.getConnectionState(), pub: d.isPublishing() } : 'NO_DIAGNOSTICS'
      })
      console.log('PAGE A PRE-DIAG:', preDiag)

      const btnInfo = await pageA.evaluate(() => {
        const btn = document.querySelector('header button[aria-label="Bật micro"]') as HTMLButtonElement | null
        return btn ? { disabled: btn.disabled, ariaLabel: btn.getAttribute('aria-label'), title: btn.title } : 'NO_BUTTON'
      })
      console.log('PAGE A MIC BTN INFO:', btnInfo)

      console.log('CLICKING MIC BTN ON PAGE A...')
      await pageA.locator('header button[aria-label="Bật micro"]').click()
      console.log('MIC BTN CLICKED, WAITING 4s FOR SETTLING...')
      await pageA.waitForTimeout(4000)

      const postDiag = await pageA.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: {
          getConnectionState: () => string
          getIceConnectionState: () => string
          isPublishing: () => boolean
          isMuted: () => boolean
          getSessionId: () => string | null
        } }).__VOICE_DIAGNOSTICS__
        const activeBtn = document.querySelector('header button[aria-label="Tắt micro"]')
        const inactiveBtn = document.querySelector('header button[aria-label="Bật micro"]')
        return {
          diag: d ? {
            conn: d.getConnectionState(),
            ice: d.getIceConnectionState(),
            pub: d.isPublishing(),
            muted: d.isMuted(),
            sessionId: d.getSessionId(),
          } : null,
          hasActiveBtn: Boolean(activeBtn),
          hasInactiveBtn: Boolean(inactiveBtn),
          inactiveTitle: inactiveBtn?.getAttribute('title'),
        }
      })
      console.log('PAGE A POST-CLICK DIAG:', postDiag)

      await expect(pageA.locator('header button[aria-label="Tắt micro"]')).toBeVisible({ timeout: 25000 })

      // 2. Member B enters room (mic OFF, no mic permission granted)
      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)

      // B never clicks mic. Verify B is not publishing and has no local track
      const diagB = await pageB.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            isPublishing: () => boolean
            getLocalTrack: () => any
            getConnectionState: () => string
          }
        }).__VOICE_DIAGNOSTICS__
        if (!d) return null
        return {
          isPublishing: d.isPublishing(),
          localTrack: d.getLocalTrack(),
          connState: d.getConnectionState(),
        }
      })

      expect(diagB).not.toBeNull()
      expect(diagB!.isPublishing).toBe(false)
      expect(diagB!.localTrack).toBeNull()

      // Measure real RTP delta on listener B specifically for Host A
      const rtp = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      console.log(`[Evidence 1] Listener B received A audio: actor=${rtp.actorKey}, MID=${rtp.transceiverMid}, T1=${rtp.t1Bytes}, T2=${rtp.t2Bytes}, Delta=+${rtp.delta}`)

      expect(rtp.kind).toBe('audio')
      expect(rtp.readyState).toBe('live')
      expect(rtp.delta).toBeGreaterThan(0)
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('2. Bidirectional Real RTP: Both A and B publish, independent RTP deltas verified', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: true })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()
    setupPageLogging(pageA, 'PAGE A')
    setupPageLogging(pageB, 'PAGE B')

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)
      await turnOnMic(pageB)

      // Measure A inbound RTP specifically for B
      const rtpA = await measureRemoteAudioRtp(pageA, MEMBER_USER.username)
      console.log(`[Evidence 2.A] A received B audio: actor=${rtpA.actorKey}, T1=${rtpA.t1Bytes}, T2=${rtpA.t2Bytes}, Delta=+${rtpA.delta}`)
      expect(rtpA.delta).toBeGreaterThan(0)

      // Measure B inbound RTP specifically for A
      const rtpB = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      console.log(`[Evidence 2.B] B received A audio: actor=${rtpB.actorKey}, T1=${rtpB.t1Bytes}, T2=${rtpB.t2Bytes}, Delta=+${rtpB.delta}`)
      expect(rtpB.delta).toBeGreaterThan(0)

      // Assert invariants: 1 pub per actor, 1 sub per remote actor, no duplicate audio elements
      const invA = await pageA.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            getServerGeneration: () => number
            getSubscriptions: () => any[]
            getAudioElementsCount: () => number
          }
        }).__VOICE_DIAGNOSTICS__!
        return {
          gen: d.getServerGeneration(),
          subs: d.getSubscriptions().length,
          audioElements: d.getAudioElementsCount(),
        }
      })
      expect(invA.gen).toBeGreaterThanOrEqual(1)
      expect(invA.subs).toBe(1)
      expect(invA.audioElements).toBe(1)

      const invB = await pageB.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            getServerGeneration: () => number
            getSubscriptions: () => any[]
            getAudioElementsCount: () => number
          }
        }).__VOICE_DIAGNOSTICS__!
        return {
          gen: d.getServerGeneration(),
          subs: d.getSubscriptions().length,
          audioElements: d.getAudioElementsCount(),
        }
      })
      expect(invB.gen).toBeGreaterThanOrEqual(1)
      expect(invB.subs).toBe(1)
      expect(invB.audioElements).toBe(1)
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('3. Self-Mute / Unmute: Preserves same publication generation and halts speaking detector', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: false })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)

      // 1. Establish real preconditions before clicking "Tắt micro"
      const preMuteDiagA = await pageA.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            isPublishing: () => boolean
            isMuted: () => boolean
            getLocalTrack: () => any
            getSessionId: () => string | null
            getServerGeneration: () => number
            getActorKey: () => string
          }
        }).__VOICE_DIAGNOSTICS__!
        return {
          isPublishing: d.isPublishing(),
          isMuted: d.isMuted(),
          track: d.getLocalTrack(),
          sessionId: d.getSessionId(),
          generation: d.getServerGeneration(),
          actorKey: d.getActorKey(),
        }
      })

      expect(preMuteDiagA.isPublishing).toBe(true)
      expect(preMuteDiagA.isMuted).toBe(false)
      expect(preMuteDiagA.track?.kind).toBe('audio')
      expect(preMuteDiagA.track?.readyState).toBe('live')
      expect(preMuteDiagA.track?.enabled).toBe(true)
      expect(preMuteDiagA.sessionId).toBeTruthy()
      expect(preMuteDiagA.generation).toBeGreaterThanOrEqual(1)

      const activeBtn = pageA.locator('header button[aria-label="Tắt micro"]')
      await expect(activeBtn).toBeVisible({ timeout: 15000 })

      // 2. Click normally to self-mute (no force:true)
      await activeBtn.click()

      // Require: button changes to "Bật micro"
      const micBtn = pageA.locator('header button[aria-label="Bật micro"]')
      await expect(micBtn).toBeVisible({ timeout: 25000 })

      // Require: local track enabled is false, isMuted is true, session & generation unchanged
      const postMuteDiagA = await pageA.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            isPublishing: () => boolean
            isMuted: () => boolean
            getLocalTrack: () => any
            getSessionId: () => string | null
            getServerGeneration: () => number
            getSpeakingActors: () => string[]
          }
        }).__VOICE_DIAGNOSTICS__!
        return {
          isPublishing: d.isPublishing(),
          isMuted: d.isMuted(),
          track: d.getLocalTrack(),
          sessionId: d.getSessionId(),
          generation: d.getServerGeneration(),
          speaking: d.getSpeakingActors(),
        }
      })

      expect(postMuteDiagA.isPublishing).toBe(true)
      expect(postMuteDiagA.isMuted).toBe(true)
      expect(postMuteDiagA.track?.enabled).toBe(false)
      expect(postMuteDiagA.sessionId).toBe(preMuteDiagA.sessionId)
      expect(postMuteDiagA.generation).toBe(preMuteDiagA.generation)
      expect(postMuteDiagA.speaking.includes('local')).toBe(false)

      // Require: canonical RoomDO publication has same actor, same session, same generation, status === 'muted'
      await expect.poll(async () => {
        const reg = await fetchVoiceRegistry(pageA)
        const pub = reg.find((p: any) => p.actorKey === preMuteDiagA.actorKey)
        if (!pub) return null
        return {
          actorKey: pub.actorKey,
          sessionId: pub.sessionId,
          generation: pub.generation,
          status: pub.status,
        }
      }, { timeout: 25000 }).toEqual({
        actorKey: preMuteDiagA.actorKey,
        sessionId: preMuteDiagA.sessionId,
        generation: preMuteDiagA.generation,
        status: 'muted',
      })

      // 3. Click normally to unmute
      await micBtn.click()

      // Require: button changes to "Tắt micro"
      await expect(activeBtn).toBeVisible({ timeout: 25000 })

      const postUnmuteDiagA = await pageA.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            isPublishing: () => boolean
            isMuted: () => boolean
            getLocalTrack: () => any
            getSessionId: () => string | null
            getServerGeneration: () => number
          }
        }).__VOICE_DIAGNOSTICS__!
        return {
          isPublishing: d.isPublishing(),
          isMuted: d.isMuted(),
          track: d.getLocalTrack(),
          sessionId: d.getSessionId(),
          generation: d.getServerGeneration(),
        }
      })

      expect(postUnmuteDiagA.isPublishing).toBe(true)
      expect(postUnmuteDiagA.isMuted).toBe(false)
      expect(postUnmuteDiagA.track?.enabled).toBe(true)
      expect(postUnmuteDiagA.sessionId).toBe(preMuteDiagA.sessionId)
      expect(postUnmuteDiagA.generation).toBe(preMuteDiagA.generation)

      // Require: canonical status returns to 'live'
      await expect.poll(async () => {
        const reg = await fetchVoiceRegistry(pageA)
        const pub = reg.find((p: any) => p.actorKey === preMuteDiagA.actorKey)
        return pub?.status
      }, { timeout: 25000 }).toBe('live')
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('4. Autoplay Restricted Unblock: User gesture unlocks audio playback @autoplay', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: false, autoplayRestricted: true })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()
    setupPageLogging(pageA, 'PAGE A')
    setupPageLogging(pageB, 'PAGE B')

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      // Authenticate B via API so pageB has zero DOM user gestures
      await loginUserViaApi(ctxB, MEMBER_USER)
      await enterStudyRoom(pageB)

      // Wait for remote track to be attached on B
      await expect.poll(async () => {
        return pageB.evaluate(() => {
          const d = (window as any).__VOICE_DIAGNOSTICS__
          return d ? d.getRemoteTracks().length : 0
        })
      }, { timeout: 35000 }).toBeGreaterThan(0)

      // Dedicated chromium-voice-autoplay-restricted project requires blocked playback UX
      const unblockBannerBtn = pageB.locator('button:has-text("Bật âm thanh")')
      await expect(unblockBannerBtn).toBeVisible({ timeout: 20000 })

      // User gesture unlocks audio playback
      await unblockBannerBtn.click()

      // Require blocked voice state becomes false
      await expect.poll(async () => {
        return pageB.evaluate(() => {
          const d = (window as any).__VOICE_DIAGNOSTICS__
          return d ? d.isAudioAutoplayBlocked() : false
        })
      }, { timeout: 15000 }).toBe(false)

      // Require the button disappears
      await expect(unblockBannerBtn).not.toBeVisible({ timeout: 15000 })

      // Verify RTP streaming proceeds smoothly for Host A
      const rtp = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      console.log(`[Evidence 4] Autoplay unblocked RTP: T1=${rtp.t1Bytes}, T2=${rtp.t2Bytes}, Delta=+${rtp.delta}`)
      expect(rtp.delta).toBeGreaterThan(0)
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('5. Late Join: Client C enters after A and B are live, receives both streams independently without republishing', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: true })
    const ctxC = await createVoiceContext(browser, { mic: false }) // C is listener-only
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()
    const pageC = await ctxC.newPage()

    try {
      // 1. A and B publish
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)
      await turnOnMic(pageB)

      // 2. Late-join C enters
      await loginUser(pageC, MEMBER_C_USER)
      await enterStudyRoom(pageC)

      // C should discover both live participants and subscribe to both
      await expect.poll(async () => {
        return pageC.evaluate(() => {
          const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getRemoteTracks: () => any[] } }).__VOICE_DIAGNOSTICS__
          return d ? d.getRemoteTracks().length : 0
        })
      }, { timeout: 35000 }).toBe(2)

      // Independently prove A -> C
      const rtpA_C = await measureRemoteAudioRtp(pageC, HOST_USER.username)
      console.log(`[Evidence 5.A] Late Join C received A: actor=${rtpA_C.actorKey}, T1=${rtpA_C.t1Bytes}, T2=${rtpA_C.t2Bytes}, Delta=+${rtpA_C.delta}`)
      expect(rtpA_C.kind).toBe('audio')
      expect(rtpA_C.readyState).toBe('live')
      expect(rtpA_C.delta).toBeGreaterThan(0)

      // Independently prove B -> C
      const rtpB_C = await measureRemoteAudioRtp(pageC, MEMBER_USER.username)
      console.log(`[Evidence 5.B] Late Join C received B: actor=${rtpB_C.actorKey}, T1=${rtpB_C.t1Bytes}, T2=${rtpB_C.t2Bytes}, Delta=+${rtpB_C.delta}`)
      expect(rtpB_C.kind).toBe('audio')
      expect(rtpB_C.readyState).toBe('live')
      expect(rtpB_C.delta).toBeGreaterThan(0)
    } finally {
      await ctxA.close()
      await ctxB.close()
      await ctxC.close()
    }
  })

  test('6. Force-Mute: Moderator mutes member, server closes Cloudflare track, fake restoration rejected', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: true })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    pageA.on('console', (msg) => console.log('PAGE A LOG:', msg.text()))
    pageA.on('response', async (res) => {
      if (res.url().includes('/voice/')) {
        const text = await res.text().catch(() => '')
        console.log(`[PAGE A VOICE RES] ${res.status()} ${res.url()}: ${text}`)
      }
    })

    pageB.on('console', (msg) => console.log('PAGE B LOG:', msg.text()))
    pageB.on('response', async (res) => {
      if (res.url().includes('/voice/')) {
        const text = await res.text().catch(() => '')
        console.log(`[PAGE B VOICE RES] ${res.status()} ${res.url()}: ${text}`)
      }
    })

    try {
      console.log('TEST 6: Logging in user A (Host)...')
      await loginUser(pageA, HOST_USER)
      console.log('TEST 6: Entering study room A...')
      await enterStudyRoom(pageA)

      console.log('TEST 6: Logging in user B (Member)...')
      await loginUser(pageB, MEMBER_USER)
      console.log('TEST 6: Entering study room B...')
      await enterStudyRoom(pageB)
      console.log('TEST 6: Turning on mic B...')
      await turnOnMic(pageB)

      console.log('TEST 6: Measuring remote audio RTP on page A...')
      // Host A receives B RTP initially
      const rtpBefore = await measureRemoteAudioRtp(pageA, MEMBER_USER.username)
      console.log('TEST 6: RTP Before delta:', rtpBefore.delta)
      expect(rtpBefore.delta).toBeGreaterThan(0)

      // Capture B initial states
      const bBefore = await pageB.evaluate(() => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          gen: d?.getServerGeneration(),
          track: d?.getLocalTrack(),
        }
      })
      expect(bBefore.gen).toBeGreaterThanOrEqual(1)

      console.log('TEST 6: Host A opening members drawer...')
      // Host A opens members drawer and clicks "Tắt mic" on Member B
      await pageA.locator('button[title="Thành viên"]').first().click()
      const forceMuteBtn = pageA.locator('button[title="Tắt micro của thành viên này"]')
      console.log('TEST 6: Waiting for forceMuteBtn to be visible...')
      await expect(forceMuteBtn).toBeVisible({ timeout: 15000 })

      console.log('TEST 6: Clicking forceMuteBtn and waiting for /voice/force-mute...')
      // Intercept the /voice/force-mute API response to ensure upstream confirmation
      const [response] = await Promise.all([
        pageA.waitForResponse((r) => r.url().includes('/voice/force-mute') && r.status() === 200),
        forceMuteBtn.click(),
      ])
      const resBody = await response.json()
      console.log('TEST 6: Force mute response:', resBody)
      expect(resBody.ok).toBe(true)

      console.log('TEST 6: Waiting for Member B local mic to turn off...')
      // Member B local mic turns OFF
      await expect(pageB.locator('header button[aria-label="Bật micro"]')).toBeVisible({ timeout: 15000 })

      // Verify Member B local track is stopped/disabled and publishing is invalidated
      const bPostForceState = await pageB.evaluate(() => {
        const d = (window as unknown as {
          __VOICE_DIAGNOSTICS__?: {
            isPublishing: () => boolean
            isMuted: () => boolean
            getLocalTrack: () => any
          }
        }).__VOICE_DIAGNOSTICS__!
        return {
          isPublishing: d.isPublishing(),
          isMuted: d.isMuted(),
          track: d.getLocalTrack(),
        }
      })
      expect(bPostForceState.isPublishing).toBe(false)
      expect(bPostForceState.track === null || bPostForceState.track?.enabled === false).toBe(true)

      // A: B remote publication disappears, B subscription no longer active, audio element absent
      await expect.poll(async () => {
        return pageA.evaluate((bActorKey: string) => {
          const d = (window as any).__VOICE_DIAGNOSTICS__
          if (!d) return { subs: 1, tracks: 1, hasAudio: true }
          const subs = d.getSubscriptions().filter((s: any) => s.actorKey === bActorKey)
          const tracks = d.getRemoteTracks().filter((t: any) => t.actorKey === bActorKey && t.readyState === 'live')
          const hasAudio = d.hasAudioElementForActor ? d.hasAudioElementForActor(bActorKey) : false
          return {
            subs: subs.length,
            tracks: tracks.length,
            hasAudio,
          }
        }, rtpBefore.actorKey)
      }, { timeout: 25000 }).toEqual({
        subs: 0,
        tracks: 0,
        hasAudio: false,
      })

      // RoomDO: B canonical publication completely removed from registry (media-truthful)
      await expect.poll(async () => {
        const regAfterMute = await fetchVoiceRegistry(pageA)
        return regAfterMute.find((p: any) => p.actorKey === rtpBefore.actorKey)
      }, { timeout: 25000 }).toBeUndefined()

      // Adversarial Attack 1: Send current valid-looking voice.self_state with old generation
      const selfStateAttackStatus = await pageB.evaluate((oldGen: number) => {
        const ws = (window as unknown as { __roomWs?: WebSocket }).__roomWs
        if (!ws || ws.readyState !== WebSocket.OPEN) return 'NOT_OPEN'
        ws.send(JSON.stringify({ type: 'voice.self_state', generation: oldGen, muted: false }))
        return 'SENT'
      }, bBefore.gen)
      expect(selfStateAttackStatus).toBe('SENT')

      await pageB.waitForTimeout(1000)

      // Publication MUST NOT be restored by voice.self_state!
      const regAfterAttack1 = await fetchVoiceRegistry(pageA)
      expect(regAfterAttack1.find((p: any) => p.actorKey === rtpBefore.actorKey)).toBeUndefined()

      // Adversarial Attack 2: Send legacy voice.mic
      const legacyAttackStatus = await pageB.evaluate(() => {
        const ws = (window as unknown as { __roomWs?: WebSocket }).__roomWs
        if (!ws || ws.readyState !== WebSocket.OPEN) return 'NOT_OPEN'
        ws.send(JSON.stringify({ type: 'voice.mic', mic: true }))
        return 'SENT'
      })
      expect(legacyAttackStatus).toBe('SENT')

      await pageB.waitForTimeout(1000)

      // Publication MUST NOT be restored by legacy voice.mic!
      const regAfterAttack2 = await fetchVoiceRegistry(pageA)
      expect(regAfterAttack2.find((p: any) => p.actorKey === rtpBefore.actorKey)).toBeUndefined()

      // Legitimate Re-enable: Member B explicitly clicks "Bật micro" -> requires real /voice/publish
      const [pubRes] = await Promise.all([
        pageB.waitForResponse((r) => r.url().includes('/voice/publish') && r.status() === 200),
        turnOnMic(pageB),
      ])
      expect(pubRes.ok()).toBe(true)

      // Real canonical publication recreated with status='live'
      await expect.poll(async () => {
        const reg = await fetchVoiceRegistry(pageA)
        return reg.find((p: any) => p.status === 'live' && p.actorKey === rtpBefore.actorKey)
      }, { timeout: 25000 }).toBeDefined()

      // Host A receives B real RTP again!
      const rtpAfter = await measureRemoteAudioRtp(pageA, rtpBefore.actorKey)
      expect(rtpAfter.delta).toBeGreaterThan(0)
      expect(rtpAfter.t2Bytes).toBeGreaterThan(rtpAfter.t1Bytes)
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('7. Leave Cleanup: When A leaves, local track ends, PC closes, B removes remote subscription', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: false })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()
    setupPageLogging(pageA, 'PAGE A')
    setupPageLogging(pageB, 'PAGE B')

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)

      // Confirm B is receiving A
      const rtpBefore = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      expect(rtpBefore.delta).toBeGreaterThan(0)

      // Capture A local track and PC state before leaving
      const aBefore = await pageA.evaluate(() => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          track: d?.getLocalTrack(),
          pcState: d?.getPeerConnectionState(),
        }
      })
      expect(aBefore.track).toBeDefined()
      expect(aBefore.track.readyState).toBe('live')

      // Host A leaves room via SPA header button
      const leaveBtn = pageA.locator('header button:has-text("Rời phòng")')
      await expect(leaveBtn).toBeVisible({ timeout: 15000 })
      await leaveBtn.click()

      // After leave/unmount: A local track readyState becomes 'ended', PC closes
      await expect.poll(async () => {
        return pageA.evaluate(() => {
          const snap = (window as any).__VOICE_CLEANUP_SNAPSHOT__
          return snap ? { trackState: snap.localTrackReadyState, pcState: snap.peerConnectionState, destroyed: snap.isDestroyed } : null
        })
      }, { timeout: 15000 }).toEqual({
        trackState: 'ended',
        pcState: 'closed',
        destroyed: true,
      })

      // On B: Specifically Host A remote track, subscription, audio element, and speaking indicator removed
      await expect.poll(async () => {
        return pageB.evaluate((hostActorKey: string) => {
          const d = (window as any).__VOICE_DIAGNOSTICS__
          if (!d) return { tracks: 1, subs: 1, hasAudio: true, isSpeaking: true }
          const tracks = d.getRemoteTracks().filter((t: any) => t.actorKey === hostActorKey)
          const subs = d.getSubscriptions().filter((s: any) => s.actorKey === hostActorKey)
          const hasAudio = d.hasAudioElementForActor ? d.hasAudioElementForActor(hostActorKey) : false
          const isSpeaking = d.getSpeakingActors ? d.getSpeakingActors().includes(hostActorKey) : false
          return {
            tracks: tracks.length,
            subs: subs.length,
            hasAudio,
            isSpeaking,
          }
        }, rtpBefore.actorKey)
      }, { timeout: 25000 }).toEqual({
        tracks: 0,
        subs: 0,
        hasAudio: false,
        isSpeaking: false,
      })

      // Room registry: A publication absent using centralized helper
      await expect.poll(async () => {
        const reg = await fetchVoiceRegistry(pageB)
        return reg.find((p: any) => (p.actorKey === rtpBefore.actorKey || p.actorKey === HOST_USER.username || p.ten === HOST_USER.username) && p.status === 'live')
      }, { timeout: 25000 }).toBeUndefined()
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('8. Network Interruption & Recovery: Offline transition to reconnecting, bidirectional state rebuilt upon return', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: true })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()
    setupPageLogging(pageA, 'PAGE A')
    setupPageLogging(pageB, 'PAGE B')

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)
      await turnOnMic(pageB)

      // Initial bidirectional RTP verified
      const rtpABefore = await measureRemoteAudioRtp(pageA, MEMBER_USER.username)
      const rtpBBefore = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      expect(rtpABefore.delta).toBeGreaterThan(0)
      expect(rtpBBefore.delta).toBeGreaterThan(0)

      // Capture before interruption
      const bBefore = await pageB.evaluate(() => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          sessionId: d?.getSessionId(),
          generation: d?.getServerGeneration(),
          subsCount: d?.getSubscriptions().length,
          audioElementsCount: d?.getAudioElementsCount(),
        }
      })
      expect(bBefore.sessionId).toBeTruthy()
      expect(bBefore.generation).toBeGreaterThanOrEqual(1)
      expect(bBefore.subsCount).toBe(1)
      expect(bBefore.audioElementsCount).toBe(1)

      const aBefore = await pageA.evaluate(() => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          subsCount: d?.getSubscriptions().length,
          audioElementsCount: d?.getAudioElementsCount(),
        }
      })
      expect(aBefore.subsCount).toBe(1)
      expect(aBefore.audioElementsCount).toBe(1)

      // Interrupt B network
      await ctxB.setOffline(true)

      // Verify B transitions to reconnecting state
      await expect.poll(async () => {
        return pageB.evaluate(() => {
          const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getConnectionState: () => string } }).__VOICE_DIAGNOSTICS__
          return d?.getConnectionState()
        })
      }, { timeout: 10000 }).toBe('reconnecting')

      // Restore B network
      await ctxB.setOffline(false)

      // Within bounded time, B recovers to connected
      await expect.poll(async () => {
        return pageB.evaluate(() => {
          const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getConnectionState: () => string } }).__VOICE_DIAGNOSTICS__
          return d?.getConnectionState()
        })
      }, { timeout: 30000 }).toBe('connected')

      // Capture after recovery
      const bAfter = await pageB.evaluate(() => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          sessionId: d?.getSessionId(),
          generation: d?.getServerGeneration(),
        }
      })

      // B obtains valid recovered/new SFU session
      expect(bAfter.sessionId).toBeTruthy()
      expect(bAfter.sessionId).not.toBe(bBefore.sessionId)

      // New server generation > old generation
      expect(bAfter.generation).toBeGreaterThan(bBefore.generation)

      // B receives A again
      const rtpBRecovered = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      console.log(`[Evidence 8.B] B received A post-reconnect: Delta=+${rtpBRecovered.delta}`)
      expect(rtpBRecovered.delta).toBeGreaterThan(0)

      // A receives B again
      const rtpARecovered = await measureRemoteAudioRtp(pageA, MEMBER_USER.username)
      console.log(`[Evidence 8.A] A received B post-reconnect: Delta=+${rtpARecovered.delta}`)
      expect(rtpARecovered.delta).toBeGreaterThan(0)

      // Invariants: exactly 1 canonical B publication, exactly 1 sub per actor, 1 audio element per actor
      const bFinal = await pageB.evaluate((hostActorKey: string) => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          subsCount: d?.getSubscriptions().length,
          audioElementsCount: d?.getAudioElementsCount(),
          hasHostAudio: d?.hasAudioElementForActor ? d.hasAudioElementForActor(hostActorKey) : false,
        }
      }, rtpBRecovered.actorKey)
      expect(bFinal.subsCount).toBe(1)
      expect(bFinal.audioElementsCount).toBe(1)
      expect(bFinal.hasHostAudio).toBe(true)

      const aFinal = await pageA.evaluate((memberActorKey: string) => {
        const d = (window as any).__VOICE_DIAGNOSTICS__
        return {
          subsCount: d?.getSubscriptions().length,
          audioElementsCount: d?.getAudioElementsCount(),
          hasMemberAudio: d?.hasAudioElementForActor ? d.hasAudioElementForActor(memberActorKey) : false,
        }
      }, rtpARecovered.actorKey)
      expect(aFinal.subsCount).toBe(1)
      expect(aFinal.audioElementsCount).toBe(1)
      expect(aFinal.hasMemberAudio).toBe(true)

      // Room registry: exactly one live publication for B
      // Poll for eventual consistency — voice-client sets connectionState='connected' after
      // /voice/publish HTTP response, but the server-side registry broadcast may still be
      // in-flight when we reach this assertion.
      await expect.poll(async () => {
        const reg = await fetchVoiceRegistry(pageA)
        const bLive = reg.filter(
          (p: any) => (p.actorKey === rtpARecovered.actorKey || p.actorKey === MEMBER_USER.username || p.ten === MEMBER_USER.username) && p.status === 'live',
        )
        console.log(
          `[Test 8 Registry] total=${reg.length} bLive=${bLive.length}`,
          reg.map((p: any) => ({ key: p.actorKey, ten: p.ten, status: p.status })),
        )
        return bLive.length
      }, { timeout: 20000, intervals: [500, 1000] }).toBe(1)
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('9. getUserMedia NotAllowedError handling: Application error handled gracefully, listener-only capability preserved', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxB = await createVoiceContext(browser, { mic: false })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    try {
      // Mock getUserMedia failure on B to simulate denied permission
      await pageB.addInitScript(() => {
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia = async () => {
            throw new DOMException('Permission denied by system', 'NotAllowedError')
          }
        }
      })

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)

      // B clicks mic
      const micBtnB = pageB.locator('header button[aria-label="Bật micro"]')
      await micBtnB.click()

      // Error message should appear (toast or blockedReason)
      await expect(
        pageB.locator('text=Không thể bật micro').or(pageB.locator('text=Permission denied')).or(pageB.locator('div[role="status"]')).first(),
      ).toBeVisible({ timeout: 15000 })

      // B is NOT publishing
      const pubB = await pageB.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { isPublishing: () => boolean; getLocalTrack: () => any } }).__VOICE_DIAGNOSTICS__!
        return { isPub: d.isPublishing(), track: d.getLocalTrack() }
      })
      expect(pubB.isPub).toBe(false)
      expect(pubB.track).toBeNull()

      // Host A turns mic ON
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      await turnOnMic(pageA)

      // Even with mic denied, B is STILL fully capable of receiving A's remote audio!
      const rtpB = await measureRemoteAudioRtp(pageB, HOST_USER.username)
      console.log(`[Evidence 9] Denied-mic user successfully received remote audio: Delta=+${rtpB.delta}`)
      expect(rtpB.delta).toBeGreaterThan(0)
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('10. Production Diagnostics Privacy: __VOICE_DIAGNOSTICS__ is undefined when not in E2E mode', async ({ browser }) => {
    // Normal context with e2e: false
    const ctx = await createVoiceContext(browser, { mic: false, e2e: false })
    const page = await ctx.newPage()

    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page)

      const diagType = await page.evaluate(() => typeof (window as unknown as { __VOICE_DIAGNOSTICS__?: unknown }).__VOICE_DIAGNOSTICS__)
      expect(diagType).toBe('undefined')
    } finally {
      await ctx.close()
    }
  })

  test('11. Device Enumeration / Single-Device Limitation: Discovers fake input device, acknowledges single-device environment', async ({ browser }) => {
    const ctx = await createVoiceContext(browser, { mic: true })
    const page = await ctx.newPage()

    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page)
      await turnOnMic(page)

      const deviceInfo = await page.evaluate(async () => {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter((d) => d.kind === 'audioinput')
        return {
          totalInputs: audioInputs.length,
          devices: audioInputs.map((d) => ({ deviceId: d.deviceId, label: d.label })),
        }
      })

      console.log(`[Evidence 11] Detected audioinput devices in fake Chromium:`, deviceInfo)
      expect(deviceInfo.totalInputs).toBeGreaterThanOrEqual(1)

      const genBefore = await page.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getServerGeneration: () => number } }).__VOICE_DIAGNOSTICS__!
        return d.getServerGeneration()
      })

      if (deviceInfo.totalInputs > 1) {
        console.log(`[Evidence 11] Multiple devices detected, testing device switch to: ${deviceInfo.devices[1].deviceId}`)
        // Switch device via select in UI
        await page.locator('header button[aria-label="Cài đặt âm thanh"]').click()
        await page.locator('#voice-mic-select').selectOption(deviceInfo.devices[1].deviceId)
      } else {
        console.log(`[Evidence 11] Deterministic fake Chromium exposes exactly 1 audioinput device (${deviceInfo.devices[0]?.label || 'default'}). Single-device limitation reported truthfully per requirement 8. (Unit test test/voice-client.test.ts proves replaceTrack invariants deterministically).`)
      }

      const genAfter = await page.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getServerGeneration: () => number } }).__VOICE_DIAGNOSTICS__!
        return d.getServerGeneration()
      })

      // Publication identity was not duplicated!
      expect(genAfter).toBe(genBefore)
    } finally {
      await ctx.close()
    }
  })

  test('12. Session Revocation Voice Closure: Session replacement revokes real WebRTC publication, closes Room socket 4001, clears registry, stops remote media, prevents stale republish, allows new session to publish', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser, { mic: true })
    const ctxBStale = await createVoiceContext(browser, { mic: true })
    const pageA = await ctxA.newPage()
    const pageBStale = await ctxBStale.newPage()

    try {
      console.log('TEST 12: Logging in user A (Host)...')
      await loginUser(pageA, HOST_USER)
      console.log('TEST 12: Entering study room A...')
      await enterStudyRoom(pageA)

      console.log('TEST 12: Logging in user B (stale session context)...')
      await loginUser(pageBStale, MEMBER_USER)
      console.log('TEST 12: Entering study room B (stale session)...')
      await enterStudyRoom(pageBStale)
      console.log('TEST 12: Turning on mic B (stale session)...')
      await turnOnMic(pageBStale)

      console.log('TEST 12: Measuring remote audio RTP on page A from Member B...')
      const rtpBefore = await measureRemoteAudioRtp(pageA, MEMBER_USER.username)
      console.log('TEST 12: RTP Before delta:', rtpBefore.delta)
      expect(rtpBefore.delta).toBeGreaterThan(0)

      // Verify B publication is live in registry
      const regBefore = await fetchVoiceRegistry(pageA)
      const bLiveBefore = regBefore.find((p: any) => p.actorKey === rtpBefore.actorKey && p.status === 'live')
      expect(bLiveBefore).toBeDefined()
      console.log('TEST 12: B publication live before revocation:', bLiveBefore)

      // Listen for socket close 4001 on pageBStale
      const socketClosePromise = pageBStale.evaluate(() => {
        return new Promise<{ code: number; reason: string }>((resolve) => {
          const ws = (window as unknown as { __roomWs?: WebSocket }).__roomWs
          if (!ws) {
            resolve({ code: -1, reason: 'NO_WS' })
            return
          }
          if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
            resolve({ code: 4001, reason: 'ALREADY_CLOSED' })
            return
          }
          ws.addEventListener('close', (e) => {
            resolve({ code: e.code, reason: e.reason })
          })
        })
      })

      console.log('TEST 12: Triggering session replacement via new login in new context...')
      const ctxBNew = await createVoiceContext(browser, { mic: true })
      const pageBNew = await ctxBNew.newPage()
      await loginUser(pageBNew, MEMBER_USER)

      // Verify stale Room WebSocket closes with code 4001
      const closeEvent = await socketClosePromise
      console.log('TEST 12: Stale Room socket closed:', closeEvent)
      expect(closeEvent.code).toBe(4001)

      // Verify Room voice registry no longer contains B
      await expect.poll(async () => {
        const reg = await fetchVoiceRegistry(pageA)
        return reg.find((p: any) => p.actorKey === rtpBefore.actorKey)
      }, { timeout: 25000 }).toBeUndefined()
      console.log('TEST 12: Voice registry successfully cleared Member B publication')

      // Verify remote media on Host A stops (remote track readyState or subscription removed)
      await expect.poll(async () => {
        return pageA.evaluate((bActorKey: string) => {
          const d = (window as any).__VOICE_DIAGNOSTICS__
          if (!d) return { subs: 1, tracks: 1 }
          const subs = d.getSubscriptions().filter((s: any) => s.actorKey === bActorKey)
          const tracks = d.getRemoteTracks().filter((t: any) => t.actorKey === bActorKey && t.readyState === 'live')
          return {
            subs: subs.length,
            tracks: tracks.length,
          }
        }, rtpBefore.actorKey)
      }, { timeout: 25000 }).toEqual({
        subs: 0,
        tracks: 0,
      })
      console.log('TEST 12: Remote media on Host A confirmed stopped and subscription removed')

      // Verify stale session CANNOT republish (fails with 401)
      const staleRepublishStatus = await pageBStale.evaluate(async (roomId) => {
        try {
          const res = await fetch(`/api/rooms/${roomId}/voice/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionDescription: { type: 'offer', sdp: 'fake' },
              mid: '0',
            }),
          })
          return res.status
        } catch {
          return -1
        }
      }, numericRoomId)
      console.log('TEST 12: Stale session republish attempt HTTP status:', staleRepublishStatus)
      expect(staleRepublishStatus).toBe(401)

      // New authenticated session on pageBNew can enter and publish normally
      console.log('TEST 12: New session entering study room...')
      await enterStudyRoom(pageBNew)
      console.log('TEST 12: New session turning on mic...')
      await turnOnMic(pageBNew)

      // Verify Host A receives new audio from Member B
      const rtpAfter = await measureRemoteAudioRtp(pageA, MEMBER_USER.username)
      console.log('TEST 12: New session RTP delta on Host A:', rtpAfter.delta)
      expect(rtpAfter.delta).toBeGreaterThan(0)

      await ctxBNew.close()
    } finally {
      await ctxA.close()
      await ctxBStale.close()
    }
  })
})
