// resources slice — status → label + tone, driven by a lookup map (rr P2:
// dynamic over hardcoded). Tones resolve through theme tokens only (no hex);
// the shared tones SSOT isn't vendored in this app, so we use semantic token
// classes directly. // TODO(rr): route through _shared ui/tones.ts once present.
import type { ResourcesCopy } from "../config/copy";
import type { ResourceStatus, SuggestionStatus } from "../types";

type Tone = { badge: string };

const NEUTRAL: Tone = { badge: "bg-muted text-muted-foreground" };
const POSITIVE: Tone = { badge: "bg-primary/10 text-primary" };
const NEGATIVE: Tone = { badge: "bg-destructive/10 text-destructive" };
const INFO: Tone = { badge: "bg-secondary text-secondary-foreground" };

const RESOURCE_TONE: Record<ResourceStatus, Tone> = {
  pending: NEUTRAL,
  approved: POSITIVE,
  rejected: NEGATIVE,
};

const SUGGESTION_TONE: Record<SuggestionStatus, Tone> = {
  open: NEUTRAL,
  planned: INFO,
  done: POSITIVE,
  rejected: NEGATIVE,
};

export function resourceStatusLabel(status: ResourceStatus, copy: ResourcesCopy): string {
  const map: Record<ResourceStatus, string> = {
    pending: copy.statusPending,
    approved: copy.statusApproved,
    rejected: copy.statusRejected,
  };
  return map[status];
}

export function suggestionStatusLabel(status: SuggestionStatus, copy: ResourcesCopy): string {
  const map: Record<SuggestionStatus, string> = {
    open: copy.statusOpen,
    planned: copy.statusPlanned,
    done: copy.statusDone,
    rejected: copy.statusRejected,
  };
  return map[status];
}

export function resourceStatusTone(status: ResourceStatus): string {
  return RESOURCE_TONE[status].badge;
}

export function suggestionStatusTone(status: SuggestionStatus): string {
  return SUGGESTION_TONE[status].badge;
}
