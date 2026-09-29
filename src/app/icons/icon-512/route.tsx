import { appIconResponse } from "@/lib/app-icon";

// Served at /icons/icon-512 — the larger "any" purpose install icon
// referenced from app/manifest.ts (same mark as icon-192, just bigger).
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 512, height: 512, borderRadius: 108 });
}
