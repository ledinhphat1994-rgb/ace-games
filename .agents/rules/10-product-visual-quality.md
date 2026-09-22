# Digital Campus v2 — Product & Visual Quality Standards

> **Visual Direction & Aesthetic Standards**
> Digital Campus combines the energy of modern social platforms with the polish of casual gaming and the clarity of collaborative learning.

---

## 1. Teen Digital Campus Aesthetic
- The target audience is high school students (grades 10-12).
- The aesthetic must feel like a vibrant, welcoming digital world—NOT an enterprise admin panel, corporate portal, or sterile LMS.
- Visual elements should convey community, discovery, and creative energy.

## 2. Anti-SaaS & Anti-Card-Wall Constraints
- **Avoid Boxing Everything:** Do not trap every piece of information inside nested rounded cards with heavy borders.
- **Visual Breathing Room:** Group related controls with subtle surface elevation, directional gradients, and generous whitespace rather than redundant borders.
- **Reduce Micro-Copy:** Remove explanatory subtitles, superfluous instructions, and repetitive tags. If an icon and title make the feature obvious, let them speak.

## 3. Restrained Color Roles
- **Backgrounds:** Deep neutral surfaces (`#080d19`, `#0a0f1d`) that let content and media shine without visual fatigue.
- **Primary Accent (Cyan / Sky):** Represents core interaction, primary navigation, and study focus.
- **Secondary Accent (Emerald / Social):** Represents multiplayer games, live presence, and peer connectivity.
- **Reward Accent (Amber / Gold):** Reserved exclusively for milestones, streaks, achievements, and recognition.
- **Semantic Accents:** Rose/Red for destructive actions or single-device eviction; Emerald for verified active status.
- **Rule:** Never assign a different saturated rainbow color to every tile on the same view. Harmony and hierarchy come first.

## 4. Typography Hierarchy & Contrast
- Clean geometric sans typography (Geist / Inter) with distinct scale:
  * Display headlines: `text-2xl` to `text-4xl`, font-black / font-extrabold.
  * Section titles: `text-sm` to `text-base`, font-bold.
  * Interactive labels: `>= text-xs` (12px), font-semibold.
- **Anti-Pattern:** Eliminate unreadable sub-12px microtext (`text-[9px]`, `text-[10px]`, `text-[11px]`) unless strictly justified as secondary metadata.

## 5. Coherent Artwork & Personality
- Custom teen-illustrated avatars, hand-crafted campus illustrations, and cohesive room card artwork.
- Avoid generic stock photography, AI-hallucinated cyber blobs, and excessive synthetic glow effects. Let the artwork and subtle directional shadows create natural depth.

## 6. Motion & Micro-Interactions
- Smooth, intentional transitions on hover and active states (scale 1.02, subtle translation, gentle shadow deepening).
- Never use distracting, infinite looping animations or jarring sudden layout shifts.

## 7. Mobile-Specific Visual Review
- All views must be independently evaluated at 390px (iPhone standard width).
- Complex desktop popovers must morph into full-width sliding bottom sheets with accessible drag handles.
- Touch targets must measure at least 40x40px to ensure effortless one-handed mobile operation.
