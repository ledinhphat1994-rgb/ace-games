# Digital Campus v2 — Release Safety & Delivery Governance

> **Production Release Integrity & Automated Safeguards**

---

## 1. Production as an Explicit, Guarded Phase
- Staging deployment (`npm run deploy:staging`) is mandatory for interactive verification prior to considering any production release.
- Production deployment (`npm run deploy:production`) is strictly gated behind automated verification and explicit human authorization.
- Agents must never auto-trigger production deployment without explicit instruction.

## 2. Release Guard 10/10 Invariants (`scripts/verify-release-guard.mjs`)
- Clean working tree: zero uncommitted changes, zero untracked files.
- Exact SHA lock: local `HEAD` must match `origin/main` exactly.
- Environment isolation: staging and production must NEVER share D1 databases, KV namespaces, or R2 buckets.
- Release tag binding: deploy metadata must include the verified 40-character commit SHA.

## 3. Database Migration Order & Immutability
- **Immutable History:** Applied migrations in `migrations/` must never be modified or re-run.
- **Migration Before Runtime:** Schema migrations must be applied to D1 before deploying worker bundles to prevent runtime 503 errors on fail-closed moderation queries.
- **Data Protection:** Forbid destructive operations (`DROP TABLE`) on user, auth, or governance tables without verified backup and rollback procedures.

## 4. Rollback Readiness & Post-Deploy Verification
- Every release must maintain a known good rollback SHA and deployment baseline.
- Post-deployment smoke testing must verify core endpoints (`/api/whoami`, WebSocket handshake, asset delivery) immediately after deployment.
