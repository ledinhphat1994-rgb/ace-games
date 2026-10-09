# Digital Campus v2 — Quy tắc bắt buộc

> **Nguyên tắc khởi đầu (Mandatory Pre-implementation Gate):**
> Trước khi thực hiện bất kỳ nhiệm vụ cốt lõi hoặc tính năng mới nào:
> 1. Đọc kĩ [docs/PRODUCT_AND_ARCHITECTURE_NORTH_STAR.md](docs/PRODUCT_AND_ARCHITECTURE_NORTH_STAR.md).
> 2. Xác định rõ task thuộc về **Platform Core** hay **Activity**.
> 3. Tuyệt đối giữ vững ranh giới Platform / Activity (không duplicate tính năng nền tảng vào activity).
> 4. Không bao giờ thu hẹp kiến trúc thành một website lớp học hay LMS đơn lẻ.
> 5. Không tin tưởng báo cáo lý thuyết hơn bằng chứng mã nguồn và runtime thực tế.
> 6. Độ chính xác chức năng & sự tin cậy luôn đi trước vẻ bóng bẩy giao diện.
> 7. **BẮT BUỘC ĐỌC VÀ TUÂN THỦ TOÀN BỘ QUY TẮC THIẾT KẾ GIAO DIỆN WEB (Mục 6, 7, 8, 9, 10, 11, 12 bên dưới và [.agents/rules/10-ui-ux-layout-constitution.md](.agents/rules/10-ui-ux-layout-constitution.md)) TRƯỚC KHI THỰC THI CHỈNH SỬA BẤT KỲ GIAO DIỆN NÀO.**

## 1. Kiến trúc hệ thống chính thức
- **Runtime & Deployment:** Cloudflare Workers + Static Assets + Durable Objects (SQLite, WebSocket Hibernation API) + D1 Database + KV (Rate Limit) + R2 (Lưu trữ ảnh & media).
- **Frontend:** Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI) + Lucide Icons + TanStack Query.
- **Backend / Workers:** Hono API Router (`worker/index.ts`), Durable Objects (`CampusDO` cho sảnh toàn trường & chat trực tiếp, `RoomDO` cho phòng học nhóm / YouTube sync / Game Arena).
- **Shared Contracts:** Giao thức WebSocket & Type dùng chung tại `shared/protocol/` (`campus.ts`, `room.ts`, `game.ts`, `common.ts`).

## 2. Quy trình phát triển tối ưu tốc độ (4 bước mặc định)

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
   *Lưu ý quan trọng:* **BỎ HẲN `npm test` toàn bộ (113 files, 1.349 tests)** trong flow thường ngày và UI tasks để tránh ngốn CPU, nóng máy và mất thời gian (2-3 phút). Toàn bộ test suite chỉ chạy 1 lần duy nhất khi chuẩn bị Deploy Production hoặc khi User yêu cầu rõ ràng.
   PASS hết mới commit/push. Pre-commit chỉ check staged diff & lint file staged. Không chạy GitHub CI.

3. **STAGING CHỈ KHI THẬT SỰ CẦN:**
   Chỉ khi UI/Room/browser/realtime cần nhìn thực tế mới deploy staging **1 lần** để review.
   Sửa typo, helper nhỏ, test-only, script... **bỏ qua staging**.

4. **PRODUCTION → GUARD → DEPLOY → SMOKE:**
   Khi được duyệt: `main sạch + HEAD == origin/main + config production đúng → deploy → smoke`.
   Chỉ kiểm tra thêm migration/RoomDO/auth/voice khi diff thật sự đụng các phần đó.
   Chạy full test suite (`npm test`) trước khi kích hoạt quy trình deploy production.

### Những thứ BỎ HẲN khỏi flow thường ngày:
- **BỎ HẲN `npm test` toàn bộ trong flow thường ngày / UI tasks** (chỉ chạy Targeted Test 2-3s).
- Không GitHub CI trên PR / push.
- Không full test sau mỗi lần sửa nhỏ.
- Không full test trong pre-commit (`.husky/pre-commit` chỉ chạy `git diff --cached --check` và lint staged files).
- Không build lặp lại typecheck.
- Không chạy release-guard khi đang làm UI / feature thông thường.
- Không staging sau từng commit.
- Không post-merge test lại nếu mã nguồn không thay đổi.
- Không tường thuật "đang chạy / đang chờ".

