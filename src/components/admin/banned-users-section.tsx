"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
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
import { searchStudents, setStudentBanned, type StudentSearchResult } from "@/lib/admin/actions";
import type { BannedUser } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatStoredMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { EmptyState } from "@/components/empty-state";
import { Initials } from "./initials";

export function BannedUsersSection({ bannedUsers }: { bannedUsers: BannedUser[] }) {
  const [banned, setBanned] = useState(bannedUsers);
  const [pending, startTransition] = useTransition();

  function unban(id: string, name: string) {
    startTransition(async () => {
      const result = await setStudentBanned(id, false);
      if (result.ok) {
        setBanned((list) => list.filter((u) => u.id !== id));
        toast.success(`${name} unbanned.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function onBanned(user: StudentSearchResult) {
    setBanned((list) => [
      { id: user.id, fullName: user.fullName, phone: user.phone, bannedAt: new Date().toISOString() },
      ...list,
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <BanStudentSearch onBanned={onBanned} />

      {banned.length === 0 ? (
        <EmptyState compact icon={ShieldCheck} title="No one is banned">
          Everyone can order right now.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {banned.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-card"
            >
              <Initials name={user.fullName} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatStoredMobile(user.phone)}
                  {user.bannedAt && ` · Banned ${formatOrderTimestamp(user.bannedAt)}`}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => unban(user.id, user.fullName)}
                className="flex h-10 shrink-0 items-center rounded-full bg-success px-4 text-sm font-bold text-success-foreground outline-none hover:bg-success/90 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70"
              >
                Unban
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BanStudentSearch({ onBanned }: { onBanned: (user: StudentSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState<StudentSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banPending, startBan] = useTransition();

  useEffect(() => {
    const term = query.trim();
    // Nothing is rendered below 2 characters (see the guard in the JSX),
    // so there's no need to touch results/searching state for this case.
    if (term.length < 2) return;

    const timeout = setTimeout(async () => {
      setSearching(true);
      const result = await searchStudents(term);
      setSearching(false);
      if (result.ok) setResults(result.results);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function confirmBan() {
    if (!target) return;
    startBan(async () => {
      const result = await setStudentBanned(target.id, true);
      if (result.ok) {
        onBanned(target);
        setResults((list) => list.filter((u) => u.id !== target.id));
        toast.success(`${target.fullName} banned.`);
        setTarget(null);
        setError(null);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-card">
      <label className="relative block">
        <span className="sr-only">Search students to ban</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or reg. number to ban a student…"
          className="h-11 w-full rounded-full bg-secondary pr-4 pl-10 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
        />
      </label>

      {query.trim().length >= 2 && (
        <div className="mt-3 flex flex-col gap-2">
          {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
          {!searching && results.length === 0 && (
            <p className="text-sm text-muted-foreground">No students match “{query.trim()}”.</p>
          )}
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">{formatStoredMobile(user.phone)}</p>
              </div>
              {user.isBanned ? (
                <span className="shrink-0 text-xs font-bold text-destructive">
                  Already banned
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTarget(user)}
                  className="flex h-10 shrink-0 items-center rounded-full bg-destructive px-4 text-sm font-bold text-destructive-foreground outline-none hover:bg-destructive/90 focus-visible:ring-3 focus-visible:ring-ring/80"
                >
                  Ban
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {target?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {target &&
                `This blocks new orders from ${formatStoredMobile(target.phone)} campus-wide — including any other account signed in with the same number. You can unban at any time.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={banPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={banPending}
              onClick={confirmBan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {banPending && <Loader2 className="size-4 animate-spin" />}
              Ban student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
