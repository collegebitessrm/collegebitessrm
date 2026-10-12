import { cn } from "@/lib/utils";

/**
 * Decorative motif — removed in Zomato redesign. Kept as a no-op component
 * to avoid breaking imports.
 */
export function ThemeMotif({ className }: { className?: string }) {
 return <span aria-hidden="true" className={cn("pointer-events-none absolute", className)} />;
}