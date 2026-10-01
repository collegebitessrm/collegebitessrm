import { BrandLogo } from "@/components/brand-logo";
import { MapPin } from "@/components/icons";
import { ThemeMotif } from "@/components/theme/theme-motif";

/**
 * Home's promo: the campus promise in one lit hero card — fast delivery,
 * free to Gate 3, pay on delivery — with the logo's scooter tile floating
 * over the palette's own motif on the right (ThemeMotif: Vice's striped
 * sun, Sunrise's rising sun, Hub's orbits, Kaapi's tumbler).
 */
export function PromoCard() {
  return (
    <div className="surface-hero glow-sun relative mt-5 overflow-hidden rounded-[1.75rem] bg-hero p-5 pr-34 text-hero-foreground">
      <ThemeMotif className="-right-6 -bottom-12 size-40" />
      <BrandLogo className="animate-float absolute top-1/2 right-5 size-22 -translate-y-1/2 rotate-6 rounded-[1.4rem] shadow-raised ring-4 ring-white/35" />
      <p className="text-sm font-semibold">Free delivery · pay on delivery</p>
      <p className="mt-1 font-heading text-title leading-tight font-bold">Fast delivery across campus</p>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-hero-foreground/85">
        <MapPin className="size-4 shrink-0" />
        Handed over at Gate 3
      </p>
    </div>
  );
}
