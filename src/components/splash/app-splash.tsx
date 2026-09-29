import type { CSSProperties, ReactNode } from "react";
import { LAYERS, STAGE, type LayerName } from "./layers";
import { LEGS, PIVOTS, TUBE_GRADIENT, type LegRig } from "./rig";
import "./splash.css";

/**
 * The startup splash: the transparent logo cut into layers
 * (scripts/build-brand-assets.mjs) and re-assembled on a warm ivory
 * screen, with the legs re-built as a jointed rig (./rig.ts) so the mascot
 * actually runs in. All motion comes from ./engine.ts, run by the inline
 * script in the root layout; this is only markup, hidden until that script
 * decides this load plays it.
 *
 * Everything is positioned in source-art pixels via `--u` (one art pixel,
 * from the stage's container width), so the pieces line up exactly with
 * the drawn logo at any screen size. Decorative throughout (aria-hidden):
 * the page underneath stays in the accessibility tree the whole time.
 *
 * Layer images are `loading="lazy"` on purpose: when the splash is skipped
 * it's `display: none`, and lazy images that are never laid out never
 * download. When it plays, the engine has already preloaded them.
 */
export function AppSplash() {
  return (
    <div id="app-splash" className="app-splash" aria-hidden="true">
      <div
        className="sp-stage"
        data-sp="stage"
        style={{
          aspectRatio: `${STAGE.w} / ${STAGE.h}`,
          // Centred, never too big on a phone, and short enough for landscape.
          width: `min(74vw, 25rem, calc(56dvh * ${(STAGE.w / STAGE.h).toFixed(4)}))`,
        }}
      >
        <div className="sp-canvas" style={{ "--u": `calc(100cqw / ${STAGE.w})` } as CSSProperties}>
          <div className="sp-fill" data-sp="run">
            <div className="sp-fill" data-sp="land" style={{ transformOrigin: at(PIVOTS.feet) }}>
              <div className="sp-fill" data-sp="lean" style={{ transformOrigin: at(PIVOTS.feet) }}>
                <div className="sp-fill" data-sp="bob">
                  <Layer name="trails" hook="trails" />

                  <div className="sp-fill sp-rig" data-sp="rig">
                    <Leg name="back" rig={LEGS.back} />
                    <Leg name="front" rig={LEGS.front} />
                  </div>
                  <Layer name="legs" hook="legs" />

                  <div className="sp-fill" data-sp="tray" style={{ transformOrigin: at(PIVOTS.shoulder) }}>
                    <Layer name="tray" />
                    <span className="sp-glow" data-sp="glow" style={glowBox()} />
                    <Layer name="lid" hook="lid" style={{ transformOrigin: within("lid", PIVOTS.lidBase) }} />
                    <Layer name="steam" hook="steam" style={{ transformOrigin: "50% 100%" }} />
                    <Wisp hook="wisp-run" dx={-6} color="#d7a8b8" />
                    <Wisp hook="wisp-run" dx={4} color="#914955" opacity={0.5} />
                    <Wisp hook="wisp-run" dx={-2} color="#c07a35" opacity={0.45} />
                    <Wisp hook="wisp-rise" dx={-26} color="#d7a8b8" />
                    <Wisp hook="wisp-rise" dx={30} color="#914955" opacity={0.45} />
                  </div>

                  <Layer name="body" />
                </div>
              </div>
            </div>
          </div>
          <Layer name="swoosh" hook="swoosh" />
          <Layer name="wordmark" hook="wordmark" style={{ transformOrigin: "50% 60%" }} />
          <Layer name="tagline" hook="tagline" />
        </div>
      </div>
    </div>
  );
}

/** A length in source-art pixels. */
const u = (n: number) => `calc(var(--u) * ${Math.round(n * 100) / 100})`;
/** A source-art point as a position inside the stage. */
const at = ([x, y]: readonly [number, number]) => `${u(x - STAGE.x)} ${u(y - STAGE.y)}`;
/** A source-art point relative to a layer's own box, for its transform-origin. */
const within = (name: LayerName, [x, y]: readonly [number, number]) =>
  `${u(x - LAYERS[name].x)} ${u(y - LAYERS[name].y)}`;

