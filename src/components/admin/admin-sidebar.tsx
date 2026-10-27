"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type AppIcon,
  BarChart,
  Discount,
  History,
  Menu,
  PackageX,
  Receipt,
  Star,
  Storefront,
  Users,
  Utensils,
  X,
} from "@/components/icons";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: AppIcon;
  badge?: string;
  badgeTone?: "orange" | "green";
  exact?: boolean;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Live Orders",
    description: "Current active orders & delivery",
    icon: Receipt,
    exact: true,
  },
  {
    href: "/admin/analytics",
    label: "Orders Analytics",
    description: "Collections, items & profit rates",
    icon: BarChart,
    badge: "New",
    badgeTone: "orange",
  },
  {
    href: "/admin/history",
    label: "Order History",
    description: "Completed & past orders archive",
    icon: History,
  },
  {
    href: "/admin/users",
    label: "Students & Users",
    description: "User profiles, roles & bans",
    icon: Users,
  },
  {
    href: "/admin/reviews",
    label: "Student Reviews",
    description: "Dish ratings, feedback & notes",
    icon: Star,
  },
  {
    href: "/admin/offers",
    label: "Offers & Coupons",
    description: "Campus discount campaigns",
    icon: Discount,
  },
  {
    href: "/admin/restaurants",
    label: "Partner Restaurants",
    description: "Food courts, hours & contact",
    icon: Storefront,
  },
  {
    href: "/admin/menu",
    label: "Menu & Pricing",
    description: "Dishes, prices & portions",
    icon: Utensils,
  },
  {
    href: "/admin/sold-out",
    label: "Sold Out Items",
    description: "Temporarily unavailable dishes",
    icon: PackageX,
  },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 shrink-0 flex-col border-r border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40 select-none",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <BrandLogo className="size-10 rounded-2xl shadow-card shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-extrabold text-base text-foreground leading-tight truncate">
            College Bites
          </p>
          <p className="text-[11px] font-semibold text-[#FF6B00] uppercase tracking-wider">
            Admin Portal
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Navigation Menu
          </span>
        </div>
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all outline-none",
                isActive
                  ? "bg-[#FF6B00] text-white shadow-xs shadow-orange-500/20"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground active:scale-98",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-secondary text-muted-foreground group-hover:text-[#FF6B00]",
                  )}
                >
                  <Icon className="size-4" aria-hidden={true} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold leading-tight">{item.label}</p>
                </div>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-extrabold shrink-0",
                    isActive
                      ? "bg-white text-[#FF6B00]"
                      : item.badgeTone === "orange"
                      ? "bg-orange-50 text-[#FF6B00] border border-orange-200/80"
                      : "bg-success-soft text-success",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="border-t border-border/60 p-4">
        <div className="rounded-2xl bg-secondary/60 p-3">
          <p className="text-xs font-bold text-foreground">SRM AP Campus</p>
          <p className="text-[11px] text-muted-foreground">Operations & Food Delivery</p>
        </div>
      </div>
    </aside>
  );
}

export function AdminMobileMenuTrigger() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="Open navigation menu"
            className="flex h-10 items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 text-xs font-bold shadow-card outline-none hover:border-[#FF6B00] active:scale-95 text-[#0F172A]"
          />
        }
      >
        <Menu className="size-4 text-[#FF6B00]" aria-hidden="true" />
        <span>Menu</span>
      </SheetTrigger>

      <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col bg-card" showCloseButton={false}>
        {/* Drawer Header */}
        <SheetHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="size-10 rounded-2xl shadow-card shrink-0" />
            <div>
              <SheetTitle className="font-heading font-extrabold text-base text-foreground leading-tight text-left">
                College Bites
              </SheetTitle>
              <SheetDescription className="text-[11px] font-semibold text-[#FF6B00] uppercase tracking-wider text-left">
                Admin Navigation
              </SheetDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        {/* Drawer Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 pt-1 pb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Management Menu
            </span>
          </div>

          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl p-3 text-xs font-bold transition-all active:scale-98",
                  isActive
                    ? "bg-[#FF6B00] text-white shadow-xs shadow-orange-500/20"
                    : "text-foreground hover:bg-secondary/70",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-[#FF6B00]",
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden={true} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-sm leading-tight">{item.label}</p>
                    <p
                      className={cn(
                        "truncate text-[11px] font-medium mt-0.5",
                        isActive ? "text-white/80" : "text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold shrink-0",
                      isActive
                        ? "bg-white text-[#FF6B00]"
                        : "bg-orange-50 text-[#FF6B00] border border-orange-200/80",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-border/60 p-4">
          <div className="rounded-2xl bg-secondary/60 p-3">
            <p className="text-xs font-bold text-foreground">SRM AP Campus Admin</p>
            <p className="text-[11px] text-muted-foreground">College Bites Operations</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
