import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import "./login.css";

/*
 * Real dishes floating in the sunset sky, framed like photo prints, between
 * the two palms. Sized by the sky's HEIGHT (aspect 4/5), so on a short
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
 * The sign-in page's sky: a Vice City sunset over the sea with two palms
 * and a few real dishes floating above — golden hour in light mode, neon
 * dusk in dark (styles and motion in ./login.css). Decorative throughout.
 */
export function LoginScene() {
  return (
    <div aria-hidden="true" className="login-sky relative isolate min-h-48 flex-1 overflow-hidden">
      <div className="login-stars absolute inset-0" />
      {/* The app column, so the sun, palms and dishes frame the sheet below
          at any screen width while the sky and sea run edge to edge. No
          transform here: that would make it its own layer, and the sea
          (painted after it) would cover the palms and dishes. */}
      <div className="absolute inset-0 mx-auto w-full max-w-md">
        <div className="login-glow absolute left-1/2 aspect-[2/1] w-[130%]" />
        <div className="login-sun absolute left-1/2 aspect-square w-[58%] rounded-full" />
        <Palm className="-left-[7%] h-[60%]" />
        <Palm className="login-palm-right -right-[9%] h-[48%] -scale-x-100" />
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
      <div className="login-sea absolute inset-x-0 bottom-0" />
    </div>
  );
}

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
