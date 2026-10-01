import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import "./login.css";

/*
 * Real dishes floating in the sky, framed like photo prints, above the
 * palette's scene. Sized by the sky's HEIGHT (aspect 4/5), so on a short
 * phone they shrink with it instead of burying the sun. Each drifts on its
 * own clock (--drift) after popping in (--card-delay).
 * Literal paths: renaming one of these photos means updating it here.
 */
const CARDS = [
  {
    src: "/photos/dishes/chicken-dum-biryani.jpg",
    className: "left-[14%] top-[6%] h-[42%] -rotate-8",
    style: { "--card-delay": "0.45s", "--drift": "7s" },
    eager: true,
  },
  {
    src: "/photos/dishes/chicken-noodles.jpg",
    className: "right-[10%] top-[10%] h-[38%] rotate-7",
    style: { "--card-delay": "0.6s", "--drift": "8.5s" },
    eager: true,
  },
  {
    src: "/photos/dishes/paneer-65.jpg",
    className: "left-[45%] top-[2%] h-[28%] rotate-3",
    style: { "--card-delay": "0.75s", "--drift": "6s" },
    eager: false,
  },
] as const;

/**
 * The sign-in page's sky, a few real dishes floating in it, and a scene
 * that belongs to the student's palette (all four are in the markup; the
 * nearest data-palette shows one via the only-* utilities, so it's right
 * before hydration). Styles and motion in ./login.css. Decorative.
 *
 *   Vice Dusk (GTA VI)  a Vice City sunset: striped sun, sea, two palms,
 *                       stars at night — the sunset is Vice's alone
 *   Electric Sunrise    a line-art sun rising over diagonal ribbons, sparkles
 *   Innovation Hub      a dot grid, a network of glowing nodes, orbit rings
 *                       on the horizon, diagonal bands below
 *   Kaapi               a filter-coffee tumbler in its davara on a wooden
 *                       table, steam rising, coffee beans in the air
 */
