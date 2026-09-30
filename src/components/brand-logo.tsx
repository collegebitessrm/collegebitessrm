import Image from "next/image";
import { MARK_NAVY } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/**
 * The College Bites mark: the logo's navy icon tile (scooter, campus, grad
 * cap), cut from the client's logo by scripts/build-brand-assets.mjs. The
 * box behind it is the tile's own navy, so callers can size and round it
 * however they like and it still reads as one tile in both themes. The
 * full logo's wordmark and tagline only appear as live text (splash,
 * share card), where they're big enough to read. On the dusk ground the
 * navy tile would sink into the page (1.4:1), so dark mode lights its
 * edge and gives it a soft neon glow.
 */
export function BrandLogo({ className, preload }: { className?: string; preload?: boolean }) {
  return (
    <div
      className={cn(
        "flex size-36 items-center justify-center overflow-hidden rounded-[2rem] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_10px_28px_-10px_var(--glow-neon)]",
        className,
      )}
      style={{ backgroundColor: MARK_NAVY }}
    >
      <Image
        src="/brand/mark.webp"
        alt="College Bites — Crave. Click. Campus."
        width={512}
        height={512}
        sizes="144px"
        preload={preload}
        className="size-full object-contain"
      />
    </div>
  );
}
