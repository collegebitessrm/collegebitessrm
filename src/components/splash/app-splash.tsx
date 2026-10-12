import type { CSSProperties } from "react";
import { MARK_CAP, MARK_TILE } from "@/lib/brand-mark";
import { SPLASH } from "./config";
import "./splash.css";

/**
 * The startup splash, "One Bite" (storyboard in ./config.ts): the logo's
 * indigo fills the screen, the logo tile eases in, its graduation cap drops
 * into place, "College Bites" rises in, then a bite is taken out of the
 * screen's corner and opens onto the app while the tile glides into the
 * page's own logo. All motion comes from ./engine.ts, run by the inline
 * script in the root layout; this is only markup, hidden until that script
 * decides this load plays it.
 *
 * `night` is the indigo screen (it carries the bite mask); the tile sits
 * on top of it so it can fly into the page as the bite opens. Decorative
 * throughout (aria-hidden): the page underneath stays in the accessibility
 * tree the whole time. The images carry their address in `data-src`, and
 * the engine sets `src` when it starts (it has just decoded them, so they
 * come straight from cache): when the splash is skipped they never
 * download. Lazy loading did the same job but only fires while the page is
 * painting frames — not something to depend on before first paint.
 */
export function AppSplash() {
 const capStyle: CSSProperties = {
 left: `${MARK_CAP.x * 100}%`,
 top: `${MARK_CAP.y * 100}%`,
 width: `${MARK_CAP.w * 100}%`,
 // The cap's own shape, so it never collapses to 0 px before its image paints.
 aspectRatio: `${MARK_CAP.w} / ${MARK_CAP.h}`,
 };
 return (
 <div id="app-splash" className="app-splash" aria-hidden="true" style={{ "--sp-tile": MARK_TILE } as CSSProperties}>
 <div className="sp-night" data-sp="night" suppressHydrationWarning />
 <div className="sp-halo" data-sp="halo" />
 <div className="sp-words" data-sp="words">
 <p className="sp-name font-heading">College Bites</p>
 <p className="sp-tagline">Crave. Click. Campus.</p>
 </div>
 <div className="sp-tile" data-sp="tile">
 {/* eslint-disable-next-line @next/next/no-img-element -- raw <img>: the inline engine drives it before hydration */}
 <img className="sp-art" data-src={SPLASH.tileImage} alt="" width={512} height={512} draggable={false} suppressHydrationWarning />
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img className="sp-cap" data-sp="cap" data-src={SPLASH.capImage} alt="" draggable={false} style={capStyle} suppressHydrationWarning />
 <div className="sp-sheen" data-sp="sheen" />
 </div>
 {/* Last element: the engine waits until the overlay has streamed in up to here. */}
 <span hidden data-sp="end" />
 </div>
 );
}
