import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, MapPin, Timer } from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { MenuProgress } from "@/components/menu/menu-progress";
import { MenuView } from "@/components/menu/menu-view";
import { getRestaurantCoverPhoto } from "@/lib/data/dish-photos";
import { getDishesTried, getFavoriteDishId } from "@/lib/data/orders";
import { getHighlyReorderedDishIds } from "@/lib/data/reorders";
import { getRestaurantMenu } from "@/lib/data/restaurants";
import { isUuid } from "@/lib/ids";
import { getOrderingState } from "@/lib/data/settings";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/restaurants/[id]">): Promise<Metadata> {
  const { id } = await params;
  const menu = await getRestaurantMenu(id);
  return { title: menu ? `${menu.restaurant.name} · College Bites` : "College Bites" };
}

export default async function RestaurantPage({ params, searchParams }: PageProps<"/restaurants/[id]">) {
  // Kicked off up front rather than after requireProfile() resolves —
  // getOrderingEnabled() needs neither the profile nor the restaurant id,
  // so there's no reason to make it wait behind either lookup instead of
  // running alongside them.
  const { id } = await params;
  // A malformed id is a plain 404 — checked before any lookup starts, since
  // the per-student queries below would hand it straight to Postgres.
  if (!isUuid(id)) notFound();
  const profilePromise = requireProfile();
  const orderingPromise = getOrderingState();
  const highlyReorderedPromise = getHighlyReorderedDishIds();
  const menuPromise = getRestaurantMenu(id);
  // ?dish=<id> — set by Trending and the Thursday banner so the menu opens
  // scrolled to that dish instead of the top of a 40-dish list.
  const { dish } = await searchParams;
  const focusDishId = typeof dish === "string" && isUuid(dish) ? dish : null;

  const profile = await profilePromise;
  const [menu, ordering, dishesTried, favoriteDishId, highlyReorderedDishIds] = await Promise.all([
    menuPromise,
    orderingPromise,
    getDishesTried(profile.id, id),
    getFavoriteDishId(profile.id, id),
    highlyReorderedPromise,
  ]);
  if (!menu) notFound();

  const { restaurant, sections } = menu;
  const active = restaurant.is_active;
  const orderingEnabled = ordering.open;
  const orderable = active && orderingEnabled;
  const paused = active && !orderingEnabled;
  const totalDishes = sections.reduce((sum, s) => sum + s.dishes.length, 0);
  const cover = getRestaurantCoverPhoto(restaurant.name);
  const statusBadge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold backdrop-blur-sm",
        orderable ? "text-success" : "text-muted-foreground",
      )}
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        {orderable && <span className="animate-ping-slow absolute inset-0 rounded-full bg-success" />}
        <span className={cn("relative size-1.5 rounded-full", orderable ? "bg-success" : "bg-muted-foreground")} />
      </span>
      {!active ? "Closed" : paused ? ordering.short : "Open"}
    </span>
  );

  // Same anatomy as Home's restaurant card: the photo is just a photo (no
  // scrim, no tint, no name printed over it) and the page itself rises over
  // its bottom edge as a rounded sheet carrying the name, the facts that
  // matter as chips (cuisines, the delivery promise, free delivery to Gate
  // 3) and the "tried N of M" sunset bar.
  return (
    <main className="mx-auto w-full max-w-md">
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <div className={cn("relative aspect-[16/10] bg-stripes", !active && "grayscale")}>
            {cover && (
              <BlurImage
                src={cover}
                alt=""
                sizes="(min-width: 448px) 448px, 100vw"
                className="object-cover"
              />
            )}
            <Link
              href="/"
              aria-label="Back to restaurants"
              transitionTypes={["nav-back"]}
              className="absolute top-4 left-4 flex size-11 items-center justify-center rounded-full bg-card/90 shadow-card backdrop-blur-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="absolute top-5 right-4">{statusBadge}</div>
          </div>

          <div className="relative -mt-7 rounded-t-[1.75rem] bg-background px-6 shadow-[0_-12px_30px_-18px_var(--glow-sun)]">
            <header className="pt-6 pb-3">
              <h1 className="font-heading text-headline font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  {restaurant.description}
                </p>
              )}
              <ul className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                {restaurant.cuisine_tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-aqua">
                    {tag}
                  </li>
                ))}
                <li className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <Timer className="icon-tint-gold size-3.5 shrink-0 text-muted-foreground" />
                  Delivery in {restaurant.delivery_minutes} min
                </li>
                <li className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <MapPin className="icon-tint-primary size-3.5 shrink-0 text-muted-foreground" />
                  Free to Gate 3
                </li>
              </ul>
              <MenuProgress restaurantName={restaurant.name} tried={dishesTried} total={totalDishes} />
              {!active && (
                <p className="mt-4 rounded-2xl border border-pink-soft-foreground/15 bg-pink-soft px-4 py-3 text-sm text-pink-soft-foreground">
                  <strong className="font-semibold">Closed right now.</strong> You can browse the
                  menu, and ordering opens when they&apos;re back.
                </p>
              )}
              {paused && (
                <p className="mt-4 rounded-2xl border border-pink-soft-foreground/15 bg-pink-soft px-4 py-3 text-sm text-pink-soft-foreground">
                  <strong className="font-semibold">{ordering.headline}.</strong> {ordering.detail}
                </p>
              )}
            </header>

            <MenuView
              restaurant={restaurant}
              sections={sections}
              profilePhone={profile.phone}
              orderingEnabled={orderingEnabled}
              closedChip={ordering.short}
              closedNote={ordering.headline}
              favoriteDishId={favoriteDishId}
              highlyReorderedDishIds={highlyReorderedDishIds}
              focusDishId={focusDishId}
            />
          </div>
        </ViewTransition>
      </ViewTransition>
    </main>
  );
}
