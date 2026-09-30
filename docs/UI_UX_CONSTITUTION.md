DIGITAL CAMPUS — GLOBAL UI/UX CONSTITUTION
RESPONSIVE LAYOUT, VISUAL BALANCE & ZERO-OVERLAP RULES

This is a GLOBAL DESIGN RULE for the entire Digital Campus project.

Treat this document as a hard engineering contract, not a visual suggestion.

Before modifying ANY UI component, page, popup, profile card, classroom,
community screen, game screen, dialog, toolbar or mobile layout:

READ AND FOLLOW ALL RULES BELOW.

If existing code violates these rules, fix the underlying layout architecture
instead of adding random margins, negative offsets, absolute positioning,
font shrinking, or one-off breakpoint hacks.

==================================================
0 — PRIMARY PRODUCT PRINCIPLE
==================================================

The UI must feel:

SIMPLE
CALM
BALANCED
PROFESSIONAL
MODERN
YOUTHFUL
CONTENT-FIRST

Do NOT maximize the number of:

cards
badges
borders
containers
buttons
colors
labels
metrics
decorations

Prefer:

fewer surfaces
more breathing room
clear hierarchy
predictable alignment
contextual controls
progressive disclosure

One function should normally have ONE canonical location.

Do not duplicate the same action in multiple nearby places.

==================================================
1 — ZERO OVERLAP CONTRACT
==================================================

NO normal UI element may accidentally overlap another UI element.

This includes:

text over buttons
buttons over cards
badges over text
floating controls over important content
avatars over labels
menus hidden behind containers
toolbars blocking content
cards extending outside viewport
horizontal scrolling caused by component layout

Absolute/fixed positioning is allowed ONLY for intentional overlays such as:

modal
popover
tooltip
toast
context menu
fullscreen control
intentional floating toolbar

Never use absolute positioning merely to make normal layout "look right".

Normal page/card layout must use:

flex
grid
gap
padding
min/max widths
responsive reflow

==================================================
2 — TEXT MUST NEVER BE ACCIDENTALLY CUT
==================================================

Every text element must have an explicit overflow strategy.

NEVER allow accidental clipping.

For each text element choose ONE intentional behavior:

A. WRAP
Use when the text is important and should remain readable.

B. TRUNCATE
Use only when full text is secondary and another way exists to reveal it.

C. HIDE LABEL / ICON-ONLY
Use for secondary actions on small screens.

D. MOVE TO NEXT ROW
Use when keeping the text is more important than preserving one row.

Do NOT solve overflow by:

reducing font-size until it fits
hardcoding tiny widths
using overflow-hidden without intention
cutting Vietnamese words
letting text disappear behind an icon

Vietnamese text can be longer than English.
Design widths for Vietnamese content.

Examples that must work:

"Thành tựu"
"Thành tựu của bạn"
"Hủy kết bạn"
"Đang kết nối lại"
"Nguyễn Hoàng Minh Anh"

Long names must not destroy layout.

==================================================
3 — FLEXBOX SAFETY RULE
==================================================

Whenever a flex child contains variable text:

audit min-width behavior.

Use min-w-0 where shrinking is expected.

Use shrink-0 for icons/avatars/buttons that must retain their dimensions.

Do not allow one long label to push neighboring actions outside the card.

For action groups:

if available width becomes insufficient,
REFLOW the layout.

Do not squeeze everything harder.

==================================================
4 — RESPONSIVE PRIORITY SYSTEM
==================================================

Responsive design is NOT:

desktop CSS
+
smaller font on mobile.

For every component classify elements as:

P0 — essential
P1 — important
P2 — secondary
P3 — decorative

When width decreases:

P0 stays visible.
P1 reflows.
P2 may become icon-only, collapse, or move into overflow menu.
P3 may disappear.

Never hide critical actions merely to preserve decoration.

Example:

Profile popup:

P0:
avatar
name
primary relationship state
primary message/contact action

P1:
level / XP

P2:
achievement details
secondary relationship action

P3:
decorative labels / redundant badges

==================================================
5 — MOBILE REFLOW BEFORE SHRINK
==================================================

When horizontal space is insufficient:

