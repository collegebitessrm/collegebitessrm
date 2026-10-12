import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { TabBar } from "@/components/nav/tab-bar";
import { AppSplash } from "@/components/splash/app-splash";
import { SPLASH_DISABLED } from "@/components/splash/config";
import { SPLASH_INIT_SCRIPT } from "@/components/splash/init-script";
import { Toaster } from "@/components/toast/toaster";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";
import "./globals.css";

// Body and buttons. Variable, so every weight comes from one file.
const inter = Inter({
 variable: "--font-inter",
 subsets: ["latin"],
});

// Display text and big numbers (the brand sheet's heading face). Poppins
// isn't a variable font, so only the weights the app actually uses load:
// 700 for headings, 600/500 for the few softer display lines.
const poppins = Poppins({
 variable: "--font-poppins",
 subsets: ["latin"],
 weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
 // Makes every relative URL below (and the generated share image) absolute.
 metadataBase: new URL(SITE_URL),
 title: SITE_NAME,
 description: SITE_DESCRIPTION,
 applicationName: SITE_NAME,
 keywords: [
 "College Bites",
 "SRM AP food delivery",
 "SRM University AP",
 "Amaravati food delivery",
 "campus food delivery",
 "biryani delivery SRM AP",
 ],
 // Link previews (WhatsApp, Instagram, Google). The image comes from
 // app/opengraph-image.tsx and is attached automatically.
 openGraph: {
 type: "website",
 siteName: SITE_NAME,
 title: SITE_TITLE,
 description: SITE_DESCRIPTION,
 url: "/",
 locale: "en_IN",
 },
 twitter: {
 card: "summary_large_image",
 title: SITE_TITLE,
 description: SITE_DESCRIPTION,
 },
 // Google Search Console ownership check — set the token as an env var in
 // Vercel; nothing is emitted while it's unset.
 verification: process.env.GOOGLE_SITE_VERIFICATION
 ? { google: process.env.GOOGLE_SITE_VERIFICATION }
 : undefined,
 appleWebApp: {
 capable: true,
 title: "College Bites",
 statusBarStyle: "default",
 },
};

export const viewport: Viewport = {
 // The default palette's (Electric Sunrise) --background, keyed on the OS
 // scheme. The theme-init script (and later src/lib/theme/store.ts)
 // retargets both to the chosen palette and Light/Dark before first paint.
 themeColor: [
 { media: "(prefers-color-scheme: light)", color: "#ffffff" },
 { media: "(prefers-color-scheme: dark)", color: "#1c1c1c" },
 ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
 return (
 <html
 lang="en"
 // The theme-init script (and later, the theme store) can add the
 // "dark" class / colorScheme style and data-palette, and the splash-init script
 // data-splash, before React hydrates — expected, not a real mismatch.
 suppressHydrationWarning
 className={`${inter.variable} ${poppins.variable} h-full antialiased`}
 >
 <body className="min-h-full flex flex-col">
 {/* Raw inline <script>, not next/script: beforeInteractive inline
 scripts are queued (self.__next_s) until Next's own JS loads, so
 a dark-mode user would see a flash of the light theme first.
 This runs as the parser reaches it, before anything is painted. */}
 <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
 {!SPLASH_DISABLED && (
 <>
 {/* A plain inline <script>, not next/script: beforeInteractive
 inline scripts are queued (self.__next_s) until Next's own JS
 loads, so the app would paint first and the splash would pop
 in over it. This runs as the parser reaches it — before
 anything below is painted. */}
 <script id="splash-init" dangerouslySetInnerHTML={{ __html: SPLASH_INIT_SCRIPT }} />
 {/* Right after, so it's in the first streamed chunk. */}
 <AppSplash />
 </>
 )}
 {children}
 {/* The student bottom bar: here rather than in each page so it stays
 mounted and its pill can slide between tabs. It decides for
 itself where it shows (TabBar). */}
 <TabBar />
 <Toaster />
 </body>
 </html>
 );
}
