/** Small initials avatar for admin people lists (users, banned). */
export function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
  return (
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft font-heading font-bold text-brand-soft-foreground"
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}
