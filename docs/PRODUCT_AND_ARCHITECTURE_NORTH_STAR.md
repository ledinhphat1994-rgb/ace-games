# Digital Campus — Product & Architecture North Star

> **Authoritative Context Document**
> This document defines the permanent product identity, core loop, architecture model, and development priorities of Digital Campus. Every contributor and AI agent must read and adhere to this North Star before designing or implementing any substantial feature.

---

## 1. Product Identity

Digital Campus is **NOT** merely:
- A class website
- A Learning Management System (LMS)
- A Study Room application
- A game portal

**Digital Campus is a REALTIME INTERACTION PLATFORM.**

Its purpose is to let users:
- Discover people and live activities
- See who is online in real-time
- Join shared realtime spaces with minimal friction (1–2 actions)
- Study together collaboratively
- Watch media together with synchronized state
- Play multiplayer games in real-time
- Chat, express, and communicate
- Collaborate on shared canvases, notes, and documents
- Participate in rich community experiences
- Host and join new realtime activities as the platform expands

The school/class community represents the **initial community**, **not the architectural ceiling** of the platform. The system is designed to support multiple classes, school-wide spaces, and broader educational or community networks.

---

## 2. Product Goal & Core Loop

The product must become useful, reliable, and enjoyable enough that users **genuinely want to return every day**.

### The Core Loop
```text
Open Campus
    ↓
Discover people & live activities
    ↓
Join in 1–2 actions
    ↓
Realtime interaction (study, watch, play, chat)
    ↓
Social value & useful experience
    ↓
Return again tomorrow
```

**Guiding Metric:** Optimize for **daily retention and meaningful connection**, not raw feature count.

---

## 3. Platform Architecture Principles

### The Platform Model
```text
┌────────────────────────────────────────────────────────────────────────┐
│                      DIGITAL CAMPUS PLATFORM CORE                      │
│                                                                        │
│  • Identity & Accounts          • Permissions & Scope                  │
│  • Realtime Presence            • Moderation & Safety                  │
│  • Social Graph                 • Realtime Transport (DO / WebSocket)  │
│  • Discovery & Lobby            • Notifications                        │
│  • Rooms & Session Membership   • Media & File Upload Gate             │
│  • Progression & Achievements   • Observability & Health               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌──────────────┬─────────────┼──────────────┬──────────────┐
       ▼              ▼             ▼              ▼              ▼
 ┌───────────┐  ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐
 │   Study   │  │   Watch   │ │   Games   │  │Whiteboard │  │   Voice   │
 │   Rooms   │  │ Together  │ │   Arena   │  │ & Collab  │  │ & Audio   │
 └───────────┘  └───────────┘ └───────────┘  └───────────┘  └───────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │ Future Realtime Activities│
                      └───────────────────────────┘
```

### Architectural Question for Every New Feature
Before adding code, ask:
1. **Is this a reusable Platform capability?** (e.g., presence, room admission, user profiles, notifications, reporting, token authentication).
2. **Or is this an Activity-specific logic?** (e.g., YouTube playback sync, chess move validation, whiteboard stroke rendering).

> **Rule:** Never duplicate Platform responsibilities inside individual Activities. Keep Activities thin and decoupled from Core governance.

---

## 4. Identity & Authorization Invariants

The platform strictly enforces the separation of user identities, memberships, and roles:

```text
Account  ≠  Class Membership  ≠  Room Membership  ≠  Activity Role
```
and:
```text
Host  ≠  Moderator  ≠  Teacher  ≠  School Admin
```

### Practical Invariants
- **Class membership is not global identity:** A student registered in Class A can participate in school-wide activities, join cross-class game lobbies, and interact in the campus hall. Never use class membership as an account identifier.
- **Teacher authority is scoped:** A teacher has moderation and pedagogical authority over their assigned classes, but entering a room does not automatically strip the original room creator of host capabilities.
- **Dynamic roles:** A user may be the `Host` in a study room they created, a `Player` in a game table, and a normal `Member` in the main campus lobby.
- **Server authority:** Client-side role claims are never trusted; permissions are always evaluated server-side upon request admission and WebSocket upgrades.

---

## 5. Realtime Data Responsibilities

Each storage and compute layer has distinct, non-negotiable responsibilities:

