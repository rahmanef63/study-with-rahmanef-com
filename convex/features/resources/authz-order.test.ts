/// <reference types="vite/client" />
// Authz-ORDER regression specs (pattern: courses/authz-order.test.ts; STATUS
// drift log 2026-07-06). Discriminator = a DANGLING id (seed → delete → call as
// anonymous). Read-first code would resolve the deleted id to null → NOT_FOUND
// (an existence oracle for anonymous callers). Our access helpers call
// requireUser BEFORE any by-ID read, so these reject with NOT_AUTHENTICATED —
// the specs FAIL on read-first code and PASS on auth-first code.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { seedResource, seedSuggestion, seedTenantFixture, setup } from "./test.helpers";

test("curate: anonymous + dangling resourceId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const resourceId = await seedResource(t, fx, "pending", fx.memberId);
  await t.run((ctx) => ctx.db.delete(resourceId));

  await expect(
    t.mutation(api.features.resources.resources.curate, { resourceId, decision: "approved" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("setStatus: anonymous + dangling suggestionId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.memberId);
  await t.run((ctx) => ctx.db.delete(suggestionId));

  await expect(
    t.mutation(api.features.resources.suggestions.setStatus, {
      suggestionId,
      status: "planned",
    })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});
