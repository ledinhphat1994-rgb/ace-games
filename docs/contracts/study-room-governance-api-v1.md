# Study Room Governance API v1 — Contract (SWE 2 → Claude)

- **Status:** `draft` — backend đang triển khai, chưa accept
- **Backend commit:** _chưa có (đang code)_
- **Migration:** `co-so-du-lieu/77-study-room-governance.sql`

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
