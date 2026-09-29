import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { BannedUsersSection } from "@/components/admin/banned-users-section";
import { getBannedUsers } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Banned users · MuteBites Admin" };

export default async function AdminBannedPage() {
  const bannedUsers = await getBannedUsers();

  return (
    <>
      <div>
        <BackToDashboardLink href="/admin/users" label="Back to users" />
        <h1 className="mt-4 font-heading text-headline font-bold">Banned users</h1>
        <p className="mt-1 text-muted-foreground">
          Search a student to ban them, or unban from the list below — bans match by phone number,
          campus-wide.
        </p>
      </div>

      <BannedUsersSection bannedUsers={bannedUsers} />
    </>
  );
}
