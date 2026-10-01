import { BrandLogo } from "@/components/brand-logo";
import { ThemeMotif } from "@/components/theme/theme-motif";

/**
 * Home's promo: the campus promise in one short line and one plain
 * sentence on a lit hero card, with the logo's scooter tile floating
 * over the palette's own motif on the right (ThemeMotif: Vice's striped
 * sun, Sunrise's rising sun, Hub's orbits, Kaapi's tumbler).
 */
export function PromoCard() {
  return (
    <div className="surface-hero glow-sun relative mt-5 overflow-hidden rounded-[1.75rem] bg-hero p-5 pr-34 text-hero-foreground">
      <ThemeMotif className="-right-6 -bottom-12 size-40" />
      <BrandLogo className="animate-float absolute top-1/2 right-5 size-22 -translate-y-1/2 rotate-6 rounded-[1.4rem] shadow-raised ring-4 ring-white/35" />
      <p className="font-heading text-title leading-tight font-bold">Hot food, at Gate 3</p>
      <p className="mt-1.5 text-sm font-medium">Order here, pay when you collect.</p>
    </div>
  );
}
