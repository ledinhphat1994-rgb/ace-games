---
trigger: always_on
---

DIGITAL CAMPUS UI/UX CONSTITUTION
============================================================

# 1. DESIGN OBJECTIVE

Every Digital Campus interface must optimize for:

clarity
balance
speed
comfort
discoverability
consistency
accessibility
responsive intelligence
low cognitive load
visual calm
youthful personality
real functionality

The target feeling is:

MODERN
CLEAN
SOCIAL
YOUTHFUL
CONFIDENT
CALM
POLISHED

Never:

enterprise-admin-dashboard
generic LMS
card wall
neon gaming overload
decorative chaos
dense control panel

Beauty comes from:

proportion
alignment
hierarchy
rhythm
spacing
typography
restraint

NOT from adding decoration.

============================================================
# 2. THE REDUCTION PRINCIPLE

Before ADDING UI, try REMOVING UI.

For every visible element ask:

Does the user need this now?
Is it repeated elsewhere?
Could spacing communicate this grouping?
Could it appear contextually instead?
Could a secondary action live in a menu/popover?
Does it compete with something more important?

If an element can disappear without harming the user's task,
remove it.

Whitespace is valid UI.

Do not fill empty space simply because space exists.

============================================================
# 3. ONE ACTION — ONE CANONICAL LOCATION

The same nearby action should not appear twice.

Forbidden pattern:

large CTA in content
+
same action in toolbar
+
same action in menu

Choose ONE canonical location.

Secondary access paths are allowed only when they serve
a materially different context.

============================================================
# 4. INFORMATION HIERARCHY FIRST

Every screen/component must answer within roughly 3 seconds:

Where am I?
What is the main thing here?
What can I do?
What changed?
What needs my attention?

Each region must have a clear hierarchy.

Typical order:

primary content
primary action
important context
secondary actions
metadata
decoration

Never give everything equal visual weight.

============================================================
# 5. PRIORITY CLASSIFICATION

Before implementing a responsive component,
classify visible elements mentally as:

P0 = essential
P1 = important
P2 = secondary
P3 = decorative

As available space decreases:

P0 stays visible.

P1 reflows.

P2 may collapse, become icon-only, move into a menu,
drawer or contextual surface.

P3 may disappear.

Never sacrifice P0 to preserve P3.

============================================================
# 6. ZERO ACCIDENTAL OVERLAP — HARD INVARIANT

Normal UI elements must NEVER accidentally overlap.

This includes:

text over text
text under icon
button over button
button over content
badge hiding a label
toolbar covering important content
popover clipped by parent
avatar covering a control
fixed navigation hiding the final content row
floating action hiding a primary button

Intentional overlays are allowed only for:

modal
dialog
popover
tooltip
toast
context menu
fullscreen UI
explicit floating toolbar

POPUP STACKING & TOP-LAYER RULE:
Between fixed cards: NEVER overlap.
For transient popup surfaces (dialog, modal, popover, dropdown, tooltip, sheet):
The most recently opened popup surface MUST always be rendered on top (highest stacking context / top-layer)
of other surfaces.

