# Phase 4A.1 - Security and Permission Hardening

Completed locally on 2026-09-11. Scope: finish the existing Phase 4A.1 changes;
the proposed Phase 4B redesign is not part of this change.

## Behavior

- Community membership is checked on the server for class-feed data, reactions,
  comments and delegated teacher feed-management endpoints. Guests receive 401;
  authenticated nonmembers receive 403. Teacher access stays class-scoped.
- Invitations target one student in the teacher's session class, expire in 1-30
  days and grant membership once. Only the creation response contains the secret.
  The legacy non-null ma_code column holds a hash marker, never the secret.
- D1 batch atomically claims the invitation and grants membership. A failed grant
  rolls the claim back. Regeneration disables older unused invitations; membership
  revocation also disables outstanding invitations for that student.
- Student editors can edit their own drafts and submit for review. Only teachers
  publish. Existing published posts cannot be changed by student editors.
- Public announcements omit ownership keys and class IDs. Private drafts and
  class announcements stay within their authorization scope.
- Public highlights count real game states and distinct students in user_streaks.
  Room highlights only use school-wide rooms, without student identities.
- Teacher invite/editor dialogs are wired to real APIs. Community navigation
  ignores browser storage, supports direct-URL gating and reloads after redemption.
  The broken teacher-session initialization call was removed.

## Verification

- `npm run check:jsx`: passed.
- `node cong-cu/kiem-tra-du-lieu.js`: no errors; existing migration warnings and
  a warning for the generated local schema export remain.
- `npm run lint`: no errors; existing warnings remain. Targeted ESLint checks for
  the changed security modules and QA script passed without warnings.
- `node build.js`: passed.
- `node cong-cu/qa-campus-restructure.mjs`: 72 checks passed against real local
  HTTP endpoints, D1 and Playwright. Includes concurrent redemption, transactional
  rollback, revocation, expiry, rate limiting, cross-class permissions, editor
  workflow, guest storage spoofing, refresh, preserved DOM IDs and mobile layout.
- Migration 66 followed by 67: passed on an isolated local database.

The QA runner only accepts 127.0.0.1. It uses fixture classes 910/920 in
`qa/phase4a1-db`, separate from the existing development database and production.
It never calls remote D1. The signing key in this runner is for that local server
only. Generated screenshots and local database files are ignored by Git.

## Running Again

The prepared local database and server are available at `http://127.0.0.1:8790`.
With the server running:

```powershell
node cong-cu/qa-campus-restructure.mjs
```

To restart the isolated server:

```powershell
node build.js
npx wrangler pages dev dist --compatibility-date=2026-05-03 --port=8790 --persist-to=qa/phase4a1-db --binding=SESSION_SECRET=phase4a1-local-test-only-secret-2026
```

The compatibility-date override is required by the installed local workerd binary;
the project's deployment compatibility date was not changed.

To prepare another empty QA database from the current development schema, export
schema only with `wrangler d1 export --local --no-data`, then import that file with
`wrangler d1 execute --local --persist-to=qa/phase4a1-db --file=...`. Ensure migrations
57/58 (feed interactions) and 66/67 are present before running the tests. The local
schema exported during this session was missing 57/58; they were applied only to
the isolated QA database. Do not reapply ALTER COLUMN migrations to a database
that already contains their columns.

## Visual Review

Screenshots: `qa/phase4a1/campus-desktop.png`, `feed-desktop.png`,
`invites-desktop.png`, `preview-desktop.png`, `invites-mobile.png`.
Desktop width: 1440. Mobile width: 390.

| Reference Block | Present in App? | Difference |
| --- | --- | --- |
| Campus header and account actions | Yes | Existing Phase 4A layout retained |
| Left Campus Highlights | Yes | Real aggregate API data |
| Four central activity destinations | Yes | Existing structure retained |
| Teacher announcements and personal tools | Yes | Management handlers connected |
| Feed header, left navigation, feed and right rail | Yes | Server membership gate added |
| Exact comparison with 1.png / 2.png | Unverified | Both reference images are absent from docs/mockups |

## Deployment Order

No commit, push, remote migration or deployment was performed.
Before deployment, inspect the target schema. A database at Phase 4A needs
`67-campus-security-hardening.sql` applied once before the new Functions.
Migration 66 is now schema-only for fresh installs. Migration 67 removes the old
seed code and seeded announcements, retires legacy shared invitations and creates
persistent membership. Existing individual login sessions are preserved, but
students need a teacher-issued invitation for Community access.

An environment where a preliminary version of migration 67 has already run must
not rerun its ALTER TABLE statements. Inspect and apply only the missing data
cleanup/schema changes. The canonical schema file already includes the new tables.
