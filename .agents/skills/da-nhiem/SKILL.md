---
name: da-nhiem
description: |
  Hướng dẫn làm việc đa nhiệm với Digital Campus: chia task thành các nhánh song song,
  phân chia rõ phần frontend/backend/game/test, tránh xung đột file khi nhiều agent chạy cùng lúc.
  Dùng khi user muốn chạy 3-4 tác vụ đồng thời hoặc giao nhiều agent xử lý song song.
---

# Skill: Đa nhiệm (Multi-Tasking) — Digital Campus

## Nguyên tắc chia nhánh tác vụ an toàn

Khi nhận nhiều task, phân loại theo **vùng ảnh hưởng** để tránh xung đột:

| Nhánh | Files thuộc về | Có thể chạy song song với |
|-------|---------------|--------------------------|
| **Frontend/UI** | `src/features/`, `src/components/`, `src/index.css` | Backend, Tests |
| **Backend/Worker** | `worker/`, `shared/protocol/` | Frontend UI, Tests |
| **Game Logic** | `shared/games/`, `src/features/games/` | Backend (không chạm worker) |
| **Tests** | `test/` | Đọc source, không sửa |
| **Docs/Config** | `.agents/`, `docs/`, `*.jsonc` | Tất cả (không chạm src) |

## Quy trình đa nhiệm chuẩn

### 1. Phân rã task
Trước khi bắt đầu, tách task thành các phần độc lập:

```
Task gốc: "Thêm leaderboard + sửa UI game + fix auth bug"
→ Nhánh A: Frontend — UI leaderboard (src/features/hub/LeaderboardPage.tsx)
→ Nhánh B: Frontend — UI game lobby (src/features/games/)
→ Nhánh C: Backend — Auth fix (worker/api/auth.ts)
```

A và B có thể xung đột nếu cùng sửa shared components → xử lý tuần tự.
B và C hoàn toàn độc lập → chạy song song được.

### 2. Kiểm tra xung đột file trước
```powershell
# Xem file nào đang được sửa (uncommitted)
git status --short

# Nếu file A cần edit đang dirty → hoàn thành/stash task cũ trước
git stash -m "wip: frontend-ui"
```

### 3. Branch strategy cho đa nhiệm
```powershell
# Tạo branch riêng cho task song song (nếu task lớn)
git checkout -b feat/leaderboard-ui
# ... làm xong ...
git checkout main
git merge feat/leaderboard-ui --no-ff
```

### 4. Commit granular (atomic commits)
Mỗi tác vụ con = 1 commit riêng biệt. KHÔNG gộp nhiều loại thay đổi vào 1 commit.

```
✅ feat(ui): add smooth carousel to LeaderboardPage
✅ fix(auth): correct PBKDF2 iteration lookup
❌ feat(ui): multiple pages + auth fix + CSS cleanup
```

## Thứ tự ưu tiên khi task xung đột

1. **Security/Auth fixes** — luôn ưu tiên cao nhất
2. **Bug breaks production** — ưu tiên sau security
3. **UI/UX improvements** — có thể song song nếu file khác nhau
4. **Refactor/cleanup** — cuối cùng, sau khi feature stable

## Kiểm tra trước khi merge 2 nhánh song song

```powershell
# 1. Stash nhánh A
git stash -m "nhanh-a"

# 2. Merge nhánh B
git checkout main; git merge feat/branch-b

# 3. Pop nhánh A, resolve conflict nếu có
git stash pop

# 4. Chạy typecheck + test 1 lần duy nhất
npm run typecheck
npm test
```

## Lệnh hữu ích cho đa nhiệm

```powershell
# Xem diff tất cả staged changes
git diff --cached --stat

# Chạy test của 1 file duy nhất (nhánh riêng)
npx vitest run test/game-session.test.ts

# Build chỉ frontend (không typecheck)
npx vite build

# Lint chỉ file đang sửa
npx oxlint src/features/hub/LeaderboardPage.tsx
```

## Anti-patterns cần tránh

- ❌ Sửa `shared/protocol/*.ts` khi đang có nhánh WS feature khác open
- ❌ Chạy `npm run deploy` từ nhánh không phải main
- ❌ Commit `migrations/*.sql` mới khi có migration chưa apply trên production
- ❌ Sửa `worker/room-do.ts` và `shared/protocol/room.ts` trong 2 agent riêng biệt cùng lúc
