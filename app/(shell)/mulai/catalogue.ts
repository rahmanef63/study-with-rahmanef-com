import "server-only";
// What the platform ACTUALLY has, right now.
//
// The engine's path catalogue is data compiled into the bundle: ten course
// slugs and thirteen materi slugs that were true the day it was written. This
// module is the reality check. Anything it does not report is rendered as
// plain text instead of a link, so an unpublished course can never turn a
// recommendation into a 404 on a stranger's first tap.
//
// Every query here is on the ANONYMOUS ETALASE WHITELIST (AGENTS.md §6) and
// goes through `safeQuery`, which never throws: a Convex outage yields an
// EMPTY catalogue, the plan still renders, and the links simply degrade. The
// assessment itself is pure arithmetic and does not need this at all.
import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import { CONCEPT_MATERI, PATHS } from "@/lib/peta";
import type { LiveCatalogue, LiveCommunity } from "@/features/peta";

/** Only the materi the concept map can point at — never the whole library. */
function wantedMateri(): Map<string, Set<string>> {
  const wanted = new Map<string, Set<string>>();
  for (const ref of Object.values(CONCEPT_MATERI)) {
    if (ref === null) continue;
    const set = wanted.get(ref.communitySlug) ?? new Set<string>();
    set.add(ref.materiSlug);
    wanted.set(ref.communitySlug, set);
  }
  return wanted;
}

/** Communities the plan can possibly mention. Three today, derived not typed. */
function communitySlugs(): string[] {
  const slugs = new Set<string>(PATHS.map((path) => path.communitySlug));
  for (const slug of wantedMateri().keys()) slugs.add(slug);
  return [...slugs];
}

async function readCommunity(
  slug: string,
  wanted: Set<string>
): Promise<LiveCommunity | null> {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  // null = unknown slug, suspended community, or Convex down. All three mean
  // the same thing here: do not link into it.
  if (tenant === null) return null;

  const [courses, slugs] = await Promise.all([
    safeQuery(api.features.courses.queries.listPublished, { tenantId: tenant._id }),
    safeQuery(api.features.materi.queries.publicListSlugs, { tenantId: tenant._id }),
  ]);

  return {
    slug: tenant.slug,
    name: tenant.name,
    tenantId: tenant._id,
    courses: (courses ?? []).map((course) => ({ slug: course.slug, title: course.title })),
    materiSlugs: (slugs ?? [])
      .filter((row) => row.kind === "materi" && wanted.has(row.slug))
      .map((row) => row.slug),
  };
}

/** One round of reads, all three communities in parallel. */
export async function readCatalogue(): Promise<LiveCatalogue> {
  const wanted = wantedMateri();
  const rows = await Promise.all(
    communitySlugs().map((slug) => readCommunity(slug, wanted.get(slug) ?? new Set()))
  );
  return { communities: rows.filter((row): row is LiveCommunity => row !== null) };
}
