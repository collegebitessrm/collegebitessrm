import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = { title: "Terms of Service · MuteBites" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <BrandLogo className="size-10 rounded-xl" />
        <span className="font-heading text-lg font-bold">MuteBites</span>
      </Link>

      <h1 className="mt-8 font-heading text-headline font-bold">Terms of Service</h1>

      <div className="mt-6 flex flex-col gap-4 leading-relaxed text-muted-foreground">
        <p>
          MuteBites is a food ordering platform for VIT-AP University students, connecting
          students with local partner restaurants.
        </p>
        <p>Payment is cash on delivery only. Orders are handed over at VIT-AP Main Gate.</p>
        <p>
          By using this service you agree to provide accurate contact information and be present
          for pickup at the agreed time.
        </p>
        <p>MuteBites reserves the right to restrict access for repeated no-shows or misuse.</p>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
      >
        ← Back to MuteBites
      </Link>
    </main>
  );
}
