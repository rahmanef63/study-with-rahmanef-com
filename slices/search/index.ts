// search slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Integration point for alpha (#23): mount
//   <SearchView tenantId={tenant._id} tenantSlug={tenant.slug}
//               onNavigate={(href) => openApp(href)} />
// as a window-app in the OS shell. onNavigate is the openApp seam — without
// it, result clicks fall back to plain next/link navigation (deep-link URLs
// still open the right window via URL-sync).
//
// Convex surface (not re-exported; call via api.features.search.*):
//   queries:searchInTenant — MEMBER-ONLY, drafts never returned; since 0.2.0
//   (#29) hits also include kind "resource" {kind, title, url} (approved-only)
//   rendered as an external-link group "Sumber" (new tab, not onNavigate).

// feature descriptor
export { searchFeature } from "./config";

// connected view (integrator mounts this)
export { SearchView, type SearchViewProps } from "./views/search-view";

// presentational components (props-driven, portable)
export { SearchInput, type SearchInputProps } from "./components/search-input";
export { SearchResults, type SearchResultsProps } from "./components/search-results";
export { SearchResultItem, type SearchResultItemProps } from "./components/search-result-item";
export { SearchEmptyState, type SearchEmptyStateProps } from "./components/search-empty-state";

// hooks (reads)
export { useTenantSearch, type TenantSearchState } from "./hooks/use-tenant-search";
export { useDebouncedValue } from "./hooks/use-debounced-value";

// lib (pure — safe for server or client)
export { buildCourseHref, buildLessonHref, hitHref } from "./lib/hrefs";

// copy (props-driven defaults)
export {
  SEARCH_COPY,
  mergeSearchCopy,
  type SearchCopy,
  type SearchCopyOverride,
} from "./config/copy";

// limits (UI mirrors of the server bounds)
export { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, SEARCH_DEBOUNCE_MS } from "./config/limits";

// types
export type {
  CourseHit,
  LessonHit,
  ResourceHit,
  SearchErrorCode,
  SearchHit,
  SearchInTenantResult,
} from "./types";