FIRST:
change grid columns
wrap rows
stack actions
collapse secondary controls
use icon-only controls when obvious

ONLY AFTER THAT:
adjust spacing slightly

NEVER:
keep shrinking labels until unreadable.

Example:

Desktop:
[ Nhắn tin ] [ Thành tựu ]

If mobile cannot fit both comfortably:

choose one of:

[ Nhắn tin        ]
[ Thành tựu       ]

OR

[ icon Nhắn tin ] [ trophy ]

OR

primary action + compact overflow menu.

Do NOT display:

"Thành tựu (..."

==================================================
6 — CARD NESTING LIMIT
==================================================

Avoid "card inside card inside card".

Maximum visual surface depth:

PAGE
→ SECTION/CARD
→ optional small contextual surface

Normally no deeper than 2 visible bordered layers.

Do NOT give every logical group its own:

rounded border
background
shadow

Grouping can also be communicated through:

spacing
alignment
divider
typography

Before creating a new card ask:

"Could spacing alone communicate this grouping?"

If YES:
do not create another card.

==================================================
7 — VISUAL HIERARCHY
==================================================

Every component must have ONE obvious primary focus.

Example profile popup:

1. Person
2. relationship / identity context
3. main action
4. secondary information

Do not give every region equal visual weight.

Avoid several competing:

bright colors
large borders
strong shadows
large buttons
colored badges

in the same small component.

==================================================
8 — SPACING SYSTEM
==================================================

Do not invent arbitrary spacing per component.

Use a consistent spacing rhythm.

Preferred practical scale:

4
8
12
16
20
24
32

Typical rules:

icon ↔ label: 6–8px
related controls: 8–12px
inside compact card: 12–16px
between sections: 16–24px

Do not combine random values such as:

7px
13px
19px
27px

unless there is a real visual reason.

==================================================
9 — BORDER / RADIUS DISCIPLINE
==================================================

Do not outline everything.

Use borders primarily to:

separate interactive surfaces
define modal/popover boundary
indicate state

Do not give every nested group its own strong outline.

Keep radius hierarchy consistent.

Example:

large modal/card:
16–20px

inner compact controls:
10–14px

pill:
full rounded

Avoid five different radius styles inside one component.

==================================================
10 — COLOR DISCIPLINE
==================================================

Color communicates meaning.

Do not make every action a different bright color.

Use:

neutral base
one primary accent
semantic states where necessary

Examples:

primary action → primary accent
success/friend state → green
warning → amber
danger/destructive → red

Do not color unrelated secondary controls simply to make the page "interesting".

==================================================
11 — TYPOGRAPHY RULE
==================================================

Do not solve layout problems by making text tiny.

Minimum practical mobile sizes:

important body/action:
14px when possible

secondary metadata:
12px

micro labels:
10–11px only when genuinely secondary

Important actions must never depend on 9–10px text.

Use weight and hierarchy before adding size/color complexity.

==================================================
12 — ACTION BUTTON CONTRACT
==================================================

Buttons must never:

clip their label
overlap another button
collapse below usable width
produce horizontal viewport overflow

Interactive target:

prefer >= 40px height
important mobile touch controls preferably >= 44px hit area

Icon-only buttons require:

aria-label
title when useful

Do not rely purely on color to communicate meaning.

==================================================
13 — SMART ACTION LAYOUT
==================================================

Never assume two or three buttons always fit in one row.

Use responsive layout such as:

grid-template-columns:
repeat(auto-fit, minmax(...))

or intentional breakpoint changes.

For compact cards:

if labels do not comfortably fit:
stack them or convert secondary action to icon.

Visual balance is more important than preserving one row.

==================================================
14 — LONG CONTENT STRESS TEST
==================================================

Every reusable UI component must be tested with abnormal-but-valid content.

Test at minimum:

short name:
"Lê An"

normal name:
"Lê Văn A"

long name:
"Nguyễn Hoàng Minh Anh"

long button:
"Xem tất cả thành tựu"

large number:
"12.458"

zero:
"0"

large notification count:
"999+"

Do not optimize only for fixture/demo text.

==================================================
15 — REQUIRED VIEWPORTS
==================================================

