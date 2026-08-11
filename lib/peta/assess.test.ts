// The scorer's judgement calls, pinned one by one. Where reachability.test.ts
// proves the engine never breaks, this file proves it is not stupid.
import { describe, expect, it } from "vitest";
import { CONCEPT_MATERI, PATHS, assess, conceptsFor } from "./index";
import type { PathId, PetaAnswers } from "./index";

const BASE: PetaAnswers = {
  tenure: "never",
  role: "other",
  goal: "curious",
  budget: "zero",
  subscriptions: [],
  weeklyTime: "1to3h",
  known: [],
  situation: {},
};

const a = (patch: Partial<PetaAnswers>): PetaAnswers => ({ ...BASE, ...patch });
const allKnown = (patch: Partial<PetaAnswers>): PetaAnswers => {
  const base = a(patch);
  return { ...base, known: conceptsFor(base).map((c) => c.id) };
};

describe("level reads tenure AND the cards together", () => {
  it("does NOT call a year-long daily user Lanjut when they know nothing past 'prompt'", () => {
    const veteranInNameOnly = a({ tenure: "over1y", role: "office", known: ["prompt"] });
    const r = assess(veteranInNameOnly);
    expect(r.level).toBe("terbiasa");
    expect(r.levelReason).toContain("lebih dari setahun");
    expect(r.levelReason).toContain("1 dari 13");
  });

  it("calls someone Lanjut only when the advanced cards back the tenure up", () => {
    expect(assess(allKnown({ tenure: "over1y", role: "developer" })).level).toBe("lanjut");
  });

  it("caps a brand-new developer at Menengah even if they tick every advanced card", () => {
    // They may well know the words. Nobody with zero months of use is Lanjut.
    expect(assess(allKnown({ tenure: "never", role: "developer" })).level).toBe("menengah");
  });

  it("calls a true beginner Pemula, and says so without insulting them", () => {
    const r = assess(a({ tenure: "never", role: "student" }));
    expect(r.level).toBe("pemula");
    expect(r.levelLabel).toBe("Pemula");
    expect(r.levelReason).toContain("mulai dari nol");
  });

  it("ignores knowledge answers for cards this run never asked", () => {
    // A stale `known` array from before they changed tenure must not promote.
    const stale = a({ tenure: "never", role: "office", known: ["rag", "mcp", "agent", "api", "fine-tuning"] });
    expect(assess(stale).level).toBe("pemula");
  });
});

