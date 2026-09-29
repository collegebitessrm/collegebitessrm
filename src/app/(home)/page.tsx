import { ViewTransition } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { OrderingPausedBanner } from "@/components/home/ordering-paused-banner";
import { RestaurantList } from "@/components/home/restaurant-list";
import { SignInWelcomeToast } from "@/components/home/sign-in-welcome-toast";
import { ThursdayNudge } from "@/components/home/thursday-nudge";
import { YourUsualChip } from "@/components/home/your-usual-chip";
import { TabBar } from "@/components/nav/tab-bar";
import { getRestaurantMenuStats, getRestaurants, getSearchableDishes, getThursdaySpecial } from "@/lib/data/restaurants";
import { getOrderingState } from "@/lib/data/settings";
import { getDishOrderCounts, getTrendingDishes } from "@/lib/data/trending";
import { getUsualCart } from "@/lib/data/usual";
import { getRatePromptOrder } from "@/lib/data/orders";
import { RatePrompt } from "@/components/home/rate-prompt";
import { getTimeOfDayIST, isThursdayIST } from "@/lib/date";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { signedIn } = await searchParams;
  // Kicked off up front rather than after requireProfile() resolves —
  // none of these need the profile, so there's no reason to make them
  // wait behind that lookup instead of running alongside it.
  const profilePromise = requireProfile();
  const restaurantsPromise = getRestaurants();
  const menuStatsPromise = getRestaurantMenuStats();
  const dishesPromise = getSearchableDishes();
  const orderingPromise = getOrderingState();
  const trendingDishesPromise = getTrendingDishes();
  const dishOrderCountsPromise = getDishOrderCounts();
  const thursdaySpecialPromise = isThursdayIST() ? getThursdaySpecial() : Promise.resolve(null);

  const profile = await profilePromise;
  const [restaurants, menuStats, dishes, ordering, usual, thursdaySpecial, trendingDishes, ratePrompt, dishOrderCounts] = await Promise.all([
    restaurantsPromise,
    menuStatsPromise,
    dishesPromise,
    orderingPromise,
    getUsualCart(profile.id),
    thursdaySpecialPromise,
    trendingDishesPromise,
    getRatePromptOrder(profile.id),
    dishOrderCountsPromise,
  ]);
  const timeOfDay = getTimeOfDayIST();
  const orderingEnabled = ordering.open;

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <SignInWelcomeToast justSignedIn={signedIn === "1"} />
      {ratePrompt && <RatePrompt order={ratePrompt} />}
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <HomeHeader fullName={profile.full_name} timeOfDay={timeOfDay} trendingDishes={trendingDishes} />
          {usual && orderingEnabled && <YourUsualChip usual={usual} />}
          {thursdaySpecial && <ThursdayNudge special={thursdaySpecial} />}
          {!orderingEnabled && <OrderingPausedBanner ordering={ordering} />}
          <RestaurantList
            restaurants={restaurants}
            orderingEnabled={orderingEnabled}
            closedChip={ordering.short}
            closedLine={ordering.headline}
            menuStats={menuStats}
            dishes={dishes}
            dishOrderCounts={dishOrderCounts}
          />
        </ViewTransition>
      </ViewTransition>
      <CartBar profilePhone={profile.phone} orderingEnabled={orderingEnabled} closedNote={ordering.headline} hasTabBar />
      <TabBar />
    </main>
  );
}