| Layer | Primary Role | Invariants |
| :--- | :--- | :--- |
| **Durable Objects (DO)** | Hot realtime authority, WebSocket hibernation, serialized state transitions, low-latency shared state. | Single source of truth for in-flight room membership, game boards, video sync, presence broadcast. |
| **D1 Database** | Canonical persistent relational state. | Accounts, class rosters, room definitions, governance records, bans (`phong_ban`), high scores. |
| **KV Namespace** | Best-effort cache and ephemeral rate limiting. | **KV must NEVER be authoritative for correctness or security decisions** requiring strong consistency. |
| **R2 Storage** | Uploaded media, slide decks, avatars, attachments. | Files must pass strict content and MIME validation before storage. |
| **Shared Protocol** | Typed contracts (`shared/protocol/`). | All client-server packets are typed, validated, and versioned. |

### Authority Rules
The server remains strictly authoritative for:
- Admission & Room Access (passwords, bans, scope checks)
- Permissions & Moderation actions
- Multiplayer game state & win/loss outcomes
- Protected collaborative mutations

---

## 6. Product Quality Order

When building features, always prioritize in this exact sequence:

```text
1. Correctness & Trust
       ↓
2. Real Functionality
       ↓
3. Reliability & Reconnect
       ↓
4. UX & Accessibility
       ↓
5. Performance & Scale
       ↓
6. Visual Polish & Delight
```

> **A beautiful fake control is NOT a completed feature.**
>
> - **Voice** means real media transmission via WebRTC/audio streams, not an animated microphone icon.
> - **Watch Together** means real synchronized player state across independent clients with drift correction.
> - **Multiplayer** means independent clients deterministically converge on identical game states.
> - **Leaderboard** means scores are server-authoritative and verified, not client-reported.

---

## 7. Progression, Mastery & Achievement Framework

Progression is a **PLATFORM CORE** capability, not an ad-hoc gamification layer sprinkled onto individual pages. Digital Campus must make meaningful activity feel recognized and foster a genuine long-term sense of growth and belonging.

### Core Progression Principle
- **Reward meaningful engagement:** Celebrate real learning, synchronized collaboration, verified multiplayer competition, and constructive community contributions.
- **Never reward fake metrics:**
  - ❌ DO NOT reward raw clicks or button presses.
  - ❌ DO NOT reward chat spam or flood.
  - ❌ DO NOT reward page refreshes or route toggles.
  - ❌ DO NOT reward idle/passive background presence.
  - ❌ DO NOT reward client-reported results or unverified self-claims.

---

### Five Distinct Progression Concepts

To preserve integrity and healthy psychology, the platform strictly separates five distinct concepts:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   FIVE SEPARATE PROGRESSION SYSTEMS                    │
│                                                                        │
│ 1. GLOBAL CAMPUS XP / LEVEL  ── Lifetime holistic engagement           │
│ 2. ACTIVITY MASTERY          ── Depth of experience in one activity   │
│ 3. COMPETITIVE SKILL RATING  ── Skill assessment (Glicko-2 / TrueSkill)│
│ 4. REPUTATION                ── Trustworthiness & community safety     │
│ 5. ACHIEVEMENTS & TITLES     ── Permanent milestones & cosmetic badges │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Global Campus XP / Level (Holistic Lifetime Engagement)
- **Nature:** Lifetime, cumulative progression that reflects overall active citizenship across Digital Campus.
- **Invariants:**
  - Never decreases upon losing a game or failing a challenge.
  - Does NOT represent competitive skill or leaderboard dominance.
  - Does NOT reset each season (permanent user equity).
  - Earned **strictly** through server-verified, completed domain milestones.
- **Eligible sources:**
  - Verified Study session completion (e.g. focused session with active notes/whiteboard).
  - Verified Watch Together session participation (synchronized co-watching).
  - Verified multiplayer match completion (independent of win/loss).
  - Verified collaborative milestone (e.g. shared document or problem-solving).
  - Community contribution accepted by teacher/moderator.
  - Exploration across diverse Platform Activities.

> **Global XP ≠ Competitive Rating.** A user who studies 100 hours may have high Global Level, but a beginner rating in Chess.

