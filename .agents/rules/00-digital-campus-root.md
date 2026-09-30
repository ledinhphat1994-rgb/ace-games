---
trigger: always_on
---

# Digital Campus v2 — Root Governance Constitution

> **Authoritative Baseline & North Star Governance**
> Digital Campus is a realtime social, learning, and multiplayer platform for teens and schools. Every contributor, AI agent, and automation tool must strictly adhere to these fundamental principles.

---

## 1. Platform Core vs. Activity Boundary
- **Platform Core Responsibilities:** Authentication, presence, discovery lobby, notifications, room admission, user profiles, reputation/progression, file access gates, safety/moderation.
- **Activity Domain Responsibilities:** Study rooms (PDF/whiteboard), Watch Together (synchronized YouTube), Games Arena (Phaser-based turn/action games).
- **Invariant:** Platform responsibilities must **NEVER** be duplicated inside individual activities. Activities remain lightweight, delegating presence, admission, and identity to Platform Core.

## 2. Evidence Hierarchy & Runtime Truth
- **Runtime Truth Over Claims:** Live execution behavior, verified network packets, and compiled test suites always take precedence over theoretical documentation, assumptions, or outdated comments.
- **Verification Requirement:** Never claim a feature works from code inspection alone. Every change must be verified through automated tests, build validation, and visual rendering evidence.

## 3. Critical Thinking & Autonomy
- **Proactive Problem Solving:** Agents must actively trace root causes rather than applying superficial fixes.
- **Architectural Integrity:** Reject shortcuts that violate separation of concerns, create technical debt, or bypass security gates.

## 4. Internet Research & Technology Adoption
- Use internet research to identify proven, battle-tested modern web standards, algorithms (e.g. Glicko-2, WebRTC SFU, Phaser physics), and official Cloudflare/Vite documentation.
- Do not introduce unvetted third-party packages or abandon core project conventions.

## 5. Zero Fabricated Product Data
- **No Mock Placeholders:** Real runtime data must flow from D1, Durable Objects, or R2.
- **Honest Empty States:** When no data exists (e.g., zero active rooms, no online friends), show a clean, honest, actionable empty state—never fake users, artificial room counts, or synthetic notifications.

## 6. Scope Discipline & Anti-Drift
- Every change within a pull request or milestone must be strictly necessary for that milestone's explicit goal.
- Unrelated cleanup, speculative rewrites, and cosmetic changes outside the task scope must be rejected.

## 7. Visual Acceptance & Target Aesthetic
- **Target Persona:** Modern Teen Digital Campus—energetic, social, intuitive, and game-inspired.
- **Anti-Pattern:** Digital Campus is NOT an enterprise admin dashboard, a generic LMS, or a dense wall of dark cards.
- **Acceptance Gate:** Visual quality is evaluated in real browsers with real viewports (1920px desktop, 1440px laptop, 390px mobile). Green tests without visual confirmation do NOT satisfy delivery.

## 8. Reduce Before Adding ("Obvious UI Does Not Explain Itself")
- A card or destination should state **what it is**, not describe how to use it.
- Strip unnecessary subtitles, decorative chips, redundant tags, and explanatory paragraphs.
- Every screen must be instantly comprehensible within 3 seconds.
- **Quy tắc bắt buộc khi sửa giao diện (Chỉ đổi tiêu đề, cấm thêm nội dung bổ sung):** Khi nhận lệnh sửa giao diện, chỉ cập nhật đúng tiêu đề, tuyệt đối KHÔNG tự ý chèn thêm phụ đề (subtitles), mô tả phụ, đoạn văn giải thích hay bất kỳ nội dung bổ sung nào cho tiêu đề đó.
- **Tuyệt đối không đè phần tử (Zero Overlap Invariant):** Các card, nút, nhãn và popup không bao giờ được xếp chồng đè hoặc che khuất nhau. Phải sử dụng grid/flex có cấu trúc, padding đầy đủ.
- **Nút thành tựu:** Hồ sơ và bảng người dùng phải có nút "Thành tựu" trực quan để xem tiến độ huy hiệu.

## 9. Interaction Principle & Fluid Responsiveness
- High-contrast typography, generous touch targets (>= 40px), and clear micro-interactions on hover/focus/active.
- Seamless responsive adaptation: Desktop popovers gracefully translate to native-feeling mobile bottom sheets.

