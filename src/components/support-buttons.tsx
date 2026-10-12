import { MessageCircle, Phone } from "@/components/icons";
import { whatsAppLink } from "@/lib/phone";
import { SUPPORT_PHONE } from "@/lib/support";

/** Call + WhatsApp icon buttons, both pointed at College Bites' own support number — used on the profile page and the order-tracking page's "something wrong" card. */
export function SupportButtons({ whatsappMessage }: { whatsappMessage: string }) {
 return (
 <div className="flex items-center gap-2">
 <a
 href={`tel:${SUPPORT_PHONE}`}
 aria-label="Call College Bites support"
 className="pressable flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <Phone className="size-4" />
 </a>
 <a
 href={whatsAppLink(SUPPORT_PHONE, whatsappMessage)}
 target="_blank"
 rel="noopener noreferrer"
 aria-label="Message College Bites on WhatsApp"
 className="pressable flex size-11 items-center justify-center rounded-full bg-success text-success-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <MessageCircle className="size-4" />
 </a>
 </div>
 );
}
