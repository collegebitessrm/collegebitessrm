const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True for a well-formed UUID. Detail fetchers check this first so a
 * mangled or hand-typed URL (/restaurants/abc) is treated as "not found"
 * and gets the 404 page, instead of Postgres rejecting the id and the
 * request surfacing as a server error.
 */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