### Quy tắc kiểm tra an toàn theo rủi ro (Risk-Based Verification):
Chỉ chạy test/gate tương ứng với rủi ro thật của diff:
- Sửa CSS/UI: Không test RoomDO, không test release pipeline.
- Sửa RoomDO: Chạy RoomDO tests.
- Sửa Auth: Chạy auth/security tests.
- Sửa Migration: Kiểm tra migration D1.
- Sửa Deploy script/Wrangler config: Chạy `scripts/verify-release-guard.mjs`.

### Định dạng báo cáo bắt buộc (Concise Reporting):
Không báo gì trong lúc làm. Chỉ báo khi hoàn tất:
```text
DONE

LOCAL CHECK: PASS
TESTS: <số test>/<tổng test>
STAGING: <version nếu có hoặc NONE>
PR: #xx (nếu có)
PRODUCTION: UNTOUCHED
```
Nếu bị chặn:
```text
BLOCKED
CAUSE: <1 câu nguyên nhân>
NEED: <thứ cần quyết định>
```

## 3. Quy tắc bảo toàn dữ liệu & Tương thích hệ thống (Data Invariants)
- **Mật khẩu:** Thuật toán PBKDF2-SHA256 với salt/hash hex, số vòng lấy theo từng dòng `tai_khoan_campus.iterations` của cơ sở dữ liệu gốc.
- **Token phiên:** Định dạng `<payload-base64url>.<HMAC-SHA256>`, cookie `c10a7_session` (HttpOnly, SameSite=Lax).
- **Phiên đăng nhập duy nhất:** Cơ chế 1 tài khoản 1 thiết bị thông qua cột `thiet_bi`. Khi đăng nhập ở thiết bị mới, thiết bị cũ bị đá ra với mã WebSocket `4001` (Strict Single-device). Đăng xuất không gỡ `thiet_bi`.
- **An toàn truy vấn D1:** Mọi truy vấn đọc/ghi dữ liệu lớp/học sinh phải kèm điều kiện phân quyền và phạm vi dữ liệu (`lop_id`, `vai_tro`), không tin tưởng dữ liệu thô gửi từ client.
- **Dữ liệu thật:** Không dùng mock data hoặc placeholder arrays trong UI. Mọi dữ liệu lấy qua API thật hoặc WebSocket snapshot. Ô trống hiển thị empty-state.

## 4. Chống giật màn hình & Trải nghiệm người dùng (Zero CLS & Anti-Jitter)
- **Cấm hijack window scroll:** Tuyệt đối không gọi `scrollIntoView()` trên các phần tử con nội tuyến. Mọi cuộn tự động (chat, danh sách) chỉ được cuộn nội bộ trong container cha (`container.scrollTo`).
- **Focus an toàn:** Khi gọi `.focus()` qua JavaScript, luôn kèm `{ preventScroll: true }`. Tuyệt đối không đặt thuộc tính `autoFocus` trên input nội tuyến.
- **Zero CLS khi chuyển view:** Các khung tab hoặc view song song phải khóa chiều cao tối thiểu và có empty-state căn giữa chiếm trọn không gian, tránh làm sụt lún layout khi nội dung thay đổi.
- **Bố cục 2 cột độc lập:** Bố cục 2 cột cạnh nhau phải sử dụng `items-start` và `self-start`, không dùng `self-stretch` gây giằng co kéo giật chiều cao giữa các cột.

## 5. Quy tắc Migration & Deploy
- **Tính bất biến của Migration (Migration Immutability Policy):**
  * File migration đã áp dụng lên môi trường từ xa/production là bất biến (immutable). Tuyệt đối không sửa lại nội dung file migration cũ hoặc re-run migration cũ.
  * Mọi thay đổi schema mới BẮT BUỘC tạo file migration đánh số thứ tự tiếp theo (`migrations/0006_...sql`).
  * Tuyệt đối không dùng `DROP TABLE` đối với các bảng chứa dữ liệu người dùng, bảo mật hoặc quản trị (`phong_ban`, `tai_khoan_campus`, `phong`, ...) nếu không có chiến lược sao lưu (backup), sao chép/chuyển đổi (copy/backfill), xác minh dữ liệu và kế hoạch hoàn tác (rollback).
