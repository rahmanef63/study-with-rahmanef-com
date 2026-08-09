// The non-flagship communities (seed:seedWorld). The flagship itself is
// created by seed:bootstrap, never here.
import type { SeedCommunity } from "./types";
import { COMMUNITY_KARIER_DIGITAL } from "./communityKarierDigital";
import { COMMUNITY_KREATOR_KONTEN } from "./communityKreatorKonten";

export const EXTRA_COMMUNITIES: SeedCommunity[] = [
  COMMUNITY_KARIER_DIGITAL,
  COMMUNITY_KREATOR_KONTEN,
];
