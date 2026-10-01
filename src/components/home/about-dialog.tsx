"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThemeMotif } from "@/components/theme/theme-motif";

/** Tapping the Home logo pops up a short "what is this app" card — mostly for first-time visitors poking around. */
export function AboutDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="About College Bites"
        className="pressable rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        {children}
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center overflow-hidden text-center">
        {/* A strip of the palette's hero with its motif, the logo rising out of it. */}
        <div aria-hidden="true" className="surface-hero relative -mx-6 -mt-6 h-24 self-stretch overflow-hidden">
          <ThemeMotif className="-bottom-16 left-1/2 size-40 -translate-x-1/2" />
        </div>
        <BrandLogo className="relative -mt-10 size-18 rounded-[1.4rem] shadow-raised ring-4 ring-popover" />
        <DialogTitle className="mt-3 text-title">College Bites</DialogTitle>
        <p className="text-sm font-bold text-primary">Crave. Click. Campus.</p>
        <DialogDescription className="mt-3 leading-relaxed">
          Biryani, fried rice, noodles and starters, veg and non-veg, from partner kitchens
          near SRM AP. Order here, collect at Gate 3.
        </DialogDescription>
        <ul className="mt-4 flex flex-wrap justify-center gap-1.5 text-xs font-semibold">
          <li className="rounded-full bg-secondary px-2.5 py-1">Pickup at Gate 3</li>
          <li className="rounded-full bg-secondary px-2.5 py-1">Pay on delivery, cash or UPI</li>
        </ul>
        <p className="mt-4 text-label text-primary">Order in a minute · Collect at Gate 3</p>
        <p className="mt-4 text-xs text-muted-foreground">~ college bites · srm ap</p>
      </DialogContent>
    </Dialog>
  );
}
