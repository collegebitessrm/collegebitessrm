import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Doesn't depend on request data, so read once at module scope (same
// pattern Next.js recommends for custom ImageResponse fonts). The mark is
// the mascot group cut from the transparent logo by
// scripts/build-brand-assets.mjs — the full logo's wordmark and tagline
// are unreadable at icon sizes.
const markData = await readFile(join(process.cwd(), "public/brand/mark.png"));
const MARK_SRC = `data:image/png;base64,${markData.toString("base64")}`;
/** Width / height of public/brand/mark.png. */
const MARK_ASPECT = 854 / 683;
/** Same warm ivory as the startup splash, so the icon, splash and app read as one. */
const IVORY = "#f5eae1";

/**
 * Shared MuteBites app-icon: the mascot mark centred on ivory — used by
 * every generated icon route (app/icons/*, app/apple-icon.tsx) so the
 * source image only ever needs updating in one place.
 */
export function appIconResponse({
  width,
  height,
  borderRadius = 0,
  markScale = 0.84,
}: {
  width: number;
  height: number;
  /** 0 (default) for full-bleed icons — maskable/apple-touch icons where the OS applies its own mask. */
  borderRadius?: number;
  /**
   * Mark width as a fraction of the icon. Maskable icons must keep the
   * whole mark inside the central 80%-diameter circle Android may crop to,
   * which for this mark's aspect means about 0.6.
   */
  markScale?: number;
}) {
  const markWidth = Math.round(width * markScale);
  const markHeight = Math.round(markWidth / MARK_ASPECT);
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
          background: IVORY,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_SRC} alt="" width={markWidth} height={markHeight} />
      </div>
    ),
    { width, height },
  );
}
