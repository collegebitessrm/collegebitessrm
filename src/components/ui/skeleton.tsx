import type { ComponentProps } from "react"
import { cn } from "cn"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-shimmer rounded-md bg-secondary", className)}
      {...props}
    />
  )
}

export { Skeleton }
