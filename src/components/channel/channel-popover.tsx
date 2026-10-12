"use client";

import { Popover } from "@base-ui/react/popover";
import { useSyncExternalStore, type CSSProperties } from "react";
import {
 ArrowRight,
 BellRing,
 CookingPot,
 Discount,
 MessageCircle,
 ShieldCheck,
 X,
 type AppIcon,
} from "@/components/icons";
import { WHATSAPP_CHANNEL_URL } from "@/lib/support";
import { cn } from "@/lib/utils";
import { getChannelSeen, getServerChannelSeen, markChannelSeen, subscribeChannelSeen } from "./channel-seen";

const PERKS: { Icon: AppIcon; text: string; tint: string }[] = [
 { Icon: Discount, text: "Offers and free biryani drops", tint: "text-primary" },
 { Icon: BellRing, text: "When we open and close", tint: "text-primary" },
 { Icon: CookingPot, text: "New dishes on the menu", tint: "text-primary" },
];

/** Stagger index for a `.channel-rise` row (globals.css). */
const rise = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Home header: a round WhatsApp button beside the avatar. Tapping it pops a
 * small card out of the button — it grows from the button's corner with a
 * spring and its rows rise in one after another — linking to the College
 * Bites WhatsApp channel. Until it's opened once on this device the button
 * has a pulsing dot and gives one wiggle after the splash.
 */
export function ChannelPopover() {
 const seen = useSyncExternalStore(subscribeChannelSeen, getChannelSeen, getServerChannelSeen);

 return (
 <Popover.Root onOpenChange={(open) => open && markChannelSeen()}>
 <Popover.Trigger
 aria-label="College Bites WhatsApp channel"
 className={cn(
 "pressable relative flex size-12 items-center justify-center rounded-full bg-card text-success shadow-card ring-2 ring-card outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
 !seen && "channel-wiggle",
 )}
 >
 <MessageCircle className="size-6.5" />
 {!seen && (
 <span aria-hidden="true" className="absolute top-0 right-0 flex size-3.5">
 <span className="animate-ping-slow absolute inset-0 rounded-full bg-primary" />
 <span className="relative size-3.5 rounded-full bg-primary ring-2 ring-card" />
 </span>
 )}
 </Popover.Trigger>
 <Popover.Portal>
 <Popover.Positioner side="bottom" align="end" sideOffset={10} collisionPadding={16} className="z-50">
 <Popover.Popup className="channel-pop w-[min(20rem,calc(100vw-2rem))] origin-(--transform-origin) overflow-hidden rounded-[1.75rem] border bg-popover text-popover-foreground shadow-overlay outline-none">
 <div className="bg-primary relative h-28 overflow-hidden">
 <div className="channel-rise absolute bottom-4 left-5 flex items-center gap-3" style={rise(0)}>
 <span className="flex size-13 items-center justify-center rounded-2xl bg-card text-success shadow-raised">
 <MessageCircle className="size-8" />
 </span>
 <div>
 <p className="text-xs font-semibold text-primary-foreground">WhatsApp channel</p>
 <Popover.Title className="font-heading text-title font-bold text-primary-foreground">
 College Bites
 </Popover.Title>
 </div>
 </div>
 <Popover.Close
 aria-label="Close"
 className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-card/85 text-muted-foreground shadow-card backdrop-blur-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <X className="size-4" />
 </Popover.Close>
 </div>
 <div className="px-5 pt-4 pb-5">
 <Popover.Description className="channel-rise text-sm text-muted-foreground" style={rise(1)}>
 Follow us and hear it first:
 </Popover.Description>
 <ul className="mt-3 space-y-2.5">
 {PERKS.map(({ Icon, text, tint }, i) => (
 <li key={text} className="channel-rise flex items-center gap-3 text-sm font-semibold" style={rise(i + 2)}>
 <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
 <Icon className={cn("size-4.5", tint)} />
 </span>
 {text}
 </li>
 ))}
 </ul>
 <a
 href={WHATSAPP_CHANNEL_URL}
 target="_blank"
 rel="noopener noreferrer"
 className="channel-rise pressable mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
 style={rise(5)}
 >
 Follow on WhatsApp
 <ArrowRight className="size-4.5" />
 </a>
 <p className="channel-rise mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground" style={rise(6)}>
 <ShieldCheck className="size-4" />
 Your number stays private
 </p>
 </div>
 </Popover.Popup>
 </Popover.Positioner>
 </Popover.Portal>
 </Popover.Root>
 );
}
