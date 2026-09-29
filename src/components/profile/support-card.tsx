import { SupportButtons } from "@/components/support-buttons";

/** "Need help?" card with Call + WhatsApp buttons — platform-wide, not tied to one order's restaurant. */
export function SupportCard() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border bg-card shadow-card px-5 py-4">
      <div>
        <p className="text-sm text-muted-foreground">Need help?</p>
        <p className="font-semibold">Contact MuteBites</p>
      </div>
      <SupportButtons whatsappMessage="Hi MuteBites, I need help with my order." />
    </div>
  );
}
