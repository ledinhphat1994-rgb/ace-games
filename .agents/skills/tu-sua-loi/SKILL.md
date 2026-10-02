---
name: tu-sua-loi
description: |
  Vòng lặp tự chẩn đoán và tự sửa lỗi cho Digital Campus. Agent đọc log lỗi từ terminal,
  xác định root cause, sửa code, chạy test lại — lặp cho đến khi xanh.
  Dùng khi gặp build error, test fail, runtime crash, hoặc TypeScript type error.
---

# Skill: Tự sửa lỗi (Self-Correction Loop)

## Quy trình chẩn đoán chuẩn

### Bước 1: Thu thập bằng chứng thực tế (Evidence-First)

```powershell
# Lấy toàn bộ output lỗi
npm run typecheck 2>&1 | Select-Object -First 100
npm run lint 2>&1 | Select-String "error|Error" | Select-Object -First 50
npm test 2>&1 | Select-Object -Last 50
```

**KHÔNG đoán mò. KHÔNG giải thích lý thuyết. Đọc output thực tế trước.**

### Bước 2: Phân loại lỗi

| Loại | Dấu hiệu | Nơi sửa |
|------|----------|---------|
| TypeScript type error | `TS2xxx`, `tsc -b` fail | File .ts/.tsx có lỗi |
| Import không tìm thấy | `Cannot find module` | Kiểm tra path, tsconfig alias |
| Runtime WebSocket | WS code 4xxx, disconnect loop | use-room.ts, campus-do.ts |
| Test fail | `AssertionError`, `FAIL` | Test file + implementation |
| Build bundle fail | `vite build` error | Circular dep, missing export |
| D1 query fail | `D1_ERROR`, `no such table` | Migration chưa apply hoặc sai SQL |

### Bước 3: Trace root cause

```powershell
# Tìm file gây lỗi
grep -rn "ErrorText" src/ --include="*.ts" --include="*.tsx"

# Kiểm tra exports
grep -n "export" src/features/hub/LeaderboardPage.tsx

# Xem git diff để biết thứ gì mới thay đổi gây lỗi
git diff HEAD~1 --stat
git diff HEAD~1 -- src/features/hub/LeaderboardPage.tsx
```

### Bước 4: Sửa — chạy test — lặp

```
Sửa file X
→ npx tsc --noEmit 2>&1 | Select-Object -First 20   # Quick typecheck
→ npx vitest run test/relevant.test.ts               # Test liên quan
→ Nếu fail: đọc output, quay lại bước sửa
→ Khi pass: chạy full check 1 lần duy nhất
```

**Tuyệt đối không chạy full test sau mỗi edit nhỏ — chỉ chạy test liên quan trực tiếp.**

### Bước 5: Final gate (1 lần duy nhất khi hoàn thành)

```powershell
npm run typecheck  # 0 errors
npm run lint       # 0 errors
npm test           # 100% green
npm run build:bundle
git diff --check   # 0 whitespace errors
```

---

## Các lỗi phổ biến và cách sửa nhanh

### TypeScript: Property does not exist

```typescript
// ❌ Lỗi: Property 'foo' does not exist on type 'Bar'
// Nguyên nhân: Type chưa include field mới
// Sửa: Thêm vào interface/type
interface Bar {
  foo?: string  // ← thêm vào
}
```

### Import alias không hoạt động

```typescript
// ❌ Cannot find module '@/hooks/use-drag-scroll'
// Kiểm tra tsconfig.json: paths phải có "@/*"
// Kiểm tra vite.config.ts: resolve.alias phải có '@'
```

### React set-state-in-effect

```typescript
// Pattern an toàn: dùng useMemo thay vì useEffect + setState
// ❌ Tránh:
useEffect(() => { setDerivedValue(compute(input)) }, [input])

// ✅ Dùng:
const derivedValue = useMemo(() => compute(input), [input])
```

### WebSocket không reconnect

```typescript
// Kiểm tra: URL có đúng không?
// Kiểm tra: Auth cookie có được gửi không?
// Kiểm tra: DO có đang chạy không? (wrangler dev log)
// Kiểm tra: Rate limit có bị hit không? (KV RATE_LIMIT)
```

### D1 table not found

```powershell
# Kiểm tra migration đã apply chưa
npx wrangler d1 migrations list lop-10a7-db

# Apply migration còn thiếu
npx wrangler d1 migrations apply lop-10a7-db --remote
```

### Vite build: circular dependency

```powershell
# Tìm circular imports
npx vite build 2>&1 | Select-String "circular"
# Sửa: tách interface/type ra file riêng, tránh import ngược chiều
```

---

## Công thức báo cáo khi hoàn thành

```
DONE

LOCAL CHECK: PASS
TESTS: X/X
STAGING: NONE
PR: #xx (nếu có)
PRODUCTION: UNTOUCHED
```

Khi bị chặn:
```
BLOCKED
CAUSE: <1 câu mô tả nguyên nhân cụ thể>
NEED: <thứ cần quyết định hoặc thông tin thiếu>
```
