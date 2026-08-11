// Resolving a plan against what the platform actually publishes.
//
// The rule under test: a recommendation may lose a link, but it may never
// point at something that is not there. A 404 on the first tap of an
// onboarding flow is the most expensive bug this feature can ship.
import { describe, expect, test } from "vitest";
import { assess, COURSE, type PetaAnswers, type PetaResult } from "@/lib/peta";
import type { Id } from "@convex/_generated/dataModel";
import { communityFor, indexCatalogue, resolveAgainstCatalogue } from "../lib/catalogue";
import { EMPTY_CATALOGUE, type LiveCatalogue, type LiveCommunity } from "../types";

const tenantId = (slug: string) => `tenant_${slug}` as Id<"tenants">;

/** A developer who wants to ship an app — reliably ranks bikin-aplikasi first. */
const BUILDER: PetaAnswers = {
  tenure: "3to12m",
  role: "developer",
  goal: "build-app",
  budget: "100to300k",
  subscriptions: ["claude-pro"],
  weeklyTime: "3to7h",
  known: ["prompt", "hallucination", "few-shot"],
  situation: { codingWithAi: "sometimes", spendPriority: "best-result" },
};

function community(slug: string, courses: string[], materi: string[] = []): LiveCommunity {
  return {
    slug,
    name: slug,
    tenantId: tenantId(slug),
    courses: courses.map((s) => ({ slug: s, title: `LIVE ${s}` })),
    materiSlugs: materi,
  };
}

/** Everything the engine can name, published, with LIVE-prefixed titles. */
const FULL: LiveCatalogue = {
  communities: [
    community(
      "belajar-ai",
      Object.values(COURSE)
        .filter((c) => c.communitySlug === "belajar-ai")
        .map((c) => c.courseSlug),
      [
        "struktur-prompt-peran-konteks-tugas",
        "halusinasi-kenapa-terjadi-dan-cara-mengeceknya",
        "bagaimana-llm-berpikir",
        "yang-tidak-boleh-kamu-tempel-ke-chatbot",
        "contoh-yang-benar-few-shot-untuk-hasil-konsisten",
        "chain-of-thought-minta-ai-berpikir-bertahap",
        "membangun-prompt-andalanmu-sendiri",
        "batas-satu-sesi-context-window-fokus",
        "dari-chat-ke-agent-apa-itu-harness",
      ]
    ),
    community("kreator-konten", ["ide-konten", "skrip-caption"]),
    community("karier-digital", ["portofolio-dilirik", "freelance-nol"]),
  ],
};

const plan = (): PetaResult => assess(BUILDER);

describe("a fully published catalogue", () => {
  test("keeps every course, in teaching order, and adopts the LIVE title", () => {
    const raw = plan();
    const resolved = resolveAgainstCatalogue(raw, FULL);
    expect(resolved.paths).toHaveLength(raw.paths.length);
    for (const [i, path] of resolved.paths.entries()) {
      const original = raw.paths[i]!;
      expect(path.courses.map((c) => c.courseSlug)).toEqual(
        original.courses.map((c) => c.courseSlug)
      );
      // Renaming a course upstream must show through, not be shadowed by the
      // slug list the engine was compiled with.
      for (const course of path.courses) expect(course.title).toBe(`LIVE ${course.courseSlug}`);
    }
  });

  test("leaves the scoring completely alone — this step is about LINKS", () => {
    const raw = plan();
    const resolved = resolveAgainstCatalogue(raw, FULL);
    expect(resolved.level).toBe(raw.level);
    expect(resolved.headline).toBe(raw.headline);
    expect(resolved.budget).toEqual(raw.budget);
    expect(resolved.paths.map((p) => [p.id, p.score, p.reason, p.thisWeek])).toEqual(
      raw.paths.map((p) => [p.id, p.score, p.reason, p.thisWeek])
    );
  });
});

