import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/profile";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = {
 title: "Almost there · College Bites",
 robots: { index: false, follow: false },
};

export default async function WelcomePage() {
 const { user, profile } = await getSessionProfile();
 if (!user) redirect("/login");
 // Returning users never see this form again.
 if (profile) redirect("/");

 const googleName =
 (user.user_metadata?.full_name as string | undefined) ??
 (user.user_metadata?.name as string | undefined) ??
 "";

 return (
 <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
 <WelcomeForm defaultName={googleName} />
 </main>
 );
}
