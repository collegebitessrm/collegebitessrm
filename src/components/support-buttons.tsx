import { MessageCircle, Phone } from "lucide-react";
import { whatsAppLink } from "@/lib/phone";
import { SUPPORT_PHONE } from "@/lib/support";

/** Call + WhatsApp icon buttons, both pointed at MuteBites' own support number — used on the profile page and the order-tracking page's "something wrong" card. */
export function SupportButtons({ whatsappMessage }: { whatsappMessage: string }) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={`tel:${SUPPORT_PHONE}`}
        aria-label="Call MuteBites support"
        className="flex size-11 items-center justify-center rounded-xl bg-ink text-ink-foreground outline-none hover:bg-ink/90 focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        <Phone className="size-4" />
      </a>
      <a
        href={whatsAppLink(SUPPORT_PHONE, whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message MuteBites on WhatsApp"
        className="flex size-11 items-center justify-center rounded-xl bg-success text-success-foreground outline-none hover:bg-success/90 focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        <MessageCircle className="size-4" />
      </a>
    </div>
  );
}
