import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { GoogleSignInButton } from "./google-sign-in-button";

// The page search engines land on (everything else needs sign-in), so it
// carries the full search title and a canonical address.
export const metadata: Metadata = {
  title: SITE_TITLE,
  alternates: { canonical: "/login" },
};

// Tells Google who College Bites is (name, logo, site) — structured data only,
// nothing visible.
const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512`,
      description: SITE_DESCRIPTION,
      areaServed: "SRM University AP, Amaravati, Andhra Pradesh, India",
    },
    { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  ],
}).replace(/</g, "\\u003c");

/*
 * The first thing a student sees, so it leads with the real food rather
 * than an empty cream screen: a tilted mosaic of actual menu photos (one
 * or more from every partner kitchen) that fades into the page. Three
 * columns, the middle one dropped half a tile, so it reads as a spread
 * rather than a grid. The mosaic takes whatever height the text block
 * doesn't need (flex-1), so a tall phone gets more food, not a gap above
 * the button. Purely decorative — aria-hidden, empty alts.
 */
const MOSAIC: string[][] = [
  [
    "/photos/dishes/mixed-chicken-biryani.jpg",
    "/photos/dishes/chilli-chicken.jpg",
    "/photos/dishes/chicken-noodles.jpg",
    "/photos/dishes/paneer-majestic.jpg",
  ],
  [
    "/photos/dishes/paneer-65.jpg",
    "/photos/dishes/chicken-dum-biryani.jpg",
    "/photos/dishes/chicken-lollipop.jpg",
    "/photos/dishes/paneer-fried-rice.jpg",
  ],
  [
    "/photos/dishes/chicken-65.jpg",
    "/photos/dishes/veg-manchurian-noodles.jpg",
    "/photos/dishes/gongura-chicken-biryani.jpg",
    "/photos/dishes/egg-manchurian.jpg",
  ],
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      <div aria-hidden="true" className="relative min-h-44 flex-1 overflow-hidden">
        <div className="absolute -inset-x-12 -top-16 grid -rotate-6 grid-cols-3 gap-3">
          {MOSAIC.map((column, c) => (
            <div key={c} className={c === 1 ? "flex flex-col gap-3 pt-16" : "flex flex-col gap-3"}>
              {column.map((src, row) => (
                <div
                  key={src}
                  className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-secondary shadow-card"
                >
                  {/* The top two rows are what's on screen at load (and hold
                      the LCP image), so they skip lazy-loading. */}
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 448px) 36vw, 160px"
                    loading={row < 2 ? "eager" : "lazy"}
                    fetchPriority={row < 2 ? "high" : undefined}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/30 to-background" />
      </div>

      <div className="relative -mt-24 flex flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <BrandLogo
          preload
          splashTarget
          className="animate-pop-in size-20 rounded-3xl shadow-raised ring-4 ring-background"
        />

        <h1
          className="animate-slide-up-in mt-6 font-heading text-display font-bold"
          style={{ animationDelay: "90ms" }}
        >
          Crave. Click.
          <br />
          Campus.
        </h1>
        <p
          className="animate-slide-up-in mt-3 max-w-[22rem] text-base text-muted-foreground"
          style={{ animationDelay: "130ms" }}
        >
          Your campus food delivery partner. Multiple restaurants, one place — delivered to you
          at Gate 3. Pay when you collect.
        </p>

        <div
          className="animate-slide-up-in mt-8 w-full"
          style={{ animationDelay: "170ms" }}
        >
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-center text-sm text-brand-soft-foreground"
            >
              Sign-in didn&apos;t go through — give it another shot.
            </p>
          )}
          <GoogleSignInButton />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
