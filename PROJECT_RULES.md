# SYSTEM CONTEXT & CONSTRAINTS: LỚP 10A7 DIGITAL CAMPUS

## 1. TECH STACK INVARIANTS
- Deployment: Cloudflare Pages + Pages Functions (`functions/`).
- Database: Cloudflare D1 (SQLite serverless) via `env.DB`.
- Frontend: Hybrid SPA with Vanilla HTML5/CSS3 + React 18 & Babel Standalone via CDN.
- CRITICAL: STRICTLY FORBIDDEN to introduce Webpack, Vite, Next.js, or complex bundlers. Do not install Node packages for the client runtime.

## 2. CODEBASE CONTRACTS & NON-NEGOTIABLES
- ZERO MOCK DATA: Never write inline mock arrays or mock objects. Always fetch from `/api/*` endpoints.
- DOM PRESERVATION: Never remove or alter critical DOM IDs: `#khuDiemDanh`, `#ddTabLoai`, `#ddLopKhoi`, `#ddCaNhan`, `#thu-quy`, `#tqTongQuan`, `#tqKhoan`.
- NAVIGATION: Maintain two-way sync between URL hash (`#/diem-danh`, `#/thu-quy`, etc.) and React state `activeTab`.
- UI/UX: Dark SaaS aesthetic (Background: `#090d16`, Surface: `#0f172a`, Hairline 1px border `white/10`). Mobile touch target >= 44px.
- OUTPUT INTEGRITY: Output production-ready, 100% complete code. No placeholders, no `// TODO`, no omitted implementation.

## 3. VERIFICATION & AUTO-DEPLOY PIPELINE
Before finalizing any changes, ensure:
1. `node cong-cu/kiem-tra-du-lieu.js` (or `npm run kiem-tra-du-lieu`) passes with 0 syntax/security issues.
2. `node build.js` (or `npm run build`) builds cleanly into `dist/`.
3. AUTOMATIC COMMIT, PUSH & DEPLOY: Once verification passes, always execute the full pipeline automatically: commit → `git push origin main` → remote D1 migration (if SQL changed) → `npm run deploy` to Cloudflare Pages. Never leave shipping unfinished.