#### B. Activity Mastery (Activity-Specific Depth)
Each Activity maintains its own dedicated mastery track, allowing specialists to advance without warping global stats:
- **Study Mastery:** Focus depth, completed problem sets, verified group review milestones.
- **Watch Together Mastery:** Curated educational media participation, shared discussion engagement.
- **Caro / Reversi / Chess Mastery:** Total verified matches played, diverse opponent encounters.
- **Whiteboard Mastery:** Diagramming, presentation, collaborative sketching.

> **Activity Mastery measures experience in that specific Activity; it does not replace or conflate with Global Level.**

#### C. Competitive Skill Rating (Server-Authoritative Skill)
Competitive rank measures demonstrated skill against peers under fair rules:
- **Separation of Concerns:** Competitive Rating MUST be completely separate from XP and match count.
- **Mathematical Foundations:**
  - For verified 1v1 games (Caro, Reversi, Chess): use established rating systems such as **Glicko-2** (with ratings, rating deviations, and volatility).
  - For future team/multiplayer activities: evaluate multi-party rating algorithms (e.g. **TrueSkill** or **OpenSkill**) rather than forcing Glicko-2 onto non-1v1 formats.
  - **Never invent:** `games played = rank` or `XP = competitive skill`.
- **Rating Dynamics:** Rating dynamically increases on victories and decreases on defeats based on opponent rating.
- **Presentation Tiers:** Display tiers (Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster) are mathematical projections of underlying rating distribution, never engagement milestones.

#### D. Reputation (Community Trust & Constructive Behavior)
- **Nature:** Measures trustworthiness, helpfulness, and safety within the school community.
- **Invariants:**
  - Completely distinct from XP, Level, Competitive Rating, and Admin/Teacher roles.
  - **Reputation is NEVER an authorization role** (having high reputation does not grant teacher, moderator, or host powers).
  - Must be engineered with anti-abuse safeguards: strictly resistant to reciprocal upvote farming, sockpuppeting, and spam rings.

#### E. Achievements & Cosmetic Titles (Permanent Milestones)
- **Achievements:** Permanent, non-transferable milestones that reward specific feats across diverse categories:
  - *Progress:* First study room joined, 50 hours of verified study, 10 distinct activities explored.
  - *Skill:* Reaching Platinum rating in Caro, flawless match under time pressure.
  - *Collaboration:* Hosting a study session with 5+ active participants, joint whiteboard completion.
  - *Consistency:* Regular study participation across consecutive weeks.
  - *Exploration:* Trying all available campus activities.
  - *Community & Fair Play:* Zero moderation flags across an entire semester.
- **Cosmetic Titles:** Unlocked by achievements (e.g., `"Focused Mind"`, `"Study Buddy"`, `"Campus Veteran"`).
  - **Invariant:** A Title is purely cosmetic flair. It carries **ZERO permission or administrative authority**.

---

### 8. Verified Event Architecture

Activities **MUST NEVER** directly grant arbitrary XP, rating, or achievements.

#### Conceptual Event Pipeline
```text
┌────────────────────────┐
│    Activity Domain     │ (e.g. Study Room, Game Table, Watch Together)
│  (Hot Realtime State)  │
└───────────┬────────────┘
            │ Emits verified completion event (server-authoritative)
            ▼
┌────────────────────────┐
│    Progression Core    │  • Validates caller authority & authenticity
│    (Platform Engine)   │  • Checks event idempotency key (deduplication)
└───────────┬────────────┘  • Applies anti-farming rate caps & cooldowns
            │
            ├───────────────┬───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
      │ Global XP │   │ Activity  │   │Compet.    │   │Achievement│
      │  & Level  │   │  Mastery  │   │  Rating   │   │  & Title  │
      └───────────┘   └───────────┘   └───────────┘   └───────────┘
```

#### Event Invariants
1. **Server-authoritative:** Events are emitted ONLY by server runtimes (Durable Objects or authenticated Workers), never client payloads.
2. **Idempotent:** Every event payload carries a unique `idempotency_key` (e.g., `match:<id>:settled`, `study:<sessionId>:milestone:<n>`). Duplicate delivery MUST NOT award progression twice.
3. **Strict client firewall:** Client API requests must **NEVER** be permitted to submit mutations such as:
   - `"give me 100 XP"`
   - `"set my level to 15"`
   - `"unlock achievement X"`
   - `"my rating is 1850"`

