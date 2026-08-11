// peta slice — the types the ROUTE and the engine exchange.
//
// The assessment engine (`@/lib/peta`) knows no URLs and no Convex; this slice
// is the half that does. Everything here is PLAIN DATA on purpose: the /mulai
// page is a server component and the deck is a client one, and a function prop
// cannot cross that boundary (it has broken this app three times).
import type { Id } from "@convex/_generated/dataModel";

/** One published course as the LIVE catalogue reports it right now. */
export type LiveCourse = {
  slug: string;
  /** The live title, which may differ from the seeded one the engine carries. */
  title: string;
};

/** One community, read anonymously through the etalase whitelist. */
export type LiveCommunity = {
  slug: string;
  name: string;
  tenantId: Id<"tenants">;
  courses: LiveCourse[];
  /** Published materi slugs the concept map points at — nothing else. */
  materiSlugs: string[];
};

/**
 * The whole live catalogue, as fetched once on the server and handed to the
 * client deck. A recommendation is rendered as a LINK only when its slug is in
 * here, so an unpublished course degrades to plain text instead of a 404.
 */
export type LiveCatalogue = { communities: LiveCommunity[] };

/** Empty catalogue — what a Convex outage yields. Every link degrades, the
 *  plan still renders, nothing throws. */
export const EMPTY_CATALOGUE: LiveCatalogue = { communities: [] };
