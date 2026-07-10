// resources feature — explicit safe projections for every read (P0: queries
// return an explicit shape, never raw docs). `submittedBy` is included ONLY on
// the instructor-facing review item and on the caller's own items — never on
// the member-facing approved/open cards.
import type { Doc } from "../../_generated/dataModel";

/** Member-facing resource card (approved board + the caller's own items). */
export function toResourceCard(r: Doc<"resources">) {
  return {
    _id: r._id,
    title: r.title,
    url: r.url,
    note: r.note,
    courseId: r.courseId,
    status: r.status,
    createdAt: r._creationTime,
  };
}

/** Instructor-facing pending item — adds the submitter id for the review queue. */
export function toResourceReviewItem(r: Doc<"resources">) {
  return { ...toResourceCard(r), submittedBy: r.submittedBy };
}

/** Member-facing suggestion card (open board + the caller's own items). */
export function toSuggestionCard(s: Doc<"suggestions">) {
  return {
    _id: s._id,
    title: s.title,
    detail: s.detail,
    status: s.status,
    createdAt: s._creationTime,
  };
}

export type ResourceCard = ReturnType<typeof toResourceCard>;
export type ResourceReviewItem = ReturnType<typeof toResourceReviewItem>;
export type SuggestionCard = ReturnType<typeof toSuggestionCard>;

/**
 * Suggestion card enriched with derived vote data (#18): voteCount is computed
 * from `suggestionVotes` at read time (never stored); myVote is the caller's.
 */
export type SuggestionCardWithVotes = SuggestionCard & {
  voteCount: number;
  myVote: boolean;
};