Any meaningful UI change must be visually checked at:

360x800
390x844
768x1024
1024x768
1366x768
1440x900

Do NOT create separate architectures for each viewport.

The same component must naturally adapt.

Also test:

browser zoom 100%
browser zoom 125%

Important content must remain usable.

==================================================
16 — NO HORIZONTAL PAGE OVERFLOW
==================================================

At supported viewport sizes:

document.documentElement.scrollWidth
must not exceed
document.documentElement.clientWidth

except for an intentional internal horizontal scroller.

If horizontal scrolling exists:

identify the exact element causing it
and fix the root cause.

Do NOT globally hide overflow-x to conceal a broken layout.

==================================================
17 — POPUP / MODAL RULE
==================================================

A popup must fit inside viewport.

Use:

max-width
max-height
overflow-y-auto where required

Mobile:

leave safe viewport margins.

Do not let a popup touch both physical screen edges.

A popup should not contain excessive nested cards.

Prefer:

header
content
actions

rather than:

modal
  card
    card
      card
        buttons

==================================================
18 — PROFILE / PEOPLE COMPONENT RULE
==================================================

For user/profile popovers:

keep the hierarchy simple.

Preferred structure:

Avatar
Name
Role / status

Level / XP as compact metadata

Relationship state

Primary action
Secondary action / achievement entry

Do NOT make each line a separate heavy card.

Do not let achievements compete visually with the primary social action.

If "Thành tựu" cannot fit:
do not truncate into meaningless text.
Use icon-only secondary action or reflow.

==================================================
19 — PROGRESSIVE DISCLOSURE
==================================================

Show what the user needs NOW.

Secondary information should appear through:

popover
drawer
expand
details
contextual menu

Do not permanently show every possible action.

A clean interface is preferable to a permanently crowded interface.

==================================================
20 — DENSITY RULE
==================================================

For every component ask:

Can one element be removed without losing the task?

If yes:
remove it.

Can a bordered card become simple spacing?

If yes:
remove the card.

Can a label become a tooltip/icon on small screens?

If yes:
adapt it responsively.

Do not add decorative UI merely because empty space exists.

Empty space is allowed.

==================================================
21 — STATE STABILITY
==================================================

Layout must not jump significantly when:

loading
data arrives
count changes
username changes
button state changes
connection reconnects

Reserve reasonable space where necessary.

Avoid CLS caused by:

late badges
images without dimensions
changing button widths
conditional labels that push the layout

==================================================
22 — IMAGE / AVATAR RULE
==================================================

Images and avatars must have explicit:

width
height
aspect-ratio

Use object-fit appropriately.

Avatar must never determine surrounding card dimensions unpredictably.

==================================================
23 — TOOLBAR RULE
==================================================

Toolbars must be contextual.

Do not permanently expose controls irrelevant to the current mode.

If space decreases:

collapse labels
use icons
use overflow menu

Do not allow toolbars to wrap into random 2.5-row layouts.

Toolbar behavior must be intentionally defined for each breakpoint.

==================================================
24 — NO CSS PATCH PILE
==================================================

Forbidden style of fixing:

mt-[-7px]
left-[13px]
w-[173px]
translate-x hacks
multiple breakpoint exceptions
z-index escalation
overflow-hidden to conceal problems

unless technically justified.

If more than 2–3 one-off layout hacks are needed:

STOP.

Re-evaluate parent flex/grid architecture.

Fix the parent layout instead.

==================================================
25 — Z-INDEX CONTRACT
==================================================

Do not randomly increase z-index.

Define layers conceptually:

content
sticky controls
popover
modal
toast

A child should not need z-[9999] to become clickable.

If controls cannot be clicked:

inspect pointer-events
stacking context
overlay bounds
absolute elements

Do not blindly increase z-index.

==================================================
26 — INTERACTION SAFETY
==================================================

After visual changes verify REAL interactions.

A component is NOT accepted because the screenshot looks correct.

Click/tap:

primary actions
secondary actions
close
menus
tabs
dock
popover triggers

Verify no transparent layer intercepts pointer events.

==================================================
27 — DESKTOP ≠ STRETCHED MOBILE
==================================================

