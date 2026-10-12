import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A small tinted square behind a row's icon — the profile's details and
 * settings rows, the cart's handover and contact rows. Pair it with a
 * duotone icon (optionally text-primary / text-primary).
 */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
 return (
 <span
 className={cn(
 "flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground",
 className,
 )}
 >
 {children}
 </span>
 );
}
