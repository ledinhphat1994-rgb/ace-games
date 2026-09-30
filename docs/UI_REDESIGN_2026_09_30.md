# Digital Campus — product redesign

## Audit and scope

This work changes shared Platform presentation and Activity UI. RoomDO, room admission, same-origin parsing, presence truth, permissions, PDF/slide sync, drawing/laser protocols and release guards remain authoritative.

- `index.html`, `src/index.css`, `src/main.tsx`: dark-only bootstrap; semantic light tokens and persistent theme selection missing.
- `src/components/layout`: only two primary destinations; utility discovery and visual hierarchy inconsistent.
- `src/features/hub/LearningPage.tsx`, `SanhHoatDong.tsx`: room lobby constrained by permanent utility columns; safe join-by-code dialog exists but is unreachable here.
- `src/features/study/workspace`: stage restore/upload controls duplicate dock actions; dark hardcodes and floating utility clutter.
- `CommunityPage.tsx`: friends directory, not a campus feed. There is no separate posts/likes/events backend. The new feed uses real Campus messages and existing authorized send/delete flows, with no invented post metrics.
- Game hub/rankings/chat/profile: per-component color and card styling; profile avatar entry repeated and theme adaptation missing.

## Approved references

A: ChatGPT Image Sep 30, 2026, 09_51_56 PM-2.png — calm navy, clear content hierarchy, compact communication.
B: ChatGPT Image Sep 30, 2026, 09_51_50 PM-1.png — first-class light theme, horizontal mobile game list.
C: ChatGPT Image Sep 30, 2026, 09_52_12 PM-4.png — soft depth, campus hero, focused feed.
D: ChatGPT Image Sep 30, 2026, 09_52_01 PM-3.png — balanced profile and central content.

Images are design direction, never fabricated product data. One new text-free campus illustration supplies identity; UI remains responsive native components.

## Execution plan

0. Install these explicit requirements in AGENTS/root governance.
1. Semantic dark/light design tokens, persistent system-aware theme provider, pre-paint bootstrap.
2. Three concise primary destinations; consistent header, search, notifications/account and theme utility; mobile navigation.
3. Room-focused hero, create / safe code join / quick join, truthful room list.
4. Central presentation stage, one tool dock, remove duplicated restore/upload entries; retain PDF/video/annotation state.
5. Real campus feed plus lightweight friends presence, existing chat and ranking access.
6. Art-led game hero, compact reusable catalog, real game entry.
7. Real-data top rankings and clean list with accessible filters.
8. Unified chat/friends sheets, readable status and message hierarchy.
9. Concise profile identity, achievements and grouped settings.

## Acceptance and evidence

Verify dark/light on 390×844, 768×1024, 1280×800, 1440×900 and 1920×1080, plus narrow/landscape regressions. Use real local/staging data and disposable QA accounts. Targeted checks during editing; one full final gate before commit/push. Staging smoke for browser truth; production untouched. Evidence will be recorded in the final implementation report and ignored browser artifacts.
