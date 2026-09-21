# Digital Campus v2 — Production Release Manifest

## Active Production Release: Milestone U2

**Milestone:** U2 — Comprehensive Visual Polish & UI/UX Parity Release<br/>
**Release Candidate Branch:** `main`<br/>
**Released Git Commit SHA:** `fa6057524851fc98d32de04889b4f32a0a91cfbc`<br/>
**Target Production Worker Service:** `gdtxdinhquan`<br/>
**Production URL:** `https://gdtxdinhquan.ledinhphat1994.workers.dev`<br/>
**Release Timestamp:** `2026-09-21T06:43:09Z` (`2026-09-21T13:43:09+07:00`)<br/>
**Active Production Version ID:** `9b895444-c29a-41fe-bc2d-a86878dc1c25`<br/>
**Rollback Baseline Version ID:** `9edea0a6-cf8d-4b06-bb2d-b1eff92014ba`<br/>
**Traffic Allocation:** 100% to active version (`9b895444-c29a-41fe-bc2d-a86878dc1c25`)

---

### 1. Release Classification & Gates

- **Release Category:** Category A (Runtime Worker + Workers Static Assets only; no database migrations).
- **Gate A (Pre-Deploy Verification):** **PASS**
  * Core D1 (`lop-10a7-db`): 0 pending migrations.
  * Analytics D1 (`lop-10a7-analytics`): 0 pending migrations.
  * Secrets & Durable Objects binding contracts: verified intact.
  * Baseline production readiness: verified alive.
  * Release guard check: PASS.
- **Gate B (Controlled Production Deploy + Smoke):** **PASS**
  * Production deployment command: `npm run deploy:production` executed cleanly.
  * Cloudflare Version ID created: `9b895444-c29a-41fe-bc2d-a86878dc1c25`.
  * Static visual assets uploaded: 52 assets to Cloudflare Workers Static Assets (`dist/client`).
  * Non-mutating public smoke probes: 8/8 routes PASSED.
  * Client bundle integrity (JS/CSS): PASSED.
  * U2 visual static asset samples: PASSED (campus, learning, community, games, avatars).
  * Production AuthGate visual sanity check: PASSED (zero console errors, clean dark mode layout).
  * Database non-mutation: 0 D1 migrations applied, 0 seed rows added, 0 table truncations.
  * Storage non-mutation: 0 R2 mutations, 0 KV mutations.
  * Rollback: NOT TRIGGERED.

---

### 2. Summary of U2 Deliverables

- **U2 Visual Polish & Parity:**
  * Complete brand identity implementation with dark theme, glassmorphism, curated semantic color tokens, and Vietnamese educational typography.
  * Visual assets deployed via Cloudflare Workers Static Assets across Campus, Learning, Community, Games, and Avatar domains.
  * AuthGate / Classroom participant states, presentation controls, and zero CLS layout stability.
- **Data-Truth & Reliability Invariants:**
  * Re-entry and live status evaluations.
  * Atomic state mutations for concurrent operations.
  * Zero-slop validation with 100% test pass rate (642/642 tests passing locally and in CI).

---

### 3. Production Verification Evidence

- **Public Route Probes:**
  * `/`: `200 OK` (text/html)
  * `/learn`: `200 OK` (text/html)
  * `/community`: `200 OK` (text/html)
  * `/me`: `200 OK` (text/html)
  * `/games`: `200 OK` (text/html)
  * `/api/whoami`: `401 Unauthorized` (application/json)
  * `/api/login` (GET): `405 Method Not Allowed` (application/json)
  * `/api/files/test-nonexistent`: `404 Not Found` (application/json)
- **Asset Integrity:**
  * CSS Bundle: `200 OK` (text/css)
  * JS Bundle: `200 OK` (text/javascript)
  * WebP Visual Samples: `200 OK` (`image/webp`) across all 5 asset directories.
- **Database & State Safety:**
  * Core D1 Pending: 0
  * Analytics D1 Pending: 0
  * Unauthenticated U2 UI verified in production headless browser.
  * Authenticated U2 UI verified on staging, not replayed on production.

---

### 4. Emergency Rollback Command

If an unexpected functional regression occurs, roll back immediately to the baseline:

```bash
npx wrangler rollback 9edea0a6-cf8d-4b06-bb2d-b1eff92014ba --config wrangler.production.jsonc -y -m "Rollback U2 production release"
```

---

## Historical Release Archive

### Milestone PRV8.2 (2026-09-19)
- **Released Git Commit SHA:** `d12506f8997709472a43c86e2afa6db8dd09f772`
- **Production Worker Version ID:** `5c4f01af-92d0-4e18-ac39-2301391bc0fe`
- **Scope:** Multi-generation identity closures, voice revocation incarnation, and room reconciliation state machines. Migrations applied: `0008_ban_authority_and_concurrency.sql`, `0009_password_reset_tokens.sql`.
