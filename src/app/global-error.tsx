"use client"; // Error boundaries must be Client Components

import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";
import "./globals.css";

// Last-resort boundary for errors in the root layout itself. It replaces
// the whole document, so it brings its own <html>/<body>, the global
// stylesheet (for the palette tokens) and the theme-init script (so a
// stored dark preference still applies). No web fonts — if the layout
// broke, the less this page depends on, the better. `retry`, not `reset`,
// in this Next.js version.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Something went wrong · MuteBites</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <p className="text-5xl font-bold">Oops.</p>
        <h1 className="mt-4 text-2xl font-bold">MuteBites didn&apos;t load</h1>
        <p className="mt-2 max-w-[20rem] text-muted-foreground">
          Something broke on our side. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-8 h-14 rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
