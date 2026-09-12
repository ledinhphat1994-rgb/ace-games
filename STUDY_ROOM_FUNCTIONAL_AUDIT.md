# STUDY ROOM FUNCTIONAL AUDIT — "Học tập / YouTube Study Room"

**Date:** 2026-09-12 · **Repo:** lop-10a7 (branch `main`, HEAD `f2c6bb7`)
**Method:** source audit + live API verification on local `wrangler pages dev` (local D1) + production probe.
**Evidence script:** `cong-cu/qa-study-room-audit.mjs` → `cong-cu/qa-study-room-audit-result.txt` (**49 checks, 49 PASS, 0 FAIL**).
**Production probe:** `GET https://gdtxdinhquan.pages.dev/api/youtube-search?q=test` → `{"ok":true,"configured":false,"code":"youtube_unconfigured"}` — **YOUTUBE_DATA_API_KEY vẫn chưa được cấu hình trên production** (tính đến 2026-09-12).

> Đây là báo cáo audit, KHÔNG phải redesign. Không có thay đổi chức năng production nào được thực hiện.

---

## 0. BẢNG TỔNG KẾT (FUNCTIONAL COMPLETION MATRIX)

| # | Capability | Status | Evidence (file · API · schema) | Observed behavior (đã kiểm chứng) | Missing / Risk | P |
|---|-----------|--------|-------------------------------|-----------------------------------|----------------|---|
| 1 | YouTube search server proxy | **PARTIAL** | `functions/api/youtube-search.js` · `GET /api/youtube-search` | Proxy ok, trả `{videoId,title,channelTitle,thumbnail,publishedAt}`, `safeSearch=strict`, `videoEmbeddable=true`, map lỗi quota/key rõ ràng, IP rate-limit 30 req/min qua KV `RATE_LIMIT`. Không lộ key (QA C.3 + audit). | **Key chưa cấu hình production** (verified live). Search-as-you-type debounce 450 ms (`index.html:4601-4651`) — mỗi lần gõ nghỉ = 1 `search.list` = 100 quota units; free 10k units/day ≈ **~100 search/ngày toàn hệ thống**. Không có cache server-side. Endpoint **không yêu cầu auth** (public qua `_middleware.js:25`) — IP-limit chống lạm dụng mức cơ bản nhưng botnet nhiều IP vẫn đốt được quota. | P0 (config) / P1 (quota UX) |
| 2 | Paste-link fallback | **PASS** | `index.html:4772-4784` (`btn-paste-youtube-url`) → `onOpenTaoPhong` → `chuanUrlMedia` server-side | Dán link https → mở modal tạo phòng; `chuanUrlMedia` chặn `javascript:`/`data:`/`http:` | Chấp nhận mọi https kể cả non-YouTube → provider `UNSUPPORTED` báo lỗi trong phòng (chấp nhận được). | — |
| 3 | Create Study Room | **PASS** | `POST /api/phong hanhDong:'tao'` · bảng `phong` | Tạo phòng `loai:'video'`, bắt buộc `videoUrl` https; khởi tạo `phong_dong_bo_video` rev=1; chống spam 3 phòng/người | Không có preset Study (default loai chung chung). | — |
| 4 | Join / heartbeat / duplicate join | **PASS** | `POST /api/phong hanhDong:'vao'|'nhip'` · `phong_thanh_vien` PK `(phong_id,khoa)` | Verified A6/A8/A9: join idempotent, `ON CONFLICT` refresh heartbeat; heartbeat client 20 s; presence window 90 s | Không có `pagehide`/`sendBeacon` leave — rời phòng bằng đóng tab phải chờ 90 s mới hết "đang ở". | — |
| 5 | Password admission | **PASS** | `phong.js:140-147, 217-229` · `access_mode/mat_khau_hash/salt` (PBKDF2, `passwords.js`) | Verified A4/A5: sai pass → 403; chưa admitted → `cauHinh` bị null hẳn (`lamSachPhong`); teacher bypass by design | Member hết heartbeat vẫn được coi "admitted" tới **15 phút** (`NHIP_HIEU_LUC`) → vẫn đọc/ghi chat, collab, voice sau khi rời (Low). | — |
| 6 | Atomic capacity | **PARTIAL** | `phong.js:18-32, 150-151` · `phong.suc_chua` | Verified A3/A7b: `INSERT ... WHERE COUNT(*) < cap` atomic; member thứ 4 vào phòng cap=3 → **409** | **Không có cap riêng Study.** Server clamp `2..50`, default **20**; UI modal `min=2 max=100` (`index.html:10070`). Target Study: default 8, hard 12 → chưa enforce. | **P0** |
| 7 | Presence / member list | **PASS** | `GET /api/phong?id` · `phong_thanh_vien` | Trả `ten/vaiTro/lopTen/laChuPhong`, không lộ `khoa` (actor key); limit 60 | — | — |
| 8 | Leave / close lifecycle | **PARTIAL** | `phong.js` `roi`/`dong` | Verified A11: member đóng → 403; host đóng → 200; sau đóng mọi resource → 404 | Không auto-close phòng trống (phòng `mo` mãi, list vẫn hiện); host rời phòng không migrate/chuyển quyền; **không có đổi password**; `watch_room_collab`/`watch_room_voice_signal` mồ côi (không FK cascade, không dọn khi đóng). | P1 |
| 9 | Video sync play/pause/seek | **PASS** (cho mô hình staff-only hiện tại) | `phong-watch.js` · `phong_dong_bo_video.revision` | Verified B1–B4: member POST → 403; host play rev1→2; stale rev → **409 + state mới**; vị trí `playing` nội suy theo `serverNow`; `set_rate` whitelist 0.5–2.0 | Chỉ có `staff_only` — không có `selected`/`everyone`; optimistic concurrency phải giữ nguyên khi mở rộng. | P0 (policy hook) |
| 10 | Playback rate | **PARTIAL** | `phong-watch.js:8,135-141` | `set_rate` hoạt động server-side (verified B5a/B5b) | **Client không có UI chọn tốc độ** — tính năng chết ở frontend. | P2 |
| 11 | Late-join / refresh recovery | **PASS** | `phong-watch.js` GET + client poll 2.5 s | Member vào muộn nhận `positionSeconds` đã nội suy; overlay `btn-viewer-start-watch` xử lý autoplay-consent; refresh → poll lại state | Refresh mất `ROOM_ACTIVE` view — phải vào lại phòng từ lobby (admission còn giữ 15 phút nên không hỏi lại pass). | — |
| 12 | Video change | **NOT IMPLEMENTED** | — | Verified B6: `change_video`/`doi-video` → 400 cả 2 endpoint; `videoUrl` chỉ set lúc tạo | Cần action server `set_video` (update `phong.cau_hinh` + reset sync row, bump revision) + policy `VIDEO_CHANGE`. | **P0/P1** |
| 13 | Video queue / playlist | **NOT IMPLEMENTED** | — | Không có bảng/API/UI nào cho queue | Cần `phong_video_queue` (video_id/url, title, added_by, order, status) + actions play_now/add_next/enqueue/remove/reorder/send_to_chat. | P1 |
| 14 | Room chat | **PARTIAL** | `phong-chat.js` · `phong_tin_nhan` | Verified C1–C3: chưa admitted → 403 đọc+ghi; 3 s/tin; `chat_cam_hoc_sinh` của lớp áp dụng trong phòng; incremental `sauId`; IME guard ok | **Không moderation** (xóa tin, mute member trong phòng — `DELETE` → 405); không timestamp-link tới video; lịch sử giữ sau khi đóng phòng (audit-friendly nhưng không ai đọc được → orphan). | P1 |
| 15 | Shared notes | **PARTIAL** | `phong-collab.js` · `watch_room_collab` | Verified D2–D4: **bất kỳ member nào cũng ghi được** (no capability check); whole-doc JSON `{text}` + 1 `version`; 409 đúng cơ chế; **ghi đè mất hoàn toàn nội dung người kia — không merge** | Đây là "shared textarea last-write-wins", không phải collaborative editing. Cần note-entries append (`{id, khoa, ten, text, videoTimeSec, createdAt}`) thay vì 1 doc. Timestamped notes chưa có. | P1 |
| 16 | Whiteboard | **PARTIAL** | `phong-collab.js` · payload `{strokes:[]}` | Verified D5: 2 người vẽ đồng thời → người sau 409, **nét bị mất**; client mỗi nét = 1 POST ghi đè toàn bộ mảng | Payload tăng không giới hạn; khi vượt ~200 KB `docThan` ném 500 → bảng không lưu được nữa. Cần append-only stroke ops (`wb_op` table) thay vì whole-doc. | P1 |
| 17 | Shared sheet | **PARTIAL** | `phong-collab.js` · payload `{cells,rows,cols}` | Verified D6: 2 người sửa ô KHÁC NHAU vẫn 409 whole-doc | Cần per-cell ops (`sheet_cell` upsert theo `(room_id,cell)`) — update độc lập không xung đột. | P1 |
| 18 | Voice 1-1 | **PARTIAL** | `phong-collab.js` voice_* · `watch_room_voice_signal` · client `joinVoice` (`index.html:1525-1669`) | Verified E1–E4: cap 2 peer/1 phút hoạt động (`voice_room_full` 409); offer/answer/candidate/leave polling ok; mic mặc định tắt | **Signaling KHÔNG pair-bound**: member ngoài cặp vẫn gửi `offer`/`leave` được (E2, E4) → ai cũng phá được cuộc gọi người khác; `voice_poll` broadcast SDP/candidate cho cả phòng (E3) — lộ `sender_key` (actor key `hs:<id>`). **Không TURN** — chỉ `stun:stun.l.google.com` → Restrictive NAT chết (client tự thừa nhận). Cap join chỉ theo cửa sổ 1 phút, không có trạng thái "cặp đang active". Không có permission policy. | **P0/P1** |
| 19 | Invite members | **NOT IMPLEMENTED** | — | Không có invite link/code/grant API; "mời" = phòng hiện trong lobby hoặc share password | Cần `INVITE_MEMBERS` policy + có thể mã mời per-room. | P2 |
| 20 | Kick / room moderation | **NOT IMPLEMENTED** | — | Không có endpoint kick/mute/ban trong phòng; chỉ có `chat_cam_hoc_sinh` toàn lớp | Cần `kick` action (xóa `phong_thanh_vien` row + blacklist room) — server-side. | P1 |
| 21 | Role model Host/Co-host/Teacher/Member | **NOT IMPLEMENTED** | `rooms.js:86-88` | `canControl = isHost || isTeacher` duy nhất; `phong_thanh_vien.vai_tro` chỉ `'hoc_sinh'|'giao_vien'`; **không có co-host** | Verified B7: **GV lớp khác điều khiển được video phòng học sinh** (teacher = quyền toàn cục — by design nhưng cần ghi nhận trong policy model). | **P0** |
| 22 | Capability policy (enabled + access_mode) | **NOT IMPLEMENTED** | — | Mọi capability hardcoded: video=staff-only, chat/collab/voice=everyone-admitted | Cần `phong_policy(phong_id, capability, enabled, access_mode)` + `phong_grant(phong_id, khoa, capability)` + helper `kiemTraQuyenPhong()` gọi từ MỌI endpoint. | **P0** |
| 23 | Study capacity 8 default / 12 max | **NOT IMPLEMENTED** | `phong.js:151` | clamp hiện tại 2–50, default 20 (verified A3 nhận 50) | Thêm `STUDY_ROOM_*` consts + clamp theo `loai==='video'` server-side. | **P0** |
| 24 | StudyDock chat send | **BROKEN** | `index.html:8853` | `onSendPhongChat` gọi `taiTinNhanPhong(p.id)` — **hàm không tồn tại** → `ReferenceError` sau khi POST chat thành công → `.catch` phục hồi lại text trong ô nhập. Tin nhắn vẫn lưu server & hiện ở poll 3 s sau, nhưng user thấy text "bật lại" như thể gửi thất bại (dễ bấm gửi lần 2 → 429). | Fix 1 dòng: gọi đúng hàm refetch (vd inline `fetch` `phong-chat?sauId=` hoặc expose `taiTin`). | **P1** |
| 25 | "Music không còn là activity riêng" | **PARTIAL (divergence)** | `index.html:7950-7968`, `PHONG_LOAI_SANG_CAT.nhac→'LOFI'`, `phong-focus.js` | Code vẫn còn lobby `LOFI` + phòng `loai:'nhac'` (Focus Room Pomodoro + nhạc nền) tạo từ UI; `LOAI_PHONG` còn `'nhac'` | Cần quyết định sản phẩm: giữ Focus Room như tính năng riêng hay gộp. Không xóa trước khi chốt. | P2 |
| 26 | Collab/voice scope theo loại phòng | **PARTIAL** | `phong-collab.js` thiếu `loai` check | Verified: `notes`/`sheet`/`whiteboard`/`voice_signal` hoạt động trên **phòng chat** (id 10070) — `phong-watch` mới check `loai:'video'` | Bề mặt tính năng ẩn trên mọi loại phòng → nên ràng `loai='video'` (Study) hoặc whitelist rõ. | P2 |
| 27 | Sanitization / secret leak | **PASS** | `rooms.js:12-45`, `lamSachPhong` | Verified G4/G5: không lộ `matKhauHash/Salt`, `chuPhongKhoa`, `cau_hinh` trong list; detail ẩn `cauHinh` khi chưa admitted | — | — |
| 28 | Closed-room resource rejection | **PASS** | `kiemTraTruyCapPhong` `trangThai!=='mo'` → 404 | Verified G7: chat/collab/watch trên phòng đã đóng → 404 | — | — |

