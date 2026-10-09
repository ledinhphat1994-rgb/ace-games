---
trigger: always_on
---

# Digital Campus v2 — Game Quality & Verification Standards

> **Gaming Arena Quality & Architecture Constitution**
> The Digital Campus Game Arena provides engaging, modern, high-performance web games for students. Games represent a core social and recreational pillar of the platform.

---

## 1. Engine & Technology Direction
- **Phaser as Primary 2D Direction:** Game development must use the repository-pinned current Phaser major, currently Phaser 4.x / package version 4.2.1. It is the authoritative standard for 2D arcade, board, puzzle, and platform experiences in Digital Campus, ensuring deterministic scene management, asset preloading, canvas/WebGL fallback, and rich plugin ecosystems. Never downgrade to Phaser 3 APIs or documentation without an explicit migration decision. Future research should use documentation matching the installed major.
- **3D & Next-Gen Exploration:** Where 3D brings tangible educational or gameplay value, Three.js, Babylon.js, or raw WebGPU may be leveraged.
- **Progressive Enhancement:** Implement WebGPU with progressive enhancement and graceful WebGL2/Canvas fallbacks to guarantee high frame rates across low-power mobile devices and Chromebooks.

## 2. Polished Gameplay Over Quantity
- Prioritize depth, crisp controls, game feel, and visual charm over a high quantity of shallow games.
- Every game must feel rewarding within 5 seconds of launch: clear mechanics, responsive touch/click input, and satisfying juice (screen shake, impact freeze, audio chimes).

## 3. Input & Control Expectations
- **Multi-Input Support:** Provide first-class support for Touch (on-screen thumbsticks/buttons with haptics), Keyboard (WASD + Arrow mappings), and Gamepad API where appropriate.
- **Mobile-First Ergonomics:** Touch controls must not obscure critical visual elements or UI HUDs. Touch zones must be forgiving and clearly indicated.

## 4. Audio, Particles & Visual Polish
- **Physics & Motion:** Tuned physics with snappy acceleration, coyote time for jumps, and responsive collisions.
- **Particle Systems:** Juiced particle emitters for achievements, impacts, rewards, and victories to heighten player delight.
- **Camera & Shakes:** Contextual camera zooms, screen shake on impacts, and smooth tracking.
- **Audio Feedback:** Synthesized Web Audio or lightweight audio sprites for clicks, movements, hits, and victory fanfares, with global mute/volume persistence.

## 5. Server-Authoritative Simulation & Anti-Cheat
- **Multiplayer & Competitive Parity:** All ranked multiplayer matches, turn-based duels (Caro, Chess), and competitive high-score leaderboards must be server-authoritative.
- **Input Trace Verification:** Game DO (Durable Object) or Worker verifiers inspect timestamped input traces or seed-based state transitions rather than trusting client-reported scores.
- **Rate-Limiting & Validation:** Enforce strict action bounds, cooldown intervals, and state bounds to prevent botting or score injection.

## 6. Công Thái Học & Vùng Chạm Ngón Cái (Thumb-Zone & Touch Targets)
- **Phân vùng thao tác 3 tầng màn hình:**
  * **Vùng xanh (Dưới cùng - 40% màn hình):** Đặt 100% các nút tương tác chính trong gameplay (nút bắn, nút điều hướng rắn, nút tung xúc xắc, thanh chọn đáp án) và các nút kêu gọi hành động (CTA) như "Bắt đầu", "Nhận thưởng".
  * **Vùng vàng (Giữa màn hình - 40%):** Dành riêng cho vùng hiển thị không gian chơi game (bàn cờ, đường bay của đạn, sân đấu rắn).
  * **Vùng đỏ (Đỉnh màn hình - 20%):** Chỉ đặt các thông tin thụ động (thanh máu, level hiện tại, số vàng, số kim cương, nút Cài đặt/Tạm dừng).
- **Kích thước điểm chạm tối thiểu:** Nút bấm phải đạt kích thước từ 48 × 48 dp (Android) hoặc 44 × 44 pt (iOS) trở lên (`min-w-[48px] min-h-[48px]`). Khoảng cách an toàn giữa 2 nút bấm liền kề tối thiểu là 8 – 12 px để triệt tiêu hiện tượng bấm nhầm khi người chơi thao tác nhanh.
- **Tôn trọng Safe Area & Cạnh cong:** Đảm bảo toàn bộ UI cách mép viền tối thiểu 16–24px để không bị che khuất bởi cụm camera đục lỗ (punch-hole) hoặc thanh vuốt điều hướng đáy màn hình của hệ điều hành (`env(safe-area-inset-bottom)`).

