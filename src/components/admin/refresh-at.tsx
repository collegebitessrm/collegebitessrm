"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the page once `at` (epoch ms) passes — the dashboard uses it
 * so finished orders move off "Current orders" the moment their delivery
 * time passes, without the admin reloading.
 */
export function RefreshAt({ at }: { at: number | null }) {
 const router = useRouter();
 useEffect(() => {
 if (at === null) return;
 // +1 s so the server's own clock is past the boundary too.
 const timeout = setTimeout(() => router.refresh(), Math.max(0, at - Date.now()) + 1000);
 return () => clearTimeout(timeout);
 }, [at, router]);
 return null;
}
