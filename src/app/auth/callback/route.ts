import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google redirects here (via Supabase) with a one-time `code`. Swap it for a
// session cookie, then send the user on. Whether they still need the
// first-login form is decided by the app, not here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // ?signedIn=1 triggers the "Glad to have you back!" toast on Home —
      // but only for returning users; a first-timer gets redirected to
      // /welcome before ever rendering it, so the toast never fires for them.
      return NextResponse.redirect(`${origin}/?signedIn=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