**Totals:** PASS **8** · PARTIAL **11** · BROKEN **1** · NOT IMPLEMENTED **7**

---

## 1. CURRENT ARCHITECTURE (đo từ code)

```
Browser (index.html SPA, React18+Babel CDN)
│
├─ Campus Universe ──#world-hoc-tap──> ActivityLobby('CINEMA')
│     ├─ GET /api/youtube-search?q=…   (public, no auth, IP rate-limit 30/min→KV)
│     └─ room list: GET /api/phong (15 s poll) ──> D1.phong (+phong_thanh_vien count 90 s)
│
└─ ROOM_ACTIVE (phong loai='video')
      ├─ CampusWatchTogether ── GET /api/phong-watch (2.5 s poll, serverNow extrapolation)
      │                        POST /api/phong-watch {play|pause|seek|set_rate, expectedRevision}
      │                        → requireHostOrTeacher; UPDATE … WHERE revision=? (OCC)
      ├─ StudyDock
      │   ├─ chat tab   → /api/phong-chat (3 s poll, 3 s/msg rate-limit, chat_cam_hoc_sinh)
      │   ├─ notes      → /api/phong-collab?resource=notes      (3 s poll; whole-doc +version)
      │   ├─ whiteboard → /api/phong-collab?resource=whiteboard (3 s poll; strokes[] overwrite)
      │   ├─ sheet      → /api/phong-collab?resource=sheet      (3 s poll; cells{} overwrite)
      │   └─ voice      → /api/phong-collab voice_signal/voice_poll (1.5 s)
      │                   RTCPeerConnection STUN-only (stun.l.google.com:19302, KHÔNG TURN)
      ├─ heartbeat POST /api/phong {nhip} (20 s) → phong_thanh_vien.hoat_dong_luc
      └─ room detail GET /api/phong?id (10 s)

Auth: cookie HMAC (c10a7_session) → _middleware → bocXuLy → kiemTraPhienHieuLuc
Access: kiemTraTruyCapPhong = scope(lop/truong) + canControl(isHost||isTeacher) + isAdmitted(password)
Storage: D1 (phong, phong_thanh_vien, phong_tin_nhan, phong_dong_bo_video,
         phong_focus_state, watch_room_collab, watch_room_voice_signal)
```

