import type { ReactNode } from "react";
import { MapPin, Moped } from "@/components/icons";
import { ThemeMotif } from "@/components/theme/theme-motif";

/**
 * The art for the 404 and error pages: a small hero card where the
 * delivery scooter from the order road has taken a wrong turn — stopped,
 * facing back the way it came, with a "?" over it, and Gate 3 somewhere
 * off the end of the road. A big label (#404, Oops) and a short note sit
 * above it. Decorative (aria-hidden); the page's h1 says what happened.
 */
export function WrongTurn({ label, token, note }: { label: string; token: string; note: ReactNode }) {
  return (
    <div
      className="surface-hero glow-sun relative w-full max-w-xs -rotate-2 overflow-hidden rounded-[2rem] bg-hero px-6 pt-5 pb-6 text-left text-hero-foreground"
      aria-hidden="true"
    >
      <ThemeMotif className="-top-12 -right-10 size-40" />
      <p className="relative text-sm font-medium">College Bites · Gate 3</p>
      <p className="relative mt-4 text-label text-hero-accent">{label}</p>
      <p className="relative mt-1 font-heading text-6xl leading-none font-bold tracking-tight">{token}</p>
      <p className="relative mt-3 text-sm">{note}</p>

      {/* The road, with the lost scooter on it. */}
      <div className="relative mt-5 h-12">
        <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-hero-foreground/15 bg-[repeating-linear-gradient(90deg,transparent_0_8px,color-mix(in_srgb,var(--hero-foreground)_22%,transparent)_8px_14px)]" />
        <span className="absolute top-1/2 left-[38%] flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-hero-foreground text-hero shadow-raised">
          {/* Facing back the way it came: flipped with `scale` (not the
              icon's own mirrored transform, which the bob would override). */}
          <span className="animate-scooter flex">
            <Moped className="size-6 -scale-x-100" weight="fill" />
          </span>
          <span className="animate-float absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-hero-foreground px-2 font-heading text-sm font-bold text-hero">
            ?
          </span>
        </span>
        <span className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-hero-foreground/15">
          <MapPin className="size-4.5" />
        </span>
      </div>
    </div>
  );
}
