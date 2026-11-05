import { appIconResponse } from "@/lib/app-icon";

// Served at /icons/icon-512-maskable — the "maskable" purpose icon
// referenced from app/manifest.ts. Android crops maskable icons to its
// own shape (circle, squircle, ...).
export const dynamic = "force-static";
export const revalidate = false;
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 512, height: 512, markScale: 0.8 });
}