Mọi realtime đều là **D1 polling** (không WebSocket/DO). Voice signaling đi qua bảng D1 (insert per ICE candidate, dọn >5 phút mỗi lần gửi).

## 2. TARGET STUDY ROOM ARCHITECTURE (giữ D1 polling, không migrate DO ở phase này)

```
StudyRoom (loai='video', suc_chua ∈ [2..12], default 8)
├─ roles:  phong_thanh_vien.vai_tro_phong ∈ {host, co_host, teacher, member}
│          host = phong.chu_phong_khoa (bất biến); teacher = phien.role==='teacher'
├─ policy: phong_policy(phong_id, capability, enabled, access_mode)
│          access_mode ∈ {staff_only, selected_members, everyone}
├─ grants: phong_grant(phong_id, khoa, capability)   ← selected_members
├─ helper: kiemTraQuyenPhong(db, phongRow, phien, capability)
│          → staff? policy.enabled && mode∈... && (mode==='everyone' || grant?)
├─ video:  phong_dong_bo_video + action 'set_video' (update cau_hinh, reset sync)
├─ queue:  phong_video_queue(id, phong_id, video_url, video_id, title, thumb,
│                            added_by_khoa/ten, ord, status)
├─ collab: notes → bảng note-entries append + optional video_time_sec
│          whiteboard → phong_wb_op append-only (stroke_done, clear)
│          sheet → phong_sheet_cell upsert per-cell (room_id, cell, value, updated_by, rev)
├─ voice:  phong_voice_pair (phong_id, a_khoa, b_khoa, trang_thai) + pair-bound signals
│          (giữ 1 cặp 1-1/phòng; TURN qua env secret khi có)
└─ moderation: kick = DELETE thanh_vien + insert phong_ban; chat delete = da_xoa flag
```

