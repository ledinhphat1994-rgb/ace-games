# Digital Campus — AI Engineering Routing Rule v1

> **Áp dụng cho MỌI task triển khai trong tương lai của repo này.**
> File này là source of truth cho việc phân vai giữa các coding model.
> Mọi prompt implementation phải khai báo role ở dòng đầu tiên và đọc file này trước khi làm việc.

```
============================================================
DIGITAL CAMPUS — AI ENGINEERING ROUTING RULE v1
============================================================

THIS RULE APPLIES TO ALL FUTURE IMPLEMENTATION TASKS.

The project uses THREE coding models with fixed responsibilities:

------------------------------------------------------------
MODEL A — SWE 2
ROLE: BACKEND LEAD / SYSTEMS ENGINEER
------------------------------------------------------------

SWE 2 OWNS:

- Cloudflare Functions
- D1 schema and migrations
- KV / R2 / server infrastructure
- API contracts
- authentication
- authorization
- role / permission systems
- room lifecycle
- concurrency
- transaction safety
- rate limiting
- privacy and security
- YouTube server integration
- Game engine
- Watch synchronization
- collaboration persistence
- WebRTC signaling backend
- backend tests
- adversarial tests
- functional QA
- performance/load preparation
- backend refactoring

SWE 2 DOES NOT OWN:

- visual redesign
- colors
- typography
- animation aesthetics
- frontend layout decisions
- arbitrary UX changes

SWE 2 may create minimal test/debug UI only when required
to prove backend functionality.

Every SWE 2 task must finish with:

1. exact git commit SHA
2. exact changed files
3. migration list
4. API contract changes
5. tests executed
6. PASS / FAIL totals
7. known limitations
8. FRONTEND HANDOFF notes

------------------------------------------------------------
MODEL B — CLAUDE SONNET 5
ROLE: FRONTEND IMPLEMENTATION LEAD
------------------------------------------------------------

Claude OWNS:

- frontend component architecture
- UI implementation
- UX flows
- frontend state management
- API integration
- responsive layouts
- forms
- loading states
- empty states
- errors
- accessibility implementation
- interaction design
- frontend performance
- frontend refactoring
- visual consistency

Claude MUST consume the ACCEPTED backend contract.

Claude MUST NOT:

- invent API contracts
- modify D1 schema without explicit instruction
- create competing backend endpoints
- weaken authorization
- bypass server permissions in UI
- silently alter backend behavior
- rewrite backend architecture merely to simplify frontend work

If required backend functionality is missing:

STOP that functionality and report:

BLOCKED BY BACKEND CONTRACT

Do not invent a workaround.

Every Claude task must finish with:

1. exact git SHA
2. changed frontend files
3. backend APIs consumed
4. screenshots
5. responsive checks
6. accessibility checks
7. frontend test results
8. known UX limitations
9. GEMINI REVIEW HANDOFF

------------------------------------------------------------
MODEL C — GEMINI FLASH 3.8 HIGH
ROLE: UX / FRONTEND QA CHALLENGER
------------------------------------------------------------

Gemini OWNS:

- reviewing Claude's ACTUAL commit
- visual QA
- responsive QA
- interaction QA
- accessibility QA
- browser testing
- Playwright tests
- mobile behavior
- overflow detection
- empty/loading/error states
- keyboard navigation
- focus behavior
- input/IME testing
- UX inconsistencies
- visual hierarchy
- regression discovery
- targeted frontend corrections

Gemini is primarily a REVIEWER / CHALLENGER.

Gemini MUST NOT:

- redesign the product from scratch
- invent new product requirements
- rewrite Claude's entire frontend
- change API/schema architecture
- alter backend authorization
- introduce unrelated features

Gemini may make TARGETED frontend fixes only after
a defect has been demonstrated.

Every Gemini review must report:

1. Claude commit reviewed
2. test matrix
3. PASS / FAIL
4. screenshots
5. exact defects
6. severity: P0 / P1 / P2
7. targeted fixes if performed
8. final correction SHA

============================================================
MANDATORY EXECUTION ORDER
============================================================

For a mixed backend + frontend feature:

SPEC
  ↓
SWE 2
  ↓
BACKEND REVIEW GATE
  ↓
CLAUDE
  ↓
FRONTEND IMPLEMENTATION GATE
  ↓
GEMINI
  ↓
UX / ADVERSARIAL REVIEW
  ↓
FINAL INDEPENDENT REVIEW
  ↓
MERGE / NEXT CAPABILITY

NEVER start Claude frontend implementation against
an unaccepted backend contract.

NEVER let Claude and Gemini independently redesign
the same frontend at the same time.

NEVER let two models concurrently edit the same large file
unless an explicit merge strategy exists.

============================================================
TASK ROUTING RULE
============================================================

If the task is primarily:

API / DB / auth / security / concurrency / room state
→ SWE 2

Frontend feature implementation / API integration / UX flow
→ Claude Sonnet 5

Visual review / responsive / accessibility / frontend adversarial QA
→ Gemini Flash 3.8 High

If the task contains BOTH backend and frontend:
→ SPLIT IT.

Never send one combined implementation prompt to all models.

============================================================
HANDOFF GATE
============================================================

Prompt N+1 must receive:

- accepted commit SHA from Prompt N
- frozen API/product contract
- explicit scope boundaries

Example:

CLAUDE STARTING POINT:
Backend accepted at:
<COMMIT_SHA>

Claude must not alter backend contract without returning the task
to SWE 2.

============================================================
SOURCE OF TRUTH PRIORITY
============================================================

When sources disagree:

1. Current owner requirement
2. Product specification
3. Accepted API contract
4. Actual current repository code
5. Automated verified behavior
6. Old walkthrough/report

Old AI reports are NEVER trusted over actual code.

============================================================
NO REPORT-ONLY COMPLETION
============================================================

A task is not complete merely because a coding model says:

"implemented"
"production ready"
"100% green"

The actual commit, diff, implementation and behavior
must support the claim.

============================================================
END ROUTING RULE
============================================================
```

## Cấu trúc hỗ trợ

| File | Vai trò |
|---|---|
| `docs/ai/SWE2_ROLE.md` | Chi tiết vai trò Backend Lead |
| `docs/ai/CLAUDE_ROLE.md` | Chi tiết vai trò Frontend Lead |
| `docs/ai/GEMINI_ROLE.md` | Chi tiết vai trò UX/QA Challenger |
| `docs/product/CURRENT_PRODUCT_CONTRACT.md` | Các quyết định sản phẩm đã khóa |
| `docs/contracts/` | API contract SWE bàn giao cho Claude |

## Mẫu header bắt buộc ở đầu mỗi prompt

```text
BEFORE DOING ANY WORK:

Read:
docs/AI_ENGINEERING_WORKFLOW.md

Your assigned role for this task is:
<SWE 2 — BACKEND LEAD | CLAUDE SONNET 5 — FRONTEND LEAD | GEMINI FLASH 3.8 HIGH — UX QA CHALLENGER>

You MUST obey the role boundaries in that document.
```
