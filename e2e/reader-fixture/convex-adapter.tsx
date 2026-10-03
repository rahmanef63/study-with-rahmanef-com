// Fake local transport; actual slice read/write hooks remain under test.
import { createContext, useContext, useCallback, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { ConvexError } from "convex/values";
import { getFunctionName, type FunctionReference, type FunctionArgs, type FunctionReturnType } from "convex/server";
import type { Id } from "../../convex/_generated/dataModel";
import type { CommentItem } from "../../slices/comments/types";
import type { AttemptResult } from "../../slices/quiz/types";
import { commentsFor, overview, quiz } from "./data";
import { useFixtureParams } from "./next-adapter";

export const metrics = { calls: {} as Record<string, number> };
Object.assign(window, { __readerFixture: metrics });
type FixtureState = { params: URLSearchParams; items: Record<string, CommentItem[]>; setItems: Dispatch<SetStateAction<Record<string, CommentItem[]>>> };
const Context = createContext<FixtureState | null>(null);
function useFixture() {
  const value = useContext(Context);
  if (!value) throw new Error("Fixture transport requires FixtureProvider");
  return value;
}
export function FixtureProvider({ children }: { children: ReactNode }) {
  const params = useFixtureParams();
  const [items, setItems] = useState<Record<string, CommentItem[]>>({});
  return <Context.Provider value={{ params, items, setItems }}>{children}</Context.Provider>;
}

export function useQuery<Query extends FunctionReference<"query">>(reference: Query, args: FunctionArgs<Query> | "skip"): FunctionReturnType<Query> | undefined {
  const { params, items } = useFixture();
  if (args === "skip") return undefined;
  const name = getFunctionName(reference);
  const input = args as Record<string, string>;
  let value: unknown;
  if (name.endsWith(":getOverview")) value = overview;
  else if (name.endsWith(":getCourseProgress")) {
    if (params.get("progress") === "loading") return undefined;
    value = { totalCount: 40, completedCount: 3, completedLessonIds: overview.lessons.slice(0, 3).map(l => l._id), isComplete: false, ...(params.get("progress") === "truncated" ? { truncated: true } : {}) };
  } else if (name.endsWith(":listByLesson") || name.endsWith(":listByPost")) {
    if (params.get("comments") === "loading") return undefined;
    const target = input.lessonId || input.postId;
    value = { canModerate: true, items: params.get("comments") === "empty" ? [] : items[target] ?? commentsFor(target) };
  } else if (name.endsWith(":getQuizForTaking")) {
    if (params.get("quiz") === "loading") return undefined;
    value = quiz;
  } else if (name.endsWith(":listMyAttempts")) value = [];
  else throw new Error(`Fixture does not implement query ${name}`);
  return value as FunctionReturnType<Query>;
}

export function useMutation<Mutation extends FunctionReference<"mutation">>(reference: Mutation) {
  const { params, setItems } = useFixture();
  const name = getFunctionName(reference);
  return useCallback(async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
    metrics.calls[name] = (metrics.calls[name] ?? 0) + 1;
    await new Promise(resolve => setTimeout(resolve, Number(params.get("delay") ?? 120)));
    const input = args as Record<string, unknown>;
    let value: unknown;
    if (name.endsWith(":addComment")) {
      if (params.get("failAdd") === "1") throw new ConvexError({ code: "RATE_LIMITED", message: "Kegagalan kirim lokal untuk uji pemulihan" });
      const target = String(input.lessonId || input.postId);
      const id = `${target}-added-${metrics.calls[name]}` as Id<"comments">;
      setItems(previous => ({ ...previous, [target]: [...(previous[target] ?? commentsFor(target)), { _id: id, parentId: input.parentId as Id<"comments"> ?? null, deleted: false, bodyMd: String(input.bodyMd), author: { displayName: "Peserta uji lokal", username: "fixture-member" }, createdAt: Date.now(), mine: true }] }));
      value = id;
    } else if (name.endsWith(":softDelete")) {
      if (params.get("failDelete") === "1") throw new ConvexError({ code: "RATE_LIMITED", message: "Kegagalan hapus lokal untuk uji pemulihan" });
      const target = params.get("lesson") ?? "lesson-1";
      setItems(previous => ({ ...previous, [target]: (previous[target] ?? commentsFor(target)).map(item => item._id === input.commentId ? { ...item, deleted: true, bodyMd: null, author: null, mine: false } : item) }));
      value = true;
    } else if (name.endsWith(":submitAttempt")) {
      const answers = input.answers as number[];
      const correctCount = answers.filter(answer => answer === 0).length;
      value = { attemptId: "fixture-attempt", scorePct: Math.round(correctCount / quiz.questionCount * 100), passed: correctCount / quiz.questionCount >= .7, correctCount, totalQuestions: quiz.questionCount, passingScorePct: 70, attemptsUsed: 1, attemptsAllowed: 3, keyRevealed: false, results: answers.map((answer, i) => ({ questionIndex: i, yourAnswer: answer, isCorrect: answer === 0 })) } satisfies Omit<AttemptResult, "attemptId"> & { attemptId: string };
    } else throw new Error(`Fixture does not implement mutation ${name}`);
    return value as FunctionReturnType<Mutation>;
  }, [name, params, setItems]);
}
