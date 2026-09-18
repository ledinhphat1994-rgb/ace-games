# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV7 — Transactional Reset Commit + Global Session Revocation Closure
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`
**Documentation HEAD Git Commit SHA:** Will be populated on commit (documentation only)
**Executable Candidate Git Commit SHA:** `0d27848b931376bf06e3dff4dc3883a7eea40b1b`
**Staging-Verified Executable SHA:** `0d27848b931376bf06e3dff4dc3883a7eea40b1b`
**Verified Staging Deployment Version ID:** `27fa35a5-bce8-4f8a-a889-3ac68bc8a6f0`
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`
**Target Production Worker Service:** `gdtxdinhquan`
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain  

*Note on SHA Parity:* Executable Candidate SHA matches the Staging-Verified SHA (`0d27848b931376bf06e3dff4dc3883a7eea40b1b`) byte-for-byte. The Documentation HEAD differs from the Executable Candidate SHA solely by updates to documentation files (`PRODUCTION_RELEASE_MANIFEST.md`), with zero executable code or configuration diffs.

---

## 1. Code Delta from `origin/main`

- **Branch Range:** `origin/main..0d27848` (13 commits)
- **Key Modules & Enhancements:**
  - `worker/routes/auth.ts`:
    - **Blocker 1 Resolved — Atomic D1 Batch Transaction (`env.DB.batch`)**:
      * Converted credential update and token consumption into a single atomic D1 SQL transaction.
      * Statement 1 (`UPDATE tai_khoan_campus`): Updates `mat_khau_hash`, `salt`, `iterations`, and new `thiet_bi` session marker with an explicit SQL `EXISTS` subquery verifying the exact token row is `status = 'active'`, `attempts < max_attempts`, and unexpired.
      * Statement 2 (`UPDATE password_reset_tokens`): Conditionally transitions status to `'consumed'` with `consumed_at = now`.
      * Strict assertion: Both statements MUST return `meta.changes === 1`. If either statement fails or a constraint/trigger aborts, D1 rolls back the entire batch atomically. Verified via SQLite trigger fault-injection test (`test/session-revocation.test.ts`).
    - **Blocker 2 Coordination**: `quenMatKhau` awaits `CampusDO.dangNhapMoi` to trigger cross-system session eviction across all registered WebSockets and voice media tracks.
  - `worker/campus/campus-do.ts`:
    - Added durable SQLite table `phong_tai_khoan (account_id, room_name, phien_id, updated_at)` and in-memory registry `phongCuaTaiKhoan: Map<number, Set<string>>`.
    - Added RPC methods `dangKyPhong(accountId, roomName, phienId)` and `roiPhong(accountId, roomName)`.
    - `dangNhapMoi` now proactively closes Campus WebSockets with code `4001` AND invokes `RoomDO.huyPhienCu(accountId, currentPhienId)` across all rooms registered to that account.
  - `worker/room-do.ts`:
    - Added `phienId` to `AttachmentKetNoi` and WebSocket connection tags (`[theTaiKhoan(accountId), 'phien:' + phienId]`).
    - Added `revokeVoiceForActor(actorKey)` which cleans up voice registry/SQLite state and calls Cloudflare Calls SFU `/sessions/:id/tracks/close` upstream.
    - Added `huyPhienCu(accountId, currentPhienId)` which closes matching stale WebSockets with code `4001` (`da_dang_nhap_noi_khac`) and automatically revokes active voice publications.
    - Added **Tier 2 In-Flight Session Validation**: On every incoming `webSocketMessage`, validates `att.phienId` against cached D1 `thiet_bi` (5s TTL cache). Stale sockets are immediately force-closed with code `4001`, their voice tracks revoked, and messages dropped.
    - Added HTTP internal endpoint `/internal/session/revoke`.
  - `worker/index.ts`:
    - In `vaoPhong` and `vaoPhongGame`: sets `X-Actor-Phien-Id`, `X-Room-Id`, and registers room membership with `CampusDO.dangKyPhong` (works independently of `/ws/campus`).
  - `test/session-revocation.test.ts`:
    - 5 dedicated tests verifying: (1) D1 Batch transactional rollback with SQLite trigger fault-injection, (2) Global WebSocket session revocation (Campus + Study Room + Game Room), (3) Direct Room connection without Campus WS, (4) Multi-room simultaneous revocation, (5) Active voice publication and registry eviction. All 5 pass 100%.
  - Full local test suite: **28 test files, 308/308 tests PASSING (100% pass)**.
  - Staging verification: 100% PASS on live Cloudflare Workers staging deployment (`27fa35a5-bce8-4f8a-a889-3ac68bc8a6f0`).

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
