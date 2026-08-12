import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// Every route gets the dashboard rail unless it is on the list below.
//
// This test exists because the old rule was opt-IN — a route was bare unless
// someone remembered to move it into the shelled group — and a probe of
// production found SIX endpoints with no navigation at all. Reviewing a diff
// never catches that: adding `app/foo/page.tsx` looks complete on its own. Only
// enumerating the tree does.
//
// Adding a route to BARE is allowed; doing it silently is not. Write the reason
// next to it, because "this page should have no way out" is a claim that has
// been wrong here before.
const BARE = new Map([
  [
    "/offline",
    // The service-worker fallback, rendered when there is NO network. The rail
    // mounts <ShellAccountNav/>, which asks Convex who you are — offline that
    // never resolves and the rows sit as skeletons forever. A page whose whole
    // job is "you are offline, here is what still works" cannot depend on a
    // round trip to say it.
    "renders with no network; the rail's auth island would never resolve",
  ],
]);

/** Route path for every page.tsx, with route groups stripped (they are not URLs). */
function routes(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) {
      if (entry === "page.tsx") out.push(prefix === "" ? "/" : prefix);
      continue;
    }
    if (entry.startsWith("_") || entry === "__tests__" || entry === "api") continue;
    const isGroup = entry.startsWith("(") && entry.endsWith(")");
    out.push(...routes(full, isGroup ? prefix : `${prefix}/${entry}`));
  }
  return out;
}

test("every route is inside the shelled group, or explicitly and legibly bare", () => {
  const shelled = new Set(routes("app/(shell)"));
  const community = new Set(routes("app/k"));
  const unaccounted = routes("app")
    .filter((r) => !shelled.has(r))
    .filter((r) => !community.has(r) && !r.startsWith("/k/"))
    .filter((r) => !BARE.has(r));

  expect(unaccounted, `unshelled routes — move them into app/(shell) or add them to BARE with a reason`).toEqual([]);
});

test("the bare list stays short and every entry carries its reason", () => {
  // Not a style rule: each entry is a page a reader can reach with no way out,
  // so the list growing quietly is the failure mode.
  expect(BARE.size).toBeLessThanOrEqual(3);
  for (const [route, why] of BARE) expect(why.length, route).toBeGreaterThan(20);
});
