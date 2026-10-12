import { createElement } from "react";
import { getAvatar, type AvatarTone } from "@/lib/taste/options";
import { cn } from "@/lib/utils";

// Each tone is a lit surface from the current palette, so avatars recolour
// with the theme. Icon-on-fill pairs are the contrast-audited ones.
const TONE: Record<AvatarTone | "ink", string> = {
 hero: "bg-primary bg-primary text-primary-foreground",
 primary: " bg-primary text-primary-foreground",
 chip: "bg-primary text-primary-foreground",
 pink: "bg-secondary text-foreground",
 aqua: "bg-primary text-primary-foreground",
 gold: "bg-primary text-primary-foreground",
 // On the campus pass (a sunset card): the dusk circle the initials used.
 ink: "bg-hero-foreground text-hero",
};

/**
 * A student's avatar: one of the preset food icons (AVATARS) on a round,
 * lit tile. Decorative — the button or heading around it carries the
 * label. Unknown ids fall back to the default biryani pot.
 */
export function Avatar({
 id,
 className,
 iconClassName,
 tone,
}: {
 id: string | null | undefined;
 className?: string;
 iconClassName?: string;
 /** Override the avatar's own tone ("ink" on the campus pass). */
 tone?: AvatarTone | "ink";
}) {
 const avatar = getAvatar(id);
 return (
 <span
 aria-hidden="true"
 className={cn("flex shrink-0 items-center justify-center rounded-full", TONE[tone ?? avatar.tone], className)}
 >
 {/* createElement: the icon is looked up from a static list, not made during render. */}
 {createElement(avatar.Icon, { className: cn("size-[55%]", iconClassName) })}
 </span>
 );
}
