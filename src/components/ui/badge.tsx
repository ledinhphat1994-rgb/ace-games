import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  [
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1",
    "overflow-hidden rounded-full border border-transparent",
    "px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
    "transition-colors duration-150",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Cyan — default brand / primary label */
        default:
          "bg-primary/15 text-primary border-primary/20 [a]:hover:bg-primary/25",
        /** Slate surface — secondary / neutral */
        secondary:
          "bg-surface-overlay text-text-secondary border-border-default [a]:hover:bg-surface-interactive",
        /** Destructive — danger / error */
        destructive:
          "bg-destructive/12 text-destructive border-destructive/20 [a]:hover:bg-destructive/20 dark:bg-destructive/20",
        /** Outline only — minimal */
        outline:
          "border-border-default text-foreground [a]:hover:bg-surface-overlay",
        /** No border — ghost chip */
        ghost:
          "text-text-secondary hover:bg-surface-overlay hover:text-foreground dark:hover:bg-surface-overlay/60",
        /** Emerald — success / online / game active */
        success:
          "bg-success/15 text-success border-success/20 [a]:hover:bg-success/25",
        /** Amber — streak / warning / achievement */
        warning:
          "bg-warning/15 text-warning border-warning/20 [a]:hover:bg-warning/25",
        /** Violet — social / community */
        social:
          "bg-social/15 text-social border-social/20 [a]:hover:bg-social/25",
        /** Gold — badge / top-ranked */
        achievement:
          "bg-achievement/15 text-achievement border-achievement/20 [a]:hover:bg-achievement/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
