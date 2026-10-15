# Ace Games — Godot Game Development Studio (`games-dev`)

Môi trường phát triển trò chơi chuyên nghiệp kết hợp **Godot Engine 4** và ứng dụng **Ace Games (Web & Mobile Native)**.

---

## 📁 Cấu trúc thư mục

```text
games-dev/
├── godot-project/            # Dự án Godot chính (Mở trực tiếp bằng Godot Editor)
│   ├── project.godot         # Cấu hình Godot 4 (Compatibility Renderer cho Mobile & Web)
│   ├── export_presets.cfg    # Cấu hình xuất bản Web HTML5 (Single-threaded, tương thích 100% WebView)
│   ├── scenes/
│   │   └── Main.tscn         # Cảnh mẫu thử nghiệm (test chạm, rung haptic, gửi điểm)
│   └── scripts/
│       ├── Main.gd           # Logic cảnh mẫu
│       └── WebBridge.gd      # Cầu nối 2 chiều giữa Godot và App Mobile / Web
├── bridge/
│   └── campus-game-bridge.js # Cầu nối trung gian JavaScript giữa Wasm và App Mobile
├── integration/
│   └── GodotGameView.tsx     # React Component nhúng game vào Ace Games
├── web-preview/
│   └── serve.mjs             # Server preview độc lập (port 3005)
├── watch-and-sync.mjs        # Trình theo dõi file: Tự động biên dịch khi lưu (Ctrl+S)
├── dev.mjs                   # Chạy song song Server Preview + Auto-Sync Watcher
├── export-to-app.mjs         # Script biên dịch và đóng gói game vào App
└── README.md                 # Tài liệu này
```

---

## 🚀 Quy trình làm game tối ưu (Workflow chuẩn)

### 1. Khởi động môi trường làm game (1-Click)
Bạn chỉ cần **click đúp** vào file:
👉 [`START-GAME.bat`](file:///e:/ph%C3%A1t/Ace%20Games/START-GAME.bat) (ngay thư mục gốc dự án)
Hoặc bấm phím tắt **`Ctrl + Shift + B`** trong IDE.

Hệ thống sẽ tự động:
1. 🎮 Mở Godot Editor đúng dự án của bạn.
2. ⚡ Lắng nghe file: Khi bạn bấm `Ctrl+S` trong Godot, game tự xuất bản vào App!
3. 🌐 Khởi chạy máy chủ xem thử: `http://localhost:3005`.

### 2. Mở Godot Editor
```powershell
npm run game:godot
```
(Hoặc mở Godot Editor và chọn thư mục `games-dev/godot-project`).

### 3. Lập trình tính năng với `WebBridge` (GDScript)

```gdscript
# 1. Rung điện thoại người chơi (gọi Native Haptics của điện thoại)
# Các kiểu: "selection", "light", "medium", "heavy", "success", "warning", "error"
if web_bridge:
    web_bridge.trigger_haptic("medium")

# 2. Gửi điểm số kỷ lục về hệ thống lớp học
if web_bridge:
    web_bridge.submit_score(1500, {"level": 3})

# 3. Hiển thị thông báo Toast đẹp mắt lên giao diện App (Sonner Toast)
if web_bridge:
    web_bridge.show_toast("Bạn đã mở khóa thành tựu mới!", "success")

# 4. Kiểm tra có đang chơi trên màn hình cảm ứng di động không
if web_bridge and web_bridge.is_mobile():
    print("Đang chơi trên điện thoại / tablet!")

# 5. Lấy tên học sinh đang đăng nhập
if web_bridge:
    var student_name = web_bridge.get_student_name()
    print("Xin chào:", student_name)

# 6. Yêu cầu app đóng game và quay về sảnh
if web_bridge:
    web_bridge.exit_game()
```

---

## 📱 Trải nghiệm trực tiếp trên App Mobile & Web

Game Godot sau khi xuất bản được tự động kết nối vào hệ sinh thái Ace Games:
1. **Đường dẫn trực tiếp trong App:** Truy cập URL `/game/godot` trên Web hoặc App Mobile để chơi game toàn màn hình với thanh điều khiển tiện lợi (Toàn màn hình ⛶, Tải lại 🔄, Thoát).
2. **Component React:** [`src/features/games/godot/GodotGameView.tsx`](file:///e:/ph%C3%A1t/Ace%20Games/src/features/games/godot/GodotGameView.tsx) có thể nhúng vào bất kỳ modal, sảnh game (`/arena`) hay phòng học nhóm nào.
3. **Phản hồi xúc giác Native:** Kết nối trực tiếp với chip rung của điện thoại (hỗ trợ cả Expo React Native và Capacitor Native Shell).

---

## 🛠️ Tổng hợp lệnh npm

| Lệnh npm | Chức năng |
| :--- | :--- |
| **`npm run game:dev`** | Chạy toàn bộ môi trường: Xem thử (Port 3005) + Tự động xuất bản khi lưu file |
| **`npm run game:godot`** | Mở ngay Godot Editor đúng thư mục dự án `games-dev/godot-project` |
| **`npm run game:watch`** | Lắng nghe thay đổi file Godot và tự động cập nhật vào App |
| **`npm run game:export`** | Biên dịch thủ công Godot sang WebAssembly và tích hợp vào App |
| **`npm run game:preview`** | Khởi chạy máy chủ xem thử game độc lập tại `http://localhost:3005` |