describe("an unpublished course", () => {
  test("is dropped from its path while the rest of the path survives", () => {
    const raw = plan();
    const victim = raw.paths[0]!.courses[0]!;
    const thinned: LiveCatalogue = {
      communities: FULL.communities.map((c) =>
        c.slug === victim.communitySlug
          ? { ...c, courses: c.courses.filter((x) => x.slug !== victim.courseSlug) }
          : c
      ),
    };
    const resolved = resolveAgainstCatalogue(raw, thinned);
    const slugs = resolved.paths.flatMap((p) => p.courses.map((c) => c.courseSlug));
    expect(slugs).not.toContain(victim.courseSlug);
    expect(resolved.paths[0]!.thisWeek).toEqual(raw.paths[0]!.thisWeek); // steps untouched
  });

  test("a path that loses ALL its courses is dropped when others remain", () => {
    const raw = plan();
    const doomed = raw.paths[0]!;
    const thinned: LiveCatalogue = {
      communities: FULL.communities.map((c) => ({
        ...c,
        courses: c.courses.filter(
          (x) => !doomed.courses.some((d) => d.courseSlug === x.slug && d.communitySlug === c.slug)
        ),
      })),
    };
    const resolved = resolveAgainstCatalogue(raw, thinned);
    expect(resolved.paths.map((p) => p.id)).not.toContain(doomed.id);
    expect(resolved.paths.length).toBeGreaterThan(0);
  });
});

describe("a catalogue that is empty (Convex down, or nothing published)", () => {
  test("still returns a plan — every path kept, every course link gone", () => {
    const raw = plan();
    const resolved = resolveAgainstCatalogue(raw, EMPTY_CATALOGUE);
    // `paths` is documented as never empty; dropping them all would break that
    // and hand the visitor a blank screen after ten questions.
    expect(resolved.paths.map((p) => p.id)).toEqual(raw.paths.map((p) => p.id));
    expect(resolved.paths.every((p) => p.courses.length === 0)).toBe(true);
    expect(resolved.gaps.every((g) => g.materi === null)).toBe(true);
    expect(resolved.budget).toEqual(raw.budget);
  });
});

describe("gaps", () => {
  test("a materi that is not published reads as 'belum ada' rather than mislinking", () => {
    const raw = plan();
    const withMateri = resolveAgainstCatalogue(raw, FULL);
    const backed = withMateri.gaps.filter((g) => g.materi !== null);
    expect(backed.length).toBeGreaterThan(0);

    const noMateri: LiveCatalogue = {
      communities: FULL.communities.map((c) => ({ ...c, materiSlugs: [] })),
    };
    const resolved = resolveAgainstCatalogue(raw, noMateri);
    expect(resolved.gaps.map((g) => g.concept)).toEqual(raw.gaps.map((g) => g.concept));
    expect(resolved.gaps.every((g) => g.materi === null)).toBe(true);
  });

  test("the four concepts the platform does not teach stay null in every catalogue", () => {
    const raw = plan();
    const untaught = raw.gaps.filter((g) => g.materi === null).map((g) => g.concept);
    const resolved = resolveAgainstCatalogue(raw, FULL);
    for (const concept of untaught) {
      expect(resolved.gaps.find((g) => g.concept === concept)?.materi).toBeNull();
    }
  });
});

describe("index helpers", () => {
  test("indexCatalogue keys on community AND slug, never on slug alone", () => {
    const index = indexCatalogue(FULL);
    expect(index.courseTitle.get("kreator-konten/ide-konten")).toBe("LIVE ide-konten");
    expect(index.courseTitle.get("belajar-ai/ide-konten")).toBeUndefined();
  });

  test("communityFor returns null for an unknown slug instead of throwing", () => {
    expect(communityFor(FULL, "belajar-ai")?.tenantId).toBe(tenantId("belajar-ai"));
    expect(communityFor(FULL, "tidak-ada")).toBeNull();
    expect(communityFor(EMPTY_CATALOGUE, "belajar-ai")).toBeNull();
  });
});
