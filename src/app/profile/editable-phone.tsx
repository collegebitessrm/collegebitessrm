"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatLocalMobile, formatStoredMobile, normalizeIndianMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { updatePhone, type FieldActionState } from "./actions";

const eyebrow = "text-label text-muted-foreground";

export function EditablePhone({
  initialValue,
  lockedReason,
  banned,
}: {
  initialValue: string;
  /** Set (by the page) whenever editing should be blocked; null means editable. */
  lockedReason: string | null;
  /** Distinguishes the banned (permanent, urgent) lock from the active-order (temporary) one. */
  banned: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [state, formAction, pending] = useActionState<FieldActionState, FormData>(
    async (_prev, formData) => {
      const result = await updatePhone(_prev, formData);
      if (!result.error) {
        const normalized = normalizeIndianMobile(String(formData.get("phone") ?? ""));
        if (normalized) setValue(normalized);
        setEditing(false);
        toast.success("Got it — your number's updated.");
      } else {
        toast.error(result.error);
      }
      return result;
    },
    {},
  );

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className={eyebrow}>Mobile number</p>
          <p className="mt-0.5 font-semibold tabular-nums">{formatStoredMobile(value)}</p>
          {lockedReason && (
            <p className={cn("mt-1 text-sm", banned ? "text-destructive" : "text-muted-foreground")}>
              {lockedReason}
            </p>
          )}
        </div>
        {!lockedReason && (
          <button
            type="button"
            onClick={() => {
              setDraft(formatLocalMobile(value.replace(/^\+91/, "")));
              setEditing(true);
            }}
            className="shrink-0 rounded-md font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-brand-soft px-5 py-4">
      <p className={cn(eyebrow, "text-brand-soft-foreground")}>Mobile number · editing</p>
      <div className="mt-2 flex gap-2">
        <div
          className={cn(
            "flex h-11 min-w-0 flex-1 items-center rounded-xl border bg-background focus-within:border-ring",
            state.error && "border-destructive",
          )}
        >
          <span className="pl-3 text-muted-foreground">+91</span>
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(formatLocalMobile(e.target.value))}
            aria-invalid={!!state.error || undefined}
            aria-describedby="phone-error-hint"
            className="h-full min-w-0 flex-1 bg-transparent pr-3 tabular-nums outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </button>
      </div>
      <p
        id="phone-error-hint"
        className={cn("mt-1.5 text-sm", state.error ? "text-destructive" : "text-muted-foreground")}
      >
        {state.error ?? "Used to call you at the handover point."}
      </p>
      {!state.error && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-1 text-sm font-medium text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
