// Secret không nằm trong wrangler.jsonc: khai báo tay để type không phụ thuộc file .dev.vars (CI không có file này).
declare namespace Cloudflare {
  interface Env {
    SESSION_SECRET: string
  }
}
