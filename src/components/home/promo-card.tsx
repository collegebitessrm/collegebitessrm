import { BrandLogo } from "@/components/brand-logo";
import { MapPin } from "@/components/icons";

/**
 * Home's sunset promo: the campus promise in one lit card — fast delivery,
 * free to Gate 3, pay on delivery — with the logo's scooter tile floating
 * over a striped retro sun on the right (the sign-in page's sun, small).
 */
export function PromoCard() {
  return (
    <div className="surface-hero glow-sun relative mt-5 overflow-hidden rounded-[1.75rem] bg-hero p-5 pr-34 text-hero-foreground">
      <div aria-hidden="true" className="promo-sun absolute -right-6 -bottom-12 size-40 rounded-full" />
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
