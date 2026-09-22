# Digital Campus v2 — Release Safety & Delivery Governance

1. **Staging Before Production**:
   - Always deploy to staging (`npm run deploy:staging`) and verify live endpoints before any release consideration.
   - Never deploy to production or execute production migrations without explicit human instruction.
2. **Release Guard 10/10 Invariants**:
   - `node scripts/verify-release-guard.mjs` must always pass 10/10.
   - Clean git working tree, strictly verified release SHAs, isolated environment bindings.
3. **Migration Immutability**:
   - Never mutate past applied migrations; new schema changes require sequentially numbered files.
