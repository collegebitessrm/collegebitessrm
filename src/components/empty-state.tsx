import type { ReactNode } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Three real menu photos fanned out like plates on a table — the "nothing
// here yet, but this is what's waiting" art for the empty cart and the
// empty orders list. Fixed picks (one biryani, one Chinese, one juice) so
// it reads as the whole campus menu rather than one restaurant.
const PLATES = [
  "/MuteBites/MuteBites Chinese/Chicken noodles.jpg",
  "/MuteBites/A1 biryani/A1 Mixed Biryani-v2.jpg",
  "/MuteBites/Bismillah fruit juice/Pomegranate juice.jpg",
];

/**
 * Shared empty state. `art="plates"` for the big "you haven't started yet"
 * moments; pass an `icon` instead for small, in-place ones like a search
 * with no results, where a photo spread would be too loud.
 */
export function EmptyState({
  art,
  icon: Icon,
  title,
  children,
  action,
  compact = false,
}: {
  art?: "plates";
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "py-12" : "pt-12 pb-6")}>
      {art === "plates" && (
        <div className="relative h-28 w-56" aria-hidden="true">
          {PLATES.map((src, i) => (
            <span
              key={src}
              className={cn(
                "absolute top-1/2 size-24 -translate-y-1/2 overflow-hidden rounded-3xl border-4 border-background bg-secondary shadow-raised",
                i === 0 && "left-0 -rotate-10",
                i === 1 && "left-1/2 z-10 size-28 -translate-x-1/2",
                i === 2 && "right-0 rotate-10",
              )}
            >
              <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            </span>
          ))}
        </div>
      )}
      {Icon && (
        <span
          className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground"
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </span>
      )}
      <p className={cn("font-heading font-bold", compact ? "mt-4 text-lg" : "mt-6 text-title")}>{title}</p>
      {children && <p className="mt-1.5 max-w-[20rem] text-muted-foreground">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
