"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
      <DialogContent className="flex flex-col items-center text-center">
        <BrandLogo className="size-16 rounded-2xl" />
        <DialogTitle className="mt-4">College Bites</DialogTitle>
        <p className="text-sm font-semibold text-primary">Crave. Click. Campus.</p>
        <DialogDescription className="mt-3 leading-relaxed">
          Your campus food delivery partner. Multiple restaurants, one place, delivered to you —
          biryani, fried rice, noodles and starters, veg and non-veg, from real partner
          kitchens near SRM AP.
        </DialogDescription>
        <p className="mt-3 text-sm text-muted-foreground">
          Pay on delivery · Pickup at Gate 3
          <br />
          Pay through cash or UPI
        </p>
        <p className="mt-4 text-label text-primary">
          Fast · Reliable · Affordable
        </p>
        <p className="mt-4 text-xs text-muted-foreground">~ college bites · srm ap</p>
      </DialogContent>
    </Dialog>
  );
}