export function LoginScene() {
  return (
    <div aria-hidden="true" className="login-sky relative isolate min-h-48 flex-1 overflow-hidden">
      <div className="only-vice absolute inset-0">
        <div className="login-stars absolute inset-0" />
      </div>
      <div className="only-hub login-grid absolute inset-0" />
      {/* The app column, so the scene and dishes frame the sheet below at
          any screen width while the sky and ground run edge to edge. No
          transform here: that would make it its own layer, and the ground
          (painted after it) would cover the palms and dishes. The only-*
          wrappers only switch display, so they don't form layers either. */}
      <div className="absolute inset-0 mx-auto w-full max-w-md">
        <div className="only-vice">
          <div className="login-glow absolute left-1/2 aspect-[2/1] w-[130%]" />
          <div className="login-sun absolute left-1/2 aspect-square w-[58%] rounded-full" />
          <Palm className="-left-[7%] h-[60%]" />
          <Palm className="login-palm-right -right-[9%] h-[48%] -scale-x-100" />
        </div>
        <div className="only-sunrise">
          <div className="login-glow absolute left-1/2 aspect-[2/1] w-[130%]" />
          <svg
            viewBox="0 0 200 104"
            className="login-rising absolute left-1/2 w-[86%]"
            fill="none"
            stroke="var(--art)"
            strokeLinecap="round"
          >
            <path d="M40 104a60 60 0 0 1 120 0" strokeWidth="7" />
            <path d="M66 104a34 34 0 0 1 68 0" strokeWidth="5" opacity="0.65" />
            <path d="M100 30V8M140 44l13-17M60 44L47 27M164 74l20-7M36 74l-20-7" strokeWidth="7" />
          </svg>
          {SPARKLES.map((sp, i) => (
            <svg key={sp} viewBox="0 0 20 20" className={cn("absolute", sp)}>
              <path
                className="motif-twinkle"
                style={{ animationDelay: `${-i * 0.7}s` }}
                fill="var(--sparkle)"
                d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z"
              />
            </svg>
          ))}
        </div>
        <div className="only-hub">
          <svg
            viewBox="0 0 200 120"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-[4%] h-[62%] w-full"
            fill="none"
          >
            <path
              d="M14 30L52 12L96 40L140 18L186 46M52 12L70 70L96 40L128 84L140 18M14 30L30 88L70 70"
              stroke="var(--net)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Nodes as their own dots (not in the stretched SVG, so they stay round). */}
          {NODES.map(([x, y], i) => (
            <span
              key={`${x}-${y}`}
              className={cn("login-node absolute size-2 rounded-full", i % 3 === 0 && "motif-pulse")}
              style={{ left: `${(x / 200) * 100}%`, top: `calc(4% + ${(y / 120) * 62}%)`, animationDelay: `${-i * 0.4}s` }}
            />
          ))}
          <svg viewBox="0 0 200 100" className="login-orbits absolute left-1/2 w-[80%]" fill="none" stroke="var(--net)">
            <circle cx="100" cy="100" r="92" strokeWidth="2" opacity="0.5" />
            <circle cx="100" cy="100" r="62" strokeWidth="2.5" opacity="0.8" />
            <circle cx="100" cy="100" r="32" strokeWidth="3" />
            <circle className="motif-pulse" cx="162" cy="100" r="5" fill="var(--node)" stroke="none" />
          </svg>
        </div>
        <div className="only-kaapi">
          <div className="login-glow absolute left-1/2 aspect-[2/1] w-[130%]" />
          {BEANS.map((b) => (
            <svg key={b} viewBox="0 0 20 28" className={cn("login-bean absolute", b)}>
              <ellipse cx="10" cy="14" rx="9" ry="13" fill="var(--bean)" />
              <path d="M10 2c-4 6 4 18 0 24" stroke="var(--bean-line)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          ))}
          <svg viewBox="0 0 120 120" className="login-tumbler absolute left-1/2 w-[40%]">
            <g fill="none" stroke="var(--steam)" strokeWidth="4" strokeLinecap="round">
              <path className="motif-steam" d="M46 34c-8-8 8-13 0-24" />
              <path className="motif-steam [animation-delay:-1.1s]" d="M60 30c-8-8 8-13 0-24" />
              <path className="motif-steam [animation-delay:-2.2s]" d="M74 34c-8-8 8-13 0-24" />
            </g>
            <path d="M38 44h44l-6 46H44z" fill="var(--art)" />
            <path d="M40 56h40" stroke="var(--art-light)" strokeWidth="3" />
            <path d="M14 90h92c-3 16-20 24-46 24s-43-8-46-24z" fill="var(--art)" />
            <path d="M20 94h80" stroke="var(--art-light)" strokeWidth="2.5" opacity="0.7" />
          </svg>
        </div>
        {CARDS.map((card) => (
          <div
            key={card.src}
            className={cn("login-card absolute z-20 aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-secondary", card.className)}
            style={card.style as CSSProperties}
          >
            <Image
              src={card.src}
              alt=""
              fill
              sizes="160px"
              // All three are on screen at load: never lazy (an empty
              // frame would sit in the sky), the big two at high priority.
              loading="eager"
              fetchPriority={card.eager ? "high" : undefined}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="only-vice login-sea absolute inset-x-0 bottom-0" />
      <div className="only-sunrise login-ribbons absolute inset-x-0 bottom-0" />
      <div className="only-hub login-bands absolute inset-x-0 bottom-0" />
      <div className="only-kaapi login-table absolute inset-x-0 bottom-0" />
    </div>
  );
}

/* Electric Sunrise: four-point sparkles around the rising sun. */
const SPARKLES = [
  "left-[6%] top-[46%] size-5",
  "right-[5%] top-[52%] size-6",
  "left-[34%] top-[38%] size-3",
  "right-[30%] top-[44%] size-4",
] as const;

/* Innovation Hub: the network's nodes, in the line drawing's 200×120 box. */
const NODES = [
  [14, 30],
  [52, 12],
  [96, 40],
  [140, 18],
  [186, 46],
  [70, 70],
  [128, 84],
  [30, 88],
] as const;

/* Kaapi: coffee beans in the air around the tumbler. */
const BEANS = [
  "left-[5%] top-[50%] size-6 -rotate-30",
  "right-[6%] top-[56%] size-5 rotate-25",
  "left-[30%] top-[42%] size-4 rotate-60",
  "right-[28%] top-[40%] size-4 -rotate-12",
] as const;

/*
 * A palm silhouette: a curved trunk and seven fronds from one crown, plus
 * two coconuts. The whole tree sways from its base; the fronds sway a
 * little more from the crown (78, 60).
 */
function Palm({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 240"
      preserveAspectRatio="xMidYMax meet"
      className={cn("login-palm absolute bottom-[calc(var(--horizon)-6%)] z-10 aspect-[140/240]", className)}
      fill="currentColor"
    >
      <path d="M50 240C58 190 66 130 74 62L82 64C76 130 70 190 66 240Z" />
      <g className="login-fronds">
        <path d="M78 60C100 44 128 48 138 72C122 58 102 58 80 66Z" />
        <path d="M79 63C100 66 116 84 118 108C108 88 96 76 78 68Z" />
        <path d="M78 60C54 42 24 46 12 70C30 56 52 56 76 66Z" />
        <path d="M77 63C54 66 38 84 36 110C46 90 60 76 78 68Z" />
        <path d="M78 58C84 34 102 20 122 20C104 30 90 42 81 60Z" />
        <path d="M78 58C70 32 52 18 32 20C50 30 64 42 75 60Z" />
        <path d="M78 58C76 38 80 20 90 8C88 26 86 42 81 58Z" />
        <circle cx="74" cy="66" r="4" />
        <circle cx="82" cy="67" r="4" />
      </g>
    </svg>
  );
}
