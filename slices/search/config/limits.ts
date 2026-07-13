// search slice — UI mirrors of the server bounds
// (SSOT: convex/features/search/validate.ts; equality asserted in the barrel test).

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 60;

/** Debounce before the reactive query re-fires while typing. */
export const SEARCH_DEBOUNCE_MS = 300;