## 3. PERMISSION MODEL PROPOSAL (server-authoritative)

```sql
-- vai trò trong phòng (mở rộng phong_thanh_vien)
ALTER TABLE phong_thanh_vien ADD COLUMN vai_tro_phong TEXT NOT NULL DEFAULT 'member';
-- 'host' suy ra từ phong.chu_phong_khoa — KHÔNG lưu để tránh xung đột;
-- cột này chỉ giữ 'co_host' | 'member' ('teacher' suy từ phien.role).

CREATE TABLE phong_policy (
  phong_id    INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  capability  TEXT NOT NULL,        -- 'video_control','video_change','queue','chat',
                                    -- 'notes','whiteboard','sheet','voice','invite','moderation'
  enabled     INTEGER NOT NULL DEFAULT 1,
  access_mode TEXT NOT NULL DEFAULT 'staff_only', -- 'staff_only'|'selected_members'|'everyone'
  PRIMARY KEY (phong_id, capability)
);

CREATE TABLE phong_grant (
  phong_id   INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa       TEXT NOT NULL,         -- actor key được cấp
  capability TEXT NOT NULL,
  PRIMARY KEY (phong_id, khoa, capability)
);

CREATE TABLE phong_ban (              -- kick/ban trong phòng
  phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa TEXT NOT NULL, tao_luc TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, khoa)
);
```

