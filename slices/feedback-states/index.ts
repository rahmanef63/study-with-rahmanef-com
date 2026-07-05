// feedback-states — the "no real content yet" placeholder family.
// Two co-located variants (they export different components, so this root is a
// barrel, not a variant= switcher): `loading` (skeletons + spinners) and
// `empty` (404/500/403 + zero-data). Install one with
// `npx rr add feedback-states loading|empty`, or all with
// `npx rr add feedback-states` and import the component you need.
export { feedbackStatesFeature } from "./config";
export * from "./variants/loading";
export * from "./variants/empty";