- **Thứ tự Deploy khi có Migration (Mandatory Order):** Khi có file migration mới trong `migrations/`, BẮT BUỘC chạy apply migration trên D1 production TRƯỚC:
  `npx wrangler d1 migrations apply lop-10a7-db --remote`
  Sau khi D1 đã cập nhật schema thành công, mới deploy Worker (`npm run deploy`). Tuyệt đối không deploy Worker trước migration vì các chốt bảo mật fail-closed (như `phong_ban`) sẽ ngắt kết nối với mã 503 nếu bảng chưa tồn tại.
- **Chính sách kiểm duyệt & Cấm vào phòng (Fail-Closed Moderation):** Thành viên có bản ghi trong `phong_ban` sẽ bị chặn 403 tức thì ở cả cổng WebSocket admission lẫn API cấp cookie `/api/rooms/:id/admit`. Nếu truy vấn D1 gặp sự cố, hệ thống trả về 503 thay vì bỏ qua lỗi (nguyên tắc Fail-Closed).
- Mọi thay đổi hoàn tất phải tự động kiểm thử toàn diện (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`), commit với thông điệp rõ ràng chuẩn conventional, push lên nhánh làm việc và sẵn sàng deploy lên domain chính thức.
- **Agent Deploy Permission — TOÀN QUYỀN KHI USER NÓI "DEPLOY":** User nói "deploy" là uỷ quyền đầy đủ để agent tự làm trọn chuỗi, không hỏi lại: Local Final Gate PASS → merge PR vào `main` (`gh pr merge <số> --merge`) → `git checkout main && git pull --ff-only` → (có migration mới thì `npx wrangler d1 migrations apply <db> --remote --config wrangler.production.jsonc` trước) → `npm run deploy:production` (local) → smoke → báo Version ID + SHA. KHÔNG chạy workflow GitHub Actions "Triển khai production".

## 6. Quy tắc sửa giao diện tối giản (Chỉ ghi tiêu đề, tuyệt đối cấm chú thích)
- **Quy tắc bắt buộc trước khi sửa bất kỳ nội dung chức năng/giao diện nào:** TUYỆT ĐỐI KHÔNG ĐƯỢC CHÚ THÍCH, CHỈ GHI TIÊU ĐỀ.
- **Cấm tuyệt đối thêm nội dung bổ sung:** Tuyệt đối KHÔNG tự ý chèn thêm văn bản bổ sung, mô tả phụ, hướng dẫn sử dụng, phụ đề (subtitles/descriptions), tags giải thích, đoạn văn chú thích đi kèm hay nhãn giải nghĩa cho tiêu đề/tùy chọn đó.
- **Tiêu đề tự tường minh:** Giữ giao diện sạch sẽ, trực quan, tinh gọn tuyệt đối theo nguyên tắc "Obvious UI Does Not Explain Itself". Mọi chức năng tự rõ nghĩa qua tiêu đề và ngữ cảnh.

## 7. Quy tắc thiết kế bố cục: Tuyệt đối không đè phần tử (Zero Overlap Invariant) & Tối ưu không gian hẹp
- **Cấm đè lên nhau giữa các card cố định & Ưu tiên Top-Layer cho Popup mới nhất (Fixed Cards Non-Overlap & Top-Layer Popup Stacking):** Giữa các card cố định với nhau TUYỆT ĐỐI KHÔNG BAO GIỜ ĐƯỢC ĐÈ LÊN NHAU. Mọi phần tử cố định phải có ranh giới cấu trúc rõ ràng qua CSS Grid / Flexbox, padding và margin độc lập, tuyệt đối không dùng absolute positioning để giả lập bố cục thường. Chỉ khi là card popup tạm thời (Dialog, Popover, Dropdown Menu, Tooltip, Sheet drawer) thì card popup nào được mở gần đây nhất mới có quyền hiển thị trên cùng (Top-Layer / Stacking context cao nhất) các card khác.
- **Khoảng cách thông thoáng & Nhịp điệu không gian (Breathing Room & Spacing Rhythm Invariant):** Luôn luôn có khoảng cách hợp lý, rõ ràng và nhất quán (margin, padding, gap) giữa các card, giữa các tiêu đề và giữa các khối nội dung với nhau. Tuyệt đối không để các card, nút bấm hay nhãn dính sát rạt vào nhau gây cảm giác ngột ngạt; giữ cho giao diện luôn có không gian đệm để trải nghiệm nhìn vào thật sự "thoáng con mắt", tôn trọng khoảng trống tự nhiên (whitespace).
- **Nút thành tựu:** Hồ sơ và bảng thông tin người dùng phải có nút/mục "Thành tựu" (Achievements) rõ ràng, trực quan để người dùng theo dõi huy hiệu và tiến độ học tập / hoạt động.
- **Tối ưu không gian hẹp / Mobile (Icon-Only Compact Mode):** Khi màn hình hoặc container có không gian hẹp (mobile, popover hẹp, thanh điều khiển thu nhỏ), chuyển sang sử dụng icon đại diện thay vì chèn chữ dài dòng gây vỡ giao diện hoặc tràn đè lên nhau. Luôn kèm `title` và `aria-label` để đảm bảo trải nghiệm và khả năng tiếp cận.

## 8. Quy tắc tinh gọn giao diện & Chống trùng lặp (Streamlined Layout & Anti-Redundancy Rules)
- **Hệ thống điều hướng chuẩn duy nhất (Single Canonical Navigation):**
  * Thanh điều hướng trên đỉnh (`AppHeader`) là nơi điều hướng chuẩn duy nhất trên máy tính cho 3 trục chính: `Học tập` (`/learn`), `Game` (`/arena`), `Cộng đồng` (`/community`), kèm tìm kiếm, thông báo và menu tài khoản.
  * Tuyệt đối không dựng thêm thanh sidebar cố định trên desktop lặp lại các đích đến này, gây lãng phí 240px chiều ngang và phân tán sự chú ý của người dùng.
- **Cấm thẻ lối tắt lấp chỗ trống (Zero Redundant Filler Cards):**
  * Không tạo các card lối tắt phụ (như "Cộng đồng & Bảng tin", "Bảng vinh danh", "Vào phòng học") trỏ về các trang đã có sẵn trên menu chính chỉ nhằm lấp đầy khoảng trống chiều cao cột.
  * Khoảng trống tự nhiên (whitespace) là yếu tố thẩm mỹ hợp lệ và bắt buộc để mắt người dùng được thư giãn ("thoáng con mắt"), tạo cảm giác cao cấp và hiện đại.
- **Không tạo CTA cạnh tranh trong Hero (Zero Competing Hero CTAs):**
  * Banner Hero tập trung vào lời chào và trạng thái lớp học, không đặt hàng loạt nút bấm chuyển trang trùng lặp với các phần nội dung thực tế (phòng học, trò chơi) ngay bên dưới.

## 9. Quy tắc card luôn cố định khi cấu hình & tương tác (Card Stability & Zero Layout Shift Invariant)
- **Cố định chiều cao và bố cục (Fixed Dimensions):** Mọi card, modal dialog hoặc panel khi người dùng cấu hình, chuyển tab, chuyển chế độ (như chọn game 1v1 / game solo, chuyển Công khai / Riêng tư, chọn mốc thời gian...) BẮT BUỘC phải giữ chiều cao và bố cục cố định (Fixed Dimensions / Reserved Slots).
- **Card cố định không di chuyển khi thao tác chuyển đổi (Fixed Dimensions & Zero Movement on Toggle / Transition):** Các card cố định BẮT BUỘC KHÔNG ĐƯỢC DI CHUYỂN khi người dùng thao tác chuyển đổi (chuyển tab, chọn trò chơi, chọn mốc thời gian, chuyển chế độ Công khai / Riêng tư, bật/tắt tùy chọn). Toàn bộ tọa độ vị trí (x, y) của card, các tiêu đề bên trong và nút hành động chính (Footer CTA) phải đứng yên 100%, không co giật hay xê dịch dù chỉ 1 pixel.
- **Cố định các card con bên trong card mẹ (Sub-card Stability & Coordinate Locking Invariant):** Mọi card con, nút chọn hoặc panel bên trong một card mẹ/dialog (như card chọn game, card chọn thời gian, card chế độ phòng, card nhập mật khẩu) BẮT BUỘC phải giữ nguyên tọa độ (x, y) và chiều cao cố định khi người dùng chuyển đổi giữa các game (ví dụ từ game 1v1 sang game chơi đơn) hoặc giữa các chế độ. Vùng thời gian/cấu hình phải dành sẵn slot cố định có chiều cao đồng nhất, tuyệt đối không được co rút hay phình to làm dịch chuyển các card con lân cận.
- **Thiết kế 1 hàng tinh gọn cho card tùy chỉnh (Single-Row Inline Control Invariant):** Card tùy chỉnh/trạng thái (như thanh thời gian lượt) BẮT BUỘC chỉ thiết kế duy nhất 1 hàng cố định (`h-9` hoặc `h-10`). Khi chuyển sang chế độ tùy chỉnh, hiển thị bộ điều khiển (stepper, nút tăng giảm) ngay trên chính hàng đó, TUYỆT ĐỐI KHÔNG sinh thêm hàng thứ 2 gây dư thừa, khựng chuyển động hay làm sụt lún đẩy các card bên dưới.
- **Cấm co giật sụt lún (Zero CLS):** Tuyệt đối cấm để card co giật, sụt lún hay nhảy chiều cao (Zero CLS) khi bật/tắt các tùy chọn bên trong. Các vùng nội dung có điều kiện phải dự trù sẵn không gian (slot cố định) hoặc hiển thị trạng thái tương ứng chiếm trọn không gian đó.
- **Nút hành động cố định vị trí & Chống đè Footer CTA (Fixed Action Placement & Zero Overlap with Footer CTA):** Nút hành động chính (Footer CTA như Hủy, Tạo bàn ngay, Lưu, Áp dụng) phải luôn đứng yên tại vị trí chuẩn, không bị đẩy lên kéo xuống giật cục khi người dùng thao tác. Luôn duy trì khoảng đệm an toàn (khoảng cách >= 12px) giữa card con cuối cùng và thanh Footer CTA, tuyệt đối không để card hay nội dung đè lên các nút thao tác.
- **Cố định tiêu đề & nhãn trong card (Fixed Title & Label Invariant):** Ngoài việc cố định chiều cao của card, các tiêu đề và nhãn trường (như nhãn "Mật khẩu phòng:", tiêu đề cấu hình, nhãn thời gian...) bên trong card hoặc modal dialog khi người dùng chuyển tab / chuyển chế độ (ví dụ chuyển giữa Công khai và Riêng tư) BẮT BUỘC phải đứng yên tại một vị trí tọa độ cố định, tuyệt đối không được nhảy lên nhảy xuống (nhảy từ giữa lên trên hoặc ngược lại) giữa các trạng thái. Tách nhãn thành dòng cố định riêng biệt phía trên ô dữ liệu để cấu trúc khung và vị trí chữ luôn bất biến ở mọi chế độ.

## 10. Quy tắc viền đồng nhất, chuyển động không khựng & Cân đối card cùng cấp (Zero-Stutter Motion & Peer Card Uniformity Invariant)
- **Quy tắc bắt buộc AI đọc rule thiết kế trước khi sửa (Mandatory Design Gate):** Trước mọi thao tác chỉnh sửa UI/UX trên bất kỳ trang nào, AI BẮT BUỘC phải đọc và tuân thủ toàn bộ các quy tắc thiết kế: không chú thích (chỉ ghi tiêu đề), card cố định không di chuyển, tiêu đề cố định, không đè phần tử, nhịp điệu khoảng cách thoáng mắt, viền đồng nhất, và tuyệt đối không dùng transition-all gây giật/khựng. Áp dụng đồng bộ cho toàn bộ hệ thống web.
- **Viền đồng nhất & Chống khựng chuyển động (Uniform Border & Motion Transition Invariant):**
  * Tuyệt đối KHÔNG dùng `transition-all` cho các nút bấm, tab, card hoặc modal có thay đổi trạng thái kích thước hay đường viền; chỉ được dùng `transition-colors duration-150` để chuyển đổi màu sắc (màu nền, màu viền, màu chữ).
  * Giữa trạng thái được chọn (active) và chưa chọn (inactive), BẮT BUỘC phải dùng cùng độ dày đường viền (ví dụ `border-2` cho cả 2 trạng thái). Tuyệt đối cấm đổi giữa `border` (1px) và `border-2` (2px) vì việc này khiến trình duyệt animate `border-width` gây hiện tượng rung giật, co giãn hoặc khựng khung hình.
- **Cân đối card cùng cấp (Peer Card Uniformity & Grid Consistency Invariant):**
  * Các card, nút lựa chọn hoặc ô nội dung cùng một cấp danh mục (như danh sách các trò chơi, các mốc thời gian, các tùy chọn chế độ) BẮT BUỘC phải có kích thước, tỷ lệ, độ cao và độ rộng đồng đều và nhất quán theo lưới CSS.
  * Tuyệt đối không để một card tự ý kéo dài (như gán `col-span-2` làm card dài gấp đôi) trong khi các card cùng cấp khác chỉ chiếm 1 cột, gây khập khiễng và mất cân đối thị giác.
  * Khi danh sách có số lượng lẻ, giữ nguyên kích thước 1 cột chuẩn cho mọi card, không tự tiện cho card cuối cùng giãn rộng chiếm nhiều cột.
- **Giữ nguyên cấu trúc DOM và vị trí chỉ báo (Persistent DOM Node & Reserved Indicator Invariant):**
  * Các chỉ báo trạng thái (như dấu chấm tròn `size-2`, icon check, icon mắt ẩn/hiện mật khẩu) phải luôn được giữ nguyên slot trong DOM và điều khiển bằng `opacity-0` / `opacity-100` hoặc padding dành sẵn, tuyệt đối không unmount/remount làm dịch chuyển vị trí chữ hoặc gây reflow/repaint khựng khung hình.

## 11. Quy tắc Tuyệt đối Không Ẩn / Không Làm Tối Đen Khu Vực Xung Quanh Khi Bật Popup (Non-Obscuring Popup & Transparent Backdrop Invariant)
- **Tuyệt đối không bao giờ được ẩn khu vực xung quanh khi bật bất kỳ popup nào có trong web:** Khi mở bất kỳ popup, dialog, modal, drawer, popover hay sheet nào trên toàn bộ hệ thống web, TUYỆT ĐỐI KHÔNG được ẩn, che lấp, làm tối mịt (pitch black), hoặc làm mờ nhòe (heavy blur) khu vực xung quanh.
- **Không dùng backdrop đen dày hoặc blur che khuất:** Lớp phủ backdrop (`DialogOverlay`, `AlertDialogOverlay`, `SheetOverlay`...) TUYỆT ĐỐI KHÔNG dùng `bg-black/45`, `bg-black/60` hay `backdrop-blur` dày làm tối thui màn hình phía sau. Thay vào đó, lớp phủ phải giữ độ trong suốt cao (chỉ dùng tối đa `bg-black/10` hoặc `bg-transparent` kèm click-to-dismiss, không blur làm mất chi tiết) nhằm đảm bảo toàn bộ giao diện phía sau (banner, danh sách phòng, bảng xếp hạng, bạn bè) vẫn hiển thị sắc nét, sống động, nhận diện rõ ràng 100%.
## 12. Quy tắc họa tiết nền mờ toàn diện & Thẩm mỹ Skeuomorphic hoàn thiện (Balanced Blueprint Background & Skeuomorphic Aesthetic Invariant)
- **Họa tiết nền mờ phân bổ toàn diện & cân đối (Balanced Blueprint Watermark):** Khi sử dụng họa tiết đồ họa chìm / blueprint vi mạch cho card hoặc modal, BẮT BUỘC phải phân bổ hài hòa, đồng đều ở tất cả các khu vực (góc trên trái, góc trên phải, giữa các cạnh bên, góc dưới trái, góc dưới phải và lưới chấm chìm toàn diện). Tuyệt đối KHÔNG được chỉ đặt họa tiết dồn cục ở duy nhất một góc (như góc trên bên phải) làm mất cân bằng bố cục thị giác.
- **Độ mờ tinh tế & không gây nhiễu (Calm & Non-Distracting Contrast):** Họa tiết nền mờ chỉ được dùng nét mảnh (`strokeWidth="1"` hoặc `0.8`), tông màu dịu nhẹ (`rgba(56, 189, 248, 0.10)` - `0.14`), lưới chấm mờ (`0.06` - `0.08`), tuyệt đối không dùng màu quá sáng hoặc các hình khối đặc gây chói mắt hay cạnh tranh thị giác với văn bản và nút bấm chính.
- **Đường bao mỏng 1px với dải sáng nhẹ trung tâm hai bên:** Card sử dụng đường bao mảnh 1px (`border: 1px solid rgba(...)`), kết hợp hiệu ứng sáng nhẹ ở giữa hai cạnh bên qua pseudo-elements `::before` và `::after` (`top: 20%; bottom: 20%; width: 1.5px; linear-gradient`).
- **Cố định cạnh trên của modal khi co giãn kích thước:** Khi mở rộng card modal, chỉ mở rộng sang hai cạnh bên (chiều rộng) và cạnh dưới (chiều cao), giữ nguyên tọa độ cạnh trên (`top: 72px`, `translate: -50% 0`, `transform: none`), tuyệt đối không để cạnh trên bị kéo trôi lên sát nóc viewport.
- **Cố định tuyệt đối các card con và nút bấm bên trong:** Sub-card, nút chọn, stepper tùy chỉnh chỉ nằm trên 1 hàng duy nhất (`h-9`), slot thời gian luôn cố định chiều cao `114px` ở cả chế độ 1v1 lẫn chơi đơn. Duy trì khoảng cách an toàn >= 12px với thanh Footer CTA, tuyệt đối không đè card/nội dung lên nhau.

## 13. Quy tắc Thiết kế Hồ sơ Tối giản & Chống Trôi Cắt Đầu Popup (Profile Simplicity & Safe Viewport Centering Invariant)
- **Hồ sơ cá nhân tối giản, không màu mè, không banner (`/me`):** Giao diện hồ sơ cá nhân tuân thủ nghiêm ngặt nguyên tắc tinh gọn, loại bỏ hoàn toàn ảnh bìa banner đồ sộ lãng phí không gian hoặc gây chói mắt ('không cần banner, không cần màu mè'). Tập trung trực quan vào: thông tin danh tính người dùng (Avatar, tên hiển thị, @username, suy nghĩ nhanh), nút "Thành tựu" trực quan để xem huy hiệu và tiến trình chuyên cần, và bảng bảo mật tài khoản an toàn.
- **Chống trôi cắt đầu popup (Popup Top Viewport Safety):** Mọi popup, modal, dialog phải luôn căn giữa an toàn trong tầm nhìn (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`), không bao giờ được cấu hình tọa độ cứng `top: 72px` kết hợp với `-translate-y-1/2` khiến nửa trên của popup bị trôi ngược lên trên nóc màn hình làm cắt mất tiêu đề hoặc nút đóng.
- **Tuân thủ tiêu chuẩn thiết kế web quốc tế (WCAG 2.2 AA & Responsive Safety):**
  * Không chồng lấn chữ (Zero Text Overlap Invariant).
  * Kích thước tương tác tối thiểu >= 40px trên desktop, >= 44px trên mobile touch.
  * Tương phản văn bản cao, nhãn dễ tiếp cận, không đổi cấu trúc DOM đột ngột gây giật khung hình (Zero CLS).

