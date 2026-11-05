import { appIconResponse } from "@/lib/app-icon";

// Served at /icons/icon-192 — referenced from app/manifest.ts as the
// "any" purpose Android/Chrome install icon. Generated statically.
export const dynamic = "force-static";
export const revalidate = false;
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 192, height: 192, borderRadius: 40 });
}