## 10. Mobile as a First-Class Citizen
- Mobile is not a shrunken desktop. Bottom navigation, sliding drawers, swipe handles, and single-column ergonomics are mandatory.
- The first viewport on mobile (390px) must be visually clean, focused, and immediately actionable.
- **Tối ưu không gian hẹp / Mobile (Icon-Only Compact Mode):** Khi không gian hẹp (màn hình nhỏ, popover, thanh công cụ compact), ưu tiên sử dụng icon đại diện thay vì chèn chữ dài dòng gây vỡ bố cục hoặc đè lên nhau, luôn kèm `title` và `aria-label`.

## 11. Accessibility & Visual Clarity
- Text contrast must meet standard readability guidelines against deep neutral backgrounds.
- Avoid tiny illegible typography (`text-[9px]`, `text-[10px]`); primary interactive labels must be `>= text-xs`.
- Focus outlines must remain visible and accessible via keyboard navigation.

## 12. Performance, Zero CLS & Anti-Jitter
- **Never hijack window scroll:** Forbid inline `.scrollIntoView()`. Auto-scroll is restricted to parent containers (`container.scrollTo`).
- **Focus safety:** Programmatic `.focus()` must include `{ preventScroll: true }`.
- **Zero CLS on view transitions:** Lock minimum container heights and use centered empty states to prevent jarring layout shifts.

## 13. Security Authority & Data Invariants
- **Single-Device Session Enforcement:** Strict 1-account-1-device policy via `thiet_bi` column. New logins evict older sessions with WebSocket code `4001`.
- **Password Security:** PBKDF2-SHA256 with user-specific iteration counts stored in `tai_khoan_campus.iterations`.
- **Fail-Closed Moderation:** Banned users in `phong_ban` are immediately rejected (HTTP 403 / 503). Server evaluates admission; client claims are never trusted.

## 14. Secret & Environment Handling
- Never commit secrets, credentials, API keys, or private tokens to Git.
- Local configuration resides in `.dev.vars` / `.env.e2e` (git-ignored).
- Production and staging environments must maintain isolated D1, KV, and R2 bindings.

## 15. Delivery Workflow & Release Safety (4-Step Lean Flow)
- Pipeline: Targeted local -> Final local once (`typecheck` -> `lint` -> `test` -> `build:bundle` -> `diff check`) -> Staging only if needed -> Production guard + smoke.
- Risk-Based Verification: Run tests and gates corresponding strictly to the real risk of the diff. Do not run release guard for UI changes.
- Pre-commit Hook: Fast staged check only (`git diff --cached --check` and lint staged files). No full test suite or typecheck in pre-commit.
- Migration Immutability: Applied migrations in `migrations/` are immutable. New changes require sequentially numbered files.
- Production Releases: Require human authorization and pass production release guard (`main sạch + HEAD == origin/main + config đúng`).

## 16. Truthful & Concise Reporting
- Báo cáo ngắn gọn khi hoàn tất: `DONE`, `LOCAL CHECK: PASS`, `TESTS: x/x`, `STAGING: <version | NONE>`, `PR: #xx`, `PRODUCTION: UNTOUCHED`.
- Báo cáo khi bị chặn: `BLOCKED`, `CAUSE: <1 câu>`, `NEED: <thứ cần quyết định>`.
- Tuyệt đối không tường thuật trạng thái chờ ("đang chạy", "đang chờ", "build đang chạy").

## Mandatory UI/UX constitution

Before modifying any UI/UX, frontend layout, responsive behavior,
component styling, visual hierarchy, popup, modal, card, toolbar,
navigation, mobile layout, form, animation, or interaction pattern,
the agent MUST read and comply with:

[.agents/rules/10-ui-ux-layout-constitution.md](10-ui-ux-layout-constitution.md)

A UI task is not DONE if it violates any hard invariant in that file.

Conflict precedence: explicit user requirements > security/correctness/product invariants > [Product North Star](../../docs/PRODUCT_AND_ARCHITECTURE_NORTH_STAR.md) > UI/UX Constitution > legacy implementation. Earlier UI guidance applies only where consistent; title-only restrictions apply only when the user requests a title edit. For UI-only work, the constitution's targeted verification and staging policy (sections 113–114) takes precedence over the full-suite and single-deploy defaults above.

## Approved full-product redesign (2026-09-30)

Follow [docs/UI_REDESIGN_2026_09_30.md](docs/UI_REDESIGN_2026_09_30.md) and references A–D for premium, calm student UI: no card walls, no duplicate actions, first-class dark/light/system themes, responsive desktop to mobile, real data and authoritative logic preserved. Primary navigation is Học tập / Game / Cộng đồng. Classroom uses a central stage, contextual panels and one tool dock. This explicit user-requested redesign uses one full local final gate (typecheck, lint, npm test, build:bundle, diff check) per milestone. No GitHub CI; concise evidence-based reporting. Production remains untouched.
