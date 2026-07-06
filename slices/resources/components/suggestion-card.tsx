// resources slice — one suggestion card (title, detail, status chip). Instructor
// triage controls are injected via the optional `actions` slot so the card stays
// presentational and role-agnostic.
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourcesCopy } from "../config/copy";
import { suggestionStatusLabel, suggestionStatusTone } from "../lib/status";
import type { SuggestionCard as SuggestionCardData } from "../types";
import { StatusBadge } from "./status-badge";

export type SuggestionCardProps = {
  suggestion: SuggestionCardData;
  copy: ResourcesCopy;
  /** Instructor triage actions (omitted for plain members). */
  actions?: ReactNode;
};

export function SuggestionCard({ suggestion, copy, actions }: SuggestionCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{suggestion.title}</CardTitle>
          <StatusBadge
            label={suggestionStatusLabel(suggestion.status, copy)}
            tone={suggestionStatusTone(suggestion.status)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestion.detail && (
          <p className="line-clamp-4 text-sm text-muted-foreground">{suggestion.detail}</p>
        )}
        {actions}
      </CardContent>
    </Card>
  );
}
