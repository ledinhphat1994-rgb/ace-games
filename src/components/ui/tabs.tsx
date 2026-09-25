import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  [
    "group/tabs-list items-center text-muted-foreground",
    "group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
    "data-[variant=line]:rounded-none data-[variant=pills]:rounded-none",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Thẻ bo tròn tách rời, chia đều hết chiều ngang (quy tắc chung: không dùng thanh gộp liền) */
        default:
          "day-loc-deu w-full [--the-nho-nhat:6.5rem]",
        /** Underline — for page-level nav tabs */
        line:
          "inline-flex w-fit gap-1 bg-transparent border-b border-border-subtle group-data-horizontal/tabs:h-9",
        /** Pill chip — for filter chips */
        pills:
          "inline-flex w-fit flex-wrap gap-1.5 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base layout
        "relative inline-flex items-center justify-center gap-1.5",
        "whitespace-nowrap text-sm font-medium",
        "transition-all duration-150 outline-none select-none",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",

        // Focus
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",

        // Disabled
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-disabled:pointer-events-none aria-disabled:opacity-40",

        // Icon handling
        "has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // ── DEFAULT variant (thẻ tách rời, chia đều) ──
        "group-data-[variant=default]/tabs-list:h-9",
        "group-data-[variant=default]/tabs-list:min-w-0",
        "group-data-[variant=default]/tabs-list:rounded-xl",
        "group-data-[variant=default]/tabs-list:px-3",
        "group-data-[variant=default]/tabs-list:border group-data-[variant=default]/tabs-list:border-border-default",
        // inactive
        "group-data-[variant=default]/tabs-list:text-text-secondary",
        "group-data-[variant=default]/tabs-list:not-data-active:hover:bg-surface-overlay",
        "group-data-[variant=default]/tabs-list:not-data-active:hover:text-text-primary",
        // active
        "group-data-[variant=default]/tabs-list:data-active:border-brand/50",
        "group-data-[variant=default]/tabs-list:data-active:bg-brand/10",
        "group-data-[variant=default]/tabs-list:data-active:text-brand",
        "group-data-[variant=default]/tabs-list:data-active:font-semibold",

        // ── LINE variant (underline nav) ──
        "group-data-[variant=line]/tabs-list:h-9",
        "group-data-[variant=line]/tabs-list:px-1.5 group-data-[variant=line]/tabs-list:pb-px",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0",
        // inactive
        "group-data-[variant=line]/tabs-list:text-text-tertiary",
        "group-data-[variant=line]/tabs-list:hover:text-text-secondary",
        // active underline indicator
        "group-data-[variant=line]/tabs-list:after:absolute",
        "group-data-[variant=line]/tabs-list:after:bottom-0 group-data-[variant=line]/tabs-list:after:inset-x-0",
        "group-data-[variant=line]/tabs-list:after:h-[2px] group-data-[variant=line]/tabs-list:after:rounded-full",
        "group-data-[variant=line]/tabs-list:after:bg-brand",
        "group-data-[variant=line]/tabs-list:after:opacity-0",
        "group-data-[variant=line]/tabs-list:after:transition-opacity",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:data-active:font-semibold",

        // ── PILLS variant (filter chips) ──
        "group-data-[variant=pills]/tabs-list:h-8",
        "group-data-[variant=pills]/tabs-list:px-3",
        "group-data-[variant=pills]/tabs-list:rounded-full",
        "group-data-[variant=pills]/tabs-list:border group-data-[variant=pills]/tabs-list:border-border-default",
        // inactive
        "group-data-[variant=pills]/tabs-list:text-text-secondary",
        "group-data-[variant=pills]/tabs-list:hover:bg-surface-overlay",
        "group-data-[variant=pills]/tabs-list:hover:text-foreground",
        // active
        "group-data-[variant=pills]/tabs-list:data-active:bg-primary",
        "group-data-[variant=pills]/tabs-list:data-active:text-primary-foreground",
        "group-data-[variant=pills]/tabs-list:data-active:border-primary/30",
        "group-data-[variant=pills]/tabs-list:data-active:font-semibold",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
