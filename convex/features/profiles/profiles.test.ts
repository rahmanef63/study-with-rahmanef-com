/// <reference types="vite/client" />
// convex-test coverage for the profiles feature (DoD §5.2: every mutation and
// query incl. the authz-denied path — P0). Pattern: convex/seed.test.ts.
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Function modules for convex-test — seed.test.ts pattern, but rooted at the
// project ("/convex/**"): relative globs from a nested test file give the
// importer's own dir "./x.ts" keys while everything else gets "../../x.ts",
// which breaks convex-test's common-prefix module lookup.
const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

type UserSeed = { name?: string; email?: string; image?: string };

function makeT() {
  return convexTest(schema, modules);
}

async function insertUser(t: ReturnType<typeof makeT>, seed: UserSeed) {
  return await t.run(async (ctx) => await ctx.db.insert("users", seed));
}

/** Authed accessor — @convex-dev/auth reads the user id from subject's first `|` segment. */
function asUser(t: ReturnType<typeof makeT>, userId: Id<"users">) {
  return t.withIdentity({ subject: `${userId}|test-session` });
}

async function expectCode(promise: Promise<unknown>, code: string) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected rejection with code ${code}`).toBeDefined();
  expect(caught).toBeInstanceOf(ConvexError);
  expect((caught as ConvexError<{ code: string }>).data.code).toBe(code);
}

describe("authz-denied paths (P0)", () => {
  test("all public functions reject unauthenticated callers", async () => {
    const t = makeT();
    await expectCode(
      t.query(api.features.profiles.queries.getCurrentProfile, {}),
      "NOT_AUTHENTICATED"
    );
    await expectCode(
      t.query(api.features.profiles.queries.checkUsername, { username: "abc" }),
      "NOT_AUTHENTICATED"
    );
    await expectCode(
      t.mutation(api.features.profiles.mutations.ensureProfile, {}),
      "NOT_AUTHENTICATED"
    );
    await expectCode(
      t.mutation(api.features.profiles.mutations.updateProfile, {}),
      "NOT_AUTHENTICATED"
    );
  });
});

describe("ensureProfile", () => {
  test("creates a profile from Google account data, idempotently", async () => {
    const t = makeT();
    const userId = await insertUser(t, {
      name: "Rahman Ef",
      email: "rahmanef63@gmail.com",
      image: "https://lh3.googleusercontent.com/a/avatar",
    });
    const authed = asUser(t, userId);

    const first = await authed.mutation(api.features.profiles.mutations.ensureProfile, {});
    expect(first.username).toBe("rahman-ef");
    expect(first.displayName).toBe("Rahman Ef");
    expect(first.avatarUrl).toBe("https://lh3.googleusercontent.com/a/avatar");
    expect(first.isPlatformAdmin).toBeUndefined(); // P0: never set here

    const second = await authed.mutation(api.features.profiles.mutations.ensureProfile, {});
    expect(second._id).toBe(first._id);
    await t.run(async (ctx) => {
      const rows = await ctx.db.query("profiles").collect();
      expect(rows).toHaveLength(1);
    });
  });

  test("suffixes on collision instead of failing first login", async () => {
    const t = makeT();
    const a = await insertUser(t, { name: "Rahman Ef", email: "a@x.com" });
    const b = await insertUser(t, { name: "Rahman EF", email: "b@x.com" });
    const first = await asUser(t, a).mutation(api.features.profiles.mutations.ensureProfile, {});
    const second = await asUser(t, b).mutation(api.features.profiles.mutations.ensureProfile, {});
    expect(first.username).toBe("rahman-ef");
    expect(second.username).toBe("rahman-ef-2");
  });

  test("falls back name → email local part → pengguna", async () => {
    const t = makeT();
    const noName = await insertUser(t, { email: "budi.san@x.com" });
    const bare = await insertUser(t, {});
    const viaEmail = await asUser(t, noName).mutation(api.features.profiles.mutations.ensureProfile, {});
    const viaFallback = await asUser(t, bare).mutation(api.features.profiles.mutations.ensureProfile, {});
    expect(viaEmail.username).toBe("budi-san");
    expect(viaEmail.displayName).toBe("budi.san");
    expect(viaFallback.username).toBe("pengguna");
    expect(viaFallback.displayName).toBe("Pengguna");
  });
});

describe("updateProfile", () => {
  async function setup() {
    const t = makeT();
    const userId = await insertUser(t, { name: "Rahman Ef", email: "a@x.com" });
    const authed = asUser(t, userId);
    await authed.mutation(api.features.profiles.mutations.ensureProfile, {});
    return { t, authed };
  }

  test("rejects before ensureProfile has run", async () => {
    const t = makeT();
    const userId = await insertUser(t, { email: "x@y.com" });
    await expectCode(
      asUser(t, userId).mutation(api.features.profiles.mutations.updateProfile, {
        displayName: "X",
      }),
      "NOT_FOUND"
    );
  });

  test("patches provided fields; empty string clears optionals", async () => {
    const { authed } = await setup();
    const updated = await authed.mutation(api.features.profiles.mutations.updateProfile, {
      username: "Rahman EF 63", // normalized on the server
      displayName: "  Rahman  ",
      bio: "Halo semua",
      avatarUrl: "https://example.com/a.png",
    });
    expect(updated.username).toBe("rahman-ef-63");
    expect(updated.displayName).toBe("Rahman");
    expect(updated.bio).toBe("Halo semua");
    expect(updated.avatarUrl).toBe("https://example.com/a.png");

    const cleared = await authed.mutation(api.features.profiles.mutations.updateProfile, {
      bio: "",
      avatarUrl: "",
    });
    expect(cleared.bio).toBeUndefined();
    expect(cleared.avatarUrl).toBeUndefined();
    expect(cleared.username).toBe("rahman-ef-63"); // untouched fields survive
  });

  test("keeping your own username is a no-op, not a collision", async () => {
    const { authed } = await setup();
    const updated = await authed.mutation(api.features.profiles.mutations.updateProfile, {
      username: "rahman-ef",
      displayName: "Rahman",
    });
    expect(updated.username).toBe("rahman-ef");
  });

  test("explicit rename to a taken username rejects VALIDATION_FAILED", async () => {
    const { t, authed } = await setup();
    const otherId = await insertUser(t, { name: "Orang Lain", email: "b@x.com" });
    await asUser(t, otherId).mutation(api.features.profiles.mutations.ensureProfile, {});
    await expectCode(
      authed.mutation(api.features.profiles.mutations.updateProfile, {
        username: "orang-lain",
      }),
      "VALIDATION_FAILED"
    );
  });

  test("invalid inputs reject VALIDATION_FAILED", async () => {
    const { authed } = await setup();
    await expectCode(
      authed.mutation(api.features.profiles.mutations.updateProfile, { username: "a!" }),
      "VALIDATION_FAILED"
    );
    await expectCode(
      authed.mutation(api.features.profiles.mutations.updateProfile, { displayName: "   " }),
      "VALIDATION_FAILED"
    );
    await expectCode(
      authed.mutation(api.features.profiles.mutations.updateProfile, {
        avatarUrl: "http://insecure.example.com/a.png",
      }),
      "VALIDATION_FAILED"
    );
    await expectCode(
      authed.mutation(api.features.profiles.mutations.updateProfile, {
        bio: "x".repeat(501),
      }),
      "VALIDATION_FAILED"
    );
  });

  test("isPlatformAdmin is not an accepted argument (P0)", async () => {
    const { authed } = await setup();
    await expect(
      authed.mutation(api.features.profiles.mutations.updateProfile, {
        // @ts-expect-error — deliberately outside the validator
        isPlatformAdmin: true,
      })
    ).rejects.toThrow(/extra field|Validator error/i);
  });

  test("updates never touch an existing isPlatformAdmin flag (P0)", async () => {
    const t = makeT();
    const userId = await insertUser(t, { name: "Admin", email: "admin@x.com" });
    await t.run(async (ctx) => {
      await ctx.db.insert("profiles", {
        userId,
        username: "admin-user",
        displayName: "Admin",
        isPlatformAdmin: true,
      });
    });
    const updated = await asUser(t, userId).mutation(
      api.features.profiles.mutations.updateProfile,
      { displayName: "Admin Baru", bio: "halo" }
    );
    expect(updated.isPlatformAdmin).toBe(true);
  });
});

describe("queries", () => {
  test("getCurrentProfile returns null pre-ensure, then the own row", async () => {
    const t = makeT();
    const userId = await insertUser(t, { name: "Rahman Ef", email: "a@x.com" });
    const authed = asUser(t, userId);
    expect(await authed.query(api.features.profiles.queries.getCurrentProfile, {})).toBeNull();
    await authed.mutation(api.features.profiles.mutations.ensureProfile, {});
    const profile = await authed.query(api.features.profiles.queries.getCurrentProfile, {});
    expect(profile?.userId).toBe(userId);
    expect(profile?.username).toBe("rahman-ef");
  });

  test("checkUsername reports normalization, validity, availability", async () => {
    const t = makeT();
    const meId = await insertUser(t, { name: "Rahman Ef", email: "a@x.com" });
    const otherId = await insertUser(t, { name: "Orang Lain", email: "b@x.com" });
    const me = asUser(t, meId);
    await me.mutation(api.features.profiles.mutations.ensureProfile, {});
    await asUser(t, otherId).mutation(api.features.profiles.mutations.ensureProfile, {});

    expect(
      await me.query(api.features.profiles.queries.checkUsername, { username: "Baru Banget" })
    ).toEqual({ normalized: "baru-banget", valid: true, available: true });
    expect(
      (await me.query(api.features.profiles.queries.checkUsername, { username: "orang-lain" }))
        .available
    ).toBe(false);
    // own current name stays available (self no-op)
    expect(
      (await me.query(api.features.profiles.queries.checkUsername, { username: "Rahman Ef" }))
        .available
    ).toBe(true);
    expect(
      (await me.query(api.features.profiles.queries.checkUsername, { username: "a!" })).valid
    ).toBe(false);
  });
});
