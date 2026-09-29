// Shared <ViewTransition> props for the app's directional page transitions
// (home <-> restaurant menu, orders list <-> order detail, menu -> order
// tracking). A <Link>/router.push tags the navigation with a "nav-forward"
// or "nav-back" transitionType; anything untyped (browser back/forward,
// router.refresh()) falls through to "none" and doesn't animate.
export const NAV_TRANSITION = {
  enter: { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" },
  exit: { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" },
  default: "none",
} as const;

// The loading.tsx -> page.tsx handoff: the skeleton slides down and out,
// the real content slides up and in, right as the Suspense boundary
// resolves. Independent of NAV_TRANSITION above (different activation —
// Suspense resolving, not a tagged navigation) and safe to nest inside it.
// `default: "none"` keeps each from animating on unrelated transitions,
// same reasoning as NAV_TRANSITION's own default.
export const REVEAL_EXIT = { exit: "slide-down", default: "none" } as const;
export const REVEAL_ENTER = { enter: "slide-up", default: "none" } as const;
