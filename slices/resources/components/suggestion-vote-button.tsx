"use client";
// resources slice — upvote toggle for a suggestion (#18): count + button.
// Purely presentational: optimistic state lives in the query data (patched by
// useToggleSuggestionVote), so this just renders { voteCount, myVote } and
// fires onToggle. shadcn Button only; theme tokens only (no hex).
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResourcesCopy } from "../config/copy";

export type SuggestionVoteButtonProps = {
  voteCount: number;
  myVote: boolean;
  onToggle: () => void;
  /** Optional in-flight lock; usually unnecessary with the optimistic patch. */
  pending?: boolean;
  copy: ResourcesCopy;
};

export function SuggestionVoteButton({
  voteCount,
  myVote,
  onToggle,
  pending = false,
  copy,
}: SuggestionVoteButtonProps) {
  const label = myVote ? copy.unvoteAction : copy.voteAction;
  return (
    <Button
      size="sm"
      variant={myVote ? "secondary" : "outline"}
      aria-pressed={myVote}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={onToggle}
      className="min-h-11 gap-1.5"
    >
      <ThumbsUp className={myVote ? "size-4 fill-current" : "size-4"} aria-hidden />
      <span className="tabular-nums">{voteCount}</span>
    </Button>
  );
}
