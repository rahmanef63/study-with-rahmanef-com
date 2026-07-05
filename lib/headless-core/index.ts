// headless-core — the engine every scaffold inherits: version/update plumbing +
// the site-settings contract. Kept inside the app (not a separate npm package)
// so a clone stays a single self-contained unit.
export * from "./version";
export * from "./settings";
