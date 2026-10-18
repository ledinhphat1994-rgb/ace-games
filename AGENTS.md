# Ace Games — Hướng Dẫn & Quy Tắc Kỹ Thuật (AGENTS.md)

> **MỤC TIÊU & HIẾN PHÁP DỰ ÁN:**
> Tài liệu này là kim chỉ nam tối cao định hướng cho toàn bộ quá trình phát triển mã nguồn trong dự án. Mọi AI Agent và lập trình viên bắt buộc phải tuân thủ nghiêm ngặt 100%, không có ngoại lệ.

---

# PHẦN I: CÁC QUY ĐỊNH KỸ THUẬT NGHIÊM NGẶT PHÁT TRIỂN GAME

## 1. ARCHITECTURE BOUNDARY (Ranh giới Kiến trúc Tách biệt Tuyệt đối)
- **Tách biệt 100% giữa Core Logic (`src/core/`) và Renderer (`src/render/`):**
  - Mọi logic game (vật lý, tính toán vị trí, logic luật chơi, va chạm, trạng thái điểm số) chỉ nằm trong thư mục `src/core/`.
  - Tầng hiển thị (`src/render/` hoặc Canvas/WebGL/Pixi/Phaser) chỉ đóng vai trò "đọc dữ liệu và vẽ", tuyệt đối không chứa logic thay đổi trạng thái game.
- **Tầng Core thuần túy toán học:**
  - Tầng Core chỉ chứa toán học thuần túy (Vector, LERP, Spatial Hash Grid, ma trận số học).
  - Tuyệt đối **KHÔNG import** bất kỳ thư viện UI nào (React, DOM API, CSS) hay API đồ họa/WebGL/Canvas vào `src/core/`.
- **Cấm React State trong Game Loop:**
  - Tuyệt đối **KHÔNG dùng React State** (`useState`, `useReducer`, `useEffect`, context) bên trong vòng lặp game loop (`tick()`, `update()`, `requestAnimationFrame`).
  - React **CHỈ DÙNG** cho HUD và menu ngoài (bảng điểm ngoài trận, thanh máu HUD tĩnh, menu cấu hình, dialog cài đặt/tạm dừng).

---

## 2. ZERO-ALLOCATION TICK (Quy tắc Không Rác Bộ Nhớ / Zero Garbage Collection)
- **Cấm khởi tạo trong Game Loop:**
  - Tuyệt đối **CẤM** khởi tạo object mới (`new Object()`, `new Vector()`, `{}`) hoặc mảng mới (`[]`, `.map()`, `.filter()`, `.slice()`, spread operator `[...]`) bên trong hàm `tick()` / `update()` / vòng lặp xử lý từng khung hình.
- **Bắt buộc Object Pooling:**
  - Mọi entity (đốt thân rắn, thức ăn, hạt hiệu ứng particle, floating text, tia sáng) bắt buộc phải sử dụng **Object Pooling** (tái sử dụng các đối tượng đã cấp phát trước trong bộ nhớ, kích hoạt/vô hiệu hóa qua cờ `active`).
- **Bộ nhớ định kiểu số lượng lớn:**
  - Tọa độ, vận tốc, góc quay và dữ liệu có số lượng lớn **BẮT BUỘC dùng `Float32Array`** (hoặc TypedArray phù hợp) để CPU xử lý tuần tự theo bộ nhớ liên tục (cache-friendly), giảm thiểu tối đa cache miss và triệt tiêu hoàn toàn hiện tượng Garbage Collector (GC) kích hoạt gây giật khựng khung hình (frame drop/stutter).

---

## 3. MOVEMENT & COLLISION (Chuyển động & Va chạm Chuẩn Xác)
- **Position History Buffer & LERP:**
  - Thân rắn nối bằng **Position History Buffer** (bộ đệm lưu lịch sử tọa độ đầu rắn theo thời gian/khoảng cách) kết hợp **LERP** (Linear Interpolation) nội suy góc quay mượt mà.
  - Tuyệt đối **KHÔNG dùng logic "đốt sau đuổi đốt trước"** (vốn gây hiện tượng thân rắn bị gãy khúc, biến dạng chiều dài hoặc giật cục khi quay đầu gấp).
