import Image from "next/image";
import { MARK_TILE } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/**
 * The College Bites mark: the logo's indigo icon tile (scooter, campus, grad
 * cap), cut from the client's logo by scripts/build-brand-assets.mjs. The
 * box behind it is the tile's own indigo (MARK_TILE), so callers can size and round it
 * however they like and it still reads as one tile in both themes. The
 * full logo's wordmark and tagline only appear as live text (splash,
 * share card), where they're big enough to read. On every dark ground
 * (dusk, charcoal, navy, espresso) the indigo tile would sink into the
 * page, so dark mode lights its edge and gives it a soft neon glow.
 * `splashTarget` marks the one the startup splash's tile flies into as it
 * ends (Home header, sign-in page).
 */
export function BrandLogo({
 className,
 preload,
 splashTarget,
}: {
 className?: string;
 preload?: boolean;
 splashTarget?: boolean;
}) {
 return (
 <div
 data-splash-target={splashTarget ? "" : undefined}
 className={cn(
 "flex size-36 items-center justify-center overflow-hidden rounded-[2rem] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_10px_28px_-10px_var(--glow-neon)]",
 className,
 )}
 style={{ backgroundColor: MARK_TILE }}
 >
 <Image
 src="/brand/mark-v2-1.webp"
 alt="College Bites: Crave. Click. Campus."
 width={512}
 height={512}
 sizes="144px"
 preload={preload}
 className="size-full object-contain"
 />
 </div>
 );
}
