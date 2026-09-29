// Daily ordering schedule (IST) — the app-side mirror of
// public.ordering_schedule_open() in
// supabase/migrations/20260919000000_ordering_schedule.sql. The database
// function is the real enforcement (place_order() refuses outside it);
// this only drives what the UI says ("Ordering opens at 1:30 PM").
// Change both together.
//
//   10:30 AM – 12:45 PM  open    slot 1 → delivered by 1:30 PM
//   12:45 PM –  1:30 PM  closed  slot 1 being delivered
//    1:30 PM –  6:00 PM  open    slot 2 → delivered by 7:30 PM
//    6:00 PM –  7:00 PM  open    slot 3 → delivered by 8:15 PM
//    7:00 PM – 10:30 AM  closed  done for the day

export type OrderingMode = "auto" | "open" | "closed";

const IST = "Asia/Kolkata";
const hourMinuteFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Minutes since IST midnight. */
export function istMinutes(at: Date = new Date()): number {
  const [h, m] = hourMinuteFmt.format(at).split(":").map(Number);
  return (h % 24) * 60 + m;
}

const at = (h: number, m = 0) => h * 60 + m;
export const FIRST_OPEN = at(10, 30);
export const SLOT1_CUTOFF = at(12, 45);
export const SLOT2_OPEN = at(13, 30);
export const SLOT2_CUTOFF = at(18);
export const LAST_CUTOFF = at(19);

export function scheduleOpen(now: Date = new Date()): boolean {
  const m = istMinutes(now);
  return (m >= FIRST_OPEN && m < SLOT1_CUTOFF) || (m >= SLOT2_OPEN && m < LAST_CUTOFF);
}

export type OrderingState = {
  /** Can a student place an order right now (what place_order() will allow). */
  open: boolean;
  mode: OrderingMode;
  /** Short chip text when closed: "Opens 1:30 PM", "Paused". Empty when open. */
  short: string;
  /** One-line headline when closed. Empty when open. */
  headline: string;
  /** A sentence of context under the headline. Empty when open. */
  detail: string;
  /** When open under the schedule: "12:45 PM" / "7:00 PM" — the current cut-off. */
  closesAt: string | null;
};

/**
 * What to show for ordering right now. `open` comes from the database
 * (public.ordering_is_open()) so the UI can never disagree with what
 * place_order() will actually allow; the wording is derived here.
 */
export function describeOrdering(mode: OrderingMode, open: boolean, now: Date = new Date()): OrderingState {
  const m = istMinutes(now);
  const closesAt = mode === "auto" && open ? (m < SLOT1_CUTOFF ? "12:45 PM" : "7:00 PM") : null;

  if (open) return { open, mode, short: "", headline: "", detail: "", closesAt };

  if (mode === "closed") {
    return {
      open,
      mode,
      short: "Paused",
      headline: "Ordering is paused right now",
      detail: "The MuteBites team has paused ordering. Menus stay open for browsing — check back in a bit.",
      closesAt,
    };
  }

  if (m < FIRST_OPEN) {
    return {
      open,
      mode,
      short: "Opens 10:30 AM",
      headline: "Ordering opens at 10:30 AM",
      detail: "Order between 10:30 AM and 12:45 PM for delivery by 1:30 PM.",
      closesAt,
    };
  }
  if (m >= SLOT1_CUTOFF && m < SLOT2_OPEN) {
    return {
      open,
      mode,
      short: "Opens 1:30 PM",
      headline: "Ordering opens again at 1:30 PM",
      detail: "The lunch slot is on its way. Order from 1:30 PM for delivery by 7:30 PM.",
      closesAt,
    };
  }
  return {
    open,
    mode,
    short: "Opens 10:30 AM",
    headline: "Ordering's closed for today",
    detail: "Today's last slot has closed. Ordering opens again at 10:30 AM tomorrow.",
    closesAt,
  };
}
