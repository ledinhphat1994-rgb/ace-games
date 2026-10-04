---
trigger: always_on
---

# Digital Campus v2 — Root Governance Constitution

> **Authoritative Baseline & North Star Governance**
> Digital Campus is a realtime social, learning, and multiplayer platform for teens and schools. Every contributor, AI agent, and automation tool must strictly adhere to these fundamental principles.
>
> **MANDATORY DESIGN GATE:** BẮT BUỘC ĐỌC VÀ TUÂN THỦ TOÀN BỘ QUY TẮC THIẾT KẾ GIAO DIỆN WEB (Mục 8, 12, 17, 18 và 10-ui-ux-layout-constitution.md) TRƯỚC KHI THỰC THI CHỈNH SỬA BẤT KỲ GIAO DIỆN NÀO.

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
- **Quy tắc bắt buộc khi sửa bất kỳ nội dung chức năng/giao diện nào (Chỉ ghi tiêu đề, tuyệt đối cấm chú thích):** Tuyệt đối KHÔNG ĐƯỢC CHÚ THÍCH, CHỈ GHI TIÊU ĐỀ. Cấm tự ý chèn thêm văn bản bổ sung, mô tả phụ, hướng dẫn sử dụng, phụ đề (subtitles/descriptions), tags giải thích, đoạn văn chú thích đi kèm hay nhãn giải nghĩa cho tiêu đề/tùy chọn đó.
- **Tuyệt đối không đè phần tử giữa các card cố định & Ưu tiên Top-Layer cho Popup mới nhất (Zero Overlap Invariant & Fixed Cards Non-Overlap & Top-Layer Stacking):** Các card cố định trên màn hình TUYỆT ĐỐI KHÔNG BAO GIỜ ĐƯỢC ĐÈ LÊN NHAU. Mọi phần tử cố định phải có ranh giới cấu trúc rõ ràng qua CSS Grid / Flexbox, padding và margin độc lập. Chỉ khi là card popup tạm thời (Dialog, Popover, Dropdown Menu, Tooltip, Sheet drawer) thì card popup nào được mở gần đây nhất mới có quyền hiển thị trên cùng (Top-Layer / Stacking context cao nhất) các card khác.
- **Khoảng cách thông thoáng & Nhịp điệu không gian (Breathing Room & Spacing Rhythm Invariant):** Luôn luôn duy trì khoảng cách (margin, padding, gap) hợp lý, rõ ràng và nhất quán giữa các card, giữa các tiêu đề và giữa các khối nội dung với nhau. Tuyệt đối không để các card, nút bấm hay nhãn dính sát rạt vào nhau gây cảm giác ngột ngạt; giữ cho trải nghiệm nhìn vào thật sự "thoáng con mắt", tôn trọng khoảng trống tự nhiên (whitespace).
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
- **Card stability when configuring (Card Stability Invariant):** Mọi card, modal dialog hoặc panel khi người dùng cấu hình, chuyển tab hoặc chỉnh sửa nội dung bên trong BẮT BUỘC giữ chiều cao và bố cục cố định (Fixed Dimensions / Reserved Slots), tuyệt đối không để layout bị co giật, sụt lún hay đẩy lệch các nút hành động (Footer CTA).
- **Card cố định không di chuyển khi thao tác chuyển đổi (Fixed Dimensions & Zero Movement on Toggle / Transition):** Các card cố định BẮT BUỘC KHÔNG ĐƯỢC DI CHUYỂN khi người dùng thao tác chuyển đổi (chuyển tab, chọn trò chơi, chọn mốc thời gian, chuyển chế độ Công khai / Riêng tư, bật/tắt tùy chọn). Toàn bộ tọa độ vị trí (x, y) của card, các tiêu đề bên trong và nút hành động chính (Footer CTA) phải đứng yên 100%, không co giật hay xê dịch dù chỉ 1 pixel.
- **Cố định các card con bên trong card mẹ (Sub-card Stability & Coordinate Locking Invariant):** Mọi card con, nút chọn hoặc panel bên trong một card mẹ/dialog (như card chọn game, card chọn thời gian, card chế độ phòng, card nhập mật khẩu) BẮT BUỘC phải giữ nguyên tọa độ (x, y) và chiều cao cố định khi người dùng chuyển đổi giữa các game (ví dụ từ game 1v1 sang game chơi đơn) hoặc giữa các chế độ. Vùng thời gian/cấu hình phải dành sẵn slot cố định có chiều cao đồng nhất, tuyệt đối không được co rút hay phình to làm dịch chuyển các card con lân cận.
- **Thiết kế 1 hàng tinh gọn cho card tùy chỉnh (Single-Row Inline Control Invariant):** Card tùy chỉnh/trạng thái (như thanh thời gian lượt) BẮT BUỘC chỉ thiết kế duy nhất 1 hàng cố định (`h-9` hoặc `h-10`). Khi chuyển sang chế độ tùy chỉnh, hiển thị bộ điều khiển (stepper, nút tăng giảm) ngay trên chính hàng đó, TUYỆT ĐỐI KHÔNG sinh thêm hàng thứ 2 gây dư thừa, khựng chuyển động hay làm sụt lún đẩy các card bên dưới.
- **Nút hành động cố định vị trí & Chống đè Footer CTA (Fixed Action Placement & Zero Overlap with Footer CTA):** Nút hành động chính (Footer CTA như Hủy, Tạo bàn ngay, Lưu, Áp dụng) phải luôn đứng yên tại vị trí chuẩn, không bị đẩy lên kéo xuống giật cục khi người dùng thao tác. Luôn duy trì khoảng đệm an toàn (khoảng cách >= 12px) giữa card con cuối cùng và thanh Footer CTA, tuyệt đối không để card hay nội dung đè lên các nút thao tác.
- **Cố định tiêu đề & nhãn trong card (Fixed Title & Label Invariant):** Ngoài việc cố định chiều cao của card, các tiêu đề và nhãn trường (như nhãn "Mật khẩu phòng:", tiêu đề cấu hình, nhãn thời gian...) bên trong card hoặc modal dialog khi người dùng chuyển tab / chuyển chế độ (ví dụ chuyển giữa Công khai và Riêng tư) BẮT BUỘC phải đứng yên tại một vị trí tọa độ cố định, tuyệt đối không được nhảy lên nhảy xuống (nhảy từ giữa lên trên hoặc ngược lại) giữa các trạng thái. Tách nhãn thành dòng cố định riêng biệt phía trên ô dữ liệu để cấu trúc khung và vị trí chữ luôn bất biến ở mọi chế độ.
- **Bắt buộc đọc rule thiết kế trước khi sửa (Mandatory Design Gate):** Trước khi sửa bất kỳ mã nguồn UI/UX nào, AI BẮT BUỘC phải đọc và tuân thủ các quy tắc thiết kế hệ thống (không chú thích, card cố định, tiêu đề cố định, không đè phần tử, nhịp điệu khoảng cách thoáng mắt, viền đồng nhất, không dùng transition-all gây giật/khựng). Áp dụng đồng bộ cho toàn bộ website.
- **Viền đồng nhất & Chống khựng chuyển động (Zero-Stutter Motion & Uniform Border Invariant):**
  * Tuyệt đối KHÔNG dùng `transition-all` cho các nút bấm, tab, card hoặc modal có thay đổi trạng thái kích thước hay đường viền; chỉ được dùng `transition-colors duration-150` để chuyển đổi màu sắc (màu nền, màu viền, màu chữ).
  * Giữa trạng thái được chọn (active) và chưa chọn (inactive), BẮT BUỘC phải dùng cùng độ dày đường viền (ví dụ `border-2` cho cả 2 trạng thái). Tuyệt đối cấm đổi giữa `border` (1px) và `border-2` (2px) để loại bỏ 100% hiện tượng khựng, co giật viền.
