import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Banknote, MapPin } from "@/components/icons";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { GoogleSignInButton } from "./google-sign-in-button";
import { LoginScene } from "./login-scene";

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
 * The first thing a student sees: a Vice City sunset (LoginScene — sun,
 * sea, palms and real dishes floating in the sky) with a frosted sheet
 * rising over the bottom of it, carrying the logo, the tagline in the
 * sunset gradient, the two facts that matter (free delivery to Gate 3,
 * pay on delivery) and the one action. The scene takes whatever height
 * the sheet doesn't need, so a tall phone gets more sky, not a gap.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="login-scene relative flex w-full flex-1 flex-col overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
      <LoginScene />

      <section className="relative z-10 -mt-10 w-full sm:px-4">
        <div className="mx-auto w-full max-w-md rounded-t-[2rem] border border-b-0 bg-card/85 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-overlay backdrop-blur-xl sm:mb-8 sm:rounded-[2rem] sm:border-b">
          <div className="flex items-end gap-3.5">
            <BrandLogo
              preload
              className="login-rise -mt-9 size-18 shrink-0 rounded-[1.4rem] shadow-raised ring-4 ring-card"
            />
            <div className="login-rise min-w-0 pb-1" style={{ "--rise-delay": "0.38s" } as CSSProperties}>
              <p className="font-heading text-xl leading-none font-bold">College Bites</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Campus food, delivered to the gate</p>
            </div>
          </div>

          <h1
            className="login-rise mt-5 font-heading text-display font-bold text-sunset"
            style={{ "--rise-delay": "0.46s" } as CSSProperties}
          >
            Crave. Click.
            <br />
            Campus.
          </h1>
          <p
            className="login-rise mt-2.5 max-w-[22rem] text-muted-foreground"
            style={{ "--rise-delay": "0.54s" } as CSSProperties}
          >
            Your campus food delivery partner. Multiple restaurants, one place — delivered to you
            at Gate 3.
          </p>

          <ul
            className="login-rise mt-4 flex flex-wrap gap-2 text-sm font-medium"
            style={{ "--rise-delay": "0.62s" } as CSSProperties}
          >
            <li className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/70 px-3 py-1.5">
              <MapPin className="icon-tint-primary size-4 shrink-0 text-aqua" />
              Free delivery to Gate 3
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/70 px-3 py-1.5">
              <Banknote className="icon-tint-gold size-4 shrink-0 text-aqua" />
              Pay on delivery — cash or UPI
            </li>
          </ul>

          <div className="login-rise mt-6 w-full" style={{ "--rise-delay": "0.7s" } as CSSProperties}>
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-pink-soft px-4 py-3 text-center text-sm text-pink-soft-foreground"
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
      </section>
    </main>
  );
}
