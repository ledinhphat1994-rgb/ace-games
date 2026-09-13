# Study Room Governance API v1 — Contract (backend → frontend handoff)

- **Status:** `ACCEPTED_BACKEND` — Correctness Gate QA 188/188 PASS (A–J + K1–K6), reviewer đã chấp nhận.
- **Backend commit:** `6872653d80eef4f7ee280fb6b4864301585b6df7`
- **Migration:** `co-so-du-lieu/77-study-room-governance.sql` (đã apply local + remote)

## Ranh giới Preview vs Participant (BẮT BUỘC)

- `canPreview`: tài khoản đúng phạm vi được xem metadata Lobby an toàn — `id, ten, loai, phamVi, accessMode, sucChua, soNguoi, chuPhongTen, lopTen, cauHinh`(chỉ khi public).
- `isAdmitted`: PHẢI có row còn trong lease `NHIP_HIEU_LUC` trong `phong_thanh_vien` (hoặc là staff). Phòng **public KHÔNG tự động admit** — client vẫn phải gọi `vao` trước khi chạm Chat/Watch/Collab/Queue/Focus.
- `GET /api/phong?id=` khi chưa admitted và không phải staff → trả `{ok, phong(sanitized), thanhVien:[], isAdmitted:false, canControl:false, isStaff:false, vaiTroPhong:'member', laChuPhong:false}` — **không** có `myCaps`, `policies`, `grants`, `khoa` thành viên.
- Mọi API con trả `403 {ok:false, code:'admission_required'}` khi chưa admitted; `403 code:'room_banned'` khi bị ban; `409 {ok:false, code:'room_full'}` khi hết chỗ.
- Chỉ **sảnh chat hệ thống** miễn membership — điều kiện đầy đủ: `chu_phong_khoa='he-thong' AND loai='chat' AND pham_vi='truong'`. Phòng video/nhạc do `he-thong` sở hữu **KHÔNG** được miễn — vẫn qua `vao` + capacity như phòng thường.

## Membership lease (authoritative)

- **`NHIP_HIEU_LUC = '-15 minutes'`** — cửa sổ DUY NHẤT dùng cho mọi quyết định membership: capacity reservation (`soNguoi`/đếm chỗ), `isAdmitted`, danh sách thành viên, vai trò `co_host`, và bypass password khi rejoin.
- **`NHIP_HOAT_DONG = '-90 seconds'`** — CHỈ là presence (chấm "đang online" / campus metrics). KHÔNG được dùng cho admission hay capacity.
- Row hết lease (`hoat_dong_luc` quá 15 phút): không giữ chỗ, không còn admitted, không bypass password. Rejoin phải qua `vao` với capacity check, và `vai_tro_phong` cũ bị reset về `'member'`.
- `ghiNhanVao` atomic: row còn lease → `UPDATE` refresh không chiếm thêm slot; row hết lease / chưa có → `INSERT ... SELECT` kèm `COUNT(member trong lease) < suc_chua`.
- Trade-off đã chấp nhận: tab chết đột ngột giữ chỗ tối đa 15 phút (heartbeat 20s bị throttle nền nên không thể dùng cửa sổ 90s cho admission). Đo thực tế ở multi-user gate trước khi quyết định rút xuống 3–5 phút.

## Thẩm quyền Teacher / GVCN / School Admin

Nguồn quyền chuẩn: `layPhamViQuanTri` (`_lib/quan-tri.js`) — KHÔNG suy ra từ `role==='teacher'`.

- **School Admin** (`la_admin_truong`/`vai_tro='admin'` trên `tai_khoan_campus`, phiên mang `role:'admin'`): staff mọi phòng, list thấy mọi phòng.
- **GVCN**: staff trong phòng `pham_vi='lop'` thuộc lớp được gán (`giao_vien_lop`/`lop_id`) + phòng `pham_vi='truong'`. GVCN lớp khác → 403, không phải staff.
- Tạo phòng `phamVi='lop'`: student dùng `phien.lopId`; GVCN/Admin chọn `lopId` nhưng phải nằm trong phạm vi (`xacDinhLopIdApDung`); `lop_id=NULL` bị chặn (403). Seed governance lỗi → phòng bị rollback (trang_thai='dong').

## Fail-closed policy

- `taiChinhSach(phongId)`: D1 read lỗi → `{ fail: true }` (KHÔNG trả `null`, không fallback default).
- `taiToanBoChinhSach(phongId)`: D1 read lỗi → `null`.
- `kiemTraQuyenPhong` khi policy read lỗi → `{ loi: 'policy_unavailable', status: 503 }` → endpoint trả `503 {code:'policy_unavailable'}`. Không có row policy = default hợp lệ (capability mặc định).

## Queue — rào chắn đúng (atomic batch)

- `play_now {id}`: `db.batch` gồm (a) UPDATE phong.cau_hinh + sync-state với guard `EXISTS(item queued thuộc phòng)`, (b) un-playing toàn bộ queue, (c) mark item `playing` có guard. Nếu guard fail → toàn batch rollback, trả 404. Không còn nửa-transition; không nuốt lỗi sync.
- `skip`: cùng pattern — un-playing + đổi video sang mục kế (hoặc clear) trong 1 batch.
- `enqueue`: cap 30 bằng UPDATE-có-điều-kiện (INSERT ... SELECT WHERE COUNT<30 pattern ở D1: dùng `INSERT INTO ... SELECT ... WHERE (SELECT COUNT)<30`), race không vượt cap.
- `reorder {ids}`: phải là **hoán vị đầy đủ** của tập id đang `queued` — trùng/thiếu/lạ → 400. Không cho partial reorder.

## Bảng mới

