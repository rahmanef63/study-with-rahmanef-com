// resources slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). The integrator mounts the two views on the
// /t/[slug] shell:
//   /t/[slug]/resources ← <ResourceBoardView tenantId canModerate />
//   /t/[slug]/usulan    ← <SuggestionBoxView  tenantId canModerate />
// `canModerate` = viewer is instructor+ (UX gate only; every Convex function
// re-checks the role server-side).
//
// Convex surface (not re-exported; call via api.features.resources.*):
//   resources:submit · resources:curate · suggestions:submit ·
//   suggestions:setStatus · votes:toggleVote · queries:listApprovedResources ·
//   queries:listPendingResources · queries:listMineResources ·
//   queries:listOpenSuggestions · queries:listMineSuggestions
//   (both suggestion lists return { voteCount, myVote } per card since #18)

// feature descriptor
export { resourcesFeature } from "./config";

// connected views (integrator mounts these)
export { ResourceBoardView, type ResourceBoardViewProps } from "./views/resource-board-view";
export { SuggestionBoxView, type SuggestionBoxViewProps } from "./views/suggestion-box-view";

// presentational components (props-driven, portable)
export { ResourceCard, type ResourceCardProps } from "./components/resource-card";
export { ResourceGrid, type ResourceGridProps } from "./components/resource-grid";
export { ResourceReviewRow, type ResourceReviewRowProps } from "./components/resource-review-row";
export { ResourceReviewList, type ResourceReviewListProps } from "./components/resource-review-list";
export { ResourceSubmitForm, type ResourceSubmitFormProps, type ResourceSubmitValues } from "./components/resource-submit-form";
export { SuggestionCard, type SuggestionCardProps } from "./components/suggestion-card";
export { SuggestionList, type SuggestionListProps } from "./components/suggestion-list";
export { SuggestionStatusActions, type SuggestionStatusActionsProps } from "./components/suggestion-status-actions";
export { SuggestionSubmitForm, type SuggestionSubmitFormProps, type SuggestionSubmitValues } from "./components/suggestion-submit-form";
export { SuggestionVoteButton, type SuggestionVoteButtonProps } from "./components/suggestion-vote-button";
export { StatusBadge, type StatusBadgeProps } from "./components/status-badge";

// hooks (reads + writes)
export { useApprovedResources, usePendingResources, useMyResources } from "./hooks/use-resources";
export { useSubmitResource, useCurateResource, type SubmitResourceInput } from "./hooks/use-resource-mutations";
export { useOpenSuggestions, useMySuggestions } from "./hooks/use-suggestions";
export {
  useSubmitSuggestion,
  useSetSuggestionStatus,
  type SubmitSuggestionInput,
} from "./hooks/use-suggestion-mutations";
export { useToggleSuggestionVote } from "./hooks/use-suggestion-votes";

// lib (pure — safe for server or client)
export { resourcesErrorMessage, extractResourcesError } from "./lib/errors";
export { isHttpUrl, displayHost } from "./lib/url";
export {
  resourceStatusLabel,
  suggestionStatusLabel,
  resourceStatusTone,
  suggestionStatusTone,
} from "./lib/status";

// copy (props-driven defaults)
export {
  RESOURCES_COPY,
  mergeResourcesCopy,
  type ResourcesCopy,
  type ResourcesCopyOverride,
} from "./config/copy";

// types
export type {
  ResourceCard as ResourceCardData,
  ResourceReviewItem,
  SuggestionCard as SuggestionCardData,
  SuggestionCardWithVotes,
  ResourcesErrorCode,
  ResourceStatus,
  SuggestionStatus,
} from "./types";
