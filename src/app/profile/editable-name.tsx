"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { updateFullName, type FieldActionState } from "./actions";

const eyebrow = "text-label text-muted-foreground";

export function EditableName({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const [state, formAction, pending] = useActionState<FieldActionState, FormData>(
    async (_prev, formData) => {
      const result = await updateFullName(_prev, formData);
      if (!result.error) {
        setValue(String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " "));
        setEditing(false);
        toast.success("Got it — your name's updated.");
      } else {
        toast.error(result.error);
      }
      return result;
    },
    {},
  );

  if (!editing) {
    return (
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className={eyebrow}>Full name</p>
          <p className="mt-0.5 font-semibold">{value}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="rounded-md font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-brand-soft px-5 py-4">
      <p className={cn(eyebrow, "text-brand-soft-foreground")}>Full name · editing</p>
      <div className="mt-2 flex gap-2">
        <input
          name="fullName"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={!!state.error || undefined}
          aria-describedby={state.error ? "name-error" : undefined}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/80",
            state.error && "border-destructive",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </button>
      </div>
      {state.error ? (
        <p id="name-error" role="alert" className="mt-1.5 text-sm text-destructive">
          {state.error}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-1.5 text-sm font-medium text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