- **Cân đối card cùng cấp (Peer Card Uniformity & Grid Consistency Invariant):**
  * Các card hoặc nút lựa chọn cùng cấp danh mục (như danh sách trò chơi, các mốc thời gian, các tùy chọn chế độ) BẮT BUỘC phải có kích thước, tỷ lệ, độ cao và độ rộng đồng đều và nhất quán theo lưới CSS. Tuyệt đối không để một card tự ý kéo dài (như gán `col-span-2`) trong khi các card cùng cấp khác chỉ chiếm 1 cột, gây mất cân đối thị giác.
- **Giữ nguyên cấu trúc DOM và chỉ báo (Persistent DOM Node & Reserved Indicator Invariant):**
  * Các chỉ báo (như dấu chấm tròn `size-2`, icon check, icon ẩn/hiện mật khẩu) phải luôn được giữ nguyên slot trong DOM và điều khiển bằng `opacity-0` / `opacity-100` hoặc padding dành sẵn, tuyệt đối không unmount/remount làm dịch chuyển vị trí chữ hoặc gây reflow/repaint khựng khung hình.



## 13. Security Authority & Data Invariants
- **Single-Device Session Enforcement:** Strict 1-account-1-device policy via `thiet_bi` column. New logins evict older sessions with WebSocket code `4001`.
- **Password Security:** PBKDF2-SHA256 with user-specific iteration counts stored in `tai_khoan_campus.iterations`.
- **Fail-Closed Moderation:** Banned users in `phong_ban` are immediately rejected (HTTP 403 / 503). Server evaluates admission; client claims are never trusted.

## 14. Secret & Environment Handling
- Never commit secrets, credentials, API keys, or private tokens to Git.
- Local configuration resides in `.dev.vars` / `.env.e2e` (git-ignored).
- Production and staging environments must maintain isolated D1, KV, and R2 bindings.

