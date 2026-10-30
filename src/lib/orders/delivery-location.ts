export type DeliveryLocation = "SRM AP" | "Friends PG";

export const DEFAULT_DELIVERY_LOCATION: DeliveryLocation = "SRM AP";

export const DELIVERY_LOCATIONS: {
  id: DeliveryLocation;
  label: string;
  subtext: string;
}[] = [
  { id: "SRM AP", label: "SRM AP", subtext: "Gate 3 Handover" },
  { id: "Friends PG", label: "Friends PG", subtext: "Main Entrance" },
];

/**
 * Encodes the delivery location into order notes string in a standard tag format:
 * `[Delivery: Friends PG] User custom note here`
 */
export function formatOrderNotes(location: DeliveryLocation, userNotes: string): string {
  const locTag = `[Delivery: ${location}]`;
  const clean = userNotes.trim();
  return clean ? `${locTag} ${clean}` : locTag;
}

/**
 * Extracts delivery location and the student's clean custom note.
 * If no tag is found or for historical orders, defaults location to "SRM AP".
 */
export function parseDeliveryLocation(notes: string | null | undefined): {
  location: DeliveryLocation;
  cleanNotes: string;
} {
  if (!notes) {
    return { location: DEFAULT_DELIVERY_LOCATION, cleanNotes: "" };
  }

  const match = notes.match(/^\[Delivery:\s*(Friends PG|SRM AP)\]\s*([\s\S]*)$/i);
  if (match) {
    const loc = match[1].toLowerCase().includes("friends") ? "Friends PG" : "SRM AP";
    return {
      location: loc as DeliveryLocation,
      cleanNotes: match[2]?.trim() ?? "",
    };
  }

  return {
    location: DEFAULT_DELIVERY_LOCATION,
    cleanNotes: notes.trim(),
  };
}
