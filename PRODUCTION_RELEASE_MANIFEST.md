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
  * Production AuthGate visual sanity check: PASSED (zero console errors in headless browser).
  * Database non-mutation: 0 D1 migrations applied, 0 seed rows added, 0 table truncations.
  * Storage non-mutation: 0 R2 mutations, 0 KV mutations.
  * Rollback: NOT TRIGGERED.

---

### 2. Summary of Verified U2 Deliverables

- **Visual Asset System:**
  * Curated semantic theme tokens, dark mode palette, and educational typography.
  * 52 visual assets were deployed. Representative production samples across Campus, Learning, Community, Games, and Avatar asset categories returned HTTP 200 with valid image/webp responses.
- **UI & Interaction Parity:**
  * AuthGate, Classroom participant strip, and presentation controls verified in headless browser.
- **Data-Truth & Reliability Invariants:**
  * Re-entry and live status evaluations without stale caching.
  * Atomic state mutations for concurrent room/game operations.
  * Automated regression suite passing: 59 test files, 642/642 tests passing locally and in CI.

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
  * WebP Visual Samples: `200 OK` (`image/webp`) across all 5 asset categories.
- **Database & State Safety:**
  * Core D1 Pending: 0
  * Analytics D1 Pending: 0
  * Unauthenticated U2 UI verified in production headless browser.
  * Authenticated U2 UI verified on staging, not replayed on production.

---

### 4. Architectural Debt & Governance Status

- **R2 Storage Cross-Env Isolation & Legacy Residue Status:**
  * **Production Binding:** `ANH -> lop-10a7-anh`
  * **Staging Binding:** `ANH -> lop-10a7-anh-staging`
  * **R2 BINDING ISOLATION:** `ENFORCED`
  * **NEW STAGING WRITE ISOLATION:** `ENFORCED`
  * **LEGACY STAGING OBJECT RESIDUE IN PRODUCTION BUCKET:** `20 KEYS`
  * **LEGACY RESIDUE STATUS:** `PENDING CONTROLLED CLEANUP`
  * **Isolation Contract & Status:**
    - Dedicated staging bucket `lop-10a7-anh-staging` created and bound in `wrangler.staging.jsonc` (deployed to Worker `gdtxdinhquan-v2`).
    - Production bucket `lop-10a7-anh` remains intact; no production objects were deleted, renamed, or bulk-copied.
    - Zero production objects were migrated.
    - Staging now has independent physical storage for all current and future writes.
    - Invariant enforced in `scripts/guard-production-release.mjs`: shared R2 bucket between staging and production is an absolute hard block (exit code 1).
    - Verified via automated 10-invariant harness `scripts/verify-release-guard.mjs` (10/10 PASS).
    - Strong isolation verified via live staging smoke: staging upload returned 200 on staging, present in `lop-10a7-anh-staging`, 404 on production URL, and absent from `lop-10a7-anh`.
  * **Legacy Object Preservation & Residue:**
    - Pre-separation staging D1 inventory identified 20 referenced objects in `phong_tai_lieu`.
    - Production collision check verified 0 reference collisions with production D1 metadata.
    - All 20 referenced objects were successfully copied to `lop-10a7-anh-staging` with 100% byte size integrity verified.
    - Because production R2 mutation was strictly prohibited during PR #11, the 20 legacy objects were intentionally NOT deleted from `lop-10a7-anh`.
    - Historical physical separation will be finalized in a separate, dedicated controlled cleanup gate after PR #11 merge.
  * **Public Key-Based Read Endpoint Consequence:**
    - `GET /api/files/:key` performs direct public key-based R2 read (`c.env.ANH.get(key)`) without authentication and was intentionally NOT redesigned in this task.
    - Consequently, the 20 legacy staging objects still residing in `lop-10a7-anh` can theoretically still be fetched from the production Worker if an exact key is known.
    - The Study Room document authorization gate (`GET /api/rooms/:id/documents/:docId/file`) does NOT protect the generic `/api/files/:key` endpoint.
    - Redesigning file access authorization is a separate security task outside the scope of R2 storage separation.
- **Repository Governance Status:**
  * GitHub native branch protection is disabled by GitHub policy (HTTP 403 on GitHub Free personal account for private repositories).
  * Enforcement relies on CI Quality Gates on PRs, pre-release release guards (`scripts/guard-production-release.mjs`), clean tree enforcement, and PR review discipline.
  * Direct push protection on `main` is not server-enforced; team adherence to PR workflow is mandatory.

---

### 5. Emergency Rollback Command

If an unexpected functional regression occurs, roll back immediately to the baseline:

```bash
npx wrangler rollback 9edea0a6-cf8d-4b06-bb2d-b1eff92014ba --config wrangler.production.jsonc -y -m "Rollback U2 production release"
```

---

## Historical Release Archive

- **Milestone PRV8.2 (2026-09-19):** Full release evidence, migration records, and canaries preserved in [docs/releases/2026-09-19-prv8.2.md](docs/releases/2026-09-19-prv8.2.md).
