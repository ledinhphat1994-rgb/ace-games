# Digital Campus v2 — Production Release Manifest

**Milestone:** PRV8.1 — Surgical Release Hotfix: SFU Exception Alarm & Durable Cross-DO Room Revocation Closure<br/>
**Release Candidate Branch:** `fix/moderation-safety-v1-closure`<br/>
**Executable Candidate Git Commit SHA:** `237525b410526fe9bb2ec10ee156d9beebf6f691`<br/>
**Staging-Verified Executable SHA:** `237525b410526fe9bb2ec10ee156d9beebf6f691`<br/>
**Verified Staging Deployment Version ID:** `72b7c695-81a3-4deb-809a-3db335ce8f6f`<br/>
**Verified Staging URL:** `https://gdtxdinhquan-v2.ledinhphat1994.workers.dev`<br/>
**Target Production Worker Service:** `gdtxdinhquan`<br/>
**Target Production Domain:** `gdtxdinhquan.workers.dev` / Custom Domain

*Note on SHA Parity:* The Executable Candidate SHA matches the Staging-Verified SHA (`237525b410526fe9bb2ec10ee156d9beebf6f691`) byte-for-byte.

---

## 1. Summary of PRV8.1 Hotfix Closures

PRV8.1 addresses exactly the two implementation mismatches confirmed by source inspection:

### 1. Gap 1 Resolved — SFU Voice Revocation Exception Path & Non-Deletion Invariant (`worker/room-do.ts`)
1. **Network Exception Alarm Scheduling:**
   - In `RoomDO.attemptSfuCloseWithTracking()`, thrown exceptions (e.g. network failure, fetch rejection, timeout exception, runtime exception) now update `pending_voice_revocations` attempts and last error, and **explicitly schedule a future Durable Object alarm** via `this.scheduleVoiceRevocationAlarm(tinhVoiceBackoffDelay(attempts))`.
   - Bounded exponential backoff policy: $1\text{s}, 2\text{s}, 4\text{s}, 8\text{s}, 16\text{s}, 32\text{s}$, capped at $60\text{s}$ (`Math.min(60000, 1000 * Math.pow(2, attempts - 1))`).
2. **Terminal-Condition Only Deletion (Never Delete at N Attempts):**
   - In `RoomDO.retrySingleVoiceRevocation()`, removed the clause that deleted rows when `attempts >= 5`.
   - Pending remote revocation rows are **NEVER deleted merely because an attempt counter reaches 5**.
   - Pending rows are only deleted upon authoritative terminal confirmation from Cloudflare Calls SFU: HTTP 200 OK (closed) or HTTP 404/410 (track already gone).
   - For attempts $\ge 5$, the system retains the durable row, emits an operational warning `[OPERATIONAL_ALERT]`, and continues retrying at the capped interval ($60\text{s}$).
3. **Crash-Safe Transactional Storage Transition:**
   - In `RoomDO.revokeVoiceForActor(actorKey)`, the local publication deletion (`voice_publications`) and remote pending insertion (`pending_voice_revocations`) are atomically bound inside `this.ctx.storage.transactionSync(() => { ... })`.
   - No external HTTP calls are performed inside the synchronous storage transaction. Local publication authority is completely revoked and pending remote revocation metadata is committed to SQLite before initiating the external SFU call.

### 2. Gap 2 Resolved — Durable Cross-DO Room Revocation State Machine (`worker/campus/campus-do.ts`)
1. **Durable SQLite Table in CampusDO:**
   - Created table `pending_room_revocations (account_id INTEGER, room_name TEXT, phien_id TEXT, attempts INTEGER, last_attempt_at INTEGER, error_text TEXT, PRIMARY KEY(account_id, room_name))`.
2. **Persistent Alarm Retries:**
   - In `CampusDO.dangNhapMoi()`, replaced the unpersisted 3-attempt `waitUntil` loop with insertion into `pending_room_revocations` and scheduling `this.scheduleRoomRevocationAlarm(1000)`.
   - `CampusDO.alarm()` implements bounded backoff retry (`tinhRoomBackoffDelay(attempts)`, capped at 60s) for all failed room revocations.
   - Deletion occurs ONLY upon authoritative RPC confirmation (`huyPhienCu` returns `{ ok: true }`).
   - If attempts $\ge 5$, the row remains persisted and emits `[OPERATIONAL_ALERT]`.
   - Survives DO eviction/restart: CampusDO constructor queries `pending_room_revocations` on boot and reschedules alarms if pending rows remain.
3. **Passive Stale Socket Eviction:**
   - Even if a stale WebSocket in RoomDO sends no mutating commands, proactive revocation continuously retried via CampusDO alarm contacts RoomDO once connectivity recovers, evicting the passive socket with 4001 and stopping all future broadcast reception.

---

## 2. Independent Success Auditor — Falsification Checks

