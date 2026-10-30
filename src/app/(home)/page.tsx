import { ViewTransition } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { OrderingPausedBanner } from "@/components/home/ordering-paused-banner";
import { RestaurantList } from "@/components/home/restaurant-list";
import { SignInWelcomeToast } from "@/components/home/sign-in-welcome-toast";
import { ThursdayNudge } from "@/components/home/thursday-nudge";
import { getRestaurantMenuStats, getRestaurantRatings, getRestaurants, getSearchableDishes, getThursdaySpecial } from "@/lib/data/restaurants";
import { getOrderingState } from "@/lib/data/settings";
import { getOffers } from "@/lib/data/offers";
import { getDishOrderCounts, getTrendingDishes } from "@/lib/data/trending";
import { getRatePromptOrder } from "@/lib/data/orders";
import { RatePrompt } from "@/components/home/rate-prompt";
import { FinishProfileNudge } from "@/components/taste/finish-profile-nudge";
import { TasteSheetHost } from "@/components/taste/taste-sheet";
import { getLikedDishes } from "@/lib/data/favorites";
import { getTasteProfile, hasPlacedOrder } from "@/lib/data/taste";
import { answeredCount, cravingOrder, heartCravings } from "@/lib/taste/options";
import { getTimeOfDayIST, isThursdayIST } from "@/lib/date";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";
import { NewUserWhatsAppPrompt } from "@/components/channel/whatsapp-channel-modal";
import { OrderOpenPermissionPrompt } from "@/components/notifications/order-open-permission-prompt";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { signedIn } = await searchParams;
  const profile = await requireProfile();

  const [restaurants, ordering, menuStats, dishes, thursdaySpecial, trendingDishes] = await Promise.all([
    getRestaurants(),
    getOrderingState(),
    getRestaurantMenuStats(),
    getSearchableDishes(),
    isThursdayIST() ? getThursdaySpecial() : Promise.resolve(null),
    getTrendingDishes(),
  ]);

  const dishOrderCountsPromise = getDishOrderCounts();
  const offersPromise = getOffers();
  const ratingsPromise = getRestaurantRatings();

  const [ratings, ratePrompt, dishOrderCounts, taste, placedOrder, liked, offers] = await Promise.all([
    ratingsPromise,
    getRatePromptOrder(profile.id),
    dishOrderCountsPromise,
    getTasteProfile(profile.id),
    hasPlacedOrder(profile.id),
    getLikedDishes(profile.id),
    offersPromise,
  ]);
  const fromHearts = heartCravings(liked);
  const timeOfDay = getTimeOfDayIST();
  const orderingEnabled = ordering.open;

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <SignInWelcomeToast justSignedIn={signedIn === "1"} />
      {/* WhatsApp channel prompt: shows for new users who haven't placed an order yet */}
      <NewUserWhatsAppPrompt isNewUser={!placedOrder} userName={profile.full_name} />
      {/* Ask for notification permission if not yet granted so users receive "Orders Opened" broadcasts */}
      <OrderOpenPermissionPrompt />
      {ratePrompt && <RatePrompt order={ratePrompt} />}
      <TasteSheetHost taste={taste} fromHearts={fromHearts} />
      {placedOrder && answeredCount(taste) < 3 && <FinishProfileNudge taste={taste} />}
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <HomeHeader fullName={profile.full_name} timeOfDay={timeOfDay} avatar={taste.avatar} />
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
            trendingDishes={trendingDishes}
            cravings={cravingOrder(taste, fromHearts)}
            ratings={ratings}
          />
        </ViewTransition>
      </ViewTransition>
      <CartBar profilePhone={profile.phone} orderingEnabled={orderingEnabled} closedNote={ordering.headline} spiceLevel={taste.spiceLevel} offers={offers} hasTabBar />
    </main>
  );
}
