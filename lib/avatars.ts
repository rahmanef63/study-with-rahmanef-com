// The avatars the product ships, and the rule for what counts as one.
//
// SSOT for two places that must never disagree: the picker in Pengaturan writes
// one of these paths, and `convex/features/profiles/mutations.updateProfile`
// decides whether to accept it. If the picker offered a path the validator
// rejected, the failure would be a toast on save with no way for the reader to
// tell which of the six was the bad one.
//
// RELATIVE PATHS, NOT ABSOLUTE URLs, deliberately. The validator's existing rule
// is "must start with https://", and the obvious way to satisfy it would be to
// store `https://study-with.rahmanef.com/profiles/avatar-pria-1.webp`. That
// bakes the origin into every row: local dev would write localhost URLs that
// break the moment they reach production, and a domain change would orphan
// every avatar in the table. A path is portable; the origin is not data.
export type BundledAvatar = {
  /** Stored verbatim in `profiles.avatarUrl`. */
  path: string;
  /** The picker's accessible name — a screen reader gets this, not a filename. */
  label: string;
};

export const BUNDLED_AVATARS: readonly BundledAvatar[] = [
  { path: "/profiles/avatar-default.png", label: "Siluet netral" },
  { path: "/profiles/avatar-pria-1.webp", label: "Pria berkemeja putih" },
  { path: "/profiles/avatar-pria-2.webp", label: "Pria menoleh" },
  { path: "/profiles/avatar-wanita-1.webp", label: "Wanita berambut panjang" },
  { path: "/profiles/avatar-berhijab-1.webp", label: "Wanita berhijab ungu" },
  { path: "/profiles/avatar-badge.webp", label: "Potret berbingkai emas" },
];

/**
 * Is this one of ours?
 *
 * An ALLOW-LIST, not a pattern. A `^/profiles/.+\.webp$` regex would also accept
 * any other file that ever lands in that folder, and `avatarUrl` is rendered as
 * an image on a public profile — the set of things a member can point it at
 * should be the set we actually ship, not the set that happens to be on disk.
 */
export function isBundledAvatar(value: string): boolean {
  return BUNDLED_AVATARS.some((a) => a.path === value);
}
