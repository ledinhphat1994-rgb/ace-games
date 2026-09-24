# Digital Campus v2 — Quy tắc bắt buộc

> **Nguyên tắc khởi đầu (Mandatory Pre-implementation Gate):**
> Trước khi thực hiện bất kỳ nhiệm vụ cốt lõi hoặc tính năng mới nào:
> 1. Đọc kĩ [docs/PRODUCT_AND_ARCHITECTURE_NORTH_STAR.md](docs/PRODUCT_AND_ARCHITECTURE_NORTH_STAR.md).
> 2. Xác định rõ task thuộc về **Platform Core** hay **Activity**.
> 3. Tuyệt đối giữ vững ranh giới Platform / Activity (không duplicate tính năng nền tảng vào activity).
> 4. Không bao giờ thu hẹp kiến trúc thành một website lớp học hay LMS đơn lẻ.
> 5. Không tin tưởng báo cáo lý thuyết hơn bằng chứng mã nguồn và runtime thực tế.
> 6. Độ chính xác chức năng & sự tin cậy luôn đi trước vẻ bóng bẩy giao diện.

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

2. **XONG → CHECK LOCAL 1 LẦN:**
   Chỉ khi đã hoàn thành toàn bộ sửa đổi mới chạy Local Final Gate (DUY NHẤT 1 LẦN):
   - `npm run typecheck` (0 lỗi)
   - `npm run lint` (0 lỗi)
   - `npm test` (100% xanh)
   - `npm run build:bundle` (`vite build`, không lặp lại typecheck)
   - `git diff --check` (0 lỗi whitespace / conflict)
   PASS hết mới commit/push. Pre-commit chỉ check staged diff & lint file staged. Không chạy GitHub CI.

3. **STAGING CHỈ KHI THẬT SỰ CẦN:**
   Chỉ khi UI/Room/browser/realtime cần nhìn thực tế mới deploy staging **1 lần** để review.
   Sửa typo, helper nhỏ, test-only, script... **bỏ qua staging**.

4. **PRODUCTION → GUARD → DEPLOY → SMOKE:**
   Khi được duyệt: `main sạch + HEAD == origin/main + config production đúng → deploy → smoke`.
   Chỉ kiểm tra thêm migration/RoomDO/auth/voice khi diff thật sự đụng các phần đó.

### Những thứ BỎ HẲN khỏi flow thường ngày:
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
- **Agent Deploy Permission (Cloudflare Workers):** `npm run deploy` là lệnh Wrangler chạy **local** — không SSH vào VPS, không truy cập server từ xa. Agent **được phép tự chạy `npm run deploy`** khi: (1) tất cả quality gates đã pass (typecheck 0 lỗi, lint 0 lỗi, test 100% xanh, build thành công), (2) code đã merge vào `origin/main`, và (3) user đã xác nhận rõ ràng. Sau deploy, agent phải báo lại Cloudflare Version ID và deployed SHA.
