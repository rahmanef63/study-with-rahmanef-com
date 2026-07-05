// profiles — public mutations (v1 minimal scope, docs/AGENT-PROMPTS.md #4).
// P0s honored here:
// - v.* validators + requireUser as the FIRST handler line (rr "server-side authz").
// - isPlatformAdmin is READ-ONLY from this slice: no arg accepts it, no code
//   path writes it. Only convex/seed.ts (integrator) sets it.
// - Uniqueness via by_username index lookups only — no bare .collect().
import { ConvexError, v } from "convex/values";
import { requireUser } from "../../_shared/auth";
import { mutation, type MutationCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX,
  usernameCandidates,
} from "./username";
import { AVATAR_URL_MAX, BIO_MAX, DISPLAY_NAME_MAX } from "./types";

async function usernameTaken(
  ctx: MutationCtx,
  username: string,
  selfUserId?: Id<"users">
): Promise<boolean> {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique();
  return existing !== null && existing.userId !== selfUserId;
}

/** First free username from `base`: base, base-2, base-3… (index checks only). */
async function firstFreeUsername(ctx: MutationCtx, base: string): Promise<string> {
  if (!(await usernameTaken(ctx, base))) return base;
  for (let n = 2; n <= 50; n++) {
    const suffix = `-${n}`;
    const candidate =
      base.slice(0, USERNAME_MAX - suffix.length).replace(/-+$/g, "") + suffix;
    if (!(await usernameTaken(ctx, candidate))) return candidate;
  }
  // Statistically unreachable; keeps the loop bounded either way.
  return `pengguna-${Date.now().toString(36)}`.slice(0, USERNAME_MAX);
}

/**
 * Ensure-on-first-login (PRD R1: "profil auto-terbuat saat login pertama").
 * Idempotent: returns the existing profile untouched when present. Username is
 * derived from the Google account (name → email local part) and auto-suffixed
 * on collision — auto-creation must never fail the login flow, so this path
 * suffixes instead of rejecting; explicit renames in updateProfile DO reject.
 */
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx): Promise<Doc<"profiles">> => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing !== null) return existing;

    const user = await ctx.db.get(userId);
    const [base] = usernameCandidates(user?.name, user?.email);
    const username = await firstFreeUsername(ctx, base);
    const displayName =
      (user?.name ?? user?.email?.split("@")[0] ?? "Pengguna")
        .trim()
        .slice(0, DISPLAY_NAME_MAX) || "Pengguna";

    const profileId = await ctx.db.insert("profiles", {
      userId,
      username,
      displayName,
      ...(user?.image ? { avatarUrl: user.image } : {}),
      // isPlatformAdmin intentionally NOT set — P0, seed/integrator only.
    });
    const created = await ctx.db.get(profileId);
    if (created === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Profil gagal dibuat" });
    }
    return created;
  },
});

function fail(message: string): never {
  throw new ConvexError({ code: "VALIDATION_FAILED", message });
}

/**
 * Settings-form save. All fields optional; only provided fields are patched.
 * Empty string on bio/avatarUrl clears the field. Explicit username change to
 * a taken name rejects VALIDATION_FAILED (docs/AGENT-PROMPTS.md #4).
 */
export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Doc<"profiles">> => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Profil belum dibuat" });
    }

    const patch: Partial<Doc<"profiles">> = {};

    if (args.username !== undefined) {
      const normalized = normalizeUsername(args.username);
      if (!isValidUsername(normalized)) {
        fail("Username harus 3-30 karakter huruf kecil, angka, atau tanda hubung");
      }
      if (normalized !== profile.username) {
        if (await usernameTaken(ctx, normalized, userId)) {
          fail("Username sudah dipakai, coba yang lain");
        }
        patch.username = normalized;
      }
    }
    if (args.displayName !== undefined) {
      const displayName = args.displayName.trim();
      if (displayName.length === 0 || displayName.length > DISPLAY_NAME_MAX) {
        fail(`Nama tampilan wajib diisi, maksimal ${DISPLAY_NAME_MAX} karakter`);
      }
      patch.displayName = displayName;
    }
    if (args.bio !== undefined) {
      const bio = args.bio.trim();
      if (bio.length > BIO_MAX) fail(`Bio maksimal ${BIO_MAX} karakter`);
      patch.bio = bio.length === 0 ? undefined : bio;
    }
    if (args.avatarUrl !== undefined) {
      const avatarUrl = args.avatarUrl.trim();
      if (avatarUrl.length > 0) {
        if (!avatarUrl.startsWith("https://") || avatarUrl.length > AVATAR_URL_MAX) {
          fail("URL avatar harus https:// dan tidak terlalu panjang");
        }
      }
      patch.avatarUrl = avatarUrl.length === 0 ? undefined : avatarUrl;
    }

    if (Object.keys(patch).length > 0) await ctx.db.patch(profile._id, patch);
    const updated = await ctx.db.get(profile._id);
    if (updated === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Profil tidak ditemukan" });
    }
    return updated;
  },
});
