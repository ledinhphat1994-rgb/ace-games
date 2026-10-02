import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { useTheme } from '@/app/theme'

const Toaster = ({ position = "top-center", ...props }: ToasterProps) => {
  const { resolved } = useTheme()
  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      position={position}
      closeButton
      duration={2500}
      icons={{
        success: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
            <CheckIcon className="size-3.5 stroke-[2.5]" />
          </div>
        ),
        info: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            <InfoIcon className="size-3.5 stroke-[2.5]" />
          </div>
        ),
        warning: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
            <TriangleAlertIcon className="size-3.5 stroke-[2.5]" />
          </div>
        ),
        error: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.25)]">
            <OctagonXIcon className="size-3.5 stroke-[2.5]" />
          </div>
        ),
        loading: (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            <Loader2Icon className="size-3.5 animate-spin" />
          </div>
        ),
      }}
      style={
        {
          "--width": "fit-content",
          "--normal-bg": "var(--surface-raised)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-strong)",
          "--border-radius": "9999px",
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0.625rem",
          "--toast-close-button-top": "50%",
          "--toast-close-button-transform": "translateY(-50%)",
        } as CSSProperties
      }
      toastOptions={{
        duration: 2500,
        classNames: {
          toast: "cn-toast !flex !items-center !gap-2.5 !py-2 !pl-2.5 !pr-10 !rounded-full !w-fit !max-w-[min(92vw,420px)] !min-w-0 !shadow-lg",
          title: "!text-left !font-semibold !text-[0.875rem] !text-text-primary !leading-snug !whitespace-nowrap",
          description: "!text-left !text-xs !text-text-secondary !leading-normal",
          closeButton: "!absolute !top-1/2 !right-2.5 !left-auto !size-5.5 !rounded-full !border !border-border-default !bg-surface-overlay hover:!bg-surface-interactive !text-text-tertiary hover:!text-text-primary flex items-center justify-center transition-all cursor-pointer",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
