import { cn } from "@/lib/utils";

/**
 * A small animated detail for the campus pass's top-right corner — beside
 * the "campus pass" label, above the name, so it never sits behind text —
 * for the palettes that don't have Vice's striped sun there. A soft glow
 * behind it lights the corner. All three are in the markup; the nearest
 * data-palette shows one (only-* utilities). Motion lives in globals.css's
 * reduced-motion-safe block (motif-steam / -rays / -twinkle / -orbit /
 * -pulse); without it each sits still. Decorative.
 *
 *   Kaapi             a filter-coffee tumbler in its davara, steam rising
 *   Electric Sunrise  a small sun peeking up, rays pulsing, two sparkles
 *   Innovation Hub    a satellite circling a pulsing node
 */
export function PassArt({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute size-12", className)}>
      <span className="only-sunrise absolute inset-0">
        <Glow />
        <svg viewBox="0 0 48 48" className="relative size-full text-hero-accent/80">
          <g className="motif-rays" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M24 14v-5M33.5 18l3-4M14.5 18l-3-4M39 27h4M5 27h4" />
          </g>
          <path d="M12 36a12 12 0 0 1 24 0z" fill="currentColor" opacity="0.85" />
          <path d="M6 37.5h36" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path className="motif-twinkle" fill="currentColor" d="M41 6l1.3 3.4L45.7 10.7 42.3 12 41 15.4 39.7 12 36.3 10.7 39.7 9.4z" />
          <path className="motif-twinkle [animation-delay:-1.3s]" fill="currentColor" d="M8 5l.9 2.3L11.2 8.2 8.9 9.1 8 11.4 7.1 9.1 4.8 8.2 7.1 7.3z" />
        </svg>
      </span>
      <span className="only-hub absolute inset-0">
        <Glow />
        <svg viewBox="0 0 48 48" className="relative size-full text-hero-accent/75">
          <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6" />
          <circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <g className="motif-orbit">
            <circle cx="36" cy="24" r="3.4" fill="currentColor" />
          </g>
          <g className="motif-orbit-slow">
            <circle cx="24" cy="5" r="2.2" fill="currentColor" opacity="0.7" />
          </g>
          <circle className="motif-pulse" cx="24" cy="24" r="4.6" fill="currentColor" />
        </svg>
      </span>
      <span className="only-kaapi absolute inset-0">
        <Glow />
        <svg viewBox="0 0 48 48" className="relative size-full text-hero-foreground/75">
          <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path className="motif-steam" d="M19 15c-3-3 3-5 0-9" />
            <path className="motif-steam [animation-delay:-1.1s]" d="M24 14c-3-3 3-5 0-9" />
            <path className="motif-steam [animation-delay:-2.2s]" d="M29 15c-3-3 3-5 0-9" />
          </g>
          <path d="M16 19h16l-2.4 16H18.4z" fill="currentColor" />
          <path d="M17 23.5h14" stroke="white" strokeOpacity="0.45" strokeWidth="1.6" />
          <path d="M9 35h30c-1.2 5.5-7 8-15 8s-13.8-2.5-15-8z" fill="currentColor" opacity="0.9" />
        </svg>
      </span>
    </span>
  );
}

/** The soft light behind the detail. */
function Glow() {
  return (
    <span className="absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.55),transparent)]" />
  );
}