Resolution order trong `kiemTraQuyenPhong()`:
1. `phien.role==='teacher'` → staff (teacher authority toàn cục, không ai thu được — kể cả host).
2. `khoa === phong.chu_phong_khoa` → staff (host).
3. `vai_tro_phong==='co_host'` → staff, **trừ** các capability chỉ host (`room_close`, `password_change`, `grant_co_host`, `modify_teacher`).
4. `member` → check `phong_policy.enabled && (access_mode==='everyone' || (access_mode==='selected_members' && EXISTS phong_grant))`.
5. Default policy khi phòng mới tạo: video_control=staff_only, video_change=staff_only, queue=staff_only, chat=everyone, notes=everyone, whiteboard=everyone, sheet=everyone, voice=selected_members, invite=everyone, moderation=staff_only.

Anti-escalation rules:
- Chỉ host/teacher đặt `co_host`; co_host không tự thăng co_host khác, không sửa teacher, không `dong`/`doi_mat_khau`.
- Mọi grant/policy check đọc `phong_id` từ URL rồi resolve server-side — không tin field role từ client.
- `phong_ban` chặn ở `ghiNhanVao` trước khi kiểm tra capacity.

## 4. CAPACITY / LOAD-RISK ASSESSMENT

Measured request rates per member trong video room (đọc trực tiếp từ interval trong `index.html`):

| Nguồn | Chu kỳ | Req/phút/người |
|---|---|---|
| heartbeat `nhip` | 20 s | 3 |
| room detail | 10 s | 6 |
| `phong-watch` poll | 2.5 s | 24 |
| `phong-chat` poll | 3 s | 20 |
| collab poll (mỗi tab notes/wb/sheet mở) | 3 s | 20/tab |
| voice_poll (khi trong voice) | 1.5 s | 40 |

- Baseline member trong phòng video: **~53 req/phút** (heartbeat+detail+watch+chat).
- Có 1 tab collab mở: +20; voice active: +40 → đỉnh **~113–150 req/phút/người**.
- Room 12 người: **~640–1.800 req/phút** ≈ **38k–108k req/giờ-phòng** → **1–2 phòng đầy chạy 1 giờ có thể chạm/vượt free quota 100k Workers req/ngày** nếu dùng liên tục. Đây là *ước lượng từ code*, chưa có benchmark thật → **UNKNOWN, cần benchmark** (đề xuất: script Playwright N contexts đếm request trong 10 phút).
- D1 writes: heartbeat update 3/phút + chat + collab save (debounce 1–1.2 s khi gõ) + voice insert (nhiều ICE candidate/call) — ở 12 người vẫn xa dưới 100k rows/day, nhưng `watch_room_voice_signal` insert-per-candidate + poll rác là phần nóng nhất.
- Kết luận: cap **12** hợp lý cho v1; nếu muốn 20+ phải giảm chu kỳ poll (vd gộp watch+chat+collab thành 1 aggregate endpoint/room tick) hoặc chuyển DO/WebSocket — ngoài phạm vi phase này.