---

### 9. Anti-Farming & Healthy Retention Rules

#### Anti-Farming Policies
- **Diminishing returns & caps:** Repeated low-value actions experience aggressive diminishing returns or daily caps.
- **No spam progression:** Chat messages, room enter/leave toggles, button clicks, page reloads, and idle presence receive ZERO XP.
- **Meaningful completion over volume:** A single high-focus, completed 45-minute study session holds vastly greater value than 20 superficial room joins.
- **Versioned progression policy:** Progression formulas and reward tables are versioned and calibrated against empirical product usage, not static arbitrary guesses.

#### Healthy Long-Term Retention (Anti-Dark Patterns)
- **Zero punitive decay for absence:** Digital Campus is a supportive educational platform. A user who is sick or takes a weekend off must never return to lost XP, demoted levels, or vanished achievements.
- **Positive streaks:** Streaks may offer modest recognition for regular habits, but must never threaten users with catastrophic loss or induce toxic anxiety.
- **Primary motivation:** Users should return because they want to connect with friends, study with peers, and enjoy real activities—not to avoid a punitive countdown timer.

---

### 10. Activity Acceptance Rule

Before any new Activity (Study, Watch, Game, Whiteboard, Voice, etc.) is considered **product-complete**:
1. Its design must answer: **"What meaningful progress can the user achieve through this Activity?"**
2. Real functionality must precede gamification: **DO NOT implement progression or XP hooks before the Activity has a real, server-verifiable completion event.** Real mechanics come first; rewards follow.

#### 10.1 Activity Verified Event Contract: `watch.session.completed` (Design Specification)

As part of Phase 1 (Real Watch Together), we formally define the future event contract without awarding XP or modifying database tables.

- **Event Name:** `watch.session.completed`
- **Emitted By:** Server-authoritative `RoomDO` (never client-reported).
- **Payload Schema Concept:**
  ```ts
  interface WatchSessionCompletedEvent {
    idempotencyKey: string;          // e.g. "watch:<roomId>:<videoId>:<sessionNonce>"
    roomId: string;
    videoId: string;
    videoDurationSec: number;
    watchDurationSec: number;        // Continuous synchronized watch elapsed time
    startedAt: number;              // Epoch ms
    endedAt: number;                // Epoch ms
    participantCount: number;       // Number of concurrent synchronized participants
    participantUserIds: number[];    // Verified campus user IDs
    averageDriftSec: number;        // Measured peer synchronization drift
  }
  ```
- **Prerequisite Verification Evidence Required (Before any future reward eligibility):**
  1. **Minimum Meaningful Watch Duration:** At least 5 continuous minutes (or $\ge 80\%$ of shorter educational videos) of active playback.
  2. **Multi-User Co-presence:** Minimum $\ge 2$ unique authenticated participants actively connected and synchronized throughout the window.
  3. **Verified Convergence:** Participants must maintain synchronized playback with average drift $\le 2.0$s (confirmed via server authoritative media state).
  4. **Anti-Idle & Anti-Farming Guard:** Zero XP for tab backgrounded/muted with no interaction, zero XP for pause-farming, zero XP for looped 5-second clips.
  5. **Strict Idempotency:** The `idempotencyKey` prevents duplicate settlement if a room experiences network reconnection or multiple room splits.
- **Progression Policy Invariant:** In Phase 1, **NO XP tables exist, NO XP values are awarded, and NO progression state is mutated**. This contract serves as the architectural foundation for subsequent progression integration.


---

## 11. Database Migration & Schema Evolution Policy

The integrity of canonical relational data in D1 is paramount:
1. **Applied migrations are immutable:** Once a migration has been applied to staging or production, its file in `migrations/` must NEVER be edited, modified, or re-run.
2. **Sequential numbered migrations:** Any schema enhancement, new table, or column change must be introduced via a new sequentially numbered migration file (e.g., `migrations/0006_...sql`).
3. **Data preservation gate:** Never use `DROP TABLE` or destructive column removal on tables containing user identity, governance, security, or relational history (`tai_khoan_campus`, `phong_ban`, `phong`, `lop`, etc.) without:
   - Documented backup strategy.
   - Verified data migration / backfill script.
   - Pre-deployment verification and rollback contingency.
