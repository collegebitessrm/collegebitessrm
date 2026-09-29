import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPasscodeGate } from "@/components/admin/admin-passcode-gate";
import { requireAdmin } from "@/lib/admin/guard";
import { isAdminPasscodeVerified } from "@/lib/admin/passcode";

// Never in search results (robots.txt also disallows /admin).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  // Second layer on top of the role check above: even a signed-in admin
  // needs this browser session to know the separate ADMIN_PASSCODE too.
  if (!(await isAdminPasscodeVerified())) {
    return <AdminPasscodeGate />;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <AdminHeader />
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </main>
  );
}
