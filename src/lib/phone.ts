// Phone numbers are stored in exactly one shape, "+91XXXXXXXXXX", because
// bans are enforced by exact phone match (public.current_user_is_banned).
// Two spellings of the same number would slip past a ban.

/** Returns "+91XXXXXXXXXX" for a valid Indian mobile number, else null. */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** "9032563455" → "90325 63455" (for display while typing). */
export function formatLocalMobile(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
}

/** "+919032563455" → "+91 90325 63455". */
export function formatStoredMobile(stored: string): string {
  const local = stored.replace(/^\+91/, "");
  return `+91 ${formatLocalMobile(local)}`;
}

/** "+919032563455" → "https://wa.me/919032563455" (optionally with a prefilled message). */
export function whatsAppLink(stored: string, message?: string): string {
  const digits = stored.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
