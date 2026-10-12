"use client";

import { useMemo, useState, useTransition } from "react";
import { Gift, Loader2, Search } from "@/components/icons";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDayMonth } from "@/components/profile/milestone-badges";
import { setMilestoneRewardClaimed } from "@/lib/admin/actions";
import type { AdminUser } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatStoredMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { Initials } from "./initials";

export function UsersList({ users: initialUsers }: { users: AdminUser[] }) {
 const [users, setUsers] = useState(initialUsers);
 const [query, setQuery] = useState("");
 const [rewardsOnly, setRewardsOnly] = useState(false);
 const [target, setTarget] = useState<AdminUser | null>(null);
 const [pending, startTransition] = useTransition();

 const rewardsDue = users.filter((u) => u.rewardEarned && !u.rewardClaimedAt).length;

 const filtered = useMemo(() => {
 const term = query.trim().toLowerCase();
 return users.filter(
 (u) =>
 (!rewardsOnly || u.rewardEarned) &&
 (!term ||
 u.fullName.toLowerCase().includes(term) ||
 u.phone.includes(term) ||
 u.email.toLowerCase().includes(term) ||
 (u.registrationNumber?.toLowerCase().includes(term) ?? false)),
 );
 }, [query, rewardsOnly, users]);

 function setClaimed(user: AdminUser, claimed: boolean) {
 startTransition(async () => {
 const result = await setMilestoneRewardClaimed(user.id, claimed);
 if (result.ok) {
 const claimedAt = claimed ? (result.claimedAt ?? new Date().toISOString()) : null;
 setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, rewardClaimedAt: claimedAt } : u)));
 toast.success(claimed ? `Free biryani marked claimed for ${user.fullName}.` : "Claim undone.");
 setTarget(null);
 } else {
 toast.error(result.error);
 }
 });
 }

 return (
 <div className="flex flex-col gap-4">
 <label className="relative block">
 <span className="sr-only">Search users</span>
 <Search
 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <input
 type="search"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search by name, phone, email, or reg. number…"
 className="h-11 w-full rounded-full bg-secondary pr-4 pl-10 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
 />
 </label>

 <button
 type="button"
 aria-pressed={rewardsOnly}
 onClick={() => setRewardsOnly((v) => !v)}
 className={cn(
 "flex h-9 items-center gap-1.5 self-start rounded-full border px-3.5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
 rewardsOnly ? "border-transparent bg-primary text-primary-foreground" : "bg-card text-foreground",
 )}
 >
 <Gift className="size-4" aria-hidden="true" />
 Free biryani earned
 {rewardsDue > 0 && <span className="tabular-nums">· {rewardsDue} due</span>}
 </button>

 {filtered.length === 0 ? (
 <p className="rounded-2xl border bg-card shadow-card p-6 text-center text-muted-foreground">
 {rewardsOnly && !query.trim()
 ? "No one has unlocked every milestone yet."
 : `No users match “${query.trim()}”.`}
 </p>
 ) : (
 <div className="flex flex-col gap-2">
 {filtered.map((user) => (
 <div key={user.id} className="rounded-3xl border bg-card p-4 shadow-card">
 <div className="flex items-center gap-3">
 <Initials name={user.fullName} />
 <div className="min-w-0 flex-1">
 <p className="truncate font-semibold">{user.fullName}</p>
 <p className="truncate text-sm text-muted-foreground">
 {formatStoredMobile(user.phone)}
 {user.registrationNumber && ` · ${user.registrationNumber}`}
 </p>
 <p className="truncate text-xs text-muted-foreground">{user.email}</p>
 </div>
 <div className="flex shrink-0 flex-col items-end gap-1">
 {user.isBanned && (
 <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
 Banned
 </span>
 )}
 <span className="text-xs text-muted-foreground">
 Joined {formatOrderTimestamp(user.createdAt)}
 </span>
 </div>
 </div>

 {/* Only students who've unlocked every milestone ever see this row. */}
 {user.rewardEarned && (
 <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-secondary px-3.5 py-2.5 text-foreground">
 <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
 <Gift className="size-4 shrink-0" aria-hidden="true" />
 {user.rewardClaimedAt
 ? `Free biryani claimed · ${formatDayMonth(user.rewardClaimedAt)}`
 : "Free biryani earned"}
 </p>
 {user.rewardClaimedAt ? (
 <button
 type="button"
 disabled={pending}
 onClick={() => setClaimed(user, false)}
 className="shrink-0 rounded-full px-2 text-sm font-semibold underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
 >
 Undo
 </button>
 ) : (
 <button
 type="button"
 onClick={() => setTarget(user)}
 className="flex h-9 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 Mark claimed
 </button>
 )}
 </div>
 )}
 </div>
 ))}
 </div>
 )}

 <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Mark {target?.fullName}&apos;s free biryani claimed?</AlertDialogTitle>
 <AlertDialogDescription>
 Do this once the biryani has been handed over. Their Profile will show it as claimed and stop
 offering the claim link. You can undo it if this was a mistake.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
 <AlertDialogAction disabled={pending} onClick={() => target && setClaimed(target, true)}>
 {pending && <Loader2 className="size-4 animate-spin" />}
 Mark claimed
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 );
}
