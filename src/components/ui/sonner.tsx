import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { useTheme } from '@/app/theme'
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolved } = useTheme()
  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      closeButton
      icons={{
        success: (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <CircleCheckIcon className="size-4.5" />
          </div>
        ),
        info: (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
            <InfoIcon className="size-4.5" />
          </div>
        ),
        warning: (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
            <TriangleAlertIcon className="size-4.5" />
          </div>
        ),
        error: (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
            <OctagonXIcon className="size-4.5" />
          </div>
        ),
        loading: (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
            <Loader2Icon className="size-4.5 animate-spin" />
          </div>
        ),
      }}
      style={
        {
          "--width": "420px",
          "--normal-bg": "var(--surface-raised)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-default)",
          "--border-radius": "1rem",
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-top": "0",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !items-center !justify-center !text-center !gap-3",
          title: "!text-center !font-semibold",
          description: "!text-center",
          closeButton: "!absolute !top-2 !right-2 !left-auto !translate-y-0 !translate-x-0 !size-6 !rounded-lg !border-border-default !bg-surface-overlay !text-text-secondary hover:!bg-surface-interactive hover:!text-text-primary transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
