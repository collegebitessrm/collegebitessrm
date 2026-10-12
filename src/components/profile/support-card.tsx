import { IconTile } from "@/components/icon-tile";
import { Phone } from "@/components/icons";
import { SupportButtons } from "@/components/support-buttons";

/** "Need help?" card with Call + WhatsApp buttons — platform-wide, not tied to one order's restaurant. */
export function SupportCard() {
 return (
 <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] border bg-card px-5 py-4 shadow-card">
 <IconTile>
 <Phone className="text-primary size-5" />
 </IconTile>
 <div className="min-w-0 flex-1">
 <p className="text-sm text-muted-foreground">Need help?</p>
 <p className="font-semibold">Contact College Bites</p>
 </div>
 <SupportButtons whatsappMessage="Hi College Bites, I need help with my order." />
 </div>
 );
}