function Layer({
  name,
  hook,
  style,
}: {
  name: LayerName;
  hook?: string;
  style?: CSSProperties;
}) {
  const l = LAYERS[name];
  return (
    <div
      className="sp-layer"
      data-sp={hook}
      style={{ left: u(l.x - STAGE.x), top: u(l.y - STAGE.y), width: u(l.w), height: u(l.h), ...style }}
    >
      {/* Plain <img>: fixed, pre-sized WebP layers that must be byte-identical
          to what the engine preloads — no optimizer URL rewriting. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={l.src} alt="" loading="lazy" draggable={false} />
    </div>
  );
}

/**
 * One leg: hip → knee → ankle joints, each a zero-size pivot the engine
 * rotates. Thigh and shin are shaded tubes laid out in the drawn pose; the
 * shoe is the real shoe cut from the art, hung on the ankle.
 */
function Leg({ name, rig }: { name: string; rig: LegRig }) {
  const shoe = LAYERS[rig.shoe];
  return (
    <Joint hook={`${name}-hip`} x={rig.hip[0] - STAGE.x} y={rig.hip[1] - STAGE.y}>
      <Tube from={rig.hip} to={rig.knee} width={rig.thighWidth} />
      <Joint hook={`${name}-knee`} x={rig.knee[0] - rig.hip[0]} y={rig.knee[1] - rig.hip[1]}>
        <Tube from={rig.knee} to={rig.ankle} width={rig.shinWidth} />
        <Joint hook={`${name}-foot`} x={rig.ankle[0] - rig.knee[0]} y={rig.ankle[1] - rig.knee[1]}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sp-shoe"
            src={shoe.src}
            alt=""
            loading="lazy"
            draggable={false}
            style={{ left: u(shoe.x - rig.ankle[0]), top: u(shoe.y - rig.ankle[1]), width: u(shoe.w), height: u(shoe.h) }}
          />
        </Joint>
      </Joint>
    </Joint>
  );
}

function Joint({ hook, x, y, children }: { hook: string; x: number; y: number; children: ReactNode }) {
  return (
    <div className="sp-joint" data-sp={hook} style={{ left: u(x), top: u(y) }}>
      {children}
    </div>
  );
}

/** A limb segment from one joint to the next, drawn in place at the joint (0, 0). */
function Tube({
  from,
  to,
  width,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  width: number;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  // CSS rotate() of a tube hanging straight down onto this segment.
  const angle = (Math.atan2(-dx, dy) * 180) / Math.PI;
  return (
    <span
      className="sp-tube"
      style={{
        left: u(-width / 2),
        top: u(-width / 2),
        width: u(width),
        height: u(length + width),
        borderRadius: u(width / 2),
        transformOrigin: `${u(width / 2)} ${u(width / 2)}`,
        transform: `rotate(${angle.toFixed(2)}deg)`,
        background: TUBE_GRADIENT,
      }}
    />
  );
}

/** A small steam curl whose base sits on the cloche knob. */
function Wisp({ hook, dx, color, opacity = 0.8 }: { hook: string; dx: number; color: string; opacity?: number }) {
  const w = 44;
  const h = 78;
  return (
    <svg
      className="sp-wisp"
      data-sp={hook}
      viewBox="0 0 44 78"
      fill="none"
      style={{
        left: u(PIVOTS.knob[0] + dx - STAGE.x - w / 2),
        top: u(PIVOTS.knob[1] - STAGE.y - h),
        width: u(w),
        height: u(h),
      }}
    >
      <path
        d="M22 76C12 62 32 52 22 38S14 16 24 4"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The warm glow that shows under the lid as it lifts. */
function glowBox(): CSSProperties {
  const [x, y] = PIVOTS.lidBase;
  const w = 220;
  const h = 70;
  return { left: u(x - STAGE.x - w / 2), top: u(y - STAGE.y - h / 2), width: u(w), height: u(h) };
}
