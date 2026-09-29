import { appIconResponse } from "@/lib/app-icon";

// iOS Safari ignores the web manifest's icons for "Add to Home Screen" —
// it only reads this file-convention (auto-wired by Next into
// <link rel="apple-touch-icon">). Apple applies its own
// rounded-square mask, so like the manifest's maskable icon this is
// full-bleed (no corners of its own).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIconResponse({ width: size.width, height: size.height, markScale: 0.8 });
}
