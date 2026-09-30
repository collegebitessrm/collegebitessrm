import type { Metadata } from "next";
import { ViewTransition } from "react";
import { IconTile } from "@/components/icon-tile";
import { Bell, Lock, Mail, MapPin, Palette, Sun, Volume2 } from "@/components/icons";
import { MemberCard } from "@/components/profile/member-card";
import { getUnlockedMilestones, MilestoneBadges } from "@/components/profile/milestone-badges";
import { MilestoneUnlockWatcher } from "@/components/profile/milestone-unlock-watcher";
import { NotificationToggle } from "@/components/notifications/notification-toggle";
import { SoundToggle } from "@/components/profile/sound-toggle";
import { SupportCard } from "@/components/profile/support-card";
import { WeeklyRankBadge } from "@/components/profile/weekly-rank-badge";
import { PalettePicker } from "@/components/theme/palette-picker";
import { ThemeIconToggle } from "@/components/theme/theme-icon-toggle";
import { getOrderStats, hasActiveOrder } from "@/lib/data/orders";
import { getMyWeeklyRank } from "@/lib/data/rank";
import { getRestaurantCount } from "@/lib/data/restaurants";
import { getMilestoneRewardClaimedAt } from "@/lib/data/rewards";
import { formatMonthYear } from "@/lib/date";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";
import { EditableName } from "./editable-name";
import { EditablePhone } from "./editable-phone";
import { ACTIVE_ORDER_PHONE_LOCK_MESSAGE, BANNED_PHONE_LOCK_MESSAGE } from "./phone-lock";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Profile · College Bites", robots: { index: false, follow: false } };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export default async function ProfilePage() {
  // Kicked off up front rather than after requireProfile() resolves —
  // neither needs the profile, so there's no reason to make them wait
  // behind that lookup instead of running alongside it.
  const profilePromise = requireProfile();
  const totalRestaurantsPromise = getRestaurantCount();
  const weeklyRankPromise = getMyWeeklyRank();

  const profile = await profilePromise;
  const [orderInProgress, orderStats, totalRestaurants, weeklyRank, rewardClaimedAt] = await Promise.all([
    hasActiveOrder(profile.id),
    getOrderStats(profile.id),
    totalRestaurantsPromise,
    weeklyRankPromise,
    getMilestoneRewardClaimedAt(profile.id),
  ]);

  // Mirrors the precedence in profile/actions.ts's updatePhone — that
  // server check is the real enforcement; this just tells the UI which
  // message (if any) to show instead of the Edit button.
  const phoneLockReason = profile.is_banned
    ? BANNED_PHONE_LOCK_MESSAGE
    : orderInProgress
      ? ACTIVE_ORDER_PHONE_LOCK_MESSAGE
      : null;

  const unlockedMilestones = getUnlockedMilestones(
    orderStats.deliveredCount,
    orderStats.restaurantsVisited,
    totalRestaurants,
  );

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <MilestoneUnlockWatcher unlockedCsv={unlockedMilestones.join(",")} />
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <MemberCard
            initials={initials(profile.full_name)}
            name={profile.full_name}
            memberSince={formatMonthYear(profile.created_at)}
            rankBadge={<WeeklyRankBadge rank={weeklyRank} />}
            cravingsSolved={orderStats.deliveredCount}
            streakDays={orderStats.streakDays}
            noShows={orderStats.cancelledCount}
          />

          <MilestoneBadges
            deliveredCount={orderStats.deliveredCount}
            restaurantsVisited={orderStats.restaurantsVisited}
            totalRestaurants={totalRestaurants}
            rewardClaimedAt={rewardClaimedAt}
          />

          <h2 className="mt-8 font-heading text-title font-bold">Your details</h2>
          <p className="text-sm text-muted-foreground">Tap a field to edit it.</p>
          <div className="mt-3 divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
            <EditableName initialValue={profile.full_name} />
            <EditablePhone
              initialValue={profile.phone}
              lockedReason={phoneLockReason}
              banned={profile.is_banned}
            />
            <div className="flex items-center gap-3 px-5 py-4">
              <IconTile>
                <Mail className="icon-tint-gold size-5" />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="text-label text-muted-foreground">Email · signed in with Google</p>
                <p className="mt-0.5 truncate font-semibold">{profile.email}</p>
              </div>
              <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Can't be changed" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <IconTile>
                <MapPin className="icon-tint-primary size-5" />
              </IconTile>
              <div>
                <p className="text-label text-muted-foreground">Handover point</p>
                <p className="font-semibold">Gate 3</p>
              </div>
            </div>
          </div>

          <h2 className="mt-8 font-heading text-title font-bold">Settings</h2>
          <div className="mt-3 divide-y overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
            <div className="px-5 pt-3.5 pb-5">
              <div className="flex items-center gap-3">
                <IconTile>
                  <Palette className="icon-tint-primary size-5" />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Theme</p>
                  <p className="text-sm text-muted-foreground">Colours for the whole app, on this phone.</p>
                </div>
              </div>
              <PalettePicker className="mt-4" />
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <IconTile>
                <Sun className="icon-tint-gold size-5" />
              </IconTile>
              <p className="min-w-0 flex-1 font-semibold">Appearance</p>
              <ThemeIconToggle />
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <IconTile>
                <Bell className="icon-tint-gold size-5" />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Order notifications</p>
                <p className="text-sm text-muted-foreground">Confirmed, delivered and cancelled.</p>
              </div>
              <NotificationToggle />
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <IconTile>
                <Volume2 className="icon-tint-primary size-5" />
              </IconTile>
              <p className="min-w-0 flex-1 font-semibold">Order placed sound</p>
              <SoundToggle />
            </div>
          </div>

          <SupportCard />

          <div className="mt-6">
            <SignOutButton />
          </div>
        </ViewTransition>
      </ViewTransition>

    </main>
  );
}
