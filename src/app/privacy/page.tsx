import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = { title: "Privacy Policy · College Bites" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <BrandLogo className="size-10 rounded-xl" />
        <span className="font-heading text-lg font-bold">College Bites</span>
      </Link>

      <h1 className="mt-8 font-heading text-headline font-bold">Privacy Policy</h1>

      <div className="mt-6 flex flex-col gap-4 leading-relaxed text-muted-foreground">
        <p>
          College Bites collects your name, phone number, and email (via Google sign-in) to process
          food orders for SRM University AP students.
        </p>
        <p>We don&apos;t sell or share this data with third parties.</p>
        <p>Orders are shared with partner restaurants to fulfill delivery.</p>
        <p>
          When you rate an order, your star ratings and optional note are stored with that order
          and seen only by the College Bites team, never by other students.
        </p>
        <p>
          If you turn on order notifications, we store the address your browser gives us for
          that device so we can send you order updates. Turning them off in Profile deletes it.
        </p>
        <p>
          Contact{" "}
          <a href="mailto:collegebitessrm@gmail.com" className="font-semibold text-primary hover:underline">
            collegebitessrm@gmail.com
          </a>{" "}
          with any questions.
        </p>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
      >
        ← Back to College Bites
      </Link>
    </main>
  );
}
