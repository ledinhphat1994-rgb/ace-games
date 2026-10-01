import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-semibold whitespace-nowrap transition-all duration-150",
    "outline-none select-none",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "active:not-aria-[haspopup]:scale-[0.97] active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Solid brand — primary CTA. Foreground flips with the theme. */
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_10px_22px_-16px_var(--brand)] hover:bg-brand-hover active:bg-brand-hover",
        /** Transparent with border — secondary action */
        outline:
          "border-border-default bg-transparent text-foreground hover:bg-surface-overlay hover:border-border-strong aria-expanded:bg-surface-overlay dark:border-border-default dark:hover:bg-surface-interactive",
        /** Surface-tinted — tertiary action */
        secondary:
          "bg-surface-overlay text-foreground hover:bg-surface-interactive aria-expanded:bg-surface-interactive",
        /** No background — navigation/icon actions */
        ghost:
          "text-text-secondary hover:bg-surface-overlay hover:text-foreground aria-expanded:bg-surface-overlay dark:hover:bg-surface-overlay/60",
        /** Destructive — danger actions */
        destructive:
          "bg-destructive/12 text-destructive border-destructive/20 hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        /** Inline text link */
        link: "text-brand underline-offset-4 hover:underline hover:text-brand-hover p-0 h-auto!",
      },
      size: {
        /** 40px — standard control */
        default:
          "h-10 pointer-coarse:min-h-11 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        /** 32px — compact / dense UI */
        sm:
          "h-8 pointer-coarse:min-h-11 px-3 text-[0.8125rem] rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        /** 28px — very tight context */
        xs:
          "h-7 px-2.5 text-xs rounded-[min(var(--radius-sm),10px)] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        /** 44px — prominent CTA, large desktop hero / mobile primary */
        lg:
          "h-11 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        /** 40px square icon */
        icon: "size-10 pointer-coarse:size-11",
        /** 32px square icon */
        "icon-sm": "size-8 pointer-coarse:size-11 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        /** 28px square icon */
        "icon-xs": "size-7 rounded-[min(var(--radius-sm),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        /** 44px square icon — minimum touch target */
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
