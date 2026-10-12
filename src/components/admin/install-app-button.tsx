"use client";

import { useState, useSyncExternalStore } from "react";
import { Share, Smartphone, SquarePlus } from "@/components/icons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
 getInstallMode,
 getServerInstallMode,
 promptInstall,
 subscribeInstall,
} from "@/lib/pwa/install-store";
import { adminPill } from "./styles";

/**
 * "Install" in the admin header: puts the admin app ("CB Admin", opens on
 * the dashboard — app/admin.webmanifest) on the home screen. Hidden once it's
 * installed or where the browser can't install.
 */
export function InstallAppButton() {
 const mode = useSyncExternalStore(subscribeInstall, getInstallMode, getServerInstallMode);
 const [iosOpen, setIosOpen] = useState(false);

 if (mode === "none") return null;

 return (
 <>
 <button
 type="button"
 onClick={() => (mode === "prompt" ? void promptInstall() : setIosOpen(true))}
 aria-label="Install the admin app"
 className={adminPill}
 >
 <Smartphone className="size-4" aria-hidden="true" />
 <span className="hidden sm:inline">Install</span>
 </button>
 {mode === "ios" && (
 <Dialog open={iosOpen} onOpenChange={setIosOpen}>
 <DialogContent>
 <DialogTitle className="pr-10 font-heading text-title font-bold">
 Install the admin app
 </DialogTitle>
 <DialogDescription className="mt-1 text-sm text-muted-foreground">
 It gets its own icon, &ldquo;CB Admin&rdquo;, and opens straight on the
 dashboard. Use Safari for these steps.
 </DialogDescription>
 <ol className="mt-5 flex flex-col gap-3 text-sm">
 <li className="flex items-center gap-3">
 <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
 <Share className="size-5" />
 </span>
 <span>
 Tap <strong>Share</strong> in the toolbar.
 </span>
 </li>
 <li className="flex items-center gap-3">
 <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
 <SquarePlus className="size-5" />
 </span>
 <span>
 Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
 </span>
 </li>
 </ol>
 </DialogContent>
 </Dialog>
 )}
 </>
 );
}
