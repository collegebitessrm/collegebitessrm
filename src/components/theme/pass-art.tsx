import { cn } from "@/lib/utils";

/**
 * Campus pass decoration — removed in Zomato redesign. Kept as a no-op
 * component to avoid breaking imports.
 */
export function PassArt({ className }: { className?: string }) {
 return <span aria-hidden="true" className={cn("pointer-events-none absolute size-12", className)} />;
}