## 14. Quy tắc Công Thái Học, Vòng Lặp Phản Hồi 3 Giác Quan & Gamification Game (Game Ergonomics & Gamification UX)
- **Công thái học & Vùng chạm ngón cái (Thumb-Zone 3 tầng):**
  * Vùng xanh (Dưới cùng - 40% màn hình): 100% nút tương tác chính trong gameplay và CTA ("Bắt đầu", "Nhận thưởng").
  * Vùng vàng (Giữa màn hình - 40%): Không gian hiển thị bàn cờ / sân đấu / trò chơi.
  * Vùng đỏ (Đỉnh màn hình - 20%): Thông tin thụ động (thanh máu, level, vàng, kim cương, Cài đặt/Tạm dừng).
  * Kích thước điểm chạm tối thiểu >= 48x48dp (Android) / 44x44pt (iOS), khoảng cách an toàn giữa 2 nút >= 8-12px, tôn trọng Safe Area >= 16-24px.
- **Tối giản giao diện trong trận đấu (Minimalist HUD & Progressive Disclosure):**
  * Trong ván game: Ẩn hoàn toàn thanh menu/điều hướng/nhiệm vụ. Giữ lại điểm số và nút tạm dừng bán trong suốt (opacity 50%).
  * Tiết lộ lũy tiến: Cấp 1-3 chỉ thấy "Chơi ngay" và "Nhiệm vụ hàng ngày". Tính năng nâng cao mở dần theo cấp độ.
  * Quy tắc 3 chạm để chơi: Dưới 3 lần chạm & dưới 4 giây từ khi mở app vào ván, không popup chặn liên tiếp.
