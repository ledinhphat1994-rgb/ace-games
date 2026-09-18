# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV4 — Rate Limiter Finalization & Production Preflight  
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`  
**Candidate Git Commit SHA:** `86c98104523bb4a7d71686616e159a22f30b9101`  
**Verified Staging Deployment Version ID:** `d8457817-3091-4b9b-890d-5a3e26612fef`  
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`  
**Target Production Worker Service:** `gdtxdinhquan`  
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain  

---

## 1. Code Delta from `origin/main`

- **Branch Range:** `origin/main..86c9810` (10 commits)
- **Files Modified:** 20 files (+3,474 / -304 lines)
- **Key Modules Modified:**
  - `worker/room-do.ts`: Cooldown versioning (`cooldown_id`), atomic SQLite OCC locks, authority hierarchy.
  - `worker/routes/moderation-api.ts`: Restriction identity across delete/recreate (ABA protection), Workers Rate Limiting binding integration (`MODERATION_LIMITER`), fail-open KV fallback, strict Zod schemas, strict room ID parsing.
  - `worker/index.ts`: Server-trusted Request ID generation (`crypto.randomUUID()`), client correlation header sanitization, security response headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`).
  - `wrangler.jsonc`, `wrangler.staging.jsonc`, `wrangler.production.jsonc`: Added native `ratelimits` binding with isolated namespaces (`2001` for staging, `1001` for production).
  - `test/moderation.test.ts`, `test/security-hardening.test.ts`: 40 targeted security hardening tests + 31 moderation safety tests covering all 12 invariants.

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

---

## 3. Configuration & Infrastructure Bindings Preflight

| Binding | Resource Type | Staging Configuration | Production Configuration | Isolation Status |
|---|---|---|---|---|
| `DB` | D1 Database | `lop-10a7-db-staging` (`46ed8936-b447-4f10-8983-8f3c3d310e9f`) | `lop-10a7-db` (`a12de014-e9d2-4d6d-994f-dcb36c481432`) | **100% Isolated** (Separate database IDs) |
| `RATE_LIMIT` | KV Namespace | `d8cd90e018eb4da3ba697aaba555115c` | `e2529ac570cb4d77a246f38953dcbc9f` | **100% Isolated** (Separate KV IDs) |
| `MODERATION_LIMITER` | Workers Rate Limit | `namespace_id: "2001"`, 20 req / 60s | `namespace_id: "1001"`, 20 req / 60s | **100% Isolated** (Distinct namespace IDs) |
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
1. Human audit of this release manifest and approval.
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
1. **Health Check:**
   `curl -i https://gdtxdinhquan.workers.dev/api/health`
   - Verify HTTP status `200` (or valid API response).
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
