// Simplified theme system — single clean Zomato-style design.
// No palette switching, just light/dark mode.

export type PaletteId = "default";

export const DEFAULT_PALETTE: PaletteId = "default";

export const PALETTE_IDS: PaletteId[] = ["default"];

/** Page ground colours for the browser bar. */
export const PALETTE_GROUNDS: Record<PaletteId, { light: string; dark: string }> = {
 default: { light: "#ffffff", dark: "#1c1c1c" },
};

export function isPaletteId(v: unknown): v is PaletteId {
 return v === "default";
}
