# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV8 — Test Integrity + Fail-Closed Session Revocation + Durable Voice Revocation + Final Staging Gate
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`
**Documentation HEAD Git Commit SHA:** Will be populated on commit (documentation only)
**Executable Candidate Git Commit SHA:** `83b070aeb4f60dddb016058c41595ac0f32738df`
**Staging-Verified Executable SHA:** `83b070aeb4f60dddb016058c41595ac0f32738df`
**Verified Staging Deployment Version ID:** `a203af78-c277-441c-9c9d-a686cb251696`
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`
**Target Production Worker Service:** `gdtxdinhquan`
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain  

*Note on SHA Parity:* Executable Candidate SHA matches the Staging-Verified SHA (`83b070aeb4f60dddb016058c41595ac0f32738df`) byte-for-byte. The Documentation HEAD differs from the Executable Candidate SHA solely by updates to documentation files (`PRODUCTION_RELEASE_MANIFEST.md`), with zero executable code or configuration diffs.

---

## 1. Code Delta from `origin/main`

- **Branch Range:** `origin/main..83b070a` (15 commits)
- **Key Modules & Enhancements Closed in PRV8:**
  - **Blocker 1 Resolved — Removal of Global Test Error Suppression (`vitest.config.ts`)**:
    * Removed `dangerouslyIgnoreUnhandledErrors: true` completely from `vitest.config.ts`.
    * Resolved underlying workerd teardown race condition by introducing a 60ms flush tick in `test/setup.ts` (`afterEach`), allowing in-flight Miniflare RPC teardowns and Durable Object hibernation close frames to settle cleanly before worker environment destruction.
    * Tested and proved strict test runner gate: intentionally injected an unhandled rejection, confirmed Vitest exited non-zero with unhandled rejection failure, then removed the temporary test.
    * Full local test suite: **28 test files, 310/310 tests PASSING (100% pass)** with strict `--dangerouslyIgnoreUnhandledErrors=false` and zero unhandled errors.
  - **Blocker 2 Resolved — Strictly Fail-Closed Session Mutation Validation (`worker/room-do.ts` & `worker/campus/campus-do.ts`)**:
    * Eliminated the 5-second `sessionCache` window in `RoomDO.webSocketMessage`.
    * For every incoming state-mutating WebSocket command (chat, media sync, pomodoro, whiteboard, notes, playlist, game, moderation, voice state), `RoomDO` executes an authoritative check against D1 `tai_khoan_campus.thiet_bi`:
      - If `phienId` does not match the durable D1 session marker: socket is immediately closed with code `4001` (`da_dang_nhap_noi_khac`), active voice tracks revoked, and the mutation is dropped.
      - If D1 query fails (transient error / network outage): socket is closed with code `1011` (`loi_may_chu`), and the mutation is strictly DROPPED (Fail-Closed).
      - Non-mutating keepalives (`ping`) remain fast and handled in-memory without D1 queries.
    * Improved proactive revocation accounting in `CampusDO.dangNhapMoi`: records `successfulRooms` and `failedRooms`. Only successfully contacted rooms are removed from `phong_tai_khoan`, retaining failed rooms for bounded retries instead of silently deleting evidence.
    * Verified via adversarial test (`test/session-revocation.test.ts` Test 6): simulated proactive cross-DO RPC failure, stale socket sent a chat mutation, proved mutation was dropped, room state had 0 mutations, and socket was closed 4001.
  - **Blocker 3 Resolved — Durable Voice Revocation State Machine (`worker/room-do.ts`)**:
    * Created SQLite table `pending_voice_revocations` in `RoomDO` (`id, actor_key, session_id, track_name, generation, attempts, last_attempt_at, last_error, created_at`).
    * On `revokeVoiceForActor(actorKey)`:
      1. Immediately marks local voice publication as revoked and purges it from memory/SQLite registry (denying all local authority, mic permissions, and republishing).
      2. Persists the remote track metadata (`sessionId`, `trackName`, `generation`) to `pending_voice_revocations` *before* initiating the external HTTP call.
      3. Attempts Cloudflare Calls SFU `/sessions/:id/tracks/close`.
      4. On success (200) or terminal state (404/410 already closed): deletes the pending revocation record.
      5. On transient error (500/502/503/network failure): logs warning, retains the pending record in SQLite, and schedules bounded exponential retry via RoomDO alarm. Pending revocations survive Durable Object restarts and resume automatically on startup.
    * Verified via adversarial test (`test/session-revocation.test.ts` Test 7): injected 502 gateway timeout on first SFU close, verified local authority revoked immediately, pending record survived DO restart (`evictDurableObject`), and successful retry cleared metadata.
    * Verified via live Staging WebRTC proof (`e2e/voice-webrtc.spec.ts` Test 12): Member B joined room, published real WebRTC audio to Cloudflare Calls SFU, Host A received live RTP (+9153 bytes). Session replacement triggered via new login in new context: stale Room socket closed 4001, voice registry cleared Member B, remote media on Host A stopped (0 subscriptions, 0 tracks), stale session received 401 on republish, and new session published normally with live RTP (+9068 bytes).
  - **Blocker 4 Resolved — Full Staging Regression Gate Passed**:
    * Executed full staging Playwright suites against staging Worker `a203af78-c277-441c-9c9d-a686cb251696`:
      - `e2e/smoke.spec.ts`: **3/3 passed** (9.9s)
      - `e2e/room-discovery.spec.ts`: **1/1 passed** (1.6m)
      - `e2e/moderation.spec.ts`: **4/4 passed** (2.1m)
      - `e2e/voice-webrtc.spec.ts` (Force-Mute): **1/1 passed** (1.7m)
      - `e2e/voice-webrtc.spec.ts` (Session Revocation Voice Closure): **1/1 passed** (1.6m)
    * Non-destructive preflight verified: production D1 has exactly pending migrations `0008` and `0009`. Zero production mutations performed.

---

## 2. Database Migration Requirements

- **Migration Status on Production D1 (`lop-10a7-db` / `a12de014-e9d2-4d6d-994f-dcb36c481432`):**
  - Migrations `0001` through `0007`: **Already applied**.
  - Pending Migration 1: **`0008_ban_authority_and_concurrency.sql`** (verified via `npx wrangler d1 migrations list lop-10a7-db --remote`).
  - Pending Migration 2: **`0009_password_reset_tokens.sql`** (new in PRV6, verified applied on staging).
  - New Migrations in PRV8: **NONE (0 new migrations)**. RoomDO SQLite internal tables evolved within DO boundary.
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
    * Point-in-Time Recovery: Cloudflare D1 Time Travel point-in-time recovery retention is **up to 30 days on Workers Paid, up to 7 days on Workers Free**.

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
