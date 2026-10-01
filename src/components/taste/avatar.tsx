import { createElement } from "react";
import { getAvatar, type AvatarTone } from "@/lib/taste/options";
import { cn } from "@/lib/utils";

// Each tone is a lit surface from the current palette, so avatars recolour
// with the theme. Icon-on-fill pairs are the contrast-audited ones.
const TONE: Record<AvatarTone | "ink", string> = {
  hero: "surface-hero bg-hero text-hero-foreground",
  primary: "surface-primary bg-primary text-primary-foreground",
  chip: "bg-chip-active text-chip-active-foreground",
  pink: "bg-pink-soft text-pink-soft-foreground",
  aqua: "bg-aqua text-aqua-foreground",
  gold: "bg-gold text-hero-foreground",
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
