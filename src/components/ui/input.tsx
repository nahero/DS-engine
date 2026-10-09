import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-control w-full min-w-0 rounded-control border border-input bg-surface px-2.5 py-1 text-label shadow-raised transition-[color,border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-label file:font-medium file:text-fg placeholder:text-fg-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-border-hover focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-status-danger-border",
        className
      )}
      {...props}
    />
  )
}

export { Input }
