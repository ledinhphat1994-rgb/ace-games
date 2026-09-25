import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"

/** Ô mật khẩu có nút hiện/ẩn — dùng chung cho đăng nhập, đăng ký, khôi phục và đổi mật khẩu. */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [hien, setHien] = React.useState(false)
  return (
    <div className="relative">
      <Input type={hien ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setHien((v) => !v)}
        aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={hien}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary"
      >
        {hien ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export { PasswordInput }
