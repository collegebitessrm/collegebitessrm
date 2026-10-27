"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RotateCw } from "@/components/icons";
import { BrandLogo } from "@/components/brand-logo";
import { signOutAndClearCart } from "@/lib/sign-out";
import { cn } from "@/lib/utils";
import { AdminMobileMenuTrigger } from "./admin-sidebar";
import { InstallAppButton } from "./install-app-button";
import { adminPill } from "./styles";

export function AdminHeader() {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();
  const [reloading, startReload] = useTransition();
  // "Admin" is the page's h1 only on the dashboard; sub-pages (history,
  // users, banned) have their own h1, and a page should have exactly one.
  const Title = usePathname() === "/admin" ? "h1" : "p";

  return (
    <header className="flex items-center justify-between gap-2.5 sm:gap-3">
      {/* Left: Clean Brand Logo & Title (Nothing placed beside or before the logo) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <BrandLogo className="size-11 sm:size-12 rounded-2xl shadow-card shrink-0" />
        <div className="min-w-0 flex-1">
          <Title className="truncate font-heading text-lg sm:text-headline font-bold">Admin</Title>
          <p className="truncate text-xs sm:text-sm text-muted-foreground">College Bites operations · SRM AP</p>
        </div>
      </div>

      {/* Right: Actions and Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <InstallAppButton />

        <button
          type="button"
          disabled={reloading}
          onClick={() => startReload(() => router.refresh())}
          aria-label="Reload"
          title="Reload"
          className={cn(adminPill, "size-10 sm:size-auto px-0 sm:px-4 justify-center active:scale-95")}
        >
          <RotateCw className={cn("size-4", reloading && "animate-spin")} aria-hidden="true" />
          <span className="hidden sm:inline">Reload</span>
        </button>

        <button
          type="button"
          disabled={signingOut}
          onClick={() => startSignOut(() => signOutAndClearCart())}
          aria-label="Sign out"
          title="Sign out"
          className={cn(adminPill, "size-10 sm:size-auto px-0 sm:px-4 justify-center active:scale-95")}
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
        </button>

        {/* Navigation Menu Drawer on the far right */}
        <AdminMobileMenuTrigger />
      </div>
    </header>
  );
}
