import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { PHOTO_CREDITS } from "@/lib/data/photo-credits";

export const metadata: Metadata = { title: "Terms of Service · College Bites" };

export default function TermsPage() {
 return (
 <main className="mx-auto w-full max-w-md px-6 py-12">
 <Link href="/" className="inline-flex items-center gap-2.5">
 <BrandLogo className="size-10 rounded-xl" />
 <span className="font-heading text-lg font-bold">College Bites</span>
 </Link>

 <h1 className="mt-8 font-heading text-headline font-bold">Terms of Service</h1>

 <div className="mt-6 flex flex-col gap-4 leading-relaxed text-muted-foreground">
 <p>
 College Bites is a food ordering platform for SRM University AP students, connecting
 students with local partner restaurants.
 </p>
 <p>Payment is on delivery only, by cash or UPI when you collect; nothing is paid in the app. Orders are handed over at Gate 3, SRM University AP.</p>
 <p>
 By using this service you agree to provide accurate contact information and be present
 for pickup at the agreed time.
 </p>
 <p>College Bites reserves the right to restrict access for repeated no-shows or misuse.</p>
 </div>

 <h2 className="mt-10 font-heading text-title font-bold">Photo credits</h2>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Some dish photos are openly licensed photos by these photographers, resized for the app.
 They show the kind of dish, not the restaurant&apos;s own plate.
 </p>
 <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-snug text-muted-foreground">
 {PHOTO_CREDITS.map((c) => (
 <li key={c.photo}>
 <span className="font-semibold text-foreground">{c.photo}</span>:{" "}
 <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
 photo
 </a>{" "}
 by {c.creator},{" "}
 <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="text-primary hover:underline">
 {c.license}
 </a>
 </li>
 ))}
 </ul>

 <Link
 href="/"
 className="mt-10 inline-block font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
 >
 ← Back to College Bites
 </Link>
 </main>
 );
}
