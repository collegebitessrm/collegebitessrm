import type { ReactNode } from "react";
import Image from "next/image";
import type { AppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Three real menu photos fanned out like plates on a table — the "nothing
// here yet, but this is what's waiting" art for the empty cart and the
// empty orders list. Fixed picks (noodles, biryani, a starter) so it
// reads as the whole campus menu rather than one dish.
const PLATES = [
  "/photos/dishes/chicken-noodles.jpg",
  "/photos/dishes/mixed-chicken-biryani.jpg",
  "/photos/dishes/chilli-chicken.jpg",
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
  icon?: AppIcon;
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
                "animate-pop-in absolute top-1/2 size-24 -translate-y-1/2 overflow-hidden rounded-3xl border-4 border-background bg-secondary shadow-raised",
                i === 0 && "left-0 -rotate-10",
                i === 1 && "left-1/2 z-10 size-28 -translate-x-1/2",
                i === 2 && "right-0 rotate-10",
              )}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <Image src={src} alt="" fill sizes="112px" className="object-cover" />
            </span>
          ))}
        </div>
      )}
      {Icon && (
        <span
          className="animate-pop-in flex size-16 items-center justify-center rounded-[1.25rem] bg-pink-soft text-pink-soft-foreground shadow-card"
          aria-hidden="true"
        >
          <Icon className="icon-tint-gold size-7" />
        </span>
      )}
      <p className={cn("font-heading font-bold", compact ? "mt-4 text-lg" : "mt-6 text-title")}>{title}</p>
      {children && <p className="mt-1.5 max-w-[20rem] text-muted-foreground">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
