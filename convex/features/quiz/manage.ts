// quiz feature — instructor+ read surface for the builder (QuizBuilderView).
// Returns the FULL quiz INCLUDING correctIndex/explanation — this is the ONLY
// read that carries answers, and it is gated to instructor+ (P0). Members use
// features/quiz/taking:getQuizForTaking, which strips the answers.
//
// MIGRATION (DECISIONS #37): keyed by quizId. To find a course's quizzes the
// builder lists taking:listQuizzesForCourse first (instructor+ passes its
// member check and sees drafts), then opens one by id.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireInstructorForQuiz } from "./access";

/**
 * One quiz for editing. Auth (instructor+ on the quiz's own tenant) runs before
 * anything is returned, via requireInstructorForQuiz.
 */
export const getForManage = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const { quiz } = await requireInstructorForQuiz(ctx, args.quizId);
    return {
      _id: quiz._id,
      tenantId: quiz.tenantId,
      courseId: quiz.courseId,
      title: quiz.title,
      passingScorePct: quiz.passingScorePct,
      questions: quiz.questions, // full — correctIndex/explanation included
    };
  },
});
