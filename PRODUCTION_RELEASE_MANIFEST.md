# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV5 — Global Abuse-Control Audit & Final Release Rehearsal
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`
**Documentation HEAD Git Commit SHA:** Will be populated on commit (documentation only)
**Executable Candidate Git Commit SHA:** `855618e950893aa426d03046f481e6992d33451e`
**Staging-Verified Executable SHA:** `855618e950893aa426d03046f481e6992d33451e`
**Verified Staging Deployment Version ID:** `6cd31e8e-fc5e-44ac-99d9-4ec57952cdb3`
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`
**Target Production Worker Service:** `gdtxdinhquan`
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain  

*Note on SHA Parity:* Executable Candidate SHA matches the Staging-Verified SHA (`855618e`) byte-for-byte. The Documentation HEAD differs from the Executable Candidate SHA solely by updates to documentation files (`PRODUCTION_RELEASE_MANIFEST.md`), with zero executable code or configuration diffs.

---

## 1. Code Delta from `origin/main`

- **Branch Range:** `origin/main..855618e` (11 commits)
- **Key Modules & Enhancements:**
  - `worker/room-do.ts`: Cooldown versioning (`cooldown_id`), atomic SQLite OCC locks, authority hierarchy.
  - `worker/routes/moderation-api.ts`:
    - Restriction identity across delete/recreate (ABA protection).
    - Edge Workers Rate Limiting binding integration (`MODERATION_LIMITER`: 20 req / 60s per actor).
    - `/api/reports` rate limit migrated to **D1 persistence boundary conditional atomic insert** (5 reports / 10 min / reporter; zero KV writes, zero lost increments).
    - Strict Zod schemas and room ID parsing.
  - `worker/index.ts`:
    - Server-trusted Request ID generation (`crypto.randomUUID()`), client correlation header sanitization.
    - Global security response headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`).
    - `/api/upload` dual-layer defense: native edge `UPLOAD_LIMITER` (10 req / 60s per actor) + fail-open KV quota (20 uploads / 10 min) with safe try-catch error handling.
    - `/api/rooms/:id/admit` room admission rate limiter hardened with fail-open try-catch.
  - `worker/routes/voice-api.ts`: Voice signaling rate limiter hardened with fail-open try-catch.
  - `worker/routes/auth.ts`: Password reset and login throttling hardened with fail-open try-catch.
  - `wrangler.jsonc`, `wrangler.staging.jsonc`, `wrangler.production.jsonc`: Added native `ratelimits` bindings for `MODERATION_LIMITER` (staging: `2001`, prod: `1001`) and `UPLOAD_LIMITER` (staging: `2002`, prod: `1002`).
  - `test/moderation.test.ts`, `test/security-hardening.test.ts`, `test/abuse-control.test.ts`: 296 unit/integration tests (100% pass) including 40 security hardening tests and 8 abuse-control concurrency/burst tests.

---

## 2. Database Migration Requirements

- **Migration Status on Production D1 (`lop-10a7-db` / `a12de014-e9d2-4d6d-994f-dcb36c481432`):**
  - Migrations `0001` through `0007`: **Already applied**.
  - Pending Migration: **`0008_ban_authority_and_concurrency.sql`** (verified via `npx wrangler d1 migrations list lop-10a7-db --remote`).
- **Migration Impact:**
  - Non-destructive `ALTER TABLE` statements adding 3 nullable/defaulted columns to `phong_ban`:
    ```sql
    ALTER TABLE phong_ban ADD COLUMN authority_rank INTEGER DEFAULT 3;
    ALTER TABLE phong_ban ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE phong_ban ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
    ```
  - Backwards-compatible: Default values ensure existing records are safely interpreted by the runtime (default `authority_rank = 3` for legacy fail-closed Admin safety).
  - Cloudflare D1 guarantees automatic rollback on migration script failure, and D1 Time Travel point-in-time recovery (30 days) is available as an emergency restore mechanism.

---

## 3. Configuration & Infrastructure Bindings Preflight

| Binding | Resource Type | Staging Configuration | Production Configuration | Isolation Status |
|---|---|---|---|---|
| `DB` | D1 Database | `lop-10a7-db-staging` (`46ed8936-b447-4f10-8983-8f3c3d310e9f`) | `lop-10a7-db` (`a12de014-e9d2-4d6d-994f-dcb36c481432`) | **100% Isolated** (Separate database IDs) |
| `RATE_LIMIT` | KV Namespace | `d8cd90e018eb4da3ba697aaba555115c` | `e2529ac570cb4d77a246f38953dcbc9f` | **100% Isolated** (Separate KV IDs) |
| `MODERATION_LIMITER` | Workers Rate Limit | `namespace_id: "2001"`, 20 req / 60s | `namespace_id: "1001"`, 20 req / 60s | **100% Isolated** (Distinct namespace IDs) |
| `UPLOAD_LIMITER` | Workers Rate Limit | `namespace_id: "2002"`, 10 req / 60s | `namespace_id: "1002"`, 10 req / 60s | **100% Isolated** (Distinct namespace IDs) |
| `ROOMS` | Durable Object | Scoped to Worker `gdtxdinhquan-v2` | Scoped to Worker `gdtxdinhquan` | **100% Isolated** (Worker service boundaries) |
| `CAMPUS` | Durable Object | Scoped to Worker `gdtxdinhquan-v2` | Scoped to Worker `gdtxdinhquan` | **100% Isolated** (Worker service boundaries) |
| `GAME_LOBBY` | Durable Object | Scoped to Worker `gdtxdinhquan-v2` | Scoped to Worker `gdtxdinhquan` | **100% Isolated** (Worker service boundaries) |
| `ANH` | R2 Bucket | `lop-10a7-anh` | `lop-10a7-anh` | Shared asset bucket (Read-only school assets) |

---

## 4. Secrets Requirements (Values NOT Stored in Git)

The following secrets must be present in the target production Worker secret store prior to traffic activation:
1. `SESSION_SECRET`: Cryptographic key for PBKDF2/HMAC-SHA256 session token generation and verification.
2. `CLASS_CODE`: Student registration invitation code.
3. `TEACHER_CODE`: Teacher registration invitation code.
4. `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile anti-bot verification secret.
5. `CALLS_APP_ID`: Cloudflare Calls SFU application ID for real-time audio.
6. `CALLS_APP_SECRET`: Cloudflare Calls SFU API token.

