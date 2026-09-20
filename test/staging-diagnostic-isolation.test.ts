import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { app } from '../worker/index'

describe('Staging Diagnostic Isolation & Environment Gating Tests', () => {
  it('Production environment: GET staging diagnostic returns strict 404', async () => {
    const prodEnv: Env = {
      ...env,
      ENVIRONMENT: 'production',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan.workers.dev/api/staging/game-session/test-match-1/outbox', {
        method: 'GET',
      }),
      prodEnv,
    )

    expect(res.status).toBe(404)
    const data = (await res.json()) as { ok: boolean; loi?: string }
    expect(data.ok).toBe(false)
  })

  it('Production environment: X-Staging-Diagnostic header has zero authority and returns 404', async () => {
    const prodEnv: Env = {
      ...env,
      ENVIRONMENT: 'production',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan.workers.dev/api/staging/game-session/test-match-1/outbox', {
        method: 'GET',
        headers: {
          'X-Staging-Diagnostic': 'lop-10a7-g0-diagnostic',
        },
      }),
      prodEnv,
    )

    expect(res.status).toBe(404)
  })

  it('Production environment: Spoofed Host header has zero authority and returns 404', async () => {
    const prodEnv: Env = {
      ...env,
      ENVIRONMENT: 'production',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan-v2.ledinhphat1994.workers.dev/api/staging/game-session/test-match-1/outbox', {
        method: 'GET',
        headers: {
          Host: 'gdtxdinhquan-v2.ledinhphat1994.workers.dev',
        },
      }),
      prodEnv,
    )

    expect(res.status).toBe(404)
  })

  it('Production environment: Authenticated request still returns 404', async () => {
    const prodEnv: Env = {
      ...env,
      ENVIRONMENT: 'production',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan.workers.dev/api/staging/game-session/test-match-1/outbox', {
        method: 'GET',
        headers: {
          Cookie: 'c10a7_session=fake-session-token',
        },
      }),
      prodEnv,
    )

    expect(res.status).toBe(404)
  })

  it('Staging environment: GET staging diagnostic returns 200 with outbox status', async () => {
    const stagingEnv: Env = {
      ...env,
      ENVIRONMENT: 'staging',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan-v2.ledinhphat1994.workers.dev/api/staging/game-session/test-match-1/outbox', {
        method: 'GET',
      }),
      stagingEnv,
    )

    expect(res.status).toBe(200)
    const data = (await res.json()) as {
      ok: boolean
      matchId: string
      totalRows: number
      pendingCount: number
      pendingRoundIds: string[]
    }
    expect(data.ok).toBe(true)
    expect(data.matchId).toBe('test-match-1')
    expect(typeof data.totalRows).toBe('number')
    expect(typeof data.pendingCount).toBe('number')
    expect(Array.isArray(data.pendingRoundIds)).toBe(true)
  })

  it('Staging environment: Invalid matchId returns 400', async () => {
    const stagingEnv: Env = {
      ...env,
      ENVIRONMENT: 'staging',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan-v2.ledinhphat1994.workers.dev/api/staging/game-session/invalid@match!id/outbox', {
        method: 'GET',
      }),
      stagingEnv,
    )

    expect(res.status).toBe(400)
    const data = (await res.json()) as { ok: boolean; loi?: string }
    expect(data.ok).toBe(false)
    expect(data.loi).toBe('Mã trận không hợp lệ.')
  })

  it('Production environment: POST /api/staging/game-session/reconcile returns strict 404', async () => {
    const prodEnv: Env = {
      ...env,
      ENVIRONMENT: 'production',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan.workers.dev/api/staging/game-session/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: ['session-1', 'session-2'] }),
      }),
      prodEnv,
    )

    expect(res.status).toBe(404)
  })

  it('Staging environment: POST /api/staging/game-session/reconcile unauthenticated returns 401', async () => {
    const stagingEnv: Env = {
      ...env,
      ENVIRONMENT: 'staging',
    }

    const res = await app.fetch(
      new Request('https://gdtxdinhquan-v2.ledinhphat1994.workers.dev/api/staging/game-session/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: ['session-1'] }),
      }),
      stagingEnv,
    )

    expect(res.status).toBe(401)
  })

  it('Config verification: wrangler.production.jsonc has ENVIRONMENT=production and no staging IDs', () => {
    const prodContent = (env as any).PROD_WRANGLER_CONFIG as string
    expect(typeof prodContent).toBe('string')
    // Strip comments to parse JSON
    const cleanJson = prodContent.replace(/\/\/.*$/gm, '')
    const prodConfig = JSON.parse(cleanJson)

    expect(prodConfig.vars?.ENVIRONMENT).toBe('production')
    // Ensure production D1 is lop-10a7-db (a12de014...) and NOT staging
    const prodD1 = prodConfig.d1_databases.find((d: any) => d.binding === 'DB')
    expect(prodD1.database_name).toBe('lop-10a7-db')
    expect(prodD1.database_id).toBe('a12de014-e9d2-4d6d-994f-dcb36c481432')
    expect(prodD1.database_id).not.toBe('46ed8936-b447-4f10-8983-8f3c3d310e9f')

    // Ensure production KV is e2529ac5... and NOT staging
    const prodKV = prodConfig.kv_namespaces.find((k: any) => k.binding === 'RATE_LIMIT')
    expect(prodKV.id).toBe('e2529ac570cb4d77a246f38953dcbc9f')
    expect(prodKV.id).not.toBe('d8cd90e018eb4da3ba697aaba555115c')
  })

  it('Config verification: wrangler.staging.jsonc has ENVIRONMENT=staging and staging IDs', () => {
    const stagingContent = (env as any).STAGING_WRANGLER_CONFIG as string
    expect(typeof stagingContent).toBe('string')
    const cleanJson = stagingContent.replace(/\/\/.*$/gm, '')
    const stagingConfig = JSON.parse(cleanJson)

    expect(stagingConfig.vars?.ENVIRONMENT).toBe('staging')
    const stagingD1 = stagingConfig.d1_databases.find((d: any) => d.binding === 'DB')
    expect(stagingD1.database_name).toBe('lop-10a7-db-staging')
    expect(stagingD1.database_id).toBe('46ed8936-b447-4f10-8983-8f3c3d310e9f')
  })
})
