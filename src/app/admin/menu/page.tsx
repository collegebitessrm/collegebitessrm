import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { MenuManager } from "@/components/admin/menu-manager";
import { getAdminMenuData } from "@/lib/data/admin";

export const metadata: Metadata = {
 title: "Menu · Admin · College Bites",
 robots: { index: false, follow: false },
};

export default async function AdminMenuPage() {
 const menuData = await getAdminMenuData();

 return (
 <>
 <BackToDashboardLink />
 <div className="mt-4">
 <h1 className="font-heading text-headline font-bold">Menu</h1>
 <p className="mt-1 text-sm text-muted-foreground">
 Manage categories and dishes for each restaurant. Changes appear on the student app immediately.
 </p>
 </div>
 <MenuManager data={menuData} />
 </>
 );
}