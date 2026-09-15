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
│  • Observability & Health                                              │
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
