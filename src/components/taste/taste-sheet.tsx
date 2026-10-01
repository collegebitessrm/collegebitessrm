"use client";

import { useState, useTransition, type ReactNode } from "react";
import { BlurImage } from "@/components/blur-image";
import { Check, Heart, Loader2, Pepper, X } from "@/components/icons";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { saveTasteProfile } from "@/lib/taste/actions";
import { AVATARS, CRAVINGS, DIETS, SPICE_LEVELS, type TasteProfile } from "@/lib/taste/options";
import { openTasteSheet, setTasteSheetOpen, snoozeTasteNudge, useTasteSheetOpen } from "@/lib/taste/sheet-store";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

const label = "text-label text-muted-foreground";

/** Any button that opens the "Your taste" sheet (the page renders one <TasteSheetHost/>). */
export function OpenTasteSheetButton({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button type="button" aria-label={ariaLabel} onClick={openTasteSheet} className={className}>
      {children}
    </button>
  );
}

/**
 * The "Your taste" bottom sheet: avatar, spice level, diet and cravings,
 * saved in one go (saveTasteProfile). One per page — Home and Profile —
 * opened through the sheet store. Every open starts from what's saved.
 */
export function TasteSheetHost({ taste, fromHearts = [] }: { taste: TasteProfile; fromHearts?: string[] }) {
  const open = useTasteSheetOpen();
  // A fresh form each time it opens (adjusting state during render, so the
  // closing animation still shows the old content).
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((s) => s + 1);
  }

  return (
    <Sheet open={open} onOpenChange={setTasteSheetOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
      >
        <TasteForm key={session} taste={taste} fromHearts={fromHearts} />
      </SheetContent>
    </Sheet>
  );
}

function TasteForm({ taste, fromHearts }: { taste: TasteProfile; fromHearts: string[] }) {
  const [draft, setDraft] = useState<TasteProfile>(taste);
  // Until they've picked cravings, mark the food types their hearted dishes
  // point to — a hint only, nothing is selected for them.
  const hinted = taste.cravings.length === 0 ? fromHearts : [];
  const [pending, startTransition] = useTransition();
  const spice = SPICE_LEVELS.find((s) => s.level === draft.spiceLevel);

  function toggleCraving(key: string) {
    setDraft((d) => ({
      ...d,
      cravings: d.cravings.includes(key) ? d.cravings.filter((k) => k !== key) : [...d.cravings, key],
    }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveTasteProfile(draft);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved. Your profile's up to date.");
      // Don't nudge again straight after they've just been in here.
      snoozeTasteNudge();
      setTasteSheetOpen(false);
    });
  }

  return (
    <>
      <header className="flex items-start gap-3 border-b px-6 pt-6 pb-4">
        <div className="min-w-0 flex-1">
          <SheetTitle className="font-heading text-headline font-bold">Your taste</SheetTitle>
          <SheetDescription className="mt-0.5 text-base">
            Helps us show food you&apos;ll like. Only you can see it.
          </SheetDescription>
        </div>
        <button
          type="button"
          onClick={() => setTasteSheetOpen(false)}
          aria-label="Close"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-6">
        <p className={label}>Your avatar</p>
        <div role="radiogroup" aria-label="Avatar" className="mt-2.5 grid grid-cols-4 gap-3">
          {AVATARS.map((a) => {
            const selected = draft.avatar === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={a.label}
                onClick={() => setDraft((d) => ({ ...d, avatar: a.id }))}
                className={cn(
                  "relative mx-auto flex size-14 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                  selected && "ring-3 ring-chip-active ring-offset-2 ring-offset-background",
                )}
              >
                <Avatar id={a.id} className="size-full" />
                {selected && <SelectedTick />}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex items-baseline justify-between gap-3">
          <p className={label}>How spicy do you like it?</p>
          <p className="text-sm font-semibold" aria-hidden="true">
            {spice?.label ?? "Not set"}
          </p>
        </div>
        <div role="radiogroup" aria-label="Spice level" className="mt-2.5 grid grid-cols-5 gap-2">
          {SPICE_LEVELS.map((s) => {
            const lit = (draft.spiceLevel ?? 0) >= s.level;
            return (
              <button
                key={s.level}
                type="button"
                role="radio"
                aria-checked={draft.spiceLevel === s.level}
                aria-label={`${s.level}, ${s.label}`}
                onClick={() => setDraft((d) => ({ ...d, spiceLevel: s.level }))}
                className={cn(
                  "flex h-12 items-center justify-center rounded-2xl border outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                  lit ? "border-transparent bg-pink-soft text-pink-soft-foreground" : "bg-card text-muted-foreground",
                )}
              >
                <Pepper className={cn("size-6", lit && "icon-solid")} />
              </button>
            );
          })}
        </div>

        <p className={cn(label, "mt-7")}>Your diet</p>
        <div role="radiogroup" aria-label="Diet" className="mt-2.5 flex flex-wrap gap-2">
          {DIETS.map((d) => {
            const selected = draft.diet === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDraft((x) => ({ ...x, diet: d.id }))}
                className={cn(
                  "h-11 rounded-full px-5 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                  selected ? "glow-cyan bg-chip-active text-chip-active-foreground" : "border bg-card",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex items-baseline justify-between gap-3">
          <p className={label}>What do you crave most?</p>
          <p className="text-sm text-muted-foreground">Pick any</p>
        </div>
        <ul className="mt-2.5 grid grid-cols-4 gap-x-2 gap-y-3">
          {CRAVINGS.map((c) => {
            const selected = draft.cravings.includes(c.key);
            const fromHeart = !selected && hinted.includes(c.key);
            return (
              <li key={c.key}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCraving(c.key)}
                  className="group flex w-full flex-col items-center gap-1.5 rounded-2xl outline-none"
                >
                  <span
                    className={cn(
                      "relative block size-14 rounded-full group-focus-visible:ring-3 group-focus-visible:ring-ring/80",
                      selected && "ring-3 ring-chip-active ring-offset-2 ring-offset-background",
                    )}
                  >
                    <span className="relative block size-full overflow-hidden rounded-full bg-secondary">
                      <BlurImage src={c.photo} alt="" sizes="56px" className="object-cover" />
                    </span>
                    {selected && <SelectedTick />}
                    {fromHeart && (
                      <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-card text-primary shadow-card ring-2 ring-background">
                        <Heart weight="fill" className="size-3" />
                      </span>
                    )}
                  </span>
                  <span className={cn("text-xs leading-tight font-semibold", selected && "text-primary")}>
                    {c.label}
                    {fromHeart && <span className="sr-only">, from your hearts</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {hinted.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Heart weight="fill" className="size-3.5 shrink-0 text-primary" />
            From your hearts: dishes you liked point to these.
          </p>
        )}
      </div>

      <footer className="border-t bg-background px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="surface-primary glow-neon flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
        >
          {pending && <Loader2 className="size-5 animate-spin" />}
          {pending ? "Saving…" : "Save"}
        </button>
      </footer>
    </>
  );
}

function SelectedTick() {
  return (
    <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-chip-active text-chip-active-foreground ring-2 ring-background">
      <Check className="size-3" />
    </span>
  );
}
