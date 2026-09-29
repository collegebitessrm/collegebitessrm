"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { verifyAdminPasscode } from "@/lib/admin/passcode-actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * Shown once requireAdmin() has already passed (signed in, role = 'admin')
 * but this browser session hasn't entered the admin passcode yet — a
 * second check on top of the account/role gate, not instead of it.
 */
export function AdminPasscodeGate() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await verifyAdminPasscode(passcode);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-6">
      <div className="surface-ink flex size-14 items-center justify-center rounded-2xl bg-ink text-ink-foreground shadow-raised">
        <Lock className="size-6" />
      </div>
      <h1 className="mt-5 text-center font-heading text-headline font-bold">Admin passcode</h1>
      <p className="mt-1.5 text-center text-muted-foreground">
        Enter the admin passcode to continue — a second check on top of your account.
      </p>

      <form onSubmit={submit} className="mt-6 w-full">
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value);
            setError(null);
          }}
          placeholder="Passcode"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? "passcode-error" : undefined}
          className={cn(
            "h-14 w-full rounded-2xl border bg-card shadow-card px-5 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/80",
            error && "border-destructive",
          )}
        />
        {error && (
          <p id="passcode-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || passcode.length === 0}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
        >
          {pending && <Loader2 className="size-5 animate-spin" />}
          Continue
        </button>
      </form>
    </main>
  );
}
