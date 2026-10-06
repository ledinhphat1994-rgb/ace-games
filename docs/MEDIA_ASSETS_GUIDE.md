# CẨM NANG QUY HOẠCH & QUY CÁCH HÌNH ẢNH DỰ ÁN DIGITAL CAMPUS v2

> **Tài liệu hướng dẫn dành cho Nhà phát triển & Quản trị viên:**
> Tài liệu này chuẩn hóa toàn bộ cấu trúc thư mục, quy cách kích thước, tỉ lệ, phong cách hình ảnh và vị trí lưu trữ cho **Banner** và **Thumbnail** trên toàn hệ thống web.

---

## 1. SƠ ĐỒ CẤU TRÚC THƯ MỤC CHUẨN (`public/assets/`)

Toàn bộ tài nguyên media tĩnh được gom gọn, phân chia rõ ràng theo 2 nhóm chức năng chính: **BANNERS** (ảnh lớn đầu trang) và **THUMBNAILS** (ảnh thẻ/bìa nhỏ):

```text
public/assets/
├── banners/                         # TOÀN BỘ ẢNH BANNER LỚN ĐẦU TRANG (HERO BANNERS)
│   ├── home/                       # Banner Trang Chủ (Home Hub)
│   │   ├── hero_bg.webp            # [1920x800] Ảnh nền đại cảnh trường học số
│   │   └── hero_art.webp           # [800x800]  Hình minh họa nhóm học sinh bên phải
│   ├── learn/                      # Banner Trang Học Tập (Classroom & Resources)
│   │   ├── hero_bg.webp            # [1920x800] Ảnh nền thư viện/phòng tự học tương lai
│   │   └── hero_art.webp           # [800x800]  Hình minh họa học tập/sách/công nghệ
│   ├── arena/                      # Banner Đấu Trường Trò Chơi (Game Arena)
│   │   ├── hero_bg.webp            # [1920x800] Ảnh nền phòng thi đấu thể thao trí tuệ
│   │   └── hero_art.webp           # [800x800]  Hình minh họa đấu cờ/gaming
│   ├── community/                  # Banner Trang Cộng Đồng (Student Community)
│   │   ├── hero_bg.webp            # [1920x800] Ảnh nền sân trường/khu sinh hoạt chung
│   │   └── hero_art.webp           # [800x800]  Hình minh họa nhóm bạn trẻ trò chuyện
│   ├── leaderboard/                # Banner Bảng Vinh Danh (Leaderboard)
│   │   ├── hero_bg.webp            # [1920x800] Ảnh nền sân khấu trao giải thưởng
│   │   └── podium_art.webp         # [800x800]  Hình bục vinh danh Top 1 - 2 - 3
│   └── profile/                    # Banner / Ảnh bìa Trang Cá Nhân
│       └── cover_default.webp      # [1920x480] Ảnh bìa cá nhân mặc định
│
├── thumbnails/                      # TOÀN BỘ ẢNH THẺ, BÌA TRÒ CHƠI, PHÒNG HỌC, LỐI TẮT
│   ├── games/                      # Bìa từng trò chơi đấu trí (Tỉ lệ 1:1 hoặc 4:3)
│   │   ├── chess.webp              # [400x400] Bìa Cờ Vua
│   │   ├── xiangqi.webp            # [400x400] Bìa Cờ Tướng
│   │   ├── caro.webp               # [400x400] Bìa Cờ Caro
│   │   ├── memory.webp             # [400x400] Bìa Lật Thẻ Trí Nhớ
│   │   ├── snake.webp              # [400x400] Bìa Rắn Săn Mồi
│   │   └── 2048.webp               # [400x400] Bìa Trò Chơi 2048
│   ├── rooms/                      # Ảnh đại diện phòng học nhóm (Tỉ lệ 16:9)
│   │   ├── study.webp              # [640x360] Phòng Tự học chung
│   │   ├── math.webp               # [640x360] Phòng Học Toán
│   │   ├── physics.webp            # [640x360] Phòng Vật Lý
│   │   ├── tech.webp               # [640x360] Phòng Tin Học & Lập Trình
│   │   ├── security.webp           # [640x360] Phòng An Toàn Thông Tin
│   │   └── youtube.webp            # [640x360] Phòng Cùng Xem Video
│   ├── hub/                        # Icon thẻ 4 trục điều hướng chính Trang chủ (Zone 2)
│   │   ├── learn.webp              # [320x320] Thẻ Học Tập
│   │   ├── arena.webp              # [320x320] Thẻ Trò Chơi
│   │   ├── community.webp          # [320x320] Thẻ Cộng Đồng
│   │   └── leaderboard.webp        # [320x320] Thẻ Vinh Danh
│   └── activities/                 # Thẻ hoạt động nổi bật Trang chủ (Zone 3)
│       ├── study.webp              # [600x350] Hoạt động Phòng học sôi nổi
│       ├── game.webp               # [600x350] Hoạt động Giải đấu cờ
│       └── community.webp          # [600x350] Hoạt động Giao lưu bạn bè
│
├── avatars/                         # BỘ 12 AVATAR NHÂN VẬT HỌC SINH (256x256, 1:1)
│   ├── avatar_01_boy.webp          # Nam sinh Hoodie
│   ├── avatar_02_boy_glasses.webp  # Nam sinh Kính cận
│   ├── avatar_03_girl_peace.webp   # Nữ sinh Peace
│   ├── ...                         # (Các avatar nhân vật khác)
│
├── audio/                           # HIỆU ỨNG ÂM THANH TRÒ CHƠI (.mp3)
│   ├── move.mp3                    # Âm thanh đi cờ
│   ├── capture.mp3                 # Âm thanh ăn quân
│   ├── check.mp3                   # Âm thanh chiếu tướng
│   ├── victory.mp3                 # Âm thanh chiến thắng
│   └── defeat.mp3                  # Âm thanh thất bại
│
└── brand/                           # BIỂU TƯỢNG VÀ THƯƠNG HIỆU
    ├── logo.svg                    # Logo trường học số
    └── favicon.svg                 # Favicon trình duyệt
```