- **Vòng lặp phản hồi 3 giác quan (< 100ms):**
  * Thị giác: Scale 0.95 -> 1.0, số điểm bay lên (+10 XP) kèm hiệu ứng hạt vỡ vụn nhẹ.
  * Âm thanh: Click sắc gọn khi bấm nút, ting thanh thoát khi nhận thưởng, âm thanh chiến thắng hào hùng (`playUiTapSound`, `playMatchFoundSound`, `playVictoryConfettiSound`).
  * Xúc giác: Rung nhẹ khi chạm nút thường (`selection`), rung nảy khi ăn điểm/trúng (`medium`), rung nhịp kép mạnh mẽ khi lên cấp/mở rương (`success`).
- **Gamification UX:**
  * Dynamic XP Bar: Đặt ngay góc trên/màn hình chính, chạy đầy từ trái sang phải, nhấp nháy phát sáng khi gần đầy (>= 80%) kích thích tâm lý "cố thêm 1 ván nữa để lên cấp".
  * Celebration Screen: Mờ nền, huy hiệu xoay tia sáng, nút lớn duy nhất "Tuyệt vời / Tiếp tục".
  * Streak Tracker: Hiển thị ngày liên tục kèm biểu tượng ngọn lửa rực sáng, cảnh báo cam nổi bật khi sắp hết ngày (trước 24:00).
