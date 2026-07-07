// os-shell — public barrel (integration slice). Wires the vendored appshell to
// this app's brand + surfaces. The app layer mounts OsRoot; everything else is
// internal.
export { OsRoot } from "./os-root";
export { shellManifest, APPS, BRAND } from "./manifest";