- **Spatial Hash Grid cho va chạm:**
  - Kiểm tra va chạm bắt buộc sử dụng **Spatial Hash Grid** với độ phức tạp $O(1)$ hoặc $O(k)$ (chỉ truy vấn các entity trong cùng ô lưới hoặc các ô lân cận kề nhau).
  - Tuyệt đối **CẤM vòng lặp lồng nhau $O(n^2)$** (kiểm tra mọi entity với nhau) gây sụt giảm FPS và nghẽn CPU khi số lượng đốt rắn và thức ăn trên bản đồ tăng cao.

## 4. GROUND CONTACT & ANTI-FLOATING (Quy tắc Tiếp Đất Chuẩn Xác cho Vật Thể Trên Bộ)
- **Sát mặt đất 100% (Zero Ground Clearance / Grounded Flush Invariant):**
  - Mọi vật thể, công trình và đơn vị hoạt động trên mặt đất (tháp pháo/trụ phòng thủ như Gatling Gun, Plasma Cannon, SAM Battery; lính cơ giới trên bộ như Robot Mech Walker, Xe lửa hơi nước Steam Train, v.v.) BẮT BUỘC phải tiếp xúc sát và phẳng phiu với mặt đất/đường đi ($Y_{\text{contact}} = 0$ hoặc hơi lún nhẹ vào mặt cỏ/mặt đường từ 1–2px để tạo độ đầm và trọng lượng cơ giới chân thật).
  - Tuyệt đối **CẤM** để vật thể trên bộ bị treo lơ lửng trên không (air gap) hay hở gầm nhìn xuyên qua nền đất.
- **Loại bỏ bóng giả nhân tạo bằng code trên thảm cỏ (Zero Procedural Circle Shadows on Terrain):**
  - Tuyệt đối **CẤM** dùng các lệnh vẽ hình tròn (`draw_circle`) tạo các đốm đen/vệt bóng tròn giả lập trình dưới đáy trụ trên nền bản đồ 2.5D. Bản đồ vẽ tay đã có độ tương phản tự nhiên, trụ và công trình cố định phải bám đất liền mạch với chân đế hoàn chỉnh.
- **Chân trụ & đế móng cơ giới hoàn chỉnh (Solid Mechanical Base & Footing):**
  - Chân đế của các trụ phòng thủ phải sử dụng artwork nguyên vẹn với đầy đủ các chân càng chịu lực (outriggers), móng kim loại (foot pads) và mâm xoay, tuyệt đối không dùng sprite bị cắt ngang, cụt móng hay lem viền.
- **Ngoại lệ duy nhất cho đơn vị bay (Aerial Units Exception):**
  - Chỉ các đơn vị trên không (như Chim máy Winged Bot, drone bay) mới được thiết lập cao độ lơ lửng phía trên mặt đất (`position.y < 0`).

## 4.1. ISOMETRIC 2.5D MOVEMENT & 8-DIRECTIONAL WALK CYCLE (Quy tắc Chuyển Động Nhân Vật & Vật Thể Bát Hướng)
- **Quy chuẩn Sprite Bát Hướng (8-Directional Isometric Traversal):**
  - Mọi nhân vật, quái vật, đơn vị cơ giới di chuyển trên bản đồ 2.5D BẮT BUỘC phải có hoạt ảnh chuyển động đồng bộ chính xác theo 8 hướng thực tế dựa trên vector vận tốc $\vec{v}$:
    * **Bắc (North / Đi lên):** Nhìn thấy trọn vẹn lưng, gáy, mặt sau mũ áo và gót chân bước lên. Tuyệt đối **CẤM** lật gương mặt trước để dùng cho hướng đi lên.
    * **Nam (South / Đi xuống):** Nhìn thấy khuôn mặt chính diện, ngực, mắt và mặt trước thân thể bước về phía camera.
    * **Đông & Tây (East / West / Đi ngang):** Nhìn nghiêng góc cạnh (Profile view) sắc nét.
    * **4 Hướng Chéo (NE, SE, SW, NW):** Góc nhìn ba phần tư ($3/4$ perspective) thể hiện rõ khối tích không gian 2.5D.
- **Thứ tự lớp vẽ & Vật dụng cầm theo (Handheld Items & Z-Sorting Invariant):**
  - Khi nhân vật mang theo đồ vật (vali, vũ khí, khiên, hành lý), thứ tự vẽ (Z-index / Layering) BẮT BUỘC phải chuyển đổi logic theo góc quay: khi quay lưng thì đồ vật khuất sau thân hoặc che một phần hông tự nhiên; khi quay mặt thì đồ vật hiển thị rõ phía trước/bên hông.
