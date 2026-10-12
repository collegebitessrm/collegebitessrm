"use client";

import { useActionState, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Loader2, MapPin } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PalettePicker } from "@/components/theme/palette-picker";
import { ThemeIconToggle } from "@/components/theme/theme-icon-toggle";
import { formatLocalMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { createProfile, type WelcomeFormState } from "./actions";

const eyebrow =
 "text-label text-muted-foreground";

export function WelcomeForm({ defaultName }: { defaultName: string }) {
 const [state, formAction, pending] = useActionState<WelcomeFormState, FormData>(
 async (prev, formData) => {
 const result = await createProfile(prev, formData);
 if (result.formError) toast.error(result.formError);
 return result;
 },
 {},
 );
 // Controlled so values survive a failed submit (React resets forms after actions).
 const [fullName, setFullName] = useState(defaultName);
 const [phone, setPhone] = useState("");

 const nameError = state.fieldErrors?.fullName;
 const phoneError = state.fieldErrors?.phone;

 return (
 <form action={formAction} className="flex flex-1 flex-col" noValidate>
 <div className="flex-1 px-6 pt-6 pb-8">
 {/* The same sunset as the sign-in sky, as one lit card. */}
 <header className="animate-slide-up-in bg-primary relative overflow-hidden rounded-[2rem] bg-primary p-5 text-primary-foreground">
 <div
 aria-hidden="true"
 className="absolute -top-10 -right-8 size-36 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.45),transparent)]"
 />
 <BrandLogo className="relative size-14 rounded-2xl shadow-raised ring-2 ring-hero-foreground/15" />
 <h1 className="relative mt-4 font-heading text-display font-bold">Almost there</h1>
 <p className="relative mt-1.5 text-lg leading-snug text-primary-foreground/85">
 We only ask once, then you go straight to the food.
 </p>
 </header>

 <div className="mt-8 flex flex-col gap-2.5">
 <Label htmlFor="fullName" className={eyebrow}>
 Full name
 </Label>
 <Input
 id="fullName"
 name="fullName"
 autoComplete="name"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 aria-invalid={!!nameError || undefined}
 aria-describedby={nameError ? "fullName-error" : undefined}
 className="h-14 rounded-2xl bg-card px-4 text-lg shadow-card md:text-lg"
 />
 {nameError && (
 <p id="fullName-error" className="text-sm text-destructive">
 {nameError}
 </p>
 )}
 </div>

 <div className="mt-6 flex flex-col gap-2.5">
 <Label htmlFor="phone" className={eyebrow}>
 Mobile number
 </Label>
 <div
 className={cn(
 "flex h-14 items-center rounded-2xl border border-input bg-card shadow-card transition-[color,box-shadow,border-color] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/80",
 phoneError &&
 "border-destructive ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20",
 )}
 >
 <span className="pl-4 text-lg text-muted-foreground">+91</span>
 <span className="mx-3 h-7 w-px bg-border" aria-hidden="true" />
 <input
 id="phone"
 name="phone"
 type="tel"
 inputMode="numeric"
 autoComplete="tel-national"
 placeholder="98765 43210"
 value={phone}
 onChange={(e) => setPhone(formatLocalMobile(e.target.value))}
 aria-invalid={!!phoneError || undefined}
 aria-describedby="phone-hint"
 className="h-full min-w-0 flex-1 rounded-r-2xl bg-transparent pr-4 text-lg tracking-wide outline-none placeholder:text-muted-foreground"
 />
 </div>
 <p
 id="phone-hint"
 className={cn("text-[0.95rem]", phoneError ? "text-destructive" : "text-muted-foreground")}
 >
 {phoneError ??
 "Required. The delivery person calls this at the gate. Make sure this is your WhatsApp number."}
 </p>
 </div>

 {/* Per device and instant (localStorage, like Light/Dark), so it's not
 part of the form: the page itself recolours as they tap. */}
 <div className="mt-8">
 <div className="flex items-center justify-between gap-3">
 <div className="min-w-0">
 <p className={eyebrow}>
 Pick a theme
 </p>
 <p className="mt-0.5 text-sm text-muted-foreground">Change it any time in Profile.</p>
 </div>
 <ThemeIconToggle />
 </div>
 <PalettePicker className="mt-3.5" />
 </div>

 <p className="mt-8 flex gap-3 rounded-2xl border border-pink-soft-foreground/15 bg-secondary px-5 py-4 leading-relaxed text-foreground">
 <MapPin className="text-primary mt-0.5 size-5 shrink-0" />
 <span>
 All orders are handed over at{" "}
 <strong className="font-semibold">Gate 3</strong>, never at your room. Pay on
 delivery, cash or UPI.
 </span>
 </p>
 </div>

 <div className="sticky bottom-0 border-t bg-background/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
 <Button
 type="submit"
 disabled={pending}
 className=" h-14 w-full rounded-full text-lg font-semibold"
 >
 {pending && <Loader2 className="size-5 animate-spin" />}
 {pending ? "Saving…" : "Save & start ordering"}
 </Button>
 </div>
 </form>
 );
}
