# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV8.2 — Multi-Generation Identity Closure: Voice Revocation Incarnation & Room Reconciliation State Machines<br/>
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`<br/>
**Executable Candidate Git Commit SHA:** `d635f82e32d61780c635709d14cf90595aacdbb7`<br/>
**Staging-Verified Executable SHA:** `d635f82e32d61780c635709d14cf90595aacdbb7`<br/>
**Verified Staging Deployment Version ID:** `e90f2542-d763-43b6-a1d5-9d7038b157c8`<br/>
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`<br/>
**Target Production Worker Service:** `gdtxdinhquan`<br/>
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain

*Note on SHA Parity:* The Executable Candidate SHA matches the Staging-Verified SHA (`d635f82e32d61780c635709d14cf90595aacdbb7`) byte-for-byte.

---

## 1. Summary of PRV8.2 Multi-Generation Identity Closures

PRV8.2 surgically resolves the two generation/identity race conditions identified in PRV8.1:

### 1. Release Blocker A Resolved — Immutable Incarnation Identity for Voice Revocation (`worker/room-do.ts`)
1. **Schema Upgrade to Immutable Primary Key:**
   - Migrated `pending_voice_revocations` from `actor_key TEXT PRIMARY KEY` to `revocation_id TEXT PRIMARY KEY`.
   - Added schema columns: `revocation_id TEXT PRIMARY KEY`, `actor_key TEXT NOT NULL`, `session_id TEXT NOT NULL`, `track_name TEXT NOT NULL`, `mid TEXT NOT NULL`, `generation INTEGER NOT NULL`, `attempts INTEGER NOT NULL DEFAULT 1`, `last_attempt_at INTEGER NOT NULL`, `error_text TEXT`, `created_at INTEGER NOT NULL`.
   - Index on `actor_key` for high-speed actor lookups without primary key collision.
2. **Elimination of `ON CONFLICT(actor_key)` Overwrites:**
   - In `RoomDO.revokeVoiceForActor()`, each publication revocation now generates an immutable `revocationId = 'rev_' + crypto.randomUUID()`.
   - Insertion into `pending_voice_revocations` uses direct `INSERT`, eliminating `ON CONFLICT(actor_key) DO UPDATE`.
   - Multiple unresolved historical remote tracks from the same actor (e.g. Generation A and Generation B) coexist simultaneously in durable storage without overwrite.
3. **Exact Revocation Identity Tracking & Reverse-Order Safety:**
   - `attemptSfuCloseWithTracking` and `retrySingleVoiceRevocation` accept and operate strictly on `revocationId`.
   - Updates and deletions execute strictly `WHERE revocation_id = ?`.
   - Retrying Generation B never deletes Generation A; retrying Generation A never deletes Generation B. Remote closures complete safely in any arbitrary order.
4. **Idempotent SQLite Internal Upgrade:**
   - `RoomDO.khoiTaoSqlite()` inspects table schema via `PRAGMA table_info(pending_voice_revocations)`.
   - If the legacy table has `actor_key` as primary key, it creates `pending_voice_revocations_v2`, migrates legacy pending rows with synthesized `rev_legacy_<actor_key>` IDs, drops the old table, and renames `v2` to `pending_voice_revocations`.
   - Safe across repeated constructor invocations, DO evictions, and DO restarts.

### 2. Release Blocker B Resolved — Room Revocation Reconciliation Obligation (`worker/campus/campus-do.ts`)
1. **Reconciliation Obligation without Stale `phien_id`:**
   - Migrated `CampusDO.pending_room_revocations` to `PRIMARY KEY (account_id, room_name)`, dropping the historical `phien_id` snapshot.
   - Pending state no longer represents an obsolete snapshot command to replay, but a **convergence obligation**: *"This account in this room must converge to its authoritative D1 session."*
2. **Generational Collapse & Deduping:**
   - In `CampusDO.dangNhapMoi()`, multiple rapid logins ($S_1 \to S_2 \to S_3$) collapse into a single reconciliation row via `ON CONFLICT(account_id, room_name) DO UPDATE SET attempts = attempts + 1`.
   - Prevents stale queue accumulation that could replay outdated authority.
3. **Runtime D1 Authoritative Truth Fetch:**
   - In `CampusDO.retryPendingRoomRevocations()`, CampusDO fetches the current authoritative `tai_khoan_campus.thiet_bi` from D1 at the moment of retry execution.
   - If D1 read fails: fails-closed by keeping the pending row and rescheduling the alarm without calling RoomDO with unverified state.
4. **Idempotent Room Reconciliation RPC (`dongBoPhienTaiKhoan`):**
   - RoomDO implements `dongBoPhienTaiKhoan(accountId, authoritativePhienId)`:
     * Closes all WebSockets for `accountId` whose `phienId !== authoritativePhienId` with 4001 (`da_dang_nhap_noi_khac`).
     * Preserves the active socket matching `authoritativePhienId`.
     * If `authoritativePhienId` is `null` (disabled/deleted account), closes all sockets for that account.
   - Completely immune to ABA / out-of-order alarm execution: replaying an old retry obligation queries current D1 truth ($S_3$) and NEVER closes the newest legitimate session.