## 5. MIGRATION CHANGES REQUIRED

```sql
-- 77-study-room-governance.sql (đề xuất)
ALTER TABLE phong_thanh_vien ADD COLUMN vai_tro_phong TEXT NOT NULL DEFAULT 'member';
CREATE TABLE phong_policy (...)   -- như §3
CREATE TABLE phong_grant  (...)
CREATE TABLE phong_ban    (...)
CREATE TABLE phong_video_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL, video_id TEXT, title TEXT, thumb TEXT,
  added_by_khoa TEXT NOT NULL, added_by_ten TEXT,
  ord REAL NOT NULL,                  -- reorder bằng fractional order
  trang_thai TEXT NOT NULL DEFAULT 'queued',  -- 'queued'|'playing'|'played'|'skipped'
  tao_luc TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE phong_voice_pair (
  phong_id INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
  a_khoa TEXT NOT NULL, b_khoa TEXT, trang_thai TEXT NOT NULL DEFAULT 'ringing',
  tao_luc TEXT DEFAULT CURRENT_TIMESTAMP, cap_nhat_luc TEXT DEFAULT CURRENT_TIMESTAMP
);
-- collab v2 (không đụng watch_room_collab cũ để không phá phòng đang mở):
CREATE TABLE phong_note (id INTEGER PK, phong_id, khoa, ten, noi_dung,
                         video_time_sec REAL, tao_luc, da_xoa DEFAULT 0);
CREATE TABLE phong_wb_op (id INTEGER PK, phong_id, khoa, op_json, tao_luc);
CREATE TABLE phong_sheet_cell (phong_id, cell, gia_tri, updated_by, updated_at,
                               PRIMARY KEY(phong_id, cell));
ALTER TABLE phong_tin_nhan ADD COLUMN da_xoa INTEGER NOT NULL DEFAULT 0;
ALTER TABLE phong_tin_nhan ADD COLUMN video_time_sec REAL;   -- timestamp-linked chat
```

Đồng thời cập nhật `00-schema-chuan-toan-bo.sql` (hiện **đã thiếu** `watch_room_collab`, `watch_room_voice_signal`, `chat_read_state` của migration 75 — file chuẩn đang lệch schema thật).

## 6. EXACT IMPLEMENTATION SEQUENCE (P0 trước, không đụng UI)

| Bước | Việc | File | Risk |
|---|---|---|---|
| **P0-1** | Fix `taiTinNhanPhong` ReferenceError (1 dòng) + ràng `phong-collab` vào `loai:'video'` | `index.html:8853`, `phong-collab.js` | trivial |
| **P0-2** | Migration 77 (bảng ở §5, chưa đụng collab v2) + capacity: `STUDY_CAP_MIN 2 / DEFAULT 8 / MAX 12` clamp theo `loai==='video'` server-side; UI `max=12` | `phong.js`, `index.html:10070` | low |
| **P0-3** | `rooms.js`: thêm `resolveVaiTroPhong()` + `kiemTraQuyenPhong()`; default policy seed khi tạo phòng video | `rooms.js`, `phong.js` | medium — mọi endpoint phải qua đây |
| **P0-4** | Wire capability: `phong-watch` POST → `video_control`; `phong-chat` POST → `chat`; `phong-collab` → `notes|whiteboard|sheet|voice`; actions `set-cohost/kick/policy` trong `phong.js` | 3 API | medium |
| **P0-5** | `set_video` action + `phong_video_queue` + `send_to_chat` | `phong-watch.js`, `phong.js`, `phong-chat.js` | medium |
| **P1-1** | Collab v2: note-entries (có `video_time_sec`), wb append-ops, sheet per-cell upsert | `phong-collab.js` + bảng mới | medium |
| **P1-2** | Voice pair-binding (`phong_voice_pair`) + policy voice + TURN env hook | `phong-collab.js` | medium |
| **P1-3** | Chat moderation (`da_xoa`, kick/ban), timestamp-link chat↔video | `phong-chat.js` | low |
| **P2-1** | Invite, benchmark script, telemetry đếm req/phòng | mới | low |