## 15. Delivery Workflow & Release Safety (4-Step Lean Flow)
- Pipeline: Targeted local -> Final local once (`typecheck` -> `lint` -> `targeted test` -> `build:bundle` -> `diff check`) -> Staging only if needed -> Production guard + smoke.
- Bỏ hẳn `npm test` toàn bộ trong flow thường ngày / UI tasks (chỉ chạy Targeted Test 2-3s) để tiết kiệm CPU và tránh nóng máy / nghẽn tài nguyên. Toàn bộ test suite chỉ chạy trước khi deploy production.
- Risk-Based Verification: Run tests and gates corresponding strictly to the real risk of the diff. Do not run release guard for UI changes.
- Pre-commit Hook: Fast staged check only (`git diff --cached --check` and lint staged files). No full test suite or typecheck in pre-commit.
- Migration Immutability: Applied migrations in `migrations/` are immutable. New changes require sequentially numbered files.
- Production Releases: Require human authorization and pass production release guard (`main sạch + HEAD == origin/main + config đúng`).

## 16. Truthful & Concise Reporting
- Báo cáo ngắn gọn khi hoàn tất: `DONE`, `LOCAL CHECK: PASS`, `TESTS: x/x`, `STAGING: <version | NONE>`, `PR: #xx`, `PRODUCTION: UNTOUCHED`.
- Báo cáo khi bị chặn: `BLOCKED`, `CAUSE: <1 câu>`, `NEED: <thứ cần quyết định>`.
- Tuyệt đối không tường thuật trạng thái chờ ("đang chạy", "đang chờ", "build đang chạy").

## 17. Non-Obscuring Popup & Transparent Backdrop Invariant
- **Tuyệt đối không bao giờ được ẩn khu vực xung quanh khi bật bất kỳ popup nào có trong web:** Khi mở popup, dialog, modal, drawer, sheet hay context view, TUYỆT ĐỐI KHÔNG che lấp, làm tối đen (pitch black) hoặc làm mờ nhòe (heavy backdrop blur) khu vực xung quanh.
- **Backdrop trong suốt tối đa:** Lớp phủ backdrop chỉ dùng tối đa `bg-black/10` hoặc `bg-transparent` kèm click-to-dismiss, loại bỏ hoàn toàn `bg-black/45`, `bg-black/60` và `backdrop-blur-[3px]`, giữ nguyên vẹn 100% độ sắc nét và màu sắc của trang web phía sau.
## 18. Balanced Blueprint Background & Skeuomorphic Aesthetic Invariant
- **Họa tiết nền mờ phân bổ toàn diện & cân đối (Balanced Blueprint Watermark):** Khi sử dụng họa tiết đồ họa chìm / blueprint vi mạch cho card hoặc modal, BẮT BUỘC phải phân bổ hài hòa, đồng đều ở tất cả các khu vực (góc trên trái, góc trên phải, giữa các cạnh bên, góc dưới trái, góc dưới phải và lưới chấm chìm toàn diện). Tuyệt đối KHÔNG được chỉ đặt họa tiết dồn cục ở duy nhất một góc (như góc trên bên phải) làm mất cân bằng bố cục thị giác.
- **Độ mờ tinh tế & không gây nhiễu (Calm & Non-Distracting Contrast):** Họa tiết nền mờ chỉ được dùng nét mảnh (`strokeWidth="1"` hoặc `0.8`), tông màu dịu nhẹ (`rgba(56, 189, 248, 0.10)` - `0.14`), lưới chấm mờ (`0.06` - `0.08`), tuyệt đối không dùng màu quá sáng hoặc các hình khối đặc gây chói mắt hay cạnh tranh thị giác với văn bản và nút bấm chính.
- **Đường bao mỏng 1px với dải sáng nhẹ trung tâm hai bên:** Card sử dụng đường bao mảnh 1px (`border: 1px solid rgba(...)`), kết hợp hiệu ứng sáng nhẹ ở giữa hai cạnh bên qua pseudo-elements `::before` và `::after` (`top: 20%; bottom: 20%; width: 1.5px; linear-gradient`).
- **Cố định cạnh trên của modal khi co giãn kích thước:** Khi mở rộng card modal, chỉ mở rộng sang hai cạnh bên (chiều rộng) và cạnh dưới (chiều cao), giữ nguyên tọa độ cạnh trên (`top: 72px`, `translate: -50% 0`, `transform: none`), tuyệt đối không để cạnh trên bị kéo trôi lên sát nóc viewport.
- **Cố định tuyệt đối các card con và nút bấm bên trong:** Sub-card, nút chọn, stepper tùy chỉnh chỉ nằm trên 1 hàng duy nhất (`h-9`), slot thời gian luôn cố định chiều cao `114px` ở cả chế độ 1v1 lẫn chơi đơn. Duy trì khoảng cách an toàn >= 12px với thanh Footer CTA, tuyệt đối không đè card/nội dung lên nhau.

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
