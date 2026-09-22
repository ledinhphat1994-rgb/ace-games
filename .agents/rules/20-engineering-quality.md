# Digital Campus v2 — Engineering Quality & Stability

1. **Quality Gates Zero Tolerance**:
   - `npm run typecheck` (tsc -b) must pass with 0 errors.
   - `npm run lint` (oxlint) must pass with 0 errors.
   - `npm test` (vitest) must pass 100% green across all test files.
   - `npm run build` must succeed with valid production bundles.
   - `git diff --check` must pass with zero whitespace/newline violations.
2. **Anti-Jitter & Zero CLS**:
   - Never hijack window scroll; no inline `.scrollIntoView()`.
   - Safe programmatic `.focus({ preventScroll: true })`.
   - Stable layout heights, minimum container dimensions, and balanced multi-column flex/grid layouts.
3. **Single Source of Truth**:
   - Client states (notifications, unread counts, presence) must converge to backend truth (D1/DO).
   - No fake local state injections or silent swallowing of mutation errors.