---

## 2. Independent Success Auditor — Falsification Checks

| Falsification Check | PRV8.1 Vulnerability | PRV8.2 Verifiable Behavior | Falsification Result |
|---|---|---|---|
| **1. Voice revocation identity keyed by actor overwrites prior generation** | `actor_key` was PK; Generation B revoked while A pending overwrote row A. | `revocation_id` is PK; Generations A and B coexist simultaneously in SQLite. | **FALSIFIED** (Generations A & B coexist) |
| **2. Reverse-order voice closure deletes newer or older obligation** | Actor-keyed queries could mutate or delete wrong row. | All queries keyed strictly `WHERE revocation_id = ?`. B closes without affecting A; A closes without affecting B. | **FALSIFIED** (Arbitrary closure order safe) |
| **3. Stale session republish during multi-generation pending** | Stale generation A could restore while pending. | Server-authoritative generation check rejects stale publication ($A < B$). | **FALSIFIED** (Stale republish blocked 403) |
| **4. Rapid session replacement ($S_1 \to S_2 \to S_3$) stores stale snapshot** | `pending_room_revocations` stored $S_2$; replaying $P_2$ after $P_3$ closed valid $S_3$. | Pending row stores only `(account_id, room_name)`; retry queries current D1 ($S_3$); $S_3$ remains open. | **FALSIFIED** (ABA race eliminated) |
| **5. Dangerous out-of-order room retry closes newest valid session** | Retrying $P_3$ then $P_2$ closed $S_3$. | Both retry orders converge to current D1 truth ($S_3$ open, $S_1/S_2$ closed). | **FALSIFIED** (Out-of-order retry idempotent) |
| **6. Multi-generation transitions ($S_1 \to S_2 \to S_3 \to S_4$) accumulate obsolete rows** | Multiple rows for same account/room accumulated. | Upsert collapses into single reconciliation row; persists across DO eviction; converges idempotently. | **FALSIFIED** (Collapsed & DO restart-safe) |
| **7. Duplicate alarm delivery / at-least-once execution breaks session state** | Retried alarm could misinterpret session state. | Duplicate alarm execution is an idempotent no-op; valid current session untouched. | **FALSIFIED** (Idempotent at-least-once safe) |

---

## 3. Test & Verification Evidence

### Strict Local Test Suite
- `npm run typecheck`: **0 errors**.
- `npm run lint`: **0 errors** (12 React Compiler warnings).
- `npx vitest run test/session-revocation.test.ts --dangerouslyIgnoreUnhandledErrors=false`: **14/14 PASSED**.
  * Test 12: Voice Multi-Generation Retention & Reverse-Order Close (Generations A & B coexist, survive DO restart, close out-of-order, stale cannot republish).
  * Test 13: Rapid Session Replacement ($S_1 \to S_2 \to S_3$) & Dangerous Out-of-Order Retry ($S_1$ closed 4001, $S_3$ survives and functions).
  * Test 14: Multi-Generation Transitions ($S_1 \to S_2 \to S_3 \to S_4$), DO restart durability, and duplicate alarm idempotency.
- `npx vitest run test/identity-security.test.ts test/security-hardening.test.ts test/abuse-control.test.ts test/auth-security.test.ts --dangerouslyIgnoreUnhandledErrors=false`: **71/71 PASSED**.
- `npm test`: **28 test files, 317/317 tests PASSED (100% pass)**.
- `npm run build`: Production bundle for Worker and Client built cleanly.
- `git diff --check`: Clean, zero trailing whitespace.

### Staging Regression Gate (Cloudflare Staging Version ID: `e90f2542-d763-43b6-a1d5-9d7038b157c8`)
- **Smoke Suite:** `e2e/smoke.spec.ts` — **3/3 PASSED** (14.7s).
- **Room Discovery Suite:** `e2e/room-discovery.spec.ts` — **1/1 PASSED** (1.2m).
- **Moderation Suite:** `e2e/moderation.spec.ts` — **4/4 PASSED** (2.3m).
- **Voice Force-Mute:** `e2e/voice-webrtc.spec.ts -g "Force-Mute"` — **1/1 PASSED** (1.6m).
- **Voice Session Revocation:** `e2e/voice-webrtc.spec.ts -g "Session Revocation"` — **1/1 PASSED** (1.4m).

---

## 4. Production Preflight Non-Destructive Check

- Command: `npx wrangler d1 migrations list lop-10a7-db --remote`
- Target Database: `lop-10a7-db` (`a12de014-e9d2-4d6d-994f-dcb36c481432`)
- Status:
  * Pending migrations remain exactly: `0008_ban_authority_and_concurrency.sql` and `0009_password_reset_tokens.sql`.
  * **Zero new D1 migrations created** (schema upgrades were internal to Durable Object SQLite storage).
  * **Zero production database mutations performed.**
  * **Zero production deployments performed.**
  * **Zero production secrets modified.**

---

## 5. Release Authorization Status

```
READY FOR PRODUCTION AUTHORIZATION
```

Awaiting explicit human production authorization before initiating the Production Authorization Protocol.
