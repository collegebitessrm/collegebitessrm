import type { Metadata } from "next";
import Link from "next/link";
import { ShieldBan } from "lucide-react";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { adminPill } from "@/components/admin/styles";
import { UsersList } from "@/components/admin/users-list";
import { getAllUsers } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Users · MuteBites Admin" };

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BackToDashboardLink />
          <Link
            href="/admin/banned"
            className={adminPill}
          >
            <ShieldBan className="size-4" aria-hidden="true" />
            Banned users
          </Link>
        </div>
        <h1 className="mt-4 font-heading text-headline font-bold">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Everyone registered on MuteBites — {users.length} total.
        </p>
      </div>

      <UsersList users={users} />
    </>
  );
}
