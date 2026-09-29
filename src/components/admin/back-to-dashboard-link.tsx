import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminPill } from "./styles";

/**
 * Shared "back" button for admin sub-pages. Defaults to the main
 * dashboard (history, users), but the banned-users page overrides both
 * props to point at /admin/users instead — that's its actual parent now
 * that it's reached via the Users page rather than the dashboard directly.
 */
export function BackToDashboardLink({
  href = "/admin",
  label = "Back to dashboard",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(adminPill, "w-fit")}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