## 7. Tối Giản Giao Diện Trong Trận Đấu (Minimalist HUD & Progressive Disclosure)
- **Quy tắc "Không làm mù mắt người chơi":** Khi đang trong ván game (Rắn săn mồi hay bắn tọa độ, cờ), ẩn hoàn toàn các thanh menu, bảng nhiệm vụ hay thanh điều hướng bên dưới. Màn hình chỉ giữ lại điểm số hiện tại và nút tạm dừng bán trong suốt (opacity 50%).
- **Tiết lộ lũy tiến (Progressive Disclosure):**
  * Người chơi cấp 1–3 chỉ thấy nút "Chơi ngay" và "Nhiệm vụ hàng ngày".
  * Các tính năng nâng cao (Đấu trường xếp hạng, Bang hội, Chế độ phòng học VIP) chỉ hiển thị khi người chơi đạt đến cấp độ tương ứng để tránh gây quá tải thông tin ngay ngày đầu.
- **Quy tắc 3 chạm để chơi (3-Tap Rule):** Từ lúc mở icon app đến lúc bóng lăn hoặc đạn bay không được vượt quá 3 lần chạm màn hình và dưới 4 giây. Tuyệt đối không chặn người chơi bằng 3–4 popup quảng cáo hay thông báo liên tiếp lúc mới khởi động app.

## 8. Vòng Lặp Phản Hồi 3 Giác Quan (Sensory Feedback Loop)
- Mọi thao tác thành công trong game phải kích hoạt đồng thời 3 phản hồi trong vòng < 100ms:
  * **Thị giác (Visual):** Nút bấm lún xuống hoặc nảy nhẹ (`active:scale-95`). Khi ăn điểm hoặc bắn trúng, hiển thị số điểm bay lên (+10 XP) kèm hiệu ứng hạt vỡ vụn nhẹ (particle burst).
  * **Âm thanh (Audio):** Tiếng "click" sắc gọn khi bấm nút thường, tiếng "ting" thanh thoát khi nhận thưởng, và âm thanh chiến thắng hào hùng khi qua màn (`playUiTapSound`, `playMatchFoundSound`, `playVictoryConfettiSound`).
  * **Xúc giác (Haptics):**
    - Chạm nút thường: Rung nhẹ (`triggerHaptic('selection')` hoặc `light`).
    - Bắn trúng đích / Ăn mồi: Rung nảy (`triggerHaptic('medium')`).
    - Lên cấp / Mở rương thành công: Rung nhịp kép mạnh mẽ (`triggerHaptic('success')`).

## 9. Thiết Kế Thanh Cấp Bậc & Giữ Chân Tâm Lý (Gamification UX)
- **Thanh tiến trình động (Dynamic XP Bar):**
  * Đặt thanh XP ngay góc trên hoặc màn hình chính.
  * Khi người chơi nhận điểm kinh nghiệm từ game hoặc bài tập, thanh này phải có hiệu ứng chạy đầy từ trái sang phải, phát sáng nhấp nháy khi gần đầy (`progressPercent >= 80%`) để kích thích tâm lý "cố chơi thêm 1 ván nữa để lên cấp".
- **Màn hình thăng hạng toàn cảnh (Celebration Screen):** Khi lên cấp, làm mờ nền màn hình, đẩy huy hiệu mới ra chính giữa với hiệu ứng xoay tia sáng, hiển thị rõ những đặc quyền mới mở khóa kèm duy nhất một nút lớn: "Tuyệt vời / Tiếp tục".
- **Cơ chế ngọn lửa điểm danh (Streak Tracker):** Hiển thị số ngày duy trì liên tục kèm biểu tượng ngọn lửa rực sáng. Thiết kế cảnh báo mất chuỗi bằng màu cam nổi bật khi sắp hết ngày (trước 24:00) để kéo người dùng vào mở app.

## 10. Bố Cục Quảng Cáo Không Gây Ức Chế (Ethical Ad Placement)
- **Khoảng cách chống bấm nhầm:** Nút xem quảng cáo nhận thưởng (Rewarded Ad) phải tách biệt rõ ràng với nút "Chơi lại" hoặc "Thoát ván". Không bao giờ đặt quảng cáo sát nút điều hướng để tránh vi phạm chính sách của Google Play và gây bực mình cho người dùng.
- **Minh bạch giá trị trao đổi:** Nút quảng cáo phải ghi rõ phần thưởng người dùng sẽ nhận được bằng icon trực quan (ví dụ: Icon video đi kèm dòng chữ +1 Tim hoặc x2 XP), không được để nút mập mờ.

## 11. Độ Tương Phản & Khả Năng Đọc Lướt (Readability & Dark Mode)
- **Tương phản chuẩn 4.5:1:** Mọi văn bản điểm số, tên người chơi và cấp bậc phải đạt tỷ lệ tương phản tối thiểu 4.5:1 so với nền game để dễ đọc ngay cả khi chơi dưới trời nắng.
- **Kích thước chữ:** Cỡ chữ tối thiểu cho nội dung phụ là 14sp/pt, chữ nội dung chính từ 16sp/pt trở lên, các con số điểm/cấp bậc quan trọng phải dùng kích thước lớn 24 – 32sp/pt và in đậm.
- **Chế độ nền tối (Dark Mode):** Thiết kế bảng màu mặc định có tông tối hoặc hỗ trợ Dark Mode đầy đủ để giảm mỏi mắt cho người học và tiết kiệm pin OLED khi chơi lâu.
