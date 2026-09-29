/**
 * The mascot's leg rig for the startup splash — hand-measured on the
 * 1254-px source art (public/mutebites-logo-v2-2.png), the same coordinates
 * as layers.ts. "Pose A" is the pose the logo is drawn in: the front leg
 * reaching forward, the back leg kicked up behind. Every joint rotates
 * relative to pose A, so at rest the rig lines up with the drawn legs and
 * hands over to them invisibly.
 *
 * Angles use CSS rotate() on a limb hanging straight down: positive swings
 * it backward (clockwise, toward the trails), negative forward.
 */

type Point = readonly [x: number, y: number];

export type LegRig = {
  hip: Point;
  knee: Point;
  ankle: Point;
  thighWidth: number;
  shinWidth: number;
  shoe: "backShoe" | "frontShoe";
  /** Where this leg is in the cycle when the logo is in pose A. */
  phaseAtRest: number;
};

export const LEGS: { back: LegRig; front: LegRig } = {
  back: {
    hip: [600, 632],
    knee: [537, 707],
    ankle: [478, 694],
    thighWidth: 56,
    shinWidth: 50,
    shoe: "backShoe",
    phaseAtRest: 0.5,
  },
  front: {
    hip: [700, 636],
    knee: [750, 706],
    ankle: [800, 772],
    thighWidth: 58,
    shinWidth: 54,
    shoe: "frontShoe",
    phaseAtRest: 0,
  },
};

/** Pivots for the secondary motion (source pixels). */
export const PIVOTS = {
  /** Where the arm disappears behind the bag — the tray swings from here. */
  shoulder: [792, 622] as Point,
  /** Centre of the cloche's base — the lid tilts on this. */
  lidBase: [955, 552] as Point,
  /** Top of the cloche knob — steam starts here. */
  knob: [952, 420] as Point,
  /** Ground line under the shoes — the landing squashes onto it. */
  feet: [640, 838] as Point,
};

/**
 * One full stride for one leg: thigh angle from vertical and knee angle
 * relative to the thigh (both absolute), plus a small ankle flex. The shoe
 * already turns with the shin, so the ankle only needs ±20° — the drawn
 * shoes sit at nearly the same angle to their shins. Phase 0 is the front
 * leg's contact pose, 0.5 the back leg's kicked-up pose; the two legs run
 * half a cycle apart, so the drawn pose is both at once.
 */
export const STRIDE: { at: number; thigh: number; knee: number; foot: number }[] = [
  { at: 0, thigh: -36, knee: -2, foot: 0 }, // heel strike, leg reaching forward (drawn front leg)
  { at: 0.14, thigh: -18, knee: 20, foot: -7 }, // loading
  { at: 0.3, thigh: 8, knee: 25, foot: -17 }, // stance, under the body
  { at: 0.42, thigh: 34, knee: 18, foot: 23 }, // toe-off, foot tipping down
  { at: 0.5, thigh: 40, knee: 62, foot: 13 }, // heel kicks up behind (drawn back leg)
  { at: 0.64, thigh: -5, knee: 110, foot: 18 }, // knee drives through, shin folded
  { at: 0.8, thigh: -48, knee: 80, foot: 3 }, // knee high in front
  { at: 0.92, thigh: -48, knee: 20, foot: -2 }, // reaching for the next step
];

/**
 * Tube shading across a limb, dark underside to rose rim-light — sampled
 * from the drawn legs (#48082a … #6a1538, rim #b03655).
 */
export const TUBE_GRADIENT =
  "linear-gradient(90deg, #3a0420 0%, #4d0a2b 30%, #5e1133 58%, #6b1638 78%, #a4304f 90%, #7a1d40 100%)";
