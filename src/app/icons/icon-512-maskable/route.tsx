import { appIconResponse } from "@/lib/app-icon";

// Served at /icons/icon-512-maskable — the "maskable" purpose icon
// referenced from app/manifest.ts. Android crops maskable icons to its
// own shape (circle, squircle, ...), so unlike the plain icons above this
// one is full-bleed with no rounded corners of its own, and the mark is
// shrunk to sit inside the ~80%-diameter safe zone so no crop clips it.
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 512, height: 512, markScale: 0.6 });
}
