"use client";
// resources slice — instructor triage buttons for a suggestion. Registry-driven
// (rr P2: dynamic over hardcoded) — the current status is hidden so only real
// transitions render.
import { Button } from "@/components/ui/button";
import type { ResourcesCopy } from "../config/copy";
import type { SuggestionStatus } from "../types";

export type SuggestionStatusActionsProps = {
  current: SuggestionStatus;
  // Return value is ignored (fire-and-forget); a void return type still accepts
  // a Promise-returning handler via TS's return-value-ignoring rule.
  onSet: (status: SuggestionStatus) => void;
  pending: boolean;
  copy: ResourcesCopy;
};

type Action = { status: SuggestionStatus; labelKey: keyof ResourcesCopy };

const ACTIONS: Action[] = [
  { status: "planned", labelKey: "markPlanned" },
  { status: "done", labelKey: "markDone" },
  { status: "rejected", labelKey: "markRejectedSuggestion" },
  { status: "open", labelKey: "reopen" },
];

export function SuggestionStatusActions({
  current,
  onSet,
  pending,
  copy,
}: SuggestionStatusActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.filter((a) => a.status !== current).map((a) => (
        <Button
          key={a.status}
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => void onSet(a.status)}
          className="min-h-11"
        >
          {copy[a.labelKey]}
        </Button>
      ))}
    </div>
  );
}
