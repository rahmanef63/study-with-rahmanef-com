// Per-slice types (rr naming). Server-owned codes/limits re-exported from the
// convex feature so client copy mapping and server throws share one SSOT —
// @convex/* is an allowed import path (rr "barrel-only cross-slice imports").
import type { Doc } from "@convex/_generated/dataModel";

export {
  AVATAR_URL_MAX,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  PROFILE_ERROR_CODES,
} from "@convex/features/profiles/types";
export type {
  Badge,
  Certificate,
  ProfileErrorCode,
  PublicProfile,
  UsernameCheck,
} from "@convex/features/profiles/types";

// Import for local use in the label/prop types below (SSOT stays server-side).
import type { Badge, PublicProfile } from "@convex/features/profiles/types";

/**
 * Result of the public /u/[username] read. The queries THROW NOT_FOUND for an
 * unknown handle (API contract, asserted in public.test.ts); that throw is
 * surfaced by useQuery to the slice's error boundary, so this hook result only
 * models loading → loaded. `profile` is non-null whenever `isLoading` is false.
 */
export type PublicProfileData = {
  profile: PublicProfile | null;
  badges: Badge[];
  isLoading: boolean;
};

/** Every user-facing string on the public profile page — props-driven. */
export type PublicProfileLabels = {
  loading: string;
  notFoundTitle: string;
  notFoundBody: string;
  /** Title/body when the page fails to load for a reason other than not-found. */
  errorTitle: string;
  errorBody: string;
  bioEmpty: string;
  badgesTitle: string;
  badgesEmpty: string;
  /** Prefix before the earned date, e.g. "Diselesaikan". */
  badgeEarnedPrefix: string;
  /** Accessible label + tooltip for the share/ID copy button. */
  copyLabel: string;
  /** Transient confirmation after copying. */
  copiedLabel: string;
  /** Owner-only "Edit profil" action shown next to the copy button. */
  editLabel: string;
};

// --- Public certificate page (/sertifikat/<completionId>, STATUS #24) -------

/**
 * Result of the anonymous certificate read. The query THROWS NOT_FOUND for an
 * unknown/invalid id (asserted in certificate.test.ts); that throw surfaces
 * via the slice error boundary, so this hook result only models loading →
 * loaded. `certificate` is non-null whenever `isLoading` is false.
 */
export type CertificateData = {
  certificate: import("@convex/features/profiles/types").Certificate | null;
  isLoading: boolean;
};

/** Every user-facing string on the certificate page — props-driven. */
export type CertificateLabels = {
  loading: string;
  notFoundTitle: string;
  notFoundBody: string;
  errorTitle: string;
  errorBody: string;
  /** Small eyebrow above the card, e.g. "Sertifikat Kelas". */
  eyebrow: string;
  /** Document title, e.g. "Sertifikat Penyelesaian". */
  heading: string;
  /** Lead-in above the recipient name, e.g. "Diberikan kepada". */
  awardedTo: string;
  /** Lead-in above the course title, e.g. "atas penyelesaian kelas". */
  courseIntro: string;
  /** Prefix before the community name, e.g. "di komunitas". */
  communityPrefix: string;
  /** Prefix before the earned date, e.g. "Diselesaikan pada". */
  earnedPrefix: string;
  /** Accessible label for the copy-share-link button. */
  copyLabel: string;
  /** Transient confirmation after copying. */
  copiedLabel: string;
};

/** Own-profile shape returned by getCurrentProfile (full doc — self read). */
export type CurrentProfile = Doc<"profiles">;

/** Controlled values of the settings form (empty string = cleared optional). */
export type ProfileFormValues = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
};

/** Every user-facing string — props-driven, defaults in config/labels.ts. */
export type ProfileLabels = {
  title: string;
  subtitle: string;
  usernameLabel: string;
  usernameHelp: string;
  usernameChecking: string;
  usernameAvailable: string;
  usernameTaken: string;
  usernameInvalid: string;
  displayNameLabel: string;
  bioLabel: string;
  bioPlaceholder: string;
  avatarUrlLabel: string;
  avatarUrlHelp: string;
  save: string;
  saving: string;
  saved: string;
  /** Subtle footer link to the public /u/[username] page. */
  viewPublicProfile: string;
  signInPrompt: string;
  /** CTA on the signed-out settings dead-end (routes to /login). */
  signInAction: string;
  preparingProfile: string;
  errors: Record<import("@convex/features/profiles/types").ProfileErrorCode, string>;
  errorFallback: string;
};
