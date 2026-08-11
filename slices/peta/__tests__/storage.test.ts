// The localStorage mirror and the sanitiser behind it.
//
// The mirror is the ONLY reason an interrupted run survives, and it reads back
// user-writable data, so both halves are tested: that a real run round-trips,
// and that nothing hostile in the key can reach `assess`.
//
// vitest runs under edge-runtime here (the repo needs it for Convex), so there
// is no window and no localStorage. A minimal in-memory Storage is installed
// per test — which doubles as the test for the "storage unavailable" branch.
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { conceptsFor, isComplete } from "@/lib/peta";
import { currentQuestion, EMPTY_RUN, setMulti, setSingle, setSwipe } from "../lib/run";
import { sanitizeDraft, sanitizeSwipe } from "../lib/sanitize";
import { clearRun, loadRun, PETA_STORAGE_KEY, saveRun } from "../lib/storage";

type FakeWindow = { localStorage: Storage };

function memoryStorage(overrides: Partial<Storage> = {}): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
    ...overrides,
  } as Storage;
}

function install(store: Storage): void {
  (globalThis as unknown as { window?: FakeWindow }).window = { localStorage: store };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: FakeWindow }).window;
});

function finishedRun() {
  let state = EMPTY_RUN;
  for (let guard = 0; guard < 60; guard++) {
    const q = currentQuestion(state);
    if (q === null) return state;
    if (q.kind === "geser") {
      const card = q.cards.find((c) => !(c.id in state.swipe))!;
      state = setSwipe(state, card.id, card.tier === "dasar");
    } else if (q.kind === "pilih-banyak") state = setMulti(state, ["chatgpt-plus"]);
    else state = setSingle(state, q, q.options[1 % q.options.length]!.value);
  }
  throw new Error("run did not terminate");
}

describe("with a working localStorage", () => {
  let store: Storage;
  beforeEach(() => {
    store = memoryStorage();
    install(store);
  });

  test("a finished run round-trips exactly", () => {
    const run = finishedRun();
    saveRun(run);
    const loaded = loadRun();
    expect(loaded.draft).toEqual(run.draft);
    expect(loaded.swipe).toEqual(run.swipe);
    expect(isComplete(loaded.draft)).toBe(true);
  });

  test("a run abandoned MID-DECK resumes on the card it stopped on", () => {
    let state = EMPTY_RUN;
    for (let guard = 0; guard < 60; guard++) {
      const q = currentQuestion(state);
      if (q === null || q.kind === "geser") break;
      state =
        q.kind === "pilih-banyak"
          ? setMulti(state, ["none"])
          : setSingle(state, q, q.options[0]!.value);
    }
    const deck = conceptsFor(state.draft);
    state = setSwipe(state, deck[0]!.id, true);
    state = setSwipe(state, deck[1]!.id, false);
    saveRun(state);

    const loaded = loadRun();
    expect(loaded.swipe).toEqual({ [deck[0]!.id]: true, [deck[1]!.id]: false });
    expect(loaded.draft.known).toBeUndefined(); // deck incomplete → no known
  });

  test("clearRun really forgets — retaking must not resurrect the old plan", () => {
    saveRun(finishedRun());
    clearRun();
    expect(loadRun()).toEqual({ draft: {}, swipe: {} });
    expect(store.getItem(PETA_STORAGE_KEY)).toBeNull();
  });

  test("corrupt JSON, a wrong shape and a hostile draft all load as empty-or-prefix", () => {
    for (const junk of ["{", "null", "[]", '"nope"', '{"draft":42}', "{}"]) {
      store.setItem(PETA_STORAGE_KEY, junk);
      const loaded = loadRun();
      expect(isComplete(loaded.draft)).toBe(false);
    }
    store.setItem(
      PETA_STORAGE_KEY,
      JSON.stringify({ draft: { tenure: "over1y", role: "__proto__" }, swipe: { evil: 1 } })
    );
    const loaded = loadRun();
    expect(loaded.draft).toEqual({ tenure: "over1y" }); // truncated at the bad token
    expect(loaded.swipe).toEqual({});
  });
});

describe("when storage is unavailable", () => {
  test("no window at all: load is empty, save and clear are silent no-ops", () => {
    expect(loadRun()).toEqual({ draft: {}, swipe: {} });
    expect(() => saveRun(finishedRun())).not.toThrow();
    expect(() => clearRun()).not.toThrow();
  });

  test("Safari private mode (setItem throws) does not break the run", () => {
    install(
      memoryStorage({
        setItem: () => {
          throw new DOMException("QuotaExceededError");
        },
      })
    );
    expect(() => saveRun(finishedRun())).not.toThrow();
    expect(loadRun()).toEqual({ draft: {}, swipe: {} });
  });
});

describe("sanitize", () => {
  test("keeps the longest valid prefix and stops at the first illegal value", () => {
    expect(
      sanitizeDraft({ tenure: "3to12m", role: "analyst", goal: "not-a-goal", budget: "zero" })
    ).toEqual({ tenure: "3to12m", role: "analyst" });
  });

  test("an empty subscriptions array is not a legal answer", () => {
    const draft = sanitizeDraft({
      tenure: "never",
      role: "office",
      goal: "save-time",
      budget: "zero",
      subscriptions: [],
    });
    expect(draft.subscriptions).toBeUndefined();
  });

  test("swipe verdicts accept real concept ids with boolean values, nothing else", () => {
    expect(sanitizeSwipe({ prompt: true, rag: false, nope: true, agent: "yes" })).toEqual({
      prompt: true,
      rag: false,
    });
    expect(sanitizeSwipe(null)).toEqual({});
    expect(sanitizeSwipe(["prompt"])).toEqual({});
  });
});
