import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Size: 40px height, consistent with button default
        "h-10 w-full min-w-0 px-3 py-2",
        // Shape & surface
        "rounded-lg border border-input bg-transparent",
        "dark:bg-surface/50 dark:border-border-default",
        // Typography
        "text-sm text-foreground placeholder:text-text-tertiary",
        // File input
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Transitions
        "transition-colors duration-150 outline-none",
        // Focus
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        "dark:focus-visible:border-brand dark:focus-visible:ring-brand/20",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "dark:disabled:bg-surface/30",
        // Validation
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
