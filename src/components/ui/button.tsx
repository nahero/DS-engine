import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

import { Spinner } from "@/components/ui/spinner"

// Matches the Obra kit's "Button - Nova". Default size follows density: comfortable = kit Large (36px),
// compact = kit Default (32px). See docs/design-system/components.md for the Figma → code mapping.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control text-label font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-status-danger-border [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-action-primary-hover",
        destructive:
          "bg-action-danger-soft text-action-danger-soft-fg hover:bg-action-danger-soft-hover",
        outline:
          "border border-border bg-surface text-fg hover:bg-subtle dark:bg-transparent dark:hover:bg-subtle",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-action-secondary-hover",
        ghost: "text-fg hover:bg-subtle",
        link: "text-fg underline-offset-4 hover:underline",
      },
      size: {
        default: "h-control px-2.5",
        sm: "h-7 px-2.5",
        xs: "h-5.5 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        icon: "size-control",
        "icon-sm": "size-7",
        "icon-xs": "size-5.5 [&_svg:not([class*='size-'])]:size-3",
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
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner before the label and disables the button. Ignored with asChild. */
    loading?: boolean
  }) {
  const shared = {
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    className: cn(buttonVariants({ variant, size, className })),
  }

  // Slot needs exactly one child element, so asChild passes children through untouched.
  if (asChild) {
    return (
      <Slot.Root {...shared} {...props}>
        {children}
      </Slot.Root>
    )
  }

  return (
    <button {...shared} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export { Button, buttonVariants }
