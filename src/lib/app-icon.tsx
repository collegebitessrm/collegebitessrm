import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MARK_NAVY } from "@/lib/brand-mark";

// Doesn't depend on request data, so read once at module scope (same
// pattern Next.js recommends for custom ImageResponse fonts). The mark is
// the logo's navy icon tile, cut from the transparent logo by
// scripts/build-brand-assets.mjs — the full logo's wordmark and tagline
// are unreadable at icon sizes.
const markData = await readFile(join(process.cwd(), "public/brand/mark.png"));
const MARK_SRC = `data:image/png;base64,${markData.toString("base64")}`;

/**
 * Shared College Bites app-icon: the navy icon tile on its own navy (the
 * tile's corners are transparent, so the background fills them and the
 * icon reads as one navy square) — used by every generated icon route
 * (app/icons/*, app/apple-icon.tsx) so the source image only ever needs
 * updating in one place.
 */
export function appIconResponse({
  width,
  height,
  borderRadius = 0,
  markScale = 1,
}: {
  width: number;
  height: number;
  /** 0 (default) for full-bleed icons — maskable/apple-touch icons where the OS applies its own mask. */
  borderRadius?: number;
  /**
   * Mark width as a fraction of the icon. Maskable icons must keep the
   * artwork inside the central 80%-diameter circle Android may crop to.
   */
  markScale?: number;
}) {
  const markSize = Math.round(width * markScale);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius,
          background: MARK_NAVY,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_SRC} alt="" width={markSize} height={markSize} />
      </div>
    ),
    { width, height },
  );
}
