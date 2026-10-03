// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { useAddComment, useDeleteComment } from "../hooks/use-comment-mutations";

const raw = vi.hoisted(() => vi.fn());
vi.mock("convex/react", () => ({ useMutation: () => raw }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

test.each(["add", "delete"])("%s runs once per pending request and releases its lock after failure", async (operation) => {
  raw.mockReset();
  let invoke!: () => Promise<boolean>;
  function Probe() {
    const { add } = useAddComment();
    const { softDelete } = useDeleteComment();
    invoke = operation === "add" ? () => add({ lessonId: "lesson" as Id<"lessons">, bodyMd: "Pertanyaan" })
      : () => softDelete("comment" as Id<"comments">);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  let reject!: (error: Error) => void;
  raw.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const first = invoke();
  expect(await invoke()).toBe(false);
  expect(raw).toHaveBeenCalledTimes(1);
  reject(new Error("Connection unavailable"));
  expect(await first).toBe(false);
  raw.mockResolvedValueOnce(undefined);
  expect(await invoke()).toBe(true);
  expect(raw).toHaveBeenCalledTimes(2);
});