Large desktop screens should not create enormous empty horizontal components.

Use sensible max-width when content is naturally compact.

But central workspaces such as Classroom Stage may intentionally use available space.

Choose layout based on content purpose.

==================================================
28 — MOBILE ≠ MINIATURE DESKTOP
==================================================

Mobile should prioritize:

content
primary action
touch targets

Secondary metadata may move or collapse.

Do not preserve desktop rows at all costs.

==================================================
29 — COMPONENT OWNERSHIP
==================================================

Responsive behavior belongs to the component that owns the layout.

Do not scatter fixes for one component across unrelated parents.

A reusable component should define:

its minimum usable width
its internal wrapping
its overflow behavior
its responsive priority

==================================================
30 — BEFORE CODING
==================================================

For the target component/page:

1. Inspect the actual UI in browser.
2. Inspect parent layout constraints.
3. Identify the root layout issue.
4. Determine P0/P1/P2/P3 content priority.
5. Decide expected layout for mobile/tablet/desktop.
6. THEN modify code.

Do not start by randomly editing Tailwind classes.

==================================================
31 — AFTER CODING
==================================================

Use real browser inspection.

Do not judge UI only from source code.

At minimum verify:

360px
390px
768px
1366px

Check:

no overlap
no clipped meaningful text
no accidental horizontal scroll
no unusable buttons
no card collisions
balanced whitespace
clear hierarchy
correct actions
pointer/tap works

==================================================
32 — SCREENSHOT REVIEW CHECK
==================================================

Before declaring PASS, visually inspect the screen and ask:

A. Is anything cut?
B. Is anything unnecessarily wrapped?
C. Is anything too close?
D. Is anything competing for attention?
E. Are there too many boxes?
F. Is there duplicated information/action?
G. Is the primary action obvious?
H. Does the mobile version feel intentionally designed?
I. Could any element be removed?
J. Does changing text length break it?

If any answer reveals a problem:
fix it before PASS.

==================================================
33 — AUTOMATED RESPONSIVE ASSERTIONS
==================================================

For important shared components, add lightweight checks where practical:

- no viewport horizontal overflow
- major controls inside viewport bounds
- primary actions visible
- important text container has positive usable width

Do NOT build huge E2E harnesses.

Browser smoke should remain small and targeted.

==================================================
34 — DO NOT BLINDLY PRESERVE OLD UI
==================================================

Legacy layout is not authoritative merely because it already exists.

Preserve:

product behavior
data flow
permissions
accessibility
business logic

You MAY simplify visual structure when the old structure causes:

nested-card clutter
bad hierarchy
overflow
duplicate controls
poor responsiveness

==================================================
35 — CHANGE BUDGET
==================================================

Do not redesign unrelated areas while fixing one component.

Fix the smallest coherent layout system that solves the root cause.

If multiple components share the same structural defect,
extract/reuse the correct responsive pattern.

Do not create a giant design-system rewrite unless actually required.

==================================================
36 — FAILURE CONDITIONS
==================================================

The UI change is automatically FAIL if ANY of these occur:

meaningful text visibly clipped
button label cut in half
unintentional overlap
horizontal page overflow
important action inaccessible
mobile tap target blocked
transparent overlay intercepting clicks
card extending outside viewport
desktop/mobile layout relying on hardcoded coordinates
duplicate primary actions
three-or-more-deep visual card nesting without strong reason

==================================================
37 — ACCEPTANCE STANDARD
==================================================

Do NOT report:

"looks good"
"responsive implemented"
"mobile optimized"

without actual browser verification.

PASS requires:

ZERO accidental overlap
ZERO meaningful clipped labels
ZERO accidental viewport horizontal overflow
ZERO blocked primary controls

and a visually coherent hierarchy at all required viewport classes.

## UI delivery workflow

Use targeted local checks while implementing. At completion run typecheck, lint changed files, relevant targeted tests, build:bundle and git diff --check. Do not run GitHub CI or a full test suite for UI changes unless shared high-risk infrastructure changes. Verify real browser behavior at the specified viewports and 100% / 125% browser zoom. Deploy staging at most once for browser review when needed. Production deployment requires an explicit current user request.
