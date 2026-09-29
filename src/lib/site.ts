/**
 * The public address and wording search engines and link previews use.
 * NEXT_PUBLIC_SITE_URL overrides the address (e.g. after moving to a
 * custom domain) without a code change.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mutebites.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "MuteBites";

export const SITE_TITLE = "MuteBites — Food delivery for VIT-AP students";

export const SITE_DESCRIPTION =
  "Order biryani, Chinese, fresh juice and fruit from campus kitchens at VIT-AP University, Amaravati. Pick up at VIT-AP Main Gate and pay cash on delivery.";
