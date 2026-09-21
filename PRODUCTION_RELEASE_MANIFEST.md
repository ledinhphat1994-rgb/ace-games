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
  * **LEGACY STAGING OBJECT RESIDUE IN PRODUCTION BUCKET:** `0`
  * **LEGACY RESIDUE STATUS:** `CONTROLLED CLEANUP COMPLETED`
  * **Isolation Contract & Status:**
    - Dedicated staging bucket `lop-10a7-anh-staging` created and bound in `wrangler.staging.jsonc` (deployed to Worker `gdtxdinhquan-v2`).
    - Staging has independent physical storage for all current and future writes (`NEW STAGING WRITE ISOLATION = ENFORCED`).
    - Invariant enforced in `scripts/guard-production-release.mjs`: shared R2 bucket between staging and production is an absolute hard block (exit code 1).
    - Verified via automated 10-invariant harness `scripts/verify-release-guard.mjs` (10/10 PASS).
    - Strong isolation verified via live staging smoke: staging upload returned 200 on staging, present in `lop-10a7-anh-staging`, 404 on production URL, and absent from `lop-10a7-anh`.
  * **Controlled Legacy Residue Cleanup Execution:**
    - Pre-cleanup audit re-verified exactly 20 referenced legacy staging objects in D1 `phong_tai_lieu`.
    - Production reference collisions across all tables and columns were independently verified to be 0 (`PRODUCTION_REFERENCE_COLLISIONS = 0`).
    - Prior to deletion, SHA-256 byte-for-byte integrity was proven between `lop-10a7-anh` and `lop-10a7-anh-staging` for all 20 objects (`BYTE_IDENTICAL = 20/20`).
    - Pre-delete TOCTOU checkpoint confirmed zero drift across D1 metadata and physical object availability.
    - Exact-key deletions were executed strictly one-by-one with immediate absence verification: exactly 20 verified legacy staging objects deleted from `lop-10a7-anh` (`PRODUCTION R2 EXACT-KEY DELETIONS = 20`, `FAILURES = 0`).
    - Post-cleanup verification confirmed:
      * Production bucket legacy residue remaining: 0 (all 20 return 404 on production URL).
      * Staging bucket copies preserved: 20/20 present and intact (return 200 on staging URL).
      * Production D1, KV, deployments, and configuration: zero mutation (`NONE`).
      * Unrelated production R2 objects: zero mutation (`NONE`).
  * **R2 Object Access Control & File Authorization Status (Milestone F1):**
    - **GENERIC FILE KEY-POSSESSION ACCESS:** `REMOVED`. Possession of an R2 object key alone NEVER authorizes read access.
    - **AUTHORITATIVE METADATA REGISTRY:** `ENFORCED`. Backed by D1 table `file_metadata` (Migration `0018_file_metadata_registry.sql`) tracking `object_key`, `original_name`, `mime_type`, `size_bytes`, `purpose`, `visibility`, `uploaded_by_account_id`, and timestamps.
    - **STUDY ROOM DOCUMENT BYPASS:** `BLOCKED`. Generic path `/api/files/:key` explicitly rejects keys matching `rooms/` or `/documents/` with 404 Not Found (Fail Closed). Canonical room access (`GET /api/rooms/:id/documents/:docId/file`) remains the sole authorized path.
    - **AVATAR VISIBILITY CLASS:** `campus`. Uploaded user avatars require an active campus session (`kiemTraPhien`). Unauthenticated requests return 401 Unauthorized. Served with `Cache-Control: private, max-age=3600` and no wildcard CORS.
    - **PERSONAL / GENERAL VISIBILITY CLASS:** `owner`. General and slide uploads are accessible only by the original uploader (`uploaded_by_account_id`). Other authenticated users receive 403 Forbidden; unauthenticated receive 401 Unauthorized.
    - **ORPHAN / UNKNOWN OBJECT ACCESS:** `FAIL CLOSED`. Keys without valid, non-deleted records in `file_metadata` return 404 Not Found to prevent leaking object existence.
    - **UPLOAD COMPENSATION DELETION:** `ENFORCED`. If D1 metadata persistence fails after R2 `put()`, an exact-key `c.env.ANH.delete(key)` is immediately triggered.
    - **IDEMPOTENT LEGACY BACKFILL:** Migration 0018 includes an idempotent backfill query indexing any avatar URLs currently stored in `tai_khoan_campus.avatar`. Audit confirmed 0 legacy avatar residue in staging D1.
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
