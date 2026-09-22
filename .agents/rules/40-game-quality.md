---
trigger: always_on
---

# Digital Campus v2 — Game Quality & Verification Standards

> **Gaming Arena Quality & Architecture Constitution**
> The Digital Campus Game Arena provides engaging, modern, high-performance web games for students. Games represent a core social and recreational pillar of the platform.

---

## 1. Engine & Technology Direction
- **Phaser as Primary 2D Direction:** Game development must use the repository-pinned current Phaser major, currently Phaser 4.x / package version 4.2.1. It is the authoritative standard for 2D arcade, board, puzzle, and platform experiences in Digital Campus, ensuring deterministic scene management, asset preloading, canvas/WebGL fallback, and rich plugin ecosystems. Never downgrade to Phaser 3 APIs or documentation without an explicit migration decision. Future research should use documentation matching the installed major.
- **3D & Next-Gen Exploration:** Where 3D brings tangible educational or gameplay value, Three.js, Babylon.js, or raw WebGPU may be leveraged.
- **Progressive Enhancement:** Implement WebGPU with progressive enhancement and graceful WebGL2/Canvas fallbacks to guarantee high frame rates across low-power mobile devices and Chromebooks.

## 2. Polished Gameplay Over Quantity
- Prioritize depth, crisp controls, game feel, and visual charm over a high quantity of shallow games.
- Every game must feel rewarding within 5 seconds of launch: clear mechanics, responsive touch/click input, and satisfying juice (screen shake, impact freeze, audio chimes).

## 3. Input & Control Expectations
- **Multi-Input Support:** Provide first-class support for Touch (on-screen thumbsticks/buttons with haptics), Keyboard (WASD + Arrow mappings), and Gamepad API where appropriate.
- **Mobile-First Ergonomics:** Touch controls must not obscure critical visual elements or UI HUDs. Touch zones must be forgiving and clearly indicated.

## 4. Audio, Particles & Visual Polish
- **Physics & Motion:** Tuned physics with snappy acceleration, coyote time for jumps, and responsive collisions.
- **Particle Systems:** Juiced particle emitters for achievements, impacts, rewards, and victories to heighten player delight.
- **Camera & Shakes:** Contextual camera zooms, screen shake on impacts, and smooth tracking.
- **Audio Feedback:** Synthesized Web Audio or lightweight audio sprites for clicks, movements, hits, and victory fanfares, with global mute/volume persistence.

## 5. Server-Authoritative Simulation & Anti-Cheat
- **Multiplayer & Competitive Parity:** All ranked multiplayer matches, turn-based duels (Caro, Chess), and competitive high-score leaderboards must be server-authoritative.
- **Input Trace Verification:** Game DO (Durable Object) or Worker verifiers inspect timestamped input traces or seed-based state transitions rather than trusting client-reported scores.
- **Rate-Limiting & Validation:** Enforce strict action bounds, cooldown intervals, and state bounds to prevent botting or score injection.
