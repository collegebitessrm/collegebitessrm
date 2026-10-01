import { MARK_TILE } from "@/lib/brand-mark";
import { SPLASH } from "./config";
import "./splash.css";

const LETTERS = ["C", "o", "l", "l", "e", "g", "e"];
/** Crumbs from the bite (gold on a Golden Run). */
const CRUMBS = 7;

/**
 * The startup splash, "The Drop" (storyboard in ./config.ts): a night in
 * the palette's own ink, a neon road, the side-on rider ripping along it,
 * a wheelie freeze-frame with a dish flying at the camera, the logo tile
 * slamming in and getting bitten, the wordmark punching in, then the night
 * wipes away and the tile flies into the page's own logo. All motion comes
 * from ./engine.ts, run by the inline script in the root layout; this is
 * only markup, hidden until that script decides this load plays it.
 *
 * Two layers: `night` (everything that gets wiped away at the end) and the
 * `tile` on top of it, outside the wipe, so it can dock into the page.
 * Decorative throughout (aria-hidden): the page underneath stays in the
 * accessibility tree the whole time. Images are `loading="lazy"` on
 * purpose: when the splash is skipped it's `display: none` and they never
 * download; when it plays, the engine has already decoded them.
 */
export function AppSplash() {
  return (
    <div id="app-splash" className="app-splash" aria-hidden="true">
      <div className="sp-night" data-sp="night">
        {/* Midnight Cravings only: a moon and a few stars. */}
        <div className="sp-sky">
          <span className="sp-moon" />
          <span className="sp-star" style={{ left: "14%", top: "12%" }} />
          <span className="sp-star" style={{ left: "72%", top: "8%", animationDelay: "0.4s" }} />
          <span className="sp-star" style={{ left: "38%", top: "20%", animationDelay: "0.8s" }} />
          <span className="sp-star" style={{ left: "86%", top: "26%", animationDelay: "0.2s" }} />
        </div>

        <div className="sp-cam" data-sp="cam">
          {/* The neon road / light trail (scene percentages; the engine moves
              the rider along the same curve). */}
          <svg className="sp-road" data-sp="road" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sp-trail" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" style={{ stopColor: "var(--sp-a)" }} />
                <stop offset="0.55" style={{ stopColor: "var(--sp-b)" }} />
                <stop offset="1" style={{ stopColor: "var(--sp-c)" }} />
              </linearGradient>
            </defs>
            <path className="sp-road-glow" d="M -8 68 C 25 52, 52 82, 108 58" />
            <path className="sp-road-core" d="M -8 68 C 25 52, 52 82, 108 58" />
            <path className="sp-road-lane" d="M -8 68 C 25 52, 52 82, 108 58" />
          </svg>
          <span className="sp-headlight" data-sp="headlight" />

          {/* Speed ghosts: the same rider, a beat behind, fading. */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="sp-rider sp-ghost" data-sp="ghost">
              {/* eslint-disable-next-line @next/next/no-img-element -- raw <img>: the inline engine drives it before hydration */}
              <img src={SPLASH.riderImage} alt="" loading="lazy" draggable={false} />
            </div>
          ))}
          <div className="sp-rider" data-sp="rider">
            <div className="sp-wheelie" data-sp="wheelie">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SPLASH.riderImage} alt="" loading="lazy" draggable={false} />
              {/* Colour-split copies for the freeze-frame glitch. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sp-glitch sp-glitch-a" data-sp="glitch" src={SPLASH.riderImage} alt="" loading="lazy" draggable={false} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sp-glitch sp-glitch-b" data-sp="glitch" src={SPLASH.riderImage} alt="" loading="lazy" draggable={false} />
            </div>
          </div>

          {/* The dish that bursts out of the food box (src set by the engine). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sp-dish" data-sp="dish" alt="" draggable={false} />
        </div>

        <div className="sp-flash" data-sp="flash" />

        <div className="sp-type">
          <p className="sp-word font-heading">
            <span className="sp-row">
              {LETTERS.map((l, i) => (
                <span key={i} className="sp-letter" data-sp="letter">
                  {l}
                </span>
              ))}
            </span>
            <span className="sp-bites" data-sp="bites">
              Bites
            </span>
          </p>
          <p className="sp-sticker" data-sp="sticker" data-for="default">
            Crave. Click. Campus.
          </p>
          <p className="sp-sticker" data-sp="sticker" data-for="golden">
            Golden run · 1 in 15
          </p>
          <p className="sp-sticker" data-sp="sticker" data-for="midnight">
            Midnight cravings
          </p>
        </div>
      </div>

      <div className="sp-tile" data-sp="tile" style={{ backgroundColor: MARK_TILE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SPLASH.markImage} alt="" width={512} height={512} loading="lazy" draggable={false} />
      </div>
      {Array.from({ length: CRUMBS }, (_, i) => (
        <span key={i} className="sp-crumb" data-sp="crumb" />
      ))}
      {/* Last element: the engine waits until the overlay has streamed in up to here. */}
      <span hidden data-sp="end" />
    </div>
  );
}
