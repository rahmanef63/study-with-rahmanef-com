"use client";
// materi slice — the skills-only reads.
//
// Browsing a skill, opening it, tagging it and linking to it all go through the
// materi hooks: a skill IS a materi. What is skill-specific is SEARCH, because
// the thing you search a prompt catalogue by is the prompt, and the tenant
// search index only covers `contentMd` (see the long note at the top of
// convex/features/materi/skills.ts for why there is no mirror and no second
// index).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useDebouncedValue } from "@/features/search";
import {
  SKILL_QUERY_MAX,
  SKILL_QUERY_MIN,
  SKILL_SEARCH_DEBOUNCE_MS,
} from "../config/limits";
import type { MateriCard, MateriSort } from "../types";

export type SkillSearch = {
  /** Trimmed keyword actually sent (empty while inactive). */
  q: string;
  /** Long enough to search — drives the "ketik minimal 2 huruf" hint. */
  active: boolean;
  /** `undefined` = in flight. Only meaningful while `active`. */
  hits: MateriCard[] | undefined;
};

/**
 * MEMBER+. Search the skills library by TITLE or PROMPT TEXT, debounced.
 *
 * Two client-side gates, both UX only (the server re-validates and would throw
 * VALIDATION_FAILED, which convex/react rethrows during render):
 *   · the query is SKIPPED until the trimmed keyword is inside the server's
 *     2–60 window, so a single typed character never reaches the wire;
 *   · the keyword is debounced, because this is a bounded SCAN rather than an
 *     index probe — one read per keystroke is exactly the cost the scan's
 *     bound exists to keep small.
 *
 * Not paginated: it answers the top 20 matches and stops. `tag` and `sort` are
 * passed through so a search inside a tag, ordered A→Z, means what it says —
 * and unlike the library's in-page A→Z, THIS sort is global over the matched
 * set, because every match is already in memory server-side.
 */
export function useSkillSearch(
  tenantId: Id<"tenants"> | undefined,
  rawQuery: string,
  tag: string | null,
  sort: MateriSort,
  enabled: boolean
): SkillSearch {
  const raw = rawQuery.trim().slice(0, SKILL_QUERY_MAX);
  const q = useDebouncedValue(raw, SKILL_SEARCH_DEBOUNCE_MS);
  // `active` reads the LIVE keyword, not the debounced one: the hint must flip
  // off on the second keystroke, otherwise "ketik minimal 2 huruf" flashes for
  // 300ms under a box the reader has already filled.
  const active = raw.length >= SKILL_QUERY_MIN;
  const ready = enabled && tenantId !== undefined && q.length >= SKILL_QUERY_MIN;
  const hits = useQuery(
    api.features.materi.skills.searchSkills,
    ready && tenantId !== undefined
      ? { tenantId, q, ...(tag === null ? {} : { tag }), sort }
      : "skip"
  );
  // Between the second keystroke and the debounce firing this is `undefined`
  // with `active` true — which the view reads as "in flight", the truth.
  return { q, active, hits: active ? hits : undefined };
}
