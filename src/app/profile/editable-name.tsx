"use client";

import { useActionState, useState } from "react";
import { IconTile } from "@/components/icon-tile";
import { Loader2, User } from "@/components/icons";
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
      <div className="flex items-center gap-3 px-5 py-4">
        <IconTile>
          <User className="icon-tint-primary size-5" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className={eyebrow}>Full name</p>
          <p className="mt-0.5 truncate font-semibold">{value}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="shrink-0 rounded-full bg-pink-soft px-3.5 py-1.5 text-sm font-semibold text-pink-soft-foreground outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/80"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-pink-soft px-5 py-4">
      <p className={cn(eyebrow, "text-pink-soft-foreground")}>Full name · editing</p>
      <div className="mt-2 flex gap-2">
        <input
          name="fullName"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={!!state.error || undefined}
          aria-describedby={state.error ? "name-error" : undefined}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-full border border-input bg-card px-4 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/80",
            state.error && "border-destructive",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className="surface-primary flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 font-semibold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
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
