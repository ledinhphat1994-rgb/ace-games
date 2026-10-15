# THƯ VIỆN TÀI NGUYÊN & SHADER ACE GAMES (GODOT 4)

Tài liệu này tổng hợp toàn bộ các thư viện tài nguyên, Shader, Procedural Audio Generator và State Machine đã được cài đặt và cấu trúc sẵn trong dự án.

---

## 1. Danh Mục Shader Tuyển Chọn (`res://shaders/`)

| Shader File | Mô tả | Ứng Dụng Thực Tế |
| :--- | :--- | :--- |
| `black_hole_lens.gdshader` | Hiệu ứng bẻ cong không gian Einstein Ring & Event Horizon | Gán vào quả cầu Trọng Lực khi ở chế độ **Hố Đen Hút Tâm**. |
| `shockwave_distortion.gdshader` | Hiệu ứng sóng chấn động tỏa tròn (Screen Ripple) | Kích hoạt khi **Railgun** bắn hoặc khi tiêu diệt Quái Thiết Giáp. |
| `space_nebula_background.gdshader` | Nền tinh vân vũ trụ và bụi sao procedural 100% | Gán vào Background của màn chơi thay thế ColorRect tĩnh. |
| `energy_shield_hex.gdshader` | Màng chắn năng lượng tổ ong lục giác Sci-Fi | Tạo khiên phòng vệ cho **Căn Cứ** hoặc Quái Thiết Giáp. |
| `neon_glow_pulse.gdshader` | Phát sáng viền Neon Hologram theo chu kỳ thở (Pulse) | Tăng cường độ phát sáng cho Tháp Plasma, Đạn năng lượng và UI. |

---

## 2. Thư Viện Âm Thanh Procedural (`res://addons/procedural_audio/`)

Không cần tải file MP3/WAV bên ngoài, mã nguồn sinh trực tiếp dạng sóng nhị phân `AudioStreamWAV` tức thì:

```gdscript
# Ví dụ phát âm thanh bắn laser trong script bất kỳ:
var laser_stream = ProceduralAudioGenerator.generate_laser_sound(880.0, 140.0, 0.18)
$AudioStreamPlayer2D.stream = laser_stream
$AudioStreamPlayer2D.play()

# Tiếng nổ tung:
var boom = ProceduralAudioGenerator.generate_explosion_sound(0.4)

# Tiếng nhặt vàng:
var coin = ProceduralAudioGenerator.generate_coin_sound()

# Tiếng rung trường trọng lực:
var hum = ProceduralAudioGenerator.generate_gravity_pulse_sound()
```

---

## 3. Các Addon & Plugin Đỉnh Cao Từ Godot Asset Store & GitHub (`res://addons/`)

Đã tải, cài đặt và tích hợp sẵn vào dự án:
- **`gut` (Godot Unit Test)** ([bitwes/Gut](https://github.com/bitwes/Gut)): Framework kiểm thử tự động tiêu chuẩn công nghiệp cho Godot 4.
  * Lệnh chạy test nhanh: `npm run game:test` (hoặc `godot --headless --path games-dev/godot-project -s addons/gut/gut_cmdln.gd -gdir=res://test/unit -gexit`).
  * Test suite mẫu: `res://test/unit/test_game_manager.gd` (5/5 tests passed).
- **`phantom_camera`** ([Ramokz](https://store.godotengine.org/asset/ramokz/phantom-camera/)): Addon điều khiển Camera 2D/3D chuyên nghiệp nhất Godot Engine (Cinemachine của Unity) với cơ chế bám đuổi mục tiêu, zoom, screen shake, chuyển đổi mượt mà.
- **`dialogue_manager`** ([Nathan Hoad](https://store.godotengine.org/asset/nathanhoad/dialogue-manager/)): Hệ thống cốt truyện & hội thoại phân nhánh số 1 trên Godot Asset Store.
- **`rmsmartshape` (SmartShape2D)** ([SirRamEsq](https://github.com/SirRamEsq/SmartShape2D)): Công cụ tạo địa hình, đường cong bề mặt và ranh giới chiến trường 2D tự động theo đường vector.
- **`procedural_audio`**: Bộ tổng hợp âm thanh thời gian thực (Zero-Asset) không cần file ngoài.
- **`state_machine`**: Bộ khung Máy trạng thái hữu hạn (FSM) phân tầng cho Entity & Tower (`FsmState`, `FsmStateMachine`).

---

## 4. Thư Viện Vector Icons SVG (`res://assets/icons/`)

Đồ họa vector phát sáng sắc nét, không bị vỡ hạt ở mọi độ phân giải:
- `plasma_bow.svg`: Biểu tượng Cung Năng Lượng Plasma.
- `railgun_cannon.svg`: Biểu tượng Khẩu Pháo Xung Lực Heavy Railgun.
- `void_vortex.svg`: Biểu tượng Trụ Ma Pháp Hư Không.
- `gravity_core.svg`: Biểu tượng Quả Cầu Phản Trọng Lực.
- `gold_coin.svg`: Biểu tượng Tiền Vàng.
- `base_shield.svg`: Biểu tượng Màng Chắn Căn Cứ.

---

## 5. Danh Mục Kho Tài Nguyên Mã Nguồn Mở Mở Rộng Tuyển Chọn (CC0 / MIT)

### A. Template & Mã Nguồn Mẫu (Templates & Demos)
- **[GDQuest Repositories](https://github.com/gdquest):** Kho dự án mẫu chuẩn phong cách lập trình Godot 4 (Inventory, State Machine, 2D/3D Controllers).
- **[Itch.io (tag-godot + template)](https://itch.io/game-assets/free/tag-godot/tag-template):** Các bộ khung làm sẵn từ cộng đồng Indie (Tower Defense, Card Framework, Top-down shooter).
- **[Awesome-Godot](https://github.com/godotengine/awesome-godot):** Danh bạ mã nguồn mở toàn diện nhất cho Godot.

### B. Hệ Thống Cốt Lõi Mã Nguồn Mở
- **[Dialogic 2](https://github.com/dialogic-godot/dialogic):** Hệ thống hội thoại Visual Novel / RPG đồ sộ cho Godot 4.
- **[LimboAI](https://github.com/limbonaut/limboai):** Behavior Trees & State Machine C++ tốc độ cao cho AI quái vật.
- **[Terrain3D](https://github.com/TokisanGames/Terrain3D):** Công cụ vẽ địa hình 3D quy mô lớn.

### C. Đồ Họa 2D, 3D & Texture PBR
- **[KayKit (Itch.io)](https://kaylousberg.itch.io/):** Mô hình 3D low-poly .gltf phong cách hoạt hình miễn phí CC0.
- **[Poly Haven](https://polyhaven.com/):** Texture PBR, HDRI Skybox chất lượng cao.
- **[Material Maker](https://www.materialmaker.org/):** Công cụ tạo Texture procedural viết bằng Godot Engine.
- **[Game-Icons.net](https://game-icons.net/):** Hơn 4.000 biểu tượng SVG/PNG vector chiến thuật.

### D. Mẹo Lựa Chọn Tài Nguyên Cho Godot 4
- **Tìm kiếm GitHub:** Sử dụng `topic:godot-4` sắp xếp theo Most stars.
- **Tương thích:** Luôn kiểm tra xem asset viết cho Godot 3.x hay Godot 4.x để tránh xung đột cú pháp GDScript và Shader.
