"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RotateCw } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { signOutAndClearCart } from "@/lib/sign-out";
import { cn } from "@/lib/utils";
import { adminPill } from "./styles";

export function AdminHeader() {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();
  const [reloading, startReload] = useTransition();
  // "Admin" is the page's h1 only on the dashboard; sub-pages (history,
  // users, banned) have their own h1, and a page should have exactly one.
  const Title = usePathname() === "/admin" ? "h1" : "p";

  return (
    <header className="flex items-center gap-3">
      <BrandLogo className="size-12 rounded-2xl shadow-card" />
      <div className="min-w-0 flex-1">
        <Title className="truncate font-heading text-headline font-bold">Admin</Title>
        <p className="truncate text-sm text-muted-foreground">MuteBites operations</p>
      </div>
      <button
        type="button"
        disabled={reloading}
        onClick={() => startReload(() => router.refresh())}
        aria-label="Reload"
        className={adminPill}
      >
        <RotateCw className={cn("size-4", reloading && "animate-spin")} aria-hidden="true" />
        <span className="hidden sm:inline">Reload</span>
      </button>
      <button
        type="button"
        disabled={signingOut}
        onClick={() => startSignOut(() => signOutAndClearCart())}
        aria-label="Sign out"
        className={adminPill}
      >
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
      </button>
    </header>
  );
}
