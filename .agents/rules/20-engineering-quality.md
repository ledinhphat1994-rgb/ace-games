# Digital Campus v2 — Engineering Quality & Stability Standards

> **Architecture, Correctness & Data Integrity Guidelines**

---

## 1. Architectural Simplicity & Clean Contracts
- Clear separation between edge routing (Hono API in `worker/`), hot realtime state (Durable Objects), and persistent canonical storage (D1).
- All shared messages and payloads must adhere to strictly typed TypeScript interfaces in `shared/protocol/`.
- Avoid over-engineered abstractions; keep data flows direct, traceable, and debuggable.

## 2. Single Source of Truth & State Convergence
- Client state (notifications, unread badges, presence, active room state) must faithfully reflect and converge to server truth (D1/DO).
- No speculative, permanent client-side state mutations that conceal backend errors.
- Never show optimistic success before backend verification for critical security or identity changes (e.g. password updates, room admissions).

## 3. Deterministic Testing & High Coverage
- Unit and simulation suites (Vitest running on Cloudflare Workers pool) must execute deterministically without flaky timers or race conditions.
- Test both sunny-day paths and adversarial edge cases (concurrency races, double-submits, network dropouts, rate limit violations).
- Every bug fix must include a regression test proving the failure scenario is permanently resolved.

## 4. Bounded State & Resource Guardrails
- In-memory event buffers, traces, and WebSocket histories must enforce hard upper limits (e.g., input trace capped at 2,000 events, campus chat limited to rolling 15-minute window).
- Prevent memory leaks by cleaning up listeners, timers, and WebRTC peer connections upon unmount or room exit.

## 5. Explicit Error Handling (No Silent Swallowing)
- API errors must surface actionable, friendly messages to the user and log structured diagnostics on the server.
- Never silently swallow exceptions or catch errors with empty handlers.
