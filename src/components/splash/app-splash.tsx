import { MARK_NAVY } from "@/lib/brand-mark";
import "./splash.css";

/**
 * The startup splash: the logo's navy icon tile, then "College Bites" and
 * the tagline in the app's own fonts, on the sand ground (dusk in dark mode) — a short
 * fade-in, a hold, and a fade to the app. All motion comes from
 * ./engine.ts, run by the inline script in the root layout; this is only
 * markup, hidden until that script decides this load plays it.
 *
 * Decorative throughout (aria-hidden): the page underneath stays in the
 * accessibility tree the whole time. The image is `loading="lazy"` on
 * purpose: when the splash is skipped it's `display: none` and never
 * downloads; when it plays, the engine has already decoded it.
 */
export function AppSplash() {
  return (
    <div id="app-splash" className="app-splash" aria-hidden="true">
      <div className="sp-stage" data-sp="stage">
        <div className="sp-mark" data-sp="mark" style={{ backgroundColor: MARK_NAVY }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- raw <img> so the inline engine can drive it before hydration */}
          <img src="/brand/mark.webp" alt="" width={512} height={512} loading="lazy" draggable={false} />
        </div>
        <p className="sp-word font-heading" data-sp="word">
          College Bites
        </p>
        <p className="sp-tagline" data-sp="tagline">
          Crave. Click. Campus.
        </p>
      </div>
    </div>
  );
}
