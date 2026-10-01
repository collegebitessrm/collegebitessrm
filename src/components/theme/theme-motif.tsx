import { cn } from "@/lib/utils";

/**
 * The palette's own decoration for hero cards (promo, campus pass, reward,
 * admin Today card, About, 404, celebration). All four are in the markup
 * and the nearest data-palette shows one (only-* utilities, --show-*), so
 * it's right before hydration and inside the picker's preview cards:
 *
 *   Vice Dusk (GTA VI)  the striped retro sun — the sunset is Vice's alone
 *   Electric Sunrise    a line-art sun rising, rays and twinkling sparkles
 *   Innovation Hub      orbit rings, a little network of nodes, chevrons
 *   Kaapi               a filter-coffee tumbler and davara, steam, beans
 *
 * Size and place it with `className` (it's `absolute`); decorative only.
 */
export function ThemeMotif({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <span className="only-vice promo-sun absolute inset-0 rounded-full" />
      <svg viewBox="0 0 100 100" className="only-sunrise absolute inset-0 size-full text-hero-accent/30">
        <SunriseArt />
      </svg>
      <svg viewBox="0 0 100 100" className="only-hub absolute inset-0 size-full text-white/45">
        <HubArt />
      </svg>
      <svg viewBox="0 0 100 100" className="only-kaapi absolute inset-0 size-full text-hero-foreground/20">
        <KaapiArt />
      </svg>
    </span>
  );
}

/** A sun rising: two arcs on the horizon, five rays, three sparkles. */
export function SunriseArt() {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M20 80a30 30 0 0 1 60 0" strokeWidth="5" />
      <path d="M33 80a17 17 0 0 1 34 0" strokeWidth="4" opacity="0.6" />
      <path d="M50 40V27M72 47l8-10M28 47l-8-10M83 64l12-4M17 64L5 60" strokeWidth="5" />
      <path d="M8 86h84" strokeWidth="4" />
      <g fill="currentColor" stroke="none">
        <path className="motif-twinkle" d="M85 12l2.4 6.6L94 21l-6.6 2.4L85 30l-2.4-6.6L76 21l6.6-2.4z" />
        <path className="motif-twinkle [animation-delay:-1.2s]" d="M14 18l1.6 4.4L20 24l-4.4 1.6L14 30l-1.6-4.4L8 24l4.4-1.6z" />
        <path className="motif-twinkle [animation-delay:-0.6s]" d="M64 8l1.2 3.3 3.3 1.2-3.3 1.2L64 17l-1.2-3.3-3.3-1.2 3.3-1.2z" />
      </g>
    </g>
  );
}

/** Two orbits, a triangle of linked nodes (one pulsing), a pair of chevrons. */
export function HubArt() {
  return (
    <g fill="none" stroke="currentColor">
      <circle cx="54" cy="46" r="38" strokeWidth="2.5" opacity="0.55" />
      <circle cx="54" cy="46" r="23" strokeWidth="3" opacity="0.85" />
      <path d="M54 23L77 56L31 62Z" strokeWidth="2.5" />
      <g fill="currentColor" stroke="none">
        <circle cx="54" cy="23" r="5" />
        <circle className="motif-pulse" cx="77" cy="56" r="5" />
        <circle cx="31" cy="62" r="5" />
        <circle cx="92" cy="46" r="3.5" />
        <circle cx="16" cy="40" r="3" />
      </g>
      <path d="M6 94l8-8-8-8M19 94l8-8-8-8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** A tumbler in its davara with three wisps of steam, and two beans. */
export function KaapiArt() {
  return (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <g strokeWidth="4">
        <path className="motif-steam" d="M41 34c-6-6 6-10 0-18" />
        <path className="motif-steam [animation-delay:-1s]" d="M53 32c-6-6 6-10 0-18" />
        <path className="motif-steam [animation-delay:-2s]" d="M65 34c-6-6 6-10 0-18" />
      </g>
      <path d="M36 42h34l-4 32H40z" strokeWidth="4.5" />
      <path d="M38 52h30" strokeWidth="3" opacity="0.7" />
      <path d="M20 74h66c-2 10-13 15-33 15s-31-5-33-15z" strokeWidth="4.5" />
      <g fill="currentColor" stroke="none">
        <ellipse cx="13" cy="40" rx="5" ry="7.5" transform="rotate(-30 13 40)" />
        <ellipse cx="89" cy="28" rx="4.5" ry="6.5" transform="rotate(28 89 28)" />
      </g>
    </g>
  );
}