- **Quảng cáo & Độ tương phản:** Nút xem quảng cáo tách biệt hẳn nút chơi lại/thoát ván, minh bạch giá trị (+1 Tim, x2 XP); tương phản >= 4.5:1, Dark Mode mặc định.

## Mandatory UI/UX constitution

Before modifying any UI/UX, frontend layout, responsive behavior,
component styling, visual hierarchy, popup, modal, card, toolbar,
navigation, mobile layout, form, animation, or interaction pattern,
the agent MUST read and comply with:

[.agents/rules/10-ui-ux-layout-constitution.md](.agents/rules/10-ui-ux-layout-constitution.md)

A UI task is not DONE if it violates any hard invariant in that file.

Conflict precedence: explicit user requirements > security/correctness/product invariants > [Product North Star](docs/PRODUCT_AND_ARCHITECTURE_NORTH_STAR.md) > UI/UX Constitution > legacy implementation. Earlier UI guidance applies only where consistent; title-only restrictions apply only when the user requests a title edit. For UI-only work, the constitution's targeted verification and staging policy (sections 113–114) takes precedence over the full-suite and single-deploy defaults above.

## Approved full-product redesign (2026-09-30)

Follow [docs/UI_REDESIGN_2026_09_30.md](docs/UI_REDESIGN_2026_09_30.md) and references A–D for premium, calm student UI: no card walls, no duplicate actions, first-class dark/light/system themes, responsive desktop to mobile, real data and authoritative logic preserved. Primary navigation is Học tập / Game / Cộng đồng. Classroom uses a central stage, contextual panels and one tool dock. This explicit user-requested redesign uses one full local final gate (typecheck, lint, npm test, build:bundle, diff check) per milestone. No GitHub CI; concise evidence-based reporting. Production remains untouched.
