// insight feature — assessment RESULT storage. Two functions, both about the
// caller's own row and nothing else.
//
// READ THIS BEFORE WIRING IT UP: the questionnaire is a PURE CLIENT-SIDE
// FUNCTION and must work completely ANONYMOUSLY — no account, no network, no
// paid API (DECISIONS #34; the assessment is a pure function, not a model
// call). Nothing in this module may become a precondition for taking it. All it
// does is PERSIST a result for someone who happened to already be logged in, so
// the home page can greet them with the plan they already have. If saveProfile
// throws, the plan the learner is looking at is still correct — the call site
// should swallow the error, not block the result screen.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { resolveOptionalTenant } from "./access";
import { MAX_ANSWERS, MAX_PATH_SLUGS, MAX_SLUG_LENGTH } from "./constants";
import { fail } from "./errors";

/** Assessment outcome. Kept as three literals so a typo cannot invent a level;
 *  the scoring function is the SSOT for which one you get. */
export const levelValidator = v.union(
  v.literal("pemula"),
  v.literal("menengah"),
  v.literal("mahir")
);

export type LearnerLevel = Doc<"learnerProfiles">["level"];

export type LearnerProfile = {
  level: LearnerLevel;
  pathSlugs: string[];
  answers: Doc<"learnerProfiles">["answers"];
  tenantId: Id<"tenants"> | null;
  updatedAt: number;
};

/** Lowercase slug/id token: what the questionnaire emits and the router reads. */
const TOKEN = /^[a-z0-9][a-z0-9-]*$/;

function assertToken(value: string, label: string): void {
  if (value.length === 0 || value.length > MAX_SLUG_LENGTH || !TOKEN.test(value)) {
    fail("VALIDATION_FAILED", `Format ${label} tidak valid`);
  }
}

/**
 * Dedupe while preserving order. A plan that recommends the same path twice is
 * a scoring bug, but it is the learner's screen that would look broken, so it
 * is normalised here instead of rejected.
 */
function normalisePaths(pathSlugs: string[]): string[] {
  if (pathSlugs.length > MAX_PATH_SLUGS) {
    fail("VALIDATION_FAILED", "Terlalu banyak jalur belajar");
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of pathSlugs) {
    const slug = raw.trim().toLowerCase();
    assertToken(slug, "jalur belajar");
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

function normaliseAnswers(
  answers: Doc<"learnerProfiles">["answers"]
): Doc<"learnerProfiles">["answers"] {
  if (answers.length === 0) fail("VALIDATION_FAILED", "Jawaban tidak boleh kosong");
  if (answers.length > MAX_ANSWERS) fail("VALIDATION_FAILED", "Terlalu banyak jawaban");
  const seen = new Set<string>();
  return answers.map((answer) => {
    const questionId = answer.questionId.trim().toLowerCase();
    const optionId = answer.optionId.trim().toLowerCase();
    assertToken(questionId, "pertanyaan");
    assertToken(optionId, "pilihan");
    // One answer per question: two rows for the same question would make the
    // stored result unable to explain the level it came with.
    if (seen.has(questionId)) fail("VALIDATION_FAILED", "Pertanyaan terjawab dua kali");
    seen.add(questionId);
    return { questionId, optionId };
  });
}

const project = (doc: Doc<"learnerProfiles">): LearnerProfile => ({
  level: doc.level,
  pathSlugs: doc.pathSlugs,
  answers: doc.answers,
  tenantId: doc.tenantId ?? null,
  updatedAt: doc.updatedAt,
});

/**
 * Upsert the caller's assessment result. ONE ROW PER USER — retaking the
 * questionnaire replaces the plan rather than appending a history, because the
 * home page needs one current answer and a history nobody reads is a table that
 * only grows.
 *
 * `userId` comes from ctx, never from args: a caller can only ever write their
 * own plan. `tenantId` is optional provenance and is verified to be an ACTIVE
 * tenant, but membership is NOT required — the whole point is that someone who
 * has joined nothing can still end up with a plan.
 */
export const saveProfile = mutation({
  args: {
    tenantId: v.optional(v.id("tenants")),
    answers: v.array(v.object({ questionId: v.string(), optionId: v.string() })),
    level: levelValidator,
    pathSlugs: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<LearnerProfile> => {
    const userId = await requireUser(ctx); // authz FIRST

    const answers = normaliseAnswers(args.answers);
    const pathSlugs = normalisePaths(args.pathSlugs);
    const tenantId = await resolveOptionalTenant(ctx, args.tenantId);
    const patch = { tenantId, answers, level: args.level, pathSlugs, updatedAt: Date.now() };

    const existing = await ctx.db
      .query("learnerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing === null) {
      const id = await ctx.db.insert("learnerProfiles", { userId, ...patch });
      const inserted = await ctx.db.get(id);
      if (inserted === null) fail("NOT_FOUND", "Profil belajar tidak ditemukan");
      return project(inserted);
    }
    await ctx.db.patch(existing._id, patch);
    return project({ ...existing, ...patch });
  },
});

/**
 * The caller's own saved plan, or `null` if they have never finished the
 * questionnaire while logged in. Never returns anyone else's row — there is no
 * `userId` argument to pass.
 *
 * Throws NOT_AUTHENTICATED for anonymous callers rather than returning null:
 * "no session" and "no plan yet" are different states and the home page must
 * not confuse them. Call it with `"skip"` while logged out.
 */
export const myProfile = query({
  args: {},
  handler: async (ctx): Promise<LearnerProfile | null> => {
    const userId = await requireUser(ctx); // authz FIRST
    const doc = await ctx.db
      .query("learnerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return doc === null ? null : project(doc);
  },
});
