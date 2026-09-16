// Production Refusal Guard: Destructive Watch Together tests MUST NEVER run against production.
// Enforces a strict allowlist: localhost, 127.0.0.1, and the exact staging origin.

export const ALLOWED_STAGING_ORIGINS = [
  'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev',
]

export function assertSafeDestructiveE2ETarget(baseURL: string | undefined): void {
  if (!baseURL) {
    throw new Error('[SECURITY GUARD] Missing PLAYWRIGHT_BASE_URL for destructive E2E suite.')
  }
  let parsed: URL
  try {
    parsed = new URL(baseURL)
  } catch {
    throw new Error(`[SECURITY GUARD] Invalid PLAYWRIGHT_BASE_URL: "${baseURL}".`)
  }

  const hostname = parsed.hostname.toLowerCase()
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  const isStaging = ALLOWED_STAGING_ORIGINS.includes(parsed.origin.toLowerCase())

  if (!isLocalhost && !isStaging) {
    throw new Error(
      `[SECURITY GUARD] Destructive E2E suite is strictly restricted to localhost or verified staging (${ALLOWED_STAGING_ORIGINS.join(', ')}). Target origin "${parsed.origin}" is NOT in the allowlist. Aborting to protect production.`,
    )
  }
}
