"use client";

import { AlertCircle, CheckCircle2 } from "@/components/icons";
import { useToasts } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/** Fixed top-of-screen stack of short "saved"/"error" pop-ups. Mounted once in the root layout. */
export function Toaster() {
 const toasts = useToasts();
 if (toasts.length === 0) return null;

 return (
 <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
 {toasts.map((t) => (
 <div
 key={t.id}
 role={t.kind === "error" ? "alert" : "status"}
 className={cn(
 "animate-toast-in flex max-w-sm items-center gap-2.5 rounded-full border bg-popover py-2 pr-4 pl-2 text-sm font-semibold text-popover-foreground shadow-overlay backdrop-blur",
 t.kind === "error" ? "border-destructive/30" : "border-success/30",
 )}
 >
 <span
 className={cn(
 "flex size-7 shrink-0 items-center justify-center rounded-full",
 t.kind === "error" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
 )}
 >
 {t.kind === "error" ? (
 <AlertCircle className="size-4" weight="bold" aria-hidden="true" />
 ) : (
 <CheckCircle2 className="size-4" weight="bold" aria-hidden="true" />
 )}
 </span>
 {t.message}
 </div>
 ))}
 </div>
 );
}
