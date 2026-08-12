import { AccountShell } from "../_components/account-shell";

// (shell) — EVERY ROUTE THAT IS NOT A COMMUNITY LIVES HERE, AND GETS THE RAIL.
//
// It was (akun) and held four account pages, on the theory that a public page
// should stay bare. A route-by-route probe of production found six endpoints
// with no navigation at all — /mulai, /roadmap, /masuk, /sertifikat and both
// /admin pages — which is what the owner reported. The theory kept producing
// dead ends because it was opt-IN: a new route was bare unless someone
// remembered to move it. This group is now the DEFAULT, and the bare list is
// short, explicit and enforced by app/__tests__/shell-coverage.test.ts.
//
// ONE LAYOUT, not one per segment — measured, and the first attempt was thrown
// away for it: sibling layouts are sibling React trees, so navigating between
// them replaced the <aside> with a different DOM node (`railSameNode: false`,
// 3 detach events at 4x CPU throttle). A fresh node remounts
// <ShellAccountNav/>, its `mounted` guard resets, and a signed-in reader's
// account rows repaint as skeletons for a frame. One layout, one mount, only
// the content pane swaps.
//
// WHY NOT app/layout.tsx ITSELF, which is what "mulai dari root" would mean
// literally: the root also parents /k/<slug>, whose rail is community-aware.
// A shell there would nest a second rail inside the community's own, since a
// child layout in the App Router nests rather than overrides. The framework
// answer is a parallel `@rail` slot at the root; the cheap answer is this group
// plus a test that fails when a route escapes it. The test is what actually
// prevents the regression, so that is what we bought.
//
// The group name never appears in a URL.
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
