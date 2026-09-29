"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast/store";

/**
 * Fires "Glad to have you back!" once, right after a sign-in redirect from
 * /auth/callback — same message shown when declining the sign-out dialog.
 * Only reaches a returning user: a first-timer gets redirected to /welcome
 * (by requireProfile(), before Home ever renders this) instead.
 */
export function SignInWelcomeToast({ justSignedIn }: { justSignedIn: boolean }) {
  const router = useRouter();
  // Captured once, on mount — not the live prop — same reasoning as
  // order-tracking.tsx's justPlaced: router.replace() below triggers a
  // fresh server render with justSignedIn now false, and depending on the
  // live prop would tear down this effect before the toast fires.
  const [shown] = useState(justSignedIn);

  useEffect(() => {
    if (!shown) return;
    // Strip ?signedIn=1 right away so a refresh doesn't replay the toast.
    router.replace("/");
    toast.success("Glad to have you back!");
  }, [shown, router]);

  return null;
}