NON-OBSCURING POPUP & TRANSPARENT BACKDROP INVARIANT:
Tuyệt đối KHÔNG BAO GIỜ ĐƯỢC ẨN KHU VỰC XUNG QUANH KHI BẬT BẤT KỲ POPUP NÀO CÓ TRONG WEB.
When opening any dialog, modal, popover, drawer, or sheet:
NEVER obscure, black out (e.g. `bg-black/45`, `bg-black/60`), or heavily blur the surrounding background.
The backdrop overlay MUST remain ultra-light and transparent (maximum `bg-black/10` or `bg-transparent`, no heavy backdrop-blur),
ensuring the surrounding page, hero banner, room cards, leaderboards, and navigation remain 100% visible, sharp, and recognizable.
Popups MUST always remain strictly centered in the viewport (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`),
never using overriding `relative` classes that cause the dialog to drift down or clip footer actions.

FIXED CARD MOVEMENT INVARIANT:
Fixed cards, panels, and modals must NEVER move when switching options, tabs, or modes.
(x, y) coordinates and dimensions must remain strictly constant.

SUB-CARD STABILITY & COORDINATE LOCKING INVARIANT:
All sub-cards, option pills, and panels inside a container card or dialog must preserve strictly constant (x, y) coordinates and heights when switching between game types (1v1 vs solo) or modes.
Time selection containers must have a fixed reserved height slot; never collapse or expand dynamically to shift surrounding cards.

SINGLE-ROW INLINE CONTROL INVARIANT:
Custom adjustment and status bars must remain strictly 1 single row (e.g. h-9 / h-10).
When custom mode is active, display the stepper controller inline within the exact same row.
Never generate a 2nd row that causes layout stutter or pushes downward cards.

ZERO OVERLAP WITH FOOTER CTA:
The bottom-most sub-card must maintain a safe breathing buffer (>= 12px) from the footer CTA divider bar,
strictly preventing any element or button from overlapping.

BREATHING ROOM & SPACING INVARIANT:
Always maintain generous, comfortable spacing (gap, padding, margin) between cards,
between titles, and between content blocks. Elements must never bump against each other,
preserving visual calm and "thoáng mắt".

ZERO-STUTTER MOTION & UNIFORM BORDER INVARIANT:
Never use `transition-all` on buttons, tabs, or cards that change border or dimensions.
Use ONLY `transition-colors duration-150` for state transitions.
Never alternate between `border` (1px) and `border-2` (2px) on active vs inactive states;
always use the same border-width (e.g. `border-2`) across both states to prevent 1px frame jumps.
Keep indicator slots (dots, icons) permanently reserved in the DOM (`opacity-0` / `opacity-100`)
to avoid shifting label text on selection.

PEER CARD UNIFORMITY INVARIANT:
Peer cards and choice buttons in the same list or grid MUST share identical dimensions,
aspect ratios, and height/width tracks. Never stretch one peer card (e.g. `col-span-2`)
while others occupy 1 column, creating visual asymmetry.

BALANCED BLUEPRINT WATERMARK & SKEUOMORPHIC AESTHETIC INVARIANT:
When background watermark graphics or circuit schematics are used on cards/modals,
they MUST be distributed in a balanced and cohesive manner across all corners and edges
(top-left, top-right, middle edges, bottom-left, bottom-right, and full-area dot grid).
NEVER cluster watermark artwork solely in one corner, leaving other areas bare.
All blueprint strokes must remain calm and non-distracting (strokeWidth <= 1px, opacity 0.10 - 0.14).
Card borders must remain thin 1px with subtle side-edge middle glow highlights.
Modal top edge must stay anchored, expanding only left/right and downwards.
All sub-cards, single-row custom stepper controls, and action footers must preserve coordinate locking with zero overlap.

MANDATORY DESIGN RULE PRE-CHECK:
Before modifying any UI/UX or frontend code, the AI agent MUST read and adhere to all design rules:
title-only (no subtitles/annotations), fixed card stability, fixed title/label coordinates,
zero overlap, breathing room, uniform border width, zero-stutter motion, and balanced blueprint background aesthetics across the entire site.

Normal layout must prefer:

flex
grid
gap
padding
min/max constraints
intrinsic sizing
responsive reflow

Never use absolute positioning to imitate normal document layout.

============================================================
# 7. FIX THE PARENT, NOT THE SYMPTOM

Forbidden repair style:

random negative margins
random translate-x/y
arbitrary pixel offsets
overflow-hidden hiding mistakes
z-index escalation
shrinking fonts until content fits
dozens of breakpoint exceptions

If multiple children are failing:

inspect the parent.

Fix:

grid definition
flex behavior
available width
min-width
wrapping
content priority
spacing

Do not patch every child independently.

============================================================
# 8. NO CSS PATCH PILES

Values like:

left-[13px]
mt-[-7px]
w-[173px]
translate-x-[11px]
z-[9999]

require a real technical reason.

If a component needs several layout hacks,
STOP and redesign its layout structure.

============================================================
# 9. RESPONSIVE DESIGN IS REFLOW, NOT SHRINKING

Mobile is NOT miniature desktop.

Desktop is NOT stretched mobile.

When width decreases:

reflow
stack
collapse
change grid
switch orientation
reduce secondary detail
use contextual disclosure

BEFORE shrinking text.

Never preserve a desktop row at all costs.

============================================================
# 10. CONTENT-DRIVEN BREAKPOINTS

Do not blindly design around device names.

Change layout when CONTENT no longer fits comfortably.

Use existing Tailwind breakpoints where appropriate.

For reusable components embedded inside variable-width surfaces,
prefer container-aware design when it materially improves behavior.

A profile popup should react to popup width,
not assume the entire viewport width equals its available width.

============================================================
# 11. REQUIRED REFLOW SUPPORT

Core content must remain functional at narrow widths.

Treat 320 CSS px reflow as an accessibility baseline
where the content type allows it.

Exceptions may include inherently two-dimensional surfaces such as:

large data tables
games
maps
presentation canvas
whiteboard

Even in those cases,
controls surrounding the surface must remain usable.

============================================================
# 12. FLEXBOX SAFETY

For variable text in flex layouts:

use min-w-0 when the item may shrink.

Use shrink-0 for elements that must preserve physical size:

avatar
icon
status dot
fixed icon button

Understand flex-basis and shrink behavior.

Do not let a long Vietnamese name push actions offscreen.

============================================================
# 13. GRID SAFETY

Use CSS Grid for multidimensional structured layout.

Prefer patterns such as:

minmax(0, 1fr)

and when appropriate:

repeat(auto-fit, minmax(...))

Do not define rigid columns that cannot survive real content.

Grid children must not overflow simply because their min-content
width is larger than the track.

============================================================
# 14. TEXT OVERFLOW MUST BE INTENTIONAL

Every variable text region needs an overflow strategy.

Choose intentionally:

WRAP
TRUNCATE
CLAMP
MOVE TO NEXT ROW
ICON-ONLY ON COMPACT WIDTH
COLLAPSE INTO SECONDARY UI

Never accidentally clip text.

Meaningful labels must never appear like:

"Thành tựu (..."
"Đang kết n..."
"Hủy kết bạ..."

unless truncation is an intentional product decision and
the full value remains discoverable.

============================================================
# 15. VIETNAMESE-FIRST CONTENT STRESS

Design for Vietnamese text,
which may be longer than short English fixture strings.

Test reusable people/profile/action components with:

Lê An

Lê Văn A

Nguyễn Hoàng Minh Anh

Xem tất cả thành tựu

Đang kết nối lại phòng học

Hủy kết bạn

999+

12.458

Do not design only around perfect demo text.

============================================================
# 16. TYPOGRAPHY SYSTEM

Typography creates hierarchy before borders do.

Use existing Geist typography unless explicitly changed.

Default principles:

body text:
around 14–16px depending on density

critical readable content:
prefer 16px

secondary metadata:
12–14px

micro text:
10–11px only for truly noncritical metadata

Do not make important controls depend on 9–10px labels.

Recommended line height:

body:
approximately 1.4–1.6

headings:
approximately 1.15–1.3

Avoid excessive letter spacing on ordinary Vietnamese text.

Use font weight intentionally.

Do not make every heading bold-heavy.

============================================================
# 17. READING WIDTH

Long-form text should not stretch indefinitely across desktop.

For reading-oriented content,
prefer a comfortable line length around 60–75 characters.

Workspace surfaces such as:

classroom Stage
whiteboard
games
media

may intentionally use more viewport space.

Content purpose determines max width.

============================================================
# 18. SPACING RHYTHM

Use a consistent spacing system.

Preferred core rhythm:

4
8
12
16
24
32
48
64

Avoid random spacing values without justification.

Typical relationships:

icon ↔ label:
6–8px

related controls:
8–12px

compact internal padding:
12–16px

normal card/panel padding:
16–24px

major section separation:
24–48px

Optical balance can override arithmetic,
but exceptions must remain rare.

============================================================
# 19. ALIGNMENT

Use strong invisible alignment lines.

Related content should share:

left edge
centerline
baseline
column rhythm

Do not allow:

almost-aligned headings
buttons drifting by a few pixels
inconsistent avatar/name baselines
random widths in repeated cards

Optical alignment matters.

Icons sometimes require small optical correction,
but structural alignment should remain systematic.

============================================================
# 20. SURFACE / CARD DISCIPLINE

NOT EVERYTHING IS A CARD.

Use cards when a region genuinely represents:

independent object
interactive unit
distinct elevated context

Do not wrap every logical section in:

background
border
radius
shadow

Grouping can use:

space
typography
divider
alignment

Preferred visible nesting depth:

page
→ surface
→ optional contextual control

Avoid visually obvious 3–4 level card nesting.

============================================================
# 21. BORDER DISCIPLINE

Borders are not decoration filler.

Use borders for:

surface separation
interaction state
focus
semantic boundary

Do not outline every section.

On dark UI,
too many low-contrast borders create visual noise.

Use existing border tokens:

subtle
default
strong
active

instead of arbitrary white opacity values whenever practical.

============================================================
# 22. RADIUS DISCIPLINE

Use the existing radius scale.

Maintain hierarchy:

small controls < card < large modal

Do not mix many unrelated corner radii inside one component.

Pills are reserved for:

status
compact tags
specific pill controls

Do not make every button a pill automatically.

============================================================
# 23. SHADOW / ELEVATION DISCIPLINE

Elevation communicates layer hierarchy.

Use shadow mainly for:

popover
modal
floating toolbar
raised interactive surface

Do not give every card a strong shadow.

Dark UI usually needs restraint.

Prefer separation through:

surface value
border
spacing

before strong shadows.

============================================================
# 24. COLOR IS SEMANTIC

Use color to communicate meaning.

Current project semantics should remain coherent:

cyan:
primary / brand / active focus

emerald:
success / friend / online / positive state

violet:
social/community

gold/amber:
achievement/reward/warning where appropriate

red:
danger/destructive/error

Neutral surfaces should remain dominant.

Do not assign every button a different bright color.

Do not use color only as the sole carrier of meaning.

============================================================
# 25. CONTRAST

Target WCAG 2.2 AA minimum.

Normal text:
>= 4.5:1

Large text:
>= 3:1

Meaningful non-text controls/boundaries:
target >= 3:1 where applicable.

Do not use fashionable ultra-low-contrast gray text
for important information.

Placeholder text is not a substitute for a label.

============================================================
# 26. ONE LOCAL PRIMARY ACTION

Within a small region such as:

card
modal
popup
panel

normally only ONE action should appear visually primary.

Other actions should be:

secondary
ghost
icon-only
menu
link

Do not make five equally prominent buttons compete.

============================================================
# 27. BUTTON CONTRACT

Buttons must:

never clip labels
never overlap
remain visually clickable
have clear states
have adequate target size

Project preference:

desktop important controls:
>= 40px effective height

mobile/touch primary controls:
prefer >= 44px target

WCAG minimum requirements remain the absolute floor,
not the design target.

Icon-only buttons need:

accessible name / aria-label

and when useful:

title / tooltip

Never depend on a tiny icon with no accessible label.

============================================================
# 28. SMART ACTION ROWS

Never assume two buttons always fit side-by-side.

When available width becomes insufficient:

stack
reflow
make secondary action icon-only
move low-priority action into overflow

Do NOT compress both until labels are unreadable.

For the current profile-popup class of problem:

primary social action should remain obvious.

Achievement is secondary.

If both cannot fit elegantly:

preserve Message/Friend action first,
then compact Achievement intelligently.

Never display a half-cut label.

============================================================
# 29. TOOLBAR DESIGN

Toolbars contain actions,
not paragraphs.

Toolbar controls must be:

compact
predictable
contextual
grouped by task

Do not expose irrelevant tools permanently.

On narrow layouts:

collapse low-priority labels
use icons
use overflow menu
or allow intentional horizontal toolbar scrolling
when it is the best interaction pattern.

Never allow accidental 2.5-row toolbar wrapping.

============================================================
# 30. PROGRESSIVE DISCLOSURE

Show users what matters NOW.

Secondary complexity should reveal through:

popover
drawer
details
menu
expand
context panel

Do not permanently expose every possible feature.

This principle is especially important for:

Classroom
Community profile
achievement details
moderation
advanced tools

============================================================
# 31. NAVIGATION

Navigation hierarchy must remain stable and predictable.

Digital Campus primary areas remain:

Học tập
Game
Cộng đồng

Do not create unnecessary top-level destinations.

Do not promote a feature to primary navigation
simply because it exists.

Use local/contextual navigation for secondary functions.

============================================================
# 32. MODAL / POPOVER / DRAWER INTELLIGENCE

Use the surface appropriate to the task.

Desktop:

small contextual action
→ popover

complex focused task
→ modal/dialog

Mobile:

a desktop popover may become a bottom sheet/drawer
when this improves touch ergonomics.

Do not force a narrow desktop popover design onto mobile.

============================================================
# 33. POPUP VIEWPORT SAFETY

All popups/dialogs must fit inside the visible viewport.

Use:

max-width
max-height
safe margins
internal scrolling where necessary

Never allow a popup to extend outside the viewport.

Avoid nested scroll regions unless genuinely needed.

============================================================
# 34. MOBILE SAFE AREAS

Fixed bottom controls/navigation must respect:

env(safe-area-inset-bottom)

where appropriate.

Content must not become hidden behind:

browser UI
home indicator
fixed navigation
virtual keyboard

============================================================
# 35. Z-INDEX SYSTEM

Do not solve problems by adding larger z-index values.

Use a conceptual layer scale:

base content
sticky content
dropdown/popover
floating controls
modal/backdrop
toast

Keep the number of z-index layers small.

If something is not clickable,
inspect:

pointer-events
stacking context
overlay dimensions
positioning
DOM order

before changing z-index.

============================================================
# 36. POINTER INTERCEPTION

Transparent elements must not intercept clicks accidentally.

Decorative overlays should normally use:

pointer-events-none

Interactive overlays should be bounded only to their intended region.

After any overlay/layout change,
click the real controls in a browser.

A screenshot does NOT prove interaction quality.

============================================================
# 37. HOVER IS ENHANCEMENT, NOT REQUIREMENT

Core functionality must not depend on hover.

Touch devices have no reliable hover.

Hover may improve discoverability,
but activation must work through:

click
tap
keyboard

Content revealed on hover/focus must behave predictably
and remain usable.

============================================================
# 38. KEYBOARD ACCESS

All actionable UI must be operable with keyboard
where semantically applicable.

Use native HTML first:

button
a
input
select
dialog semantics

Do not build clickable divs when a button is correct.

Maintain logical tab order.

Never create keyboard traps.

Escape should close dismissible modal/popover contexts
when appropriate.

============================================================
# 39. FOCUS

Focus must always be visible.

Do not remove outline without an equivalent accessible indicator.

Focus must not be hidden behind:

sticky header
drawer
floating toolbar
popover
modal footer

Focus movement after actions should be predictable.

When a dialog closes,
return focus logically to its trigger where appropriate.

============================================================
# 40. ARIA

Use native HTML semantics whenever possible.

ARIA supplements semantics;
it does not replace correct HTML.

Follow WAI-ARIA Authoring Practices for complex widgets:

dialog
menu
tabs
combobox
toolbar
listbox

All icon-only controls require an accessible name.

Do not add incorrect ARIA roles simply to satisfy tests.

============================================================
# 41. FORMS

Every input needs a meaningful accessible label.

Show validation near the relevant field.

Error messages must explain:

what happened
how to fix it

Do not clear user-entered values after validation failure.

Do not disable submit without explaining why
when the reason is not obvious.

============================================================
# 42. ERROR PREVENTION

For high-impact destructive actions:

delete
ban
kick
clear shared content
close important session

provide appropriate prevention or confirmation.

Do not require confirmation for harmless reversible actions.

Avoid confirmation-dialog fatigue.

============================================================
# 43. FEEDBACK

Every meaningful user action should have an understandable outcome.

Examples:

loading
success
saved
error
reconnecting
offline
permission denied

Do not leave users wondering whether the click worked.

Prefer localized feedback near the action.

Use toast only when appropriate.

============================================================
# 44. LOADING STATE

Do not replace an entire stable layout with a spinner
unless the whole surface genuinely cannot exist yet.

Preserve geometry.

Prefer:

skeleton
reserved dimensions
local loading indicators

Avoid layout jumps.

============================================================
# 45. EMPTY STATE

Empty state must be truthful.

No fake users.
No fake rooms.
No fake achievements.
No fake messages.

Keep empty states concise.

State:

what is empty

and only when helpful:

the primary next action.

Do not write instructional essays.

============================================================
# 46. ERROR STATE != EMPTY STATE

A network/render/permission failure must never look like:

"No data"

Distinguish:

empty
loading
error
unauthorized
offline
reconnecting

Truthful UI is mandatory.

============================================================
# 47. REALTIME STATE

Because Digital Campus is realtime:

do not make transient reconnects destroy the interface.

Keep last valid content visible when safe.

Show compact connection state.

Disable unsafe mutations when authority is uncertain.

Reconcile cleanly when authoritative state returns.

Avoid flashing between empty/loading/content states.

============================================================
# 48. PERMISSION TRUTH

Do not show controls that imply a user can perform an action
when the server will reject it.

For actions the user can never perform:

prefer hide.

For temporarily unavailable actions:

disable with clear state when useful.

Frontend permission display NEVER replaces server authority.

============================================================
# 49. USER AGENCY

Do not auto-trigger surprising actions.

Do not:

auto-open intrusive modal
move focus unexpectedly
change tabs without reason
auto-scroll the whole window
start destructive actions automatically

Preserve user context.

============================================================
# 50. SCROLL OWNERSHIP

Do not hijack window scroll.

Existing project rule remains authoritative:

NO inline scrollIntoView for child content.

Internal regions own their own scrolling.

Use parent container scrolling where required.

Avoid nested scrolling unless necessary.

============================================================
# 51. CLS / LAYOUT STABILITY

Reserve dimensions for:

images
avatars
media
async panels
known toolbar regions

Avoid unexpected movement when:

data loads
status appears
count changes
avatar arrives
button label changes
reconnect starts

Target:

CLS <= 0.1

for real-user performance where measurable.

============================================================
# 52. INTERACTION PERFORMANCE

Interactions should feel immediate.

Avoid heavy work in event handlers.

Do not rerender huge trees for tiny control state.

Avoid expensive layout thrashing.

Target healthy field performance:

INP <= 200ms

where measurable.

============================================================
# 53. LOAD PERFORMANCE

Avoid loading expensive modules before needed.

Use code splitting/lazy loading for heavy features
when it materially reduces initial load.

Examples:

PDF engine
game engine
heavy editors

Do not lazy-load tiny primitives just for theoretical optimization.

Target healthy field performance:

LCP <= 2.5s

where measurable.

============================================================
# 54. MOTION

Animation should communicate:

state
continuity
hierarchy
cause/effect

Not decorate everything.

Prefer short restrained transitions.

Typical UI transitions:

roughly 120–250ms

depending on context.

Avoid long blocking animation.

Respect:

prefers-reduced-motion

for nonessential motion.

============================================================
# 55. DO NOT ANIMATE LAYOUT NEEDLESSLY

Prefer transform/opacity animation where appropriate.

Do not create jank by repeatedly animating expensive layout properties
without a strong reason.

Do not animate every hover target.

============================================================
# 56. IMAGES / AVATARS

Images should have defined dimensions/aspect ratio.

Use object-fit intentionally.

Avatars must not change surrounding layout when they load.

Provide fallback behavior.

Do not stretch imagery.

============================================================
# 57. ICONOGRAPHY

Use the existing Lucide icon language consistently.

Do not mix random icon libraries without need.

Similar actions must use consistent icons.

Icon size should match control hierarchy.

Do not use ambiguous icons without label/tooltip when meaning is unclear.

============================================================
# 58. CONTENT DESIGN

UI copy should be:

short
direct
human
specific

Do not add explanatory subtitles unless they genuinely improve
understanding.

Existing project rule "Obvious UI Does Not Explain Itself" remains.

Do not automatically add descriptions under headings.

Use verbs for actions.

Avoid technical backend terminology in user-facing messages.

============================================================
# 59. NO FAKE VISUAL COMPLEXITY

Do not invent:

random analytics
fake counters
decorative progress
meaningless badges
placeholder status chips

Every displayed metric/state must represent real product data.

============================================================
# 60. DESIGN TOKENS ARE THE SOURCE OF VISUAL TRUTH

Before hardcoding a repeated visual value:

check existing tokens.

Prefer shared tokens for:

color
surface
border
radius
spacing conventions
text hierarchy

Do not scatter repeated hex colors across components.

If a new semantic token is justified:

add it centrally
name it by semantic purpose
not by the first component using it.

Good:

--achievement
--social
--danger

Bad:

--profile-card-yellow
--button-2-blue

============================================================
# 61. COMPONENT CONSISTENCY

Same semantic component should behave consistently.

Examples:

all icon buttons
all popovers
all primary actions
all user cards
all status badges

Do not solve identical problems five different ways.

Prefer reusing/extending an existing primitive
before inventing a new component.

============================================================
# 62. COMPONENT RESPONSIBILITY

Responsive behavior belongs as close as practical
to the component that owns the layout.

Do not spread one popup's fixes through five unrelated ancestors.

A reusable component should know:

how narrow it can become
what wraps
what collapses
what truncates
what stays fixed

============================================================
# 63. DESIGN FOR STATES, NOT SCREENSHOTS

Every significant component should be mentally designed for:

default
hover
focus
active
disabled
loading
empty
error
long content
permission variation
mobile
desktop

Do not design only the ideal screenshot state.

============================================================
# 64. LONG-CONTENT TEST

For reusable components test:

long Vietnamese names
long labels
large counts
zero counts
missing avatar
slow image
empty values
permission variants

The component must not break.

============================================================
# 65. PROFILE / USER POPOVER SPECIFIC RULE

A compact people/profile surface should normally prioritize:

avatar
name
role/status

then:

relationship state / primary social action

then:

level/XP or relevant compact metadata

then:

secondary action such as achievements

Do not make every subgroup a heavy bordered card.

Do not let Achievements visually overpower:

Friend
Message
relationship state

If a label cannot fit:

reflow or intelligently compact it.

Never clip it accidentally.

============================================================
# 66. CARD DENSITY

A small popup should not look like:

card
inside card
inside card
inside modal shell

When several grouped sections exist,
first attempt:

spacing
divider
typography

before adding another bordered box.

============================================================
# 67. CLASSROOM SPECIFIC RULE

The classroom remains Stage-centric.

Primary visual hierarchy:

compact top bar
dominant Stage
contextual tools
compact contextual panel/dock

Do not turn it into a dashboard.

Do not compete with the Stage using permanent side cards.

Tools appear when relevant.

Student UI should be simpler than host/presenter UI.

============================================================
# 68. COMMUNITY SPECIFIC RULE

Community prioritizes:

people
presence
relationships
conversation

Avoid analytics-dashboard aesthetics.

Profile actions must be obvious.

Achievement/progression is supportive,
not the primary social task.

============================================================
# 69. GAME SPECIFIC RULE

Game UI prioritizes:

gameplay surface
current state
essential controls

Decorative progression and metadata must not obscure gameplay.

Mobile game controls should favor compact,
large-enough touch targets and clear icons.

============================================================
# 70. DESKTOP COMPOSITION

Desktop does not justify filling every horizontal pixel.

Use intentional max-widths for content-oriented surfaces.

Allow true workspaces to grow.

Maintain proportion between:

main content
side panels
gutter
negative space

Do not create enormous empty buttons/cards
merely because the viewport is wide.

============================================================
# 71. MOBILE COMPOSITION

Mobile first viewport should be:

clean
focused
actionable

Prioritize:

primary content
primary action
navigation

Secondary metadata may collapse.

Avoid massive headers consuming valuable vertical space.

Avoid large decorative empty regions.

============================================================
# 72. TABLET IS ITS OWN CONSTRAINT

Do not assume tablet = desktop.

Widths around 700–1000px often expose bad assumptions.

Check whether:

two-column layout still has enough room
popover should resize
toolbar needs compaction
side panel should become drawer

============================================================
# 73. ORIENTATION

Do not require one orientation unless the activity truly needs it.

Layouts should survive reasonable portrait/landscape changes.

Games/presentation surfaces may have specialized behavior,
but surrounding navigation must remain understandable.

============================================================
# 74. TOUCH + MOUSE + KEYBOARD

Interactive design must consider all three.

Do not rely on:

hover only
tiny mouse-only targets
drag only

If dragging performs an important function,
provide a simpler pointer alternative where applicable.

============================================================
# 75. VISUAL BALANCE

When reviewing a composition,
evaluate visual weight rather than only pixel equality.

A bright yellow button may visually weigh more
than two neutral controls.

Balance considers:

color
size
contrast
density
position
whitespace

Do not mathematically center elements that appear optically unbalanced.

============================================================
# 76. EMPHASIS BUDGET

A compact component should have a limited emphasis budget.

Do not simultaneously use:

bright border
bright icon
bright text
strong shadow
colored background
large badge

on every element.

Choose the few things that deserve attention.

============================================================
# 77. SEMANTIC DENSITY

Every visual treatment should communicate something.

If:

border
background
badge
icon
color
animation

does not improve meaning or interaction,
remove or reduce it.

============================================================
# 78. FAMILIAR PATTERNS

Prefer known interaction conventions.

Examples:

X closes
ellipsis opens more actions
chevron indicates navigation/expansion
trash means destructive deletion
magnifier means search

Do not create novelty where familiarity improves usability.

============================================================
# 79. CONSISTENCY VS CONTEXT

Consistency is valuable,
but context can override it.

Do not force identical layout where tasks differ.

For example:

profile popup
classroom Stage
game canvas

should share design language,
not identical component composition.

============================================================
# 80. LOCALIZATION RESILIENCE

Never rely on English-short labels.

Layouts must survive Vietnamese strings.

Avoid fixed button widths based on one language.

Use flexible sizing or responsive strategy.

============================================================
# 81. TEXT RESIZE

Critical UI should remain usable when users increase text size.

Do not lock line heights/heights so tightly
that resized text clips.

Buttons/cards should expand or reflow where appropriate.

============================================================
# 82. HORIZONTAL OVERFLOW — HARD FAILURE

For normal page content:

documentElement.scrollWidth
must not unexpectedly exceed
documentElement.clientWidth.

Never solve the root issue using:

body { overflow-x: hidden }

unless horizontal overflow is intentionally impossible
and root cause has already been verified.

Internal intentional scrollers are allowed.

============================================================
# 83. FIXED HEIGHT CAUTION

Do not use fixed height for variable-content cards
unless the design intentionally requires it.

Prefer:

min-height
content-driven height
max-height + internal scrolling

Fixed heights often cause Vietnamese text clipping.

============================================================
# 84. WIDTH CAUTION

Avoid arbitrary fixed width on reusable text/action components.

Prefer:

min-width
max-width
flexible tracks
clamp()
intrinsic sizing

Use fixed width only where the component genuinely requires it.

============================================================
# 85. CLAMP / FLUID VALUES

CSS clamp() may be used for:

responsive spacing
responsive headings
container dimensions

when it reduces breakpoint proliferation.

Do not make every value fluid.

Predictability remains more important.

============================================================
# 86. EMPTY SPACE DISTRIBUTION

Do not leave random dead zones created by bad alignment.

But do not eliminate intentional whitespace.

Whitespace should:

group
separate
focus
breathe

not merely consume leftover layout.

============================================================
# 87. VISUAL ORDER = DOM ORDER

Where practical,
DOM reading order should match visual order.

Do not use CSS ordering tricks that create confusing
keyboard/screen-reader navigation.

============================================================
# 88. DIALOG ACCESSIBILITY

Dialogs need:

clear title
logical initial focus
keyboard containment where required
Escape behavior when dismissible
focus return on close
accessible name

Backdrop must not leave background controls interactable.

============================================================
# 89. POPOVER ACCESSIBILITY

Popover positioning must avoid clipping.

If hover/focus reveals additional content,
ensure it can be perceived and dismissed appropriately.

Do not create popovers users cannot reach
with keyboard or pointer.

============================================================
# 90. DESTRUCTIVE VISUAL LANGUAGE

Danger styling is reserved for genuine destructive consequences.

Do not make normal "close" or "cancel" actions aggressively red
unless the consequence warrants it.

Red saturation should retain meaning.

============================================================
# 91. SUCCESS VISUAL LANGUAGE

Do not flood successful states with green.

A small:

icon
label
status
border accent

is usually enough.

Semantic color should signal,
not decorate.

============================================================
# 92. BADGES

Badges are for compact status/categorization.

Do not turn ordinary text into badges.

Too many badges destroy hierarchy.

If everything is a badge,
nothing stands out.

============================================================
# 93. COUNTERS

Counts must handle:

0
1
99
999+

without breaking the layout.

Large counts should have intentional formatting.

Do not reserve width only for one digit.

============================================================
# 94. TOOLTIPS

Use tooltips for:

ambiguous icon clarification
secondary explanation

Do not use tooltip to repair an incomprehensible primary UI.

Touch users cannot depend on hover tooltip.

============================================================
# 95. FEEDBACK LATENCY

When an action takes noticeable time,
show feedback quickly enough that users know it registered.

Do not trigger duplicate operations because the first click
appeared ignored.

Use disabled/pending state only where safe.

============================================================
# 96. OPTIMISTIC UI

Use optimistic updates only when failure is easy to reconcile
and security/correctness permits it.

For authoritative realtime/shared mutations,
prefer server-confirmed truth where necessary.

Do not fake completion.

============================================================
# 97. SKELETONS

Skeleton geometry should approximate final content geometry.

Do not create skeletons that are visually more complex
than the final component.

Avoid shimmer overload.

============================================================
# 98. RESPONSIVE IMAGES

Do not download unnecessarily huge images
for tiny display surfaces when practical.

Use appropriate sizing/loading strategies.

Avoid layout shift from missing dimensions.

============================================================
# 99. LAZY LOADING

Lazy-load below-the-fold or heavy content when useful.

Do NOT lazy-load the primary content in a way
that worsens perceived speed.

Performance decisions must reflect user experience,
not checklist compliance.

============================================================
# 100. DESIGN REVIEW QUESTION SET

Before declaring any UI work DONE,
look at the real rendered result and ask:

Is the primary purpose obvious?

Is anything clipped?

Is anything overlapping?

Is any button unnecessarily squeezed?

Are there too many visible cards?

Are there too many borders?

Are there too many accent colors?

Is the main action obvious?

Are secondary controls too prominent?

Does long Vietnamese text break it?

Does mobile feel deliberately designed?

Does tablet expose awkward gaps?

Does desktop feel composed rather than stretched?

Can anything be removed?

Is spacing rhythm coherent?

Are alignment lines clean?

Can I use it with keyboard?

Can I use it with touch?

Can I understand loading/error/empty states?

Can I click every visible action?

Is any invisible overlay blocking input?

Is content stable while loading?

If any important answer is NO:

the UI is not DONE.

============================================================
# 101. HARD FAIL CONDITIONS

Automatically FAIL the UI if ANY of these occur:

meaningful text clipped accidentally

button label cut off

unintentional overlap

unintentional page horizontal overflow

primary control outside viewport

transparent overlay blocks interaction

mobile tap target unusable

dialog/popover extends beyond usable viewport

keyboard trap

focus invisible

focus hidden by custom UI

fake data used to improve appearance

duplicate primary action in the same context

three-or-more-deep visual card nesting without strong justification

critical information conveyed by color alone

responsive design achieved only by shrinking text

layout requires hardcoded positional hacks to survive

============================================================
# 102. ACCESSIBILITY BASELINE

Target WCAG 2.2 AA for normal product UI.

Use WAI-ARIA APG for advanced widget behavior.

Treat accessibility as part of component correctness,
not a final polish pass.

============================================================
# 103. HUMAN-CENTRED DESIGN

Do not optimize for screenshots alone.

Optimize for people completing real tasks.

When choosing between two layouts,
prefer the one requiring:

less interpretation
fewer decisions
less movement
fewer steps
less memory

while preserving user agency.

============================================================
# 104. PRODUCT PSYCHOLOGY

Avoid manipulation.

Do not use:

fake urgency
dark patterns
misleading disabled states
preselected destructive choices
hidden cancellation
confusing confirm/cancel hierarchy

Digital Campus should feel trustworthy.

============================================================
# 105. TEEN PRODUCT WITHOUT CHILDISH DESIGN

The audience includes teens.

Youthful does NOT mean:

cartoon overload
rainbow everything
excessive emojis
gaming neon everywhere

Youthful should come from:

fast interaction
social presence
clear personality
subtle motion
quality illustrations/icons where appropriate
friendly concise language
well-chosen semantic accents

Keep it mature enough to age well.

============================================================
# 106. DESIGN SYSTEM EVOLUTION

Do not perform a giant design-system rewrite
during an unrelated feature task.

If repeated inconsistencies are found:

document the pattern
fix the smallest shared primitive/token
migrate affected components incrementally

Scope discipline remains mandatory.

============================================================
# 107. SOURCE OF TRUTH

Visual source hierarchy:

existing semantic design tokens
shared primitives
this constitution
component-specific composition

Do not hardcode one-off values before checking these layers.

============================================================
# 108. PRE-CODING GATE

Before editing UI:

READ:
AGENTS.md
root governance rule
this constitution

Then:

inspect the real page in browser

inspect relevant component

inspect parent constraints

inspect existing tokens/primitives

identify root cause

identify P0/P1/P2/P3 priorities

define expected mobile/tablet/desktop behavior

THEN code.

Do not begin by randomly changing Tailwind classes.

============================================================
# 109. FAST IMPLEMENTATION LOOP

During implementation:

reproduce
identify root cause
smallest coherent fix
targeted check

Do NOT run the entire project test suite
for every small CSS/layout edit.

Do NOT repeatedly deploy staging.

============================================================
# 110. VISUAL VERIFICATION

UI cannot be approved solely from source code.

Use a real browser.

For ordinary responsive UI changes,
verify representative widths relevant to the component.

Minimum practical set when the component spans all form factors:

360px
390px
768px
1366px

Also inspect 320px/reflow where appropriate
for shared critical UI.

Do not generate huge screenshot suites by default.

A few targeted browser checks are enough.

============================================================
# 111. BOUNDING / OVERFLOW CHECKS

When diagnosing layout bugs,
inspect actual DOM geometry.

Useful checks include:

getBoundingClientRect()

scrollWidth vs clientWidth

container bounds

pointer hit targets

fixed/sticky occlusion

Do not infer geometry only from Tailwind class names.

============================================================
# 112. REAL INTERACTION CHECK

Click/tap all actions affected by the change.

Especially verify:

primary action
secondary action
close
menu
popover
drawer
toolbar
navigation

A visually correct screenshot can still contain
an invisible pointer-interception bug.

============================================================
# 113. FAST QUALITY GATE FOR UI TASKS

Use existing project local-first workflow.

During editing:

targeted tests only.

When implementation is finished:

typecheck

lint changed files

targeted relevant tests

build:bundle

git diff --check

Full npm test is NOT required for an ordinary layout/CSS-only change
unless shared high-risk logic was changed.

GitHub CI is not part of this project's workflow.

============================================================
# 114. STAGING POLICY

Use staging when browser/runtime truth matters.

For a meaningful UI change:

deploy once after local verification.

Then perform targeted visual/browser smoke.

If one issue is found:

fix that issue
run its relevant checks
redeploy
verify the issue + nearby regression

Do not restart the entire QA pipeline blindly.

============================================================
# 115. NO PROGRESS NARRATION

Do not repeatedly tell the user:

"running"
"waiting"
"still testing"
"deploying"
"working"

Work silently.

Respond only when:

DONE

or genuinely:

BLOCKED

============================================================
# 116. CURRENT PROFILE POPUP FAILURE EXAMPLE

Treat the current user/profile popup as an example
of why this constitution exists.

Observed class of defect:

two actions were forced into insufficient horizontal space,
causing the Achievement label to be clipped.

Do NOT solve this only by making that one label shorter.

The root rule is:

when actions do not fit comfortably,
reflow/collapse according to priority.

Also audit:

nested-card weight
relationship action hierarchy
message action prominence
achievement prominence
long names
level/XP layout
mobile width
close-button spacing
popup viewport fit

But do not redesign unrelated application areas.

============================================================
# 117. FINAL ACCEPTANCE

A UI implementation may report PASS only when:

ZERO accidental overlap

ZERO accidental clipping of meaningful labels

ZERO unintended page-level horizontal overflow

ZERO inaccessible primary actions

ZERO pointer interception on changed interactions

responsive behavior is intentional

visual hierarchy is understandable

the result uses the existing design language

real browser verification has been performed

============================================================
# 118. REQUIRED FUTURE BEHAVIOR

This constitution is permanent.

The user should NEVER need to paste it again.

For EVERY future UI/UX task:

the agent must read it before coding.

If the task is tiny:

apply the relevant rules without over-testing.

If the task is large:

perform a broader visual audit.

Do not reinterpret "permanent rule" as permission
to redesign unrelated components.

============================================================
# 119. STREAMLINED CAMPUS & ANTI-REDUNDANCY INVARIANTS

1. ONE CANONICAL NAVIGATION SURFACE:
Top Header (AppHeader) is the sole canonical navigation surface for the primary destinations:
Học tập (/learn), Game (/arena), Cộng đồng (/community).
Never display a parallel desktop sidebar repeating these destinations.
Desktop layout must remain a spacious, uncluttered single-canvas experience.

2. ZERO REDUNDANT FILLER CARDS:
Never add shortcut cards (such as "Cộng đồng & Bảng tin", "Bảng vinh danh", "Vào phòng học")
into content columns merely to equalize column heights or fill empty space.
Whitespace is valid UI and creates visual calm ("thoáng con mắt").

3. ZERO COMPETING HERO CTAs:
Hero banners must not duplicate the core actions of the content sections immediately below them.
A single primary action (e.g. "+ Tạo phòng học") or pure welcoming status is preferred.
