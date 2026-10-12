"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Loader2, X } from "@/components/icons";
import { enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";

const DISMISSED_KEY = "collegebites.notify-asked";

/**
 * The one-time offer on the order tracking page: turn on notifications so
 * the student doesn't have to keep the page open to learn their food is
 * ready. Shown only while an order is still on its way, only when this
 * browser could actually deliver one, and never again once it's been
 * dismissed or accepted (remembered per device, like the rating prompt).
 */
export function NotifyMeCard() {
 const [show, setShow] = useState(false);
 const [pending, startTransition] = useTransition();

 useEffect(() => {
 if (pushState() !== "default") return;
 try {
 if (localStorage.getItem(DISMISSED_KEY)) return;
 } catch {
 // Storage unavailable — offering it again next time is fine.
 }
 hasPushSubscription().then((has) => setShow(!has));
 }, []);

 function remember() {
 try {
 localStorage.setItem(DISMISSED_KEY, "1");
 } catch {
 // Same as above: worst case, it's offered again.
 }
 }

 function enable() {
 startTransition(async () => {
 const result = await enablePush();
 remember();
 if (result.ok) {
 setShow(false);
 toast.success("We'll ping you when it's confirmed.");
 } else {
 toast.error(result.error);
 }
 });
 }

 if (!show) return null;

 return (
 <div className="animate-slide-up-in mt-4 flex items-center gap-3 rounded-[1.5rem] border bg-card p-4 shadow-card">
 <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
 <Bell className="text-primary size-5" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <p className="font-semibold">Get a ping when it&apos;s ready</p>
 <p className="text-sm text-muted-foreground">No need to keep this page open.</p>
 </div>
 <button
 type="button"
 onClick={enable}
 disabled={pending}
 className=" flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
 >
 {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
 Turn on
 </button>
 <button
 type="button"
 onClick={() => {
 remember();
 setShow(false);
 }}
 aria-label="Not now"
 className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/80"
 >
 <X className="size-4" aria-hidden="true" />
 </button>
 </div>
 );
}