## 7. TESTS THAT MUST BE ADDED

Mở rộng `cong-cu/qa-study-room-audit.mjs` thành regression suite:

- **Matrix quyền:** member bị chặn `video_control` khi policy=staff_only; được khi `everyone`; được khi có grant `selected_members`; grant thu hồi → chặn lại.
- **Co-host:** host set co-host ok; co-host điều khiển video ok; co-host set co-host khác → 403; co-host đóng phòng/đổi pass → 403; co-host kick member ok, kick teacher → 403.
- **Teacher immunity:** host không thu được quyền teacher; teacher luôn staff trong mọi policy.
- **Capacity:** phòng video `sucChua=99` → server trả về ≤12; phòng đầy 12 → join thứ 13 → 409.
- **Collab v2:** 2 user append notes đồng thời → cả 2 tồn tại (không 409); 2 user vẽ → cả 2 stroke hiện; 2 ô sheet khác nhau → không xung đột.
- **Voice:** join thứ 3 khi cặp active → 409/queue; member ngoài cặp gửi offer/leave → 403; `voice_poll` chỉ trả signal của cặp mình.
- **Queue:** add/play_next/remove/reorder/send_to_chat + policy `queue=selected_members`.
- **Password change:** host đổi pass → member cũ (ngoài phòng) phải nhập pass mới; member đang trong phòng không bị kick ngay (decision).
- **UI smoke (Playwright):** gửi chat qua StudyDock không phục hồi text (regression cho bug #24).

## 8. PRODUCTION CONFIGURATION DEPENDENCIES

| Secret/binding | Trạng thái | Ghi chú |
|---|---|---|
| `YOUTUBE_DATA_API_KEY` | **MISSING trên production** (verified live 2026-09-12) | Đặt qua `wrangler pages secret put` hoặc Pages dashboard; không commit vào repo |
| `SESSION_SECRET` / `CLASS_CODE` / `TEACHER_CODE` / `TURNSTILE_SECRET_KEY` | có trong `.dev.vars` local; production giả định đã có (site đang chạy login được) | — |
| `RATE_LIMIT` KV | bound `wrangler.toml` | dùng cho yt-search IP limit |
| `DB` D1 / `ANH` R2 | bound | — |
| TURN server (VD `TURN_URL/TURN_USER/TURN_PASS`) | **không tồn tại** | voice fail trên Restrictive NAT; cân nhắc Cloudflare Calls TURN hoặc metered.ca |

## 9. CRITICAL FINDINGS CẦN HÀNH ĐỘNG NGAY

Không có lỗ hổng critical cấp "fix ngay trong audit" (không thấy auth bypass / secret leak / IDOR xuyên lớp). Nhưng 4 việc nên xếp đầu implementation pass:

1. **Voice signaling không pair-bound + broadcast SDP toàn phòng** (E2–E4) — bất kỳ member nào cũng inject `leave`/`offer` phá cuộc gọi; lộ `sender_key` nội bộ. → P0/P1.
2. **`taiTinNhanPhong` ReferenceError** (`index.html:8853`) — user-facing bug đang live. → fix 1 dòng.
3. **`YOUTUBE_DATA_API_KEY` missing production** — search feature đang chết trên site thật. → config, không phải code.
4. **Không có governance layer** (co-host, capability policy, study capacity 8/12, video change/queue, kick) — toàn bộ là server-side gap, không vá được bằng UI.

---

## PHỤ LỤC: LỆNH ĐÃ CHẠY

```bash
node build.js                                                  # OK (139 files → dist)
npx wrangler pages dev dist --port 8788 --compatibility-date=2026-05-03 \
  --binding "SESSION_SECRET=<dev secret>"                      # local server
node cong-cu/qa-study-room-audit.mjs                           # 49 PASS / 0 FAIL
curl https://gdtxdinhquan.pages.dev/api/youtube-search?q=test  # configured:false (prod)
npx eslint cong-cu/qa-study-room-audit.mjs                     # clean
node cong-cu/kiem-tra-du-lieu.js                               # 0 lỗi (warning cũ có sẵn)
```

**STOP BOUNDARY:** audit kết thúc tại đây — chưa sửa chức năng production, chưa redesign UI, chưa migrate Durable Objects.
