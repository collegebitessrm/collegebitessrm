import type { CSSProperties } from "react";
import Image from "next/image";
import { MapPin } from "@/components/icons";

/*
 * Each palette's campus scene (public/photos/promo/scene-<id>.webp, all
 * cropped to the same box so the rider and pin sit in the same place on
 * every one). The class names are literal so Tailwind sees them; only the
 * nearest data-palette's scene displays, and the hidden ones are never
 * fetched (lazy + display: none).
 */
const SCENES = [
  { id: "vice", className: "only-vice" },
  { id: "sunrise", className: "only-sunrise" },
  { id: "hub", className: "only-hub" },
  { id: "kaapi", className: "only-kaapi" },
] as const;

/**
 * Home's promo: the campus promise in one short line and one plain
 * sentence on the lit hero card, with the brand sheet's scene on the right
 * — the palette's own campus and a delivery run that loops every 9 s: the
 * rider pulls in, idles, rides the road's S-bend up to the campus
 * (shrinking with distance, turning at the bend, speed lines and a puff of
 * dust while moving), rides into the gate, and the Gate 3 pin pops with a
 * ring and a burst. One small touch per palette: Vice's stars and
 * Sunrise's sparkles twinkle, Hub's node pulses, Kaapi's food box steams.
 * All CSS (`promo-*` in globals.css): the route is the road's lane dashes,
 * measured in scene percentages (the same on all four scenes). Reduced
 * motion shows the rider parked at the foot of the road, still; it holds
 * while the splash is up.
 */
export function PromoCard() {
  return (
    <div className="surface-hero glow-sun relative mt-5 min-h-44 overflow-hidden rounded-[1.75rem] bg-hero p-5 text-hero-foreground">
      <div className="relative z-10 max-w-[62%]">
        <p className="font-heading text-title leading-tight font-bold">Hot food, at Gate&nbsp;3</p>
        <p className="mt-1.5 max-w-[7.5rem] text-sm font-medium">Order here, pay when you collect.</p>
      </div>
      <PromoScene />
    </div>
  );
}

/* Arrival burst around the pin's head (scene viewBox 100 × 61). */
const BURST = [
  [0, -7],
  [6, -4],
  [7, 2],
  [-6, -4],
  [-7, 2],
  [0, 6],
] as const;

function PromoScene() {
  return (
    <div aria-hidden="true" className="promo-scene absolute -right-3 -bottom-2 aspect-[1476/906] w-[74%]">
      {SCENES.map((s) => (
        <Image
          key={s.id}
          src={`/photos/promo/scene-${s.id}.webp`}
          alt=""
          fill
          sizes="(max-width: 448px) 74vw, 320px"
          className={`${s.className} object-contain`}
        />
      ))}

      {/* Per-palette touches, in scene percentages. */}
      <svg viewBox="0 0 100 61" className="only-vice absolute inset-0 size-full text-white">
        <Sparkle x={47} y={12} r={1.6} delay="0s" />
        <Sparkle x={86} y={9} r={1.2} delay="0.9s" />
        <Sparkle x={38} y={26} r={1} delay="1.7s" />
      </svg>
      <svg viewBox="0 0 100 61" className="only-sunrise absolute inset-0 size-full text-white">
        <Sparkle x={44} y={8} r={1.8} delay="0.3s" />
        <Sparkle x={92} y={22} r={1.3} delay="1.2s" />
      </svg>
      <svg viewBox="0 0 100 61" className="only-hub absolute inset-0 size-full text-white">
        <circle cx="84" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="0.6" className="motif-pulse" opacity="0.8" />
        <circle cx="84" cy="10" r="1.3" fill="currentColor" />
        <path d="M84 10 L74 4 M84 10 L93 5" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
        <circle cx="74" cy="4" r="0.8" fill="currentColor" className="motif-pulse" />
        <circle cx="93" cy="5" r="0.8" fill="currentColor" />
      </svg>

      {/* Gate 3: the pin on the tower's door (white halo so it reads on the
          dark doorway in every scene). It pops, rings and bursts the moment
          the rider rides in under it. */}
      <span className="promo-pin absolute top-[35%] left-[60%] flex w-[10%] flex-col items-center">
        <MapPin
          weight="fill"
          className="size-full text-hero-foreground [filter:drop-shadow(0_0_1px_rgb(255_255_255))_drop-shadow(0_0_1px_rgb(255_255_255))_drop-shadow(0_2px_2px_rgb(0_0_0/0.25))]"
        />
        <span className="promo-pin-ring -mt-[18%] h-[14%] w-[70%] rounded-[50%] bg-hero-foreground/30" />
      </span>
      <svg viewBox="0 0 100 61" className="absolute inset-0 size-full overflow-visible text-white">
        {BURST.map(([dx, dy], i) => (
          <circle
            key={i}
            cx="65"
            cy="25.3"
            r="0.9"
            fill="currentColor"
            className="promo-burst"
            style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as CSSProperties}
          />
        ))}
      </svg>

      {/* The delivery run: .promo-route moves along the road (percentages of
          the scene); .promo-rider sits on it by its wheels and scales with
          distance, flipping to face the way it rides after the bend. */}
      <div className="promo-route absolute inset-0">
        <div className="promo-rider absolute top-0 left-0 w-[31%]">
          <div className="promo-bob relative">
            {/* Ground shadow, under the wheels. */}
            <span className="absolute -bottom-[3%] left-[14%] h-[9%] w-[74%] rounded-[50%] bg-black/25 blur-[2px]" />
            {/* Speed lines behind, while it's moving. */}
            <svg viewBox="0 0 40 30" className="promo-trail absolute top-[42%] -left-[40%] w-[52%] overflow-visible text-hero-foreground">
              <line x1="6" y1="6" x2="34" y2="6" className="promo-streak" style={{ animationDelay: "0s" }} />
              <line x1="0" y1="14" x2="30" y2="14" className="promo-streak" style={{ animationDelay: "0.3s" }} />
              <line x1="10" y1="22" x2="36" y2="22" className="promo-streak" style={{ animationDelay: "0.6s" }} />
            </svg>
            {/* Dust kicked up by the back wheel as it pulls away. */}
            <span className="promo-dust absolute bottom-[2%] left-[4%] size-[16%] rounded-full bg-white/70" />
            <span className="promo-dust promo-dust-2 absolute bottom-[8%] -left-[6%] size-[11%] rounded-full bg-white/60" />
            <Image
              src="/photos/promo/rider.webp"
              alt=""
              width={520}
              height={505}
              sizes="(max-width: 448px) 26vw, 120px"
              loading="eager"
              className="relative h-auto w-full"
            />
            {/* Kaapi: steam off the food box. */}
            <svg viewBox="0 0 24 24" className="only-kaapi absolute -top-[18%] left-[6%] w-[30%] text-white">
              <path d="M8 20c-2-3 2-5 0-8s2-5 0-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="motif-steam" />
              <path d="M15 20c-2-3 2-5 0-8s2-5 0-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="motif-steam" style={{ animationDelay: "1.2s" }} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A four-point twinkle at (x, y) in the scene's 100-wide viewBox. */
function Sparkle({ x, y, r, delay }: { x: number; y: number; r: number; delay: string }) {
  return (
    <path
      d={`M${x} ${y - r * 2}Q${x} ${y} ${x + r * 2} ${y}Q${x} ${y} ${x} ${y + r * 2}Q${x} ${y} ${x - r * 2} ${y}Q${x} ${y} ${x} ${y - r * 2}Z`}
      fill="currentColor"
      className="motif-twinkle"
      style={{ animationDelay: delay }}
    />
  );
}
