"use client";

import Link from "next/link";
import {
  BarChart,
  ChevronRight,
  Discount,
  History,
  PackageX,
  Star,
  Storefront,
  Users,
  Utensils,
} from "@/components/icons";
import { cn } from "@/lib/utils";

type Props = {
  activeOffersCount?: number;
};

export function AdminDashboardMenu({ activeOffersCount = 0 }: Props) {
  const menuItems = [
    {
      href: "/admin/analytics",
      label: "Orders Analytics",
      description: "Collections, items sold & profit rates",
      icon: BarChart,
      badge: "New",
      badgeTone: "orange",
      highlight: true,
    },
    {
      href: "/admin/history",
      label: "Order History",
      description: "Delivered & past orders archive",
      icon: History,
    },
    {
      href: "/admin/users",
      label: "Users & Students",
      description: "User profiles, roles & bans",
      icon: Users,
    },
    {
      href: "/admin/reviews",
      label: "Student Reviews",
      description: "Dish ratings & feedback",
      icon: Star,
    },
    {
      href: "/admin/offers",
      label: "Offers & Coupons",
      description: "Campus discount campaigns",
      icon: Discount,
      badge: activeOffersCount > 0 ? `${activeOffersCount} on` : undefined,
      badgeTone: "green",
    },
    {
      href: "/admin/restaurants",
      label: "Restaurants",
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
      description: "Unavailable dishes today",
      icon: PackageX,
    },
  ];

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-card">
      <div className="mb-3.5 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-title font-bold text-foreground">
            Admin Menu
          </h2>
          <p className="text-xs text-muted-foreground">
            Management modules and operations
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
          8 Modules
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 transition-all outline-none active:scale-98 hover:shadow-xs",
                item.highlight
                  ? "border-orange-200/90 bg-gradient-to-br from-orange-50/70 to-orange-100/30 hover:border-[#FF6B00]/60 hover:bg-orange-50"
                  : "border-border/70 bg-secondary/30 hover:border-border hover:bg-secondary/70",
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                      item.highlight
                        ? "bg-[#FF6B00] text-white shadow-2xs"
                        : "bg-card border border-border/60 text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden={true} />
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-extrabold shrink-0",
                        item.badgeTone === "orange"
                          ? "bg-[#FF6B00] text-white shadow-2xs"
                          : "bg-success-soft text-success",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <p
                    className={cn(
                      "font-bold text-xs sm:text-sm leading-tight truncate",
                      item.highlight ? "text-[#FF6B00]" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-end text-muted-foreground group-hover:text-foreground">
                <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
