// quiz feature — instructor+ read surface for the builder (QuizBuilderView).
// Returns the FULL quiz INCLUDING correctIndex/explanation — this is the ONLY
// read that carries answers, and it is gated to instructor+ (P0). Members use
// features/quiz/taking:getQuizForTaking, which strips the answers.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getQuizByModule, requireInstructorForModule } from "./access";

/**
 * The module's quiz for editing, or null if none yet. Auth (instructor+) runs
 * before the quiz read via requireInstructorForModule.
 */
export const getForManage = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    await requireInstructorForModule(ctx, args.moduleId);
    const quiz = await getQuizByModule(ctx, args.moduleId);
    if (quiz === null) return null;
    return {
      _id: quiz._id,
      tenantId: quiz.tenantId,
      courseId: quiz.courseId,
      moduleId: quiz.moduleId,
      title: quiz.title,
      passingScorePct: quiz.passingScorePct,
      questions: quiz.questions, // full — correctIndex/explanation included
    };
  },
});