---

## 2. BẢNG QUY CÁCH KỸ THUẬT CHI TIẾT TỪNG MỤC

### A. Nhóm BANNERS (Ảnh lớn tiêu đề)

| Tên Banner | Đường dẫn lưu trữ | Kích thước đề xuất | Tỉ lệ (Ratio) | Dung lượng tối ưu | Nội dung khuyến nghị |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trang Chủ** | `public/assets/banners/home/hero_art.webp` | `1200 x 800 px` | 3:2 | < 180 KB | Khuôn viên trường học số hiện đại, nhóm học sinh năng động bước vào sảnh |
| **Học Tập** | `public/assets/banners/learn/hero_art.webp` | `1200 x 800 px` | 3:2 | < 180 KB | Góc học tập công nghệ cao, bàn học, sách vở 3D hologram, học sinh chăm chú |
| **Trò Chơi** | `public/assets/banners/arena/hero_art.webp` | `1200 x 800 px` | 3:2 | < 180 KB | Đấu trường e-sports học đường, bàn cờ năng lượng phát sáng, phong cách đối kháng |
| **Cộng Đồng** | `public/assets/banners/community/hero_art.webp` | `1200 x 800 px` | 3:2 | < 180 KB | Cổng trường hoàng hôn lung linh, nhóm bạn trẻ vui vẻ chụp ảnh kỷ niệm |
| **Bảng Vinh Danh**| `public/assets/banners/leaderboard/podium_art.webp` | `1000 x 800 px` | 5:4 | < 150 KB | Bục trao giải Top 1, 2, 3 với cúp vàng, huy chương lấp lánh |
| **Ảnh Bìa Cá Nhân**| `public/assets/banners/profile/cover_default.webp` | `1920 x 480 px` | 4:1 | < 200 KB | Dải phong cảnh bầu trời sao, trường học hoặc vi mạch công nghệ dịu nhẹ |

---

### B. Nhóm THUMBNAILS (Ảnh nhỏ thẻ chức năng & trò chơi)