- **Nhịp bước đồng bộ vận tốc & Chống trượt chân (Zero Foot-Sliding Invariant):**
  - Tần số chu kỳ bước chân (Walk Cycle Animation Speed) BẮT BUỘC phải ăn khớp tuyệt đối với tốc độ di chuyển thực tế trên tọa độ màn hình pixel/giây. Tuyệt đối **CẤM** hiện tượng trượt chân trên mặt cỏ/mặt sàn (moonwalking / foot sliding).
- **Tiếp đất chuẩn xác từng bước chân (Flush Footfall Contact):**
  - Bàn chân trụ trong mỗi khung hình bước đi phải tiếp xúc sát sàn ($Y_{\text{contact}} = 0$), giữ trọng tâm và độ đầm chân thực cho nhân vật.

## 4.2. GODOT DEV & VERIFICATION LOOPS (Quy chuẩn 2 Cấp Độ Kiểm Thử: Fast Dev Loop & Full Web Integration Loop)
- **Cấp độ 1: Fast Dev Loop (Vòng lặp nhanh 2–3s — Mặc định khi dev GDScript, Scene, UI Godot, Cân bằng chỉ số):**
  - Khi chỉnh sửa logic, toán học, di chuyển, chỉ số sát thương/máu, âm thanh hay scene Godot thuần túy:
    * Chạy kiểm thử tự động tức thì bằng GUT: `npm run game:test` (hoặc targeted test `godot -d -s --path games-dev/godot-project addons/gut/gut_cmdln.gd -gtest=res://test/unit/<file>.gd`).
    * Nếu cần kiểm tra hiển thị/runtime: Sử dụng công cụ `godot-mcp` (`game_start`, `runtime_screenshot`) để chụp ảnh màn hình và bắt log trực tiếp trên native runtime.
    * Tuyệt đối **KHÔNG lãng phí thời gian** chạy `npm run game:export` và mở Chrome sau mỗi dòng GDScript nhỏ.
- **Cấp độ 2: Full Web Integration Loop (Vòng lặp tích hợp Web — Chỉ chạy khi có thay đổi liên tầng hoặc chốt milestone):**
  - Chỉ kích hoạt khi:
    * Thay đổi tầng giao tiếp React - Godot (`GodotGameView.tsx`, `WebBridge.gd`).
    * Thay đổi Shaders đồ họa WebGL (`gl_compatibility`).
    * Khi hoàn tất một tính năng lớn hoặc chạy checklist trước khi push (`kiem-tra-truoc-khi-push`).
  - Lúc này bắt buộc biên dịch WebAssembly bằng lệnh `npm run game:export` để cập nhật trực tiếp vào `public/games/godot/`.
  - Tự chủ mở trình duyệt kiểm tra trực quan tại `http://localhost:3005/raw` với cơ chế vô hiệu hóa bộ nhớ đệm (Disable Cache / Bypass Cache), chụp ảnh màn hình và đọc console logs để nghiệm thu 100%.

---

# PHẦN II: KIẾN TRÚC NỀN TẢNG & VẬN HÀNH ACE GAMES

## 5. Kiến trúc hệ thống chính thức
- **Runtime & Deployment:** Cloudflare Workers + Static Assets + Durable Objects (SQLite, WebSocket Hibernation API) + D1 Database + KV (Rate Limit) + R2 (Lưu trữ ảnh & media).
- **Frontend:** Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI) + Lucide Icons + TanStack Query.
- **Backend / Workers:** Hono API Router (`worker/index.ts`), Durable Objects (`CampusDO` cho sảnh toàn trường & chat trực tiếp, `RoomDO` cho phòng học nhóm / YouTube sync / Game Arena).
- **Shared Contracts:** Giao thức WebSocket & Type dùng chung tại `shared/protocol/` (`campus.ts`, `room.ts`, `game.ts`, `common.ts`).

## 6. Quy trình phát triển tối ưu tốc độ (4 bước mặc định)
Tóm gọn: **Sửa local → test đúng lỗi → final local check 1 lần → push → (staging nếu cần) → deploy → smoke.**

1. **CODE → TEST ĐÚNG PHẦN ĐANG SỬA:**
   Chỉ chạy test liên quan trực tiếp đến phần đang sửa (ví dụ: `npx vitest run test/my-file.test.ts`). Lỗi thì sửa tiếp local.
   *Cấm:* Không full test, không build, không GitHub CI, không staging trong vòng lặp debug.

