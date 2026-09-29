"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
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
            "animate-toast-in flex max-w-sm items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl",
            t.kind === "error" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
          )}
        >
          {t.kind === "error" ? (
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
