/**
 * The public address and wording search engines and link previews use.
 * NEXT_PUBLIC_SITE_URL overrides the address (e.g. after moving to a
 * custom domain) without a code change.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://collegebitessrm.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "College Bites";

export const SITE_TITLE = "College Bites | Food delivery for SRM University AP students";

export const SITE_DESCRIPTION =
 "Order biryani, fried rice, noodles and starters from kitchens near SRM University AP, Amaravati. Pick up at Gate 3 and pay on delivery with cash or UPI.";