2. **XONG → CHECK LOCAL 1 LẦN (Tối ưu CPU & Tốc độ):**
   Chỉ khi đã hoàn thành toàn bộ sửa đổi mới chạy Local Final Gate (DUY NHẤT 1 LẦN):
   - `npm run typecheck` (0 lỗi)
   - `npm run lint` (0 lỗi)
   - **Targeted Test** (`npx vitest run test/<file-lien-quan>.test.ts`, 100% xanh)
   - `npm run build:bundle` (`vite build`, không lặp lại typecheck)
   - `git diff --check` (0 lỗi whitespace / conflict)
   *Lưu ý:* Bỏ hẳn `npm test` toàn bộ trong flow thường ngày và UI tasks để tránh ngốn CPU. Toàn bộ test suite chỉ chạy trước khi chuẩn bị Deploy Production hoặc khi User yêu cầu rõ ràng.

3. **STAGING CHỈ KHI THẬT SỰ CẦN:**
   Chỉ khi UI/Room/browser/realtime cần nhìn thực tế mới deploy staging **1 lần** để review. Sửa nhỏ bỏ qua staging.

4. **PRODUCTION → GUARD → DEPLOY → SMOKE:**
   Khi được duyệt: `main sạch + HEAD == origin/main + config production đúng → deploy → smoke`.
   - **Agent Deploy Permission — TOÀN QUYỀN KHI USER NÓI "DEPLOY":** User nói "deploy" là uỷ quyền đầy đủ để agent tự làm trọn chuỗi, không hỏi lại: Local Final Gate PASS → merge PR vào `main` (nếu có) → `git checkout main && git pull --ff-only` → (có migration mới thì apply remote trước) → `npm run deploy:production` (local) → smoke → báo Version ID + SHA. KHÔNG chạy workflow GitHub Actions "Triển khai production".

## 7. Quy tắc bảo toàn dữ liệu & Tương thích hệ thống (Data Invariants)
- **Mật khẩu:** Thuật toán PBKDF2-SHA256 với salt/hash hex, số vòng lấy theo từng dòng `tai_khoan_campus.iterations` của CSDL.
- **Token phiên:** Định dạng `<payload-base64url>.<HMAC-SHA256>`, cookie `c10a7_session` (HttpOnly, SameSite=Lax).
- **Phiên đăng nhập duy nhất:** Cơ chế 1 tài khoản 1 thiết bị qua cột `thiet_bi`. Thiết bị mới đá thiết bị cũ với mã WebSocket `4001` (Strict Single-device).
- **An toàn truy vấn D1:** Mọi truy vấn đọc/ghi dữ liệu lớp/học sinh phải kèm điều kiện phân quyền và phạm vi dữ liệu (`lop_id`, `vai_tro`).
- **Dữ liệu thật:** Không dùng mock data hoặc placeholder arrays trong UI. Ô trống hiển thị empty-state.

## 8. Quy tắc thiết kế giao diện UI/UX & Bố cục ổn định
- **Chỉ ghi tiêu đề, tuyệt đối cấm chú thích:** Giữ giao diện sạch sẽ, trực quan, tinh gọn theo nguyên tắc "Obvious UI Does Not Explain Itself". Không tự ý chèn văn bản bổ sung, mô tả phụ hay nhãn giải nghĩa.
- **Zero Overlap & Spacing Rhythm:** Giữa các card cố định tuyệt đối không được đè lên nhau. Duy trì khoảng cách thông thoáng (margin, padding, gap), tạo không gian đệm "thoáng con mắt".
- **Non-Obscuring Popup & Transparent Backdrop:** Khi mở bất kỳ popup/dialog nào, tuyệt đối không làm đen kịt (`bg-black/60`) hay làm mờ nhòe (heavy blur) khu vực xung quanh. Backdrop giữ độ trong suốt cao (tối đa `bg-black/10` hoặc `bg-transparent`) để giao diện phía sau hiển thị sắc nét 100%. Popup luôn căn giữa chuẩn viewport (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`).
- **Card Stability & Coordinate Locking:** Mọi card, dialog khi chuyển tab/chế độ BẮT BUỘC giữ nguyên tọa độ (x, y) và chiều cao cố định. Cấm co giật, sụt lún (Zero CLS). Bộ điều khiển tùy chỉnh chỉ nằm trên duy nhất 1 hàng cố định.
- **Zero-Stutter Motion & Uniform Border:** Dùng `transition-colors duration-150`, không dùng `transition-all`. Dùng cùng độ dày viền (`border-2`) cho cả active và inactive để chống rung giật pixel.
