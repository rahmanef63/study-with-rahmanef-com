"use client";
// os-shell shell-search — wires appshell's Cmd-K Spotlight (ShellCapabilities.
// useSearch) to REAL data: active komunitas + their published kelas, queried
// imperatively over the EXISTING Convex read surface (no backend change). A hit's
// `run` opens the matching app via openApp so the result is deep-linkable.
//
// STABILITY (appshell contract, capabilities.tsx): the returned search fn MUST be
// referentially stable — Spotlight reads it as an effect dep, so a fresh closure
// each render spins an infinite loop. useConvex()'s client is stable, so we wrap
// the fn in useCallback([convex]). Best-effort: any failure degrades to [] (the
// palette shows "no results") and one failing tenant never nukes the others.
import { useCallback } from "react";
import { useConvex } from "convex/react";
import { api } from "@convex/_generated/api";
// PERF: light entries/`import type` only — eager shell chrome; the full
// tenants/courses barrels would drag every view into the initial JS chunk.
import { tenantsApi } from "@/features/tenants/api";
import type { PublicTenant } from "@/features/tenants/hooks";
import type { CourseCardData } from "@/features/courses";
import type { SearchHit } from "@/features/appshell";
import { openApp } from "./apps/_nav";

const TENANT_LIMIT = 20; // active komunitas scanned per search
const MAX_HITS = 12; // Spotlight result cap

/** Returns a STABLE (query) => Promise<SearchHit[]> over komunitas + kelas. */
export function useShellSearch(): (query: string) => Promise<SearchHit[]> {
  const convex = useConvex();
  return useCallback(
    async (query: string): Promise<SearchHit[]> => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      try {
        const tenants = (await convex.query(tenantsApi.listActive, {
          limit: TENANT_LIMIT,
        })) as PublicTenant[];

        // Fan out the per-tenant kelas reads in parallel (never serialize); a
        // single tenant's failure yields [] for that tenant, not a rejected all.
        const courseLists = await Promise.all(
          tenants.map(
            (t): Promise<CourseCardData[]> =>
              convex
                .query(api.features.courses.queries.listPublished, { tenantId: t._id })
                .catch(() => []),
          ),
        );

        const hits: SearchHit[] = [];
        tenants.forEach((tenant, i) => {
          if (`${tenant.name} ${tenant.description}`.toLowerCase().includes(q)) {
            hits.push({
              id: `t-${tenant._id}`,
              label: tenant.name,
              hint: "Komunitas",
              run: () => openApp("komunitas", tenant.name, [tenant.slug]),
            });
          }
          for (const course of courseLists[i]) {
            if (course.title.toLowerCase().includes(q)) {
              hits.push({
                id: `c-${course._id}`,
                label: course.title,
                hint: tenant.name,
                run: () => openApp("kelas", course.title, [tenant.slug, course.slug]),
              });
            }
          }
        });
        return hits.slice(0, MAX_HITS);
      } catch {
        return []; // best-effort UX — Spotlight degrades to "no results"
      }
    },
    [convex],
  );
}
