"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Tapping the Home logo pops up a short "what is this app" card — mostly for first-time visitors poking around. */
export function AboutMuteBitesDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="About MuteBites"
        className="pressable rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        {children}
      </DialogTrigger>
      <DialogContent className="flex flex-col items-center text-center">
        <BrandLogo className="size-16 rounded-2xl" />
        <DialogTitle className="mt-4">MuteBites</DialogTitle>
        <p className="text-sm font-semibold text-primary">Good food. Campus mood.</p>
        <DialogDescription className="mt-3 leading-relaxed">
          Food delivery built for VIT-AP campus — biryani, Indo-Chinese, fresh juices and
          fruits, veg and non-veg, from real partner restaurants near you.
        </DialogDescription>
        <p className="mt-3 text-sm text-muted-foreground">
          Cash on delivery · Pickup at VIT-AP Main Gate
          <br />
          Scan and pay through UPI too
        </p>
        <p className="mt-4 text-label text-primary">
          Fast · Reliable · Affordable
        </p>
        <p className="mt-4 text-xs text-muted-foreground">~ mutebites</p>
      </DialogContent>
    </Dialog>
  );
}
