---
trigger: always_on
---

# Digital Campus v2 — Root Governance

1. **Platform Core vs Activity Boundary**: Always maintain the strict separation between platform core (auth, presence, campus lobby, notification, profiles, admission) and activities (games, rooms, YouTube, study docs).
2. **Runtime Truth Over Claims**: Code evidence and live runtime behavior take precedence over speculative documentation or assumptions.
3. **Data Invariants**:
   - Single device per account via `thiet_bi` column (eviction code `4001`).
   - PBKDF2-SHA256 password hashing with user-specific iterations.
   - Fail-closed security and moderation: banned users rejected immediately (403/503).
4. **Zero Fabricated Data**: No fake online users, no fake rooms, no client-fabricated notifications or mock arrays. Empty states must be honest and actionable.