`phong_policy` (phong_id, capability, enabled, access_mode) · `phong_grant` (phong_id, khoa, capability, trang_thai: granted|requested) · `phong_ban` · `phong_video_queue` · `phong_note` · `phong_wb_op` · `phong_sheet_cell` · `phong_voice_pair`

`phong_thanh_vien` thêm cột `vai_tro_phong` ('member'|'co_host'). `phong_tin_nhan` thêm `video_time_sec`, `da_xoa`.

## GET /api/phong?id=

Response bổ sung: `isStaff`, `vaiTroPhong` ('host'|'co_host'|'teacher'|'member'), `myCaps` `{cap: true|false}`, `policies` + `grants` (chỉ staff), `thanhVien[].vaiTroPhong`, `khoa` (chỉ staff).

## POST /api/phong — actions governance

`{hanhDong, phongId, ...}`:

| hanhDong | Payload | Quyền |
|---|---|---|
| `set_co_host` | `{khoaTV, on}` | host/teacher (co-host KHÔNG được) |
| `kick` | `{khoaTV}` | staff; co-host không kick được co-host |
| `bo_chan` | `{khoaTV}` | staff |
| `policy` | `{capability, enabled, accessMode}` | staff |
| `grant` | `{khoaTV, capability, on}` | staff |
| `doi_mat_khau` | `{matKhauMoi}` | host/teacher |
| `bo_mat_khau` | `{}` | host/teacher |

## POST /api/phong-watch

`{phongId, action, ...}` — `play|pause|seek|set_rate` cần cap `video_control`; `set_video {videoUrl, queueId?}` cần cap `video_change` (không OCC, trả `{ok, videoUrl}`).

GET trả thêm `caps` = myCaps.

## /api/phong-queue

GET `?phongId&action=list` → `{ok, queue:[{id,videoUrl,videoId,title,thumb,addedBy,ord,trangThai}], caps:{queue,video_change}}`

POST `{phongId, action, ...}`:
- `enqueue|add_next {videoUrl, title?, thumb?}` — cap `queue`, tối đa 30 mục
- `remove {id}` — người thêm hoặc staff
- `reorder {ids:[...]}` — cap `queue`
- `play_now {id}`, `skip {}` — cap `video_change`
- `send_to_chat {id}` — cap `queue` + `chat`

## /api/phong-chat

POST `{phongId, noiDung, videoTimeSec?}` — cap `chat`. GET trả `videoTimeSec`, `daXoa`. Moderation xoá qua staff (da_xoa=1).

## /api/phong-collab — chỉ loai='video'

GET `?phongId&resource=notes|whiteboard|sheet[&sauId=]` → `{ok, payload, version, canWrite}`; `code:'capability_off'` khi bị tắt.
- notes → `payload.notes[{id,ten,noiDung,videoTimeSec,taoLuc,cuaToi}]`
- whiteboard → `payload.ops[{id,type:'stroke'|'clear',stroke?}]` (incremental theo `sauId`)
- sheet → `payload.cells{ "A1": "..." }`

POST:
- `{resource:'notes', payload:{text, videoTimeSec?}}` → `{ok,id}`; `{resource:'notes', action:'xoa_note', id}`
- `{resource:'whiteboard', payload:{type:'stroke',stroke:{tool,color,width,points}}}` → `{ok,id}`; `clear` chỉ staff
- `{resource:'sheet', payload:{cell,value}}` — cell `A1..H10`, value rỗng = xoá ô

### Voice (pair-bound)

- POST `voice_join` → `{ok, slot:'a'|'b'}` · lỗi: `grant_required` (chưa được cấp), `voice_room_full` (đã đủ 1 cặp)
- POST `voice_request` → `{ok, granted:true}` (mode everyone) hoặc `{ok, requested:true}`
- POST `voice_signal {signalType:'offer'|'answer'|'candidate'|'leave', payload}` — chỉ 2 người trong cặp
- POST `voice_end` — staff ngắt cặp
- GET `action=voice_poll&sauId=` → `{ok, pair:{active,aTen,bTen,youIn,slot}, signals:[{id,signalType,payload}], yeuCauVoice:[{khoa,ten}]}` — signals CHỈ từ partner; yeuCauVoice chỉ staff

## Phản hồi & vai trò

- `laChuPhong` = đúng chủ phòng (`isHost`). `canControl` = quyền điều khiển (host + teacher trong phạm vi). Teacher/Admin **không** nhận `laChuPhong:true`.
- `vaiTroPhong`: 'host' | 'teacher' | 'co_host' | 'member'.
- `minhKhoa` (khoá actor của chính mình) và `thanhVien[].khoa` (khoá thành viên khác — chỉ staff) là định danh nội bộ; member thường không thấy `khoa` của người khác.
- `unban`: chấp nhận alias `bo_chan` và `bo_cam`.

## Capacity & Voice

- `suc_chua`: default 8, hard max 12 (v1). Join quá cap → `409 {ok:false, code:'room_full'}`; member row còn lease `NHIP_HIEU_LUC` là điều kiện admitted → không bypass được qua API con.
- Voice: 1:1 WebRTC P2P, request/approval theo cap `voice` (`everyone` = ai cũng được xin, không phải group call). Signal pair-bound; ICE queue phía client.

## Error codes (chuẩn)

`admission_required` (403) · `room_banned` (403) · `room_full` (409) · `capability_off` (403) · `grant_required` (403) · `voice_room_full` (409) · `policy_unavailable` (503) · `room_closed`/`room_not_found` (404).

## Đóng băng

- Backend Gate QA: **188 PASS / 0 FAIL** (`cong-cu/qa-study-room-audit.mjs`, nhóm A–J adversarial + K1–K6 lease/password/room_full/system-exemption).
- SHA commit backend: `6872653d80eef4f7ee280fb6b4864301585b6df7`.