*Note: All 6 secrets are already populated in production `gdtxdinhquan` environment.*

---

## 5. Mandatory Production Deployment Order

> [!CAUTION]
> **STRICT SEQUENCE REQUIREMENT:**
> D1 database schema migration MUST be applied BEFORE deploying the Worker code.
> If the Worker is deployed before migration `0008`, queries referencing `authority_rank` or `revision` will fail closed with HTTP 503.

### Phase 1: Pre-Release Review Gate
1. Human audit of this release manifest and explicit authorization.
2. Merge PR branch `fix/moderation-safety-v1-closure` into `main`.

### Phase 2: Production Database Migration
Run from authorized local workstation:
```bash
npx wrangler d1 migrations apply lop-10a7-db --remote
```
*Verify output:* `0008_ban_authority_and_concurrency.sql` applied successfully (0 errors).

### Phase 3: Production Worker Deployment
Run from authorized local workstation:
```bash
npm run deploy:production
```
*Command executes:* `npm run build && npx wrangler deploy --config wrangler.production.jsonc`

---

## 6. Post-Deployment Verification & Smoke Testing

Immediately following Phase 3 deployment:
1. **Health Check & Security Headers:**
   `curl -i https://gdtxdinhquan.workers.dev/api/health`
   - Verify HTTP status `200`.
   - Verify security headers present: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Request-Id`.
2. **Production Smoke Suite:**
   `PLAYWRIGHT_BASE_URL=https://gdtxdinhquan.workers.dev npx playwright test e2e/smoke.spec.ts`
   - All 3 smoke tests must pass within 15 seconds.
3. **Audit Trail Verification:**
   Log in as administrator and verify `/api/moderation/audit-logs` returns HTTP 200 with valid schema.

---

## 7. Rollback Triggers & Procedure

### A. Rollback Triggers
Initiate immediate rollback if any of the following occur within 30 minutes post-deploy:
- Production smoke test fails.
- Cloudflare Workers error rate (HTTP 5xx) exceeds 1% of total requests.
- Legitimate teacher moderation (/kick, /ban, /unban) returns unexpected HTTP 500 or fails closed indefinitely.
- WebRTC voice SFU fails to establish tracks.

### B. Rollback Procedure
1. **Rollback Worker Version:**
   In Cloudflare Dashboard > Workers & Pages > `gdtxdinhquan` > Deployments:
   Click **Rollback** to the previous stable deployment version ID (instant traffic revert).
2. **Database Schema Rollback:**
   Migration `0008` is additive (`ALTER TABLE ADD COLUMN`). Rolling back the Worker to the previous version requires **NO database changes**, as the previous Worker simply ignores the extra columns.
