// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { useSubmitAttempt } from "../hooks/use-quiz-mutations";

const submitRaw = vi.hoisted(() => vi.fn());
vi.mock("convex/react", () => ({ useMutation: () => submitRaw }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

test("rapid submission only spends one attempt and releases its lock after failure", async () => {
  let submit!: ReturnType<typeof useSubmitAttempt>["submitAttempt"];
  function Probe() { submit = useSubmitAttempt().submitAttempt; return null; }
  renderToStaticMarkup(<Probe />);
  let reject!: (error: Error) => void;
  submitRaw.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const id = "quiz" as Id<"quizzes">;
  const first = submit(id, [0]);
  expect(await submit(id, [0])).toBeNull();
  expect(submitRaw).toHaveBeenCalledTimes(1);
  reject(new Error("Network unavailable"));
  expect(await first).toBeNull();
  submitRaw.mockResolvedValueOnce({ attemptsUsed: 1 });
  expect(await submit(id, [0])).toEqual({ attemptsUsed: 1 });
  expect(submitRaw).toHaveBeenCalledTimes(2);
});
