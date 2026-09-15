// Secret không nằm trong wrangler.jsonc: khai báo tay để type không phụ thuộc file .dev.vars (CI không có file này).
interface Env {
  SESSION_SECRET: string
  TEACHER_CODE?: string
  CLASS_CODE?: string
  TURNSTILE_SECRET_KEY?: string
}

declare namespace Cloudflare {
  interface Env {
    SESSION_SECRET: string
    TEACHER_CODE?: string
    CLASS_CODE?: string
    TURNSTILE_SECRET_KEY?: string
  }
}
