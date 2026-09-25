# Digital Campus v2 — Production Release Manifest

## Active Production Release: Game Arena 1v1 Hardening

**Milestone:** Game Arena 1v1 — RoomDO hibernation state reload, server-enforced turn timer, table authority<br/>
**Release Candidate Branch:** `main`<br/>
**Released Git Commit SHA:** `f0822fce91d84420d036b088445b874238175b15`<br/>
**Source Pull Request:** [#26](https://github.com/ledinhphat1994-rgb/lop-10a7/pull/26) (commits `074915f`, `b5623db`)<br/>
**Target Production Worker Service:** `gdtxdinhquan`<br/>
**Production URL:** `https://gdtxdinhquan.ledinhphat1994.workers.dev`<br/>
**Release Date:** `2026-09-25`<br/>
**Active Production Version ID:** `63d49033-5c9f-4787-af7b-65a4b1501a7e`<br/>
**Cloudflare Version Message:** `release:f0822fce91d84420d036b088445b874238175b15`<br/>
**Rollback Baseline Version ID:** not captured before this deploy — see section 4.

---

### 1. Release Classification & Gates

- **Release Category:** Category A (Runtime Worker + Workers Static Assets only; this release adds no database migrations).
- **Gate A (Pre-Deploy Verification):** **PASS**
  * Local quality gates on the PR #26 tree: `npm run typecheck` 0 errors, `npm run lint` 0 errors, `npm test` 934/934, `npm run build:bundle` OK, `git diff --check` clean.
  * Release guard (`scripts/guard-production-release.mjs`): PASS — `HEAD` (`f0822fc`) == `origin/main`, clean working tree.
  * Core D1 (`lop-10a7-db`): `wrangler d1 migrations list lop-10a7-db --remote --config wrangler.production.jsonc` reported "No migrations to apply" (migrations 0018–0020 were already present in production).
  * Analytics D1 (`lop-10a7-analytics`): no new analytics migrations exist in the repository since U2; not re-listed for this release.
- **Gate B (Controlled Production Deploy):** **DONE**
  * Command: `npm run deploy:production` (release guard → `npm run build` → `wrangler deploy --config wrangler.production.jsonc --message release:<SHA>`).
  * Static assets: 73 files read from `dist/client`, 4 new or modified files uploaded.
  * Bindings reported by Wrangler: D1 `lop-10a7-db`, D1 `lop-10a7-analytics`, KV `e2529ac570cb4d77a246f38953dcbc9f`, R2 `lop-10a7-anh`, `ENVIRONMENT = "production"`.
  * Database mutation: 0 migrations applied in this release.
- **Post-Deploy Smoke:** **NOT YET CONFIRMED** at the time this manifest was written. To confirm:
  * `/api/whoami` without a session returns 401 JSON.
  * Two accounts play one Caro table: a move made after more than 15 seconds of silence is accepted; letting the turn timer run out makes the player on turn lose.
  * A study room host can still control the video after the room has been idle for a while.

---

### 2. Summary of Deliverables (PR #26)

- **RoomDO hibernation reload (platform fix):** `webSocketMessage`, `webSocketClose` and `webSocketError` now reload state from SQLite before handling a message. Before this, a Durable Object woken from WebSocket hibernation ran on default state: game moves were rejected after ~10 seconds of thinking, a spectator's join could overwrite a live game, and study room hosts could lose video control. Game tables also persist `game_room_id` / `room_name`.
- **Game Arena 1v1 rules (server-authoritative):** the turn timer is enforced by the RoomDO alarm (timeout = loss, 1 s grace, late moves refused); `game.init` / `game.rematch` / `game.join` are restricted to the right players and states; a rematch needs both players and alternates who moves first; emotes are a fixed list with a rate limit; Reversi scores are piece counts.
- **Board UI:** end reasons, rematch offer/accept, "Đã rời bàn" presence, live spectator count, server-clock countdown badge, Reversi legal-move hints and pass notice, full Connect 4 columns disabled.

---

### 3. Release Notes & Known Gaps

- This manifest previously recorded only U2 (`fa60575`). Production D1 already contained migrations 0018–0020 (added after U2) when this release was deployed, so production changed after U2 without being recorded here.
- Staging `gdtxdinhquan-v2` version `a0f03755-2f10-415f-a8df-5e94511ede86` was deployed from a working tree that still contained uncommitted files (`public/game-rpg/`, `game-rpg/`, `shared/games/chess/`, `shared/games/xiangqi/`). That staging build is therefore **not** identical to `main`. The production deploy ran on a clean tree (release guard PASS) and does not contain those files.
- Governance and storage-isolation status (R2 isolation, file access authorization) was last recorded at U2 — see the U2 archive below.

---

### 4. Emergency Rollback Command

List recent versions to find the one before `63d49033-5c9f-4787-af7b-65a4b1501a7e`, then roll the Worker back to it:

```bash
npx wrangler deployments list --config wrangler.production.jsonc
npx wrangler rollback <PREVIOUS_VERSION_ID> --config wrangler.production.jsonc -y -m "Rollback Game Arena 1v1 release"
```

This release has no migrations, so a rollback only affects the Worker; D1 stays as is.

---

## Historical Release Archive

- **Milestone U2 (2026-09-21):** Release evidence, governance status and rollback record preserved in [docs/releases/2026-09-21-u2.md](docs/releases/2026-09-21-u2.md).
- **Milestone PRV8.2 (2026-09-19):** Full release evidence, migration records, and canaries preserved in [docs/releases/2026-09-19-prv8.2.md](docs/releases/2026-09-19-prv8.2.md).
