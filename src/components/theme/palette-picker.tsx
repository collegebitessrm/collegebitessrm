"use client";

import { Check } from "@/components/icons";
import { PALETTES } from "@/lib/theme/palettes";
import { setPalette, usePalette } from "@/lib/theme/store";
import { cn } from "@/lib/utils";

/**
 * The four palettes as preview cards (Profile → Theme, and the first-login
 * form). Each card's inner tile carries its own data-palette, so it's drawn
 * with that palette's real tokens — ground, sunset hero, action pill,
 * selected chip, text — in the current light/dark mode, not a copy of its
 * hex values. The selection ring and tick sit outside it, in the page's
 * palette. Choosing one switches the whole app at once (a cross-fade).
 */
export function PalettePicker({ className }: { className?: string }) {
  const active = usePalette();

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("grid grid-cols-2 gap-3", className)}>
      {PALETTES.map(({ id, name, blurb }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPalette(id)}
            className={cn(
              "relative rounded-[1.4rem] p-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
              selected ? "bg-chip-active glow-cyan" : "bg-transparent",
            )}
          >
            <span
              data-palette={id}
              className="flex h-full flex-col rounded-[1.1rem] border bg-background p-2.5 text-foreground shadow-card"
            >
              <span aria-hidden="true" className="surface-hero block h-11 rounded-xl bg-hero" />
              <span aria-hidden="true" className="mt-2 flex items-center gap-1.5">
                <span className="surface-primary h-5 flex-1 rounded-full bg-primary" />
                <span className="size-5 shrink-0 rounded-full bg-chip-active" />
                <span className="size-5 shrink-0 rounded-full border bg-card" />
              </span>
              <span className="mt-2.5 block text-sm leading-tight font-semibold">{name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{blurb}</span>
            </span>
            {selected && (
              <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-chip-active text-chip-active-foreground shadow-card ring-2 ring-background">
                <Check className="size-3.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