describe("paths", () => {
  it("always ranks two or three, best first", () => {
    const r = assess(a({ tenure: "3to12m", role: "office", goal: "save-time" }));
    expect(r.paths.length).toBeGreaterThanOrEqual(2);
    expect(r.paths.length).toBeLessThanOrEqual(3);
    expect(r.paths[0]!.score).toBeGreaterThanOrEqual(r.paths[1]!.score);
  });

  it("drops a third path that is not genuinely competitive", () => {
    // A laser-focused persona: one path dominates, the rest are noise.
    const r = assess(allKnown({ tenure: "over1y", role: "developer", goal: "build-app", weeklyTime: "over7h" }));
    expect(r.paths).toHaveLength(2);
  });

  it("offers three when three genuinely fit", () => {
    const r = assess(a({ tenure: "never", role: "student", goal: "save-time", weeklyTime: "1to3h" }));
    expect(r.paths).toHaveLength(3);
    expect(r.paths.map((p) => p.id)).toEqual(["fondasi", "produktivitas-kerja", "karier-digital"]);
  });

  it("quotes the answers that actually EARNED the path, not whatever answer exists", () => {
    const r = assess(a({ tenure: "under3m", role: "marketing", goal: "make-content", weeklyTime: "1to3h" }));
    const kreator = r.paths.find((p) => p.id === "kreator-konten");
    // Their job and their goal are what scored this path. Hours-per-week is a
    // true fact about them and did NOT, so it must not be offered as the reason
    // — that was the old behaviour, and it is how a result screen ends up
    // arguing against its own recommendation.
    expect(kreator?.reason).toBe("Cocok karena kamu kerja di marketing/konten dan mau bikin konten.");
  });

  it("refuses to invent a fit for a path their answers do not support", () => {
    // A curious visitor with no time is still offered a second and third card —
    // the catalogue guarantees two — but the copy must not pretend those facts
    // recommend it. Anything that opens "Cocok karena" has to be earned.
    const r = assess(a({ tenure: "never", role: "other", goal: "curious", weeklyTime: "under1h" }));
    expect(r.paths[0]!.reason.startsWith("Cocok karena kamu ")).toBe(true);
    for (const path of r.paths) {
      const earned = path.reason.startsWith("Cocok karena kamu ");
      const honest = path.reason.startsWith("Bukan yang paling pas");
      expect(earned || honest).toBe(true);
    }
  });

  it("names the tool they already pay for inside the weekly steps", () => {
    const r = assess(a({ tenure: "3to12m", role: "office", goal: "save-time", subscriptions: ["claude-pro"] }));
    expect(r.paths[0]!.thisWeek.join(" ")).toContain("Claude Pro yang sudah kamu bayar");
  });

  it("never names a paid tool in the steps of an Rp0 run", () => {
    const r = assess(a({ tenure: "never", role: "office", goal: "save-time", budget: "zero" }));
    const steps = r.paths.flatMap((p) => p.thisWeek).join(" ");
    expect(steps).toContain("Claude atau Gemini versi gratis");
    expect(steps).not.toContain("Pro");
    expect(steps).not.toContain("Plus");
  });

  it("gives every path exactly three steps and a real course to open", () => {
    for (const path of assess(a({ tenure: "3to12m", role: "analyst", goal: "work-with-data" })).paths) {
      expect(path.thisWeek).toHaveLength(3);
      expect(path.courses.length).toBeGreaterThan(0);
      expect(path.courses[0]!.courseSlug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("path reachability — a named witness per catalogue entry", () => {
  // Every one of these personas puts its path at RANK 0, not merely in the top
  // three. reachability.test.ts proves the general claim by enumeration; this
  // table is the human-readable version of the same fact.
  const WITNESSES: Record<PathId, PetaAnswers> = {
    fondasi: a({ tenure: "never", role: "student", goal: "curious" }),
    "produktivitas-kerja": a({ tenure: "under3m", role: "office", goal: "save-time", known: ["prompt", "hallucination", "context-window", "data-privacy"] }),
    "prompt-andalan": a({ tenure: "3to12m", role: "student", goal: "curious" }),
    "olah-data": allKnown({ tenure: "3to12m", role: "analyst", goal: "work-with-data" }),
    "bikin-aplikasi": allKnown({ tenure: "never", role: "developer", goal: "build-app", weeklyTime: "3to7h" }),
    "multi-agent": allKnown({ tenure: "3to12m", role: "developer", goal: "build-app", weeklyTime: "3to7h" }),
    "kreator-konten": a({ tenure: "never", role: "marketing", goal: "make-content", known: ["prompt", "hallucination", "context-window", "data-privacy"] }),
    "karier-digital": a({ tenure: "never", role: "unemployed", goal: "career", weeklyTime: "3to7h" }),
  };

  it("covers the whole catalogue", () => {
    expect(Object.keys(WITNESSES).sort()).toEqual(PATHS.map((p) => p.id).sort());
  });

  for (const [id, answers] of Object.entries(WITNESSES)) {
    it(`ranks "${id}" first for its witness`, () => {
      expect(assess(answers).paths[0]!.id).toBe(id);
    });
  }
});

describe("budget advice", () => {
  it("gives an Rp0 answer a plan with nothing to buy", () => {
    const r = assess(a({ tenure: "never", role: "office", goal: "save-time", budget: "zero" }));
    expect(r.budget.paid).toEqual([]);
    expect(r.budget.headline).toContain("100% gratis");
    expect(r.budget.free.join(" ")).toContain("Claude gratis");
    expect(r.budget.free.join(" ")).toContain("Gemini gratis");
    // Limits are described by mechanism, so they cannot go stale into a lie.
    expect(r.budget.free.join(" ")).toContain("di-reset tiap beberapa jam");
  });

  it("changes the advice for someone who already pays, instead of collecting it and moving on", () => {
    const r = assess(a({ tenure: "3to12m", role: "office", goal: "save-time", budget: "100to300k", subscriptions: ["claude-pro"] }));
    expect(r.budget.useWhatYouPayFor).toHaveLength(1);
    expect(r.budget.useWhatYouPayFor[0]).toContain("Project");
    expect(r.budget.headline).toContain("sudah kamu bayar");
  });

  it("tells someone paying twice to cancel one", () => {
    const r = assess(a({ subscriptions: ["chatgpt-plus", "claude-pro"], budget: "over300k" }));
    expect(r.budget.savings.join(" ")).toContain("2 langganan sekaligus");
    expect(r.budget.savings.join(" ")).toContain("hentikan yang paling jarang");
  });

  it("tells someone they budgeted more than they need", () => {
    const r = assess(a({ tenure: "never", role: "student", goal: "curious", budget: "over300k" }));
    expect(r.budget.headline).toContain("lebih besar dari kebutuhanmu");
    expect(r.budget.savings.join(" ")).toContain("Tahan dulu anggarannya");
  });

  it("warns that a subscription cannot pay off on under an hour a week", () => {
    const r = assess(a({ budget: "100to300k", weeklyTime: "under1h" }));
    expect(r.budget.savings.join(" ")).toContain("tidak balik modal");
  });

  it("mentions the free API tier only when the answers make it relevant", () => {
    const dev = assess(a({ role: "developer", goal: "build-app" }));
    const office = assess(a({ role: "office", goal: "save-time" }));
    expect(dev.budget.free.join(" ")).toContain("Google AI Studio");
    expect(office.budget.free.join(" ")).not.toContain("Google AI Studio");
  });
});

describe("knowledge gaps", () => {
  it("lists the basics first and points each at a real materi", () => {
    const r = assess(a({ tenure: "over1y", role: "office", known: [] }));
    expect(r.gaps).toHaveLength(4);
    expect(r.gaps.map((g) => g.concept)).toEqual(["prompt", "hallucination", "context-window", "data-privacy"]);
    for (const gap of r.gaps) {
      expect(gap.materi).not.toBeNull();
      expect(gap.materi!.communitySlug).toBe("belajar-ai");
      expect(gap.materi!.materiSlug).toMatch(/^[a-z0-9-]+$/);
    }
    expect(r.gaps[1]!.materi!.materiSlug).toBe("halusinasi-kenapa-terjadi-dan-cara-mengeceknya");
  });

  it("prefers a gap we can actually teach over one we cannot", () => {
    // Knows every dasar + menengah card; only the advanced tier is open, and
    // that tier mixes taught concepts with four we have no materi for yet.
    const known = conceptsFor(a({ tenure: "over1y", role: "developer" }))
      .filter((c) => c.tier !== "lanjut")
      .map((c) => c.id);
    const r = assess(a({ tenure: "over1y", role: "developer", known }));
    expect(r.gaps.slice(0, 2).map((g) => g.concept)).toEqual(["token-cost", "agent"]);
    expect(r.gaps[0]!.materi).not.toBeNull();
    expect(r.gaps[2]!.materi).toBeNull();
  });

  it("returns no gaps when they knew every card they were shown", () => {
    expect(assess(allKnown({ tenure: "over1y", role: "developer" })).gaps).toEqual([]);
  });

  it("keeps the untaught-concept list honest rather than mislinking it", () => {
    expect(CONCEPT_MATERI.rag).toBeNull();
    expect(CONCEPT_MATERI.mcp).toBeNull();
    expect(CONCEPT_MATERI["fine-tuning"]).toBeNull();
    expect(CONCEPT_MATERI.api).toBeNull();
  });
});

describe("purity", () => {
  it("returns a deeply equal result for the same answers, every time", () => {
    const answers = a({ tenure: "3to12m", role: "marketing", goal: "make-content", budget: "under100k", known: ["prompt", "few-shot"] });
    expect(assess(answers)).toEqual(assess(answers));
    expect(assess(answers)).toEqual(assess({ ...answers }));
  });

  it("does not mutate the answers handed to it", () => {
    const answers = a({ known: ["prompt"], subscriptions: ["claude-pro"] });
    const snapshot = JSON.stringify(answers);
    assess(answers);
    expect(JSON.stringify(answers)).toBe(snapshot);
  });

  it("tolerates a missing situation object", () => {
    const withoutSituation: PetaAnswers = { ...BASE };
    delete withoutSituation.situation;
    expect(() => assess(withoutSituation)).not.toThrow();
    expect(assess(withoutSituation).paths.length).toBeGreaterThanOrEqual(2);
  });
});
