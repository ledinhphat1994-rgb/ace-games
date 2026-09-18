# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV6 — Identity Recovery & Authentication Security Closure
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`
**Documentation HEAD Git Commit SHA:** Will be populated on commit (documentation only)
**Executable Candidate Git Commit SHA:** `730588439df61a8f9064c91a329ef3109ecf205c`
**Staging-Verified Executable SHA:** `730588439df61a8f9064c91a329ef3109ecf205c`
**Verified Staging Deployment Version ID:** `91d7658f-4e2d-4308-b2ed-25660d1752e2`
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`
**Target Production Worker Service:** `gdtxdinhquan`
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain  

*Note on SHA Parity:* Executable Candidate SHA matches the Staging-Verified SHA (`730588439df61a8f9064c91a329ef3109ecf205c`) byte-for-byte. The Documentation HEAD differs from the Executable Candidate SHA solely by updates to documentation files (`PRODUCTION_RELEASE_MANIFEST.md`), with zero executable code or configuration diffs.

---

## 1. Code Delta from `origin/main`

- **Branch Range:** `origin/main..7305884` (12 commits)
- **Key Modules & Enhancements:**
  - `worker/room-do.ts`: Cooldown versioning (`cooldown_id`), atomic SQLite OCC locks, authority hierarchy.
  - `worker/routes/moderation-api.ts`:
    - Restriction identity across delete/recreate (ABA protection).
    - Edge Workers Rate Limiting binding integration (`MODERATION_LIMITER`: 20 req / 60s per actor).
    - `/api/reports` rate limit migrated to **D1 persistence boundary conditional atomic insert** (5 reports / 10 min / reporter; zero KV writes, zero lost increments).
    - Strict Zod schemas and room ID parsing.
  - `worker/routes/auth.ts`:
    - **Password Reset State Machine migrated from Workers KV to D1 (`password_reset_tokens`)**:
      * Invariant A: Atomic 5-attempt lockout enforced via single-query SQLite conditional update (`UPDATE ... SET attempts = attempts + 1, status = CASE ...`). Concurrent wrong attempts cannot exceed ceiling or lose increments.
      * Invariant B: Atomic single-use credential consumption (`UPDATE ... SET status = 'consumed' WHERE id = ? AND status = 'active' AND attempts < max_attempts`). Exactly 1 concurrent request can succeed; siblings receive 0 modified rows and fail closed with HTTP 400.
      * ABA Protection: Token issuance revokes previous active tokens (`status = 'revoked'`). Delayed requests with Token A cannot mutate, consume, or reset password on Token B.
      * Password Hash & Update Atomicity: PBKDF2 hash calculated prior to atomic conditional update; password update immediately invalidates all active sessions (`thiet_bi = 'revoked_' + UUID`, code 4001 eviction).
    - **Login Dual-Layer Abuse Defense**:
      * Layer 1: Native Cloudflare Workers Rate Limiting edge binding (`LOGIN_LIMITER`: 10 req / 60s per IP + username) providing burst and credential-stuffing resistance.
      * Layer 2: Fail-open KV secondary sliding window (8 attempts / 10 min per username, 30 attempts / 10 min per IP) with graceful try-catch error handling.
  - `worker/index.ts`:
    - Server-trusted Request ID generation (`crypto.randomUUID()`), client correlation header sanitization.
    - Global security response headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`).
    - `/api/upload` dual-layer defense: native edge `UPLOAD_LIMITER` (10 req / 60s per actor) + fail-open KV quota (20 uploads / 10 min).
    - `/api/rooms/:id/admit` room admission dual-layer defense: native edge `ADMIT_LIMITER` (10 req / 60s per account + room) + fail-open KV quota.
  - `worker/routes/voice-api.ts`: Voice signaling rate limiter hardened with fail-open try-catch.
  - `wrangler.jsonc`, `wrangler.staging.jsonc`, `wrangler.production.jsonc`:
    - Added native `ratelimits` bindings for `LOGIN_LIMITER` (staging: `2003`, prod: `1003`) and `ADMIT_LIMITER` (staging: `2004`, prod: `1004`) alongside `MODERATION_LIMITER` and `UPLOAD_LIMITER`.
  - `test/identity-security.test.ts`: Added 7 comprehensive adversarial tests verifying Invariant A (10 concurrent wrong OTPs), Invariant B (concurrent valid OTPs single-use), ABA protection, teacher/admin scope enforcement, login limiter burst, admit limiter burst, and post-reset session revocation.
  - All test suites: 303/303 unit/integration tests passing (100% pass) including 40 security hardening tests, 8 abuse-control tests, and 7 identity-security tests.

---

## 2. Database Migration Requirements

- **Migration Status on Production D1 (`lop-10a7-db` / `a12de014-e9d2-4d6d-994f-dcb36c481432`):**
  - Migrations `0001` through `0007`: **Already applied**.
  - Pending Migration 1: **`0008_ban_authority_and_concurrency.sql`** (verified via `npx wrangler d1 migrations list lop-10a7-db --remote`).
  - Pending Migration 2: **`0009_password_reset_tokens.sql`** (new in PRV6, verified applied on staging).
- **Migration Impact & Safety Analysis:**
  - `0008_ban_authority_and_concurrency.sql`:
    ```sql
    ALTER TABLE phong_ban ADD COLUMN authority_rank INTEGER DEFAULT 3;
    ALTER TABLE phong_ban ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE phong_ban ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
    ```
  - `0009_password_reset_tokens.sql`:
    ```sql
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT NOT NULL UNIQUE,
      account_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      code_digest TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'revoked', 'locked')),
      consumed_at INTEGER DEFAULT NULL,
      created_at INTEGER NOT NULL,
      created_by INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pwd_reset_active ON password_reset_tokens (username, status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_pwd_reset_digest ON password_reset_tokens (username, code_digest);
    ```
  - **Zero Data Loss & Backwards Compatibility:**
    * Both migrations are 100% additive (adding columns and creating a new dedicated table). No existing tables, columns, or data are dropped, renamed, or altered destructively.
    * Automatic Rollback: Cloudflare D1 guarantees automatic transaction rollback if a migration statement fails.
    * Point-in-Time Recovery: Cloudflare D1 Time Travel point-in-time recovery retention is **up to 30 days on Workers Paid, up to 7 days on Workers Free (7 or 30 days depending on Cloudflare plan)**.

---

## 3. Configuration & Infrastructure Bindings Preflight

| Binding | Resource Type | Staging Configuration | Production Configuration | Isolation Status |
|---|---|---|---|---|
| `DB` | D1 Database | `lop-10a7-db-staging` (`46ed8936-b447-4f10-8983-8f3c3d310e9f`) | `lop-10a7-db` (`a12de014-e9d2-4d6d-994f-dcb36c481432`) | **100% Isolated** (Separate database IDs) |
| `RATE_LIMIT` | KV Namespace | `d8cd90e018eb4da3ba697aaba555115c` | `e2529ac570cb4d77a246f38953dcbc9f` | **100% Isolated** (Separate KV IDs) |
| `MODERATION_LIMITER` | Workers Rate Limit | `namespace_id: "2001"`, 20 req / 60s | `namespace_id: "1001"`, 20 req / 60s | **100% Isolated** (Distinct namespace IDs) |
| `UPLOAD_LIMITER` | Workers Rate Limit | `namespace_id: "2002"`, 10 req / 60s | `namespace_id: "1002"`, 10 req / 60s | **100% Isolated** (Distinct namespace IDs) |
| `LOGIN_LIMITER` | Workers Rate Limit | `namespace_id: "2003"`, 10 req / 60s | `namespace_id: "1003"`, 10 req / 60s | **100% Isolated** (Distinct namespace IDs) |
| `ADMIT_LIMITER` | Workers Rate Limit | `namespace_id: "2004"`, 10 req / 60s | `namespace_id: "1004"`, 10 req / 60s | **100% Isolated** (Distinct namespace IDs) |
| `ROOMS` | Durable Object | Scoped to Worker `gdtxdinhquan-v2` | Scoped to Worker `gdtxdinhquan` | **100% Isolated** (Worker service boundaries) |
| `CAMPUS` | Durable Object | Scoped to Worker `gdtxdinhquan-v2` | Scoped to Worker `gdtxdinhquan` | **100% Isolated** (Worker service boundaries) |
| `GAME_LOBBY` | Durable Object | Scoped to Worker `gdtxdinhquan-v2` | Scoped to Worker `gdtxdinhquan` | **100% Isolated** (Worker service boundaries) |
| `ANH` | R2 Bucket | `lop-10a7-anh` | `lop-10a7-anh` | Shared asset bucket (Read-only school assets) |

---

## 4. Secrets Requirements (Values NOT Stored in Git)

The following secrets must be present in the target production Worker secret store prior to traffic activation:
1. `SESSION_SECRET`: Cryptographic key for PBKDF2/HMAC-SHA256 session token and password reset OTP HMAC generation.
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
> D1 database schema migrations `0008` and `0009` MUST be applied BEFORE deploying the Worker code.
> If the Worker is deployed before migration `0008` and `0009`, queries referencing `authority_rank`, `revision`, or `password_reset_tokens` will fail closed with HTTP 503 / 500.

### Phase 1: Pre-Release Review Gate
1. Human audit of this release manifest and explicit authorization.
2. Merge PR branch `fix/moderation-safety-v1-closure` into `main`.

### Phase 2: Production Database Migration
Run from authorized local workstation:
```bash
npx wrangler d1 migrations apply lop-10a7-db --remote
```
*Verify output:* Both `0008_ban_authority_and_concurrency.sql` and `0009_password_reset_tokens.sql` applied successfully (0 errors).

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
   `curl -i https://gdtxdinhquan.workers.dev/api/whoami`
   - Verify HTTP status `401` (unauthenticated).
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
- Legitimate student password reset fails.
- WebRTC voice SFU fails to establish tracks.

### B. Rollback Procedure
1. **Rollback Worker Version:**
   In Cloudflare Dashboard > Workers & Pages > `gdtxdinhquan` > Deployments:
   Click **Rollback** to the previous stable deployment version ID (instant traffic revert).
2. **Database Schema Rollback:**
   Migrations `0008` and `0009` are additive (`ALTER TABLE ADD COLUMN` and `CREATE TABLE`). Rolling back the Worker to the previous version requires **NO database changes**, as the previous Worker simply ignores the new columns and the `password_reset_tokens` table.
