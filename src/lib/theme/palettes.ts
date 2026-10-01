// The four colour palettes a student can pick (Profile → Theme, and the
// first-login form). Each is a complete light + dark token set in
// src/app/globals.css, keyed on `data-palette` on <html>. This file is
// client-safe and import-free: the theme-init script inlines PALETTE_IDS
// and the ground colours below, so keep them in step with globals.css.

export type PaletteId = "vice" | "sunrise" | "hub" | "kaapi";

// New students (and any device that hasn't picked one) start on Electric
// Sunrise; Vice Dusk is the GTA VI theme, for those who choose it.
export const DEFAULT_PALETTE: PaletteId = "sunrise";

export const PALETTES: { id: PaletteId; name: string; blurb: string }[] = [
  { id: "sunrise", name: "Electric Sunrise", blurb: "Purple, neon peach and gold dust" },
  { id: "vice", name: "Vice Dusk", blurb: "GTA VI themed · Gamers special" },
  { id: "hub", name: "Innovation Hub", blurb: "Purple, coral and tech blue, lime at night" },
  { id: "kaapi", name: "Kaapi", blurb: "Filter coffee, turmeric and rose milk" },
];

export const PALETTE_IDS = PALETTES.map((p) => p.id);

/** Each palette's page ground (--background), light and dark — the browser bar colour. */
export const PALETTE_GROUNDS: Record<PaletteId, { light: string; dark: string }> = {
  vice: { light: "#fff5ee", dark: "#0e0a24" },
  sunrise: { light: "#fff8f0", dark: "#1a1a1d" },
  hub: { light: "#f3f8f8", dark: "#122238" },
  kaapi: { light: "#f6eee3", dark: "#1c120d" },
};

export function isPaletteId(v: unknown): v is PaletteId {
  return typeof v === "string" && (PALETTE_IDS as string[]).includes(v);
}