| Falsification Check | PRV8 Vulnerability | PRV8.1 Verifiable Behavior | Falsification Result |
|---|---|---|---|
| **1. Network THROW during SFU close leaves no scheduled retry** | Catch block updated DB and returned `{ ok: false }` without `scheduleAlarm`. | Thrown exceptions catch block calls `scheduleVoiceRevocationAlarm(tinhVoiceBackoffDelay(attempts))`. | **FALSIFIED** (Alarm scheduled on throw) |
| **2. Retry threshold silently deletes unresolved remote-track metadata** | `if (attempts >= 5) DELETE ...` deleted row. | Row is retained indefinitely with capped 60s retry; logged as `[OPERATIONAL_ALERT]`. | **FALSIFIED** (Row preserved indefinitely) |
| **3. Crash between local publication deletion and pending persistence** | Unprotected sequential storage operations. | Bound atomically inside `this.ctx.storage.transactionSync(...)`. | **FALSIFIED** (Atomic SQLite transition) |
| **4. RoomDO restart loses pending voice close** | Pending rows survived restart in PRV8, but exceptions didn't schedule alarm on reboot. | RoomDO initialization queries `pending_voice_revocations` and schedules alarm on boot. | **FALSIFIED** (Resumed on DO boot) |
| **5. CampusDO restart loses pending room revocation** | CampusDO had no persistent table; retried 3 times in `waitUntil` then dropped. | Persisted in `pending_room_revocations`; CampusDO constructor queries table on boot. | **FALSIFIED** (Durable cross-DO persistence) |
| **6. 3 failed RoomDO RPCs permanently stop proactive revocation** | Stopped permanently after 3 `waitUntil` attempts. | CampusDO alarm continues retrying with bounded backoff until authoritative 200/OK. | **FALSIFIED** (Continuous alarm retry) |
| **7. Passive stale socket continues receiving room broadcasts indefinitely** | Tier-2 D1 check only guarded mutations; passive socket kept receiving broadcasts. | CampusDO alarm retries `huyPhienCu`; RoomDO closes passive socket with 4001; broadcasts blocked. | **FALSIFIED** (Passive socket server-closed 4001) |
| **8. Strict test runner suppression reappears** | `dangerouslyIgnoreUnhandledErrors` might be re-added. | Verified absent; all 314 tests pass with strict `--dangerouslyIgnoreUnhandledErrors=false`. | **FALSIFIED** (0 suppression, 314/314 strict) |

---

## 3. Test & Verification Evidence

### Strict Local Test Suite
- `npm run typecheck`: **0 errors**.
- `npm run lint`: **0 errors** (12 React Compiler warnings).
- `npx vitest run test/session-revocation.test.ts --dangerouslyIgnoreUnhandledErrors=false`: **11/11 PASSED**.
  * Test 8: Thrown network exception during SFU close schedules alarm, survives DO restart, clears on 200 OK.
  * Test 9: Retry exhaustion (>5 failures) preserves metadata, maintains alarm, blocks stale republish, clears on recovery.
  * Test 10: Passive stale room socket evicted with 4001 via CampusDO alarm retry after initial RPC outage; broadcasts blocked.
  * Test 11: Pending room revocations in CampusDO survive DO restart and clear when RoomDO recovers.
- `npm test`: **28 test files, 314/314 tests PASSED (100% pass)**.
- `npm run build`: Production bundle for Worker and Client built cleanly.
- `git diff --check`: Clean, zero trailing whitespace.

### Staging Regression Gate (Cloudflare Staging Version ID: `72b7c695-81a3-4deb-809a-3db335ce8f6f`)
- **Smoke Suite:** `e2e/smoke.spec.ts` — **3/3 PASSED** (19.8s).
- **Room Discovery Suite:** `e2e/room-discovery.spec.ts` — **1/1 PASSED** (1.4m).
- **Moderation Suite:** `e2e/moderation.spec.ts` — **4/4 PASSED** (2.1m).
- **Voice Force-Mute:** `e2e/voice-webrtc.spec.ts -g "Force-Mute"` — **1/1 PASSED** (1.1m).
- **Voice Session Revocation:** `e2e/voice-webrtc.spec.ts -g "Session Revocation"` — **1/1 PASSED** (1.7m).

---

## 4. Production Preflight Non-Destructive Check

- Command: `npx wrangler d1 migrations list lop-10a7-db --remote`
- Result:
  ```
  Migrations to be applied:
  ┌────────────────────────────────────────┐
  │ Name                                   │
  ├────────────────────────────────────────┤
  │ 0008_ban_authority_and_concurrency.sql │
  ├────────────────────────────────────────┤
  │ 0009_password_reset_tokens.sql         │
  └────────────────────────────────────────┘
  ```
- **Zero production mutations performed.**
- **Zero production deployments performed.**
- **Zero production secrets modified.**
- **Status:** READY FOR PRODUCTION AUTHORIZATION PROTOCOL.
