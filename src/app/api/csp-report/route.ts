/*
 * Receives Content-Security-Policy violation reports (report-uri in
 * next.config.ts) and writes a one-line summary to the server log, so a
 * blocked resource shows up in Vercel's logs instead of only in one
 * student's browser console. Stores nothing. Excluded from the sign-in
 * redirect in src/proxy.ts, since the login page reports signed out.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { "csp-report"?: Record<string, unknown> };
    const r = body["csp-report"] ?? {};
    console.warn(
      "[csp]",
      JSON.stringify({
        page: r["document-uri"],
        directive: r["violated-directive"] ?? r["effective-directive"],
        blocked: r["blocked-uri"],
        source: r["source-file"],
        line: r["line-number"],
      }),
    );
  } catch {
    // Malformed report — ignore.
  }
  return new Response(null, { status: 204 });
}