| Danh mục | Đường dẫn lưu trữ | Kích thước đề xuất | Tỉ lệ (Ratio) | Dung lượng | Nội dung khuyến nghị |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cờ Vua** | `public/assets/thumbnails/games/chess.webp` | `400 x 400 px` | 1:1 | < 60 KB | Quân Vua & Hậu thủy tinh phát sáng trên bàn cờ gỗ cao cấp |
| **Cờ Tướng** | `public/assets/thumbnails/games/xiangqi.webp` | `400 x 400 px` | 1:1 | < 60 KB | Quân Tướng đỏ/đen bằng gỗ khắc chữ vàng tinh tế trên bàn cờ tướng truyền thống |
| **Cờ Caro** | `public/assets/thumbnails/games/caro.webp` | `400 x 400 px` | 1:1 | < 50 KB | Biểu tượng X (xanh) và O (đỏ) 3D neon nổi bật trên lưới caro |
| **Lật Trí Nhớ** | `public/assets/thumbnails/games/memory.webp` | `400 x 400 px` | 1:1 | < 50 KB | Các quân thẻ bài ma thuật 3D đang lật mở phát sáng |
| **Rắn Săn Mồi** | `public/assets/thumbnails/games/snake.webp` | `400 x 400 px` | 1:1 | < 50 KB | Chú rắn neon cyberpunk dễ thương đang đuổi theo táo phát sáng |
| **Phòng Học** | `public/assets/thumbnails/rooms/<môn>.webp` | `640 x 360 px` | 16:9 | < 80 KB | Minh họa 3D dụng cụ từng môn: Thước/Compas (Toán), Quả địa cầu (Địa), Kính viễn vọng (Lý)... |
| **Thẻ Hub Trang Chủ**| `public/assets/thumbnails/hub/<trục>.webp` | `320 x 320 px` | 1:1 | < 40 KB | Biểu tượng 3D isometric hiện đại cho Học tập, Game, Cộng đồng, Vinh danh |

---

## 3. BA NGUYÊN TẮC VÀNG VỀ THẨM MỸ (TRÁNH ẢNH "XẤU")

### 1. TUYỆT ĐỐI KHÔNG ĐƯA CHỮ VÀO ẢNH (No In-Image Text)
* **Lỗi hiện tại:** Ảnh cũ bị chữ AI tự vẽ lung tung (như chữ "Better Students Brighter Futures", "Digital Campus" bị méo mó, sai chính tả, chèn ép lên chữ thật của web).
* **Quy tắc:** Mọi ảnh banner và thumbnail **chỉ vẽ hình ảnh, nhân vật, bối cảnh**, 100% **KHÔNG CHỨA BẤT KỲ CHỮ NÀO**.
* Hệ thống giao diện web đã có sẵn lớp typography HTML/CSS (Geist Font, Tailwind) render tiêu đề, phụ đề, số đếm và nút bấm siêu nét trên mọi thiết bị.

### 2. TUÂN THỦ KHOẢNG TRỐNG AN TOÀN (Safe Zone Invariant)
* Trên màn hình Desktop, bên trái banner (chiếm khoảng 50% - 60% chiều ngang) là nơi hiển thị tiêu đề, lời chào và các nút bấm hành động.
* Do đó, trọng tâm hình ảnh (nhân vật, cổng trường, cúp vàng...) **phải được bố trí ở nửa bên phải (40% - 50% bên phải)**.
* Nửa bên trái của ảnh nên là nền tối dịu, hiệu ứng khói/ánh sáng chuyển dần (vignette gradient) để chữ màu trắng của web nổi bật 100%, không bị chói mắt hay tranh chấp thị giác.

### 3. ĐỒNG BỘ PHONG CÁCH HÌNH ẢNH (Visual Cohesion)
* Chọn **1 phong cách duy nhất** cho toàn bộ web:
  * **Đề xuất 1 (Khuyên dùng):** *Modern High School Anime & Cyberpunk Chill* (phong cách anime thanh xuân học đường Nhật Bản trong trẻo, ánh đèn neon đêm trường học dịu mắt như phim Makoto Shinkai).
  * **Đề xuất 2:** *3D Stylized Isometric / Claymorphism* (phong cách mô hình 3D đồ họa tròn trịa, bóng bẩy, hiện đại như Apple / Notion / Duolingo).
* Tuyệt đối tránh trộn lẫn ảnh người thật chụp điện thoại với ảnh 3D và ảnh vẽ 2D hoạt hình trong cùng một khu vực.

---

## 4. QUY TRÌNH THAY ẢNH NHANH (USER THAO TÁC CỰC KỲ ĐƠN GIẢN)

Khi tìm được ảnh đẹp trên mạng hoặc tải về từ Pinterest, Midjourney, Unsplash:
1. Đổi tên ảnh đúng theo bảng quy cách ở Mục 2 (ví dụ: `chess.webp`, `community/hero_art.webp`).
2. Tối ưu kích thước theo bảng và chuyển đổi sang định dạng `.webp` (có thể dùng công cụ trực tuyến như Squoosh.app hoặc TinyPNG).
3. Đặt file vào đúng thư mục con tương ứng trong `public/assets/`.
4. Web sẽ **tự động cập nhật 100% ngay lập tức**, không cần sửa một dòng code nào!
